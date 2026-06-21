import PixelArt from "@/components/ui/PixelArt";
import type { Feature } from "@/data/onboarding";
import { T } from "@/lib/tokens";

interface FeaturePanelProps {
  feature: Feature;
  index: number;
}

export default function FeaturePanel({ feature, index }: FeaturePanelProps) {
  const isEven = index % 2 === 0;

  return (
    <div
      style={{
        position: "relative",
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: isEven ? "1fr 1.2fr" : "1.2fr 1fr",
        minHeight: 260,
      }}
    >
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, background: feature.glow, pointerEvents: "none" }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          order: isEven ? 0 : 1,
          background: `radial-gradient(ellipse at center, ${feature.glow.replace("0.1", "0.18")} 0%, transparent 70%)`,
          position: "relative",
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <PixelArt art={feature.art} palette={feature.palette} cell={feature.cell} />
        </div>
      </div>

      <div
        style={{
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          order: isEven ? 1 : 0,
        }}
      >
        <div
          style={{
            fontFamily: T.vt,
            fontSize: 16,
            color: feature.accent,
            letterSpacing: ".25em",
            marginBottom: 16,
            opacity: 0.9,
          }}
        >
          {feature.tag}
        </div>
        <h3
          style={{
            fontFamily: T.display,
            fontSize: "clamp(24px, 3vw, 36px)",
            color: T.text,
            lineHeight: 1.2,
            marginBottom: 18,
            whiteSpace: "pre-line",
          }}
        >
          {feature.title}
        </h3>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 15, lineHeight: 1.75, color: T.textSub }}>
          {feature.copy}
        </p>
      </div>
    </div>
  );
}
