import Link from "next/link";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { T } from "@/lib/tokens";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";

export default async function HomePage() {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  const user = userId
    ? await db.query.users.findFirst({ where: eq(users.id, userId) })
    : null;

  return (
    <div
      style={{
        background: T.bg,
        color: T.text,
        minHeight: "100vh",
        fontFamily: T.sans,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 480, padding: "0 24px" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(10px, 2vw, 14px)", color: T.grass, marginBottom: 32, textShadow: "2px 2px 0 rgba(0,0,0,.9)", letterSpacing: ".08em" }}>
          THE FOUNDRY
        </div>

        {user ? (
          <>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(28px, 5vw, 48px)", color: T.text, marginBottom: 16, lineHeight: 1.2 }}>
              Bienvenue, {user.username}
            </h1>
            <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 16, lineHeight: 1.7, color: T.textSub, marginBottom: 32 }}>
              {user.role === "admin"
                ? "Tu as accès au tableau de bord administrateur."
                : user.whitelisted
                ? "Tu es sur la whitelist. Prêt à jouer."
                : "Ton compte est en attente de validation."}
            </p>
            <Link
              href={user.role === "admin" ? "/dashboard" : "/portal"}
              style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, letterSpacing: ".06em", color: T.grass, background: T.grassDim, border: `1px solid rgba(93,158,64,0.32)`, borderRadius: 6, padding: "12px 28px", textDecoration: "none", display: "inline-block" }}
            >
              {user.role === "admin" ? "Tableau de bord" : "Mon espace"}
            </Link>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: T.display, fontSize: "clamp(28px, 5vw, 48px)", color: T.text, marginBottom: 16, lineHeight: 1.2 }}>
              Accès sur invitation
            </h1>
            <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 16, lineHeight: 1.7, color: T.textSub, marginBottom: 32 }}>
              Ce serveur est réservé aux joueurs invités.
              <br />
              Si tu as reçu un lien, clique dessus pour rejoindre.
            </p>
            <Link
              href="/login"
              style={{ fontFamily: T.sans, fontWeight: 600, fontSize: 14, letterSpacing: ".06em", color: T.text, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "12px 28px", textDecoration: "none", display: "inline-block" }}
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
