# Migration Roadmap

Tracking the move from Astro → ssg (`~/code/ssg/`).

## Current state (2026-05-24)

- **`jbrio-net/`** is on branch `ssg`; Astro is fully removed.
- **`ssg`** binary at `~/go/bin/ssg`; source at `github.com/jbrodriguez/ssg` (public).
- **`ssg.toml`** lives at this repo root; `ssg build` auto-discovers it.
- **Content** in `data/`, **theme** in `theme/`, **output** in `dist/` (gitignored).
- **Social poster** (Go) in `tools/social/`.
- **Deploy** via GitHub Actions → `wrangler` against the existing `jbrio-net` Worker.
- **Original Astro repo** lives at `~/.local/share/hosting/cloudflare/jbrio.net/` (on `main`, untouched) for side-by-side reference.

## What works

- All routes render: `/`, `/posts/`, `/posts/page/{2..23}/`, `/posts/<slug>/`, `/tag/`, `/tag/<name>/`, `/about/`, `/unbalanced/`, `/404.html`
- RSS at `/posts/rss.xml` (+ 301 from the old `/posts/index.xml`); sitemap at `/sitemap-index.xml` + `/sitemap-0.xml`
- Image pipeline: 4 widths + WebP per source, capped at 2400; inline body images copied + rewritten to absolute paths
- Chroma syntax highlighting via `chroma_light`/`chroma_dark`; dark/light toggle
- SEO at parity with prod: per-page title/description/canonical, OG + Twitter cards with the post's **cover** as the share image, robots.txt with `Sitemap:`, root favicons + manifest
- `ssg build --serve --watch` (fsnotify live reload), `ssg new <slug>`, `ssg init`

## Deployment architecture (how it actually shipped)

Not Cloudflare Pages — we kept the **existing `jbrio-net` Worker** (Static Assets) and drive it from GitHub Actions, matching the old Astro pipeline (which also deployed via `wrangler`, not Git integration).

- `wrangler.toml`: assets-only Worker (`[assets] directory = "./dist"`, `not_found_handling = "404-page"`), no server script.
- `.github/workflows/deploy.yml` on push:
  - install Go + Tailwind CLI, `go install …/ssg@latest` (via `GOPROXY=direct` to dodge proxy lag), `ssg build`
  - **`main`** → `wrangler deploy` (production) + announce new posts
  - **any other branch** → `wrangler versions upload` → **preview URL** (`<hash>-jbrio-net.tiembla.workers.dev`), prod untouched
- Social announce (`tools/social/`) posts to Bluesky/Mastodon/X. Gated to `main` + a **cap of 3** posts/push (guards against mass-announcing on the migration merge or bulk edits). Reuses the pre-existing repo secrets.

## Done

- [x] **1. Remove Astro** — deleted framework, npm, `src/`, wrangler/worker.js, social JS; npm-free repo.
- [x] **2. Inline markdown images** — no AST needed: copy body-referenced images into the page's dist dir and rewrite `src` to absolute (`/posts/<slug>/foo.png`), since relative paths break without a trailing slash.
- [x] **3. Preview deploy** — Workers Builds was the wrong fit; landed on the GitHub Actions + `wrangler` pipeline above. Branch pushes produce working preview URLs.
- [x] **4. Side-by-side verification** — URL parity (227 posts, all tags), stable RSS `<guid>`s, well-formed XML. Bugs found & fixed:
  - `12D78` slug lowercased → `/posts/12d78/` (case-sensitive URL would've 404'd)
  - sitemap tag `<loc>` now percent-encoded (`/tag/open%20source/`)
  - SEO: RSS `index.xml` redirect, robots `Sitemap:`, per-post og:image cover, root favicons + manifest

## Remaining

### 5. Cutover  ← next

```sh
git -C ~/code/ssg push                       # ensure ssg is up
cd ~/.local/share/hosting/cloudflare/jbrio-net
git checkout main && git merge --ff-only ssg && git push origin main
```

Push to `main` triggers `wrangler deploy` → **production**, same Worker, same custom domain — **no DNS change**. The 227-post announce is skipped by the cap. Old Astro versions stay in the Worker dashboard for one-command rollback (`npx wrangler rollback`).

After deploy, sanity-check `https://jbrio.net` (a few posts + the `/posts/index.xml` redirect).

On-disk tidy-up (optional, after a confidence period):
- Rename `jbrio.net/` → `jbrio.net.astro-archive/`, and `jbrio-net/` → `jbrio.net/`.

### 6. Polish (any order, no deadline)

- HTTP/2 (h2c) in the dev server so localhost feels like prod
- `ssg new` interactive prompts (title, tags, draft/published)
- More `ssg.toml` knobs: `image_quality_jpeg`, `image_quality_webp`, `max_variant_width`
- Pick a ~1200px-wide variant for og:image instead of the largest
- Broader test suite (currently `internal/content`, `internal/images.chooseWidths`, `tools/social` formatting)
- Drop unused chroma styles from the binary

## How to resume

```sh
cd ~/.local/share/hosting/cloudflare/jbrio-net
ssg build --serve --watch    # dev loop
git log --oneline -10        # where we left off
cat ROADMAP.md               # this file
```

Push a branch (not `main`) → preview URL. Push `main` → production.

Original migration plan (design decisions):
`/Users/jbrodriguez/.claude/plans/im-using-this-repo-synchronous-sun.md`
