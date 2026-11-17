# Department Dashboard — DSATM CSE (Data Science)

A single-page, zero-dependency department dashboard for **CSE (Data Science), DSATM**.
Covers placements, research output (papers / patents / grants), the department calendar
(IA, SEE, events, deadlines) and the faculty directory.

Runs from a plain folder — no server, no build step, no internet needed. Open
`index.html` and it works. Numbers are plain JavaScript objects in one file.

> **The shipped figures are sample data** so the layout can be judged. Replace them with the
> department's real numbers before circulating the link (see *Updating data*).

---

## What is on it

| Panel | What it answers |
|---|---|
| **Overview** | Headline KPIs (placed, rate, highest package, papers, patents), placement trend across 4 cycles, next 5 department dates, research output mix, derived headline numbers |
| **Placements** | Eligible / placed / offers / recruiters / average / highest / higher studies / international, CTC-band and sector charts, full recruiter table, year-on-year comparison |
| **Research** | Journals, conferences, patents, book chapters, grants — searchable and filterable by type / faculty / year, with DOI links, plus output-per-year and faculty-wise charts |
| **Calendar** | Upcoming IA / SEE / events / deadlines with countdowns, month grouping, past dates dimmed, IA weightage plan, odd/even semester map |
| **Faculty** | Directory cards with specialisation, live paper/patent/grant counts and Scholar/Scopus/email links |

Extras: academic-year switcher, dark / light theme, print stylesheet (browser → Print →
PDF gives a clean handout), mobile layout, and an **admin drawer** for non-technical updates.

## File layout

```
dept dashboard/
├── index.html
├── assets/
│   ├── styles.css     ← look and feel
│   ├── data.js        ← ALL the numbers live here
│   └── app.js         ← rendering, charts, admin drawer
└── README.md
```

## Running it

```bash
# simplest: double-click index.html

# or serve it (needed if you later add fetch-based data)
python -m http.server 8080
# then open http://127.0.0.1:8080
```

## Updating data

Two routes, both edit the same shape.

**1. Direct edit (recommended for bulk changes)** — open `assets/data.js`:

- `meta` — college name, HOD, e-mail, `lastUpdated`, and `activeYear` (the year shown on load).
  Set `meta.sample = false` once real data is in; that removes the "sample data" footer chip.
- `academicYears` — most recent first. Each entry needs a matching block under `placement`.
- `placement["2026-27"]` — `eligible`, `placed`, `offers`, `higherStudies`, `companies`,
  `highestLpa`, `averageLpa`, `medianLpa`, `international`, and `recruiters[]` rows
  (`name`, `sector`, `offers`, `role`, `ctc`). The recruiter list may be partial: the declared
  `offers` count is used as the denominator for all share percentages, and the table header
  states "N of M offers listed".
- `research[]` — one row per output: `year`, `type` (`Journal` | `Conference` | `Patent` |
  `Book chapter` | `Grant`), `title`, `faculty[]`, `venue`, `indexing`
  (`SCI` / `Scopus` / `UGC-CARE` / `Granted` / `Published`), `status`, `doi`.
  Faculty-wise counts and every chart derive from this array — add the row once.
- `events[]` — `date` (YYYY-MM-DD), optional `endDate`, `type`
  (`ia` | `exam` | `event` | `deadline` | `holiday`), `title`, `detail`, `venue`.
  Past dates are dimmed automatically; the semester map and countdowns come from these dates.
- `iaPlan[]` — the assessment weightage table.
- `faculty[]` — `name`, `designation`, `area`, `email`, `scholar`, `scopus`.

**2. Admin drawer (✎ in the header)** — add recruiters, publications/patents, or calendar dates
through a form. Entries save to the browser's localStorage, so they show immediately but only on
that machine. Press **Export data.js**, then replace `assets/data.js` with the downloaded file to
publish them. **Discard local changes** wipes the browser overlay.

Keep faculty names character-identical between `faculty[]` and `research[].faculty[]` — the
per-faculty counts match on the exact string.

## Publishing

Any static host works; the folder is self-contained.

- **GitHub Pages** — push, then Settings → Pages → deploy from `main` / root.
- **College intranet** — copy the folder to the web root.
- **Render / Netlify / Vercel** — static site, no build command.

## Verification checklist before sharing

1. Placement rate = placed ÷ eligible, and declared offers ≥ offers in the recruiter table.
2. Every journal/patent/grant row appears once in `research[]` (faculty counts feed off it).
3. IA-3 and SEE dates match the latest VTU / college calendar.
4. Footer shows the intended `lastUpdated` date and no "sample data" chip.
5. `python -m http.server 8080` → click through all five tabs at desktop **and** phone width.

## Ideas for the next iteration

- Student achievements strip (hackathon wins, GATE/CAT results, internships).
- Placement funnel: registered → eligible → interviewed → placed.
- MoU / industry-collaboration and funded-project tracker.
- Per-semester attendance and result pass-percentage widget.
- CSV import so the placement cell can paste an Excel export instead of editing arrays.
- Read-only public view + HOD-authenticated edit view backed by a small API.
