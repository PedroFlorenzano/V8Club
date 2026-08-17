import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/**
 * Detectar bandeira do cartão pelo número
 */
function detectBrand(number: string): string {
  const n = number.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^6(?:011|5)/.test(n)) return "discover";
  if (/^3[47]/.test(n)) return "amex";
  if (/^(606282|3841|637)/.test(n)) return "hipercard";
  if (/^(636368|636297|504175|438935|451416|509048|509067|509049|431274|438935|451416|636297)/.test(n)) return "elo";
  return "outro";
}

/**
 * Validar número de cartão (algoritmo de Luhn)
 */
function validateCardNumber(number: string): boolean {
  const n = number.replace(/\D/g, "");
  if (n.length < 13 || n.length > 19) return false;
  
  let sum = 0;
  let isEven = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let digit = parseInt(n[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

/**
 * POST - Vincular cartão à conta
 */
export async function POST(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { cardNumber, cardExpiry, cardHolderName, cardType } = body;

  // Validações
  if (!cardNumber || !cardExpiry || !cardHolderName || !cardType) {
    return NextResponse.json(
      { error: "Todos os campos do cartão são obrigatórios" },
      { status: 400 }
    );
  }

  // Validar tipo
  if (!["credit", "debit"].includes(cardType)) {
    return NextResponse.json({ error: "Tipo de cartão inválido" }, { status: 400 });
  }

  // Limpar número
  const cleanNumber = cardNumber.replace(/\D/g, "");

  // Validar Luhn
  if (!validateCardNumber(cleanNumber)) {
    return NextResponse.json({ error: "Número de cartão inválido" }, { status: 400 });
  }

  // Validar expiração (MM/YY)
  const expiryMatch = cardExpiry.match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) {
    return NextResponse.json({ error: "Validade inválida. Use MM/AA" }, { status: 400 });
  }
  const [, month, year] = expiryMatch;
  const expMonth = parseInt(month);
  const expYear = parseInt(year) + 2000;
  if (expMonth < 1 || expMonth > 12) {
    return NextResponse.json({ error: "Mês de validade inválido" }, { status: 400 });
  }
  const now = new Date();
  if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
    return NextResponse.json({ error: "Cartão expirado" }, { status: 400 });
  }

  // Validar nome
  if (cardHolderName.trim().length < 3) {
    return NextResponse.json({ error: "Nome no cartão muito curto" }, { status: 400 });
  }

  // Detectar bandeira
  const brand = detectBrand(cleanNumber);

  // Gerar token simulado (em produção, isso viria do gateway: Stripe, Pagar.me, etc.)
  const token = `tok_${brand}_${cleanNumber.slice(-4)}_${Date.now()}`;

  // Salvar (apenas últimos 4 dígitos + token)
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      cardBrand: brand,
      cardLast4: cleanNumber.slice(-4),
      cardType,
      cardExpiry: `${month}/${year}`,
      cardHolderName: cardHolderName.trim().toUpperCase(),
      cardToken: token,
    },
  });

  return NextResponse.json({
    message: "Cartão vinculado com sucesso",
    card: {
      brand,
      last4: cleanNumber.slice(-4),
      type: cardType,
      expiry: `${month}/${year}`,
      holderName: cardHolderName.trim().toUpperCase(),
    },
  });
}

/**
 * DELETE - Remover cartão vinculado
 */
export async function DELETE() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      cardBrand: null,
      cardLast4: null,
      cardType: null,
      cardExpiry: null,
      cardHolderName: null,
      cardToken: null,
    },
  });

  return NextResponse.json({ message: "Cartão removido" });
}
