import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");

// Ensure the directory the DB file actually lives in exists — this must be
// derived from DB_PATH itself (not a hardcoded "./data"), since in
// production DATABASE_PATH points into a mounted volume (e.g. /data/app.db)
// whose parent directory may not exist yet at build time or on first boot.
const DB_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __sqlite__: Database.Database | undefined;
}

const sqlite = global.__sqlite__ ?? new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
if (process.env.NODE_ENV !== "production") global.__sqlite__ = sqlite;

export const db = drizzle(sqlite, { schema });
export { sqlite };
