"use client";

import { useEffect, useRef, useState } from "react";
import { sendCommand } from "@/lib/actions/minecraft";
import { T } from "@/lib/tokens";

type Line = { id: number; text: string; color: string };
type Cmd = { label: string; cmd: string; auto: boolean; sig: string; desc: string };
type CmdGroup = { label: string; color: string; cmds: Cmd[] };

const CMD_GROUPS: CmdGroup[] = [
  {
    label: "Modération",
    color: "#F87171",
    cmds: [
      { label: "kick",   cmd: "kick ",   auto: false, sig: "kick <joueur> [raison]",      desc: "Expulse un joueur du serveur. Il peut revenir immédiatement — utile pour interrompre un comportement sans sanction permanente." },
      { label: "ban",    cmd: "ban ",    auto: false, sig: "ban <joueur> [raison]",        desc: "Bannit définitivement un joueur par son pseudo. Il ne pourra plus se connecter tant que le ban n'est pas levé avec pardon." },
      { label: "ban-ip", cmd: "ban-ip ", auto: false, sig: "ban-ip <joueur|ip>",           desc: "Bannit l'adresse IP. Bloque aussi les autres comptes Minecraft utilisant la même IP." },
      { label: "pardon", cmd: "pardon ", auto: false, sig: "pardon <joueur>",              desc: "Lève le ban d'un joueur. Il pourra se reconnecter au prochain essai." },
      { label: "op",     cmd: "op ",     auto: false, sig: "op <joueur>",                  desc: "Donne les droits opérateur à un joueur (niveau 4 par défaut). Il pourra utiliser toutes les commandes." },
      { label: "deop",   cmd: "deop ",   auto: false, sig: "deop <joueur>",                desc: "Retire les droits opérateur d'un joueur. Il redevient un joueur normal sans accès aux commandes admin." },
    ],
  },
  {
    label: "Whitelist",
    color: T.copper,
    cmds: [
      { label: "wl add",    cmd: "whitelist add ",    auto: false, sig: "whitelist add <joueur>",    desc: "Ajoute un joueur à la whitelist. Il pourra rejoindre le serveur si la whitelist est activée." },
      { label: "wl remove", cmd: "whitelist remove ", auto: false, sig: "whitelist remove <joueur>", desc: "Retire un joueur de la whitelist. Il sera expulsé au prochain tick s'il est connecté." },
      { label: "wl list",   cmd: "whitelist list",    auto: true,  sig: "whitelist list",            desc: "Affiche tous les joueurs autorisés sur le serveur dans la console." },
      { label: "wl reload", cmd: "whitelist reload",  auto: true,  sig: "whitelist reload",          desc: "Recharge whitelist.json depuis le disque sans redémarrer. Utile après une édition manuelle du fichier." },
    ],
  },
  {
    label: "Communication",
    color: T.grass,
    cmds: [
      { label: "say",      cmd: "say ",                              auto: false, sig: "say <message>",                         desc: "Diffuse un message à tous les joueurs connectés. Affiché avec le préfixe [Server] dans le chat." },
      { label: "tell",     cmd: "tell ",                             auto: false, sig: "tell <joueur> <message>",               desc: "Envoie un message privé à un joueur. Seul lui le voit, préfixé par whisper." },
      { label: "titre @a", cmd: 'title @a title {"text":""}',        auto: false, sig: 'title @a title {"text":"<texte>"}',      desc: "Affiche un grand titre en plein écran à tous les joueurs. Remplace <texte> par le message voulu." },
    ],
  },
  {
    label: "Serveur",
    color: "#94A3B8",
    cmds: [
      { label: "list",     cmd: "list",     auto: true, sig: "list",     desc: "Affiche le nombre de joueurs connectés et leurs pseudos dans la console." },
      { label: "save-all", cmd: "save-all", auto: true, sig: "save-all", desc: "Force une sauvegarde immédiate du monde sur le disque, sans attendre le cycle automatique." },
      { label: "save-off", cmd: "save-off", auto: true, sig: "save-off", desc: "Désactive la sauvegarde automatique. À utiliser avant une copie manuelle du dossier monde pour éviter la corruption." },
      { label: "save-on",  cmd: "save-on",  auto: true, sig: "save-on",  desc: "Réactive la sauvegarde automatique après un save-off." },
      { label: "reload",   cmd: "reload",   auto: true, sig: "reload",   desc: "Recharge les datapacks et les fonctions sans redémarrer le serveur." },
    ],
  },
  {
    label: "Monde",
    color: "#60A5FA",
    cmds: [
      { label: "jour",   cmd: "time set day",    auto: true,  sig: "time set day",        desc: "Passe l'heure du jeu à 1000 (lever du soleil). Affecte tous les joueurs du serveur." },
      { label: "nuit",   cmd: "time set night",  auto: true,  sig: "time set night",      desc: "Passe l'heure du jeu à 13000 (tombée de la nuit). Les monstres peuvent spawner à l'extérieur." },
      { label: "soleil", cmd: "weather clear",   auto: true,  sig: "weather clear",       desc: "Supprime la pluie et l'orage. Le ciel devient dégagé." },
      { label: "pluie",  cmd: "weather rain",    auto: true,  sig: "weather rain",        desc: "Déclenche la pluie. Pas d'éclairs, mais les plantes poussent plus vite." },
      { label: "orage",  cmd: "weather thunder", auto: true,  sig: "weather thunder",     desc: "Déclenche un orage avec éclairs. Attention aux incendies si le feu est activé." },
      { label: "tp",     cmd: "tp ",             auto: false, sig: "tp <joueur> <cible|x y z>", desc: "Téléporte un joueur vers un autre joueur ou vers des coordonnées précises." },
    ],
  },
];

