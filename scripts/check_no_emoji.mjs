#!/usr/bin/env node
// F25 quality gate: no emoji anywhere in shipped sources (SPEC F25, DESIGN.md §0.2).
// Usage: node scripts/check_no_emoji.mjs   (exit 0 = clean, 1 = emoji found, 2 = scan error)
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const SCAN_ROOTS = [
  "apps/web/app",
  "apps/web/components",
  "apps/web/lib",
  "services/api/app",
  "services/api/ml",
  "services/api/data",
  "docs/REPORT.md",
];

// Pictographs, plus emoji that are not Extended_Pictographic: flags (regional indicators) and keycaps.
const EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{20E3}]/gu;
// Allowed: rupee sign (not pictographic anyway) and copyright sign (pictographic, but needed in footers).
export const ALLOWED = new Set(["₹", "©"]);

const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".md", ".mdx", ".py", ".json", ".csv", ".html", ".txt", ".toml", ".yaml", ".yml", ".svg"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "__pycache__", ".venv", ".pytest_cache", ".hypothesis", "dist", "build"]);

/** Every emoji in `text` as { char, codepoint, line, col } (1-based). */
export function findEmoji(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(EMOJI)) {
      if (ALLOWED.has(m[0])) continue;
      const cp = m[0].codePointAt(0);
      hits.push({ char: m[0], codepoint: "U+" + cp.toString(16).toUpperCase().padStart(4, "0"), line: i + 1, col: m.index + 1 });
    }
  });
  return hits;
}

function* walk(path) {
  const st = statSync(path);
  if (st.isFile()) {
    if (TEXT_EXT.has(extname(path).toLowerCase())) yield path;
    return;
  }
  for (const entry of readdirSync(path)) {
    if (SKIP_DIRS.has(entry)) continue;
    yield* walk(join(path, entry));
  }
}

/** Scan roots (relative to `root`); missing roots are skipped. Returns { files, hits: [{ file, ...hit }] }. */
export function scan(roots = SCAN_ROOTS, root = ROOT) {
  let files = 0;
  const hits = [];
  for (const r of roots) {
    const abs = resolve(root, r);
    if (!existsSync(abs)) continue;
    for (const file of walk(abs)) {
      files++;
      for (const h of findEmoji(readFileSync(file, "utf8"))) hits.push({ file: relative(root, file).replaceAll("\\", "/"), ...h });
    }
  }
  return { files, hits };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const { files, hits } = scan();
    for (const h of hits) console.error(`${h.file}:${h.line}:${h.col}  ${h.codepoint}  emoji is not allowed; use an icon from DESIGN.md §6`);
    if (hits.length) {
      console.error(`check_no_emoji: ${hits.length} emoji in ${files} files scanned.`);
      process.exit(1);
    }
    console.log(`check_no_emoji: 0 emoji in ${files} files scanned.`);
  } catch (err) {
    console.error(`check_no_emoji: scan failed: ${err.message}`);
    process.exit(2);
  }
}
