/* Express API + static host for the department dashboard.
   One process, one SQLite file. Deploy target: Render (or any Node host).

   ENV
     ADMIN_PASSWORD  shared admin password (required in production)
     SECRET          token signing secret (defaults to a value derived from ADMIN_PASSWORD)
     DATA_DIR        where dept.db lives (default ./server/data)
     PORT            defaults to 3000
*/
"use strict";
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const { db, seedIfEmpty, getData, touch } = require("./db");

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.ADMIN_PASSWORD || "dsatm-csd";
const SECRET = process.env.SECRET || crypto.createHash("sha256").update("dsatm:" + PASSWORD).digest("hex");
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;                 // 12 hours
const ROOT = path.join(__dirname, "..");

const app = express();
app.use(express.json({ limit: "1mb" }));

const seeded = seedIfEmpty();
console.log("seed:", JSON.stringify(seeded));
if (!process.env.ADMIN_PASSWORD) console.warn("WARNING: ADMIN_PASSWORD not set — using default 'dsatm-csd'. Set it on the host.");

/* ---------------- auth ---------------- */
function sign(exp) {
  return crypto.createHmac("sha256", SECRET).update(String(exp)).digest("hex").slice(0, 40);
}
function issueToken() {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(exp)}`;
}
function requireAuth(req, res, next) {
  const raw = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [exp, sig] = raw.split(".");
  if (!exp || !sig) return res.status(401).json({ error: "login required" });
  const valid = Number(exp) > Date.now() && crypto.timingSafeEqual(Buffer.from(sign(exp)), Buffer.from(sig.padEnd(40, "0").slice(0, 40)));
  if (!valid) return res.status(401).json({ error: "session expired or invalid" });
  next();
}

app.post("/api/login", (req, res) => {
  const given = String((req.body && req.body.password) || "");
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(PASSWORD).digest();
  if (!crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: "wrong password" });
  res.json({ token: issueToken(), expiresIn: TOKEN_TTL_MS });
});

/* ---------------- read ---------------- */
app.get("/api/data", (_req, res) => res.json(getData()));
app.get("/api/health", (_req, res) => res.json({ ok: true, rows: db.prepare("SELECT COUNT(*) c FROM publications").get().c }));

/* ---------------- writes ---------------- */
const wrap = (fn) => (req, res) => {
  try { const out = fn(req, res); touch(); res.json(out === undefined ? { ok: true } : out); }
  catch (err) { console.error(err); res.status(400).json({ error: err.message }); }
};

/* offers */
app.post("/api/offers", requireAuth, wrap((req) => {
  const { ay, student, usn, company, ctc } = req.body || {};
  if (!ay || !student || !company) throw new Error("ay, student and company are required");
  const r = db.prepare("INSERT INTO offers (ay, student, usn, company, ctc) VALUES (?,?,?,?,?)")
    .run(ay, student, usn || null, company, Number(ctc) || 0);
  return { id: r.lastInsertRowid };
}));
app.put("/api/offers/:id", requireAuth, wrap((req) => {
  const { student, usn, company, ctc } = req.body || {};
  db.prepare("UPDATE offers SET student=COALESCE(?,student), usn=?, company=COALESCE(?,company), ctc=COALESCE(?,ctc) WHERE id=?")
    .run(student ?? null, usn ?? null, company ?? null, ctc == null ? null : Number(ctc), req.params.id);
}));
app.delete("/api/offers/:id", requireAuth, wrap((req) => {
  db.prepare("DELETE FROM offers WHERE id=?").run(req.params.id);
}));

/* publications */
app.post("/api/publications", requireAuth, wrap((req) => {
  const b = req.body || {};
  if (!b.title) throw new Error("title is required");
  const r = db.prepare(`INSERT INTO publications (ay, year, month, type, title, faculty, venue, indexing, quartile, doi)
                        VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .run(b.ay || null, b.year || null, b.month || null, b.type || "Journal", b.title,
      JSON.stringify(b.faculty || []), b.venue || "", b.indexing || "Scopus", b.quartile || "", b.doi || "");
  return { id: r.lastInsertRowid };
}));
app.put("/api/publications/:id", requireAuth, wrap((req) => {
  const b = req.body || {};
  db.prepare(`UPDATE publications SET ay=COALESCE(?,ay), year=COALESCE(?,year), month=COALESCE(?,month),
              type=COALESCE(?,type), title=COALESCE(?,title), faculty=?, venue=COALESCE(?,venue),
              indexing=COALESCE(?,indexing), quartile=COALESCE(?,quartile), doi=COALESCE(?,doi) WHERE id=?`)
    .run(b.ay ?? null, b.year ?? null, b.month ?? null, b.type ?? null, b.title ?? null,
      JSON.stringify(b.faculty || []), b.venue ?? null, b.indexing ?? null, b.quartile ?? null, b.doi ?? null,
      req.params.id);
}));
app.delete("/api/publications/:id", requireAuth, wrap((req) => {
  db.prepare("DELETE FROM publications WHERE id=?").run(req.params.id);
}));

