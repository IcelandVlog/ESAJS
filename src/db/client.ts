import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local dev: writes to a file (school.db) in the project root.
// Production (Vercel): set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN env vars
// to a free Turso database (https://turso.tech) — see README.md.
const url = process.env.TURSO_DATABASE_URL || "file:./school.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export const client = createClient({ url, authToken });
export const db = drizzle(client, { schema });
