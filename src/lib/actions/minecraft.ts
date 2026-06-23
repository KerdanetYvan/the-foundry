"use server";

import { rconCommand } from "@/lib/rcon";

export async function sendCommand(command: string): Promise<string> {
  const cmd = command.trim();
  if (!cmd) return "";
  try {
    const result = await rconCommand(cmd);
    return result || "(commande exécutée)";
  } catch (err) {
    return `Erreur RCON : ${err instanceof Error ? err.message : "connexion échouée"}`;
  }
}
