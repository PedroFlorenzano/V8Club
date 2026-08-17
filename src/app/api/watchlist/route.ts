import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET - Listar veículos na watchlist do usuário
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const watchlist = await prisma.watchlist.findMany({
    where: { userId: session.userId },
    include: {
      vehicle: {
        include: {
          images: { where: { isCover: true }, take: 1 },
          bids: { orderBy: { amount: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: watchlist.map((w) => ({
      id: w.id,
      vehicleId: w.vehicle.id,
      title: w.vehicle.title,
      brand: w.vehicle.brand,
      model: w.vehicle.model,
      year: w.vehicle.year,
      status: w.vehicle.status,
      imageUrl: w.vehicle.images[0]?.url || null,
      highBid: w.vehicle.bids[0]?.amount || w.vehicle.startingBid,
      auctionEnd: w.vehicle.auctionEnd?.toISOString() || null,
      addedAt: w.createdAt.toISOString(),
    })),
  });
}

/**
 * POST - Adicionar veículo à watchlist
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado", requireLogin: true }, { status: 401 });
  }

  const body = await request.json();
  const { vehicleId } = body;

  if (!vehicleId) {
    return NextResponse.json({ error: "vehicleId obrigatório" }, { status: 400 });
  }

  // Verificar se o veículo existe
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  // Verificar se já está na watchlist
  const existing = await prisma.watchlist.findUnique({
    where: { userId_vehicleId: { userId: session.userId, vehicleId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Já está na sua lista" }, { status: 409 });
  }

  await prisma.watchlist.create({
    data: { userId: session.userId, vehicleId },
  });

  return NextResponse.json({ message: "Adicionado à lista de observação" });
}

/**
 * DELETE - Remover veículo da watchlist
 */
export async function DELETE(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  if (!vehicleId) {
    return NextResponse.json({ error: "vehicleId obrigatório" }, { status: 400 });
  }

  await prisma.watchlist.deleteMany({
    where: { userId: session.userId, vehicleId },
  });

  return NextResponse.json({ message: "Removido da lista de observação" });
}
