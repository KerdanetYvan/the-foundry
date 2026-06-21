import { T } from "@/lib/tokens";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              fontFamily: T.pixel,
              fontSize: "clamp(9px, 1.8vw, 12px)",
              color: T.grass,
              marginBottom: 20,
              textShadow: "2px 2px 0 rgba(0,0,0,.9)",
              letterSpacing: ".1em",
            }}
          >
            THE FOUNDRY
          </div>
          <h1
            style={{
              fontFamily: T.display,
              fontSize: "clamp(24px, 4vw, 34px)",
              color: T.text,
              lineHeight: 1.2,
            }}
          >
            Connexion
          </h1>
        </div>
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: 14,
            padding: "32px 28px",
          }}
        >
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
