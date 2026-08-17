import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content, authorId } = body;

  if (!content || !authorId) {
    return NextResponse.json(
      { error: "Campos obrigatórios: content, authorId" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      vehicleId: id,
      authorId,
    },
    include: { author: { select: { name: true } } },
  });

  return NextResponse.json(comment);
}
