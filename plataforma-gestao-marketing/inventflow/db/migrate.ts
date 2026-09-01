import "./env";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main(): Promise<void> {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL não configurada.");

  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "./db/migrations" });
  await client.end();
  console.log("Migrações aplicadas.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
