import { clearSession } from "@/lib/links/auth";
export async function POST() { await clearSession(); return Response.json({ ok: true }); }
