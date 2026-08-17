import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { ForbiddenError, NotFoundError, ValidationError } from "@/domain/errors";
import { prisma } from "@/infrastructure/database/prisma";

export const GET = withAuth(async (_request, { session }) => {
  try {
    if (session.role !== "admin") throw new ForbiddenError("Acesso negado");

    const pending = await prisma.user.findMany({
      where: { verificationStatus: { in: ["pending_review", "pending_docs", "pending_selfie"] } },
      select: {
        id: true, name: true, email: true, cpf: true, phone: true,
        verificationStatus: true, docFrontUrl: true, docBackUrl: true,
        selfieUrl: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const recent = await prisma.user.findMany({
      where: { verificationStatus: { in: ["verified", "rejected"] }, verifiedAt: { not: null } },
      select: {
        id: true, name: true, email: true, cpf: true,
        verificationStatus: true, verifiedAt: true, verificationNote: true,
      },
      orderBy: { verifiedAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ pending, recent });
  } catch (error) {
    return handleError(error);
  }
});

export const PATCH = withAuth(async (request, { session }) => {
  try {
    if (session.role !== "admin") throw new ForbiddenError("Acesso negado");

    const body = await request.json();
    const { userId, action, note } = body;

    if (!userId || !["approve", "reject"].includes(action)) {
      throw new ValidationError("Dados inválidos");
    }

    const user = await container.userRepo.findById(userId);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    if (action === "approve") {
      await container.userRepo.update(userId, {
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationNote: note || null,
      } as Record<string, unknown>);
      return NextResponse.json({ message: `${user.name} foi verificado com sucesso` });
    } else {
      await container.userRepo.update(userId, {
        verificationStatus: "rejected",
        verifiedAt: new Date(),
        verificationNote: note || "Documento ilegível ou incompatível",
      } as Record<string, unknown>);
      return NextResponse.json({ message: `Verificação de ${user.name} foi rejeitada` });
    }
  } catch (error) {
    return handleError(error);
  }
});
