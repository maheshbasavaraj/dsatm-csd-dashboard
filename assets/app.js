/* ============================================================
   DSATM · CSE (Data Science) — dashboard renderer
   Reads window.DEPT_DATA (assets/data.js) and paints the UI.
   Local admin edits live in localStorage under STORE_KEY.
   ============================================================ */

const BASE = window.DEPT_DATA;
const STORE_KEY = "dsatm_csd_dashboard_v1";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const TYPE_LABEL = {
  Journal: "Journal",
  Conference: "Conference",
  Patent: "Patent",
  "Book chapter": "Book chapter",
  Grant: "Grant"
};
const TYPE_CLASS = {
  Journal: "journal", Conference: "conference", Patent: "patent",
  "Book chapter": "book", Grant: "grant"
};

/* ------------------------------ utils ------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

function parseDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December"];
const fmtDate = (iso) => {
  const d = parseDate(iso);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : "—";
};
const dayDiff = (iso) => {
  const d = parseDate(iso);
  return d ? Math.round((d - TODAY) / 86400000) : null;
};
function relDay(iso) {
  const n = dayDiff(iso);
  if (n === null) return "";
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n > 1) return `in ${n} days`;
  return `${Math.abs(n)} days ago`;
}
const yearFromAy = (ay) => Number(String(ay).slice(0, 4));

/* ------------------------------ store ------------------------------ */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}
function saveLocal(obj) {
  localStorage.setItem(STORE_KEY, JSON.stringify(obj));
}

/* Merge base data + local additions (recruiters keyed by AY) */
function merged() {
  const L = loadLocal();
  const data = JSON.parse(JSON.stringify(BASE));
  data.placement = data.placement || {};

  if (L.recruiters) {
    Object.keys(L.recruiters).forEach((ay) => {
      if (!data.placement[ay]) {
        data.placement[ay] = {
          eligible: 0, placed: 0, offers: 0, higherStudies: 0, companies: 0,
          highestLpa: 0, averageLpa: 0, medianLpa: 0, international: 0, recruiters: []
        };
      }
      data.placement[ay].recruiters = (data.placement[ay].recruiters || []).concat(L.recruiters[ay]);
    });
  }
  if (Array.isArray(L.research) && L.research.length) data.research = data.research.concat(L.research);
  if (Array.isArray(L.events) && L.events.length) data.events = data.events.concat(L.events);

  /* Excel imports: per-year placement blocks + optional whole-table replacements */
  if (L.imported) {
    const imp = L.imported;
    if (imp.placement) {
      Object.keys(imp.placement).forEach((ay) => {
        const incoming = imp.placement[ay] || {};
        if (!data.academicYears.includes(ay)) data.academicYears.push(ay);
        data.placement[ay] = Object.assign({}, data.placement[ay] || {}, incoming);
        if (incoming.recruiters) data.placement[ay].recruiters = incoming.recruiters;
      });
      data.academicYears.sort((a, b) => yearFromAy(b) - yearFromAy(a));
    }
    if (Array.isArray(imp.research) && imp.research.length) data.research = imp.research.slice();
    if (Array.isArray(imp.events) && imp.events.length) {
      const seen = new Set(data.events.map(e => `${e.date}|${e.title}`));
      imp.events.forEach((e) => {
        const k = `${e.date}|${e.title}`;
        if (!seen.has(k)) { data.events.push(e); seen.add(k); }
      });
    }
  }

  // Recruiter lists may be partial: keep declared offers authoritative,
  // but never let an empty block show zero.
  Object.keys(data.placement).forEach((ay) => {
    const p = data.placement[ay];
    const sum = (p.recruiters || []).reduce((a, r) => a + Number(r.offers || 0), 0);
    if (!Number(p.offers || 0)) p.offers = sum;
    p.companies = Math.max(Number(p.companies || 0), (p.recruiters || []).length);
  });
  return data;
}

const state = {
  data: merged(),
  year: BASE.meta.activeYear,
  tab: "overview",
  research: { q: "", type: "", faculty: "", year: "" },
  events: { type: "", upcoming: true }
};

