import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const baselinePath = resolve(
  root,
  process.env.VITEST_WARNING_BASELINE || "test/vitest-warnings.baseline",
);
const reportPath = resolve(
  root,
  process.env.VITEST_WARNING_REPORT || "test-results/vitest-warnings.txt",
);
const vitestPath = resolve(root, "node_modules/vitest/vitest.mjs");

const child = spawn(process.execPath, [vitestPath, "run", ...process.argv.slice(2)], {
  cwd: root,
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    const text = String(chunk);
    output += text;
    process[stream === child.stdout ? "stdout" : "stderr"].write(text);
  });
}

const exitCode = await new Promise((resolveExit) => {
  child.on("close", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
});

const warnings = output
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) =>
    /\[vitest\]|^warning\b|^warn(?:ing)?\s*:|^⚠/i.test(line),
  );
await mkdir(dirname(reportPath), { recursive: true });
await writeFile(reportPath, warnings.length ? `${warnings.join("\n")}\n` : "");

if (exitCode !== 0) process.exit(exitCode);

const baseline = (await readFile(baselinePath, "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
const unexpected = warnings.filter((warning) => !baseline.includes(warning));
if (unexpected.length) {
  console.error(
    `Unexpected Vitest warnings (${unexpected.length}); see ${reportPath}.`,
  );
  process.exit(1);
}
