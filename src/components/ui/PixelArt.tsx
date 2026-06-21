interface PixelArtProps {
  art: string[];
  palette: Record<string, string>;
  cell?: number;
}

export default function PixelArt({ art, palette, cell = 10 }: PixelArtProps) {
  const rows = art.map((r) => [...r]);
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));

  return (
    <svg
      width={w * cell}
      height={h * cell}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      style={{ imageRendering: "pixelated", display: "block" }}
    >
      {rows.map((row, y) =>
        row.map((c, x) =>
          c !== "." ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={palette[c] ?? "#fff"}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
