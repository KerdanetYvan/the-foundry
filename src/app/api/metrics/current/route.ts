import { NextResponse } from "next/server";
import { readMetrics } from "@/lib/metrics";

export async function GET() {
  const { cpuPct, mcCpuPct, ramMb, ramTotalMb, mcRamMb, mcRamTotalMb, diskGb, diskTotalGb, uptimeSeconds } = await readMetrics();
  return NextResponse.json({ cpuPct, mcCpuPct, ramMb, ramTotalMb, mcRamMb, mcRamTotalMb, diskGb, diskTotalGb, uptimeSeconds });
}
