import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { ValidationError } from "@/domain/errors";
import { Phone } from "@/domain/value-objects/phone-password";

export const GET = withAuth(async (_request, { session }) => {
  try {
    const user = await container.userRepo.findById(session.userId);
    if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    return NextResponse.json({
      user: {
        ...user,
        passwordHash: undefined,
        cardToken: undefined,
        cpfMasked: user.cpf ? `***.${user.cpf.slice(3, 6)}.${user.cpf.slice(6, 9)}-**` : null,
        hasCard: !!(user.cardLast4 && user.cardBrand),
      },
    });
  } catch (error) {
    return handleError(error);
  }
});

export const PATCH = withAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;
    const updateData: Record<string, string> = {};

    if (name !== undefined) {
      if (!name.trim() || name.trim().length < 3) {
        throw new ValidationError("Nome deve ter pelo menos 3 caracteres");
      }
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      if (phone && !Phone.isValid(phone)) {
        throw new ValidationError("Telefone inválido");
      }
      updateData.phone = phone ? phone.replace(/\D/g, "") : "";
    }

    if (newPassword) {
      if (!currentPassword) throw new ValidationError("Informe a senha atual");
      const user = await container.userRepo.findById(session.userId);
      if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
      const isValid = await container.hasher.compare(currentPassword, user.passwordHash);
      if (!isValid) throw new ValidationError("Senha atual incorreta");
      if (newPassword.length < 8) throw new ValidationError("Nova senha deve ter pelo menos 8 caracteres");
      updateData.passwordHash = await container.hasher.hash(newPassword);
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("Nenhum dado para atualizar");
    }

    await container.userRepo.update(session.userId, updateData);
    return NextResponse.json({ message: "Dados atualizados com sucesso" });
  } catch (error) {
    return handleError(error);
  }
});
