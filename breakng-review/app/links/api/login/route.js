import { checkPassword, setSession } from "@/lib/links/auth";

const fails = globalThis.__fails || (globalThis.__fails = new Map());

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const f = fails.get(ip) || { n: 0, t: Date.now() };
  if (Date.now() - f.t > 15 * 60e3) { f.n = 0; f.t = Date.now(); }
  if (f.n >= 8) return Response.json({ error: "Too many attempts. Try later." }, { status: 429 });
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password)) {
    fails.set(ip, { n: f.n + 1, t: f.t });
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  fails.delete(ip);
  await setSession();
  return Response.json({ ok: true });
}
