const fs = require("fs");
const p = "assets/app.js";
let s = fs.readFileSync(p, "utf8");
let n = 0;
const rep = (a, b) => {
  if (!s.includes(a)) { console.log("MISS:", a.slice(0, 60)); return; }
  s = s.replace(a, b); n++;
};

// donut accepts colours
rep('const g = grad("#828fff", "#5e6ad2");', 'const g = grad(opts.from || "#a5b4fc", opts.to || "#22d3ee");');

// hbars honour per-item colour
rep('fill="url(#' + '${g.id})"></rect>`;\n    if (padL',
    'fill="${it.color || "url(#' + '${g.id})"}"></rect>`;\n    if (padL');
// the above is fragile; do it with a regex instead
s = s.replace(/(<rect x="\$\{padL\}" y="\$\{y \+ 6\}" width="\$\{bw\}" height="13" rx="6\.5" fill=")url\(#\$\{g\.id\}\)("><\/rect>)/,
  '$1${it.color || `url(#${g.id})`}$2');

// vbars brighter default
rep('const g = grad(opts.from || "#2dd4bf", opts.to || "#0f766e");',
    'const g = grad(opts.from || "#67e8f9", opts.to || "#6366f1");');

// band palette helper
rep('function overallStats() {',
`const BAND_COLORS = { "\u2265 15 LPA": "#34d399", "10\u201315": "#a3e635", "8\u201310": "#22d3ee", "6\u20138": "#818cf8", "4\u20136": "#fbbf24", "< 4": "#fb7185" };
const bandItem = (b, extra) => ({ label: b.label, value: b.n, text: extra || String(b.n), color: BAND_COLORS[b.label] });

function overallStats() {`);

// KPI tones
rep('`, "a2")}', '`, "t-emerald")}');
rep('`, "")}', '`, "t-violet")}');
rep('"% of eligible batch", "a3"', '"% of eligible batch", "t-cyan"');
rep('offers all cycles`, "", "LPA")}', 'offers all cycles`, "t-rose", "LPA")}');

// overview chart hues
rep('$("#bandMini").innerHTML = hbars(s.bands.map(b => ({ label: b.label, value: b.n, text: `${b.n}` })), { padL: 92 });',
    '$("#bandMini").innerHTML = hbars(s.bands.map(b => bandItem(b)), { padL: 92 });');
rep('{ padL: 150, from: "#f472b6", to: "#8b5cf6" }', '{ padL: 150, from: "#f472b6", to: "#8b5cf6" }');
rep('{ padL: 150, from: "#34d399", to: "#0f766e" }', '{ padL: 150, from: "#f472b6", to: "#8b5cf6" }');
rep('$("#donutPlacement").innerHTML = donut(s.placed, s.eligible, { label: "placed" });',
    '$("#donutPlacement").innerHTML = donut(s.placed, s.eligible, { label: "placed", from: "#a5b4fc", to: "#22d3ee" });');

// placements tab hues
rep('$("#bandFull").innerHTML = hbars(s.bands.map(b => ({ label: b.label, value: b.n, text: `${b.n} (${pct(b.n, s.offers) || 0}%)` })), { color: "var(--accent)", padL: 92 });',
    '$("#bandFull").innerHTML = hbars(s.bands.map(b => bandItem(b, `${b.n} (${pct(b.n, s.offers) || 0}%)`)), { padL: 92 });');
rep('{ color: "var(--accent2)", padL: 140 }', '{ padL: 140, from: "#38bdf8", to: "#0ea5e9" }');
rep('$("#donutPlacements").innerHTML = donut(s.placed, s.eligible, { label: "placed" });',
    '$("#donutPlacements").innerHTML = donut(s.placed, s.eligible, { label: "placed", from: "#a5b4fc", to: "#22d3ee" });');

// research tab hues
rep('{ color: "var(--accent2)", padL: 150 }', '{ padL: 150, from: "#34d399", to: "#22d3ee" }');
rep('$("#typeDonut").innerHTML = donut(j, j + c, { color: "var(--accent2)" });',
    '$("#typeDonut").innerHTML = donut(j, j + c, { from: "#34d399", to: "#0ea5e9" });');

fs.writeFileSync(p, s);
console.log("applied", n, "edits");
