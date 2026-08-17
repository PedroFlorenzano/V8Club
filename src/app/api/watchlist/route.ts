import { NextRequest, NextResponse } from "next/server";
import { AddToWatchlistInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { NotFoundError, ConflictError } from "@/domain/errors";

/**
 * GET - Listar veículos na watchlist
 */
export const GET = withAuth(async (_request, { session }) => {
  try {
    const items = await container.watchlistRepo.findByUserId(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * POST - Adicionar à watchlist
 */
export const POST = withAuth(async (request, { session }) => {
  try {
    const body = await request.json();
    const { vehicleId } = AddToWatchlistInputSchema.parse(body);

    const vehicle = await container.vehicleRepo.findById(vehicleId);
    if (!vehicle) throw new NotFoundError("Veículo não encontrado");

    const exists = await container.watchlistRepo.exists(session.userId, vehicleId);
    if (exists) throw new ConflictError("Já está na sua lista");

    await container.watchlistRepo.add(session.userId, vehicleId);
    return NextResponse.json({ message: "Adicionado à lista de observação" });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * DELETE - Remover da watchlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await container.sessionService.get();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");
    if (!vehicleId) {
      return NextResponse.json({ error: "vehicleId obrigatório" }, { status: 400 });
    }

    await container.watchlistRepo.remove(session.userId, vehicleId);
    return NextResponse.json({ message: "Removido da lista de observação" });
  } catch (error) {
    return handleError(error);
  }
}
