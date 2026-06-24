"use client";

export default function BackupDate({ ts }: { ts: number | null }) {
  if (ts === null) return <>Aucune info</>;
  return (
    <>
      {new Date(ts).toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      })}
    </>
  );
}
