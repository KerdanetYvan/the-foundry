import Link from "next/link";
import type { Step } from "@/data/onboarding";
import { T } from "@/lib/tokens";

interface StepCardProps {
  step: Step;
}

const cardStyle = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: "24px 28px",
  display: "flex",
  gap: 22,
  alignItems: "flex-start",
  textDecoration: "none",
  color: "inherit",
};

function CardInner({ step }: { step: Step }) {
  return (
    <>
      <div
        style={{
          fontFamily: T.vt,
          fontSize: 50,
          lineHeight: 1,
          color: T.grass,
          opacity: 0.75,
          flexShrink: 0,
          width: 52,
          textShadow: "2px 2px 0 rgba(0,0,0,.6)",
        }}
      >
        {step.n}
      </div>
      <div style={{ flex: 1, paddingTop: 3 }}>
        <div style={{ fontFamily: T.display, fontSize: 18, color: T.text, marginBottom: 8 }}>
          {step.title}
        </div>
        <div
          style={{
            fontFamily: T.sans,
            fontWeight: 300,
            fontSize: 15,
            lineHeight: 1.7,
            color: T.textSub,
            marginBottom: step.note ? 10 : 0,
          }}
        >
          {step.body}
        </div>
        {step.note && (
          <div
            style={{
              fontFamily: T.sans,
              fontSize: 13,
              color: T.muted,
              borderLeft: `2px solid ${T.border}`,
              paddingLeft: 12,
            }}
          >
            {step.note}
          </div>
        )}
        {step.link && (
          <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: T.mono, fontSize: 13, color: T.grass }}>
            {step.link.label}
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path d="M1.5 9.5L9.5 1.5M9.5 1.5H4.5M9.5 1.5V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}

export default function StepCard({ step }: StepCardProps) {
  if (step.link) {
    return (
      <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="mc-step" style={cardStyle}>
        <CardInner step={step} />
      </a>
    );
  }

  if (step.internalHref) {
    return (
      <Link href={step.internalHref} className="mc-step" style={cardStyle}>
        <CardInner step={step} />
      </Link>
    );
  }

  return (
    <div className="mc-step" style={cardStyle}>
      <CardInner step={step} />
    </div>
  );
}
