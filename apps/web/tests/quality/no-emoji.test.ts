import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { countRuns } from "../count-runs";
import { ALLOWED, findEmoji, scan } from "../../../../scripts/check_no_emoji.mjs";

type Hit = { char: string; codepoint: string; line: number; col: number };
const find = findEmoji as (t: string) => Hit[];
const scanRoots = scan as (roots?: string[], root?: string) => { files: number; hits: (Hit & { file: string })[] };

// Characters that must never trip the gate: ASCII, rupee, copyright, Devanagari, typographic punctuation.
const SAFE = [..."abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 .,;:!?'\"()[]{}<>/\\|-_=+*&^%$#@~`\n\t"]
  .concat(["₹", "©", "स", "ा", "ख", "–", "—", "’", "§", "→", "×"]);
const safeText = fc.array(fc.constantFrom(...SAFE), { maxLength: 200 }).map((cs) => cs.join(""));

// Emoji, written as escapes so this file itself stays clean.
const emoji = fc.oneof(
  fc.integer({ min: 0x1f600, max: 0x1f64f }).map((c) => String.fromCodePoint(c)), // emoticons
  fc.integer({ min: 0x1f680, max: 0x1f6c5 }).map((c) => String.fromCodePoint(c)), // transport
  fc.integer({ min: 0x1f90c, max: 0x1f9ff }).map((c) => String.fromCodePoint(c)), // supplemental symbols
  fc.constantFrom("❤️", "✅", "⚠️", "™", "\u{1F1EE}\u{1F1F3}", "1️⃣", "\u{1F44D}\u{1F3FD}"),
);

describe("F25 no-emoji gate", () => {
  it("never flags clean text (100 runs)", () => {
    fc.assert(
      fc.property(safeText, countRuns("F25", (s: string) => {
        expect(find(s)).toEqual([]);
      })),
      { numRuns: 100 },
    );
  });

  it("flags any emoji at its exact line and column (100 runs)", () => {
    fc.assert(
      fc.property(safeText, emoji, fc.nat(), countRuns("F25", (text: string, e: string, at: number) => {
        const i = text.length ? at % (text.length + 1) : 0;
        const s = text.slice(0, i) + e + text.slice(i);
        const hits = find(s);
        expect(hits.length).toBeGreaterThan(0);
        const before = s.slice(0, i).split(/\r?\n/);
        expect(hits[0].line).toBe(before.length);
        const start = before[before.length - 1].length + 1; // keycaps match at the combining U+20E3, inside the sequence
        expect(hits[0].col).toBeGreaterThanOrEqual(start);
        expect(hits[0].col).toBeLessThan(start + e.length);
        expect(hits[0].codepoint).toMatch(/^U\+[0-9A-F]{4,6}$/);
      })),
      { numRuns: 100 },
    );
  });

  it("allows exactly the rupee and copyright signs", () => {
    expect([...(ALLOWED as Set<string>)].sort()).toEqual(["©", "₹"].sort());
    expect(find("₹12,50,000 © 2026")).toEqual([]);
  });

  it("scan() reports planted emoji with a file path and skips missing roots", () => {
    const dir = mkdtempSync(join(tmpdir(), "saakh-emoji-"));
    try {
      mkdirSync(join(dir, "src", "node_modules"), { recursive: true });
      writeFileSync(join(dir, "src", "ok.ts"), "export const a = '₹1,00,000';\n");
      writeFileSync(join(dir, "src", "bad.tsx"), "const x = 1;\nconst toast = 'Saved \u{1F389}';\n");
      writeFileSync(join(dir, "src", "image.png"), "\u{1F389}");
      writeFileSync(join(dir, "src", "node_modules", "dep.js"), "'\u{1F389}'");
      const { files, hits } = scanRoots(["src", "does-not-exist"], dir);
      expect(files).toBe(2);
      expect(hits).toEqual([{ file: "src/bad.tsx", char: "\u{1F389}", codepoint: "U+1F389", line: 2, col: 22 }]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("the repository's shipped sources contain zero emoji", () => {
    const { files, hits } = scanRoots();
    expect(files).toBeGreaterThan(0);
    expect(hits).toEqual([]);
  });
});
