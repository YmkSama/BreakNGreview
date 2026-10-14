import crypto from "node:crypto";
import { cookies } from "next/headers";

const NAME = "links_admin";
const secret = () => process.env.LINKS_SESSION_SECRET || "dev-secret-change-me";
const sign = (v) => crypto.createHmac("sha256", secret()).update(v).digest("hex");

function safeEq(a, b) {
  const ba = Buffer.from(a), bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function checkPassword(input) {
  const pw = process.env.LINKS_ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? null : "admin");
  if (!pw || typeof input !== "string") return false;
  // hash both so lengths match and comparison is constant time
  return safeEq(sign("pw:" + input), sign("pw:" + pw));
}

export async function setSession() {
  const exp = String(Date.now() + 7 * 864e5);
  (await cookies()).set(NAME, `${exp}.${sign(exp)}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/links", maxAge: 7 * 86400,
  });
}

export async function clearSession() {
  (await cookies()).delete({ name: NAME, path: "/links" });
}

export async function isAdmin() {
  const v = (await cookies()).get(NAME)?.value;
  if (!v) return false;
  const [exp, sig] = v.split(".");
  return !!sig && Number(exp) > Date.now() && safeEq(sig, sign(exp));
}
