import { isAdmin } from "@/lib/links/auth";
import { getConfig, saveConfig } from "@/lib/links/store";
import { revalidatePath } from "next/cache";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await getConfig());
}

export async function PUT(req) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const c = await req.json().catch(() => null);
  if (!c || !Array.isArray(c.blocks) || !c.brand || !c.theme) return Response.json({ error: "Bad config" }, { status: 400 });
  try {
    await saveConfig(c);
  } catch (e) {
    return Response.json({ error: "Could not save: " + e.message }, { status: 500 });
  }
  revalidatePath("/links");
  return Response.json({ ok: true });
}
