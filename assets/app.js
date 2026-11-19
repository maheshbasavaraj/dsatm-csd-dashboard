/* DSATM CSE (Data Science) — dashboard renderer + admin CRUD
   Base data: assets/data.js (generated). Admin edits: localStorage overlay. */
const BASE = window.DEPT_DATA;
const KEY = "dsatm_csd_dash_v2";

/* ---------------- utils ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (n) => Number(n || 0).toLocaleString("en-IN");
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
const median = (arr) => {
  if (!arr.length) return null;
  const a = [...arr].sort((x, y) => x - y);
  return a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2;
};
const avg = (arr) => (arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : null);

/* ---------------- store ---------------- */
function loadStore() { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } }
function saveStore() {
  localStorage.setItem(KEY, JSON.stringify({
    years: D.years, placement: D.placement, research: D.research,
    faculty: D.faculty, plan: D.plan, patents: D.patents
  }));
  state.dirty = true;
}
let D = (() => {
  const s = loadStore();
  const base = JSON.parse(JSON.stringify(BASE));
  if (!s) return base;
  return {
    ...base,
    years: s.years || base.years,
    placement: s.placement || base.placement,
    research: s.research || base.research,
    faculty: s.faculty || base.faculty,
    plan: s.plan || base.plan,
    patents: s.patents || base.patents
  };
})();

const state = { year: D.meta.activeYear, tab: "overview", admin: false, dirty: false };
if (!D.years.includes(state.year)) state.year = D.years[0];

/* ---------------- derived numbers ---------------- */
function stats(ay) {
  const p = D.placement[ay] || { offers: [], eligible: null };
  const offers = p.offers || [];
  const byStudent = new Map();
  offers.forEach(o => {
    const k = o.usn || o.student;
    if (!byStudent.has(k) || byStudent.get(k) < o.ctc) byStudent.set(k, o.ctc);
  });
  const best = [...byStudent.values()];
  const companies = {};
  offers.forEach(o => { companies[o.company] = companies[o.company] || { offers: 0, best: 0 }; companies[o.company].offers++; companies[o.company].best = Math.max(companies[o.company].best, o.ctc); });
  return {
    eligible: p.eligible, placed: best.length, offers: offers.length,
    companies: Object.keys(companies).length,
    best, avgCtc: avg(best), medianCtc: median(best),
    highest: best.length ? Math.max(...best) : null,
    rate: p.eligible ? pct(best.length, p.eligible) : null,
    companyList: Object.entries(companies).sort((a, b) => b[1].offers - a[1].offers),
    bands: [
      { label: "≥ 15 LPA", n: offers.filter(o => o.ctc >= 15).length },
      { label: "10–15", n: offers.filter(o => o.ctc >= 10 && o.ctc < 15).length },
      { label: "8–10", n: offers.filter(o => o.ctc >= 8 && o.ctc < 10).length },
      { label: "6–8", n: offers.filter(o => o.ctc >= 6 && o.ctc < 8).length },
      { label: "4–6", n: offers.filter(o => o.ctc >= 4 && o.ctc < 6).length },
      { label: "< 4", n: offers.filter(o => o.ctc < 4).length }
    ].filter(b => b.n > 0)
  };
}
const papersFor = (ay) => D.research.filter(r => (r.ay || ayOf(r.year, r.month)) === ay);
function ayOf(y, m) {
  if (!y) return null;
  if (!m) return `${y - 1}-${String(y % 100).padStart(2, "0")}`;
  return m >= 7 ? `${y}-${String((y + 1) % 100).padStart(2, "0")}` : `${y - 1}-${String(y % 100).padStart(2, "0")}`;
}
const papersAllFor = (ay) => papersFor(ay).filter(r => r.type !== "Patent");

