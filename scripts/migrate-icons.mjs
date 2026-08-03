/**
 * migrate-icons-v2.mjs
 * 1. import { LuFoo, LuBar } from "react-icons/lu"  → import { Foo, Bar } from "lucide-react"
 * 2. import { FiX } from "react-icons/fi"            → import { X } from "lucide-react"
 * 3. All JSX/code usages: LuFoo → Foo, FiX → X
 * 4. Handle Image naming conflict (lucide Image vs next/image Image)
 * 5. react-icons/si brand icons → kept as-is
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      const s = statSync(full);
      if (s.isDirectory()) walk(full, out);
      else if (s.isFile() && (extname(entry) === ".tsx" || extname(entry) === ".ts"))
        out.push(full);
    } catch {}
  }
  return out;
}

const files = walk("src");
let totalChanged = 0;

for (const file of files) {
  const original = readFileSync(file, "utf8");
  let content = original;

  // ── Collect Lu* identifiers used in this file ─────────────────────────────
  const luNames = new Set();
  const fiNames = new Set();

  // Scan current imports (already migrated by v1 to lucide-react, or still on react-icons/lu)
  // Also scan raw Lu/Fi usage in code
  for (const m of content.matchAll(/\bLu([A-Z][A-Za-z0-9]*)\b/g)) luNames.add(m[1]);
  for (const m of content.matchAll(/\bFi([A-Z][A-Za-z0-9]*)\b/g)) fiNames.add(m[1]);

  if (luNames.size === 0 && fiNames.size === 0) continue;

  // ── Fix imports ───────────────────────────────────────────────────────────
  // react-icons/lu still remaining (shouldn't be, but just in case)
  if (content.includes("react-icons/lu")) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']react-icons\/lu["'];?/g,
      (_m, names) => {
        const converted = names
          .split(",")
          .map((n) => {
            const t = n.trim();
            if (!t) return "";
            const a = t.match(/^Lu([A-Z]\w*)\s+as\s+(\w+)$/);
            if (a) return `${a[1]} as ${a[2]}`;
            const b = t.match(/^Lu([A-Z]\w*)$/);
            if (b) return b[1];
            return t;
          })
          .filter(Boolean)
          .join(", ");
        return `import { ${converted} } from "lucide-react";`;
      }
    );
  }

  // react-icons/fi
  if (content.includes("react-icons/fi")) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']react-icons\/fi["'];?/g,
      (_m, names) => {
        const converted = names
          .split(",")
          .map((n) => {
            const t = n.trim();
            if (!t) return "";
            const b = t.match(/^Fi([A-Z]\w*)$/);
            if (b) return b[1];
            return t;
          })
          .filter(Boolean)
          .join(", ");
        return `import { ${converted} } from "lucide-react";`;
      }
    );
  }

  // ── Fix lucide-react import that already has Lu-prefixed names ────────────
  // (v1 may have partially run and left some in an intermediate state)
  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g,
    (_m, names) => {
      const parts = names
        .split(",")
        .map((n) => {
          const t = n.trim();
          if (!t) return "";
          // Strip leftover Lu prefix
          const lu = t.match(/^Lu([A-Z]\w*)$/);
          if (lu) return lu[1];
          const luAlias = t.match(/^Lu([A-Z]\w*)\s+as\s+(\w+)$/);
          if (luAlias) return `${luAlias[1]} as ${luAlias[2]}`;
          // Strip leftover Fi prefix
          const fi = t.match(/^Fi([A-Z]\w*)$/);
          if (fi) return fi[1];
          return t;
        })
        .filter(Boolean);

      // Dedup
      const seen = new Set();
      const deduped = parts.filter((p) => {
        const key = p.replace(/\s+as\s+\w+$/, "");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return `import { ${deduped.join(", ")} } from "lucide-react";`;
    }
  );

  // ── Handle Image naming conflict ──────────────────────────────────────────
  // If file imports next/image AND lucide Image, alias lucide Image → LucideImage
  const hasNextImage =
    /import\s+Image\s+from\s+["']next\/image["']/.test(content) ||
    /import\s+\*\s+as\s+\w+\s+from\s+["']next\/image["']/.test(content);
  const hasLucideImage = /import\s*\{[^}]*\bImage\b[^}]*\}\s*from\s*["']lucide-react["']/.test(content);

  if (hasNextImage && hasLucideImage) {
    // Rename Image → LucideImage in lucide-react import
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["'];?/g,
      (_m, names) => {
        const parts = names
          .split(",")
          .map((n) => {
            const t = n.trim();
            if (t === "Image") return "Image as LucideImage";
            return t;
          })
          .filter(Boolean)
          .join(", ");
        return `import { ${parts} } from "lucide-react";`;
      }
    );
    // Replace usages of LuImage (already renamed to Image → LucideImage above)
    // but JSX may still say LuImage → needs to be LucideImage
    content = content.replace(/\bLuImage\b/g, "LucideImage");
  }

  // ── Replace ALL Lu* usages in code body → strip Lu prefix ────────────────
  // Skip inside import statements (already handled above)
  for (const name of luNames) {
    // Replace LuFoo → Foo everywhere except inside import lines
    // We do a global replace since identifiers are safe to rename
    const luName = `Lu${name}`;
    // Special case: if Image was aliased to LucideImage, skip
    if (name === "Image" && hasNextImage) {
      content = content.replace(new RegExp(`\\b${luName}\\b`, "g"), "LucideImage");
    } else {
      content = content.replace(new RegExp(`\\b${luName}\\b`, "g"), name);
    }
  }

  // ── Replace Fi* usages ────────────────────────────────────────────────────
  for (const name of fiNames) {
    content = content.replace(new RegExp(`\\bFi${name}\\b`, "g"), name);
  }

  if (content !== original) {
    writeFileSync(file, content, "utf8");
    console.log(`✓ ${file}`);
    totalChanged++;
  }
}

console.log(`\nDone. ${totalChanged} files updated.`);
