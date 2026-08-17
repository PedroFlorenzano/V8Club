import { NextRequest, NextResponse } from "next/server";
import { CreateBidInputSchema, BidActionInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { withVerified, withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";

/**
 * POST - Criar nova oferta (requer verificação)
 */
export const POST = withVerified(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;
    const body = await request.json();
    const input = CreateBidInputSchema.parse(body);

    const result = await container.createBid.execute({
      ...input,
      vehicleId,
      bidderId: session.userId,
      verificationStatus: session.verificationStatus,
    });

    return NextResponse.json({
      ...result.bid,
      platformFeeFormatted: `R$ ${(result.platformFee / 100).toLocaleString("pt-BR")}`,
      totalWithFee: result.bid.amount + result.platformFee,
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
});

/**
 * PATCH - Aceitar/rejeitar oferta (vendedor)
 */
export const PATCH = withAuth(async (request, { params, session }) => {
  try {
    const { id: vehicleId } = await params;
    const body = await request.json();
    const input = BidActionInputSchema.parse(body);

    const result = await container.processBidAction.execute({
      ...input,
      vehicleId,
      sellerId: session.userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
});
