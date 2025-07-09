import { defineConfig } from "drizzle-kit";

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL not found, using demo mode");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL || "postgresql://demo:demo@localhost:5432/demo",
  },
});
