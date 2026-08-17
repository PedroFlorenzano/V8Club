import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  generateToken,
  setAuthCookie,
  validateCPF,
  validatePassword,
  validatePhone,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, cpf, phone } = body;

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Validar senha forte
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: "Senha fraca", details: passwordCheck.errors },
        { status: 400 }
      );
    }

    // Validar CPF (se fornecido)
    if (cpf) {
      if (!validateCPF(cpf)) {
        return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
      }
      // Verificar se CPF já está em uso
      const existingCPF = await prisma.user.findFirst({
        where: { cpf: cpf.replace(/\D/g, "") },
      });
      if (existingCPF) {
        return NextResponse.json(
          { error: "CPF já cadastrado" },
          { status: 409 }
        );
      }
    }

    // Validar telefone (se fornecido)
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: "Telefone inválido. Use formato (XX) XXXXX-XXXX" },
        { status: 400 }
      );
    }

    // Verificar email duplicado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 409 }
      );
    }

    // Criar usuário
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        cpf: cpf ? cpf.replace(/\D/g, "") : null,
        phone: phone ? phone.replace(/\D/g, "") : null,
        verificationStatus: cpf ? "pending_docs" : "unverified",
      },
    });

    // Gerar token e setar cookie
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    });

    await setAuthCookie(token);

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
      token, // Também retornar para clientes que preferem localStorage
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
