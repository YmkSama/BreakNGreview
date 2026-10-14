import { getConfig, addClick } from "@/lib/links/store";

export async function GET(req, { params }) {
  const { id } = await params;
  const cfg = await getConfig();
  let target = null;
  const b = cfg.blocks.find((x) => x.id === id);
  if (b && b.url) target = b.url;
  if (id.startsWith("social-")) {
    const s = cfg.socials[Number(id.slice(7))];
    if (s) target = s.type === "email" ? `mailto:${s.url}` : s.url;
  }
  if (!target || !/^(https?:|mailto:)/i.test(target)) return new Response("Not found", { status: 404 });
  await addClick(id).catch(() => {});
  return Response.redirect(target, 302);
}
