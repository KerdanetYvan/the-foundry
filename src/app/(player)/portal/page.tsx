import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";

export default async function PortalPage() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) redirect("/login");

  const address = process.env.SERVER_ADDRESS ?? "server-mc.kerdanetyvan.dev";

  return (
    <main style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, padding: "60px 32px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(9px, 1.6vw, 12px)", color: T.grass, marginBottom: 24, textShadow: "2px 2px 0 rgba(0,0,0,.9)", letterSpacing: ".1em" }}>
          THE FOUNDRY
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
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
