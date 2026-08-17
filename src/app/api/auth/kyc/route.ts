import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const docFront = formData.get("docFront") as File | null;
    const docBack = formData.get("docBack") as File | null;
    const selfie = formData.get("selfie") as File | null;

    // Determinar o que está sendo enviado
    const isDocUpload = docFront && docBack;
    const isSelfieUpload = selfie;

    if (!isDocUpload && !isSelfieUpload) {
      return NextResponse.json(
        { error: "Envie os documentos (frente + verso) ou a selfie" },
        { status: 400 }
      );
    }

    // Validar arquivos
    const filesToValidate = [docFront, docBack, selfie].filter(Boolean) as File[];
    for (const file of filesToValidate) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Formato inválido: ${file.name}. Use JPG, PNG ou WebP` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `Arquivo muito grande: ${file.name}. Máximo 10MB` },
          { status: 400 }
        );
      }
    }

    // Criar diretório de uploads
    const uploadDir = path.join(process.cwd(), "uploads", "kyc", session.userId);
    await mkdir(uploadDir, { recursive: true });

    const updateData: Record<string, string | null> = {};

    // Salvar documentos
    if (isDocUpload) {
      const frontExt = docFront.name.split(".").pop() || "jpg";
      const backExt = docBack.name.split(".").pop() || "jpg";
      
      const frontPath = path.join(uploadDir, `doc-front.${frontExt}`);
      const backPath = path.join(uploadDir, `doc-back.${backExt}`);
      
      const frontBuffer = Buffer.from(await docFront.arrayBuffer());
      const backBuffer = Buffer.from(await docBack.arrayBuffer());
      
      await writeFile(frontPath, frontBuffer);
      await writeFile(backPath, backBuffer);
      
      updateData.docFrontUrl = `/api/auth/kyc/file/${session.userId}/doc-front.${frontExt}`;
      updateData.docBackUrl = `/api/auth/kyc/file/${session.userId}/doc-back.${backExt}`;
    }

    // Salvar selfie
    if (isSelfieUpload) {
      const selfieExt = selfie.name.split(".").pop() || "jpg";
      const selfiePath = path.join(uploadDir, `selfie.${selfieExt}`);
      const selfieBuffer = Buffer.from(await selfie.arrayBuffer());
      await writeFile(selfiePath, selfieBuffer);
      updateData.selfieUrl = `/api/auth/kyc/file/${session.userId}/selfie.${selfieExt}`;
    }

    // Determinar novo status
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { docFrontUrl: true, docBackUrl: true, selfieUrl: true, verificationStatus: true },
    });

    let newStatus = currentUser?.verificationStatus || "unverified";
    
    const hasDoc = isDocUpload || (currentUser?.docFrontUrl && currentUser?.docBackUrl);
    const hasSelfie = isSelfieUpload || currentUser?.selfieUrl;
    
    if (hasDoc && hasSelfie) {
      newStatus = "pending_review";
    } else if (hasDoc) {
      newStatus = "pending_selfie";
    } else {
      newStatus = "pending_docs";
    }

    // Atualizar usuário
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...updateData,
        verificationStatus: newStatus,
      },
    });

    return NextResponse.json({
      message: isDocUpload ? "Documentos enviados com sucesso" : "Selfie enviada com sucesso",
      verificationStatus: newStatus,
      nextStep: newStatus === "pending_selfie"
        ? "Agora envie sua selfie para completar a verificação"
        : newStatus === "pending_review"
        ? "Seus documentos estão em análise. Você será notificado em breve."
        : "Continue enviando seus documentos",
    });
  } catch (error) {
    console.error("Erro no upload KYC:", error);
    return NextResponse.json(
      { error: "Erro ao processar upload" },
      { status: 500 }
    );
  }
}
