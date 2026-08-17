import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * POST - Finalizar venda (vendedor aceita oferta → cria Sale → libera contatos)
 * Chamado automaticamente quando vendedor aceita uma oferta via PATCH /bids
 * Também pode ser chamado diretamente.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: vehicleId } = await params;
  const body = await request.json();
  const { bidId } = body;

  if (!bidId) {
    return NextResponse.json({ error: "bidId obrigatório" }, { status: 400 });
  }

  // Verificar veículo e que o usuário é o vendedor
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { seller: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  if (vehicle.sellerId !== session.userId) {
    return NextResponse.json({ error: "Apenas o vendedor pode finalizar a venda" }, { status: 403 });
  }

  // Verificar se já existe uma venda
  const existingSale = await prisma.sale.findUnique({
    where: { vehicleId },
  });

  if (existingSale) {
    return NextResponse.json({ error: "Venda já foi finalizada" }, { status: 400 });
  }

  // Buscar a bid aceita
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { bidder: true },
  });

  if (!bid || bid.vehicleId !== vehicleId) {
    return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
  }

  // Aceitar a bid se ainda não foi aceita
  if (bid.status !== "accepted") {
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "accepted" },
    });

    // Rejeitar todas as outras
    await prisma.bid.updateMany({
      where: { vehicleId, id: { not: bidId } },
      data: { status: "rejected" },
    });
  }

  // Marcar veículo como vendido
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: "sold" },
  });

  // Criar registro de Sale com snapshot dos contatos
  const sale = await prisma.sale.create({
    data: {
      vehicleId,
      bidId,
      buyerId: bid.bidderId,
      sellerId: vehicle.sellerId,
      salePrice: bid.amount,
      platformFee: bid.platformFee,
      paymentMethod: bid.paymentMethod,
      // Snapshot dos contatos (liberados neste momento)
      buyerEmail: bid.bidder.email,
      buyerPhone: bid.bidder.phone,
      buyerCpf: bid.bidder.cpf,
      sellerEmail: vehicle.seller.email,
      sellerPhone: vehicle.seller.phone,
      sellerCpf: vehicle.seller.cpf,
    },
  });

  return NextResponse.json({
    message: "Venda finalizada com sucesso! Os contatos foram liberados.",
    saleId: sale.id,
    redirectTo: `/venda/${sale.id}`,
  });
}

/**
 * GET - Buscar dados da venda (só comprador e vendedor podem ver)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: vehicleId } = await params;

  const sale = await prisma.sale.findUnique({
    where: { vehicleId },
    include: {
      vehicle: { select: { title: true, brand: true, model: true, year: true } },
      bid: { select: { paymentMethod: true, tradeVehicle: true, message: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  });

  if (!sale) {
    return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
  }

  // Só comprador e vendedor podem ver
  if (session.userId !== sale.buyerId && session.userId !== sale.sellerId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json({ sale });
}
