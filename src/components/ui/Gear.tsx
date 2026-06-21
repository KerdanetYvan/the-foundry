interface GearProps {
  size: number;
  color: string;
  opacity?: number;
  teeth?: number;
}

export default function Gear({ size, color, opacity = 0.08, teeth = 12 }: GearProps) {
  const c = size / 2;
  const oR = size * 0.41;
  const iR = size * 0.31;
  const hR = size * 0.1;
  const tW = size * 0.072;
  const tH = size * 0.093;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{ opacity }}
    >
      <circle cx={c} cy={c} r={oR + tH + 10} fill="none" stroke={color} strokeWidth=".5" strokeDasharray="5 10" />
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={c - tW / 2}
          y={c - oR - tH}
          width={tW}
          height={tH}
          rx="2"
          fill={color}
          transform={`rotate(${(i / teeth) * 360}, ${c}, ${c})`}
        />
      ))}
      <circle cx={c} cy={c} r={oR} fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx={c} cy={c} r={iR} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={c} cy={c} r={hR} fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.5" />
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={c + Math.cos(a) * (hR + 2)}
            y1={c + Math.sin(a) * (hR + 2)}
            x2={c + Math.cos(a) * (iR - 2)}
            y2={c + Math.sin(a) * (iR - 2)}
            stroke={color}
            strokeWidth="1"
          />
        );
      })}
      <circle cx={c} cy={c} r={size * 0.022} fill={color} fillOpacity=".55" />
    </svg>
  );
}
