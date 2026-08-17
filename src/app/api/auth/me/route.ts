import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      cpf: true,
      phone: true,
      verificationStatus: true,
      verifiedAt: true,
      docFrontUrl: true,
      docBackUrl: true,
      selfieUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      ...user,
      cpf: user.cpf ? `***.***.${user.cpf.slice(6, 9)}-**` : null,
      hasDocuments: !!(user.docFrontUrl && user.docBackUrl),
      hasSelfie: !!user.selfieUrl,
    },
  });
}
