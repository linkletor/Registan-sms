// Runs before `next start` in production. On Railway, DATABASE_PATH points
// into a mounted persistent volume (e.g. /data/app.db). The volume starts
// empty, so on first boot we seed it from the bundled, pre-migrated
// template database; on every later boot the file already exists and this
// is a no-op, so existing data is never overwritten.
const fs = require("fs");
const path = require("path");

const dest = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "app.db");
const template = path.join(__dirname, "..", "data", "seed-template.db");

if (fs.existsSync(dest)) {
  console.log(`[init-db] Database already exists at ${dest} — skipping init.`);
} else {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(template, dest);
  console.log(`[init-db] Initialized database at ${dest} from seed template.`);
}
