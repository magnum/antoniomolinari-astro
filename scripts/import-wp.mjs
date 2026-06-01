#!/usr/bin/env node
// Trasforma i markdown prodotti da wordpress-export-to-markdown nello schema
// AstroPaper, appiattisce la struttura, e genera la mappa di redirect 301
// dalle vecchie URL WordPress (/YYYY/MM/DD/slug/) alle nuove (/posts/<slug>/).
//
// Input:  tmp/import/output/posts/**/*.md  (+ _drafts, custom/sstack-posts)
//         export/antoniomolinari.WordPress.2026-05-31.xml
// Output: src/content/posts/<slug>.md
//         scripts/redirects.json

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import { join, dirname, basename, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { XMLParser } from "fast-xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PROJECT_ROOT = resolve(ROOT, "..");

// Resolve the WP export XML, in priority order:
//  1) IMPORT_XML env var (absolute or relative to repo root)
//  2) astro/import/wp-export.xml  (self-contained, recommended)
//  3) astro/import/*.xml          (any single .xml in import/)
//  4) ../antoniomolinari/export/antoniomolinari.WordPress.2026-05-31.xml
//     (original layout, kept for back-compat)
function resolveXmlPath() {
  if (process.env.IMPORT_XML) {
    return resolve(ROOT, process.env.IMPORT_XML);
  }
  const inside = resolve(ROOT, "import/wp-export.xml");
  try {
    const stat = statSync(inside);
    if (stat.isFile()) return inside;
  } catch {}
  try {
    const importDir = resolve(ROOT, "import");
    const xmls = readdirSync(importDir).filter(f => f.toLowerCase().endsWith(".xml"));
    if (xmls.length === 1) return resolve(importDir, xmls[0]);
  } catch {}
  return resolve(
    PROJECT_ROOT,
    "export/antoniomolinari.WordPress.2026-05-31.xml"
  );
}
const XML_PATH = resolveXmlPath();
const IMPORT_DIR = resolve(ROOT, "tmp/import/output");
const OUT_POSTS = resolve(ROOT, "src/content/posts");
const REDIRECTS_OUT = resolve(ROOT, "scripts/redirects.json");
const REPORT_OUT = resolve(ROOT, "scripts/import-report.json");

// --- Parse the WP XML for slug -> {link, type, sstackLink, postmeta} ---
function parseWpXml(path) {
  const xml = readFileSync(path, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    parseTagValue: false,
    isArray: name => ["item", "wp:postmeta", "category"].includes(name),
  });
  const doc = parser.parse(xml);
  const items = doc.rss?.channel?.item ?? [];

  const text = v => (v && typeof v === "object" && "__cdata" in v ? v.__cdata : v ?? "");

  const posts = []; // regular posts
  const substackByTitle = new Map(); // sstack-posts indexed by title

  for (const it of items) {
    const postType = text(it["wp:post_type"]);
    if (postType !== "post" && postType !== "sstack-posts") continue;

    const title = text(it.title).trim();
    const link = text(it.link).trim();
    const slug = text(it["wp:post_name"]).trim();
    const status = text(it["wp:status"]);
    const postmeta = (it["wp:postmeta"] ?? []).reduce((acc, m) => {
      acc[text(m["wp:meta_key"])] = text(m["wp:meta_value"]);
      return acc;
    }, {});

    if (postType === "sstack-posts") {
      substackByTitle.set(title.toLowerCase(), postmeta["_sstack_link"] || null);
      continue;
    }

    if (!slug) continue;
    posts.push({ slug, link, title, status, postmeta });
  }

  return { posts, substackByTitle };
}

// --- Walk imported markdown files ---
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (entry.endsWith(".md")) yield full;
  }
}

