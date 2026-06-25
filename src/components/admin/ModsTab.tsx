"use client";

import { useState, useEffect, useRef } from "react";
import { T } from "@/lib/tokens";

type Mod = { name: string; size: number };

type RestartPhase =
  | { phase: "idle" }
  | { phase: "checking" }
  | { phase: "warning" }
  | { phase: "countdown"; seconds: number }
  | { phase: "saving" }
  | { phase: "stopping" }
  | { phase: "starting" }
  | { phase: "done" }
  | { phase: "error"; message: string };

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function phaseLabel(r: RestartPhase): string {
  switch (r.phase) {
    case "checking":  return "Vérification des joueurs…";
    case "warning":   return "Avertissement aux joueurs…";
    case "countdown": return `Redémarrage dans ${r.seconds}s…`;
    case "saving":    return "Sauvegarde du serveur…";
    case "stopping":  return "Arrêt du serveur…";
    case "starting":  return "Démarrage en cours…";
    default:          return "";
  }
}

const Spinner = () => (
  <span style={{
    display: "inline-block", width: 10, height: 10,
    border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff",
    borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0,
  }} />
);

export default function ModsTab() {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [restart, setRestart] = useState<RestartPhase>({ phase: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/mods");
      if (res.ok) setMods(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (!file.name.endsWith(".jar")) {
      setUploadError("Seuls les fichiers .jar sont acceptés.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/mods", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setUploadError(body.error ?? "Upload échoué.");
      } else {
        await load();
        setDirty(true);
      }
    } catch {
      setUploadError("Upload échoué.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(name: string) {
    if (confirmDelete !== name) { setConfirmDelete(name); return; }
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/mods/${encodeURIComponent(name)}`, { method: "DELETE" });
      if (res.ok) { setMods((prev) => prev.filter((m) => m.name !== name)); setDirty(true); }
    } catch {}
  }

  async function handleRestart() {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      const res = await fetch("/api/mods/restart", { method: "POST" });
      if (!res.ok || !res.body) {
        setRestart({ phase: "error", message: "Impossible de lancer le redémarrage." });
        return;
      }

      reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as RestartPhase;
            setRestart(data);
            if (data.phase === "done") {
              setDirty(false);
              setTimeout(() => setRestart({ phase: "idle" }), 6000);
              return;
            }
            if (data.phase === "error") return;
          } catch {}
        }
      }
    } catch (err) {
      setRestart({ phase: "error", message: err instanceof Error ? err.message : "Erreur inattendue." });
    } finally {
      reader?.cancel().catch(() => {});
    }
  }

  const isRestarting =
    restart.phase === "checking" ||
    restart.phase === "warning" ||
    restart.phase === "countdown" ||
    restart.phase === "saving" ||
    restart.phase === "stopping" ||
    restart.phase === "starting";

  const showYellowBanner = dirty && restart.phase !== "done" && restart.phase !== "error";

  return (
    <div>
      {/* En-tête */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: T.sans, fontSize: 15, fontWeight: 600, color: T.text }}>Mods installés</span>
          {!loading && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "2px 8px" }}>
              {mods.length}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {uploading && <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>Envoi en cours…</span>}
          <input ref={fileInputRef} type="file" accept=".jar" style={{ display: "none" }} onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRestarting}
            style={{ background: T.grass, border: "none", borderRadius: 6, padding: "8px 16px", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#fff", cursor: (uploading || isRestarting) ? "not-allowed" : "pointer", opacity: (uploading || isRestarting) ? 0.6 : 1 }}
          >
            + Ajouter un mod
          </button>
        </div>
      </div>

      {/* Erreur upload */}
      {uploadError && (
        <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 16, fontFamily: T.sans, fontSize: 12, color: "#F87171" }}>
          {uploadError}
        </div>
      )}

      {/* ── Bannière jaune : redémarrage requis / en cours ── */}
      {showYellowBanner && (
        <div style={{ background: "rgba(212,137,42,0.1)", border: "1px solid rgba(212,137,42,0.35)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: T.copper, flex: 1 }}>
            Les modifications nécessitent un redémarrage du serveur pour être prises en compte.
          </span>
          {isRestarting && (
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.copper, flexShrink: 0 }}>
              {phaseLabel(restart)}
            </span>
          )}
          <button
            onClick={handleRestart}
            disabled={isRestarting}
            style={{ background: T.copper, border: "none", borderRadius: 6, padding: "7px 14px", fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: "#fff", cursor: isRestarting ? "not-allowed" : "pointer", opacity: isRestarting ? 0.8 : 1, display: "flex", alignItems: "center", gap: 7, flexShrink: 0, whiteSpace: "nowrap" }}
          >
            {isRestarting ? <><Spinner /> En cours…</> : "Redémarrer le serveur"}
          </button>
        </div>
      )}

      {/* ── Bannière verte : succès ── */}
      {restart.phase === "done" && (
        <div style={{ background: "rgba(93,158,64,0.1)", border: "1px solid rgba(93,158,64,0.4)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, fontFamily: T.sans, fontSize: 12, color: T.grass }}>
          ✓ Le serveur a été redémarré avec succès. Les mods sont maintenant actifs.
        </div>
      )}

      {/* ── Bannière rouge : erreur ── */}
      {restart.phase === "error" && (
        <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: T.sans, fontSize: 12, color: "#F87171", flex: 1 }}>⚠ {restart.message}</span>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            style={{ background: "transparent", border: "1px solid #F87171", borderRadius: 4, padding: "5px 12px", fontFamily: T.sans, fontSize: 11, color: "#F87171", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Voir les logs
          </button>
          <button
            onClick={() => setRestart({ phase: "idle" })}
            style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "5px 12px", fontFamily: T.sans, fontSize: 11, color: T.muted, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ── Liste des mods ── */}
      {loading ? (
        <p style={{ fontFamily: T.mono, fontSize: 12, color: T.muted }}>Chargement…</p>
      ) : mods.length === 0 ? (
        <p style={{ fontFamily: T.sans, fontSize: 14, color: T.muted }}>Aucun mod installé.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fichier", "Taille", "Actions"].map((h) => (
                <th key={h} style={{ fontFamily: T.mono, fontSize: 10, color: T.muted, textAlign: "left", paddingBottom: 12, letterSpacing: ".08em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mods.map((mod) => (
              <tr key={mod.name} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: "12px 0", fontFamily: T.mono, fontSize: 13, color: T.text, wordBreak: "break-all" }}>{mod.name}</td>
                <td style={{ padding: "12px 16px 12px 0", fontFamily: T.mono, fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>{fmtSize(mod.size)}</td>
                <td style={{ padding: "12px 0", whiteSpace: "nowrap" }}>
                  {confirmDelete === mod.name ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontFamily: T.sans, fontSize: 12, color: T.muted }}>Confirmer ?</span>
                      <button onClick={() => handleDelete(mod.name)} style={{ background: "transparent", border: "1px solid #F87171", borderRadius: 4, padding: "4px 10px", fontFamily: T.sans, fontSize: 11, color: "#F87171", cursor: "pointer" }}>Supprimer</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "4px 10px", fontFamily: T.sans, fontSize: 11, color: T.muted, cursor: "pointer" }}>Annuler</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(mod.name)}
                      disabled={isRestarting}
                      style={{ background: "transparent", border: "1px solid #F87171", borderRadius: 4, padding: "4px 10px", fontFamily: T.sans, fontSize: 11, color: "#F87171", cursor: isRestarting ? "not-allowed" : "pointer", opacity: isRestarting ? 0.5 : 1 }}
                    >
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
