# Department Dashboard — DSATM CSE (Data Science)

Visual-first department dashboard: placements, placement plan, research and faculty.
Charts and numbers first, tables only where a count needs a year-by-year breakdown.
Every admin (✎) field is editable in the browser; no server needed.

**Live:** https://maheshbasavaraj.github.io/dsatm-csd-dashboard/

## Tabs

| Tab | What is on it |
|---|---|
| **Overview** | 4 KPI tiles (placed, rate, highest package, publications), placement donut, package-band bars, publications-by-month bars, plan progress, year-wise numbers table |
| **Placements** | this-year chips + all-cycles chips, placed-vs-eligible donut, package bands, top recruiters bars, all-cycles table, full offer list (editable) |
| **Placement plan** | targets vs today as progress bars, 5 plan cards: aptitude training, weekly 1-hour LeetCode session, 2 planned hackathons, advanced database workshop (5th sem ongoing), advanced database workshop (7th sem completed) |
| **Research** | year chips, papers-per-faculty bars, journal-vs-conference donut, year-wise output table (papers / patents / Q1 / Q2), listed publications |
| **Faculty** | summary chips (teaching faculty, doctorates, papers, patents), cards with qualification, area, paper/patent counts, h-index |

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
