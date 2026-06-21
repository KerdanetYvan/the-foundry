import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifySession } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) redirect("/login");

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.role !== "admin") redirect("/login");

  return <>{children}</>;
}
