"use client";

import { useState } from "react";
import { T } from "@/lib/tokens";

interface Inv {
  id: number;
  token: string;
  maxUses: number;
  useCount: number;
  expiresAt: string;
  createdAt: string;
}

function getStatus(inv: Inv): { label: string; color: string } {
  if (new Date(inv.expiresAt) < new Date()) return { label: "Expiré", color: T.muted };
  if (inv.useCount >= inv.maxUses) return { label: "Complété", color: T.copper };
  return { label: "Actif", color: T.grass };
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const INITIAL = 5;

export default function InvitationsTable({ invitations, appUrl }: { invitations: Inv[]; appUrl: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const visible = expanded ? invitations : invitations.slice(0, INITIAL);

  const copy = (inv: Inv) => {
    navigator.clipboard.writeText(`${appUrl}/invite/${inv.token}`);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (invitations.length === 0) {
    return <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted, marginTop: 16 }}>Aucune invitation créée pour l'instant.</p>;
  }

  const th: React.CSSProperties = { padding: "10px 14px", fontFamily: T.sans, fontSize: 12, fontWeight: 500, color: T.muted, textAlign: "left", letterSpacing: ".05em", textTransform: "uppercase" };
  const td: React.CSSProperties = { padding: "10px 14px", fontFamily: T.sans, fontSize: 13, textAlign: "left" };

  return (
    <div style={{ marginTop: 20, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: T.surface }}>
            <th style={th}>Token</th>
            <th style={th}>Statut</th>
            <th style={th}>Utilisations</th>
            <th style={th}>Expire le</th>
            <th style={th}>Lien</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((inv, i) => {
            const { label, color } = getStatus(inv);
            return (
              <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <td style={{ ...td, fontFamily: T.mono, fontSize: 12, color: T.textSub }}>{inv.token.slice(0, 8)}…</td>
                <td style={td}>
                  <span style={{ color, fontWeight: 600, fontSize: 12, letterSpacing: ".04em" }}>{label}</span>
                </td>
                <td style={{ ...td, color: T.textSub }}>{inv.useCount} / {inv.maxUses}</td>
                <td style={{ ...td, color: T.textSub }}>{fmt(inv.expiresAt)}</td>
                <td style={td}>
                  <button
                    onClick={() => copy(inv)}
                    className="mc-copy"
                    style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 10px", fontFamily: T.sans, fontSize: 12, color: copied === inv.id ? T.grass : T.textSub, cursor: "pointer" }}
                  >
                    {copied === inv.id ? "Copié ✓" : "Copier"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {invitations.length > INITIAL && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ width: "100%", padding: "12px", background: T.surface, border: "none", borderTop: `1px solid ${T.border}`, fontFamily: T.sans, fontSize: 13, color: T.muted, cursor: "pointer" }}
        >
          {expanded
            ? "Réduire ↑"
            : `Afficher ${invitations.length - INITIAL} invitation${invitations.length - INITIAL > 1 ? "s" : ""} de plus ↓`}
        </button>
      )}
    </div>
  );
}
