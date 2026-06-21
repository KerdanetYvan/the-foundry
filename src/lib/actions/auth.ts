"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/crypto";
import { signSession } from "@/lib/auth/session";

const SESSION_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function login(username: string, password: string): Promise<string | undefined> {
  const user = await db.query.users.findFirst({ where: eq(users.username, username) });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return "Identifiants incorrects.";
  }

  const cookieStore = await cookies();
  cookieStore.set("session", signSession(user.id), SESSION_OPTS);

  redirect(user.role === "admin" ? "/dashboard" : "/portal");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
