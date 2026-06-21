import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
import { T } from "@/lib/tokens";
import { verifySession } from "@/lib/auth/session";
import JoinForm from "@/components/onboarding/JoinForm";

interface PageProps {
  params: Promise<{ token: string }>;
}

function InvalidInvite() {
  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ maxWidth: 400, padding: "0 24px" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(10px, 2vw, 12px)", color: T.muted, marginBottom: 24, textShadow: "2px 2px 0 rgba(0,0,0,.9)" }}>
          LIEN INVALIDE
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(24px, 4vw, 36px)", color: T.text, marginBottom: 16, lineHeight: 1.2 }}>
          Lien invalide ou expiré
        </h1>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 15, lineHeight: 1.7, color: T.textSub }}>
          Ce lien d'invitation n'est plus disponible.
          Demande un nouveau lien à l'admin.
        </p>
      </div>
    </div>
  );
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;

  const sessionToken = (await cookies()).get("session")?.value;
  if (sessionToken && verifySession(sessionToken)) redirect("/portal");

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  const isValid =
    invitation !== undefined &&
    invitation.expiresAt > new Date() &&
    invitation.useCount < invitation.maxUses;

  if (!isValid) return <InvalidInvite />;

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, padding: "60px 24px", textAlign: "center" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(9px, 1.6vw, 12px)", color: T.grass, marginBottom: 24, textShadow: "2px 2px 0 rgba(0,0,0,.9)", letterSpacing: ".1em" }}>
          THE FOUNDRY
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: "clamp(26px, 4vw, 40px)", color: T.text, marginBottom: 12, lineHeight: 1.2 }}>
          Tu as été invité
        </h1>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 15, color: T.textSub, marginBottom: 52, lineHeight: 1.75 }}>
          Crée ton compte pour rejoindre le serveur — ça prend 30 secondes.
          <br />
          Tu trouveras tout ce qu'il faut savoir une fois connecté.
        </p>
        <JoinForm token={token} />
      </div>
    </div>
  );
}
