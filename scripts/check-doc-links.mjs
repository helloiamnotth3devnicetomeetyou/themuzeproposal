import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
import { globSync } from "node:fs";

const files = globSync("{docs/**/*.md,*.md}", { cwd: process.cwd() }).map(
  (f) => resolve(f),
);

const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
let broken = 0;

for (const file of files) {
  const content = readFileSync(file, "utf8");
  for (const match of content.matchAll(linkPattern)) {
    const target = match[1].split("#")[0].trim();
    if (!target || /^[a-z]+:\/\//i.test(target) || target.startsWith("mailto:"))
      continue;
    if (!extname(target)) continue; // skip bare anchors/paths without a file extension
    const resolved = resolve(dirname(file), target);
    if (!existsSync(resolved)) {
      console.error(`${file}: broken link -> ${match[1]}`);
      broken++;
    }
  }
}

if (broken > 0) {
  console.error(`\n${broken} broken doc link(s) found.`);
  process.exit(1);
}
console.log("All doc links resolve.");
