import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase Postgres connection string, e.g.:
// postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
// Get this from: Supabase Dashboard -> Project Settings -> Database -> Connection string (URI)
// Use the "Transaction" pooler (port 6543) for serverless/Vercel deployments.
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is missing. Set it to your Supabase Postgres connection string (see README.md)."
  );
}

// `prepare: false` is required when using Supabase's transaction pooler (port 6543),
// which does not support prepared statements.
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
