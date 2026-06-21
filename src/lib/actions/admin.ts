"use server";

import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { invitations } from "@/lib/db/schema";

export async function createInvitation(maxUses: number, expiresInDays: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  await db.insert(invitations).values({ token, maxUses, useCount: 0, expiresAt });

  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}
