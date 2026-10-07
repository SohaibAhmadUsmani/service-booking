/**
 * Runs every SQL file in database/seeds in filename order.
 * Seed files are written to be safe to run more than once.
 *
 *   npm run db:seed --workspace=server
 */
import fs from "node:fs";
import path from "node:path";
import { closePool, getPool } from "../config/pg";

const seedsDir = path.resolve(__dirname, "../../../database/seeds");

async function main() {
  const pool = getPool();
  const files = fs
    .readdirSync(seedsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(seedsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("COMMIT");
      console.log(`seeded ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Seed ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
}

main()
  .catch((err) => {
    console.error(err.message ?? err);
    process.exitCode = 1;
  })
  .finally(closePool);
