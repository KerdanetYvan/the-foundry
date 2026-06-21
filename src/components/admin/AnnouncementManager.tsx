"use client";

import { useRef, useState, useTransition } from "react";
import { marked } from "marked";
import { T } from "@/lib/tokens";
import { preprocessMarkdown } from "@/lib/markdown";
import { createAnnouncement, deleteAnnouncement } from "@/lib/actions/announcements";

interface Announcement {
  id: number;
  content: string;
  createdAt: string;
}

type Mode = "markdown" | "preview";

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const btn = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      style={{
        padding: "5px 14px",
        fontFamily: T.mono,
        fontSize: 12,
        border: "none",
        borderRadius: 5,
        cursor: "pointer",
        background: mode === m ? T.surface : "transparent",
        color: mode === m ? T.text : T.muted,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
  return (
    <div style={{ display: "inline-flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 7, padding: 2, gap: 2 }}>
      {btn("markdown", "Markdown")}
      {btn("preview", "Aperçu")}
    </div>
  );
}

export default function AnnouncementManager({ items }: { items: Announcement[] }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>("markdown");
  const ref = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  function handleModeChange(m: Mode) {
    setMode(m);
    if (m === "preview") {
      const content = ref.current?.value ?? "";
      setPreviewHtml(marked.parse(preprocessMarkdown(content), { breaks: true }) as string);
    }
  }

  function handleCreate() {
    const content = ref.current?.value.trim() ?? "";
    if (!content) { setError("Le contenu ne peut pas être vide."); return; }
    setError("");
    startTransition(async () => {
      await createAnnouncement(content);
      if (ref.current) ref.current.value = "";
      setMode("markdown");
    });
  }

  function handleDelete(id: number) {
    startTransition(() => deleteAnnouncement(id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <ModeSwitch mode={mode} onChange={handleModeChange} />
      </div>

      <textarea
        ref={ref}
        rows={5}
        placeholder="Contenu de l'annonce (Markdown supporté)…"
        style={{ display: mode === "markdown" ? "block" : "none", width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", fontFamily: T.mono, fontSize: 13, color: T.text, resize: "vertical", outline: "none", boxSizing: "border-box", marginBottom: 8 }}
      />
      {mode === "preview" && (
        <div
          className="mc-prose"
          dangerouslySetInnerHTML={{ __html: previewHtml || "<p style='color:#666'>Rien à afficher.</p>" }}
          style={{ minHeight: 120, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px", fontFamily: T.sans, fontWeight: 300, fontSize: 14, lineHeight: 1.75, color: T.textSub, marginBottom: 8, boxSizing: "border-box" }}
        />
      )}

      {error && <p style={{ fontFamily: T.sans, fontSize: 12, color: "#f87171", marginBottom: 8 }}>{error}</p>}

      <button
        onClick={handleCreate}
        disabled={pending}
        style={{ background: T.grass, border: "none", borderRadius: 6, padding: "10px 20px", fontFamily: T.sans, fontWeight: 600, fontSize: 13, color: "#fff", cursor: pending ? "not-allowed" : "pointer", opacity: pending ? 0.6 : 1, marginBottom: 24 }}
      >
        Publier
      </button>

      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((a) => (
            <div key={a.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <pre style={{ fontFamily: T.mono, fontSize: 12, color: T.textSub, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1 }}>{a.content}</pre>
              <button
                onClick={() => handleDelete(a.id)}
                disabled={pending}
                style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: 5, padding: "5px 10px", fontFamily: T.sans, fontSize: 12, color: T.muted, cursor: "pointer", flexShrink: 0 }}
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
