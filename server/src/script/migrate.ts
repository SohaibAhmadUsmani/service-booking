/**
 * Applies SQL files from database/migrations in filename order.
 * Applied files are recorded in the schema_migrations table, so running this
 * repeatedly only applies new files. Each file runs inside a transaction.
 *
 *   npm run db:migrate --workspace=server
 */
import fs from "node:fs";
import path from "node:path";
import { closePool, getPool } from "../config/pg";

const migrationsDir = path.resolve(__dirname, "../../../database/migrations");

async function main() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await pool.query<{ filename: string }>("SELECT filename FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.filename));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`applied ${file}`);
      count += 1;
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }

  console.log(count === 0 ? "Database is up to date." : `Applied ${count} migration(s).`);
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(closePool);
