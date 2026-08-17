import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, validatePhone, hashPassword, verifyPassword } from "@/lib/auth";

/**
 * GET - Retorna perfil completo do usuário logado
 */
export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cpf: true,
      phone: true,
      verificationStatus: true,
      verifiedAt: true,
      cardBrand: true,
      cardLast4: true,
      cardType: true,
      cardExpiry: true,
      cardHolderName: true,
      createdAt: true,
      _count: { select: { vehicles: true, bids: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      ...user,
      cpfMasked: user.cpf ? `***.${user.cpf.slice(3, 6)}.${user.cpf.slice(6, 9)}-**` : null,
      hasCard: !!(user.cardLast4 && user.cardBrand),
    },
  });
}

/**
 * PATCH - Atualizar dados pessoais (nome, telefone, trocar senha)
 */
export async function PATCH(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, currentPassword, newPassword } = body;

  const updateData: Record<string, string> = {};

  // Atualizar nome
  if (name !== undefined) {
    if (!name.trim() || name.trim().length < 3) {
      return NextResponse.json({ error: "Nome deve ter pelo menos 3 caracteres" }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  // Atualizar telefone
  if (phone !== undefined) {
    if (phone && !validatePhone(phone)) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }
    updateData.phone = phone ? phone.replace(/\D/g, "") : "";
  }

  // Trocar senha
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Informe a senha atual" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 8 caracteres" }, { status: 400 });
    }
    updateData.passwordHash = await hashPassword(newPassword);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
  });

  return NextResponse.json({ message: "Dados atualizados com sucesso" });
}
