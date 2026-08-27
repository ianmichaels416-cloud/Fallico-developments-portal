// lib/db.ts
// Direct Postgres connection via the `postgres` package — no Prisma,
// no CLI, no shadow database, no migration engine.
//
// Requires DATABASE_URL in your environment (Neon connection string).

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  prepare: false, // required for Neon's pooled connection (PgBouncer transaction mode)
});
