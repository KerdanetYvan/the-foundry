"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "@/lib/tokens";
import type { ServerInfo } from "@/lib/rcon";
import BackupDate from "@/components/BackupDate";
import AnnouncementManager from "./AnnouncementManager";
import CreateInviteModal from "./CreateInviteModal";
import InvitationsTable from "./InvitationsTable";
import { kickPlayer, banPlayer, setWhitelisted } from "@/lib/actions/moderation";
import ModsTab from "./ModsTab";

type Tab = "monitoring" | "moderation" | "invitations" | "annonces" | "mods";

const TABS: { key: Tab; label: string }[] = [
  { key: "monitoring", label: "Monitoring" },
  { key: "moderation", label: "Modération" },
  { key: "invitations", label: "Invitations" },
  { key: "annonces", label: "Annonces" },
  { key: "mods", label: "Mods" },
];

type LiveSnapshot = { cpuPct: number; mcCpuPct: number | null; ramMb: number; ramTotalMb: number; mcRamMb: number | null; mcRamTotalMb: number | null; diskGb: number; diskTotalGb: number; uptimeSeconds: number; mcUptimeSeconds: number | null };
type CpuPoint = { time: number; cpuPct: number; mcCpuPct: number | null };
type RamPoint = { time: number; ramMb: number; mcRamMb: number | null };
type User = { id: number; username: string; role: string; whitelisted: boolean; createdAt: string };
type Announcement = { id: number; content: string; createdAt: string };
type Invitation = { id: number; token: string; maxUses: number; useCount: number; expiresAt: string; createdAt: string };

const HOUR_MS = 3_600_000;
const TICK_MS = 15 * 60 * 1000;
const SAMPLE_MS = 30_000;

function tpsColor(tps: number) {
  if (tps >= 18) return T.grass;
  if (tps >= 12) return "#FBBF24";
  return "#F87171";
}

function fmtTick(t: number) {
  return new Date(t).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function fmtUptime(s: number): string {
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h < 24) return `${h}h ${m.toString().padStart(2, "0")}min`;
  const d = Math.floor(h / 24);
  return `${d}j ${(h % 24)}h`;
}

function cpuYMax(history: CpuPoint[]): number {
  const max = history.reduce((m, p) => Math.max(m, p.cpuPct, p.mcCpuPct ?? 0), 0);
  return Math.max(20, Math.ceil(max / 20) * 20);
}

function ramYMax(history: RamPoint[]): number {
  const maxMb = history.reduce((m, p) => Math.max(m, p.ramMb, p.mcRamMb ?? 0), 0);
  return Math.max(2, Math.ceil(maxMb / 1024 / 2) * 2) * 1024;
}

