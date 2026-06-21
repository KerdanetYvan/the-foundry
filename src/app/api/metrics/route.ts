import { NextResponse } from "next/server";
import { desc, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { serverMetrics } from "@/lib/db/schema";
import { readMetrics } from "@/lib/metrics";

export async function GET() {
  const snapshot = await readMetrics();
  const pruneAfter = new Date(Date.now() - 2 * 60 * 60 * 1000); // garde 2h d'historique

  await Promise.all([
    db.insert(serverMetrics).values(snapshot),
    db.delete(serverMetrics).where(lt(serverMetrics.recordedAt, pruneAfter)),
  ]);

  const history = await db
    .select()
    .from(serverMetrics)
    .orderBy(desc(serverMetrics.recordedAt))
    .limit(60);

  return NextResponse.json({ current: snapshot, history: history.reverse() });
}
