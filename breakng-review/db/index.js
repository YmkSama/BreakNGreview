const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');
const schema = require('./schema');

// Reuse the pool across hot reloads in dev / across invocations on Vercel.
const globalForDb = globalThis;

const pool =
  globalForDb.__bnt_pg_pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
      ? false
      : { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__bnt_pg_pool = pool;
}

const db = drizzle(pool, { schema });

module.exports = { db, pool, ...schema };
