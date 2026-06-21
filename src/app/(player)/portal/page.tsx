import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { users, settings, announcements } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { getServerInfo } from "@/lib/rcon";
import AnnouncementsSection from "@/components/portal/AnnouncementsSection";

function tpsColor(tps: number): string {
  if (tps >= 18) return T.grass;
  if (tps >= 12) return "#FBBF24";
  return "#F87171";
}

export default async function PortalPage() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) redirect("/login");

  const [serverInfo, lastBackupRow, announcementList] = await Promise.all([
    getServerInfo(),
    db.query.settings.findFirst({ where: eq(settings.key, "last_backup_at") }),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
  ]);

  const address = process.env.SERVER_ADDRESS ?? "server-mc.kerdanetyvan.dev";

  const lastBackup = lastBackupRow?.value
    ? new Date(lastBackupRow.value).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <main style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, padding: "60px 32px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(9px, 1.6vw, 12px)", color: T.grass, marginBottom: 24, textShadow: "2px 2px 0 rgba(0,0,0,.9)", letterSpacing: ".1em" }}>
          THE FOUNDRY
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(26px, 4vw, 40px)", color: T.text, marginBottom: 8, lineHeight: 1.2 }}>
              Bienvenue, {user.username}
            </h1>
            <p style={{ fontFamily: T.sans, fontWeight: 300, color: T.textSub, fontSize: 15 }}>
              {user.whitelisted ? "Tu es sur la whitelist." : "En attente de validation."}
            </p>
          </div>
          <form action={logout}>
            <button type="submit" style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontSize: 13, color: T.muted, cursor: "pointer", whiteSpace: "nowrap" }}>
              Se déconnecter
            </button>
          </form>
        </div>

        {/* Statut serveur */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 24px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>STATUT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: serverInfo.online ? T.grass : "#F87171", flexShrink: 0 }} />
              <span style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{serverInfo.online ? "En ligne" : "Hors ligne"}</span>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>JOUEURS</div>
            <span style={{ fontFamily: T.mono, fontSize: 15, color: T.text }}>
              {serverInfo.players ? <>{serverInfo.players.online} <span style={{ color: T.muted, fontSize: 12 }}>/ {serverInfo.players.max}</span></> : "—"}
            </span>
          </div>
          <div>
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>TPS</div>
            <span style={{ fontFamily: T.mono, fontSize: 15, color: serverInfo.tps !== null ? tpsColor(serverInfo.tps) : T.muted }}>
              {serverInfo.tps !== null ? serverInfo.tps.toFixed(1) : "—"}
            </span>
          </div>
        </div>

        {/* Dernière sauvegarde */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>DERNIÈRE SAUVEGARDE</span>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: lastBackup ? T.textSub : T.muted }}>{lastBackup ?? "Aucune info"}</span>
        </div>

        {/* Adresse serveur */}
        {user.whitelisted && (
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 28px", marginBottom: 16 }}>
            <div style={{ fontFamily: T.vt, fontSize: 15, letterSpacing: ".15em", color: T.copper, textTransform: "uppercase", marginBottom: 12 }}>
              Adresse du serveur
            </div>
            <div style={{ fontFamily: T.mono, fontSize: "clamp(14px, 2.5vw, 20px)", color: T.text, letterSpacing: ".04em" }}>
              {address}
            </div>
          </div>
        )}

        {/* Annonces */}
        <AnnouncementsSection items={announcementList} />

        <Link
          href="/guide"
          style={{ display: "inline-block", fontFamily: T.sans, fontWeight: 600, fontSize: 14, letterSpacing: ".06em", color: T.grass, background: T.grassDim, border: `1px solid rgba(93,158,64,0.32)`, borderRadius: 6, padding: "12px 24px", textDecoration: "none" }}
        >
          Comment rejoindre →
        </Link>
      </div>
    </main>
  );
}
