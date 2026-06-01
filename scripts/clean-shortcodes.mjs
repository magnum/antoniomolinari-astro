#!/usr/bin/env node
// Replace WordPress-style shortcodes in imported posts with plain markdown.
// Only touches standalone shortcode lines — leaves `(tags: [video](...))`-style
// markdown link lists untouched.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS = resolve(__dirname, "../src/content/posts");

// gray-matter / converters escape `[`, `]`, `_` in body, so shortcodes look
// like `\[youtube y\_mzMGuh03Q\]`. Strip the backslashes inside the pattern.
function unescape(s) {
  return s.replace(/\\([\[\]_])/g, "$1");
}

const replacements = [
  // [youtube VIDEO_ID]  →  https://www.youtube.com/watch?v=VIDEO_ID
  // The video ID consists of [A-Za-z0-9_-], where literal `_` may be escaped
  // as `\_` because gray-matter escaped it.
  {
    pattern: /^[ \t]*\\?\[youtube\s+((?:[A-Za-z0-9\-]|\\_)+)\\?\][ \t]*$/gm,
    replace: (_m, id) => {
      const cleanId = unescape(id);
      const url = `https://www.youtube.com/watch?v=${cleanId}`;
      return `[${url}](${url})`;
    },
    label: "youtube",
  },
  // [audio:URL]  →  [URL](URL)
  {
    pattern: /^[ \t]*\\?\[audio:(\S+?)\\?\][ \t]*$/gm,
    replace: (_m, url) => {
      const cleanUrl = unescape(url);
      return `[${cleanUrl}](${cleanUrl})`;
    },
    label: "audio",
  },
  // [gallery=NN] or [gallery] standalone  →  remove
  {
    pattern: /^[ \t]*\\?\[gallery(?:=\d+)?\\?\][ \t]*$/gm,
    replace: () => "",
    label: "gallery",
  },
];

let totalReplaced = 0;
const summary = {};

for (const fname of readdirSync(POSTS)) {
  if (!fname.endsWith(".md")) continue;
  const path = join(POSTS, fname);
  const original = readFileSync(path, "utf8");

  let modified = original;
  let fileReplacements = 0;

  for (const { pattern, replace, label } of replacements) {
    modified = modified.replace(pattern, (...args) => {
      fileReplacements++;
      summary[label] = (summary[label] ?? 0) + 1;
      return replace(...args);
    });
  }

  if (fileReplacements > 0) {
    // Collapse any triple-newlines we may have introduced
    modified = modified.replace(/\n{3,}/g, "\n\n");
    writeFileSync(path, modified);
    totalReplaced += fileReplacements;
    console.log(`  ${fileReplacements}x  ${fname}`);
  }
}

console.log(`\nTotal: ${totalReplaced} shortcode(s) replaced`);
console.log("By type:", summary);
