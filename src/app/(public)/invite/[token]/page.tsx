import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitations } from "@/lib/db/schema";
import { FEATURES, MODS, STEPS } from "@/data/onboarding";
import { T } from "@/lib/tokens";
import FeaturePanel from "@/components/onboarding/FeaturePanel";
import HeroSection from "@/components/onboarding/HeroSection";
import JoinForm from "@/components/onboarding/JoinForm";
import StepCard from "@/components/onboarding/StepCard";

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

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  });

  const isValid =
    invitation !== undefined &&
    invitation.expiresAt > new Date() &&
    invitation.useCount < invitation.maxUses;

  if (!isValid) return <InvalidInvite />;

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: T.sans }}>
      <HeroSection />

      <section style={{ maxWidth: 700, margin: "0 auto", padding: "100px 32px 80px", textAlign: "center" }}>
        <div style={{ fontFamily: T.vt, fontSize: 18, letterSpacing: ".2em", color: T.copper, textTransform: "uppercase", marginBottom: 32, opacity: 0.85 }}>
          Ce serveur, c'est pas juste une install de mods
        </div>
        <p style={{ fontFamily: T.display, fontSize: "clamp(22px, 4vw, 38px)", lineHeight: 1.45, color: T.text, marginBottom: 36 }}>
          Tu poses ta première roue dentée.{" "}
          <span style={{ color: T.copper }}>Une semaine après</span> tu as une usine qui tourne.{" "}
          <span style={{ color: "#60A5FA" }}>Un mois après</span> tu as un réseau de trains.{" "}
          <span style={{ color: "#A78BFA" }}>Et un jour</span>, tu lances une fusée.
        </p>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 17, lineHeight: 1.75, color: T.textSub, maxWidth: 540, margin: "0 auto" }}>
          C'est ça le serveur. Une progression réelle, construite à plusieurs,
          où chaque joueur a sa place dans la machine — et dans l'espace.
        </p>
      </section>

      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {FEATURES.map((f, i) => <FeaturePanel key={f.tag} feature={f} index={i} />)}
        </div>
      </section>

      <section style={{ padding: "40px 24px 80px", maxWidth: 820, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: T.pixel, fontSize: "clamp(10px, 1.6vw, 14px)", color: T.text, textShadow: "2px 2px 0 rgba(0,0,0,.9)", lineHeight: 1.6, marginBottom: 10 }}>LE MODPACK</div>
          <p style={{ fontFamily: T.sans, fontWeight: 300, color: T.muted, fontSize: 14 }}>21 mods · Forge 1.20.1 · 3 Go installés</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {MODS.map((mod) => (
            <div key={mod.name} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 1, background: mod.accent, flexShrink: 0 }} />
              <span style={{ fontFamily: T.sans, fontWeight: 400, fontSize: 13, color: T.textSub }}>{mod.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px 80px", maxWidth: 820, margin: "0 auto", borderTop: `1px solid ${T.border}` }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontFamily: T.pixel, fontSize: "clamp(12px, 2vw, 17px)", color: T.text, textShadow: "2px 2px 0 rgba(0,0,0,.9)", lineHeight: 1.6, marginBottom: 10 }}>COMMENT REJOINDRE</h2>
          <p style={{ fontFamily: T.sans, fontWeight: 300, color: T.muted, fontSize: 14 }}>Installe, importe, joue.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {STEPS.map((step) => <StepCard key={step.n} step={step} />)}
        </div>
      </section>

      <section style={{ position: "relative", padding: "80px 24px 110px", overflow: "hidden" }}>
        <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: T.grass }} />
        <div aria-hidden="true" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 300, background: "radial-gradient(ellipse, rgba(93,158,64,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
        <JoinForm token={token} />
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>Forge 1.20.1-47.4.0</span>
        <span style={{ fontFamily: T.vt, fontSize: 16, letterSpacing: ".1em", color: T.muted }}>HETZNER CX43 · HELSINKI</span>
      </footer>
    </div>
  );
}
