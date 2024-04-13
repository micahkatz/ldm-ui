import './lib/config'
import type { Config } from "drizzle-kit";
export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.POSTGRES_PRISMA_URL!,
    // database: process.env.POSTGRES_DATABASE!
  }
} satisfies Config;