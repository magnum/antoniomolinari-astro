# antonio.m6i.it

Source for **antonio.m6i.it**, rebuilt as a static Astro site from a
20-year-old WordPress export. Single author (Antonio Molinari), no
comments, English content. Mostly historical archive plus the
occasional long-form essay, with selected pieces cross-posted to
Substack.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # produces dist/ + dist/_redirects + vercel.json
pnpm preview    # serve dist/
```

For migration tooling and the full context (schema, redirects, design
decisions, gotchas), see **[CLAUDE.md](./CLAUDE.md)** — that file is
the canonical project guide and is also what Claude reads when
assisting in this repo.

## Quick layout

- `src/content/posts/` — 190 imported posts, one `.md` per article,
  filename = slug
- `src/content/pages/` — standalone pages (currently only the legacy
  About)
- `src/pages/index.astro` — the homepage, custom hero + skills +
  recent articles
- `import/wp-export.xml` — the WordPress export the import script
  reads from
- `scripts/` — `import-wp.mjs`, `clean-shortcodes.mjs`,
  `generate-redirects.mjs`
- `astro-paper.config.ts` — site metadata, socials, share links
- `src/styles/theme.css` — accent colour and CSS variables

## Re-importing from WordPress

```bash
# 1. generate raw markdown from the XML
npx wordpress-export-to-markdown \
  --input=./import/wp-export.xml \
  --output=./tmp/import/output \
  --post-folders=false --prefix-date=false \
  --date-folders=year-month \
  --save-images=none --wizard=false \
  --timezone=Europe/Rome --include-time=true

# 2. normalise + clean + emit redirects
pnpm import:wp
```

The pipeline is idempotent — re-running wipes and rewrites
`src/content/posts/`.

## Built on

[AstroPaper](https://github.com/satnaing/astro-paper) v6 by Sat Naing,
substantially modified. Original template README content available in
the upstream repo.