/* ------------------------------ charts ------------------------------ */
function groupedBars(rows, keys, opts = {}) {
  // rows: [{label, values:[a,b]}], keys: [{name, color}]
  const W = 640, rowH = 46, padL = 78, padR = 40, padT = 8, padB = 22;
  const H = padT + rows.length * rowH + padB;
  const max = Math.max(1, ...rows.flatMap(r => r.values));
  const plotW = W - padL - padR;
  let out = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  const gh = rowH / keys.length;
  rows.forEach((r, i) => {
    const y0 = padT + i * rowH;
    out += `<text x="${padL - 10}" y="${y0 + rowH / 2 + 4}" font-size="12" fill="var(--fg-dim)" text-anchor="end">${esc(r.label)}</text>`;
    r.values.forEach((v, k) => {
      const w = Math.max(v > 0 ? 3 : 0, (v / max) * plotW);
      const y = y0 + k * gh + gh * 0.18;
      const h = gh * 0.64;
      out += `<rect x="${padL}" y="${y}" width="${w}" height="${h}" rx="3" fill="${keys[k].color}" opacity="${k === 0 ? 0.35 : 0.9}"></rect>`;
      out += `<text x="${padL + w + 6}" y="${y + h / 2 + 4}" font-size="11.5" fill="var(--fg-dim)">${esc(r.tips ? r.tips[k] : v)}</text>`;
    });
    out += `<line x1="${padL}" y1="${y0 + rowH - 2}" x2="${W - padR}" y2="${y0 + rowH - 2}" stroke="var(--border)" stroke-width="1"></line>`;
  });
  out += "</svg>" + legend(keys);
  return out;
}

function legend(keys) {
  return `<div class="chart-legend">${keys.map(k => `<span><i style="background:${k.color};opacity:.85"></i>${esc(k.name)}</span>`).join("")}</div>`;
}

