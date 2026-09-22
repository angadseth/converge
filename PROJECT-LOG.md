# Converge: project log

Newest entry at the top. Rules: `CLAUDE.md`. Sources: `docs/sources.md`.

---

## 2026-09-22: Built and shipped in one session

**Brief (Angad, Hinglish):** like the TDS site, make one for MLF, MLT and MLP together; a unique theme, not the TDS
one; credit only "Made by Angad Jangir"; gather the best sources from everywhere, YouTube lectures included; make
many small commits so the GitHub graph goes green.

**Research:**
- Official course pages (BSCS2004/2007/2008/2008P), the May 2026 grading document, the MLP Project guideline
  [May-26], the Academics page and the academic calendar images (Sep 2026, Jan 2027, May 2027, Sep 2027).
- The three official lecture playlists via yt-dlp: MLF 93 videos / 36.8 h, MLT 74 / 27.2 h, MLP 98 / 27.8 h.
  The MLF and MLP week maps come from these titles because the course pages are out of date.
- The IITM BS channel's playlists (MLP Tutorials, MLT to MLP, workshops), the MLT course team's own channel.
- Course-team notes on GitHub (bsc-iitm MLF notes, MLT_notes, ML_Handbook, karthik-iitm MLT notes).
- Free books, outside courses, student past-paper videos; 49 references, each opened.
- Angad's own May 2026 MLP work (KA2 bank churn, KA3 mushrooms, project on Kaggle, viva prep) for Sections 6.3/7.5.

**Design decision (mine):** first idea was cream paper + serif + vermilion, which the frontend-design skill lists as
the generic AI look, so it was dropped. Chosen: the guide as an arXiv paper inside a PDF viewer. Chrome's PDF toolbar
(page counter, zoom, print, contents drawer = the PDF outline), Computer Modern, NeurIPS title rules, Proposition +
Proof boxes, booktabs, algorithmic blocks, hyperref link colours, matplotlib tab10 course colours and viridis
contours. The one bold element is Figure 1: live gradient descent with momentum over three basins labelled
MLF → MLT → MLP.

**Built:** 15 pages: title + abstract + Figure 1 + Table 1; 1 intro; 2 requisites (Figure 2) + plans; 3 pre-skills +
readiness check; 4 MLF; 5 MLT (five-components table); 6 MLP (OPPE outcomes table, KAs); 7 project; 8 assessments +
eligibility check; 9 calculator (Figure 3); 10 calendar (Figure 4, three terms, countdown); 11 resources; 12 the
eight rules; References; Appendix A (22 doubts, searchable); Appendix B (glossary). Share card `assets/og.png`.

**Verified:** `tests/check.mjs` ALL PASSED locally: 6 viewports × 2 themes (no sideways scroll, no console errors,
fonts), every internal link and citation, every reference cited, Figure 1 behaviour (MLP / stuck in MLF / diverges),
calculator maths for all four courses, eligibility edge cases, search, theme cycle, zoom, persistence, storage blocked.
Found and fixed by looking: a 7 px overflow at 320 px (grade table), Figure 2 label crowding, the calendar's
"today" label colliding, equations wrapping on desktop, a card overflowing in the share image.

**Still open:**
- Sep 2026 grading document and project guideline are not out yet. When they are: update the formulas if they
  changed, Remark 1.1, the KA and milestone dates (Sections 6.3, 7.3), the cutoff, and `docs/sources.md`.
- Grade bands (S 90 … E 40) are the programme's usual scale, not from the grading document; the page says confirm.
- The OPPE timing/duration for MLP is not stated anywhere I could read reliably; left out on purpose.
