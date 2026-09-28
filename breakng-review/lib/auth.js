const { cookies } = require('next/headers');
const { eq } = require('drizzle-orm');
const { db, users } = require('@/db');

const COOKIE_NAME = 'bnt_uid';

async function getCurrentUser() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] || null;
}

async function setCurrentUser(id) {
  const store = await cookies();
  store.set(COOKIE_NAME, String(id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function clearCurrentUser() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

module.exports = { getCurrentUser, setCurrentUser, clearCurrentUser, COOKIE_NAME };
