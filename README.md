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
│   ├── styles.css              ← look and feel
│   ├── data.js                 ← ALL the numbers live here
│   ├── app.js                  ← rendering, charts, admin drawer
│   ├── import.js               ← Excel/CSV import + template generator
│   └── vendor/xlsx.full.min.js ← SheetJS, vendored so it works offline
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

**2. Excel / CSV import (fastest for the placement cell)** — header ✎ → *Import from Excel / CSV*:

1. **Download template .xlsx** (four sheets with the exact headers and one example row) and fill it in.
2. Pick the file. It is parsed **in the browser** — nothing is uploaded anywhere.
3. Read the preview: how many placement years / recruiter rows / research rows / events were
   recognised, the parsed numbers, and any row-level warnings.
4. Leave *add publications to existing list* unchecked to **replace** the research table with the
   sheet, or check it to append (duplicates matched on year + title).
5. **Apply to dashboard** — the panels re-render straight away and the year dropdown picks up any
   new academic year.
6. **Export data.js** → drop the download into `assets/` to publish the change for everyone.

Sheets are recognised by their **header row**, not their name or order, so you can send one sheet
or all four, from Excel, LibreOffice or Google Sheets (`File → Download → .xlsx`).

| Sheet | Columns (aliases in brackets) |
|---|---|
| Placements | Academic Year, Eligible, Placed, Total Offers, Higher Studies, International, Companies, Average LPA, Median LPA, Highest LPA |
| Recruiters | Academic Year, Company, Sector, Offers, Role, CTC (LPA) — one row per company |
| Research | Year, Type (Journal / Conference / Patent / Book chapter / Grant), Title, Faculty (comma separated), Venue, Indexing, Status, DOI |
| Events *(optional)* | Date, End Date, Type (IA / Exam / Event / Deadline / Holiday), Title, Detail, Venue, Time |

Handled automatically: `2026-27` / `2026-2027` / `2026` / `2026-27` all normalise to the same year;
`6.5 LPA`, `₹6,50,000`-style cells and Excel date serials are cleaned; `dd-mm-yyyy` and `yyyy-mm-dd`
both parse; unrecognised sheets and bad rows are reported as warnings instead of failing silently.

**3. Inline forms (✎ in the header)** — add a single recruiter, publication/patent, or calendar date.
Entries save to the browser's localStorage, so they show immediately but only on that machine.
Press **Export data.js**, then replace `assets/data.js` to publish. **Discard local changes** wipes
the browser overlay (imports included).

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
6. Excel import: load the template, fill one row per sheet, Apply, confirm the numbers move in the
   KPIs and the tables, then Export data.js and reload to confirm they persist.

## Ideas for the next iteration

- Student achievements strip (hackathon wins, GATE/CAT results, internships).
- Placement funnel: registered → eligible → interviewed → placed.
- MoU / industry-collaboration and funded-project tracker.
- Per-semester attendance and result pass-percentage widget.
- Read-only public view + HOD-authenticated edit view backed by a small API (imports currently
  publish by replacing `data.js`, which keeps the site static and free to host).