function stackedBars(years, series, unit = "") {
  const W = 640, H = 220, padL = 34, padR = 10, padT = 12, padB = 30;
  const plotW = W - padL - padR, plotH = H - padT - padB;
  const totals = years.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0));
  const max = Math.max(1, ...totals);
  const bw = Math.min(56, (plotW / years.length) * 0.55);
  const step = plotW / years.length;
  let out = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  [0, 0.5, 1].forEach(f => {
    const y = padT + plotH - plotH * f;
    out += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="${f ? "3 4" : "0"}"></line>`;
    out += `<text x="${padL - 6}" y="${y + 4}" font-size="10.5" fill="var(--fg-dim)" text-anchor="end">${Math.round(max * f)}</text>`;
  });
  years.forEach((yr, i) => {
    const cx = padL + step * i + step / 2;
    let yTop = padT + plotH;
    series.forEach((s) => {
      const v = s.data[i] || 0;
      if (!v) return;
      const h = (v / max) * plotH;
      yTop -= h;
      out += `<rect x="${cx - bw / 2}" y="${yTop}" width="${bw}" height="${h}" fill="${s.color}" opacity=".9"></rect>`;
    });
    out += `<text x="${cx}" y="${padT + plotH + 16}" font-size="11" fill="var(--fg-dim)" text-anchor="middle">${esc(yr)}</text>`;
    out += `<text x="${cx}" y="${yTop - 6}" font-size="11.5" font-weight="700" fill="var(--fg)">${totals[i]}${unit}</text>`;
  });
  out += "</svg>" + legend(series.map(s => ({ name: s.name, color: s.color })));
  return out;
}

/* ------------------------------ KPIs ------------------------------ */
function renderKPIs() {
  const p = state.data.placement[state.year] || {};
  const yr = yearFromAy(state.year);
  const items = state.data.research;
  const pubs = items.filter(r => r.type === "Journal" || r.type === "Conference" || r.type === "Book chapter");
  const pubsYr = pubs.filter(r => Number(r.year) === yr).length;
  const prior = pubs.filter(r => Number(r.year) === yr - 1).length;
  const patentsYr = items.filter(r => r.type === "Patent" && Number(r.year) === yr).length;
  const grantsYr = items.filter(r => r.type === "Grant" && Number(r.year) === yr).length;
  const up = upcomingEvents(99).length;
  const rate = pct(p.placed || 0, p.eligible || 0);
  const delta = pubsYr - prior;
  const deltaHtml = delta === 0 ? "" :
    `<span class="delta ${delta > 0 ? "up" : "down"}">${delta > 0 ? "▲" : "▼"} ${Math.abs(delta)}</span>`;

  const kpis = [
    { label: "Students placed", value: num(p.placed), sub: `of ${num(p.eligible)} eligible`, cls: "" },
    { label: "Placement rate", value: rate, unit: "%", sub: `${num(p.offers)} offers total`, cls: "k2" },
    { label: "Highest package", value: Number(p.highestLpa || 0).toFixed(1), unit: "LPA", sub: `average ${Number(p.averageLpa || 0).toFixed(1)} LPA`, cls: "" },
    { label: "Publications", value: pubsYr, sub: "papers this AY", cls: "k2", extra: deltaHtml },
    { label: "Patents", value: patentsYr, sub: `${grantsYr} grant${grantsYr === 1 ? "" : "s"} sanctioned`, cls: "k3" },
    { label: "Upcoming dates", value: up, sub: "IA, exams, events", cls: "" }
  ];

  $("#kpiGrid").innerHTML = kpis.map(k => `
    <div class="kpi ${k.cls}">
      <div class="label">${esc(k.label)}</div>
      <div class="value">${esc(k.value)}${k.unit ? `<small>${esc(k.unit)}</small>` : ""}${k.extra || ""}</div>
      <div class="sub">${esc(k.sub)}</div>
    </div>`).join("");
}

function renderNext() {
  const evs = upcomingEvents(5);
  $("#nextList").innerHTML = evs.length ? evs.map(e => {
    const d = parseDate(e.date);
    return `<li>
      <div class="next-date"><div class="d">${d.getDate()}</div><div class="m">${MONTHS[d.getMonth()]}</div></div>
      <div class="next-body">
        <div class="next-title">${esc(e.title)}</div>
        <div class="next-meta"><span class="badge ${e.type}">${esc(typeLabel(e.type))}</span> · ${esc(relDay(e.date))}${e.venue ? " · " + esc(e.venue) : ""}</div>
      </div>
    </li>`;
  }).join("") : `<li><div class="next-body">No upcoming dates left in this calendar. Add the next semester plan.</div></li>`;
}

function renderHeadlines() {
  const p = state.data.placement[state.year] || {};
  const yr = yearFromAy(state.year);
  const items = state.data.research.filter(r => Number(r.year) === yr);
  const f = (a, b) => `${a} / ${b}`;
  const rows = [
    ["Placement rate", `${pct(p.placed || 0, p.eligible || 0)}%`],
    ["Offers per placed student", (p.placed ? (Number(p.offers || 0) / p.placed).toFixed(2) : "0")],
    ["Companies on campus", num(p.companies)],
    ["Higher studies", num(p.higherStudies)],
    ["Median package", `${Number(p.medianLpa || 0).toFixed(1)} LPA`],
    ["International offers", num(p.international)],
    ["Journal papers (this AY)", items.filter(r => r.type === "Journal").length],
    ["Patents filed / granted", `${items.filter(r => r.type === "Patent").length}`],
    ["Research grants", items.filter(r => r.type === "Grant").length],
    ["Faculty on record", state.data.faculty.length]
  ];
  $("#headlines").innerHTML = rows.map(([k, v]) =>
    `<div><div class="h-label">${esc(k)}</div><div class="h-value">${esc(v)}</div></div>`).join("");
}

function renderOverviewTrend() {
  const years = state.data.academicYears.slice().reverse(); // oldest first
  const rows = years.map(ay => {
    const p = state.data.placement[ay] || {};
    const rate = pct(p.placed || 0, p.eligible || 0);
    return {
      label: ay, values: [Number(p.eligible || 0), Number(p.placed || 0)],
      tips: [`${num(p.eligible || 0)}`, `${num(p.placed || 0)} (${rate}%)`]
    };
  });
  $("#trendChart").innerHTML = groupedBars(rows, [
    { name: "Eligible", color: "#8899ad" },
    { name: "Placed", color: "#4f8cff" }
  ]);
}

function renderResearchMini() {
  const yr = yearFromAy(state.year);
  const items = state.data.research.filter(r => Number(r.year) === yr);
  const types = ["Journal", "Conference", "Patent", "Book chapter", "Grant"];
  const rows = types.map(t => ({
    label: t,
    values: [items.filter(r => r.type === t).length],
    tips: [`${items.filter(r => r.type === t).length}`]
  }));
  $("#researchMini").innerHTML = groupedBars(rows, [{ name: "Count", color: "#2dd4bf" }]);
}

/* ------------------------------ placements ------------------------------ */
function renderPlacements() {
  const p = state.data.placement[state.year] || {};
  const rec = (p.recruiters || []).slice().sort((a, b) => b.offers - a.offers || b.ctc - a.ctc);
  const listed = rec.reduce((a, r) => a + Number(r.offers || 0), 0);
  const declared = Number(p.offers || 0) || listed || 1;   // share denominator

  const stats = [
    ["Eligible students", num(p.eligible)],
    ["Placed", `${num(p.placed)} <small>(${pct(p.placed || 0, p.eligible || 0)}%)</small>`],
    ["Total offers", num(p.offers || listed)],
    ["Recruiters", num(p.companies || rec.length)],
    ["Average CTC", `${Number(p.averageLpa || 0).toFixed(1)} <small>LPA</small>`],
    ["Highest CTC", `${Number(p.highestLpa || 0).toFixed(1)} <small>LPA</small>`],
    ["Higher studies", num(p.higherStudies)],
    ["International", num(p.international)]
  ];
  $("#placementStats").innerHTML = stats.map(([l, v]) =>
    `<div class="stat"><div class="label">${esc(l)}</div><div class="value">${v}</div></div>`).join("");

  // package bands
  const bands = [
    { label: "≥ 15 LPA", test: c => c >= 15 },
    { label: "10–15 LPA", test: c => c >= 10 && c < 15 },
    { label: "8–10 LPA", test: c => c >= 8 && c < 10 },
    { label: "6–8 LPA", test: c => c >= 6 && c < 8 },
    { label: "4–6 LPA", test: c => c >= 4 && c < 6 },
    { label: "< 4 LPA", test: c => c < 4 }
  ];
  const bandRows = bands.map(b => {
    const n = rec.filter(r => b.test(Number(r.ctc || 0))).reduce((a, r) => a + Number(r.offers || 0), 0);
    return { label: b.label, values: [n], tips: [`${n} offer${n === 1 ? "" : "s"} (${pct(n, declared)}%)`] };
  }).filter(r => r.values[0] > 0);
  $("#packageChart").innerHTML = bandRows.length
    ? groupedBars(bandRows, [{ name: "Offers", color: "#4f8cff" }])
    : `<div class="empty">No recruiter rows for this year.</div>`;

  // sector split
  const sectors = {};
  rec.forEach(r => {
    const k = r.sector || "Other";
    sectors[k] = (sectors[k] || 0) + Number(r.offers || 0);
  });
  const sectorRows = Object.entries(sectors).sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: k, values: [v], tips: [`${v} (${pct(v, declared)}%)`] }));
  $("#roleSplit").innerHTML = sectorRows.length
    ? groupedBars(sectorRows, [{ name: "Offers", color: "#2dd4bf" }])
    : `<div class="empty">No sector data.</div>`;

  // recruiter table
  $("#recruiterCount").textContent =
    `${rec.length} companies listed · ${num(listed)} of ${num(declared)} offers`;
  $("#recruiterTable tbody").innerHTML = rec.length ? rec.map(r => `
    <tr>
      <td><b>${esc(r.name)}</b></td>
      <td><span class="badge soft">${esc(r.sector || "—")}</span></td>
      <td class="num">${num(r.offers)}</td>
      <td>${esc(r.role || "—")}</td>
      <td class="num">${Number(r.ctc || 0).toFixed(2)}</td>
    </tr>`).join("") : `<tr><td colspan="5" class="empty">No recruiters recorded for ${esc(state.year)}.</td></tr>`;

  // year-on-year table
  $("#placementYearTable tbody").innerHTML = state.data.academicYears.map(ay => {
    const q = state.data.placement[ay] || {};
    const cur = ay === state.year ? ` style="background:var(--card-2);font-weight:600"` : "";
    return `<tr${cur}>
      <td>${esc(ay)}${ay === state.year ? " · current" : ""}</td>
      <td class="num">${num(q.eligible)}</td>
      <td class="num">${num(q.placed)}</td>
      <td class="num">${num(q.higherStudies)}</td>
      <td class="num">${num(q.offers)}</td>
      <td class="num">${Number(q.averageLpa || 0).toFixed(1)}</td>
      <td class="num">${Number(q.highestLpa || 0).toFixed(1)}</td>
    </tr>`;
  }).join("");
}

/* ------------------------------ research ------------------------------ */
function researchRows() {
  const { q, type, faculty, year } = state.research;
  const needle = q.trim().toLowerCase();
  return state.data.research
    .filter(r => !type || r.type === type)
    .filter(r => !year || String(r.year) === year)
    .filter(r => !faculty || (r.faculty || []).includes(faculty))
    .filter(r => !needle || [r.title, (r.faculty || []).join(" "), r.venue, r.indexing]
      .join(" ").toLowerCase().includes(needle))
    .sort((a, b) => b.year - a.year || String(a.title).localeCompare(String(b.title)));
}

function renderResearch() {
  const all = state.data.research;
  const yr = yearFromAy(state.year);
  const inYr = all.filter(r => Number(r.year) === yr);
  const stats = [
    ["Journals", inYr.filter(r => r.type === "Journal").length],
    ["Conferences", inYr.filter(r => r.type === "Conference").length],
    ["Patents", inYr.filter(r => r.type === "Patent").length],
    ["Grants", inYr.filter(r => r.type === "Grant").length],
    ["SCI-indexed (all years)", all.filter(r => r.indexing === "SCI").length],
    ["Total records", all.length]
  ];
  $("#researchStats").innerHTML = stats.map(([l, v]) =>
    `<div class="stat"><div class="label">${esc(l)}</div><div class="value">${num(v)}</div></div>`).join("");

  // filter options (once)
  const typeSel = $("#filterType");
  if (typeSel.options.length <= 1) {
    Object.keys(TYPE_LABEL).forEach(t => typeSel.add(new Option(TYPE_LABEL[t], t)));
    const names = new Set();
    all.forEach(r => (r.faculty || []).forEach(n => names.add(n)));
    [...names].sort().forEach(n => $("#filterFaculty").add(new Option(n, n)));
    [...new Set(all.map(r => r.year))].sort((a, b) => b - a)
      .forEach(y => $("#filterYear").add(new Option(String(y), String(y))));
  }

  const rows = researchRows();
  $("#researchCount").textContent = `${rows.length} of ${all.length} records`;
  $("#researchTable tbody").innerHTML = rows.length ? rows.map(r => `
    <tr>
      <td class="title-cell">
        <b>${esc(r.title)}</b>
        ${r.doi ? `<div style="margin-top:3px"><a href="${esc(r.doi)}" target="_blank" rel="noopener">${esc(r.doi.includes("doi.org") ? "DOI" : "link")} ↗</a></div>` : ""}
      </td>
      <td><span class="badge ${TYPE_CLASS[r.type] || "soft"}">${esc(r.type)}</span></td>
      <td>${esc((r.faculty || []).join(", "))}</td>
      <td>${esc(r.venue || "—")}${r.status && r.status !== "Published" ? `<div><span class="badge soft status">${esc(r.status)}</span></div>` : ""}</td>
      <td>${esc(r.indexing || "—")}</td>
      <td class="num">${esc(r.year)}</td>
    </tr>`).join("") : `<tr><td colspan="6" class="empty">No records match these filters.</td></tr>`;

  // output by year, stacked
  const years = [...new Set(all.map(r => Number(r.year)))].sort();
  const series = [
    { name: "Journal", color: "#4f8cff" },
    { name: "Conference", color: "#2dd4bf" },
    { name: "Patent", color: "#f5a524" },
    { name: "Book chapter", color: "#a78bfa" },
    { name: "Grant", color: "#2ecc8f" }
  ].map(s => ({ name: s.name, color: s.color, data: years.map(y => all.filter(r => Number(r.year) === y && r.type === s.name).length) }));
  $("#researchYearChart").innerHTML = years.length
    ? stackedBars(years.map(String), series)
    : `<div class="empty">No research records.</div>`;

  // faculty-wise output
  const tally = {};
  all.forEach(r => (r.faculty || []).forEach(n => {
    tally[n] = tally[n] || { Journal: 0, Conference: 0, Patent: 0, Grant: 0, "Book chapter": 0 };
    tally[n][r.type] = (tally[n][r.type] || 0) + 1;
  }));
  const fRows = Object.entries(tally)
    .map(([n, t]) => ({ label: n.replace(/^(Dr\.|Prof\.)\s*/, ""), t }))
    .sort((a, b) => total(b.t) - total(a.t))
    .map(r => ({
      label: r.label,
      values: [r.t.Patent, r.t.Journal + r.t.Conference + r.t["Book chapter"]],
      tips: [`${r.t.Patent} patent${r.t.Patent === 1 ? "" : "s"}`, `${r.t.Journal + r.t.Conference + r.t["Book chapter"]} paper${(r.t.Journal + r.t.Conference + r.t["Book chapter"]) === 1 ? "" : "s"}`]
    }));
  $("#facultyOutput").innerHTML = fRows.length
    ? groupedBars(fRows, [
      { name: "Patents", color: "#f5a524" },
      { name: "Papers", color: "#4f8cff" }
    ])
    : `<div class="empty">No faculty authorship recorded.</div>`;
}
const total = (t) => Object.values(t).reduce((a, b) => a + b, 0);

/* ------------------------------ calendar ------------------------------ */
function typeLabel(t) {
  return ({ ia: "IA", exam: "SEE / Exam", event: "Event", deadline: "Deadline", holiday: "Holiday" })[t] || t;
}
function sortedEvents() {
  return state.data.events.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
}
function upcomingEvents(limit) {
  const list = sortedEvents().filter(e => {
    const end = parseDate(e.endDate || e.date);
    return end && end >= TODAY;
  });
  return limit ? list.slice(0, limit) : list;
}

function renderCalendar() {
  const evs = state.data.events;
  const nextIa = sortedEvents().find(e => e.type === "ia" && parseDate(e.endDate || e.date) >= TODAY);
  const nextExam = sortedEvents().find(e => e.type === "exam" && parseDate(e.endDate || e.date) >= TODAY);
  const week = evs.filter(e => {
    const n = dayDiff(e.date);
    return n !== null && n >= 0 && n <= 7;
  });
  const stats = [
    ["Next IA", nextIa ? fmtDate(nextIa.date) : "—"],
    ["Next exam window", nextExam ? fmtDate(nextExam.date) : "—"],
    ["Dates in next 7 days", week.length],
    ["Total dates on calendar", evs.length]
  ];
  $("#calendarStats").innerHTML = stats.map(([l, v]) =>
    `<div class="stat"><div class="label">${esc(l)}</div><div class="value" style="font-size:16px">${esc(v)}</div></div>`).join("");

  const typeSel = $("#filterEventType");
  if (typeSel.options.length <= 1) {
    ["ia", "exam", "event", "deadline", "holiday"].forEach(t => typeSel.add(new Option(typeLabel(t), t)));
  }

  // grouping
  let list = sortedEvents()
    .filter(e => !state.events.type || e.type === state.events.type)
    .filter(e => !state.events.upcoming || parseDate(e.endDate || e.date) >= TODAY);

  const ul = $("#eventList");
  if (!list.length) {
    ul.innerHTML = `<li><div class="tl-body">No dates match. Add the next plan in ✎ admin.</div></li>`;
  } else {
    let html = "", lastMonth = "";
    list.forEach(e => {
      const d = parseDate(e.date);
      if (!d) return;
      const mk = `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
      if (mk !== lastMonth) {
        lastMonth = mk;
        html += `<li style="border-bottom:0;padding-top:6px"><div class="tl-date"></div><div class="tl-body">
          <div class="tl-title" style="font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--fg-dim)">${mk}</div></div></li>`;
      }
      const past = (parseDate(e.endDate || e.date) < TODAY) ? " past" : "";
      const range = e.endDate && e.endDate !== e.date
        ? `${d.getDate()}–${parseDate(e.endDate).getDate()} ${MONTHS[d.getMonth()]}` : "";
      html += `<li class="${past.trim()}">
        <div class="tl-date"><b>${d.getDate()}</b>${MONTHS[d.getMonth()]}${range ? `<div style="font-size:10px">${esc(range)}</div>` : ""}</div>
        <div class="tl-body">
          <div class="tl-title">${esc(e.title)} <span class="badge ${e.type}">${esc(typeLabel(e.type))}</span>
            ${past ? "" : `<span class="badge soft">${esc(relDay(e.date))}</span>`}</div>
          ${e.detail ? `<div class="tl-detail">${esc(e.detail)}</div>` : ""}
          ${e.venue ? `<div class="tl-venue">${esc(e.venue)}</div>` : ""}
        </div>
      </li>`;
    });
    ul.innerHTML = html;
  }

  // IA plan table
  $("#iaTable tbody").innerHTML = (state.data.iaPlan || []).map(r => `
    <tr><td><b>${esc(r.assessment)}</b></td><td>${esc(r.window)}</td><td>${esc(r.coverage)}</td><td>${esc(r.marks)}</td></tr>`).join("");

  renderSemMap();
}

