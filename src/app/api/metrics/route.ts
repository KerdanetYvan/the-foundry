import { NextResponse } from "next/server";
import { desc, lt, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { serverMetrics } from "@/lib/db/schema";
import { readMetrics } from "@/lib/metrics";

export async function GET() {
  const snap = await readMetrics();
  const pruneAfter = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  await Promise.all([
    db.insert(serverMetrics).values({
      cpuPct: snap.cpuPct,
      ramPct: snap.ramPct,
      diskPct: snap.diskPct,
      mcCpuPct: snap.mcCpuPct,
      mcRamPct: snap.mcRamPct,
    }),
    db.delete(serverMetrics).where(lt(serverMetrics.recordedAt, pruneAfter)),
  ]);

  const history = await db
    .select()
    .from(serverMetrics)
    .where(gte(serverMetrics.recordedAt, thirtyMinAgo))
    .orderBy(desc(serverMetrics.recordedAt));

  return NextResponse.json({ current: snap, history: history.reverse() });
}
