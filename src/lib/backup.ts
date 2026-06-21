import { readdirSync } from "fs";

export function getLastBackupDate(): Date | null {
  try {
    const files = readdirSync("/backups");
    const dates = files
      .map((f) => {
        const m = f.match(/^world_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})\.tar\.gz$/);
        if (!m) return null;
        return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`);
      })
      .filter((d): d is Date => d !== null);
    if (!dates.length) return null;
    return dates.reduce((a, b) => (a > b ? a : b));
  } catch {
    return null;
  }
}
