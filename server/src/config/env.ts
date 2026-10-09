import path from "node:path";
import dotenv from "dotenv";

// Loads server/.env (copy server/.env.example to server/.env).
// Real environment variables always win over values in the file.
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

export const env = {
  port: Number(process.env.PORT) || 4000,
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
};
