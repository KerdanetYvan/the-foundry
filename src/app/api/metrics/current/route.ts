import { NextResponse } from "next/server";
import { readMetrics } from "@/lib/metrics";

export async function GET() {
  const snap = await readMetrics();
  return NextResponse.json(snap);
}
