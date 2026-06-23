"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { sendCommand } from "@/lib/actions/minecraft";
import { T } from "@/lib/tokens";

type Line = { id: number; text: string; color: string };

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
  const outputRef = useRef<HTMLDivElement>(null);
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd || pending) return;
    setInput("");
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

  return (
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
          }}
        >
          CONSOLE MINECRAFT
        </span>
      </div>

      {/* Sortie du log */}
      <div
        ref={outputRef}
        onScroll={handleScroll}
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
          lines.map((l) => (
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
  );
}
