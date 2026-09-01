import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL não configurada. Copie .env.example para .env.local e ajuste.",
  );
}

// `max: 1` e `prepare: false` são obrigatórios quando o destino é um pooler em
// transaction mode (Supavisor/PgBouncer), que não suporta prepared statements.
// Em Postgres local o custo é irrelevante, então mantemos igual nos dois casos.
const client = postgres(url, { max: 1, prepare: false });

export const db = drizzle(client, { schema });
export { schema };
