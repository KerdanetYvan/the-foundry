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

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const files = fs.readdirSync(MODS_DIR);
    const mods = files
      .filter((f) => f.endsWith(".jar"))
      .map((f) => {
        const stats = fs.statSync(path.join(MODS_DIR, f));
        return { name: f, size: stats.size };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(mods);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const name = path.basename(file.name);
    if (!name.endsWith(".jar")) {
      return NextResponse.json({ error: "Seuls les fichiers .jar sont acceptés" }, { status: 400 });
    }

    fs.writeFileSync(path.join(MODS_DIR, name), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Upload échoué" }, { status: 500 });
  }
}
