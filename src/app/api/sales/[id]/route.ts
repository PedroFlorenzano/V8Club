import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: saleId } = await params;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
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
  if (session.userId !== sale.buyerId && session.userId !== sale.sellerId && session.role !== "admin") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json({ sale });
}
