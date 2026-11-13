import postgres from "postgres";

// One shared connection pool. DATABASE_URL comes from Supabase
// (Project Settings → Database → Connection string → "Transaction pooler").
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export const sql =
  globalForDb.sql ??
  postgres(process.env.DATABASE_URL ?? "postgres://postgres@localhost:5432/eventkit", {
    prepare: false, // required for Supabase's transaction pooler
    max: 5,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
