import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";

export default async function PlayerLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get("session")?.value;
  const userId = token ? verifySession(token) : null;
  if (!userId) redirect("/login");
  return <>{children}</>;
}
