import { addSubscriber } from "@/lib/links/store";

export async function POST(req) {
  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== "string" || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
    return Response.json({ error: "Enter a valid email" }, { status: 400 });
  await addSubscriber(email.trim().toLowerCase());
  return Response.json({ ok: true });
}
