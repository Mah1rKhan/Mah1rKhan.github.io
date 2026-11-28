# Portfolio Repository — Agent Instructions

This repository contains **Mahir Khan's static personal portfolio website**, deployed directly to GitHub Pages without a build step.

## Architecture & File Map

- `portfolio.txt` — **Single source of truth** for all dynamic site content (`[STATS]`, `[SKILLS]`, `[PROJECTS]`, `[LINKS]`). Always edit this file (never hardcode items back into `index.html`) when adding skills, adding projects, or updating links.
- `index.html` — Static HTML shell with semantic section mount targets (`#about-skills`, `#stat-projects`, `#stat-experience`, `#about-availability-text`, `#projects-grid`, `#skills-groups`, `#contact-email`, `#contact-links`).
- `js/main.js` — Fetches and parses `portfolio.txt`, renders dynamic DOM nodes safely (`textContent` + URL validation), manages custom cursor and navigation, and initializes all scroll/text/counter animations **after** dynamic rendering completes.
- `js/canvas.js` — Self-contained background particle network drawn onto `#bg-canvas`.
- `css/style.css` — Active stylesheet (dark theme tokens, layout, animations, responsive breakpoints, `prefers-reduced-motion`).
- `skills.md` — Standalone Markdown note of technical skills (not loaded by `index.html`; `portfolio.txt` powers the live webpage).
- `.github/workflows/static.yml` — Deploys the repository root directly to GitHub Pages on pushes to `main`.
- `.htaccess` — Apache caching, GZIP compression (including `text/plain` for `portfolio.txt`), and security headers.
- Legacy/unused files: `css/st2.css`, `css/aos.css`, and `js/aos.min.js` are not referenced by `index.html`; leave them alone unless asked to clean up unused files.

## Engineering Conventions

1. **Single Data Source**: Keep all skills, projects, stats/availability, and external/contact links in `portfolio.txt`. Do not duplicate them as hardcoded markup in `index.html`.
2. **Zero Build Dependencies**: Keep all runtime code vanilla HTML5, CSS3, and ES6+ JS with no bundler or npm build step so `.github/workflows/static.yml` continues to work directly from `.`.
3. **Animation Timing**: `js/main.js` adds `html.js` immediately and initializes `initScrollWordReveal()`, `initTriggeredAnimations()`, `initReveal()`, and `initCounters()` after `portfolio.txt` renders. Never throw uncaught errors during `fetch(PORTFOLIO_FILE)` or those reveal observers will not attach.
4. **Safe DOM Rendering**: Use `document.createElement` and `textContent` (never `innerHTML`) for parsed content from `portfolio.txt`, and run all href values through `sanitizeUrl()`.
5. **Local Preview Requirement**: Browsers block `fetch('portfolio.txt')` over `file://`. Always verify changes over an HTTP server (for example `python3 -m http.server 8080`).
6. **Graphify Context**: `.claude/CLAUDE.md`, `.claude/settings.json`, and `.codex/hooks.json` integrate `graphify` (`graphify-out/graph.json`). Preserve those configurations when modifying the repo.
