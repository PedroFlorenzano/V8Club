import { NextResponse } from "next/server";
import { DomainError } from "@/domain/errors";
import { ZodError } from "zod";

/**
 * Tratamento centralizado de erros - converte DomainError e ZodError em respostas HTTP
 */
export function handleError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
}
