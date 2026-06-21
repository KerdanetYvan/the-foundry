"use client";

import { useEffect, useState } from "react";
import { T } from "@/lib/tokens";
import type { ServerInfo } from "@/lib/rcon";

function tpsColor(tps: number): string {
  if (tps >= 18) return T.grass;
  if (tps >= 12) return "#FBBF24";
  return "#F87171";
}

export default function ServerStatus({ initial }: { initial: ServerInfo }) {
  const [info, setInfo] = useState<ServerInfo>(initial);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/server-status");
        if (res.ok) setInfo(await res.json());
      } catch {}
    };

    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 24px", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>STATUT</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: info.online ? T.grass : "#F87171", flexShrink: 0 }} />
          <span style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{info.online ? "En ligne" : "Hors ligne"}</span>
        </div>
      </div>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>JOUEURS</div>
        <span style={{ fontFamily: T.mono, fontSize: 15, color: T.text }}>
          {info.players
            ? <>{info.players.online} <span style={{ color: T.muted, fontSize: 12 }}>/ {info.players.max}</span></>
            : "—"}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginBottom: 6 }}>TPS</div>
        <span style={{ fontFamily: T.mono, fontSize: 15, color: info.tps !== null ? tpsColor(info.tps) : T.muted }}>
          {info.tps !== null ? info.tps.toFixed(1) : "—"}
        </span>
      </div>
    </div>
  );
}