/* ---------------- svg charts ---------------- */
function donut(value, total, opts = {}) {
  const p = total ? Math.min(1, value / total) : 0;
  const r = 52, c = 2 * Math.PI * r, size = 132;
  const color = opts.color || "var(--accent)";
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${esc(opts.label || "")}">
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="var(--panel2)" stroke-width="13"></circle>
    <circle cx="66" cy="66" r="${r}" fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round"
      stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 66 66)"></circle>
    <text x="66" y="62" text-anchor="middle" font-size="26" font-weight="700" fill="var(--fg)">${esc(value)}</text>
    <text x="66" y="82" text-anchor="middle" font-size="11" fill="var(--dim)">${esc(total ? `of ${total}` : "no denominator")}</text>
  </svg>`;
}

function hbars(items, opts = {}) {
  if (!items.length) return `<div class="empty" style="color:var(--dim);font-size:12.5px">No data.</div>`;
  const W = 560, rowH = 30, padL = opts.padL || 130, padR = 66, padT = 4;
  const H = padT + items.length * rowH;
  const max = Math.max(1, ...items.map(i => i.value));
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  items.forEach((it, i) => {
    const y = padT + i * rowH;
    const bw = Math.max(it.value ? 4 : 0, (it.value / max) * (W - padL - padR));
    s += `<text x="${padL - 8}" y="${y + 16}" text-anchor="end" font-size="11.5" fill="var(--dim)">${esc(it.label.length > 22 ? it.label.slice(0, 21) + "…" : it.label)}</text>`;
    s += `<rect x="${padL}" y="${y + 5}" width="${bw}" height="15" rx="4" fill="${opts.color || "var(--accent)"}" opacity=".9"></rect>`;
    const label = String(it.text != null ? it.text : it.value);
    if (padL + bw + 8 + label.length * 6 > W - 2) {
      s += `<text x="${padL + bw - 6}" y="${y + 16}" text-anchor="end" font-size="11" font-weight="600" fill="#fff">${esc(label)}</text>`;
    } else {
      s += `<text x="${padL + bw + 7}" y="${y + 16}" font-size="11.5" fill="var(--dim)">${esc(label)}</text>`;
    }
  });
  return s + "</svg>";
}

function vbars(months, opts = {}) {
  const W = 560, H = 190, padL = 26, padB = 26, padT = 10;
  const max = Math.max(1, ...months.map(m => m.n));
  const plotW = W - padL - 8, plotH = H - padT - padB;
  const step = plotW / months.length, bw = Math.min(34, step * 0.6);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  [0.5, 1].forEach(f => {
    const y = padT + plotH - plotH * f;
    s += `<line x1="${padL}" y1="${y}" x2="${W - 8}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 4"></line>`;
  });
  months.forEach((m, i) => {
    const h = (m.n / max) * plotH;
    const x = padL + step * i + (step - bw) / 2;
    s += `<rect x="${x}" y="${padT + plotH - h}" width="${bw}" height="${Math.max(m.n ? 3 : 0, h)}" rx="4" fill="${opts.color || "var(--accent2)"}" opacity=".9"></rect>`;
    if (m.n) s += `<text x="${x + bw / 2}" y="${padT + plotH - h - 5}" text-anchor="middle" font-size="10.5" font-weight="600" fill="var(--fg)">${m.n}</text>`;
    s += `<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="10" fill="var(--dim)">${esc(m.label)}</text>`;
  });
  return s + "</svg>";
}

/* ---------------- compact stat tables ---------------- */
function yearTable(host, opts = {}) {
  const rows = D.years.map(ay => {
    const s = stats(ay);
    return { ay, s, pat: patentCount(ay), papers: papersFor(ay).length };
  });
  const head = opts.research
    ? ["Academic year", "Papers", "Patents", "Q1", "Q2"]
    : ["Academic year", "Eligible", "Placed", "Rate", "Offers", "Companies", "Average", "Highest"];
  const body = rows.map(({ ay, s, pat, papers }) => {
    const cur = ay === state.year ? ' class="cur"' : "";
    if (opts.research) {
      const list = papersFor(ay);
      return `<tr${cur}><td><b>${esc(ay)}</b>${ay === D.meta.activeYear ? ' <span class="badge q">ongoing</span>' : ""}</td>
        <td class="n">${papers}</td><td class="n">${pat}</td>
        <td class="n">${list.filter(r => r.quartile === "Q1").length}</td>
        <td class="n">${list.filter(r => r.quartile === "Q2").length}</td></tr>`;
    }
    return `<tr${cur}><td><b>${esc(ay)}</b>${ay === D.meta.activeYear ? ' <span class="badge q">ongoing</span>' : ""}</td>
      <td class="n">${s.eligible ? num(s.eligible) : "—"}</td>
      <td class="n">${s.placed}</td>
      <td class="n">${s.rate == null ? "—" : s.rate + "%"}</td>
      <td class="n">${s.offers}</td>
      <td class="n">${s.companies}</td>
      <td class="n">${s.avgCtc ? s.avgCtc.toFixed(2) : "—"}</td>
      <td class="n">${s.highest ? s.highest.toFixed(2) : "—"}</td></tr>`;
  });
  const total = opts.research
    ? `<tr class="tot"><td><b>Total</b></td><td class="n">${D.research.filter(r => r.type !== "Patent" && r.ay).length}</td>
       <td class="n">${D.years.reduce((a, y) => a + patentCount(y), 0)}</td><td class="n">—</td><td class="n">—</td></tr>`
    : "";
  $(host).innerHTML = `<table class="mini-table"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${body.join("")}${total}</tbody></table>`;
}

function patentCount(ay) {
  const p = D.patents[ay];
  if (p == null) return 0;
  return typeof p === "number" ? p : (p.total || 0);
}

function overallStats() {
  const all = D.years.flatMap(ay => (D.placement[ay].offers || []));
  const bestByStudent = new Map();
  all.forEach(o => {
    const k = (o.usn || o.student) + "|" + o.company;
    bestByStudent.set(k, o.ctc);
  });
  const best = [...bestByStudent.values()];
  return {
    offers: all.length,
    placed: new Set(all.map(o => o.usn || o.student)).size,
    companies: new Set(all.map(o => o.company)).size,
    avg: best.length ? best.reduce((a, b) => a + b, 0) / best.length : null,
    highest: best.length ? Math.max(...best) : null,
    papers: D.research.filter(r => r.type !== "Patent").length,
    patents: D.years.reduce((a, y) => a + patentCount(y), 0)
  };
}

/* ---------------- renderers ---------------- */
function renderAll() {
  $("#yearSel").innerHTML = D.years.map(y => `<option ${y === state.year ? "selected" : ""}>${esc(y)}</option>`).join("");
  $("#pYear").textContent = state.year;
  $("#rYear").textContent = state.year;
  $("#planYear").textContent = D.plan.target.ay;
  $("#planStatus").textContent = D.plan.status || "";
  renderOverview();
  renderPlacements();
  renderPlan();
  renderResearch();
  renderFaculty();
  $("#footLeft").textContent = `${D.meta.college} · ${D.meta.department} · HOD ${D.meta.hod}`;
  $("#footRight").textContent = `Data updated ${D.meta.lastUpdated} · ${D.research.length} publications · ${state.dirty ? "local edits not exported" : "source: department files"}`;
}

function renderOverview() {
  const s = stats(state.year);
  const o = overallStats();
  const pat = patentCount(state.year);
  const pubs = papersAllFor(state.year).length;
  const planOpen = D.plan.items.filter(i => i.status !== "Completed").length;
  $("#kpis").innerHTML = `
    ${kpi("Students placed", `${s.placed}`, `of ${s.eligible ? num(s.eligible) : "—"} eligible · ${o.placed} across all cycles`, "")}
    ${kpi("Placement rate", s.rate == null ? "—" : s.rate, s.rate == null ? "no eligible count in source" : "% of eligible batch", "a2", s.rate == null ? "" : "%")}
    ${kpi("Highest package", s.highest == null ? "—" : s.highest.toFixed(1), `average ${s.avgCtc ? s.avgCtc.toFixed(1) : "—"} LPA · ${o.offers} offers all cycles`, "", "LPA")}
    ${kpi("Publications", pubs, `${pat} patents this year · ${o.papers} papers all cycles`, "a2")}`;

  $("#donutPlacement").innerHTML = donut(s.placed, s.eligible, { label: "placed" });
  $("#progHint").textContent = s.rate == null ? "eligible count pending" : `${s.rate}% placed`;
  $("#placementMini").innerHTML = [
    ["Offers", num(s.offers)], ["Companies", num(s.companies)],
    ["Average CTC", s.avgCtc ? s.avgCtc.toFixed(2) + " LPA" : "—"],
    ["Median CTC", s.medianCtc ? s.medianCtc.toFixed(2) + " LPA" : "—"]
  ].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("");

  $("#bandMini").innerHTML = hbars(s.bands.map(b => ({ label: b.label, value: b.n, text: `${b.n}` })), { color: "var(--accent)", padL: 92 });

  const months = MONTHS.map((m, i) => ({ label: m, n: papersAllFor(state.year).filter(r => r.month === i + 1).length }));
  $("#pubMonths").innerHTML = vbars(months);

  $("#planMini").innerHTML = D.plan.items.slice(0, 4).map(i => `
    <div class="mi">
      <div class="mi-top"><span>${esc(i.title)}</span><b>${Number(i.progress || 0)}%</b></div>
      <div class="bar"><i style="width:${Math.min(100, Number(i.progress || 0))}%"></i></div>
    </div>`).join("");

  yearTable("#yearTableOverview");
}

function kpi(label, value, sub, cls = "", unit = "") {
  return `<div class="kpi ${cls}"><div class="k">${esc(label)}</div>
    <div class="v">${esc(value)}${unit ? `<small>${esc(unit)}</small>` : ""}</div>
    <div class="s">${esc(sub)}</div></div>`;
}

function renderPlacements() {
  const s = stats(state.year);
  $("#eligHint").textContent = s.eligible ? `${num(s.eligible)} eligible` : "eligible count not in source";
  $("#placeChips").innerHTML = [
    ["Placed", s.placed], ["Offers", s.offers], ["Companies", s.companies],
    ["Average", s.avgCtc ? s.avgCtc.toFixed(2) + " LPA" : "—"],
    ["Median", s.medianCtc ? s.medianCtc.toFixed(2) + " LPA" : "—"],
    ["Highest", s.highest ? s.highest.toFixed(2) + " LPA" : "—"]
  ].map(([k, v]) => `<span class="chip">${esc(k)} <b>${esc(v)}</b></span>`).join("");

  const o = overallStats();
  $("#overallChips").innerHTML = [
    ["All cycles · students placed", o.placed], ["All cycles · offers", o.offers],
    ["Recruiters overall", o.companies],
    ["Best package on record", o.highest ? o.highest.toFixed(2) + " LPA" : "—"]
  ].map(([k, v]) => `<span class="chip">${esc(k)} <b>${esc(v)}</b></span>`).join("");
  yearTable("#yearTablePlacements");
  $("#donutPlacements").innerHTML = donut(s.placed, s.eligible, { label: "placed" });
  $("#placeMini").innerHTML = [
    ["Students with an offer", s.placed],
    ["Total offers", s.offers],
    ["Offers per placed student", s.placed ? (s.offers / s.placed).toFixed(2) : "—"],
    ["Recruiters", s.companies]
  ].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join("");

  $("#bandFull").innerHTML = hbars(s.bands.map(b => ({ label: b.label, value: b.n, text: `${b.n} (${pct(b.n, s.offers) || 0}%)` })), { color: "var(--accent)", padL: 92 });
  $("#recHint").textContent = `${s.companies} companies · ${s.offers} offers`;
  $("#companies").innerHTML = hbars(s.companyList.slice(0, 8).map(([n, v]) => ({ label: n, value: v.offers, text: `${v.offers} · ${v.best.toFixed(2)} LPA` })), { color: "var(--accent2)", padL: 140 });

  $("#offerList").innerHTML = (D.placement[state.year].offers || []).map((o, i) => `
    <li>
      <div class="grow"><span class="who">${esc(o.student)}</span>
        <div class="meta">${esc(o.company)}</div></div>
      <span class="num">${Number(o.ctc).toFixed(2)} LPA</span>
      <span class="card-tools">
        <button class="tool" data-edit="offer" data-i="${i}">✎</button>
        <button class="tool" data-del="offer" data-i="${i}">🗑</button>
      </span>
    </li>`).join("") || `<li class="meta">No offers recorded.</li>`;
}

function renderPlan() {
  const t = D.plan.target;
  const s = stats(t.ay);
  const bar = (label, now, target, suffix = "") => {
    const p = target ? Math.min(100, Math.round((now / target) * 100)) : 0;
    return `<div class="pt"><div class="pt-top"><span>${esc(label)}</span>
      <b>${esc(now)}${suffix} <span style="color:var(--dim)">/ ${esc(target)}${suffix}</span></b></div>
      <div class="bar"><i style="width:${p}%"></i></div>
      <div class="meta" style="font-size:10.5px;color:var(--dim);margin-top:4px">${p}% of target</div></div>`;
  };
  $("#planTargets").innerHTML = [
    bar("Students placed", s.placed, t.placed),
    bar("Offers", s.offers, t.offers),
    bar("Companies", s.companies, t.companies),
    bar("Average CTC", s.avgCtc ? Number(s.avgCtc.toFixed(2)) : 0, t.avgCtc, " LPA")
  ].join("");

  $("#planCards").innerHTML = D.plan.items.map((i, idx) => `
    <article class="plan-card">
      <div style="display:flex;gap:8px;align-items:flex-start">
        <h3>${esc(i.title)}</h3>
        <span class="pill ${esc(i.status)}">${esc(i.status)}</span>
        <span class="card-tools">
          <button class="tool" data-edit="planItem" data-i="${idx}">✎</button>
          <button class="tool" data-del="planItem" data-i="${idx}">🗑</button>
        </span>
      </div>
      <div class="meta">${esc(i.meta || "")}</div>
      <p>${esc(i.detail)}</p>
      <div class="bar"><i style="width:${Math.min(100, Number(i.progress || 0))}%"></i></div>
    </article>`).join("");
}

function renderResearch() {
  const list = papersFor(state.year);
  const pat = (D.patents[state.year] && (D.patents[state.year].total ?? D.patents[state.year])) || 0;
  const q1 = list.filter(r => r.quartile === "Q1").length, q2 = list.filter(r => r.quartile === "Q2").length;
  $("#resChips").innerHTML = [
    ["Papers", list.length], ["Journals", list.filter(r => r.type === "Journal").length],
    ["Conferences", list.filter(r => r.type === "Conference").length],
    ["Q1 / Q2", `${q1} / ${q2}`], ["Patents reported", pat]
  ].map(([k, v]) => `<span class="chip">${esc(k)} <b>${esc(v)}</b></span>`).join("");

  const perFac = {};
  list.forEach(r => (r.faculty || []).forEach(n => { perFac[n] = (perFac[n] || 0) + 1; }));
  $("#facPubs").innerHTML = hbars(Object.entries(perFac).sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ label: n, value: v, text: `${v}` })), { color: "var(--accent2)", padL: 150 });

  const j = list.filter(r => r.type === "Journal").length, c = list.filter(r => r.type === "Conference").length;
  $("#typeDonut").innerHTML = donut(j, j + c, { color: "var(--accent2)" });
  $("#typeMini").innerHTML = `<div><span>Journals</span><b>${j}</b></div><div><span>Conferences</span><b>${c}</b></div>
    <div><span>With DOI</span><b>${list.filter(r => r.doi).length}</b></div>`;

  $("#resHint").textContent = `${list.length} rows this year`;
  yearTable("#yearTableResearch", { research: true });
  $("#paperList").innerHTML = list.map((r, i) => `
    <li>
      <div class="grow"><span class="who">${esc(r.title)}</span>
        <div class="meta">${esc((r.faculty || []).join(", "))}${r.venue ? " · " + esc(r.venue) : ""}${r.doi ? ` · <a href="${esc(r.doi)}" target="_blank" rel="noopener">DOI</a>` : ""}</div></div>
      <span class="badge ${r.type === "Conference" ? "c" : "j"}">${esc(r.type === "Conference" ? "Conf" : "Journal")}</span>
      ${r.quartile ? `<span class="badge q">${esc(r.quartile)}</span>` : ""}
      <span class="card-tools">
        <button class="tool" data-edit="paper" data-i="${D.research.indexOf(r)}">✎</button>
        <button class="tool" data-del="paper" data-i="${D.research.indexOf(r)}">🗑</button>
      </span>
    </li>`).join("") || `<li class="meta">No publications recorded for this year.</li>`;
}

function renderFaculty() {
  const doctors = D.faculty.filter(f => /^dr/i.test(f.name) || /\bph\.?d\b/i.test(f.qualification || "")).length;
  const totalPats = D.years.reduce((a, y) => a + patentCount(y), 0);
  $("#facSummary").innerHTML = [
    ["Teaching faculty", D.faculty.length],
    ["With a doctorate", doctors],
    ["Support staff", (D.supportStaff || []).length],
    ["Papers on record", D.research.filter(r => r.type !== "Patent").length],
    ["Patents reported", totalPats],
    ["Average papers / faculty", D.faculty.length ? (D.research.filter(r => r.type !== "Patent").length / D.faculty.length).toFixed(1) : "—"]
  ].map(([k, v]) => `<span class="chip">${esc(k)} <b>${esc(v)}</b></span>`).join("");

  const list = papersFor(state.year);
  $("#facGrid").innerHTML = D.faculty.map((f, i) => {
    const papers = D.research.filter(r => (r.faculty || []).includes(f.name)).length;
    const pats = (D.patents.byFaculty && D.patents.byFaculty[f.name]) || 0;
    const ini = f.name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
    return `<article class="fac">
      <div class="fac-top">
        <div class="av">${esc(ini)}</div>
        <div><h3>${esc(f.name)}</h3><div class="des">${esc(f.designation)}</div>
        ${f.qualification ? `<div class="des" style="opacity:.8">${esc(f.qualification)}</div>` : ""}</div>
        <span class="card-tools">
          <button class="tool" data-edit="faculty" data-i="${i}">✎</button>
          <button class="tool" data-del="faculty" data-i="${i}">🗑</button>
        </span>
      </div>
      <p class="area">${esc(f.area || "")}</p>
      <div class="fac-stats">
        <span class="chip">${papers} paper${papers === 1 ? "" : "s"}</span>
        <span class="chip">${pats} patent${pats === 1 ? "" : "s"}</span>
        ${f.hIndex != null ? `<span class="chip">h-index ${esc(f.hIndex)}</span>` : ""}
      </div>
    </article>`;
  }).join("") + (D.supportStaff || []).map(s => `
    <article class="fac" style="opacity:.85">
      <div class="fac-top"><div class="av" style="background:var(--panel2);color:var(--dim);border:1px solid var(--line)">${esc(s.name.replace(/^(Mr\.|Ms\.|Mrs\.)\s*/, "").split(/\s+/).map(w => w[0]).join("").slice(0, 2))}</div>
      <div><h3>${esc(s.name)}</h3><div class="des">${esc(s.designation)} · support staff</div></div></div>
    </article>`).join("");
}

/* ---------------- CRUD ---------------- */
const SCHEMA = {
  offer: {
    title: "offer",
    fields: [
      { k: "student", label: "Student name", wide: true },
      { k: "company", label: "Company" },
      { k: "ctc", label: "CTC (LPA)", type: "number" }
    ],
    blank: () => ({ student: "", company: "", ctc: 0 }),
    target: (i) => D.placement[state.year].offers,
    apply: (i, v) => { D.placement[state.year].offers[i] = { ...D.placement[state.year].offers[i], ...v }; },
    add: (v) => { D.placement[state.year].offers.push(v); }
  },
  paper: {
    title: "publication",
    fields: [
      { k: "title", label: "Title", wide: true },
      { k: "faculty", label: "Faculty (comma separated)", wide: true, list: true },
      { k: "type", label: "Type", type: "select", options: ["Journal", "Conference"] },
      { k: "venue", label: "Journal / conference" },
      { k: "year", label: "Year", type: "number" },
      { k: "month", label: "Month (1–12)", type: "number" },
      { k: "quartile", label: "Quartile", type: "select", options: ["", "Q1", "Q2", "Q3", "Q4"] },
      { k: "doi", label: "DOI / link", wide: true }
    ],
    blank: () => ({ title: "", faculty: [], type: "Conference", venue: "", year: Number(state.year.slice(0, 4)), month: 8, quartile: "", doi: "", indexing: "Scopus" }),
    target: () => D.research,
    apply: (i, v) => { D.research[i] = { ...D.research[i], ...v, ay: ayOf(Number(v.year), Number(v.month) || null) }; },
    add: (v) => { D.research.push({ ...v, ay: ayOf(Number(v.year), Number(v.month) || null) }); }
  },
  faculty: {
    title: "faculty member",
    fields: [
      { k: "name", label: "Name", wide: true },
      { k: "designation", label: "Designation" },
      { k: "qualification", label: "Qualification" },
      { k: "area", label: "Research area", wide: true },
      { k: "hIndex", label: "Scopus h-index", type: "number" }
    ],
    blank: () => ({ name: "", designation: "Assistant Professor", qualification: "", area: "", hIndex: "" }),
    target: () => D.faculty,
    apply: (i, v) => { D.faculty[i] = { ...D.faculty[i], ...v }; },
    add: (v) => { D.faculty.push(v); }
  },
  planItem: {
    title: "plan item",
    fields: [
      { k: "title", label: "Title", wide: true },
      { k: "detail", label: "Detail", wide: true, type: "textarea" },
      { k: "status", label: "Status", type: "select", options: ["Planned", "Ongoing", "Completed"] },
      { k: "meta", label: "Schedule / note" },
      { k: "progress", label: "Progress %", type: "number" }
    ],
    blank: () => ({ title: "", detail: "", status: "Planned", meta: "", progress: 0 }),
    target: () => D.plan.items,
    apply: (i, v) => { D.plan.items[i] = { ...D.plan.items[i], ...v }; },
    add: (v) => { D.plan.items.push(v); }
  }
};

let editing = { kind: null, index: null };
const dlg = $("#editDlg");

function openDialog(kind, index) {
  const sc = SCHEMA[kind];
  editing = { kind, index };
  const rec = index == null ? sc.blank() : (sc.target()[index] || sc.blank());
  $("#dlgTitle").textContent = (index == null ? "Add " : "Edit ") + sc.title;
  $("#dlgFields").innerHTML = sc.fields.map(f => {
    const val = f.list ? (Array.isArray(rec[f.k]) ? rec[f.k].join(", ") : (rec[f.k] || "")) : (rec[f.k] ?? "");
    if (f.type === "select") {
      return `<label class="${f.wide ? "wide" : ""}">${esc(f.label)}
        <select data-k="${f.k}">${f.options.map(o => `<option ${String(o) === String(val) ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
    }
    if (f.type === "textarea") {
      return `<label class="wide">${esc(f.label)}<textarea data-k="${f.k}">${esc(val)}</textarea></label>`;
    }
    return `<label class="${f.wide ? "wide" : ""}">${esc(f.label)}
      <input data-k="${f.k}" type="${f.type || "text"}" value="${esc(val)}" /></label>`;
  }).join("");
  dlg.showModal();
}

function saveDialog() {
  const sc = SCHEMA[editing.kind];
  const rec = {};
  $$("#dlgFields [data-k]").forEach(el => {
    const f = sc.fields.find(x => x.k === el.dataset.k);
    let v = el.value;
    if (f.type === "number") v = v === "" ? null : Number(v);
    if (f.list) v = String(v).split(",").map(s => s.trim()).filter(Boolean);
    rec[f.k] = v;
  });
  if (editing.index == null) sc.add(rec); else sc.apply(editing.index, rec);
  saveStore();
  renderAll();
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-add],[data-edit],[data-del]");
  if (!t) return;
  if (t.dataset.add) return openDialog(t.dataset.add, null);
  if (t.dataset.edit) {
    const kind = t.dataset.edit;
    openDialog(kind, Number(t.dataset.i));
    return;
  }
  if (t.dataset.del) {
    const kind = t.dataset.del, i = Number(t.dataset.i);
    const label = kind === "paper" ? "publication" : kind === "planItem" ? "plan item" : kind;
    if (!confirm(`Delete this ${label}? This only affects this browser until you export.`)) return;
    const sc = SCHEMA[kind];
    sc.target().splice(i, 1);
    saveStore();
    renderAll();
  }
});

$("#dlgSave").addEventListener("click", () => { saveDialog(); dlg.close(); });
$("#dlgCancel").addEventListener("click", () => dlg.close());
$("#editForm").addEventListener("submit", (e) => { e.preventDefault(); saveDialog(); dlg.close(); });

/* ---------------- shell ---------------- */
$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest(".tab");
  if (!b) return;
  $$(".tab").forEach(x => x.classList.toggle("active", x === b));
  $$(".panel").forEach(p => p.classList.toggle("active", p.id === "p-" + b.dataset.tab));
  state.tab = b.dataset.tab;
});
$("#yearSel").addEventListener("change", (e) => { state.year = e.target.value; renderAll(); });

$("#adminBtn").addEventListener("click", () => {
  state.admin = !state.admin;
  document.body.classList.toggle("admin", state.admin);
  $("#adminBtn").setAttribute("aria-pressed", String(state.admin));
  $("#adminbar").hidden = !state.admin;
});

$("#themeBtn").addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("dsatm_theme", next);
});
if (localStorage.getItem("dsatm_theme")) document.documentElement.dataset.theme = localStorage.getItem("dsatm_theme");

$("#exportBtn").addEventListener("click", () => {
  const out = {
    ...BASE, ...D,
    meta: { ...D.meta, lastUpdated: new Date().toISOString().slice(0, 10) }
  };
  const blob = new Blob(["/* Exported from the dashboard admin panel — replace assets/data.js with this file. */\nwindow.DEPT_DATA = "
    + JSON.stringify(out, null, 2) + ";\n"], { type: "text/javascript" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "data.js";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

$("#resetBtn").addEventListener("click", () => {
  if (!confirm("Discard all local edits and reload from assets/data.js?")) return;
  localStorage.removeItem(KEY);
  location.reload();
});

renderAll();
