import { config } from "dotenv";

// Next.js carrega .env.local sozinho; os scripts de CLI não. Mesma ordem de
// precedência do Next: .env.local sobrescreve .env.
config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
