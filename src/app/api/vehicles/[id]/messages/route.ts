import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET - Listar mensagens do chat (entre usuário logado e vendedor, no contexto do veículo)
 * Vendedor vê todas as conversas. Comprador vê só a dele com o vendedor.
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

  // Verificar se veículo existe
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { sellerId: true, status: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  const isSeller = session.userId === vehicle.sellerId;

  let messages;

  if (isSeller) {
    // Vendedor vê todas as mensagens recebidas e enviadas para este veículo
    messages = await prisma.message.findMany({
      where: { vehicleId },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  } else {
    // Comprador vê só suas mensagens com o vendedor
    messages = await prisma.message.findMany({
      where: {
        vehicleId,
        OR: [
          { senderId: session.userId, receiverId: vehicle.sellerId },
          { senderId: vehicle.sellerId, receiverId: session.userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Marcar mensagens recebidas como lidas
    await prisma.message.updateMany({
      where: {
        vehicleId,
        receiverId: session.userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender.name,
      receiverId: m.receiverId,
      receiverName: m.receiver.name,
      isOwn: m.senderId === session.userId,
      readAt: m.readAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
    })),
    isSeller,
  });
}

/**
 * POST - Enviar mensagem (requer autenticação + verificação)
 * Comprador envia para vendedor. Vendedor envia para comprador específico.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado", requireLogin: true }, { status: 401 });
  }

  if (session.verificationStatus !== "verified") {
    return NextResponse.json(
      { error: "Verifique sua identidade para enviar mensagens", requireVerification: true },
      { status: 403 }
    );
  }

  const { id: vehicleId } = await params;
  const body = await request.json();
  const { content, receiverId } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Mensagem não pode ser vazia" }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Mensagem muito longa (máx 1000 caracteres)" }, { status: 400 });
  }

  // Bloquear envio de dados de contato
  const contactPatterns = [
    /\b\d{2}[\s.-]?\d{4,5}[\s.-]?\d{4}\b/, // telefone
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // email
    /whatsapp|whats|zap|wpp|telegram/i, // menções a mensageiros
    /instagram|insta|ig:|@\w+/i, // redes sociais
  ];

  for (const pattern of contactPatterns) {
    if (pattern.test(content)) {
      return NextResponse.json(
        { error: "Não é permitido compartilhar dados de contato nas mensagens. Os dados serão liberados após a venda ser concluída." },
        { status: 400 }
      );
    }
  }

  // Verificar veículo
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { sellerId: true, status: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
  }

  if (vehicle.status === "sold") {
    return NextResponse.json({ error: "Este veículo já foi vendido" }, { status: 400 });
  }

  const isSeller = session.userId === vehicle.sellerId;

  // Determinar destinatário
  let finalReceiverId: string;

  if (isSeller) {
    // Vendedor responde para um comprador específico
    if (!receiverId) {
      return NextResponse.json({ error: "Indique para qual comprador deseja responder" }, { status: 400 });
    }
    finalReceiverId = receiverId;
  } else {
    // Comprador envia para o vendedor
    finalReceiverId = vehicle.sellerId;
  }

  // Não pode enviar mensagem para si mesmo
  if (session.userId === finalReceiverId) {
    return NextResponse.json({ error: "Não pode enviar mensagem para si mesmo" }, { status: 400 });
  }

  // Criar mensagem
  const message = await prisma.message.create({
    data: {
      content: content.trim(),
      senderId: session.userId,
      receiverId: finalReceiverId,
      vehicleId,
    },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    message: {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      receiverId: message.receiverId,
      isOwn: true,
      createdAt: message.createdAt.toISOString(),
    },
  });
}
