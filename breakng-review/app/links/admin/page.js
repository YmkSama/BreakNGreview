import { isAdmin } from "@/lib/links/auth";
import { getConfig } from "@/lib/links/store";
import Editor from "@/components/links/Editor";
import Login from "@/components/links/Login";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin() {
  if (!(await isAdmin())) return <Login />;
  return <Editor initial={await getConfig()} persistent />;
}
