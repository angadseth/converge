# Converge

**Live: https://angadseth.github.io/converge/**

The field guide to the machine learning courses of the IIT Madras BS Diploma in Data Science:
**Machine Learning Foundations (MLF)**, **Machine Learning Techniques (MLT)**, **Machine Learning Practice (MLP)**
and the **MLP Project**. A sibling of the [TDS Field Guide](https://angadseth.github.io/tds-field-guide/),
with its own look: plot paper, a viridis-lime highlighter, and a live gradient-descent plot as the hero.

Two editions, same content:

- **Website** (`/`): the main guide, 12 chapters with a sticky chapter index.
- **Paper edition** (`/paper/`): the first version, typeset as an arXiv paper in a PDF viewer. Kept as a backup
  (git tag `v1-paper`). It has the full numbered references list.

What is inside:

- what each course is, week by week, taken from the official lecture playlists
- how the courses depend on each other, and the grading document's own study plans
- every grading formula, the end term eligibility rules, and what happens if you fail an OPPE
- a method for each kind of assessment: weekly assignments, quizzes, OPPEs, Kaggle assignments, the end term
- the MLP Project: registration, the rules that end a project, the marks, both vivas, and what worked for me
- a live gradient descent figure, an eligibility check and a marks calculator
- the Sep 2026, Jan 2027 and May 2027 exam calendars, with a countdown to the next one
- 49 checked references: official lectures and notes, free textbooks, the best courses elsewhere, student-made past-paper videos
- 22 common doubts, searchable

**No answers to graded work.** Every rule cites its source. When this guide and an official page disagree,
the official page wins. Nothing you type leaves your browser.

This is not an official IIT Madras page. Found something wrong or out of date?
[Open an issue](https://github.com/angadseth/converge/issues).

## Working on it

Plain HTML, CSS and JavaScript. No build step. GitHub Pages serves `main`.

```bash
python -m http.server 8777 --bind 127.0.0.1   # serve locally
cd tests && npm install
node check.mjs                                  # both editions: 12 viewport/theme pairs each, maths, widgets
node check.mjs https://angadseth.github.io/converge/ --links
node sections.mjs light 1366                    # screenshot every website section
node pages.mjs light 1366 http://127.0.0.1:8777/paper/   # every page of the paper edition
```

Sources for every fact: [`docs/sources.md`](docs/sources.md).

Made by Angad Jangir
