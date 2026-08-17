import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { prisma } from "@/infrastructure/database/prisma";

export const GET = withAuth(async (_request, { params, session }) => {
  try {
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

    if (session.userId !== sale.buyerId && session.userId !== sale.sellerId && session.role !== "admin") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    return handleError(error);
  }
});
