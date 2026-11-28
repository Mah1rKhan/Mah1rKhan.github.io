---
name: update-portfolio
description: >-
  Use this skill when the user wants to add or edit skills, projects, stats,
  availability, email, or social/resume links on Mahir Khan's portfolio website.
---

# Update Portfolio Content

All dynamic portfolio content is managed through a single file: `portfolio.txt`.
Do **not** hardcode skills, projects, or links in `index.html`.

## Workflow

1. **Read `portfolio.txt`** at the repository root to inspect existing entries and formatting.
2. **Edit only `portfolio.txt`** according to the user's request:
   - **Skills (`[SKILLS]`)**: Add `- Skill Name` under an existing `## Group` heading (e.g. `## Programming`, `## Web development`, `## Data & cloud`) or add a new `## Group` heading. All items under `[SKILLS]` automatically populate both `#skills` and the `#about` quick skill pills (unless `[ABOUT HIGHLIGHTS]` is uncommented).
   - **Projects (`[PROJECTS]`)**: Add a block separated by `---` with `Title:`, `Description:`, `Tags:` (comma-separated), `Link:` (URL, `#`, or `none`), and `Accent:` (`true` or `false`). Cards are numbered automatically (`01`, `02`, ...).
   - **Links (`[LINKS]`)**: Edit or add `Label: URL` lines (e.g. `Email:`, `GitHub:`, `LinkedIn:`, `Résumé:`, or new platforms). `Email:` controls the primary `"Say Hello →"` button; all other links render in the Contact links bar.
   - **Stats (`[STATS]`)**: Update `Projects Count:` (integer or `auto`), `Experience:`, or `Availability:`.
3. **Validate the changes**:
   - Check that URLs use `https://`, `http://`, `#`, or a valid email under `Email:`.
   - Confirm no `##` skill heading was accidentally treated as a comment and that `---` separates adjacent project blocks.
4. **Verify locally over HTTP**:
   - Run `python3 -m http.server 8080` from the repository root and confirm `portfolio.txt` parses cleanly and renders on `http://localhost:8080`.
