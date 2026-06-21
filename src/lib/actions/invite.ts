"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations, users } from "@/lib/db/schema";
import { rconCommand } from "@/lib/rcon";
import { hashPassword } from "@/lib/auth/crypto";
import { signSession } from "@/lib/auth/session";

type JoinResult =
  | { success: true; address: string }
  | { success: false; error: string };

const SESSION_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function joinServer(token: string, username: string, password: string): Promise<JoinResult> {
  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  if (!invitation || invitation.expiresAt < new Date() || invitation.useCount >= invitation.maxUses) {
    return { success: false, error: "Lien d'invitation invalide ou expiré." };
  }

  const existing = await db.query.users.findFirst({ where: eq(users.username, username) });
  if (existing) {
    return { success: false, error: "Ce pseudo est déjà enregistré." };
  }

  const rconHost = process.env.RCON_HOST;
  if (rconHost) {
    try {
      await rconCommand(`whitelist add ${username}`);
    } catch {
      return { success: false, error: "Impossible de contacter le serveur. Réessaie plus tard." };
    }
  }

  const passwordHash = await hashPassword(password);
  const whitelisted = !!rconHost;

  const newUser = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(users)
      .values({ username, passwordHash, role: "player", whitelisted, invitationId: invitation.id })
      .returning({ id: users.id });
    await tx
      .update(invitations)
      .set({ useCount: invitation.useCount + 1 })
      .where(eq(invitations.id, invitation.id));
    return inserted;
  });

  const cookieStore = await cookies();
  cookieStore.set("session", signSession(newUser.id), SESSION_OPTS);

  return { success: true, address: process.env.SERVER_ADDRESS ?? "server-mc.kerdanetyvan.dev" };
}
