/* ============================================================
   Excel (or CSV) import for the department dashboard.

   Reads a workbook, recognises sheets by their header row, maps
   common column-name variants onto the dashboard schema, shows a
   preview, and — on Apply — stores the parsed blocks in
   localStorage under the same overlay the admin forms use.

   Sheets understood (order and names are free):
     • Placements   one row per academic year (eligible, placed, offers, …)
     • Recruiters   one row per company offer (company, sector, offers, role, ctc)
     • Research     one row per journal / conference / patent / grant
     • Events       one row per calendar date (optional)

   The workbook is parsed entirely in the browser. Nothing is uploaded.
   ============================================================ */

(function () {
  "use strict";

  const HAS_XLSX = typeof XLSX !== "undefined";

  /* ---------------------- helpers ---------------------- */
  const norm = (s) => String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]/g, "");

  function toNum(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return v;
    const s = String(v).replace(/[,₹$]/g, "").replace(/\s*lpa\s*/i, "").trim();
    const m = s.match(/-?\d+(\.\d+)?/);
    return m ? Number(m[0]) : null;
  }

  function toISODate(v) {
    if (v == null || v === "") return null;
    if (v instanceof Date && !isNaN(v)) {
      return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}-${String(v.getDate()).padStart(2, "0")}`;
    }
    if (typeof v === "number" && v > 20000 && v < 60000) {          // Excel serial
      const ms = Math.round((v - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);            // dd-mm-yyyy
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    const d = new Date(s);
    if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return null;
  }

  function normAY(v) {
    if (v == null || v === "") return null;
    const s = String(v).trim();
    const pick = (a) => `${a}-${String((a + 1) % 100).padStart(2, "0")}`;
    let m = s.match(/(\d{4})\s*[-/–]\s*(\d{2,4})/);
    if (m) return pick(Number(m[1]));           // "2026-27", "2026-2027", "2026/27" → "2026-27"
    const y = s.match(/(\d{4})/);
    if (y) return pick(Number(y[1]));           // "2026" → "2026-27"
    return null;
  }

  function normType(v) {
    const n = norm(v);
    if (n.includes("journal")) return "Journal";
    if (n.includes("confer") || n.includes("symposi") || n.includes("workshop") || n.includes("proceed")) return "Conference";
    if (n.includes("patent")) return "Patent";
    if (n.includes("book") || n.includes("chapter")) return "Book chapter";
    if (n.includes("grant") || n.includes("fund") || n.includes("project")) return "Grant";
    return null;
  }

  function normEventType(v) {
    const n = norm(v);
    if (n === "ia" || n.includes("internal") || n.includes("assessment")) return "ia";
    if (n.includes("exam") || n.includes("see") || n.includes("semesterend")) return "exam";
    if (n.includes("dead")) return "deadline";
    if (n.includes("holi") || n.includes("break") || n.includes("vacation")) return "holiday";
    return "event";
  }

  const ALIASES = {
    year: ["academicyear", "year", "ay", "academicsession", "session", "cycle"],
    eligible: ["eligible", "eligiblecount", "noofeligible", "eligibleStudents".toLowerCase(), "totalstudents", "strength"],
    placed: ["placed", "studentsplaced", "placedcount", "noofplaced", "placedstudents", "totalplaced"],
    offers: ["totaloffers", "offers", "offercount", "noofoffers", "offerletters"],
    higher: ["higherstudies", "highereducation", "higherstudiecount", "highered", "higheredu"],
    intl: ["international", "internationaloffers", "overseas", "abroad"],
    companies: ["companies", "companiesvisited", "recruiters", "noofcompanies", "totalcompanies"],
    avg: ["averagelpa", "averagectc", "avgctc", "averagectc", "avgpackage", "average", "averagepackage"],
    median: ["medianlpa", "medianctc", "median", "medianpackage"],
    highest: ["highestlpa", "highestctc", "maxlpa", "highestpackage", "highest", "maxctc"],
    company: ["company", "companyname", "organisation", "organization", "recruiter", "employer", "firm"],
    sector: ["sector", "industry", "domain", "category"],
    role: ["role", "jobrole", "designation", "position", "profile"],
    ctc: ["ctc", "ctclpa", "package", "lpa", "ctcpackage", "salary"],
    type: ["type", "publicationtype", "outputtype", "papertype", "pubtype"],
    title: ["title", "papertitle", "publicationtitle", "topic", "patenttitle", "nameofpaper"],
    faculty: ["faculty", "authors", "author", "facultyname", "staff", "publishedby", "inventors"],
    venue: ["venue", "journal", "journalname", "conference", "conferencename", "publishedin",
      "details", "patentno", "publicationvenue", "publisher"],
    indexing: ["indexing", "indexed", "index", "indexedby", "scopus", "scopussci", "wos", "ugccare"],
    status: ["status", "state", "publicationstatus"],
    doi: ["doi", "link", "url", "doilink", "weblink"],
    date: ["date", "startdate", "from", "eventdate"],
    endDate: ["enddate", "end", "to", "todate"],
    evType: ["eventtype", "type", "kind"],
    detail: ["detail", "details", "description", "remarks", "notes"],
    evVenue: ["venue", "location", "room", "place", "where"],
    time: ["time", "timing"]
  };

  const normKey = (k) => norm(k);
  const ALIAS_MAP = {};
  Object.keys(ALIASES).forEach((field) => {
    ALIASES[field].forEach((a) => { ALIAS_MAP[norm(a)] = field; });
  });

  function picker(row, fields) {
    // row: {normHeader: value}; returns first non-empty value for the field list
    const keys = Object.keys(row);
    for (const k of keys) {
      const f = ALIAS_MAP[k];
      if (f && fields.includes(f) && String(row[k]).trim() !== "") return row[k];
    }
    return null;
  }

  function normalizeRows(rows) {
    return rows
      .map((r) => {
        const out = {};
        Object.keys(r || {}).forEach((k) => {
          const key = normKey(k);
          if (key) out[key] = r[k];
        });
        return out;
      })
      .filter((r) => Object.keys(r).length > 0);
  }

  /* ---------------------- workbook -> plan ---------------------- */
  function classify(sheetName, rows) {
    const keys = new Set(Object.keys(rows[0] || {}));
    const has = (f) => ALIASES[f].some((a) => keys.has(norm(a)));
    const name = norm(sheetName);

    if (has("company") && (has("ctc") || has("role"))) return "recruiters";
    if (has("eligible") || has("placed") || has("avg") || has("highest")) return "placements";
    if (has("title") && (has("type") || has("doi") || has("venue"))) return "research";
    if (has("date")) return "events";
    if (name.includes("recruit")) return "recruiters";
    if (name.includes("place")) return "placements";
    if (name.includes("publi") || name.includes("research") || name.includes("patent")) return "research";
    if (name.includes("event") || name.includes("calendar") || name.includes("ia")) return "events";
    return null;
  }

  function parseWorkbook(wb) {
    const plan = { placements: {}, recruiters: {}, research: [], events: [], warnings: [], sheetMap: {} };

    wb.SheetNames.forEach((name) => {
      const ws = wb.Sheets[name];
      if (!ws) return;
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });
      const rows = normalizeRows(raw);
      if (!rows.length) return;

      const kind = classify(name, rows);
      if (!kind) { plan.warnings.push(`Sheet "${name}" ignored — headers not recognised.`); return; }
      plan.sheetMap[name] = kind;

      rows.forEach((row, i) => {
        const where = `${name} row ${i + 2}`;
        if (kind === "placements") {
          const ay = normAY(picker(row, ["year"]));
          const blk = {
            eligible: toNum(picker(row, ["eligible"])),
            placed: toNum(picker(row, ["placed"])),
            offers: toNum(picker(row, ["offers"])),
            higherStudies: toNum(picker(row, ["higher"])),
            companies: toNum(picker(row, ["companies"])),
            highestLpa: toNum(picker(row, ["highest"])),
            averageLpa: toNum(picker(row, ["avg"])),
            medianLpa: toNum(picker(row, ["median"])),
            international: toNum(picker(row, ["intl"]))
          };
          Object.keys(blk).forEach((k) => { if (blk[k] === null) delete blk[k]; });
          if (!ay) { plan.warnings.push(`${where}: no academic year — row skipped.`); return; }
          if (!Object.keys(blk).length) { plan.warnings.push(`${where}: no figures found — row skipped.`); return; }
          plan.placements[ay] = Object.assign(plan.placements[ay] || {}, blk);
          return;
        }

        if (kind === "recruiters") {
          const company = picker(row, ["company"]);
          if (!company) { plan.warnings.push(`${where}: no company name — row skipped.`); return; }
          const latestAy = Object.keys(plan.placements).sort().pop() || null;
          const ay = normAY(picker(row, ["year"])) || latestAy;
          const r = {
            name: String(company).trim(),
            sector: (picker(row, ["sector"]) || "Other").toString().trim(),
            offers: toNum(picker(row, ["offers"])) || 1,
            role: (picker(row, ["role"]) || "—").toString().trim(),
            ctc: toNum(picker(row, ["ctc"])) || 0
          };
          if (!ay) { plan.warnings.push(`${where}: no academic year on the row or the Placements sheet — row skipped.`); return; }
          (plan.recruiters[ay] = plan.recruiters[ay] || []).push(r);
          return;
        }

        if (kind === "research") {
          const title = picker(row, ["title"]);
          if (!title) { plan.warnings.push(`${where}: no title — row skipped.`); return; }
          let type = normType(picker(row, ["type"]));
          if (!type) {
            const hay = norm(`${title} ${picker(row, ["venue"]) || ""}`);
            type = hay.includes("patent") ? "Patent" : hay.includes("grant") ? "Grant" : "Journal";
            plan.warnings.push(`${where}: type missing — assumed ${type}.`);
          }
          const fac = picker(row, ["faculty"]);
          plan.research.push({
            year: Number(toNum(picker(row, ["year"]))) || new Date().getFullYear(),
            type,
            title: String(title).trim(),
            faculty: String(fac || "").split(/[,;/&]| and /i).map((s) => s.trim()).filter(Boolean),
            venue: String(picker(row, ["venue"]) || "").trim(),
            indexing: String(picker(row, ["indexing"]) || "").trim(),
            status: String(picker(row, ["status"]) || "Published").trim(),
            doi: String(picker(row, ["doi"]) || "").trim()
          });
          return;
        }

        if (kind === "events") {
          const date = toISODate(picker(row, ["date"]));
          const title = picker(row, ["title"]) || picker(row, ["detail"]);
          if (!date || !title) { plan.warnings.push(`${where}: date or title missing — row skipped.`); return; }
          const ev = {
            date,
            type: normEventType(picker(row, ["evType"])),
            title: String(title).trim(),
            detail: String(picker(row, ["detail"]) || "").trim(),
            venue: [picker(row, ["evVenue"]), picker(row, ["time"])].filter(Boolean).join(", ")
          };
          const end = toISODate(picker(row, ["endDate"]));
          if (end && end !== date) ev.endDate = end;
          plan.events.push(ev);
        }
      });
    });

    // recruiters without year anywhere: attach leftovers to the newest imported year
    return plan;
  }

  /* ---------------------- preview ---------------------- */
  function previewHTML(plan) {
    const years = Object.keys(plan.placements).sort().reverse();
    const recYears = Object.keys(plan.recruiters).sort().reverse();
    const recCount = recYears.reduce((a, y) => a + plan.recruiters[y].length, 0);
    const blocks = [];

    const sheetLine = Object.entries(plan.sheetMap).map(([n, k]) => `${n} → ${k}`).join(", ");
    blocks.push(`<div class="imp-sheets">${sheetLine ? "Read: " + sheetLine : "No usable sheet found."}</div>`);

    const stat = (label, value) => `<div class="imp-stat"><span>${label}</span><b>${value}</b></div>`;
    blocks.push(`<div class="imp-stats">
      ${stat("Placement years", years.length)}
      ${stat("Recruiter rows", recCount)}
      ${stat("Research rows", plan.research.length)}
      ${stat("Event rows", plan.events.length)}
    </div>`);

    if (years.length) {
      blocks.push(`<table class="imp-table"><thead><tr><th>Year</th><th>Eligible</th><th>Placed</th><th>Offers</th><th>Avg</th><th>Highest</th></tr></thead><tbody>
        ${years.map((y) => {
          const p = plan.placements[y];
          return `<tr><td>${y}</td><td>${p.eligible ?? "—"}</td><td>${p.placed ?? "—"}</td>
            <td>${p.offers ?? "—"}</td><td>${p.averageLpa ?? "—"}</td><td>${p.highestLpa ?? "—"}</td></tr>`;
        }).join("")}
      </tbody></table>`);
    }

    if (recCount) {
      const top = recYears.flatMap((y) => plan.recruiters[y].map((r) => ({ ...r, ay: y })))
        .sort((a, b) => b.ctc - a.ctc).slice(0, 5);
      blocks.push(`<table class="imp-table"><thead><tr><th>Year</th><th>Company</th><th>Role</th><th>CTC</th></tr></thead><tbody>
        ${top.map((r) => `<tr><td>${r.ay}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.role)}</td><td>${r.ctc}</td></tr>`).join("")}
      </tbody></table>`);
    }

    if (plan.research.length) {
      const byType = {};
      plan.research.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + 1; });
      blocks.push(`<div class="imp-chips">${Object.entries(byType).map(([t, n]) => `<span class="chip">${t}: ${n}</span>`).join("")}</div>`);
    }

    if (plan.warnings.length) {
      blocks.push(`<details class="imp-warn" open><summary>${plan.warnings.length} warning(s)</summary>
        <ul>${plan.warnings.slice(0, 12).map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
        ${plan.warnings.length > 12 ? `<li>…and ${plan.warnings.length - 12} more</li>` : ""}</ul></details>`);
    }
    return blocks.join("");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
  }

  /* ---------------------- template ---------------------- */
  function downloadTemplate() {
    const wb = XLSX.utils.book_new();

    const placements = [
      ["Academic Year", "Eligible", "Placed", "Total Offers", "Higher Studies",
        "International", "Companies", "Average LPA", "Median LPA", "Highest LPA"],
      ["2026-27", 64, 56, 64, 4, 2, 42, 6.4, 5.6, 19.5]
    ];
    const recruiters = [
      ["Academic Year", "Company", "Sector", "Offers", "Role", "CTC (LPA)"],
      ["2026-27", "Tredence", "Analytics", 3, "Data Analyst", 8.5],
      ["2026-27", "TCS", "IT services", 9, "Assistant System Engineer", 3.6]
    ];
    const research = [
      ["Year", "Type", "Title", "Faculty", "Venue", "Indexing", "Status", "DOI"],
      [2026, "Journal", "Attention-guided graph networks for claim verification",
        "Dr. Shalini R., Prof. Naveen Kumar S.", "IEEE Access", "SCI", "Published", "https://doi.org/10.1109/ACCESS.2026.0000000"],
      [2026, "Patent", "Low-latency Kannada speech summarisation on edge devices",
        "Dr. Shalini R.", "App. 202641034521", "Published", "Published", ""],
      [2026, "Grant", "AI-assisted crop advisory for Hassan district FPOs",
        "Prof. Raghavendra P.", "KSCST — ₹9.4 L", "Granted", "Sanctioned", ""]
    ];
    const events = [
      ["Date", "End Date", "Type", "Title", "Detail", "Venue", "Time"],
      ["2026-11-24", "2026-11-27", "IA", "IA-3 — 5th & 7th semester", "Units 3–5, 50 marks", "Block C", "9:30 AM"],
      ["2026-12-01", "", "Event", "Datathon 2026", "24-hour department hackathon", "Innovation Lab", "9:00 AM"],
      ["2026-12-07", "2026-12-19", "Exam", "SEE — odd semester", "VTU timetable", "As notified", ""]
    ];

    [
      ["Placements", placements],
      ["Recruiters", recruiters],
      ["Research", research],
      ["Events", events]
    ].forEach(([name, aoa]) => {
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = aoa[0].map((h) => ({ wch: Math.max(12, String(h).length + 2) }));
      XLSX.utils.book_append_sheet(wb, ws, name);
    });

    XLSX.writeFile(wb, "dept-dashboard-template.xlsx");
  }

  /* ---------------------- UI wiring ---------------------- */
  function init() {
    const fileInput = document.getElementById("importFile");
    if (!fileInput) return;

    const previewEl = document.getElementById("importPreview");
    const applyBtn = document.getElementById("importApply");
    const statusEl = document.getElementById("importStatus");
    const mergeResearch = document.getElementById("importMergeResearch");
    let pending = null;

    if (!HAS_XLSX) {
      statusEl.textContent = "Spreadsheet library failed to load (assets/vendor/xlsx.full.min.js).";
      fileInput.disabled = true;
      return;
    }

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      statusEl.textContent = `Reading ${file.name}…`;
      const reader = new FileReader();
      reader.onerror = () => { statusEl.textContent = "Could not read that file."; };
      reader.onload = () => {
        try {
          const wb = XLSX.read(new Uint8Array(reader.result), { type: "array", cellDates: true });
          const plan = parseWorkbook(wb);
          const meaningful = Object.keys(plan.placements).length + Object.keys(plan.recruiters).length
            + plan.research.length + plan.events.length;
          pending = meaningful ? plan : null;
          previewEl.innerHTML = previewHTML(plan);
          previewEl.classList.add("on");
          applyBtn.disabled = !pending;
          statusEl.textContent = meaningful
            ? `Parsed ${file.name}. Review below, then Apply.`
            : "No recognisable rows found. Check the headers against the template.";
        } catch (err) {
          pending = null;
          applyBtn.disabled = true;
          previewEl.classList.remove("on");
          statusEl.textContent = "Parse failed: " + err.message;
        }
      };
      reader.readAsArrayBuffer(file);
    });

    applyBtn.addEventListener("click", () => {
      if (!pending) return;
      const L = JSON.parse(localStorage.getItem("dsatm_csd_dashboard_v1") || "{}");

      L.imported = L.imported || {};
      L.imported.at = new Date().toISOString();

      if (Object.keys(pending.placements).length) {
        L.imported.placement = Object.assign(L.imported.placement || {}, pending.placements);
      }
      if (Object.keys(pending.recruiters).length) {
        L.imported.placement = L.imported.placement || {};
        Object.entries(pending.recruiters).forEach(([ay, rows]) => {
          L.imported.placement[ay] = L.imported.placement[ay] || {};
          L.imported.placement[ay].recruiters = rows;
        });
      }
      if (pending.research.length) {
        if (mergeResearch && mergeResearch.checked) {
          const key = (r) => `${r.year}|${norm(r.title)}`;
          const seen = new Set(((L.imported.research) || []).map(key));
          const extra = pending.research.filter((r) => !seen.has(key(r)));
          L.imported.research = (L.imported.research || []).concat(extra);
        } else {
          L.imported.research = pending.research;
        }
      }
      if (pending.events.length) {
        const key = (e) => `${e.date}|${norm(e.title)}`;
        const seen = new Set(((L.imported.events) || []).map(key));
        L.imported.events = (L.imported.events || []).concat(pending.events.filter((e) => !seen.has(key(e))));
      }

      localStorage.setItem("dsatm_csd_dashboard_v1", JSON.stringify(L));

      if (typeof window.renderAll === "function") window.renderAll();
      if (typeof window.refreshYearOptions === "function") window.refreshYearOptions();

      statusEl.textContent = "Applied. Dashboard updated — press Export data.js to publish it.";
      applyBtn.disabled = true;
      pending = null;
      fileInput.value = "";
      previewEl.classList.remove("on");
      previewEl.innerHTML = "";
    });

    const tplBtn = document.getElementById("templateBtn");
    if (tplBtn) tplBtn.addEventListener("click", downloadTemplate);

    const importBtn = document.getElementById("importBtn");
    if (importBtn) importBtn.addEventListener("click", () => {
      const admin = document.getElementById("adminBtn");
      if (admin && !document.getElementById("adminDrawer").classList.contains("open")) admin.click();
      const box = document.querySelector(".imp-box");
      if (box) {
        box.open = true;
        box.scrollIntoView({ behavior: "smooth", block: "start" });
        fileInput.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
  if (document.readyState !== "loading") init();
})();
