"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "@/lib/tokens";
import type { ServerInfo } from "@/lib/rcon";
import AnnouncementManager from "./AnnouncementManager";
import CreateInviteModal from "./CreateInviteModal";
import InvitationsTable from "./InvitationsTable";
import { kickPlayer, banPlayer, setWhitelisted } from "@/lib/actions/moderation";

type Tab = "monitoring" | "moderation" | "invitations" | "annonces";

const TABS: { key: Tab; label: string }[] = [
  { key: "monitoring", label: "Monitoring" },
  { key: "moderation", label: "Modération" },
  { key: "invitations", label: "Invitations" },
  { key: "annonces", label: "Annonces" },
];

type MetricPoint = {
  id: number;
  cpuPct: number;
  ramPct: number;
  ramMb: number;
  diskPct: number;
  diskGb: number;
  mcCpuPct: number | null;
  mcRamPct: number | null;
  mcRamMb: number | null;
  recordedAt: string;
};
type User = { id: number; username: string; role: string; whitelisted: boolean; createdAt: string };
type Announcement = { id: number; content: string; createdAt: string };
type Invitation = { id: number; token: string; maxUses: number; useCount: number; expiresAt: string; createdAt: string };

const MC = T.copper;
const HOST = T.grass;
const DISK_COLOR = "#60A5FA";

function tpsColor(tps: number) {
  if (tps >= 18) return T.grass;
  if (tps >= 12) return "#FBBF24";
  return "#F87171";
}

