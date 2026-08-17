import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar usuários pendentes de verificação
export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: {
      verificationStatus: { in: ["pending_review", "pending_docs", "pending_selfie"] },
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      phone: true,
      verificationStatus: true,
      docFrontUrl: true,
      docBackUrl: true,
      selfieUrl: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Também listar os já processados recentemente
  const recentProcessed = await prisma.user.findMany({
    where: {
      verificationStatus: { in: ["verified", "rejected"] },
      verifiedAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      verificationStatus: true,
      verifiedAt: true,
      verificationNote: true,
    },
    orderBy: { verifiedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ pending: users, recent: recentProcessed });
}

// PATCH - Aprovar ou rejeitar um usuário
export async function PATCH(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, action, note } = body;

  if (!userId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationNote: note || null,
      },
    });
    return NextResponse.json({ message: `${user.name} foi verificado com sucesso` });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationStatus: "rejected",
        verifiedAt: new Date(),
        verificationNote: note || "Documento ilegível ou incompatível",
      },
    });
    return NextResponse.json({ message: `Verificação de ${user.name} foi rejeitada` });
  }
}
