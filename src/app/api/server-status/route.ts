import { NextResponse } from "next/server";
import { getServerInfo } from "@/lib/rcon";

export async function GET() {
  const info = await getServerInfo();
  return NextResponse.json(info);
}
