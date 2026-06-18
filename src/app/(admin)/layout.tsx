import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const secret = headersList.get("x-admin-secret");

  if (secret !== process.env.ADMIN_SECRET) {
    redirect("/");
  }

  return <>{children}</>;
}
