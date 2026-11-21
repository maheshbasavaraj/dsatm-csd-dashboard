/* SQLite schema + seed for the department dashboard.
   The DB is the single source of truth; the API returns one document
   in exactly the shape assets/data.js uses, so the front-end code that
   renders charts does not change. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Database = require("better-sqlite3");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, "dept.db");

const db = new Database(DB_FILE);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS settings   (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS years      (label TEXT PRIMARY KEY, eligible INTEGER, sort INTEGER);
CREATE TABLE IF NOT EXISTS offers     (id INTEGER PRIMARY KEY AUTOINCREMENT, ay TEXT NOT NULL,
                                       student TEXT NOT NULL, usn TEXT, company TEXT NOT NULL,
                                       ctc REAL NOT NULL, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS publications (id INTEGER PRIMARY KEY AUTOINCREMENT, ay TEXT, year INTEGER,
                                       month INTEGER, type TEXT, title TEXT NOT NULL, faculty TEXT,
                                       venue TEXT, indexing TEXT, quartile TEXT, doi TEXT);
CREATE TABLE IF NOT EXISTS faculty    (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
                                       designation TEXT, qualification TEXT, area TEXT,
                                       h_index REAL, citations INTEGER, scopus TEXT, scholar TEXT,
                                       teaching INTEGER DEFAULT 1, sort INTEGER);
CREATE TABLE IF NOT EXISTS support_staff (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, designation TEXT);
CREATE TABLE IF NOT EXISTS patents    (ay TEXT PRIMARY KEY, total INTEGER DEFAULT 0, by_faculty TEXT);
CREATE TABLE IF NOT EXISTS plan_items (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
                                       detail TEXT, status TEXT, meta TEXT, progress INTEGER, sort INTEGER);
CREATE INDEX IF NOT EXISTS offers_ay        ON offers(ay);
CREATE INDEX IF NOT EXISTS publications_ay  ON publications(ay);
`);

/* ---------------- seeding ---------------- */
function readSeedData() {
  const file = path.join(__dirname, "..", "assets", "data.js");
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox, { timeout: 5000 });
  return sandbox.window.DEPT_DATA || null;
}

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) c FROM years").get().c;
  if (count) return { seeded: false, years: count };

  const data = readSeedData();
  if (!data) return { seeded: false, reason: "assets/data.js not found" };

  const insertYear = db.prepare("INSERT OR REPLACE INTO years (label, eligible, sort) VALUES (?,?,?)");
  const insertOffer = db.prepare("INSERT INTO offers (ay, student, usn, company, ctc) VALUES (?,?,?,?,?)");
  const insertPub = db.prepare(`INSERT INTO publications (ay, year, month, type, title, faculty, venue, indexing, quartile, doi)
                                 VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insertFac = db.prepare(`INSERT INTO faculty (name, designation, qualification, area, h_index, citations, scopus, scholar, teaching, sort)
                                 VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const insertStaff = db.prepare("INSERT INTO support_staff (name, designation) VALUES (?,?)");
  const insertPatent = db.prepare("INSERT OR REPLACE INTO patents (ay, total, by_faculty) VALUES (?,?,?)");
  const insertPlan = db.prepare("INSERT INTO plan_items (title, detail, status, meta, progress, sort) VALUES (?,?,?,?,?,?)");
  const insertSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)");

  const seed = db.transaction(() => {
    (data.years || []).forEach((y, i) => {
      const p = (data.placement || {})[y] || {};
      insertYear.run(y, p.eligible ?? null, i);
      (p.offers || []).forEach(o => insertOffer.run(y, o.student, o.usn || null, o.company, Number(o.ctc) || 0));
    });

    (data.research || []).forEach(r => insertPub.run(
      r.ay || null, r.year || null, r.month || null, r.type || "Journal", r.title,
      JSON.stringify(r.faculty || []), r.venue || "", r.indexing || "", r.quartile || "", r.doi || ""
    ));

    (data.faculty || []).forEach((f, i) => insertFac.run(
      f.name, f.designation || "", f.qualification || "", f.area || "",
      f.hIndex ?? null, f.citations ?? null, f.scopus || "", f.scholar || "", 1, i
    ));
    (data.supportStaff || []).forEach(s => insertStaff.run(s.name, s.designation || ""));

    Object.entries(data.patents || {}).forEach(([ay, p]) => {
      if (ay === "byFaculty") return;
      insertPatent.run(ay, typeof p === "number" ? p : (p.total || 0),
        JSON.stringify((p && p.byFaculty) || data.patents?.byFaculty || {}));
    });

    ((data.plan && data.plan.items) || []).forEach((it, i) =>
      insertPlan.run(it.title, it.detail || "", it.status || "Planned", it.meta || "", Number(it.progress) || 0, i));

    insertSetting.run("meta", JSON.stringify(data.meta || {}));
    insertSetting.run("plan_meta", JSON.stringify({ status: data.plan?.status || "", target: data.plan?.target || {} }));
  });
  seed();
  return { seeded: true, years: db.prepare("SELECT COUNT(*) c FROM years").get().c };
}

