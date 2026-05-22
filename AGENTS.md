# AGENTS.md

Hugo static site with custom theme overrides and Vite asset pipeline.

## Setup

- **Theme submodule required**: Run `git submodule init && git submodule update` before first build
  - Theme is in `themes/hugo-blog-awesome/` (forked, heavily customized)
- **Node.js + npm** for Vite asset pipeline
- **Hugo 0.130+** (fetched as Go module dependency; see `go.mod`)

## Key Structure

```
layouts/          # Hugo template overrides (copies of theme templates with modifications)
assets/           # Hugo asset pipeline: js/, sass/
src/main.js       # Vite entry point (minimal; mainly a placeholder for Hugo's asset processor)
static/dist/      # Vite build output (Hugo serves from here)
content/posts/    # Main content directory
xayan-nu.work     # Hugo module workspace (imports ./themes/hugo-blog-awesome/)
```

## Development Commands

```bash
npm run dev          # Starts both Vite (watch) and Hugo dev server (concurrent)
npm run build        # Full production build: vite build → hugo --minify
npm run preview      # Build + test: clean, build, then serve in production mode
npm run clean        # Remove public/, static/dist/, node_modules/.vite

# Individual commands if needed:
npm run hugo:dev     # Hugo only (--disableFastRender for safety)
npm run hugo:build   # Hugo minified production build
npm run vite:dev     # Vite watch mode
npm run vite:build   # Vite production build
```

**Dev workflow**: Use `npm run dev` to start both dev server (Hugo on 1313, Vite on 3001) and test at `http://localhost:1313/`.

## Build & Output

- Vite compiles/bundles to `static/dist/` with content hash filenames (`[hash]`)
- Hugo picks up `static/dist/` and includes it in final build
- Final output: `public/` directory
- **Important**: Always run `npm run clean` before full rebuilds to clear stale Vite artifacts

## Critical Details

### Theme Customizations

Theme base: `hugo-blog-awesome` (Git submodule).  
Overrides are in `layouts/` and `assets/sass/`:
- `layouts/_default/single.html` — per-post analytics config injection
- `layouts/_default/list.html` — series support, custom post listings
- `assets/sass/_custom.scss` — neon color scheme, chat styling, custom typography

**Quirk**: Hugo only allows overriding entire template files, not partial sections. Small changes require copying whole files.

### Styling & Sass

- Entry: `assets/sass/_custom.scss`
- Custom colors: `#33ffab` (neon), `#23ad73` (dark), via CSS custom properties (`--hue`)
- Includes: `custom/{functions,base,fonts,colors,animations}`
- Nested Sass structure (e.g., `custom/colors/` likely contains color definitions)

### Analytics (PostHog) & Engagement

- Custom script: `assets/js/pikachu.js`
- Tracks: scroll depth, engagement time, content selection, copy events
- Per-post config via front matter: `valued_time` (seconds), `valued_scroll` (% depth)
- First-party analytics, no tracking cookies

### Shortcodes

- `{{< chat >}}` — LLM conversation rendering
- `{{< image url="..." source="..." >}}` — flexible image embedding with attribution

### Content

- Main content path: `content/posts/`
- Taxonomies: `tags`, `categories`
- Language: en-gb

### Hugo Config

- Base URL: `https://xayan.nu/`
- Module workspace enabled (`xayan-nu.work`)
- Raw HTML allowed in Markdown
- Ignores two expected warnings: `additional-script-loading-error`, `warning-goldmark-raw-html`

## No CI/CD

No GitHub Actions or pre-commit hooks present. Manual build + deploy only.

## Notes for Agents

1. **Theme edits**: If modifying theme behavior, check both `layouts/` overrides AND `themes/hugo-blog-awesome/` source
2. **Sass variables**: Prefix with `$` for Sass, use `var(--name)` for CSS custom properties (mixed usage)
3. **Asset cache**: Vite uses hash-based filenames; Hugo's `resources/` may cache old versions. Use `npm run clean` if assets seem stale
4. **Module workspace**: `xayan-nu.work` imports the local theme directory. Don't remove or ignore it
5. **Content licensing**: `/content/` is CC BY-NC 4.0; code is MIT
