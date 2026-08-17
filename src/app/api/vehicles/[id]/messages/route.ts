import { NextRequest, NextResponse } from "next/server";
import { SendMessageInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withAuth, withVerified } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { ContentModerationService } from "@/domain/services";
import { ValidationError } from "@/domain/errors";

/**
 * GET - Listar mensagens do chat
 */
export const GET = withAuth(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;
    const vehicle = await container.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    }

    const isSeller = session.userId === vehicle.sellerId;
    let messages;

    if (isSeller) {
      messages = await container.messageRepo.findByVehicle(vehicleId);
    } else {
      messages = await container.messageRepo.findByVehicleAndUsers(
        vehicleId,
        session.userId,
        vehicle.sellerId
      );
      await container.messageRepo.markAsRead(vehicleId, session.userId);
    }

    return NextResponse.json({
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.senderId,
        receiverId: m.receiverId,
        isOwn: m.senderId === session.userId,
        readAt: m.readAt?.toISOString() || null,
        createdAt: m.createdAt.toISOString(),
      })),
      isSeller,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * POST - Enviar mensagem (requer verificação)
 */
export const POST = withVerified(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;
    const body = await request.json();
    const { content, receiverId } = SendMessageInputSchema.parse(body);

    // Moderação de conteúdo
    const moderation = ContentModerationService.check(content);
    if (!moderation.allowed) {
      throw new ValidationError(
        "Não é permitido compartilhar dados de contato nas mensagens. Os dados serão liberados após a venda ser concluída."
      );
    }

    // Determinar destinatário
    const vehicle = await container.vehicleRepo.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    }

    if (vehicle.status === "sold") {
      throw new ValidationError("Este veículo já foi vendido");
    }

    const isSeller = session.userId === vehicle.sellerId;
    const finalReceiverId = isSeller ? receiverId : vehicle.sellerId;

    if (!finalReceiverId) {
      throw new ValidationError("Indique para qual comprador deseja responder");
    }
    if (session.userId === finalReceiverId) {
      throw new ValidationError("Não pode enviar mensagem para si mesmo");
    }

    const message = await container.messageRepo.create({
      content: content.trim(),
      senderId: session.userId,
      receiverId: finalReceiverId,
      vehicleId,
    });

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        isOwn: true,
        createdAt: message.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
