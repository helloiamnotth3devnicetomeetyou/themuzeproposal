import { spawnSync } from "node:child_process";
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
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npx, ["--no-install", "supabase", ...args, "--db-url", dbUrl], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