/* ---------------- read model ---------------- */
function getData() {
  const metaRow = db.prepare("SELECT value FROM settings WHERE key='meta'").get();
  const meta = metaRow ? JSON.parse(metaRow.value) : {};
  const lastEdit = db.prepare("SELECT value FROM settings WHERE key='last_edit'").get();
  if (lastEdit) meta.lastUpdated = lastEdit.value;

  const years = db.prepare("SELECT * FROM years ORDER BY sort").all();
  const placement = {};
  years.forEach(y => {
    placement[y.label] = {
      eligible: y.eligible,
      offers: db.prepare("SELECT id, student, usn, company, ctc FROM offers WHERE ay=? ORDER BY ctc DESC, company").all(y.label)
    };
  });

  const research = db.prepare("SELECT * FROM publications ORDER BY year DESC, id DESC").all()
    .map(r => ({
      id: r.id, ay: r.ay, year: r.year, month: r.month, type: r.type, title: r.title,
      faculty: safeJson(r.faculty, []), venue: r.venue, indexing: r.indexing,
      quartile: r.quartile, doi: r.doi
    }));

  const faculty = db.prepare("SELECT * FROM faculty ORDER BY sort, id").all()
    .map(f => ({
      id: f.id, name: f.name, designation: f.designation, qualification: f.qualification,
      area: f.area, hIndex: f.h_index, citations: f.citations, scopus: f.scopus, scholar: f.scholar
    }));

  const patents = {};
  let byFaculty = {};
  db.prepare("SELECT * FROM patents").all().forEach(p => {
    patents[p.ay] = p.total;
    byFaculty = { ...byFaculty, ...safeJson(p.by_faculty, {}) };
  });
  patents.byFaculty = byFaculty;

  const planMeta = JSON.parse((db.prepare("SELECT value FROM settings WHERE key='plan_meta'").get() || {}).value || "{}");

  return {
    meta,
    years: years.map(y => y.label),
    placement,
    patents,
    research,
    faculty,
    supportStaff: db.prepare("SELECT name, designation FROM support_staff ORDER BY id").all(),
    plan: {
      status: planMeta.status || "",
      target: planMeta.target || {},
      items: db.prepare("SELECT * FROM plan_items ORDER BY sort, id").all()
        .map(i => ({ id: i.id, title: i.title, detail: i.detail, status: i.status, meta: i.meta, progress: i.progress }))
    }
  };
}

const safeJson = (s, fallback) => { try { return JSON.parse(s || ""); } catch { return fallback; } };

function touch() {
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_edit', datetime('now'))").run();
}

module.exports = { db, seedIfEmpty, getData, touch, DB_FILE };
