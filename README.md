# Statefold marketing site — `www.statefoldai.com`

A dependency-free static site (HTML + CSS + vanilla JS) with a physically inspired WebGL2 event horizon, monumental SVG brand system, adaptive render quality, and reduced-motion fallbacks.

```
./
├── index.html      # the whole landing page
├── styles.css      # design system + sections + responsive
├── void.js         # gravitational-lensing and accretion-disk WebGL renderer
├── app.js          # navigation, section choreography, Hive Mind demo
├── favicon.svg     # the stateFold "o" mark
├── CNAME           # www.statefoldai.com (custom domain for GitHub Pages)
└── .nojekyll       # serve files as-is (no Jekyll processing)
```

## Preview locally

```bash
python -m http.server 4317
# open http://127.0.0.1:4317
```

## Deploy

The site is fully static — it can be served by any static host. Because the **product
repo is private**, GitHub Pages from this repo will not publish a *public* site on a free
plan. Pick one:

### Option A — dedicated public GitHub repo + Pages (recommended, zero-cost)
1. Push this repository to the public `statefold-site` remote (the `CNAME` file already pins the custom domain).
2. Repo → **Settings → Pages** → Source: `main` / root → Save.
3. Set the custom domain to `www.statefoldai.com` (auto-filled from `CNAME`); enable
   **Enforce HTTPS** once the cert provisions.

### Option B — Vercel / Netlify / Cloudflare Pages
Point the host at this folder; framework preset = **None** (static). Add `www.statefoldai.com`
as a custom domain in the host's dashboard.

## DNS — required at the `statefoldai.com` registrar (whoever hosts it)

For **GitHub Pages**:

| Type  | Host  | Value                          |
| ----- | ----- | ------------------------------ |
| CNAME | `www` | `<your-gh-user>.github.io`     |
| A     | `@`   | `185.199.108.153`              |
| A     | `@`   | `185.199.109.153`              |
| A     | `@`   | `185.199.110.153`              |
| A     | `@`   | `185.199.111.153`              |

For **Vercel / Netlify / Cloudflare**: use the CNAME/ALIAS target the host gives you
(e.g. `cname.vercel-dns.com`). Allow up to a few hours for DNS + TLS to propagate.
