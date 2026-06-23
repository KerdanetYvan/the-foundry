import type { NextRequest } from "next/server";
import fs from "fs";

export const dynamic = "force-dynamic";

const LOG_PATH =
  process.env.MC_LOG_PATH ??
  "/host/root/opt/minecraft/minecraft/data/logs/latest.log";

function lastLines(n: number): string[] {
  try {
    const text = fs.readFileSync(LOG_PATH, "utf-8");
    return text.split("\n").filter((l) => l.trim()).slice(-n);
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let alive = true;

      const push = (raw: string) => {
        if (!alive) return;
        try {
          controller.enqueue(enc.encode(raw));
        } catch {
          alive = false;
        }
      };

      // Backfill des 50 dernières lignes
      lastLines(50)
        .forEach((l) => push(`data: ${JSON.stringify(l)}\n\n`));

      let fileSize = 0;
      try {
        fileSize = fs.statSync(LOG_PATH).size;
      } catch {}

      const poll = setInterval(() => {
        if (!alive) {
          clearInterval(poll);
          clearInterval(ping);
          return;
        }
        try {
          const { size } = fs.statSync(LOG_PATH);
          if (size < fileSize) fileSize = 0; // rotation du log
          if (size > fileSize) {
            const buf = Buffer.alloc(size - fileSize);
            const fd = fs.openSync(LOG_PATH, "r");
            fs.readSync(fd, buf, 0, buf.length, fileSize);
            fs.closeSync(fd);
            fileSize = size;
            buf
              .toString("utf-8")
              .split("\n")
              .filter((l) => l.trim())
              .forEach((l) => push(`data: ${JSON.stringify(l)}\n\n`));
          }
        } catch {}
      }, 1_000);

      // Keepalive pour éviter le timeout Caddy
      const ping = setInterval(() => push(": keepalive\n\n"), 15_000);

      req.signal.addEventListener("abort", () => {
        alive = false;
        clearInterval(poll);
        clearInterval(ping);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