// --- Extract first paragraph & strip markdown for description ---
function deriveDescription(body, fallback) {
  const paragraphs = body
    .replace(/```[\s\S]*?```/g, "")           // code fences
    .replace(/<[^>]+>/g, "")                  // html tags
    .split(/\n\s*\n/)                         // paragraphs
    .map(p => p.trim())
    .filter(p => p && !p.startsWith("#") && !p.startsWith(">") && !p.startsWith("!") && !p.startsWith("[!"));

  // Find the first paragraph that contains actual prose (not just a single link)
  let first = "";
  for (const p of paragraphs) {
    const text = p
      .replace(/!\[[^\]]*\]\([^)]+\)/g, "")  // strip embedded images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links -> text
      .replace(/[*_`]+/g, "")                 // emphasis/code markers
      .replace(/\s+/g, " ")
      .trim();
    if (text.length >= 30) { first = text; break; }
  }

  if (!first) return fallback;
  if (first.length <= 160) return first;
  // Cut at word boundary near 160 chars
  const cut = first.slice(0, 160);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 100 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

// --- Build redirect: from WP link path to /posts/<slug>/ ---
function linkPath(rawLink) {
  // Take everything after the host
  try {
    const u = new URL(rawLink);
    let p = u.pathname;
    // Strip leading WP base path if present (e.g. /projects/antoniomolinari)
    p = p.replace(/^\/projects\/antoniomolinari/, "");
    if (!p.startsWith("/")) p = "/" + p;
    return p.endsWith("/") ? p : p + "/";
  } catch {
    return rawLink;
  }
}

// --- Main ---
function main() {
  const { posts: wpPosts, substackByTitle } = parseWpXml(XML_PATH);
  console.log(`Parsed ${wpPosts.length} posts and ${substackByTitle.size} substack records from XML`);

  const xmlBySlug = new Map(wpPosts.map(p => [p.slug, p]));

  // Nuke and recreate target dir
  rmSync(OUT_POSTS, { recursive: true, force: true });
  mkdirSync(OUT_POSTS, { recursive: true });

  const redirects = []; // {from, to}
  const collisions = new Map();
  const report = { written: 0, drafts: 0, crossposted: 0, missingXml: 0, withImages: 0 };

  for (const file of walk(IMPORT_DIR)) {
    const rel = relative(IMPORT_DIR, file);
    const isPage = rel.startsWith("pages/");
    if (isPage) continue;

    const isDraftDir = rel.includes("/_drafts/");
    const isSstack = rel.startsWith("custom/sstack-posts/");
    if (isSstack) continue; // handled via substackByTitle linkage on regular post

    const fname = basename(file, ".md");
    const { data: fm, content: body } = matter(readFileSync(file, "utf8"));

    // Skip the id-XXX synthetic draft (no real slug)
    if (fname.startsWith("id-")) {
      report.drafts++;
      continue;
    }

    const xml = xmlBySlug.get(fname);
    if (!xml) report.missingXml++;

    const title = fm.title || xml?.title || fname;
    const pubDatetime = fm.date;
    if (!pubDatetime) {
      console.warn(`  skip (no date): ${rel}`);
      continue;
    }

    const description = deriveDescription(body, title);
    const tags = Array.isArray(fm.tags) && fm.tags.length ? fm.tags : ["uncategorized"];
    const draft = isDraftDir || fm.draft === true;
    if (draft) report.drafts++;

    // Substack crosspost detection by title
    const sstackUrl = substackByTitle.get(title.trim().toLowerCase()) || null;
    const crossposted = Boolean(sstackUrl);
    if (crossposted) report.crossposted++;

    // Track image references for the migration step
    if (/wp-content\/uploads|http[s]?:\/\/[^)]+\.(jpe?g|png|gif|webp)/i.test(body)) {
      report.withImages++;
    }

    const newFm = {
      title,
      pubDatetime,
      description,
      tags: tags.map(t => String(t).toLowerCase()),
      ...(draft ? { draft: true } : {}),
      ...(crossposted ? { crosspostedToSubstack: true, substackUrl: sstackUrl } : {}),
      ...(xml ? { legacyWordpressId: undefined } : {}),
    };
    // remove undefined keys
    Object.keys(newFm).forEach(k => newFm[k] === undefined && delete newFm[k]);

    // Detect filename collisions
    const outPath = join(OUT_POSTS, fname + ".md");
    if (collisions.has(fname)) {
      console.warn(`  COLLISION on slug "${fname}" — appending date suffix`);
      const dateStr = String(pubDatetime).slice(0, 10);
      const altPath = join(OUT_POSTS, `${fname}-${dateStr}.md`);
      writeFileSync(altPath, matter.stringify(body, newFm));
    } else {
      writeFileSync(outPath, matter.stringify(body, newFm));
      collisions.set(fname, true);
    }
    report.written++;

    // Redirect: old WP path -> /posts/<slug>/
    if (xml?.link) {
      const from = linkPath(xml.link);
      const to = `/posts/${fname}/`;
      if (from !== to) redirects.push({ from, to });
    }
  }

  writeFileSync(REDIRECTS_OUT, JSON.stringify(redirects, null, 2));
  writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2));

  console.log("\n=== Report ===");
  console.log(report);
  console.log(`Redirects: ${redirects.length} -> ${relative(ROOT, REDIRECTS_OUT)}`);
}

main();
