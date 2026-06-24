import { readdirSync } from "fs";

export function getLastBackupDate(): Date | null {
  try {
    const files = readdirSync("/backups");
    const dates = files
      .map((f) => {
        const m = f.match(/^world_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.tar\.gz$/);
        if (!m) return null;
        // Parse as UTC first, then compute Helsinki's actual offset at that moment
        const utc = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
        const hFmt = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Helsinki", hour: "2-digit", hour12: false });
        const helsinkiH = parseInt(hFmt.format(utc), 10) % 24;
        const offsetH = ((helsinkiH - utc.getUTCHours()) + 24) % 24;
        return new Date(utc.getTime() - offsetH * 3_600_000);
      })
      .filter((d): d is Date => d !== null);
    if (!dates.length) return null;
    return dates.reduce((a, b) => (a > b ? a : b));
  } catch {
    return null;
  }
}