function renderSemMap() {
  // Odd sem: Jul–Dec of AY start year; Even sem: Jan–Jun of next year.
  const startY = yearFromAy(state.year);
  const rows = [
    { name: "Odd sem", months: [7, 8, 9, 10, 11, 12].map((m, i) => ({ m, y: startY, i })) },
    { name: "Even sem", months: [1, 2, 3, 4, 5, 6].map((m, i) => ({ m, y: startY + 1, i })) }
  ];
  const evs = state.data.events.map(e => ({ ...e, d: parseDate(e.date), end: parseDate(e.endDate || e.date) })).filter(e => e.d);
  $("#semesterMap").innerHTML = rows.map(row => {
    const segs = row.months.map(({ m, y }) => {
      const hits = evs.filter(e => {
        const span = [e.d, e.end].filter(Boolean);
        const inMonth = span.some(d => d.getMonth() + 1 === m && d.getFullYear() === y);
        const covered = e.d <= new Date(y, m, 0) && e.end >= new Date(y, m - 1, 1);
        return inMonth || covered;
      });
      const types = [...new Set(hits.map(h => h.type))];
      const isNow = TODAY.getMonth() + 1 === m && TODAY.getFullYear() === y;
      const cls = ["sem-seg", types.length ? "hot" : "", isNow ? "now" : ""].filter(Boolean).join(" ");
      const mark = types.length ? types.map(t => typeLabel(t)).join(" · ") : "";
      return `<div class="${cls}" title="${esc(mark)}"><span>${MONTHS[m - 1]}${mark ? `<br>${esc(mark)}` : ""}</span></div>`;
    }).join("");
    return `<div class="sem-row"><div class="sem-name">${row.name} ${startY + (row.name === "Even sem" ? 1 : 0)}</div><div class="sem-track">${segs}</div></div>`;
  }).join("");
}

