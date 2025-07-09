import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Netlify environment variables
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool: Pool | null = null;
let db: any = null;

if (DATABASE_URL) {
  console.log("✅ PostgreSQL connecting for Netlify deployment");
  
  // Configure for Netlify/Vercel style PostgreSQL
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = drizzle({ client: pool, schema });
} else {
  console.log("⚠️ Running in demo mode - no DATABASE_URL found");
  pool = null;
  db = null;
}

export { pool, db, DATABASE_URL as hasDatabaseUrl };