/* faculty */
app.post("/api/faculty", requireAuth, wrap((req) => {
  const b = req.body || {};
  if (!b.name) throw new Error("name is required");
  const max = db.prepare("SELECT COALESCE(MAX(sort),0)+1 s FROM faculty").get().s;
  const r = db.prepare(`INSERT INTO faculty (name, designation, qualification, area, h_index, citations, scopus, scholar, teaching, sort)
                        VALUES (?,?,?,?,?,?,?,?,1,?)`)
    .run(b.name, b.designation || "", b.qualification || "", b.area || "",
      b.hIndex === "" || b.hIndex == null ? null : Number(b.hIndex), b.citations ?? null, b.scopus || "", b.scholar || "", max);
  return { id: r.lastInsertRowid };
}));
app.put("/api/faculty/:id", requireAuth, wrap((req) => {
  const b = req.body || {};
  db.prepare(`UPDATE faculty SET name=COALESCE(?,name), designation=COALESCE(?,designation),
              qualification=COALESCE(?,qualification), area=COALESCE(?,area), h_index=? WHERE id=?`)
    .run(b.name ?? null, b.designation ?? null, b.qualification ?? null, b.area ?? null,
      b.hIndex === "" || b.hIndex == null ? null : Number(b.hIndex), req.params.id);
}));
app.delete("/api/faculty/:id", requireAuth, wrap((req) => {
  db.prepare("DELETE FROM faculty WHERE id=?").run(req.params.id);
}));

/* plan items */
app.post("/api/plan-items", requireAuth, wrap((req) => {
  const b = req.body || {};
  if (!b.title) throw new Error("title is required");
  const max = db.prepare("SELECT COALESCE(MAX(sort),0)+1 s FROM plan_items").get().s;
  const r = db.prepare("INSERT INTO plan_items (title, detail, status, meta, progress, sort) VALUES (?,?,?,?,?,?)")
    .run(b.title, b.detail || "", b.status || "Planned", b.meta || "", Number(b.progress) || 0, max);
  return { id: r.lastInsertRowid };
}));
app.put("/api/plan-items/:id", requireAuth, wrap((req) => {
  const b = req.body || {};
  db.prepare("UPDATE plan_items SET title=COALESCE(?,title), detail=COALESCE(?,detail), status=COALESCE(?,status), meta=COALESCE(?,meta), progress=COALESCE(?,progress) WHERE id=?")
    .run(b.title ?? null, b.detail ?? null, b.status ?? null, b.meta ?? null,
      b.progress == null ? null : Number(b.progress), req.params.id);
}));
app.delete("/api/plan-items/:id", requireAuth, wrap((req) => {
  db.prepare("DELETE FROM plan_items WHERE id=?").run(req.params.id);
}));

/* year + patent summaries */
app.put("/api/years/:label", requireAuth, wrap((req) => {
  const eligible = req.body && req.body.eligible;
  db.prepare("UPDATE years SET eligible=? WHERE label=?")
    .run(eligible === "" || eligible == null ? null : Number(eligible), req.params.label);
}));
app.put("/api/patents/:ay", requireAuth, wrap((req) => {
  const total = Number((req.body || {}).total) || 0;
  db.prepare("INSERT INTO patents (ay, total, by_faculty) VALUES (?,?,COALESCE((SELECT by_faculty FROM patents WHERE ay=?),'{}')) ON CONFLICT(ay) DO UPDATE SET total=excluded.total")
    .run(req.params.ay, total, req.params.ay);
}));

/* ---------------- static site ---------------- */
const BLOCK = [/^\/server(\/|$)/, /^\/files(\/|$)/, /^\/tools(\/|$)/, /^\/data(\/|$)/, /^\/\.git(\/|$)/];
app.use((req, res, next) => (BLOCK.some(re => re.test(req.path)) ? res.status(404).end() : next()));
app.use(express.static(ROOT, { extensions: ["html"], index: "index.html", dotfiles: "ignore" }));

app.listen(PORT, () => console.log(`dashboard api on http://127.0.0.1:${PORT}`));