/* ------------------------------ faculty ------------------------------ */
function renderFaculty() {
  const all = state.data.research;
  const counts = (name) => ({
    papers: all.filter(r => (r.faculty || []).includes(name) && ["Journal", "Conference", "Book chapter"].includes(r.type)).length,
    patents: all.filter(r => (r.faculty || []).includes(name) && r.type === "Patent").length,
    grants: all.filter(r => (r.faculty || []).includes(name) && r.type === "Grant").length
  });
  $("#facultyGrid").innerHTML = state.data.faculty.map(f => {
    const c = counts(f.name);
    const initials = f.name.replace(/^(Dr\.|Prof\.)\s*/, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `<article class="fac">
      <div class="fac-top">
        <div class="avatar">${esc(initials)}</div>
        <div><h3>${esc(f.name)}</h3><div class="desig">${esc(f.designation)}</div></div>
      </div>
      <p class="area">${esc(f.area)}</p>
      <div class="fac-stats">
        <span class="chip">${c.papers} papers</span>
        <span class="chip">${c.patents} patent${c.patents === 1 ? "" : "s"}</span>
        <span class="chip">${c.grants} grant${c.grants === 1 ? "" : "s"}</span>
      </div>
      <div class="fac-links">
        <a href="mailto:${esc(f.email)}">Email</a>
        ${f.scholar ? `<a href="${esc(f.scholar)}" target="_blank" rel="noopener">Scholar</a>` : ""}
        ${f.scopus ? `<a href="${esc(f.scopus)}" target="_blank" rel="noopener">Scopus</a>` : ""}
      </div>
    </article>`;
  }).join("");
}

/* ------------------------------ shell ------------------------------ */
function renderAll() {
  state.data = merged();
  renderKPIs();
  renderOverviewTrend();
  renderNext();
  renderResearchMini();
  renderHeadlines();
  renderPlacements();
  renderResearch();
  renderCalendar();
  renderFaculty();

  $("#deptName").textContent = BASE.meta.department;
  $("#collegeName").textContent = BASE.meta.shortCollege || BASE.meta.college;
  $("#footLeft").innerHTML = `${esc(BASE.meta.college)} · ${esc(BASE.meta.department)} · HOD: ${esc(BASE.meta.hod || "—")}
    ${BASE.meta.sample ? `<span class="sample-chip">sample data</span>` : ""}`;
  $("#footRight").textContent = `Data updated ${fmtDate(BASE.meta.lastUpdated)} · figures for ${state.year}`;
}

function buildYearOptions() {
  const sel = $("#yearSelect");
  const years = state.data.academicYears;
  const keep = years.includes(state.year) ? state.year : years[0];
  sel.innerHTML = "";
  years.forEach(y => sel.add(new Option(y, y)));
  state.year = keep;
  sel.value = keep;
}

function initShell() {
  const sel = $("#yearSelect");
  buildYearOptions();
  sel.addEventListener("change", () => {
    state.year = sel.value;
    renderAll();
  });

  // tabs
  const tabs = $("#tabs");
  tabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    $$(".tab").forEach(b => b.classList.toggle("active", b === btn));
    $$(".panel").forEach(p => p.classList.toggle("active", p.id === `panel-${btn.dataset.tab}`));
    state.tab = btn.dataset.tab;
  });

  // theme
  const savedTheme = localStorage.getItem("dsatm_theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#themeBtn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("dsatm_theme", next);
  });

  // research filters
  $("#researchSearch").addEventListener("input", (e) => { state.research.q = e.target.value; renderResearch(); });
  $("#filterType").addEventListener("change", (e) => { state.research.type = e.target.value; renderResearch(); });
  $("#filterFaculty").addEventListener("change", (e) => { state.research.faculty = e.target.value; renderResearch(); });
  $("#filterYear").addEventListener("change", (e) => { state.research.year = e.target.value; renderResearch(); });

  // event filters
  $("#filterEventType").addEventListener("change", (e) => { state.events.type = e.target.value; renderCalendar(); });
  $("#onlyUpcoming").addEventListener("change", (e) => { state.events.upcoming = e.target.checked; renderCalendar(); });

  // admin drawer
  const drawer = $("#adminDrawer"), scrim = $("#scrim");
  const openAdmin = () => { drawer.classList.add("open"); scrim.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); };
  const closeAdmin = () => { drawer.classList.remove("open"); scrim.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); };
  $("#adminBtn").addEventListener("click", openAdmin);
  $("#closeAdmin").addEventListener("click", closeAdmin);
  scrim.addEventListener("click", closeAdmin);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAdmin(); });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const kind = btn.dataset.add;
    const status = $("#adminStatus");
    const L = loadLocal();

    if (kind === "recruiter") {
      const name = $("#f-co-name").value.trim();
      if (!name) { status.textContent = "Company name required."; return; }
      const row = {
        name,
        sector: $("#f-co-sector").value.trim() || "Other",
        offers: Math.max(1, Number($("#f-co-offers").value || 1)),
        role: $("#f-co-role").value.trim() || "—",
        ctc: Number($("#f-co-ctc").value || 0)
      };
      L.recruiters = L.recruiters || {};
      L.recruiters[state.year] = (L.recruiters[state.year] || []).concat([row]);
      saveLocal(L); renderAll();
      status.textContent = `Added ${row.name} to ${state.year}.`;
      e.target.closest("details").querySelectorAll("input").forEach(i => i.value = "");
    }

    if (kind === "research") {
      const title = $("#f-re-title").value.trim();
      if (!title) { status.textContent = "Title required."; return; }
      const row = {
        year: Number($("#f-re-year").value || new Date().getFullYear()),
        type: $("#f-re-type").value,
        title,
        faculty: $("#f-re-faculty").value.split(",").map(s => s.trim()).filter(Boolean),
        venue: $("#f-re-venue").value.trim(),
        indexing: $("#f-re-index").value,
        status: "Published",
        doi: $("#f-re-doi").value.trim()
      };
      L.research = (L.research || []).concat([row]);
      saveLocal(L); renderAll();
      status.textContent = `Added ${row.type.toLowerCase()}: ${title.slice(0, 40)}…`;
      e.target.closest("details").querySelectorAll("input").forEach(i => i.value = "");
    }

    if (kind === "event") {
      const title = $("#f-ev-title").value.trim();
      const date = $("#f-ev-date").value;
      if (!title || !date) { status.textContent = "Title and date required."; return; }
      const row = {
        date,
        type: $("#f-ev-type").value,
        title,
        detail: $("#f-ev-detail").value.trim(),
        venue: $("#f-ev-venue").value.trim()
      };
      const end = $("#f-ev-end").value;
      if (end) row.endDate = end;
      L.events = (L.events || []).concat([row]);
      saveLocal(L); renderAll();
      status.textContent = `Added "${title}" on ${fmtDate(date)}.`;
      e.target.closest("details").querySelectorAll("input").forEach(i => i.value = "");
    }
  });

  $("#exportBtn").addEventListener("click", () => {
    const data = merged();
    data.meta.sample = false;
    data.meta.lastUpdated = new Date().toISOString().slice(0, 10);
    const body = "/* Exported from the dashboard admin panel — replace assets/data.js with this file. */\n\n"
      + "window.DEPT_DATA = " + JSON.stringify(data, null, 2) + ";\n";
    const blob = new Blob([body], { type: "text/javascript" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "data.js";
    a.click();
    URL.revokeObjectURL(a.href);
    $("#adminStatus").textContent = "data.js downloaded — drop it into assets/ to publish.";
  });

  $("#resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
}

/* exposed for the Excel importer (assets/import.js) */
window.renderAll = renderAll;
window.refreshYearOptions = function () { buildYearOptions(); };
window.dashboardState = state;

initShell();
renderAll();
