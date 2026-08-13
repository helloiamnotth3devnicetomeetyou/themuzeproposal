import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const dbUrl = process.env.SUPABASE_DB_URL?.trim();
if (!dbUrl) {
  console.error(
    "Missing SUPABASE_DB_URL in .env.local. Copy it from the Supabase dashboard (Connect -> Session pooler).",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const require = createRequire(import.meta.url);
const cli = require.resolve("supabase/dist/supabase.js");
const parsedDbUrl = new URL(dbUrl);
const dbPassword = parsedDbUrl.password
  ? decodeURIComponent(parsedDbUrl.password)
  : null;
parsedDbUrl.password = "";
const childEnv = { ...process.env };
delete childEnv.SUPABASE_DB_URL;
if (dbPassword !== null) childEnv.PGPASSWORD = dbPassword;
const result = spawnSync(
  process.execPath,
  [cli, ...args, "--db-url", parsedDbUrl.toString()],
  {
    stdio: "inherit",
    env: childEnv,
  },
);

process.exit(result.status ?? 1);
