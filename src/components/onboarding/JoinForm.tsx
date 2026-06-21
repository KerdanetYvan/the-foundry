"use client";

import { useState } from "react";
import { joinServer } from "@/lib/actions/invite";
import { T } from "@/lib/tokens";
import CopyButton from "@/components/onboarding/CopyButton";

interface JoinFormProps { token: string; }

export default function JoinForm({ token }: JoinFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [serverAddress, setServerAddress] = useState("");

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || password !== confirm) return;
    setStatus("loading");
    const result = await joinServer(token, username.trim(), password);
    if (result.success) { setStatus("success"); setServerAddress(result.address); }
    else { setStatus("error"); setErrorMsg(result.error); }
  };

  const input: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 6,
    padding: "13px 16px", fontFamily: T.mono, fontSize: 15, color: T.text,
    width: "100%", maxWidth: 340, outline: "none", boxSizing: "border-box",
  };

  if (status === "success") {
    return (
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontFamily: T.pixel, fontSize: "clamp(9px, 1.4vw, 12px)", color: T.grass, marginBottom: 20, textShadow: "2px 2px 0 rgba(0,0,0,.9)" }}>
          ✓ TU ES SUR LA WHITELIST
        </div>
        <div style={{ fontFamily: T.display, fontSize: "clamp(26px, 4.5vw, 44px)", color: T.text, marginBottom: 16, lineHeight: 1.2 }}>
          Prêt à embarquer !
        </div>
        <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 16, color: T.textSub, marginBottom: 36 }}>
          Lance Minecraft et connecte-toi avec l'adresse ci-dessous.
        </p>
        <div style={{ fontFamily: T.mono, fontWeight: 500, fontSize: "clamp(14px, 2.8vw, 24px)", color: T.text, letterSpacing: ".04em", marginBottom: 28 }}>
          {serverAddress}
        </div>
        <CopyButton address={serverAddress} />
        <div style={{ marginTop: 24 }}>
          <a href="/portal" style={{ fontFamily: T.sans, fontSize: 14, color: T.grass, textDecoration: "none" }}>
            Accéder à mon espace →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <div style={{ fontFamily: T.display, fontSize: "clamp(26px, 4.5vw, 44px)", color: T.text, marginBottom: 16, lineHeight: 1.2 }}>
        Rejoins l'aventure
      </div>
      <p style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 16, color: T.textSub, marginBottom: 36 }}>
        Ton pseudo Minecraft devient ton identifiant de connexion.
      </p>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Pseudo Minecraft" maxLength={16} disabled={status === "loading"} style={input} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" autoComplete="new-password" disabled={status === "loading"} style={input} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmer le mot de passe" autoComplete="new-password" disabled={status === "loading"} style={{ ...input, borderColor: mismatch ? "#F87171" : T.border }} />
        {mismatch && <p style={{ fontFamily: T.sans, fontSize: 13, color: "#F87171", margin: 0 }}>Les mots de passe ne correspondent pas.</p>}
        <button
          type="submit"
          disabled={status === "loading" || !username.trim() || !password || password !== confirm}
          className="mc-copy"
          style={{ background: T.grassDim, border: `1px solid rgba(93,158,64,0.32)`, borderRadius: 6, padding: "13px 36px", fontFamily: T.sans, fontWeight: 600, fontSize: 14, letterSpacing: ".08em", color: T.grass, opacity: status === "loading" ? 0.6 : 1 }}
        >
          {status === "loading" ? "Création du compte…" : "Rejoindre le serveur"}
        </button>
      </form>
      {status === "error" && <p style={{ fontFamily: T.sans, fontSize: 14, color: "#F87171", marginTop: 16 }}>{errorMsg}</p>}
    </div>
  );
}
