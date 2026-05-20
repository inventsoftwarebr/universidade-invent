/**
 * Aplica migrations Drizzle e, em seguida, db/rls.sql (idempotente).
 *
 * Usar em CI/local (não em serverless). Roda contra DIRECT_URL (porta 5432).
 *
 * Uso:
 *   pnpm db:migrate
 */
import { config as loadEnv } from "dotenv";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DIRECT_URL (ou DATABASE_URL) precisa estar setado.");
  }

  const sql = postgres(url, { max: 1 });

  try {
    console.warn("→ Aplicando migrations Drizzle...");
    const db = drizzle(sql);
    await migrate(db, { migrationsFolder: "./db/migrations" });
    console.warn("✓ Migrations aplicadas.");

    console.warn("→ Aplicando db/rls.sql...");
    const rlsSql = await readFile(resolve(process.cwd(), "db/rls.sql"), "utf8");
    await sql.unsafe(rlsSql);
    console.warn("✓ RLS, helpers e trigger aplicados.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
