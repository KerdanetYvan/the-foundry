import Gear from "@/components/ui/Gear";
import GrassStrip from "@/components/ui/GrassStrip";
import StarField from "@/components/ui/StarField";
import { T } from "@/lib/tokens";

export default function HeroSection() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "80px 24px 140px",
      }}
    >
      <StarField />

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 700,
          height: 500,
          background: "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(212,137,42,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "gear-cw 100s linear infinite", pointerEvents: "none" }}>
        <Gear size={620} color={T.copper} opacity={0.07} teeth={14} />
      </div>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", animation: "gear-ccw 58s linear infinite", pointerEvents: "none" }}>
        <Gear size={245} color={T.copper} opacity={0.11} teeth={8} />
      </div>

      <GrassStrip />

      <div style={{ position: "relative", textAlign: "center", maxWidth: 700, zIndex: 2, animation: "fadeup .9s ease both" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(9px, 1.3vw, 13px)", color: T.grass, lineHeight: 2, marginBottom: 32, textShadow: "2px 2px 0 rgba(0,0,0,.9)", letterSpacing: ".08em" }}>
          MINECRAFT · CREATE MOD
        </div>
        <h1 style={{ fontFamily: T.pixel, fontSize: "clamp(22px, 5vw, 50px)", lineHeight: 1.4, color: T.text, textShadow: "3px 3px 0 rgba(0,0,0,.95), 5px 5px 0 rgba(0,0,0,.35)", margin: 0 }}>
          REJOINS
        </h1>
        <h1 style={{ fontFamily: T.pixel, fontSize: "clamp(22px, 5vw, 50px)", lineHeight: 1.4, color: T.grass, textShadow: "3px 3px 0 rgba(0,30,0,.95)", marginBottom: 44 }}>
          L'AVENTURE
        </h1>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 18, lineHeight: 1.7, color: T.textSub, maxWidth: 420, margin: "0 auto 36px" }}>
          Un serveur moddé pour construire, automatiser, explorer.
          À plusieurs, et plus loin que la Lune.
        </p>
        <div style={{ fontFamily: T.vt, fontSize: 22, color: T.muted, letterSpacing: ".15em" }}>
          4 ÉTAPES &nbsp;·&nbsp; ~2 GO &nbsp;·&nbsp; ~5 MIN
        </div>
      </div>

      <div style={{ position: "absolute", bottom: 72, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.22 }}>
        <div style={{ width: 1, height: 40, background: T.grass }} />
        <svg width="14" height="9" viewBox="0 0 14 9" fill="none" aria-hidden="true">
          <path d="M1 1l6 6 6-6" stroke={T.grass} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
