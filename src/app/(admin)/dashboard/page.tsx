import { desc } from "drizzle-orm";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
import { logout } from "@/lib/actions/auth";
import CreateInviteModal from "@/components/admin/CreateInviteModal";
import InvitationsTable from "@/components/admin/InvitationsTable";

export default async function DashboardPage() {
  const rows = await db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.createdAt));

  const serialized = rows.map((inv) => ({
    ...inv,
    expiresAt: inv.expiresAt.toISOString(),
    createdAt: inv.createdAt.toISOString(),
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

        <section>
          <div style={{ fontFamily: T.vt, fontSize: 16, color: T.copper, letterSpacing: ".2em", textTransform: "uppercase", marginBottom: 20 }}>
            Invitations
          </div>
          <CreateInviteModal />
          <InvitationsTable invitations={serialized} appUrl={appUrl} />
        </section>
      </div>
    </main>
  );
}
