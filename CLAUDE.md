# Converge: project rules

A guide for IIT Madras BS students taking **MLF, MLT, MLP and the MLP Project**. Live at
https://angadseth.github.io/converge/ (repo `angadseth/converge`, public, Pages from `main` root).

Read `memory/MEMORY.md` first (local only, gitignored), then `PROJECT-LOG.md`. Add to both as you work.
Raw research lives in `research/` (local only).

## Rules Angad set (2026-09-22)

1. **One site for MLF, MLT and MLP together**, in the spirit of the TDS Field Guide, with everything worth reading
   "jitne jha se sources mile": official lectures, course-team notes, books, YouTube, community.
2. **Theme history (read before touching the design).**
   - 2026-09-22 morning: built as an **arXiv paper in a PDF viewer**. Angad: "mast si site bana … website … ye pdf
     wala ak backup … new wali … jese ki meri ye site h [TDS Field Guide]".
   - So the paper edition moved to **`/paper/`** (git tag `v1-paper`) and the root became a **website in the TDS Field
     Guide's format** (loud editorial hero, stats ledger, a slab, a to-scale term chart, sticky chapter index, big
     chapter numbers, margin notes, widgets) with **its own ML materials**: dotted plot paper instead of graph paper,
     viridis lime instead of the yellow highlighter, teal instead of the blue pen, matplotlib-style arrow notes
     instead of handwriting, Bricolage Grotesque + Source Serif 4 + JetBrains Mono. Keep it a sibling, not a copy.
3. **Credit: "Made by Angad Jangir" only.** No co-maker. (The TDS guide credits Bharat; this one does not.)
4. **Many small, real commits.** Angad wants his GitHub contribution graph green. One logical change per commit,
   pushed as you go. Never backdate or fake commits.
5. **Approach, not answers.** No graded-assignment, OPPE or project solutions, and no links to repos that post them.
6. **Every fact needs a source** (see `docs/sources.md`). Unverifiable: attribute it or leave it out. Open every link
   before adding it.
7. **Site language: simple English, friendly senior.** Chat with Angad stays in Hinglish.

## Stack

Plain HTML/CSS/JS, no build step.

- `index.html`: the website. Hero, stats, slab, term chart, 12 `section.chapter`s, footer, next-exam ticket.
- `assets/site/` tokens · layout · components · widgets CSS for the website
- `paper/index.html` + `assets/css/`: the paper edition
- `assets/js/` shared by both: `descent.js` (Figure 1; plot font from `--plot-font`), `calendar.js` (term chart,
  exposes `window.convergeNext`), `calc.js`, `widgets.js` (readiness, eligibility, doubts search);
  `site.js` (website chrome) and `viewer.js` (paper chrome)
- `tests/`: `check.mjs` covers both editions; `sections.mjs`, `pages.mjs`, `fig.mjs` screenshots;
  `og-site.mjs`/`og.mjs` share cards; `splice.py` inserts a fragment before `</main>`

## Verify before saying done

`node tests/check.mjs` (local) and `node tests/check.mjs https://angadseth.github.io/converge/ --links` must print
ALL PASSED, and look at `node tests/pages.mjs` screenshots in both themes.
