import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { TokenPayload } from "@/application/ports";

type RouteContext = { params: Promise<Record<string, string>> };

type AuthenticatedHandler = (
  request: NextRequest,
  context: RouteContext & { session: TokenPayload }
) => Promise<NextResponse>;

/**
 * Middleware que exige autenticação. Injeta `session` no context.
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: RouteContext) => {
    const session = await container.sessionService.get();
    if (!session) {
      return NextResponse.json(
        { error: "Não autenticado", requireLogin: true },
        { status: 401 }
      );
    }
    return handler(request, { ...context, session });
  };
}

type VerifiedHandler = (
  request: NextRequest,
  context: RouteContext & { session: TokenPayload }
) => Promise<NextResponse>;

/**
 * Middleware que exige autenticação + verificação de identidade.
 */
export function withVerified(handler: VerifiedHandler) {
  return withAuth(async (request, context) => {
    if (context.session.verificationStatus !== "verified") {
      return NextResponse.json(
        { error: "Verifique sua identidade para realizar esta ação", requireVerification: true },
        { status: 403 }
      );
    }
    return handler(request, context);
  });
}
