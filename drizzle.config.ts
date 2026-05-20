import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit roda em processo longo (CI/laptop), então usa DIRECT_URL
 * (porta 5432). Código de runtime NUNCA usa essa URL — ver db/client.ts.
 *
 * Carrega .env.local primeiro (override local do dev), depois .env.
 */
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
