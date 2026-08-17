import { NextResponse } from "next/server";
import { container } from "@/infrastructure/container";

export async function POST() {
  await container.sessionService.clear();
  return NextResponse.json({ message: "Logout realizado" });
}
