import { T } from "@/lib/tokens";

interface GrassStripProps {
  px?: number;
}

export default function GrassStrip({ px = 20 }: GrassStripProps) {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: px * 3, overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          backgroundImage: `linear-gradient(rgba(0,0,0,.22) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,.18) 1px, transparent 1px)`,
          backgroundSize: `${px}px ${px}px`,
        }}
      />
      <div style={{ height: px, background: T.grass }} />
      <div style={{ height: px, background: T.dirt }} />
      <div style={{ height: px, background: T.dirtDark }} />
    </div>
  );
}
