# Department Dashboard — DSATM CSE (Data Science)

Visual-first department dashboard: placements, placement plan, research and faculty.
Charts and numbers first, tables only where a count needs a year-by-year breakdown.
Every admin (✎) field is editable in the browser; no server needed.

**Live:** https://maheshbasavaraj.github.io/dsatm-csd-dashboard/

## Tabs

Four tabs. Overview leads with research, then placements — the order the department reports in.

| Tab | What is on it |
|---|---|
| **Overview** | 4 KPI tiles (publications, placed, rate, highest package) · **Publications first**: papers-by-month bars + papers-by-faculty bars · **then placement**: placed-vs-eligible donut + package-band bars · year-wise numbers table |
| **Placements** | this-year chips + all-cycles chips, placed donut, package bands, top recruiters, all-cycles table, offer list, **and the placement plan** (targets vs today + 5 plan cards) at the bottom of the same tab |
| **Research** | year chips, papers-per-faculty bars, journal-vs-conference donut, year-wise output table (papers/patents/Q1/Q2), listed publications |
| **Faculty** | summary chips (teaching faculty, doctorates, papers, patents), cards with qualification, area, paper/patent counts, h-index |

**Placement plan cards:** aptitude training (weekly) · LeetCode session (1 hour every week) ·
2 hackathons planned · advanced database workshop, 5th sem ongoing · advanced database workshop,
7th sem completed.

## Database — SQLite + Express (`server/`)

The dashboard now runs against a real database when served by the Node app.
Opened as a plain file (or from GitHub Pages) it still works read-only from `assets/data.js`.

```
server/
  index.js      Express: /api/* + serves the dashboard itself
  db.js         SQLite schema, seed, read-model (returns the exact data.js shape)
  data/dept.db  the database (gitignored)
render.yaml     one-service deploy blueprint with a persistent disk
```

Tables: `years`, `offers`, `publications`, `faculty`, `support_staff`, `patents`,
`plan_items`, `settings`. First boot seeds them from `assets/data.js` (67 publications,
44 offers, 12 faculty rows, 5 plan items).

**Run locally**

```bash
cd server
npm install
ADMIN_PASSWORD=yourpassword PORT=3100 node index.js
# open http://127.0.0.1:3100   → header shows a "SQLite" badge
```

**API**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/data` | public | whole dataset in the dashboard's document shape |
| GET | `/api/health` | public | `{ok, rows}` for uptime checks |
| POST | `/api/login` | — | shared password → bearer token (12 h) |
| POST/PUT/DELETE | `/api/offers[/:id]` | bearer | placement offer rows |
| POST/PUT/DELETE | `/api/publications[/:id]` | bearer | papers / conference entries |
| POST/PUT/DELETE | `/api/faculty[/:id]` | bearer | faculty records |
| POST/PUT/DELETE | `/api/plan-items[/:id]` | bearer | placement plan cards |
| PUT | `/api/years/:label` | bearer | eligible strength for a year |
| PUT | `/api/patents/:ay` | bearer | patent count for a year |

Writes require the shared admin password (`ADMIN_PASSWORD`); the browser keeps the token in
`sessionStorage` and shows "Signed in · changes save to the department database" in the admin bar.

**Deploy on Render**

1. Push this repo, then Render → New → Blueprint → pick the repo (`render.yaml` is read).
2. Set `ADMIN_PASSWORD` when prompted (the only manual step).
3. Deploy. `DATA_DIR=/var/data` on the 1 GB disk keeps `dept.db` across restarts.
4. Share the Render URL; GitHub Pages stays as a read-only snapshot.

`files/` and `server/` are blocked from static serving by the API process, so student lists never
leak through the web server.

## Admin — create, edit, delete on every tab

Click **✎ Admin** in the header. Then:

- **+ Add offer** (Placements), **+ Add plan item** (Placement plan), **+ Add publication** (Research), **+ Add faculty** (Faculty).
- Every list row, plan card and faculty card gets **✎ edit** and **🗑 delete**.
- Changes apply instantly to charts and numbers, and are stored in this browser (localStorage) so they survive a reload.
- **Export data.js** downloads the edited dataset with a fresh `lastUpdated` date. Replace `assets/data.js` with it to publish for everyone.
- **Reset changes** discards local edits.

Editable fields: offer (student, company, CTC) · publication (title, faculty, type, venue, year, month, quartile, DOI) · faculty (name, designation, qualification, area, h-index) · plan item (title, detail, status, schedule, progress %).

## Source data

| Source | Feeds |
|---|---|
| `files/PLACEMENT ANALYSIS.xlsx` (2022 & 2023 batch lists) | placements — every offer, company, CTC |
| `files/Faculty Publication and Patent details.xlsx` | research list + patent counts + h-index |
| `files/2023 batch student details.xlsx` | eligible strength (68) for 2026-27 |
| `https://dsatm.edu.in/csds-fac` (`tools/faculty.json`) | faculty roster |

```bash
node tools/build-data.js     # regenerates assets/data.js from files/ + tools/
```

Batch mapping: 2022 batch → AY 2025-26, 2023 batch → AY 2026-27.

## What the numbers are

- 2026-27: 9 students placed, 12 offers, 3 companies, 68 eligible (13.2%), average 4.85 LPA, highest 8 LPA.
- 2025-26: 27 students placed, 32 offers, 21 companies, average 5.21 LPA, highest 10 LPA. Eligible strength is **not** in the source files, so the rate shows "—" rather than a guess.
- All cycles: 35 students placed, 44 offers, 23 recruiters, best package 10 LPA.
- Research: 67 listed papers/conference publications (45 in 2025-26, 22 in 2026-27 so far), 14 + 7 patents reported by faculty, 14 teaching faculty.
- Patent titles are not in the workbook — only counts.
- Students are de-duplicated by USN (the 2023 sheet lists one student twice under different name spellings).

## Files

```
index.html            layout shell
assets/styles.css     theme, cards, charts, dialog
assets/app.js         charts, renders, admin CRUD
assets/data.js        GENERATED data (do not hand-edit)
tools/build-data.js   workbook → data.js
tools/faculty.json    faculty roster
files/                source spreadsheets (student-level, keep local)
assets/import.js      legacy Excel importer, no longer wired into the page
```

`files/` holds student names and USNs — keep it out of any public repo.
