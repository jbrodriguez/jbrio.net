# Migration Roadmap

Tracking the move from Astro → ssg (`~/code/ssg/`).

## Current state (2026-05-23)

- **`jbrio-net/`** is on branch `ssg`, 10+ commits ahead of `origin/main`.
- **`ssg`** binary at `~/go/bin/ssg`; source at `~/code/ssg/`.
- **`ssg.toml`** lives at this repo root; `ssg build` auto-discovers it.
- **Content** in `data/`, **theme** in `theme/`, **output** in `dist/` (gitignored).
- **`src/`** still holds the Astro framework (pages/components/layouts/utils/etc.) — kept around as reference until step 1 below removes it.
- **Original Astro repo** lives at `~/.local/share/hosting/cloudflare/jbrio.net/` (on `main`, untouched) for side-by-side reference.

## What works

- All routes render: `/`, `/posts/`, `/posts/page/{2..23}/`, `/posts/<slug>/`, `/tag/`, `/tag/<name>/`, `/about/`, `/unbalanced/`, `/404.html`
- RSS feed at `/posts/rss.xml`
- Sitemap at `/sitemap-index.xml` + `/sitemap-0.xml`
- Image pipeline: 4 widths + WebP per source, capped at 2400 max
- Chroma syntax highlighting via `chroma_light`/`chroma_dark` in `ssg.toml`
- Dark / light theme toggle
- `ssg build --serve --watch` with fsnotify live reload
- `ssg new <slug>` post scaffolder
- `ssg init` writes a default `ssg.toml`

## Next steps

### 1. Remove Astro from jbrio-net

Delete:
```
node_modules/
package.json  package-lock.json
astro.config.ts  tsconfig.json
.astro/  .prettierrc.mjs  .prettierignore
src/                        # entire dir (pages, components, layouts, utils, content.config.ts, env.d.ts, worker.js, consts.ts)
new-post.ts  patch-rss.ts
wrangler.toml
data/about/index.mdx        # superseded by index.md
```

Then:
- Update `.gitignore` (drop `.astro/`, keep `dist/` and `node_modules/`)
- Update `README.md` to describe the ssg build
- Run `ssg build` to confirm nothing broke

### 2. Inline markdown images in post bodies

Currently `![alt](./pic.jpg)` inside a post body emits a plain `<img src="./pic.jpg">` — the path may not resolve when served, and the image isn't run through the resize pipeline.

Fix in `~/code/ssg/internal/render/markdown.go`: add a goldmark AST walker that, for every `*ast.Image` node:
- Resolves the relative `Destination` against the post's source directory
- Runs the file through `images.Pipeline.Process()` to produce variants
- Rewrites the node's `Destination` to the largest variant's URL
- Optionally swaps the node for raw HTML to emit a full `<picture>` element with srcset

Estimated: 50–80 LOC.

### 3. Deploy to a Cloudflare Pages preview

- New Pages project (or reuse existing) targeting the `jbrio-net` GitHub repo on branch `ssg`
- Build command sketch:
  ```sh
  curl -fL https://github.com/tailwindlabs/tailwindcss/releases/latest/download/tailwindcss-macos-arm64 -o /tmp/tailwindcss
  chmod +x /tmp/tailwindcss && sudo mv /tmp/tailwindcss /usr/local/bin/
  go install github.com/jbrodriguez/ssg/cmd/ssg@latest
  ssg build
  ```
  (Cloudflare's build image runs Linux; swap the tailwindcss binary URL accordingly.)
- Build output directory: `dist`
- Env vars: `GO_VERSION=1.23` (or current)
- Verify on the `*.pages.dev` preview URL:
  - All listed routes return 200
  - RSS validates at https://validator.w3.org/feed/
  - Real images load fast (HTTP/2)
  - Lighthouse: compare Performance / A11y / SEO vs current `jbrio.net`

### 4. Side-by-side production diff (was task #14)

With ssg on a Pages preview URL, fair apples-to-apples comparison vs `jbrio.net`:
- `curl` each route on both, `diff` the bodies
- Check RSS `<guid>` values are stable (subscribers don't see old posts as "new")
- Spot-check 5 representative posts in the browser

### 5. DNS cutover

When happy:
- Point `jbrio.net` (and `www`) at the new Pages project
- Keep the old Astro project deployed for ~1 week as rollback insurance
- After confidence period, delete the old Pages project

Then on disk:
- Rename `jbrio.net/` → `jbrio.net.astro-archive/` (keep around as reference for another month)
- Rename `jbrio-net/` → `jbrio.net/`
- Update the local `~/code/ssg/` git remote on jbrio-net to keep pointing at the same GitHub repo

### 6. Polish (any order, no deadline)

- HTTP/2 (h2c) in the dev server so localhost feels like prod
- `ssg new` interactive prompts (title, tags, draft/published)
- More `ssg.toml` knobs: `image_quality_jpeg`, `image_quality_webp`, `max_variant_width`
- A proper test suite — currently only `internal/content` and `internal/images.chooseWidths` have tests
- Drop unused chroma styles from the binary (`go build -trimpath`, embedding only the styles in config)

## Critical path

**1 → 2 → 3 → 5.** Step 4 is verification; step 6 is whenever.

## How to resume

```sh
cd ~/.local/share/hosting/cloudflare/jbrio-net
ssg build --serve --watch    # dev loop
git log --oneline -10        # see where we left off
cat ROADMAP.md               # this file
```

The original migration plan (with the design decisions) lives at:
`/Users/jbrodriguez/.claude/plans/im-using-this-repo-synchronous-sun.md`
