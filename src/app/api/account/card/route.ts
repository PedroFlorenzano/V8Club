import { NextResponse } from "next/server";
import { LinkCardInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { CardNumber } from "@/domain/value-objects/card-number";
import { ValidationError, ExpiredCardError } from "@/domain/errors";

export const POST = withAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const input = LinkCardInputSchema.parse(body);

    // Validar número (Luhn + detectar bandeira)
    const card = CardNumber.create(input.cardNumber);

    // Validar expiração
    const [month, year] = input.cardExpiry.split("/").map(Number);
    if (month < 1 || month > 12) throw new ValidationError("Mês de validade inválido");
    const expYear = year + 2000;
    const now = new Date();
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && month < now.getMonth() + 1)) {
      throw new ExpiredCardError();
    }

    // Tokenizar via gateway
    const token = await container.paymentGateway.tokenize({
      number: input.cardNumber,
      expiry: input.cardExpiry,
      holder: input.cardHolderName,
    });

    // Salvar
    await container.userRepo.update(session.userId, {
      cardBrand: card.brand,
      cardLast4: card.last4,
      cardType: input.cardType,
      cardExpiry: input.cardExpiry,
      cardHolderName: input.cardHolderName.trim().toUpperCase(),
      cardToken: token,
    } as Record<string, string>);

    return NextResponse.json({
      message: "Cartão vinculado com sucesso",
      card: { brand: card.brand, last4: card.last4, type: input.cardType, expiry: input.cardExpiry },
    });
  } catch (error) {
    return handleError(error);
  }
});

export const DELETE = withAuth(async (_request, { session }) => {
  try {
    await container.userRepo.update(session.userId, {
      cardBrand: null,
      cardLast4: null,
      cardType: null,
      cardExpiry: null,
      cardHolderName: null,
      cardToken: null,
    } as Record<string, null>);
    return NextResponse.json({ message: "Cartão removido" });
  } catch (error) {
    return handleError(error);
  }
});