function pctColor(pct: number) {
  if (pct < 60) return T.grass;
  if (pct < 80) return "#FBBF24";
  return "#F87171";
}

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function tenMinTicks(data: MetricPoint[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const d of data) {
    const dt = new Date(d.recordedAt);
    const key = `${dt.getHours()}:${Math.floor(dt.getMinutes() / 10)}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d.recordedAt);
    }
  }
  return result;
}

function fmtMb(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} Go`;
  return `${mb} Mo`;
}

function fmtGb(gb: number) {
  return `${gb.toFixed(1)} Go`;
}

type ChartLine = { dataKey: string; color: string; name: string };

function MetricChart({
  data,
  lines,
  yDomain,
  yFormatter = (v: number) => `${v}%`,
  tooltipFormatter,
}: {
  data: MetricPoint[];
  lines: ChartLine[];
  yDomain?: [number | string, number | string];
  yFormatter?: (v: number) => string;
  tooltipFormatter?: (v: number) => string;
}) {
  const hasData = data.length >= 2;
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 4 }}>
      {!hasData && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, pointerEvents: "none" }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>Collecte en cours…</span>
        </div>
      )}
    <ResponsiveContainer width="100%" height={100} style={{ visibility: hasData ? "visible" : "hidden" }}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          {lines.map((l) => (
            <linearGradient key={l.dataKey} id={`grad-${l.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={l.color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={l.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <XAxis dataKey="recordedAt" tickFormatter={fmtTime} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} ticks={tenMinTicks(data)} />
        <YAxis domain={yDomain ?? [0, 100]} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} tickFormatter={yFormatter} />
        <Tooltip
          contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, fontFamily: T.mono, fontSize: 11 }}
          labelFormatter={(label) => fmtTime(label as string)}
          formatter={(v, name) => [(tooltipFormatter ?? yFormatter)(v as number), name]}
        />
        {lines.map((l) => (
          <Area key={l.dataKey} type="monotone" dataKey={l.dataKey} name={l.name} stroke={l.color} strokeWidth={1.5} fill={`url(#grad-${l.dataKey})`} dot={false} isAnimationActive={false} connectNulls={false} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
    </div>
  );
}

function ChartCard({
  label,
  badges,
  data,
  lines,
  yDomain,
  yFormatter,
  tooltipFormatter,
  full,
}: {
  label: string;
  badges: { text: string; color: string; dot: string }[];
  data: MetricPoint[];
  lines: ChartLine[];
  yDomain?: [number | string, number | string];
  yFormatter?: (v: number) => string;
  tooltipFormatter?: (v: number) => string;
  full?: boolean;
}) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px", gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: ".08em" }}>{label}</span>
        <div style={{ display: "flex", gap: 16 }}>
          {badges.map((b) => (
            <span key={b.text} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.dot, flexShrink: 0 }} />
              <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 700, color: b.color }}>{b.text}</span>
            </span>
          ))}
        </div>
      </div>
      <MetricChart data={data} lines={lines} yDomain={yDomain} yFormatter={yFormatter} tooltipFormatter={tooltipFormatter} />
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px" }}>
      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 8, letterSpacing: ".08em" }}>{label}</div>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, label, color }: { onClick: () => void; label: string; color: string }) {
  return (
    <button onClick={onClick} style={{ background: "transparent", border: `1px solid ${color}`, borderRadius: 4, padding: "4px 10px", fontFamily: T.sans, fontSize: 11, color, cursor: "pointer", whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

type CurrentMetrics = { cpuPct: number; ramPct: number; ramMb: number; diskPct: number; diskGb: number; mcCpuPct: number | null; mcRamPct: number | null; mcRamMb: number | null };

export default function AdminTabs({
  initialServerInfo,
  users,
  announcements,
  invitations,
  lastBackup,
  appUrl,
}: {
  initialServerInfo: ServerInfo;
  users: User[];
  announcements: Announcement[];
  invitations: Invitation[];
  lastBackup: string | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [serverInfo, setServerInfo] = useState<ServerInfo>(initialServerInfo);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [current, setCurrent] = useState<CurrentMetrics | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/server-status");
        if (res.ok) setServerInfo(await res.json());
      } catch {}
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, []);

  // Polling rapide (1s) — valeurs live uniquement, sans écriture en base
  useEffect(() => {
    if (activeTab !== "monitoring") return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/metrics/current");
        if (res.ok && active) setCurrent(await res.json());
      } catch {}
      if (active) setTimeout(poll, 1_000);
    };
    poll();
    return () => { active = false; };
  }, [activeTab]);

  // Polling lent (30s) — historique pour les graphiques + écriture en base
  useEffect(() => {
    if (activeTab !== "monitoring") return;
    const poll = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) setHistory((await res.json()).history);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [activeTab]);

  const hasMc = current != null && current.mcCpuPct !== null;

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      {/* Onglets */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: "14px 24px", fontFamily: T.sans, fontSize: 13, fontWeight: activeTab === key ? 600 : 400, color: activeTab === key ? T.text : T.muted, background: "transparent", border: "none", borderBottom: activeTab === key ? `2px solid ${T.grass}` : "2px solid transparent", cursor: "pointer", letterSpacing: ".04em" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* ── Monitoring ── always mounted to prevent <Area> unmount/remount accumulation in recharts v3 Redux */}
        <div style={activeTab === "monitoring" ? { display: "flex", flexDirection: "column", gap: 14 } : { height: 0, overflow: "hidden" }}>

            {/* Statut Minecraft */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <StatCard label="STATUT SERVEUR">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: serverInfo.online ? T.grass : "#F87171", flexShrink: 0 }} />
                  <span style={{ fontFamily: T.sans, fontSize: 14, color: T.text }}>{serverInfo.online ? "En ligne" : "Hors ligne"}</span>
                </div>
              </StatCard>
              <StatCard label="JOUEURS">
                <span style={{ fontFamily: T.mono, fontSize: 16, color: T.text }}>
                  {serverInfo.players ? `${serverInfo.players.online} / ${serverInfo.players.max}` : "—"}
                </span>
              </StatCard>
              <StatCard label="TPS">
                <span style={{ fontFamily: T.mono, fontSize: 16, color: serverInfo.tps !== null ? tpsColor(serverInfo.tps) : T.muted }}>
                  {serverInfo.tps !== null ? serverInfo.tps.toFixed(1) : "—"}
                </span>
              </StatCard>
              <StatCard label="DERNIÈRE SAUVEGARDE">
                <span style={{ fontFamily: T.mono, fontSize: 12, color: lastBackup ? T.textSub : T.muted }}>{lastBackup ?? "Aucune info"}</span>
              </StatCard>
            </div>

            {/* Charts CPU + RAM */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ChartCard
                label="CPU"
                badges={[
                  { text: current ? `${current.cpuPct.toFixed(1)}%` : "—", color: pctColor(current?.cpuPct ?? 0), dot: HOST },
                  ...(hasMc && current?.mcCpuPct != null
                    ? [{ text: `${current.mcCpuPct!.toFixed(1)}%`, color: pctColor(current.mcCpuPct!), dot: MC }]
                    : []),
                ]}
                data={history}
                lines={[
                  { dataKey: "cpuPct", color: HOST, name: "Hôte" },
                  ...(hasMc ? [{ dataKey: "mcCpuPct", color: MC, name: "Minecraft" }] : []),
                ]}
              />
              <ChartCard
                label="RAM"
                badges={[
                  { text: current ? fmtMb(current.ramMb) : "—", color: pctColor(current?.ramPct ?? 0), dot: HOST },
                  ...(hasMc && current?.mcRamMb != null
                    ? [{ text: fmtMb(current.mcRamMb!), color: pctColor(current.mcRamPct ?? 0), dot: MC }]
                    : []),
                ]}
                data={history}
                lines={[
                  { dataKey: "ramMb", color: HOST, name: "Hôte" },
                  ...(hasMc ? [{ dataKey: "mcRamMb", color: MC, name: "Minecraft" }] : []),
                ]}
                yDomain={["auto", "auto"]}
                yFormatter={fmtMb}
                tooltipFormatter={(v) => `${Math.round(v)} Mo`}
              />
            </div>

            {/* Chart Disque */}
            <ChartCard
              label="DISQUE"
              badges={[
                { text: current ? fmtGb(current.diskGb) : "—", color: pctColor(current?.diskPct ?? 0), dot: DISK_COLOR },
              ]}
              data={history}
              lines={[{ dataKey: "diskGb", color: DISK_COLOR, name: "Disque" }]}
              yDomain={["auto", "auto"]}
              yFormatter={fmtGb}
              full
            />
          </div>

        {/* ── Modération ── */}
        {activeTab === "moderation" && (
          <div>
            {users.length === 0 ? (
              <p style={{ fontFamily: T.sans, color: T.muted, fontSize: 14 }}>Aucun joueur inscrit.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Joueur", "Rôle", "Whitelist", "Inscrit le", "Actions"].map((h) => (
                      <th key={h} style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, textAlign: "left", paddingBottom: 12, letterSpacing: ".08em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px 0", fontFamily: T.sans, fontSize: 14, color: T.text }}>{user.username}</td>
                      <td style={{ padding: "12px 12px 12px 0", fontFamily: T.mono, fontSize: 11, color: user.role === "admin" ? T.copper : T.muted }}>{user.role}</td>
                      <td style={{ padding: "12px 12px 12px 0" }}>
                        <span style={{ fontFamily: T.mono, fontSize: 11, color: user.whitelisted ? T.grass : "#F87171" }}>{user.whitelisted ? "Oui" : "Non"}</span>
                      </td>
                      <td style={{ padding: "12px 12px 12px 0", fontFamily: T.mono, fontSize: 11, color: T.muted }}>
                        {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "12px 0" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <ActionBtn label="Kick" color={T.muted} onClick={() => kickPlayer(user.username)} />
                          <ActionBtn
                            label={user.whitelisted ? "Retirer WL" : "Ajouter WL"}
                            color={user.whitelisted ? "#F87171" : T.grass}
                            onClick={async () => { await setWhitelisted(user.id, user.username, !user.whitelisted); router.refresh(); }}
                          />
                          {user.role !== "admin" && (
                            <ActionBtn label="Ban" color="#F87171" onClick={async () => { await banPlayer(user.username, user.id); router.refresh(); }} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Invitations ── */}
        {activeTab === "invitations" && (
          <div>
            <CreateInviteModal />
            <InvitationsTable invitations={invitations} appUrl={appUrl} />
          </div>
        )}

        {/* ── Annonces ── */}
        {activeTab === "annonces" && (
          <AnnouncementManager items={announcements} />
        )}
      </div>
    </div>
  );
}
