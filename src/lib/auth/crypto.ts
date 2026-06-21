import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, storedKey] = stored.split(":");
  if (!salt || !storedKey) return false;
  const key = (await scryptAsync(password, salt, 64)) as Buffer;
  try {
    return timingSafeEqual(Buffer.from(storedKey, "hex"), key);
  } catch {
    return false;
  }
}
