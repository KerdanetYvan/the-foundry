import { asc, desc } from "drizzle-orm";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { invitations, announcements, users } from "@/lib/db/schema";
import { logout } from "@/lib/actions/auth";
import { getServerInfo } from "@/lib/rcon";
import { getLastBackupDate } from "@/lib/backup";
import AdminTabs from "@/components/admin/AdminTabs";
import MinecraftTerminal from "@/components/admin/MinecraftTerminal";

export default async function DashboardPage() {
  const [invRows, announcementRows, userRows, serverInfo] = await Promise.all([
    db.select().from(invitations).orderBy(desc(invitations.createdAt)),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
    db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      whitelisted: users.whitelisted,
      createdAt: users.createdAt,
    }).from(users).orderBy(asc(users.createdAt)),
    getServerInfo(),
  ]);

  const lastBackupDate = getLastBackupDate();
  const lastBackup = lastBackupDate
    ? lastBackupDate.toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null;

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  return (
    <main style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, padding: "60px 32px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
          <div>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(28px, 4vw, 42px)", color: T.text, marginBottom: 8 }}>
              Admin Dashboard
            </h1>
            <p style={{ fontFamily: T.sans, fontWeight: 300, color: T.textSub, fontSize: 15 }}>
              Monitoring serveur &amp; gestion des joueurs.
            </p>
          </div>
          <form action={logout}>
            <button type="submit" style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontSize: 13, color: T.muted, cursor: "pointer", whiteSpace: "nowrap" }}>
              Se déconnecter
            </button>
          </form>
        </div>

        <AdminTabs
          initialServerInfo={serverInfo}
          users={userRows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          announcements={announcementRows.map((a) => ({ id: a.id, content: a.content, createdAt: a.createdAt.toISOString() }))}
          invitations={invRows.map((inv) => ({ ...inv, expiresAt: inv.expiresAt.toISOString(), createdAt: inv.createdAt.toISOString() }))}
          lastBackup={lastBackup}
          appUrl={appUrl}
        />
        <MinecraftTerminal />
      </div>
    </main>
  );
}
