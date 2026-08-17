import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    const cwd = process.cwd();
    const dbPathPrisma = path.resolve(cwd, "prisma", "dev.db");
    const dbPathRoot = path.resolve(cwd, "dev.db");
    
    const info = {
      cwd,
      dbPathPrisma,
      dbPathPrismaExists: fs.existsSync(dbPathPrisma),
      dbPathPrismaSize: fs.existsSync(dbPathPrisma) ? fs.statSync(dbPathPrisma).size : 0,
      dbPathRoot,
      dbPathRootExists: fs.existsSync(dbPathRoot),
      dbPathRootSize: fs.existsSync(dbPathRoot) ? fs.statSync(dbPathRoot).size : 0,
    };

    // Tentar com o caminho da raiz (que tem 49kb)
    const { PrismaBetterSqlite3 } = await import("@prisma/adapter-better-sqlite3");
    const { PrismaClient } = await import("@prisma/client");
    
    const adapter = new PrismaBetterSqlite3({ url: dbPathRoot });
    const prisma = new PrismaClient({ adapter });
    
    const count = await prisma.user.count();
    
    return NextResponse.json({ ...info, ok: true, userCount: count });
  } catch (error) {
    const cwd = process.cwd();
    return NextResponse.json({
      ok: false,
      cwd,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
