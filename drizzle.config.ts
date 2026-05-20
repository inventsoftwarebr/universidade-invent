import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * drizzle-kit roda de processo longo (CI ou laptop), então usa DIRECT_URL
 * (porta 5432). Código de runtime NUNCA usa essa URL — ver db/client.ts.
 */
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
