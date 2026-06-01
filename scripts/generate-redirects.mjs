#!/usr/bin/env node
// Generates portable 301 redirect configs from scripts/redirects.json:
//   - public/_redirects  (Netlify, Cloudflare Pages)
//   - vercel.json        (Vercel)
// Run after import-wp.mjs and as part of the build pipeline.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const SRC = resolve(ROOT, "scripts/redirects.json");
// _redirects must live in dist/ directly (not in public/) — Vite/Rollup tries
// to parse extensionless files in public/ as JS. vercel.json belongs at root.
const NETLIFY_OUT = resolve(ROOT, "dist/_redirects");
const VERCEL_OUT = resolve(ROOT, "vercel.json");

if (!existsSync(SRC)) {
  console.error(`Missing ${SRC} — run scripts/import-wp.mjs first.`);
  process.exit(1);
}

const redirects = JSON.parse(readFileSync(SRC, "utf8"));

// Netlify / Cloudflare Pages: `from to status`, one per line
const netlify = redirects.map(r => `${r.from} ${r.to} 301`).join("\n") + "\n";
mkdirSync(dirname(NETLIFY_OUT), { recursive: true });
writeFileSync(NETLIFY_OUT, netlify);

// Vercel: redirects array in vercel.json
const vercel = {
  redirects: redirects.map(r => ({
    source: r.from.replace(/\/$/, ""),
    destination: r.to.replace(/\/$/, ""),
    permanent: true,
  })),
};
writeFileSync(VERCEL_OUT, JSON.stringify(vercel, null, 2));

console.log(`Wrote ${redirects.length} redirects:`);
console.log(`  - ${NETLIFY_OUT}`);
console.log(`  - ${VERCEL_OUT}`);
