# Converge: project rules

A guide for IIT Madras BS students taking **MLF, MLT, MLP and the MLP Project**. Live at
https://angadseth.github.io/converge/ (repo `angadseth/converge`, public, Pages from `main` root).

Read `memory/MEMORY.md` first (local only, gitignored), then `PROJECT-LOG.md`. Add to both as you work.
Raw research lives in `research/` (local only).

## Rules Angad set (2026-09-22)

1. **One site for MLF, MLT and MLP together**, in the spirit of the TDS Field Guide, with everything worth reading
   "jitne jha se sources mile": official lectures, course-team notes, books, YouTube, community.
2. **A unique theme, not the TDS one.** TDS is a graph-paper notebook with handwriting and a highlighter. This one is
   an **arXiv-style paper in a PDF viewer**: Computer Modern, NeurIPS title block, numbered equations, Proposition +
   Proof (proof = the official source), booktabs tables, algorithm blocks, a References section, matplotlib-style
   figures. Do not drift towards the TDS look.
3. **Credit: "Made by Angad Jangir" only.** No co-maker. (The TDS guide credits Bharat; this one does not.)
4. **Many small, real commits.** Angad wants his GitHub contribution graph green. One logical change per commit,
   pushed as you go. Never backdate or fake commits.
5. **Approach, not answers.** No graded-assignment, OPPE or project solutions, and no links to repos that post them.
6. **Every fact needs a source** (see `docs/sources.md`). Unverifiable: attribute it or leave it out. Open every link
   before adding it.
7. **Site language: simple English, friendly senior.** Chat with Angad stays in Hinglish.

## Stack

Plain HTML/CSS/JS, no build step.

- `index.html`: 15 "pages" (`article.sheet#pN`), each a section of the paper
- `assets/css/base.css` tokens + viewer chrome · `paper.css` typesetting · `figures.css` widgets · `print.css`
- `assets/js/viewer.js` toolbar (page counter, contents drawer, zoom, theme, print) · `descent.js` Figure 1 ·
  `widgets.js` readiness, eligibility, doubts search · `calc.js` Figure 3 · `calendar.js` Figure 4
- `assets/fonts/` subset CMU Serif + Typewriter (OFL)
- `tests/` Playwright checks and screenshot scripts; `tests/splice.py` inserts a page fragment before `</main>`

## Verify before saying done

`node tests/check.mjs` (local) and `node tests/check.mjs https://angadseth.github.io/converge/ --links` must print
ALL PASSED, and look at `node tests/pages.mjs` screenshots in both themes.
