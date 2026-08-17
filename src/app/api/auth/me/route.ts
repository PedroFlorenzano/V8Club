import { NextResponse } from "next/server";
import { container } from "@/infrastructure/container";
import { withAuth } from "@/presentation/middleware/auth.middleware";
import { handleError } from "@/presentation/middleware/error-handler";

export const GET = withAuth(async (_request, { session }) => {
  try {
    const user = await container.userRepo.findById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : null,
        phone: user.phone,
        verificationStatus: user.verificationStatus,
        verifiedAt: user.verifiedAt,
        hasDocuments: !!(user.docFrontUrl && user.docBackUrl),
        hasSelfie: !!user.selfieUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
