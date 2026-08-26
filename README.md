# Statefold marketing site — `www.statefoldai.com`

The complete Total Intelligence experience is served directly at the public root. There is no
separate landing experience. The former `/total-intelligence/` URL redirects to `/` so existing
links remain valid.

The site is dependency-free static HTML, CSS and JavaScript hosted by GitHub Pages. Shared visual
assets and runtime files remain under `total-intelligence/`; `index.html` is the sole public page.

## Preview

```bash
python -m http.server 4317
```

## Publish

Validate the exact static source, commit it to `main`, push, and verify the custom domain after the
GitHub Pages deployment completes.
