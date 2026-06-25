import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const MODS_DIR =
  process.env.MC_MODS_PATH ??
  "/host/root/opt/minecraft/minecraft/data/mods";

async function requireAdmin() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filename } = await params;
  const safe = path.basename(decodeURIComponent(filename));
  if (!safe.endsWith(".jar")) {
    return NextResponse.json({ error: "Fichier invalide" }, { status: 400 });
  }

  try {
    fs.unlinkSync(path.join(MODS_DIR, safe));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Suppression échouée" }, { status: 500 });
  }
}
