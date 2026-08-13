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
const result = spawnSync("npx", ["supabase", ...args, "--db-url", dbUrl], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
