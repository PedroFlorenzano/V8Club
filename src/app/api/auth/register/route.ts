import { NextRequest, NextResponse } from "next/server";
import { RegisterInputSchema } from "@/application/dtos";
import { container } from "@/infrastructure/container";
import { handleError } from "@/presentation/middleware/error-handler";
import { ConflictError, ValidationError } from "@/domain/errors";
import { CPF } from "@/domain/value-objects/cpf";
import { Phone, Password } from "@/domain/value-objects/phone-password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = RegisterInputSchema.parse(body);

    // Validar senha forte
    const passwordCheck = Password.validate(input.password);
    if (!passwordCheck.valid) {
      throw new ValidationError(`Senha fraca: ${passwordCheck.errors.join(", ")}`);
    }

    // Validar CPF
    if (input.cpf && !CPF.isValid(input.cpf)) {
      throw new ValidationError("CPF inválido");
    }

    // Validar telefone
    if (input.phone && !Phone.isValid(input.phone)) {
      throw new ValidationError("Telefone inválido. Use formato (XX) XXXXX-XXXX");
    }

    // Verificar duplicidade de email
    const existingUser = await container.userRepo.findByEmail(input.email.toLowerCase().trim());
    if (existingUser) throw new ConflictError("Email já cadastrado");

    // Verificar duplicidade de CPF
    if (input.cpf) {
      const cleanCpf = input.cpf.replace(/\D/g, "");
      const existingCpf = await container.userRepo.findByCpf(cleanCpf);
      if (existingCpf) throw new ConflictError("CPF já cadastrado");
    }

    // Criar usuário
    const passwordHash = await container.hasher.hash(input.password);
    const user = await container.userRepo.create({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      passwordHash,
      role: "user",
      cpf: input.cpf ? input.cpf.replace(/\D/g, "") : null,
      phone: input.phone ? input.phone.replace(/\D/g, "") : null,
      verificationStatus: input.cpf ? "pending_docs" : "unverified",
      verificationNote: null,
      verifiedAt: null,
      docFrontUrl: null,
      docBackUrl: null,
      selfieUrl: null,
      cardBrand: null,
      cardLast4: null,
      cardType: null,
      cardExpiry: null,
      cardHolderName: null,
      cardToken: null,
    });

    // Gerar token e setar cookie
    const token = container.tokenService.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });
    await container.sessionService.set(token);

    return NextResponse.json({
      message: "Conta criada com sucesso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        cpf: user.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : null,
      },
      token,
    });
  } catch (error) {
    return handleError(error);
  }
}
