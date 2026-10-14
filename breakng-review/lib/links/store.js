import { eq, sql, desc } from 'drizzle-orm';
import { db, linkPageConfig, linkClicks, linkSubscribers } from '@/db';
import { DEFAULT_CONFIG } from './defaults';

const CONFIG_ID = 'main';

export async function getConfig() {
  const rows = await db.select().from(linkPageConfig).where(eq(linkPageConfig.id, CONFIG_ID)).limit(1);
  return rows[0] ? { ...DEFAULT_CONFIG, ...rows[0].data } : DEFAULT_CONFIG;
}

export async function saveConfig(config) {
  await db
    .insert(linkPageConfig)
    .values({ id: CONFIG_ID, data: config })
    .onConflictDoUpdate({ target: linkPageConfig.id, set: { data: config, updatedAt: new Date() } });
}

export async function addClick(blockId) {
  await db
    .insert(linkClicks)
    .values({ blockId, count: 1 })
    .onConflictDoUpdate({ target: linkClicks.blockId, set: { count: sql`${linkClicks.count} + 1` } });
}

export async function getClicks() {
  const rows = await db.select().from(linkClicks);
  return Object.fromEntries(rows.map((r) => [r.blockId, r.count]));
}

export async function addSubscriber(email) {
  await db.insert(linkSubscribers).values({ email }).onConflictDoNothing();
}

export async function getSubscribers() {
  const rows = await db.select().from(linkSubscribers).orderBy(desc(linkSubscribers.createdAt)).limit(1000);
  return rows.map((r) => ({ email: r.email, at: r.createdAt.toISOString() }));
}
