import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { curateVehicle } from "@/lib/curation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brand,
      model,
      year,
      version,
      color,
      mileage,
      fuel,
      transmission,
      title,
      description,
      highlights,
      reservePrice,
      startingBid,
      sellerId,
    } = body;

    // Validação básica
    if (!brand || !model || !year || !title || !description || !sellerId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: brand, model, year, title, description, sellerId" },
        { status: 400 }
      );
    }

    // Rodar curadoria com IA
    const curationResult = await curateVehicle({
      brand,
      model,
      year,
      version,
      mileage: mileage || 0,
      transmission: transmission || "Manual",
      color: color || "",
      description,
      highlights,
    });

    // Criar veículo no banco
    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        year,
        version,
        color: color || "",
        mileage: mileage || 0,
        fuel: fuel || "Gasolina",
        transmission: transmission || "Manual",
        title,
        description,
        highlights,
        reservePrice: reservePrice || null,
        startingBid: startingBid || 0,
        fipePrice: curationResult.fipePrice || null,
        aiScore: curationResult.score,
        aiAnalysis: JSON.stringify(curationResult),
        aiApproved: curationResult.approved,
        status: curationResult.approved ? "approved" : "rejected",
        // Se aprovado, iniciar período de ofertas de 7 dias
        auctionStart: curationResult.approved ? new Date() : null,
        auctionEnd: curationResult.approved
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : null,
        sellerId,
      },
    });

    return NextResponse.json({
      vehicle,
      curation: curationResult,
    });
  } catch (error) {
    console.error("Erro ao submeter veículo:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar submissão" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Filtros
  const status = searchParams.get("status") || "approved";
  const yearMin = searchParams.get("yearMin");
  const yearMax = searchParams.get("yearMax");
  const transmission = searchParams.get("transmission");
  const fuel = searchParams.get("fuel");

  // Construir where dinamicamente
  const where: Record<string, unknown> = {};

  // Status
  if (status === "all") {
    where.status = { in: ["approved", "active", "sold"] };
  } else if (status === "active") {
    where.status = { in: ["approved", "active"] };
  } else {
    where.status = status;
  }

  // Ano
  if (yearMin || yearMax) {
    where.year = {};
    if (yearMin) (where.year as Record<string, number>).gte = parseInt(yearMin);
    if (yearMax) (where.year as Record<string, number>).lte = parseInt(yearMax);
  }

  // Câmbio
  if (transmission && transmission !== "all") {
    where.transmission = transmission;
  }

  // Combustível
  if (fuel && fuel !== "all") {
    where.fuel = fuel;
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true } },
      images: { orderBy: { order: "asc" } },
      bids: { orderBy: { amount: "desc" }, take: 1 },
      _count: { select: { bids: true, comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(vehicles);
}
