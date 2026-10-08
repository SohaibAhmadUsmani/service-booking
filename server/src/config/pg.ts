import { Pool, type QueryResult, type QueryResultRow } from "pg";
import { env } from "./env";
import { HttpError } from "../lib/httpError";

let pool: Pool | undefined;

/**
 * Shared PostgreSQL pool, created on first use so the API can still start
 * (e.g. for the /health check) on machines where the database is not set up yet.
 */
export function getPool(): Pool {
  if (!pool) {
    if (!env.databaseUrl) {
      throw new HttpError(500, "Database is not configured (set DATABASE_URL in server/.env)");
    }
    pool = new Pool({ connectionString: env.databaseUrl });
    pool.on("error", (err) => {
      console.error("Unexpected PostgreSQL pool error:", err.message);
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
