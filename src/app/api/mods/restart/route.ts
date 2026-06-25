import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import fs from "fs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";
import { rconCommand } from "@/lib/rcon";

export const dynamic = "force-dynamic";

const LOG_PATH =
  process.env.MC_LOG_PATH ??
  "/host/root/opt/minecraft/minecraft/data/logs/latest.log";

// Patterns indiquant que le nouveau processus a démarré
const STARTING_PATTERNS = [
  "Loading libraries",
  "Starting minecraft server",
  "Starting net.minecraft.server",
  "Preparing level",
];

async function requireAdmin() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.role !== "admin") return null;
  return user;
}

function logSize(): number {
  try { return fs.statSync(LOG_PATH).size; } catch { return 0; }
}

/** Lit les nouvelles lignes depuis `offset`. Détecte la rotation si la taille a diminué. */
function readNewLines(offset: number): { lines: string[]; nextOffset: number; rotated: boolean } {
  try {
    const size = fs.statSync(LOG_PATH).size;
    const rotated = size < offset;
    const readFrom = rotated ? 0 : offset;
    const toRead = size - readFrom;

    if (toRead <= 0) return { lines: [], nextOffset: size, rotated };

    const buf = Buffer.alloc(toRead);
    const fd = fs.openSync(LOG_PATH, "r");
    fs.readSync(fd, buf, 0, toRead, readFrom);
    fs.closeSync(fd);

    const lines = buf.toString("utf-8").split("\n").filter((l) => l.trim());
    return { lines, nextOffset: size, rotated };
  } catch {
    return { lines: [], nextOffset: offset, rotated: false };
  }
}

const safeRcon = async (cmd: string) => {
  try { return await rconCommand(cmd); } catch { return ""; }
};

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let alive = true;
      req.signal.addEventListener("abort", () => { alive = false; });

      const push = (data: object) => {
        if (!alive) return;
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`)); }
        catch { alive = false; }
      };

      try {
        // ── 1. Vérification des joueurs ──
        push({ phase: "checking" });
        let playersOnline = 0;
        try {
          const list = await rconCommand("list");
          const m = list.match(/There are (\d+)/);
          if (m) playersOnline = parseInt(m[1], 10);
        } catch {}

        // ── 2. Avertissement + compte à rebours ──
        if (playersOnline > 0 && alive) {
          push({ phase: "warning" });
          await safeRcon('title @a title {"text":"⚠ Redémarrage du serveur","color":"red","bold":true}');
          await safeRcon('title @a subtitle {"text":"Le serveur redémarre dans 30 secondes","color":"yellow"}');
          await safeRcon("say [SERVEUR] Redémarrage imminent. Sauvegardez votre progression.");

          for (let s = 30; s > 0 && alive; s--) {
            push({ phase: "countdown", seconds: s });
            if (s === 10 || s === 5 || s === 3) {
              await safeRcon(`title @a subtitle {"text":"Redémarrage dans ${s} secondes…","color":"yellow"}`);
            }
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        if (!alive) return;

        // ── 3. Sauvegarde ──
        push({ phase: "saving" });
        await safeRcon("save-all");
        await new Promise((r) => setTimeout(r, 3000));

        if (!alive) return;

        // ── 4. Arrêt — on note l'offset du log avant d'envoyer /stop ──
        push({ phase: "stopping" });
        let logOffset = logSize();
        await safeRcon("stop");

        // ── 5. Surveillance des logs ──
        // On attend soit une rotation du fichier, soit des patterns de démarrage
        // Timeout global : 5 minutes
        const deadline = Date.now() + 5 * 60 * 1000;
        let watchPhase: "stopping" | "starting" = "stopping";

        while (alive && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, 500));

          const { lines, nextOffset, rotated } = readNewLines(logOffset);
          logOffset = nextOffset;

          // La rotation du fichier log = nouveau processus lancé
          if (rotated && watchPhase === "stopping") {
            watchPhase = "starting";
            push({ phase: "starting" });
          }

          for (const line of lines) {
            if (watchPhase === "stopping") {
              if (STARTING_PATTERNS.some((p) => line.includes(p))) {
                watchPhase = "starting";
                push({ phase: "starting" });
              }
            }
            if (watchPhase === "starting") {
              // "Done (12.345s)! For help, type "help""
              if (line.includes("Done (")) {
                push({ phase: "done" });
                try { controller.close(); } catch {}
                return;
              }
            }
          }
        }

        push({ phase: "error", message: "Délai dépassé (5 min). Vérifiez le terminal." });
      } catch (err) {
        push({ phase: "error", message: err instanceof Error ? err.message : "Erreur inattendue." });
      }

      try { controller.close(); } catch {}
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
