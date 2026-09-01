import "./env";
import postgres from "postgres";

async function main(): Promise<void> {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL não configurada.");

  const client = postgres(url, { max: 1 });
  await client.unsafe("drop schema public cascade; create schema public;");
  await client.unsafe("drop schema if exists drizzle cascade;");
  await client.end();
  console.log("Schema zerado.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
