---
name: verify-portfolio
description: >-
  Use this skill when verifying that the portfolio site loads portfolio.txt
  properly, parses all sections without console errors, preserves scroll
  animations, and is ready for GitHub Pages deployment.
---

# Verify Portfolio Website

Run these checks after modifying `portfolio.txt`, `index.html`, `js/main.js`, or `css/style.css`.

## Verification Steps

1. **Syntax & Parser Check**:
   - Validate `js/main.js` and `js/canvas.js` syntax using `node --check js/main.js && node --check js/canvas.js`.
   - Test `parsePortfolioText` against the live `portfolio.txt` contents in Node to confirm expected `stats`, `skills`, `projects`, `email`, and `links` counts and non-empty fields.
2. **Local HTTP Serving Check**:
   - Start a temporary local server (`python3 -m http.server`) because browsers block `fetch('portfolio.txt')` over `file://`.
   - Confirm HTTP `200` responses for `/`, `/portfolio.txt`, `/css/style.css`, `/js/canvas.js`, and `/js/main.js`.
3. **DOM & Animation Integrity Check**:
   - Confirm `index.html` retains required mount IDs: `#about-skills`, `#stat-projects`, `#stat-experience`, `#about-availability-text`, `#projects-grid`, `#skills-groups`, `#contact-email`, `#contact-links`.
   - Confirm `js/main.js` runs `initScrollWordReveal()`, `initTriggeredAnimations()`, `initReveal()`, and `initCounters()` after `portfolio.txt` renders (even if loading fails).
4. **Deployment Readiness**:
   - Check `git status` and `git diff` to ensure only intended files changed and no temporary servers remain running.
