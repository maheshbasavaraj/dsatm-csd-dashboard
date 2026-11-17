/* ============================================================
   DSATM · CSE (Data Science) — Department dashboard data
   ------------------------------------------------------------
   THIS FILE IS THE ONLY FILE TO EDIT FOR ROUTINE UPDATES.
   Replace the sample values below with your department's real
   numbers, then reload index.html. Nothing else needs changing.

   Sample = true puts a "sample data" chip in the footer. Set it
   to false once real figures are in.
   ============================================================ */

window.DEPT_DATA = {
  meta: {
    sample: true,
    college: "Dayananda Sagar Academy of Technology and Management",
    shortCollege: "DSATM",
    department: "Computer Science & Engineering (Data Science)",
    programme: "B.E. — CSE (Data Science)",
    hod: "Dr. Shalini R.",
    email: "hod.csd@dsatm.edu.in",
    lastUpdated: "2026-11-17",
    activeYear: "2026-27"
  },

  academicYears: ["2026-27", "2025-26", "2024-25", "2023-24"],

  /* ---------------- Placements, one block per academic year ------------- */
  placement: {
    "2026-27": {
      eligible: 64,
      placed: 56,
      offers: 64,
      higherStudies: 4,
      companies: 42,
      highestLpa: 19.5,
      averageLpa: 6.4,
      medianLpa: 5.6,
      international: 2,
      recruiters: [
        { name: "TCS", sector: "IT services", offers: 9, role: "Assistant System Engineer", ctc: 3.6 },
        { name: "Infosys", sector: "IT services", offers: 7, role: "Systems Engineer", ctc: 3.9 },
        { name: "Accenture", sector: "Consulting", offers: 6, role: "Associate Software Engineer", ctc: 4.6 },
        { name: "Cognizant", sector: "IT services", offers: 5, role: "GenC / GenC Pro", ctc: 4.0 },
        { name: "Wipro", sector: "IT services", offers: 4, role: "Project Engineer", ctc: 3.5 },
        { name: "Capgemini", sector: "IT services", offers: 4, role: "Analyst", ctc: 4.25 },
        { name: "Deloitte", sector: "Consulting", offers: 3, role: "Analyst — Data", ctc: 7.6 },
        { name: "Tredence", sector: "Analytics", offers: 3, role: "Data Analyst", ctc: 8.5 },
        { name: "LTIMindtree", sector: "IT services", offers: 3, role: "Graduate Engineer Trainee", ctc: 4.0 },
        { name: "Mu Sigma", sector: "Analytics", offers: 2, role: "Decision Scientist", ctc: 6.0 },
        { name: "Tiger Analytics", sector: "Analytics", offers: 2, role: "Analyst", ctc: 9.0 },
        { name: "LatentView", sector: "Analytics", offers: 2, role: "Data Analyst", ctc: 7.2 },
        { name: "IBM", sector: "Product / cloud", offers: 2, role: "Associate Developer", ctc: 6.8 },
        { name: "EY", sector: "Consulting", offers: 2, role: "Data & Analytics Analyst", ctc: 6.2 },
        { name: "Sonata Software", sector: "IT services", offers: 2, role: "Analyst", ctc: 4.2 },
        { name: "Mphasis", sector: "IT services", offers: 2, role: "Trainee Software Engineer", ctc: 4.0 },
        { name: "Bosch Global Software", sector: "Product / automotive", offers: 1, role: "AI Engineer (Intern + FTE)", ctc: 19.5 },
        { name: "Harman", sector: "Product / automotive", offers: 1, role: "Data Engineer", ctc: 9.5 },
        { name: "PwC AC", sector: "Consulting", offers: 1, role: "Associate", ctc: 7.0 },
        { name: "Mindtree Atlas", sector: "Analytics", offers: 1, role: "BI Developer", ctc: 5.5 },
        { name: "Sigmoid", sector: "Data engineering", offers: 1, role: "Data Engineer", ctc: 11.0 },
        { name: "Quantiphi", sector: "AI services", offers: 1, role: "ML Engineer", ctc: 8.0 }
      ]
    },
    "2025-26": {
      eligible: 61,
      placed: 51,
      offers: 57,
      higherStudies: 3,
      companies: 38,
      highestLpa: 16.0,
      averageLpa: 5.9,
      medianLpa: 5.1,
      international: 1,
      recruiters: [
        { name: "TCS", sector: "IT services", offers: 8, role: "Assistant System Engineer", ctc: 3.36 },
        { name: "Infosys", sector: "IT services", offers: 7, role: "Systems Engineer", ctc: 3.6 },
        { name: "Accenture", sector: "Consulting", offers: 5, role: "Associate Software Engineer", ctc: 4.5 },
        { name: "Cognizant", sector: "IT services", offers: 5, role: "GenC", ctc: 4.0 },
        { name: "Wipro", sector: "IT services", offers: 4, role: "Project Engineer", ctc: 3.5 },
        { name: "Deloitte", sector: "Consulting", offers: 3, role: "Analyst", ctc: 7.6 },
        { name: "Tredence", sector: "Analytics", offers: 2, role: "Data Analyst", ctc: 8.0 },
        { name: "Mu Sigma", sector: "Analytics", offers: 2, role: "Decision Scientist", ctc: 5.5 },
        { name: "IBM", sector: "Product / cloud", offers: 2, role: "Associate Developer", ctc: 6.5 },
        { name: "Capgemini", sector: "IT services", offers: 3, role: "Analyst", ctc: 4.25 },
        { name: "LTIMindtree", sector: "IT services", offers: 3, role: "Graduate Engineer Trainee", ctc: 4.0 },
        { name: "Sigmoid", sector: "Data engineering", offers: 1, role: "Data Engineer", ctc: 10.5 },
        { name: "Harman", sector: "Product / automotive", offers: 1, role: "Data Engineer", ctc: 9.0 },
        { name: "Sonata Software", sector: "IT services", offers: 2, role: "Analyst", ctc: 4.0 },
        { name: "Mphasis", sector: "IT services", offers: 2, role: "Trainee Software Engineer", ctc: 3.8 }
      ]
    },
    "2024-25": {
      eligible: 58,
      placed: 45,
      offers: 49,
      higherStudies: 3,
      companies: 33,
      highestLpa: 12.5,
      averageLpa: 5.2,
      medianLpa: 4.6,
      international: 0,
      recruiters: [
        { name: "TCS", sector: "IT services", offers: 8, role: "Assistant System Engineer", ctc: 3.36 },
        { name: "Infosys", sector: "IT services", offers: 6, role: "Systems Engineer", ctc: 3.6 },
        { name: "Cognizant", sector: "IT services", offers: 5, role: "GenC", ctc: 4.0 },
        { name: "Accenture", sector: "Consulting", offers: 4, role: "Associate Software Engineer", ctc: 4.5 },
        { name: "Wipro", sector: "IT services", offers: 4, role: "Project Engineer", ctc: 3.5 },
        { name: "Capgemini", sector: "IT services", offers: 3, role: "Analyst", ctc: 4.0 },
        { name: "Deloitte", sector: "Consulting", offers: 2, role: "Analyst", ctc: 7.0 },
        { name: "Mu Sigma", sector: "Analytics", offers: 2, role: "Decision Scientist", ctc: 5.0 },
        { name: "LTIMindtree", sector: "IT services", offers: 3, role: "Graduate Engineer Trainee", ctc: 4.0 },
        { name: "Tredence", sector: "Analytics", offers: 1, role: "Data Analyst", ctc: 7.5 },
        { name: "Mindtree Atlas", sector: "Analytics", offers: 1, role: "BI Developer", ctc: 5.0 },
        { name: "Sonata Software", sector: "IT services", offers: 2, role: "Analyst", ctc: 4.0 }
      ]
    },
    "2023-24": {
      eligible: 55,
      placed: 39,
      offers: 42,
      higherStudies: 2,
      companies: 29,
      highestLpa: 10.0,
      averageLpa: 4.6,
      medianLpa: 4.2,
      international: 0,
      recruiters: [
        { name: "TCS", sector: "IT services", offers: 7, role: "Assistant System Engineer", ctc: 3.36 },
        { name: "Infosys", sector: "IT services", offers: 6, role: "Systems Engineer", ctc: 3.6 },
        { name: "Cognizant", sector: "IT services", offers: 4, role: "GenC", ctc: 4.0 },
        { name: "Wipro", sector: "IT services", offers: 4, role: "Project Engineer", ctc: 3.5 },
        { name: "Accenture", sector: "Consulting", offers: 3, role: "Associate Software Engineer", ctc: 4.5 },
        { name: "Capgemini", sector: "IT services", offers: 3, role: "Analyst", ctc: 4.0 },
        { name: "LTIMindtree", sector: "IT services", offers: 2, role: "Graduate Engineer Trainee", ctc: 4.0 },
        { name: "Mu Sigma", sector: "Analytics", offers: 1, role: "Decision Scientist", ctc: 5.0 },
        { name: "Mphasis", sector: "IT services", offers: 2, role: "Trainee Software Engineer", ctc: 3.6 },
        { name: "Sonata Software", sector: "IT services", offers: 1, role: "Analyst", ctc: 4.0 }
      ]
    }
  },

  /* ---------------- Research, patents, grants ---------------------------- */
  research: [
    { year: 2026, type: "Patent", title: "System and method for low-latency Kannada speech summarisation on edge devices", faculty: ["Dr. Shalini R.", "Prof. Naveen Kumar S."], venue: "Indian Patent — App. 202641034521 (published)", indexing: "Published", status: "Published", doi: "" },
    { year: 2026, type: "Patent", title: "IoT-based precision irrigation controller with adaptive soil-moisture forecasting", faculty: ["Dr. Anitha M.", "Prof. Raghavendra P."], venue: "Indian Patent — App. 202641021187 (filed)", indexing: "Published", status: "Filed", doi: "" },
    { year: 2026, type: "Patent", title: "Wearable assistive device for visually impaired navigation using multimodal fusion", faculty: ["Dr. Shalini R.", "Prof. Divya S."], venue: "Indian Patent — App. 202541099214 (granted)", indexing: "Granted", status: "Granted", doi: "" },
    { year: 2026, type: "Journal", title: "Attention-guided graph networks for claim verification in low-resource Indic languages", faculty: ["Dr. Shalini R.", "Prof. Naveen Kumar S."], venue: "IEEE Access, vol. 14", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1109/ACCESS.2026.0000000" },
    { year: 2026, type: "Journal", title: "Federated learning for intrusion detection in smart-campus networks", faculty: ["Dr. Anitha M.", "Prof. Karthik B."], venue: "Computers & Security (Elsevier)", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1016/j.cose.2026.000000" },
    { year: 2026, type: "Journal", title: "MSME credit default prediction with class-imbalanced tabular transformers", faculty: ["Prof. Divya S.", "Dr. Anitha M."], venue: "Applied Soft Computing (Elsevier)", indexing: "SCI", status: "Under review", doi: "" },
    { year: 2026, type: "Journal", title: "Explainable crop-yield forecasting for Karnataka districts using satellite indices", faculty: ["Prof. Raghavendra P."], venue: "Journal of Agrometeorology", indexing: "Scopus", status: "Published", doi: "https://doi.org/10.54386/jam.2026.000" },
    { year: 2026, type: "Journal", title: "Retrieval-augmented generation for multilingual academic advising", faculty: ["Prof. Meghana T."], venue: "SN Computer Science", indexing: "Scopus", status: "Published", doi: "https://doi.org/10.1007/s42979-026-00000" },
    { year: 2026, type: "Conference", title: "Sparse-mixture adapters for on-device sentiment analysis in Dravidian languages", faculty: ["Dr. Shalini R.", "Prof. Meghana T."], venue: "IEEE ICASSP 2026, Hyderabad", indexing: "Scopus", status: "Published", doi: "" },
    { year: 2026, type: "Conference", title: "Vision transformer distillation for traffic-sign recognition on embedded GPUs", faculty: ["Prof. Karthik B.", "Dr. Anitha M."], venue: "CVPR Workshops 2026", indexing: "Scopus", status: "Accepted", doi: "" },
    { year: 2026, type: "Conference", title: "Digital twin of a campus energy grid with reinforcement-learning setpoints", faculty: ["Prof. Raghavendra P.", "Prof. Divya S."], venue: "IEEE PES GM 2026", indexing: "Scopus", status: "Accepted", doi: "" },
    { year: 2026, type: "Conference", title: "Benchmarking OCR pipelines for historical Kannada palm-leaf manuscripts", faculty: ["Prof. Naveen Kumar S."], venue: "ICDAR 2026", indexing: "Scopus", status: "Under review", doi: "" },
    { year: 2026, type: "Book chapter", title: "Responsible AI in engineering education: a governance checklist", faculty: ["Dr. Shalini R."], venue: "Springer LNNS — Ethics in Applied AI", indexing: "Scopus", status: "Published", doi: "https://doi.org/10.1007/978-3-031-00000-0_12" },
    { year: 2026, type: "Grant", title: "AI-assisted crop advisory for Hassan district farmer producer organisations", faculty: ["Prof. Raghavendra P.", "Dr. Anitha M."], venue: "Karnataka State Council for Science & Technology — ₹9.4 L", indexing: "Granted", status: "Sanctioned", doi: "" },
    { year: 2026, type: "Grant", title: "Indic speech data corpus for low-resource dubbing pipelines", faculty: ["Dr. Shalini R."], venue: "VTU research seed grant — ₹3.0 L", indexing: "Granted", status: "Sanctioned", doi: "" },
    { year: 2025, type: "Journal", title: "Contrastive pretraining for code-mixed Kannada-English text classification", faculty: ["Dr. Shalini R.", "Prof. Meghana T."], venue: "ACM TALLIP", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1145/3700000" },
    { year: 2025, type: "Journal", title: "Energy-aware task offloading in fog-assisted IoT deployments", faculty: ["Dr. Anitha M.", "Prof. Karthik B."], venue: "Ad Hoc Networks (Elsevier)", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1016/j.adhoc.2025.000000" },
    { year: 2025, type: "Journal", title: "A survey of tabular deep learning for financial risk modelling", faculty: ["Prof. Divya S."], venue: "IEEE Access", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1109/ACCESS.2025.0000000" },
    { year: 2025, type: "Conference", title: "Graph neural networks for detecting coordinated inauthentic behaviour", faculty: ["Prof. Karthik B."], venue: "IEEE BigData 2025", indexing: "Scopus", status: "Published", doi: "" },
    { year: 2025, type: "Conference", title: "Student dropout early-warning system using LMS interaction logs", faculty: ["Prof. Meghana T.", "Dr. Shalini R."], venue: "IEEE T4E 2025", indexing: "Scopus", status: "Published", doi: "" },
    { year: 2025, type: "Patent", title: "Portable water-quality analyser with on-device anomaly detection", faculty: ["Prof. Raghavendra P."], venue: "Indian Patent — 202541044871 (granted)", indexing: "Granted", status: "Granted", doi: "" },
    { year: 2024, type: "Journal", title: "Hybrid CNN-LSTM framework for short-term solar irradiance prediction", faculty: ["Dr. Anitha M."], venue: "Solar Energy (Elsevier)", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1016/j.solener.2024.000000" },
    { year: 2024, type: "Journal", title: "Knowledge-graph enrichment of engineering syllabi for recommendation", faculty: ["Prof. Meghana T."], venue: "IEEE Transactions on Education", indexing: "SCI", status: "Published", doi: "https://doi.org/10.1109/TE.2024.0000000" },
    { year: 2024, type: "Conference", title: "Privacy-preserving attendance verification with homomorphic encryption", faculty: ["Prof. Karthik B.", "Prof. Divya S."], venue: "IEEE CONECCT 2024", indexing: "Scopus", status: "Published", doi: "" },
    { year: 2024, type: "Grant", title: "Edge-AI lab equipment augmentation under RPS scheme", faculty: ["Dr. Shalini R."], venue: "AICTE RPS — ₹6.5 L", indexing: "Granted", status: "Completed", doi: "" }
  ],

  /* ---------------- Calendar: IA, SEE, events, deadlines ---------------- */
  events: [
    { date: "2026-11-24", endDate: "2026-11-27", type: "ia", title: "IA-3 — all 5th & 7th semester courses", detail: "Units 3–5, 50 marks, descriptive + MCQ", venue: "Block C — as per seating chart" },
    { date: "2026-11-19", type: "event", title: "Industry talk — Tredence: analytics in retail supply chains", detail: "Pre-final year students, open Q&A with hiring panel", venue: "Seminar Hall 2, 11:00 AM" },
    { date: "2026-11-21", type: "deadline", title: "Internship offer letters due (7th sem)", detail: "Upload signed offer + NOC to department drive", venue: "Dept. office" },
    { date: "2026-12-01", type: "event", title: "Datathon 2026 — department hackathon", detail: "24-hour event, teams of 3, tracks: agri-AI, health, mobility", venue: "Innovation Lab, 9:00 AM" },
    { date: "2026-12-07", endDate: "2026-12-19", type: "exam", title: "SEE — odd semester (Dec 2026)", detail: "Theory + lab SEE, VTU timetable", venue: "As per VTU notification" },
    { date: "2026-12-22", endDate: "2027-01-01", type: "holiday", title: "Semester break", detail: "Department office open 9:30 AM–1:00 PM on working days", venue: "—" },
    { date: "2027-01-05", type: "event", title: "Even semester begins — 4th & 6th semester", detail: "Orientation and timetable release", venue: "Respective classrooms" },
    { date: "2027-01-09", type: "deadline", title: "Project phase-1 synopsis submission (8th sem)", detail: "Guide allotment finalised by 12 Jan", venue: "Submit to coordinator" },
    { date: "2027-01-18", type: "event", title: "Alumni connect — data science careers abroad", detail: "Alumni from batch 2019–2022, panel + networking", venue: "Auditorium, 2:00 PM" },
    { date: "2027-02-02", endDate: "2027-02-06", type: "ia", title: "IA-1 — even semester", detail: "Units 1–2, 50 marks", venue: "Block C" },
    { date: "2027-02-14", type: "deadline", title: "Faculty publication entries for AY 2026-27", detail: "Submit DOI/patent proof to research coordinator", venue: "Google form + hard copy" },
    { date: "2027-03-08", type: "event", title: "International Women's Day — Women in Data panel", detail: "Talks by alumnae and industry guests", venue: "Auditorium" },
    { date: "2027-03-20", endDate: "2027-03-24", type: "ia", title: "IA-2 — even semester", detail: "Units 3–4, 50 marks", venue: "Block C" },
    { date: "2027-04-12", type: "event", title: "Dept. TechXpo — final-year project showcase", detail: "Industry + startup jury, 40+ projects", venue: "Main campus atrium" },
    { date: "2027-04-26", endDate: "2027-05-04", type: "ia", title: "IA-3 — even semester", detail: "Units 3–5 revision + lab internals", venue: "Block C" },
    { date: "2027-05-10", endDate: "2027-05-24", type: "exam", title: "SEE — even semester (May 2027)", detail: "VTU theory + lab exams", venue: "As per VTU notification" }
  ],

  /* ---------------- Internal assessment plan ---------------- */
  iaPlan: [
    { assessment: "IA-1", window: "Week 5–6", coverage: "Units 1–2", marks: "50 (20% weight)" },
    { assessment: "IA-2", window: "Week 10–11", coverage: "Units 3–4", marks: "50 (20% weight)" },
    { assessment: "IA-3", window: "Week 14–15", coverage: "Units 3–5 (comprehensive)", marks: "50 (20% weight)" },
    { assessment: "Lab internals", window: "Continuous", coverage: "All experiments + record + viva", marks: "50 (lab SEE 50)" },
    { assessment: "Quiz / assignment", window: "Every unit", coverage: "Unit-end quiz, 10% of IA", marks: "10 per unit" }
  ],

  /* ---------------- Faculty ---------------- */
  faculty: [
    { name: "Dr. Shalini R.", designation: "Professor & Head", area: "NLP, Indic language models, responsible AI", email: "shalini.r@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2011 },
    { name: "Dr. Anitha M.", designation: "Professor", area: "IoT security, federated learning, energy-aware computing", email: "anitha.m@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2013 },
    { name: "Prof. Naveen Kumar S.", designation: "Associate Professor", area: "Speech processing, OCR, multimodal retrieval", email: "naveen.s@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2016 },
    { name: "Prof. Divya S.", designation: "Associate Professor", area: "Tabular deep learning, fintech risk models", email: "divya.s@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2017 },
    { name: "Prof. Karthik B.", designation: "Assistant Professor", area: "Computer vision, edge inference, adversarial robustness", email: "karthik.b@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2019 },
    { name: "Prof. Raghavendra P.", designation: "Assistant Professor", area: "Agri-AI, remote sensing, digital twins", email: "raghavendra.p@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2019 },
    { name: "Prof. Meghana T.", designation: "Assistant Professor", area: "RAG systems, learning analytics", email: "meghana.t@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2021 },
    { name: "Prof. Sandeep V.", designation: "Assistant Professor", area: "Data engineering, lakehouse architectures", email: "sandeep.v@dsatm.edu.in", scholar: "https://scholar.google.com/", scopus: "https://www.scopus.com/", joined: 2022 }
  ]
};