let uid = 0;

function lineColor(raw: string): string {
  const level = raw.match(/\[[\w\s]+\/(WARN|ERROR|FATAL)\]/)?.[1];
  if (level === "WARN") return "#FBBF24";
  if (level === "ERROR" || level === "FATAL") return "#F87171";
  if (raw.includes("joined the game")) return T.grass;
  if (raw.includes("left the game")) return T.muted;
  if (raw.match(/<[^>]+>/)) return T.text; // message chat
  return T.textSub;
}

export default function MinecraftTerminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [hideRcon, setHideRcon] = useState(true);
  const [showCmds, setShowCmds] = useState(false);
  const [tooltip, setTooltip] = useState<{ sig: string; desc: string; color: string; x: number; y: number } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const atBottomRef = useRef(true);

  useEffect(() => {
    const es = new EventSource("/api/logs");
    es.onmessage = (e) => {
      try {
        const raw: string = JSON.parse(e.data);
        setLines((prev) => [
          ...prev.slice(-499),
          { id: uid++, text: raw, color: lineColor(raw) },
        ]);
      } catch {}
    };
    return () => es.close();
  }, []);

  useEffect(() => {
    const el = outputRef.current;
    if (el && atBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [lines]);

  const handleScroll = () => {
    const el = outputRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const execCommand = async (cmd: string) => {
    if (!cmd.trim() || pending) return;
    setPending(true);
    setLines((prev) => [
      ...prev.slice(-499),
      { id: uid++, text: `> ${cmd}`, color: T.grass },
    ]);
    try {
      const resp = await sendCommand(cmd);
      if (resp) {
        setLines((prev) => [
          ...prev.slice(-499),
          { id: uid++, text: `← ${resp}`, color: T.copper },
        ]);
      }
    } finally {
      setPending(false);
    }
  };

  const handleCmdClick = (c: Cmd) => {
    if (c.auto) {
      execCommand(c.cmd);
    } else {
      setInput(c.cmd);
      setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }, 0);
    }
  };

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    setInput("");
    await execCommand(cmd);
  };

  return (
    <>
    {tooltip && (
      <div
        style={{
          position: "fixed",
          top: tooltip.y + 16,
          left: tooltip.x + 8,
          zIndex: 9999,
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: 6,
          overflow: "hidden",
          maxWidth: 300,
          pointerEvents: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ background: T.bgDeep, padding: "6px 12px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontFamily: T.mono, fontSize: 11, color: tooltip.color }}>
            {tooltip.sig}
          </span>
        </div>
        <div style={{ padding: "8px 12px" }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.textSub, lineHeight: 1.65, display: "block" }}>
            {tooltip.desc}
          </span>
        </div>
      </div>
    )}
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: "hidden",
        marginTop: 24,
      }}
    >
      {/* En-tête */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: T.grass,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 11,
            color: T.muted,
            letterSpacing: ".08em",
            flex: 1,
          }}
        >
          CONSOLE MINECRAFT
        </span>
        <button
          onClick={() => setShowCmds(v => !v)}
          style={{ background: showCmds ? T.grassDim : "transparent", border: `1px solid ${showCmds ? T.grass : T.border}`, borderRadius: 4, padding: "3px 10px", fontFamily: T.mono, fontSize: 10, color: showCmds ? T.grass : T.textSub, cursor: "pointer", letterSpacing: ".06em" }}
        >
          COMMANDES
        </button>
        <button
          onClick={() => setHideRcon(v => !v)}
          style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, padding: "3px 10px", fontFamily: T.mono, fontSize: 10, color: hideRcon ? T.muted : "#FBBF24", cursor: "pointer", letterSpacing: ".06em" }}
        >
          {hideRcon ? "RCON masqué" : "RCON visible"}
        </button>
      </div>

      {/* Panneau commandes rapides */}
      {showCmds && (
        <div
          style={{
            background: T.card,
            borderBottom: `1px solid ${T.border}`,
            padding: "12px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {CMD_GROUPS.map((group) => (
            <div key={group.label} style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
              <span style={{ fontFamily: T.mono, fontSize: 9, color: group.color, letterSpacing: ".1em", textTransform: "uppercase" }}>
                {group.label}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {group.cmds.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => handleCmdClick(c)}
                    disabled={pending}
                    onMouseEnter={(e) => setTooltip({ sig: c.sig, desc: c.desc, color: group.color, x: e.clientX, y: e.clientY })}
                    onMouseMove={(e) => setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      background: "transparent",
                      border: `1px solid ${T.border}`,
                      borderRadius: 3,
                      padding: "2px 8px",
                      fontFamily: T.mono,
                      fontSize: 10,
                      color: pending ? T.muted : group.color,
                      cursor: pending ? "default" : "pointer",
                      opacity: pending ? 0.5 : 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {c.auto && (
                      <span style={{ fontSize: 9, opacity: 0.7 }}>⚡</span>
                    )}
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sortie du log */}
      <div
        ref={outputRef}
        onScroll={handleScroll}
        className="terminal-scroll"
        style={{
          height: 320,
          overflowY: "auto",
          padding: "12px 16px",
          background: T.bgDeep,
          fontFamily: T.mono,
          fontSize: 11,
          lineHeight: 1.75,
        }}
      >
        {lines.length === 0 ? (
          <span style={{ color: T.muted }}>En attente des logs…</span>
        ) : (
          lines.filter(l => !hideRcon || !l.text.includes("[RCON")).map((l) => (
            <div
              key={l.id}
              style={{ color: l.color, whiteSpace: "pre-wrap", wordBreak: "break-all" }}
            >
              {l.text}
            </div>
          ))
        )}
      </div>

      {/* Input commande */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          borderTop: `1px solid ${T.border}`,
          background: T.card,
        }}
      >
        <span
          style={{
            padding: "0 12px",
            fontFamily: T.mono,
            fontSize: 13,
            color: T.grass,
            userSelect: "none",
          }}
        >
          &gt;
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="say Hello, tp @a ~ ~10 ~, …"
          disabled={pending}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: T.mono,
            fontSize: 12,
            color: T.text,
            padding: "11px 0",
            opacity: pending ? 0.5 : 1,
          }}
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          style={{
            background: "transparent",
            border: "none",
            padding: "0 16px",
            height: "100%",
            fontFamily: T.mono,
            fontSize: 11,
            color: pending || !input.trim() ? T.muted : T.grass,
            cursor: pending || !input.trim() ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {pending ? "…" : "Envoyer"}
        </button>
      </form>
    </div>
    </>
  );
}
