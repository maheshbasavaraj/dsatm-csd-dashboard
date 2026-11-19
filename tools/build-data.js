#!/usr/bin/env node
/* Build assets/data.js from the department workbooks in files/ + tools/faculty.json.
   Run: node tools/build-data.js
   Nothing is invented: missing fields are emitted as null. */
"use strict";
const fs = require("fs");
const path = require("path");
const XLSX = require("../assets/vendor/xlsx.full.min.js");

const ROOT = path.resolve(__dirname, "..");
const FILES = path.join(ROOT, "files");
const rd = (n) => XLSX.read(fs.readFileSync(path.join(FILES, n)), { cellDates: true });
const rowsOf = (wb, s) => XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1, defval: "", raw: false });
const clean = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
const num = (v) => { const m = String(v == null ? "" : v).replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
const norm = (s) => clean(s).toLowerCase().replace(/^(dr|mr|mrs|ms|prof)\.?\s+/, "").replace(/[^a-z]/g, "");

const FIX = { "infosys": "Infosys", "ltimindtree": "LTIMindtree", "lti mindtree": "LTIMindtree",
  "hashedin by deloitte": "HashedIn by Deloitte", "edgeverve": "EdgeVerve", "blutech talent": "BluTech Talent",
  "alpha innovations": "Alpha Innovations", "aenexz tech": "Aenexz Tech", "arnifi india technologies": "Arnifi India Technologies" };

/* ---------- placements ---------- */
function offersFromSheet(wb, sheet, ay) {
  const rows = rowsOf(wb, sheet);
  const h = rows.findIndex(r => r.some(c => /^NAME$/i.test(clean(c))) && r.some(c => /COMPANY/i.test(clean(c))));
  const out = [];
  let cur = null;
  rows.slice(h + 1).forEach(r => {
    const name = clean(r[1]), usn = clean(r[2]), company = clean(r[3]), lpa = num(r[4]);
    if (/^signature/i.test(company) || /^signature/i.test(name)) return;
    if (name) cur = { name, usn };
    if (!company || lpa == null || !cur) return;
    out.push({ student: cur.name, usn: cur.usn, company: FIX[company.toLowerCase()] || company, ctc: lpa });
  });
  return { ay, offers: out };
}

function buildPlacement() {
  const wb = rd("PLACEMENT ANALYSIS.xlsx");
  const roster = (() => {
    const w = rd("2023 batch student details.xlsx");
    const s = new Set();
    rowsOf(w, w.SheetNames[0]).forEach(r => r.forEach(c => {
      const m = String(c).match(/1DT\d{2}CD\d{3}/); if (m) s.add(m[0]);
    }));
    return s.size;
  })();

  const a = offersFromSheet(wb, "2022", "2025-26");
  const b = offersFromSheet(wb, "2023", "2026-27");
  const out = {
    "2026-27": { eligible: roster, offers: b.offers, note: "2023 batch · placement season in progress" },
    "2025-26": { eligible: null, offers: a.offers, note: "2022 batch · eligible strength not in source files" }
  };
  console.log("  placement:", Object.entries(out).map(([k, v]) => `${k}: ${v.offers.length} offers / ${v.eligible ?? "?"} eligible`).join(" | "));
  return out;
}

/* ---------- publications ---------- */
const MN = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const MS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthYear(cell) {
  const s = clean(cell).toLowerCase();
  let m = MN.findIndex(n => s.includes(n));
  if (m < 0) m = MS.findIndex(n => s.includes(n.toLowerCase()));
  if (m < 0) return { month: null, year: null };
  const y = s.match(/(20\d{2})/);
  return { month: m + 1, year: y ? Number(y[1]) : null };
}
const ayOf = (y, m) => (y && m) ? (m >= 7 ? `${y}-${String((y + 1) % 100).padStart(2, "0")}` : `${y - 1}-${String(y % 100).padStart(2, "0")}`) : null;

function cleanDoi(v) {
  let s = clean(v).replace(/^doi:\s*/i, "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/[.,;\s]+$/, "");
  return /^10\./.test(s) ? `https://doi.org/${s}` : "";
}

function buildResearch(faculty) {
  const wb = rd("Faculty Publication and Patent details.xlsx");
  const match = (raw) => {
    const k = norm(raw); if (k.length < 4) return null;
    let f = faculty.find(x => norm(x.name) === k) || faculty.find(x => norm(x.name).includes(k) || k.includes(norm(x.name)));
    if (!f) { const h = k.slice(0, 5); f = faculty.find(x => norm(x.name).startsWith(h) || norm(x.name).includes(h)); }
    return f ? f.name : null;
  };

  const items = [], seen = new Set(), unmatched = [];
  [["Jan 2026 to June 2026", 2026], ["July 2026 to Dec 2026", 2026]].forEach(([sheet, fy]) => {
    let cur = null;
    rowsOf(wb, sheet).forEach((r, i) => {
      const nm = clean(r[1]);
      if (/^(dr|mr|mrs|ms|prof)/i.test(nm) && norm(nm).length > 4) cur = nm;
      const title = clean(r[2]);
      if (!title || title.length < 12 || /^paper title$/i.test(title)) return;
      const claim = clean(r[4]) || cur || "";
      const who = match(claim);
      if (!who && claim) unmatched.push(`${sheet} r${i + 1}: ${claim}`);
      const { month, year } = monthYear(r[7]);
      const y = year || fy;
      const doi = cleanDoi(r[9]);
      const key = (doi || title).toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      const venue = clean(r[8]);
      items.push({
        ay: ayOf(y, month) || (sheet.startsWith("July") ? "2026-27" : "2025-26"),
        year: y, month: month || null,
        type: /conference|congress|symposium|proceedings|workshop/i.test(venue) ? "Conference" : "Journal",
        title, faculty: who ? [who] : [clean(claim)],
        venue, indexing: clean(r[5]) || "", quartile: /^Q[1-4]$/i.test(clean(r[6])) ? clean(r[6]).toUpperCase() : "",
        doi
      });
    });
  });

  // patents: counts only (no titles in the workbook)
  const tc = rowsOf(wb, "Total Count");
  const hi = tc.findIndex(r => r.some(c => /name of the faculty/i.test(String(c))));
  const hdr = tc[hi] || [];
  const col = (re, from = 0) => hdr.findIndex((c, i) => i >= from && re.test(String(c)));
  const cN = col(/name of the faculty/i), cH = col(/h-index/i);
  const cP1 = col(/publications/i), cPa1 = col(/patents/i);
  const cP2 = col(/publications/i, cP1 + 1), cPa2 = col(/patents/i, cPa1 + 1);
  const patents = { "2025-26": 0, "2026-27": 0, byFaculty: {} };
  tc.slice(hi + 1).forEach(r => {
    const who = match(clean(r[cN])); if (!who) return;
    const p1 = num(r[cPa1]) || 0, p2 = num(r[cPa2]) || 0;
    patents["2025-26"] += p1; patents["2026-27"] += p2;
    if (p1 + p2) patents.byFaculty[who] = p1 + p2;
    const f = faculty.find(x => x.name === who);
    if (f && f.hIndex == null && num(r[cH]) != null) f.hIndex = num(r[cH]);
  });
  if (unmatched.length) console.log("  unmatched faculty:", unmatched);
  console.log(`  research: ${items.length} rows | patents ${patents["2025-26"]} + ${patents["2026-27"]}`);
  return { items, patents };
}

/* ---------- placement plan (plain-language, editable) ---------- */
const plan = {
  status: "Draft — pending HOD approval",
  target: { placed: 55, offers: 65, avgCtc: 6.5, companies: 45, ay: "2026-27" },
  items: [
    { id: "aptitude", title: "Aptitude training", detail: "Weekly aptitude sessions from semester 5 — quantitative, logical and verbal, with a timed test every month.", status: "Ongoing", meta: "Weekly · semester 5 onwards", progress: 40 },
    { id: "leetcode", title: "LeetCode session", detail: "One-hour coding session every week: two problems live-solved, then a set for the week on LeetCode.", status: "Planned", meta: "Every week · 1 hour", progress: 0 },
    { id: "hackathons", title: "Hackathons", detail: "Two department hackathons planned this academic year; teams of three, judged by industry mentors.", status: "Planned", meta: "2 planned · 0 completed", progress: 0 },
    { id: "db-workshop-5", title: "Advanced Database workshop — 5th semester", detail: "Hands-on advanced database workshop (indexing, query tuning, NoSQL) running for the 5th semester batch.", status: "Ongoing", meta: "5th semester", progress: 55 },
    { id: "db-workshop-7", title: "Advanced Database workshop — 7th semester", detail: "One advanced database workshop completed for the 7th semester batch.", status: "Completed", meta: "7th semester · 1 completed", progress: 100 }
  ]
};

/* ---------- emit ---------- */
const facultyJson = JSON.parse(fs.readFileSync(path.join(__dirname, "faculty.json"), "utf8"));
const faculty = facultyJson.faculty;
const placement = buildPlacement();
const { items, patents } = buildResearch(faculty);

const P = (o) => JSON.stringify(o, null, 1).replace(/\n/g, "\n");

const data = {
  meta: {
    college: "Dayananda Sagar Academy of Technology and Management",
    shortCollege: "DSATM",
    department: "Computer Science & Engineering (Data Science)",
    hod: "Dr. Sumithra Devi K A",
    lastUpdated: new Date().toISOString().slice(0, 10),
    activeYear: "2026-27",
    sources: [
      "PLACEMENT ANALYSIS.xlsx — 2022 & 2023 batch placed-student lists",
      "Faculty Publication and Patent details.xlsx — Jan–Jun 2026, Jul–Dec 2026 lists + Total Count",
      "2023 batch student details.xlsx — batch strength",
      "dsatm.edu.in/csds-fac — faculty roster"
    ],
    notes: [
      "2025-26 eligible strength is not in the source files, so that year's placement rate is withheld.",
      "Patent titles are not in the workbook — counts only (14 for 2025-26, 7 for 2026-27).",
      "Publication list = what faculty submitted; the workbook's own total column is higher."
    ]
  },
  years: ["2026-27", "2025-26"],
  placement, patents, research: items, faculty,
  supportStaff: facultyJson.supportStaff || [],
  plan
};

fs.writeFileSync(path.join(ROOT, "assets", "data.js"),
  "/* GENERATED by tools/build-data.js — do not hand-edit. Rebuild: node tools/build-data.js */\nwindow.DEPT_DATA = "
  + JSON.stringify(data, null, 2) + ";\n", "utf8");
console.log("wrote assets/data.js");
