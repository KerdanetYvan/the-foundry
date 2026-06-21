"use client";

import { useState } from "react";
import { T } from "@/lib/tokens";

interface CopyButtonProps {
  address: string;
}

export default function CopyButton({ address }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <button
      className="mc-copy"
      onClick={handleCopy}
      style={{
        background: T.grassDim,
        border: `1px solid rgba(93,158,64,0.32)`,
        borderRadius: 6,
        padding: "13px 30px",
        fontFamily: T.sans,
        fontWeight: 600,
        fontSize: 14,
        letterSpacing: ".08em",
        color: copied ? T.text : T.grass,
        transition: "background .15s",
      }}
    >
      {copied ? "✓  Copié !" : "Copier l'adresse"}
    </button>
  );
}
