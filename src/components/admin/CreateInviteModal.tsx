"use client";

import { useState } from "react";
import { createInvitation } from "@/lib/actions/admin";
import { T } from "@/lib/tokens";

export default function CreateInviteModal() {
  const [open, setOpen] = useState(false);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [link, setLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    const url = await createInvitation(maxUses, expiresInDays);
    setLink(url);
    setStatus("done");
  };

  const handleClose = () => {
    setOpen(false);
    setStatus("idle");
    setLink("");
    setMaxUses(1);
    setExpiresInDays(7);
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "10px 14px",
    fontFamily: T.mono,
    fontSize: 15,
    color: T.text,
    width: "100%",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textSub,
    display: "block",
    marginBottom: 6,
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mc-copy"
        style={{
          background: T.grassDim,
          border: `1px solid rgba(93,158,64,0.32)`,
          borderRadius: 6,
          padding: "11px 24px",
          fontFamily: T.sans,
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: ".06em",
          color: T.grass,
          transition: "background .15s",
        }}
      >
        Créer une invitation
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "36px 40px", width: "100%", maxWidth: 400, position: "relative" }}
          >
            <div style={{ fontFamily: T.display, fontSize: 22, color: T.text, marginBottom: 28 }}>
              Nouvelle invitation
            </div>

            {status === "done" ? (
              <div>
                <p style={{ fontFamily: T.sans, fontSize: 14, color: T.textSub, marginBottom: 16 }}>
                  Lien généré — partage-le avec le joueur :
                </p>
                <div
                  style={{ fontFamily: T.mono, fontSize: 12, color: T.grass, background: "rgba(93,158,64,0.08)", border: `1px solid rgba(93,158,64,0.2)`, borderRadius: 6, padding: "12px 14px", wordBreak: "break-all", marginBottom: 20 }}
                >
                  {link}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(link)}
                  className="mc-copy"
                  style={{ background: T.grassDim, border: `1px solid rgba(93,158,64,0.32)`, borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontWeight: 600, fontSize: 13, color: T.grass, width: "100%", marginBottom: 10 }}
                >
                  Copier le lien
                </button>
                <button
                  onClick={handleClose}
                  style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontSize: 13, color: T.muted, width: "100%", cursor: "pointer" }}
                >
                  Fermer
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div>
                  <label style={labelStyle}>Nombre d'utilisations max</label>
                  <input type="number" min={1} max={100} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expire dans (jours)</label>
                  <input type="number" min={1} max={365} value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))} style={inputStyle} />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="mc-copy"
                  style={{ background: T.grassDim, border: `1px solid rgba(93,158,64,0.32)`, borderRadius: 6, padding: "12px", fontFamily: T.sans, fontWeight: 600, fontSize: 14, color: T.grass, opacity: status === "loading" ? 0.6 : 1 }}
                >
                  {status === "loading" ? "Création…" : "Générer le lien"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
