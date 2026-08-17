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
  const status = searchParams.get("status") || "approved";

  const vehicles = await prisma.vehicle.findMany({
    where: { status: status === "all" ? undefined : status },
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
