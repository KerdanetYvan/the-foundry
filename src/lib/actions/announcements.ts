"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcements, settings } from "@/lib/db/schema";

export async function createAnnouncement(content: string): Promise<void> {
  if (!content.trim()) return;
  await db.insert(announcements).values({ content: content.trim() });
  revalidatePath("/portal");
  revalidatePath("/dashboard");
}

export async function deleteAnnouncement(id: number): Promise<void> {
  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath("/portal");
  revalidatePath("/dashboard");
}

export async function markBackupNow(): Promise<void> {
  await db
    .insert(settings)
    .values({ key: "last_backup_at", value: new Date().toISOString() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: new Date().toISOString(), updatedAt: new Date() },
    });
  revalidatePath("/portal");
}
