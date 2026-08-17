import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Calcula taxa da plataforma: 5% do valor, cap em R$ 5.000 (500000 centavos)
 */
function calculatePlatformFee(amount: number): number {
  const fee = Math.round(amount * 0.05);
  const cap = 500000; // R$ 5.000 em centavos
  return Math.min(fee, cap);
}

/**
 * POST - Criar nova oferta (requer autenticação + verificação)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verificar autenticação
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json(
      { error: "Você precisa estar logado para fazer ofertas", requireLogin: true },
      { status: 401 }
    );
  }

  // Verificar se o usuário está verificado
  if (session.verificationStatus !== "verified") {
    return NextResponse.json(
      { error: "Você precisa verificar sua identidade antes de fazer ofertas", requireVerification: true },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { amount, paymentMethod, message, tradeVehicle } = body;

  if (!amount || !paymentMethod) {
    return NextResponse.json(
      { error: "Campos obrigatórios: amount, paymentMethod" },
      { status: 400 }
    );
  }

  // Validar forma de pagamento
  const validMethods = ["pix", "financiamento", "consorcio", "troca", "boleto"];
  if (!validMethods.includes(paymentMethod)) {
    return NextResponse.json(
      { error: `Forma de pagamento inválida. Opções: ${validMethods.join(", ")}` },
      { status: 400 }
    );
  }

  // Se for troca, exigir descrição do veículo de troca
  if (paymentMethod === "troca" && !tradeVehicle) {
    return NextResponse.json(
      { error: "Para ofertas com troca, descreva o veículo oferecido" },
      { status: 400 }
    );
  }

  // Verificar se o veículo existe e está ativo
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  if (vehicle.status !== "approved" && vehicle.status !== "active") {
    return NextResponse.json({ error: "Período de ofertas não está ativo" }, { status: 400 });
  }

  // Verificar se o período de ofertas não expirou
  if (vehicle.auctionEnd && new Date(vehicle.auctionEnd) < new Date()) {
    return NextResponse.json({ error: "Período de ofertas encerrado" }, { status: 400 });
  }

  // Verificar se o vendedor não está dando oferta no próprio carro
  if (vehicle.sellerId === session.userId) {
    return NextResponse.json(
      { error: "Vendedor não pode fazer oferta no próprio veículo" },
      { status: 400 }
    );
  }

  // Calcular taxa da plataforma
  const platformFee = calculatePlatformFee(amount);

  // Criar oferta
  const bid = await prisma.bid.create({
    data: {
      amount,
      paymentMethod,
      message: message || null,
      tradeVehicle: tradeVehicle || null,
      platformFee,
      termsAccepted: true,
      status: "pending",
      vehicleId: id,
      bidderId: session.userId,
    },
    include: { bidder: { select: { id: true, name: true } } },
  });

  // Atualizar status para "active" se for a primeira oferta
  if (vehicle.status === "approved") {
    await prisma.vehicle.update({
      where: { id },
      data: { status: "active" },
    });
  }

  return NextResponse.json({
    ...bid,
    platformFeeFormatted: `R$ ${(platformFee / 100).toLocaleString("pt-BR")}`,
    totalWithFee: amount + platformFee,
  });
}

/**
 * PATCH - Vendedor aceita ou rejeita uma oferta
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { bidId, action, sellerId } = body;

  if (!bidId || !action || !sellerId) {
    return NextResponse.json(
      { error: "Campos obrigatórios: bidId, action (accept/reject), sellerId" },
      { status: 400 }
    );
  }

  if (action !== "accept" && action !== "reject") {
    return NextResponse.json(
      { error: "Action deve ser 'accept' ou 'reject'" },
      { status: 400 }
    );
  }

  // Verificar se o veículo pertence ao vendedor
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle || vehicle.sellerId !== sellerId) {
    return NextResponse.json(
      { error: "Apenas o vendedor pode aceitar/rejeitar ofertas" },
      { status: 403 }
    );
  }

  // Verificar se a oferta existe e está pendente
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.vehicleId !== id) {
    return NextResponse.json({ error: "Oferta não encontrada" }, { status: 404 });
  }
  if (bid.status !== "pending") {
    return NextResponse.json({ error: "Oferta já foi processada" }, { status: 400 });
  }

  if (action === "accept") {
    // Aceitar esta oferta
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "accepted" },
    });

    // Rejeitar todas as outras ofertas pendentes
    await prisma.bid.updateMany({
      where: {
        vehicleId: id,
        id: { not: bidId },
        status: "pending",
      },
      data: { status: "rejected" },
    });

    // Marcar veículo como vendido
    await prisma.vehicle.update({
      where: { id },
      data: { status: "sold" },
    });

    return NextResponse.json({ message: "Oferta aceita! Veículo vendido.", bidId });
  } else {
    // Rejeitar esta oferta específica
    await prisma.bid.update({
      where: { id: bidId },
      data: { status: "rejected" },
    });

    return NextResponse.json({ message: "Oferta rejeitada.", bidId });
  }
}
