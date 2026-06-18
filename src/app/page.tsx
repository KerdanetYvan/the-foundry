import { redirect } from "next/navigation";

// Root redirects to public homepage
export default function RootPage() {
  redirect("/home");
}
