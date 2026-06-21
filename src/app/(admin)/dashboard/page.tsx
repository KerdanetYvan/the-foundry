import { desc } from "drizzle-orm";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { invitations, announcements } from "@/lib/db/schema";
import { logout } from "@/lib/actions/auth";
import { markBackupNow } from "@/lib/actions/announcements";
import CreateInviteModal from "@/components/admin/CreateInviteModal";
import InvitationsTable from "@/components/admin/InvitationsTable";
import AnnouncementManager from "@/components/admin/AnnouncementManager";

export default async function DashboardPage() {
  const [rows, announcementRows] = await Promise.all([
    db.select().from(invitations).orderBy(desc(invitations.createdAt)),
    db.select().from(announcements).orderBy(desc(announcements.createdAt)),
  ]);

  const serialized = rows.map((inv) => ({
    ...inv,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
  }));

  const serializedAnnouncements = announcementRows.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  return (
    <main style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, padding: "60px 32px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
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

        <section style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: T.vt, fontSize: 16, color: T.copper, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 20 }}>
            Invitations
          </div>
          <CreateInviteModal />
          <InvitationsTable invitations={serialized} appUrl={appUrl} />
        </section>

        <section style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontFamily: T.vt, fontSize: 16, color: T.copper, letterSpacing: ".2em", textTransform: "uppercase" }}>
              Annonces
            </div>
          </div>
          <AnnouncementManager items={serializedAnnouncements} />
        </section>

        <section>
          <div style={{ fontFamily: T.vt, fontSize: 16, color: T.copper, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 20 }}>
            Serveur
          </div>
          <form action={markBackupNow}>
            <button type="submit" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontSize: 13, color: T.textSub, cursor: "pointer" }}>
              Marquer une sauvegarde maintenant
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