function cpuXTicks(now: number): number[] {
  const start = Math.ceil((now - HOUR_MS) / TICK_MS) * TICK_MS;
  const ticks: number[] = [];
  for (let t = start; t <= now; t += TICK_MS) ticks.push(t);
  return ticks;
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

export default function AdminTabs({
  initialServerInfo,
  users,
  announcements,
  invitations,
  lastBackupTs,
  appUrl,
}: {
  initialServerInfo: ServerInfo;
  users: User[];
  announcements: Announcement[];
  invitations: Invitation[];
  lastBackupTs: number | null;
  appUrl: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("monitoring");
  const [serverInfo, setServerInfo] = useState<ServerInfo>(initialServerInfo);
  const [live, setLive] = useState<LiveSnapshot | null>(null);
  const [cpuHistory, setCpuHistory] = useState<CpuPoint[]>([]);
  const [ramHistory, setRamHistory] = useState<RamPoint[]>([]);
  const lastSampleRef = useRef<number>(0);

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

  useEffect(() => {
    if (activeTab !== "monitoring") return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/metrics/current");
        if (res.ok && active) {
          const data: LiveSnapshot = await res.json();
          setLive(data);
          const now = Date.now();
          if (now - lastSampleRef.current >= SAMPLE_MS) {
            lastSampleRef.current = now;
            setCpuHistory(prev => [
              ...prev.filter(p => p.time >= now - HOUR_MS),
              { time: now, cpuPct: data.cpuPct, mcCpuPct: data.mcCpuPct },
            ]);
            setRamHistory(prev => [
              ...prev.filter(p => p.time >= now - HOUR_MS),
              { time: now, ramMb: data.ramMb, mcRamMb: data.mcRamMb },
            ]);
          }
        }
      } catch {}
      if (active) setTimeout(poll, 1_000);
    };
    poll();
    return () => { active = false; };
  }, [activeTab]);

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

        {/* ── Monitoring ── */}
        {activeTab === "monitoring" && (() => {
          const now = Date.now();
          const domain: [number, number] = [now - HOUR_MS, now];
          const ticks = cpuXTicks(now);
          const hasMc = live?.mcCpuPct != null;
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
                  <span style={{ fontFamily: T.mono, fontSize: 12, color: lastBackupTs ? T.textSub : T.muted }}><BackupDate ts={lastBackupTs} /></span>
                </StatCard>
              </div>

              {/* Cards métriques live */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* CPU */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 12, letterSpacing: ".08em" }}>CPU</div>
                  <div style={{ display: "flex", marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>SERVEUR</div>
                      <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.grass }}>
                        {live ? `${live.cpuPct.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    {hasMc && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>MINECRAFT</div>
                        <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.copper }}>
                          {`${live!.mcCpuPct!.toFixed(1)}%`}
                        </span>
                      </div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={cpuHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g-cpu-host" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.grass} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={T.grass} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g-cpu-mc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.copper} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={T.copper} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" type="number" scale="time" domain={domain} ticks={ticks} tickFormatter={fmtTick} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, cpuYMax(cpuHistory)]} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", fontFamily: T.mono, fontSize: 11 }}>
                              <div style={{ color: T.muted, marginBottom: 4 }}>{fmtTick(label as number)}</div>
                              {payload.map((p) => (
                                <div key={p.dataKey as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block" }} />
                                  <span style={{ color: T.textSub }}>{p.dataKey === "cpuPct" ? "Serveur" : "Minecraft"}</span>
                                  <span style={{ color: T.text, fontWeight: 700 }}>{`${(p.value as number).toFixed(1)}%`}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="cpuPct" stroke={T.grass} strokeWidth={1.5} fill="url(#g-cpu-host)" dot={false} isAnimationActive={false} connectNulls />
                      {hasMc && <Area type="monotone" dataKey="mcCpuPct" stroke={T.copper} strokeWidth={1.5} fill="url(#g-cpu-mc)" dot={false} isAnimationActive={false} connectNulls />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* RAM */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 12, letterSpacing: ".08em" }}>RAM</div>
                  <div style={{ display: "flex", marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>SERVEUR</div>
                      <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.grass }}>
                        {live ? `${(live.ramMb / 1024).toFixed(1)} / ${Math.round(live.ramTotalMb / 1024)} Go` : "—"}
                      </span>
                    </div>
                    {live?.mcRamMb != null && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>MINECRAFT</div>
                        <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.copper }}>
                          {live.mcRamTotalMb != null
                            ? `${(live.mcRamMb / 1024).toFixed(1)} / ${Math.round(live.mcRamTotalMb / 1024)} Go`
                            : `${(live.mcRamMb / 1024).toFixed(1)} Go`}
                        </span>
                      </div>
                    )}
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={ramHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g-ram-host" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.grass} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={T.grass} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="g-ram-mc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={T.copper} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={T.copper} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" type="number" scale="time" domain={domain} ticks={ticks} tickFormatter={fmtTick} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, ramYMax(ramHistory)]} tick={{ fontFamily: T.mono, fontSize: 9, fill: T.muted }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1024)} Go`} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", fontFamily: T.mono, fontSize: 11 }}>
                              <div style={{ color: T.muted, marginBottom: 4 }}>{fmtTick(label as number)}</div>
                              {payload.map((p) => (
                                <div key={p.dataKey as string} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0, display: "inline-block" }} />
                                  <span style={{ color: T.textSub }}>{p.dataKey === "ramMb" ? "Serveur" : "Minecraft"}</span>
                                  <span style={{ color: T.text, fontWeight: 700 }}>{`${Math.round(p.value as number)} Mo`}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="ramMb" stroke={T.grass} strokeWidth={1.5} fill="url(#g-ram-host)" dot={false} isAnimationActive={false} connectNulls />
                      {hasMc && <Area type="monotone" dataKey="mcRamMb" stroke={T.copper} strokeWidth={1.5} fill="url(#g-ram-mc)" dot={false} isAnimationActive={false} connectNulls />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Disque + Uptime */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 8, letterSpacing: ".08em" }}>STOCKAGE</div>
                  <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.text }}>
                    {live ? `${live.diskGb} / ${live.diskTotalGb} Go` : "—"}
                  </span>
                  {live && (
                    <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, width: `${(live.diskGb / live.diskTotalGb) * 100}%`, background: live.diskGb / live.diskTotalGb > 0.85 ? "#F87171" : live.diskGb / live.diskTotalGb > 0.65 ? "#FBBF24" : T.grass }} />
                    </div>
                  )}
                </div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 20px" }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 8, letterSpacing: ".08em" }}>UPTIME</div>
                  <div style={{ display: "flex" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>HETZNER</div>
                      <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.grass }}>
                        {live ? fmtUptime(live.uptimeSeconds) : "—"}
                      </span>
                    </div>
                    {hasMc && (
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, marginBottom: 4 }}>MINECRAFT</div>
                        <span style={{ fontFamily: T.mono, fontSize: 22, fontWeight: 700, whiteSpace: "nowrap", color: T.copper }}>
                          {live?.mcUptimeSeconds != null ? fmtUptime(live.mcUptimeSeconds) : "—"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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

        {/* ── Mods ── */}
        {activeTab === "mods" && <ModsTab />}
      </div>
    </div>
  );
}
