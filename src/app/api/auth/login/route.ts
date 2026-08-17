import { NextRequest, NextResponse } from "next/server";
import { LoginInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { handleError } from "@/presentation/middleware/error-handler";
import { UnauthorizedError } from "@/domain/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = LoginInputSchema.parse(body);

    const user = await container.userRepo.findByEmail(input.email.toLowerCase().trim());
    if (!user) throw new UnauthorizedError("Email ou senha incorretos");

    const isValid = await container.hasher.compare(input.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedError("Email ou senha incorretos");

    const token = container.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });
    await container.sessionService.set(token);

    return NextResponse.json({
      message: "Login realizado com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        cpf: user.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : null,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    return handleError(error);
  }
}
