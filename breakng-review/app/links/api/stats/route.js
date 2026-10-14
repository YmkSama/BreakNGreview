import { isAdmin } from "@/lib/links/auth";
import { getClicks, getSubscribers } from "@/lib/links/store";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ clicks: await getClicks(), subscribers: await getSubscribers(), persistent: true });
}
