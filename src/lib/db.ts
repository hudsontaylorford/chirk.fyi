import postgres from "postgres";

// One shared connection pool. DATABASE_URL is set by Vercel's Neon integration
// (Neon's pooled connection string).
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/eventkit", {
    prepare: false, // required by pooled (pgbouncer-style) connections
    max: 5,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
