import { marked } from "marked";
import { T } from "@/lib/tokens";
import { preprocessMarkdown } from "@/lib/markdown";

interface Announcement {
  id: number;
  content: string;
  createdAt: Date;
}

export default async function AnnouncementsSection({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;

  const rendered = await Promise.all(
    items.map(async (a) => ({
      id: a.id,
      html: await marked(preprocessMarkdown(a.content), { breaks: true }),
      date: a.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    }))
  );

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: T.vt, fontSize: 14, letterSpacing: ".15em", color: T.copper, textTransform: "uppercase", marginBottom: 12 }}>
        Annonces
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rendered.map((a) => (
          <div key={a.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 22px" }}>
            <div
              className="mc-prose"
              dangerouslySetInnerHTML={{ __html: a.html }}
              style={{ fontFamily: T.sans, fontWeight: 300, fontSize: 14, lineHeight: 1.75, color: T.textSub }}
            />
            <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, marginTop: 10 }}>{a.date}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
