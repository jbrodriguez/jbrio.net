# Juan B. Rodriguez (Personal Blog)

My blog, built with [ssg](https://github.com/jbrodriguez/ssg) — a small hand-rolled
Go static site generator. All open-source!

## 1. Clone the repo

```bash
git clone https://github.com/jbrodriguez/jbrio.net
```

## 2. Install the tools

The generator and the Tailwind standalone CLI are the only dependencies:

```bash
go install github.com/jbrodriguez/ssg/cmd/ssg@latest
brew install tailwindcss
```

## 3. Run the dev server

```bash
ssg build --serve --watch
```

The website is served at [http://localhost:4321](http://localhost:4321) with live
reload on changes to `data/`, `theme/`, and `public/`.

## 4. Build the static website

```bash
ssg build
```

The static website is written to the `./dist` folder, which is what Cloudflare
Pages deploys.

## 5. Create a new post

```bash
ssg new <post name>
```

## Layout

- `data/` — content: posts, the about page, and the unbalanced page (markdown +
  co-located images).
- `theme/` — templates (`html/template`), Tailwind CSS source, fonts, and static
  assets.
- `public/` — files copied verbatim into `dist/` (`_headers`, `_redirects`).
- `ssg.toml` — site config, auto-discovered by `ssg` in this directory.
- `meta/` — site metadata, including the logo art.

## License

Licensed under [MIT License](LICENSE). © Juan B. Rodriguez.

## Credits

Based on [loige.co](https://github.com/lmammino/loige.co) by [Luciano Mammino](https://loige.co/)
