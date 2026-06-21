import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/crypto";

export async function POST(req: NextRequest) {
  const existing = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (existing) {
    return NextResponse.json({ error: "Setup already done." }, { status: 403 });
  }

  const body = await req.json().catch(() => null) as { username?: string; password?: string } | null;
  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "username and password required." }, { status: 400 });
  }

  const passwordHash = await hashPassword(body.password);
  await db.insert(users).values({ username: body.username, passwordHash, role: "admin" });

  return NextResponse.json({ ok: true, username: body.username });
}
