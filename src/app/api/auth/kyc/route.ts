import { NextRequest, NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";
import { ValidationError } from "@/domain/errors";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export const POST = withAuth(async (request, { session }) => {
  try {
    const formData = await request.formData();
    const docFront = formData.get("docFront") as File | null;
    const docBack = formData.get("docBack") as File | null;
    const selfie = formData.get("selfie") as File | null;

    const isDocUpload = docFront && docBack;
    const isSelfieUpload = !!selfie;

    if (!isDocUpload && !isSelfieUpload) {
      throw new ValidationError("Envie os documentos (frente + verso) ou a selfie");
    }

    // Validar arquivos
    const filesToValidate = [docFront, docBack, selfie].filter(Boolean) as File[];
    for (const file of filesToValidate) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new ValidationError(`Formato inválido: ${file.name}. Use JPG, PNG ou WebP`);
      }
      if (file.size > MAX_SIZE) {
        throw new ValidationError(`Arquivo muito grande: ${file.name}. Máximo 10MB`);
      }
    }

    // Criar diretório
    const uploadDir = path.join(process.cwd(), "uploads", "kyc", session.userId);
    await mkdir(uploadDir, { recursive: true });

    const updateData: Record<string, string | null> = {};

    if (isDocUpload) {
      const frontExt = docFront.name.split(".").pop() || "jpg";
      const backExt = docBack.name.split(".").pop() || "jpg";
      await writeFile(path.join(uploadDir, `doc-front.${frontExt}`), Buffer.from(await docFront.arrayBuffer()));
      await writeFile(path.join(uploadDir, `doc-back.${backExt}`), Buffer.from(await docBack.arrayBuffer()));
      updateData.docFrontUrl = `/api/auth/kyc/file/${session.userId}/doc-front.${frontExt}`;
      updateData.docBackUrl = `/api/auth/kyc/file/${session.userId}/doc-back.${backExt}`;
    }

    if (isSelfieUpload) {
      const selfieExt = selfie!.name.split(".").pop() || "jpg";
      await writeFile(path.join(uploadDir, `selfie.${selfieExt}`), Buffer.from(await selfie!.arrayBuffer()));
      updateData.selfieUrl = `/api/auth/kyc/file/${session.userId}/selfie.${selfieExt}`;
    }

    // Determinar novo status
    const currentUser = await container.userRepo.findById(session.userId);
    const hasDoc = isDocUpload || (currentUser?.docFrontUrl && currentUser?.docBackUrl);
    const hasSelfie = isSelfieUpload || currentUser?.selfieUrl;

    let newStatus = "unverified";
    if (hasDoc && hasSelfie) newStatus = "pending_review";
    else if (hasDoc) newStatus = "pending_selfie";
    else newStatus = "pending_docs";

    await container.userRepo.update(session.userId, {
      ...updateData,
      verificationStatus: newStatus,
    } as Record<string, string>);

    return NextResponse.json({
      message: isDocUpload ? "Documentos enviados com sucesso" : "Selfie enviada com sucesso",
      verificationStatus: newStatus,
    });
  } catch (error) {
    return handleError(error);
  }
});
