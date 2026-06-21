"use client";

import { useMemo } from "react";

export default function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: ((Math.sin(i * 13.7 + 2) * 0.5 + 0.5) * 98).toFixed(1),
        y: ((Math.sin(i * 7.3 + 1) * 0.5 + 0.5) * 75).toFixed(1),
        s: i % 7 === 0 ? 0.4 : 0.25,
        o: (0.3 + (i % 5) * 0.14).toFixed(2),
      })),
    [],
  );

  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="none"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <rect x="82%" y="7%" width="5%" height="5%" fill="#F0EED0" fillOpacity=".9" />
      <rect x="83%" y="8%" width="3%" height="3%" fill="#FAFAEA" fillOpacity=".4" />
      {stars.map((s, i) => (
        <rect
          key={i}
          x={s.x + "%"}
          y={s.y + "%"}
          width={s.s + "%"}
          height={s.s + "%"}
          fill="white"
          fillOpacity={s.o}
        />
      ))}
    </svg>
  );
}
