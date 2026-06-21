"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { rconCommand } from "@/lib/rcon";
import { revalidatePath } from "next/cache";

export async function kickPlayer(username: string): Promise<void> {
  await rconCommand(`kick ${username}`).catch(() => {});
}

export async function banPlayer(username: string, userId: number): Promise<void> {
  await Promise.all([
    rconCommand(`ban ${username}`).catch(() => {}),
    db.update(users).set({ whitelisted: false }).where(eq(users.id, userId)),
  ]);
  revalidatePath("/dashboard");
}

export async function setWhitelisted(userId: number, username: string, whitelist: boolean): Promise<void> {
  await Promise.all([
    rconCommand(whitelist ? `whitelist add ${username}` : `whitelist remove ${username}`).catch(() => {}),
    db.update(users).set({ whitelisted: whitelist }).where(eq(users.id, userId)),
  ]);
  revalidatePath("/dashboard");
}
