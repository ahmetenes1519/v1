// Simplified approach for bolt.new compatibility
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Check if we have database connection
const hasDatabaseUrl = !!process.env.DATABASE_URL;

let pool: Pool | null = null;
let db: any = null;

if (hasDatabaseUrl) {
  console.log("✅ PostgreSQL connecting with DATABASE_URL");
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.log("⚠️ Running in demo mode - no DATABASE_URL found");
  // For bolt.new - we'll handle this in storage layer
  pool = null;
  db = null;
}

export { pool, db, hasDatabaseUrl };
