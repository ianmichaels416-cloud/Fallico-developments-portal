// lib/db.ts
// Direct Postgres connection via the `postgres` package — no Prisma,
// no CLI, no shadow database, no migration engine. For an app this
// small (3 tables, one purpose), this is simpler and has nothing that
// can get stuck the way Prisma's CLI did on the other project.
//
// Requires DATABASE_URL in your environment (Neon connection string).

import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
});
