import { NextResponse } from "next/server";
import { FinalizeInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";

/**
 * POST - Finalizar venda (vendedor aceita → cria Sale → libera contatos)
 */
export const POST = withAuth(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;
    const body = await request.json();
    const { bidId } = FinalizeInputSchema.parse(body);

    const sale = await container.finalizeSale.execute({
      vehicleId,
      bidId,
      sellerId: session.userId,
    });

    return NextResponse.json({
      message: "Venda finalizada com sucesso! Os contatos foram liberados.",
      saleId: sale.id,
      redirectTo: `/venda/${sale.id}`,
    });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * GET - Buscar dados da venda (só comprador e vendedor podem ver)
 */
export const GET = withAuth(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;

    const sale = await container.saleRepo.findByVehicleId(vehicleId);
    if (!sale) {
      return NextResponse.json({ error: "Venda não encontrada" }, { status: 404 });
    }

    if (session.userId !== sale.buyerId && session.userId !== sale.sellerId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    return NextResponse.json({ sale });
  } catch (error) {
    return handleError(error);
  }
});
