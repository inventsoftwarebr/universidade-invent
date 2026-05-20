import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle client para uso em código server-side (Server Components, Server
 * Actions, Route Handlers). Conecta via Supavisor TRANSACTION mode (porta
 * 6543). NUNCA apontar para 5432 em código serverless.
 *
 * Ver CLAUDE.md §1.
 *
 * - max: 1           → uma conexão por instância serverless
 * - prepare: false   → PgBouncer transaction mode não suporta prepared statements
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
});

export const db = drizzle(sql, { schema });
export type DB = typeof db;
