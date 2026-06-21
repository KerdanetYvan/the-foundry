"use client";

import { useState } from "react";
import { login } from "@/lib/actions/auth";
import { T } from "@/lib/tokens";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError("");
    const err = await login(username, password);
    if (err) {
      setError(err);
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "13px 16px",
    fontFamily: T.mono,
    fontSize: 15,
    color: T.text,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ fontFamily: T.sans, fontSize: 13, color: T.textSub, display: "block", marginBottom: 6 }}>
          Pseudo
        </label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ton pseudo" autoComplete="username" disabled={loading} style={inputStyle} />
      </div>
      <div>
        <label style={{ fontFamily: T.sans, fontSize: 13, color: T.textSub, display: "block", marginBottom: 6 }}>
          Mot de passe
        </label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" disabled={loading} style={inputStyle} />
      </div>
      {error && (
        <p style={{ fontFamily: T.sans, fontSize: 14, color: "#F87171", margin: 0 }}>{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !username || !password}
        className="mc-copy"
        style={{
          background: T.grassDim,
          border: `1px solid rgba(93,158,64,0.32)`,
          borderRadius: 6,
          padding: "13px",
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: ".06em",
          color: T.grass,
          opacity: loading || !username || !password ? 0.5 : 1,
          marginTop: 4,
        }}
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
