import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
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
 *
 * Lazy: só conecta quando o primeiro query roda. Evita explodir o build
 * quando DATABASE_URL não está setado em CI sem banco.
 */

type DB = PostgresJsDatabase<typeof schema>;

let _sql: Sql | undefined;
let _db: DB | undefined;

function getDb(): DB {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL não está setado. Configure a URL do pooler Supabase (porta 6543) em .env.local.",
    );
  }
  _sql = postgres(url, { max: 1, prepare: false });
  _db = drizzle(_sql, { schema });
  return _db;
}

/**
 * Proxy que delega para o client real lazy-instanciado.
 * Componentes podem importar `db` no topo do arquivo sem detonar o build.
 */
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const realDb = getDb();
    const value = realDb[prop as keyof DB];
    return typeof value === "function" ? value.bind(realDb) : value;
  },
});

export type { DB };
