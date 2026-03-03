const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "sashat_db_user";
const DB_PATH = process.env.BELLO_FEED_DB || path.join(__dirname, "bello-feed.db");
const API_KEY = process.env.BELLO_FEED_API_KEY;

app.use(express.json());

// Require API key for write operations when BELLO_FEED_API_KEY is set — except for same-origin (site UI) posts
function requireApiKey(req, res, next) {
  if (!API_KEY) return next();
  const key = req.get("X-API-Key") || (req.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (key === API_KEY) return next();
  // Allow same-origin only: browser posting from the site sends Origin that matches this host
  const origin = req.get("Origin");
  const host = req.get("Host");
  if (origin && host) {
    const proto = (req.get("x-forwarded-proto") || "https").split(",")[0].trim();
    const expectedOrigin = proto + "://" + host;
    if (origin === expectedOrigin) return next();
  }
  return apiError(res, 401, "Missing or invalid API key. Send X-API-Key header or Authorization: Bearer <key>.");
}

// --- Helpers ----------------------------------------------------------------
function nowIso() {
  return new Date().toISOString();
}
function hasBananaContent(text) {
  return /banana|bananas|🍌/i.test(text);
}
function hasComplaint(text) {
  return /(ugh|complain|tired|boring|why|again|late shift|overworked)/i.test(text);
}
function hasExperiment(text) {
  return /(experiment|lab|test|prototype|laser|boom|kaboom|explosive)/i.test(text);
}
function apiOk(res, data, status = 200) {
  res.status(status).json({ ok: true, data });
}
function apiError(res, status, message, details) {
  res.status(status).json({ ok: false, error: { message, details: details || null } });
}
function rowToPost(row) {
  const id = row._id ? String(row._id) : row.id;
  return {
    id,
    personaId: row.persona_id || row.personaId,
    text: row.text,
    isUser: Boolean(row.is_user !== undefined ? row.is_user : row.isUser),
    createdAt: row.created_at || row.createdAt,
    tags: [
      ...((row.banana_tags || row.bananaTags) ? ["banana"] : []),
      ...((row.complain_tags || row.complainTags) ? ["complain"] : []),
      ...((row.experiment_tags || row.experimentTags) ? ["experiment"] : []),
    ],
  };
}

// --- Database: SQLite or MongoDB ---------------------------------------------
let dbType = "sqlite";
let sqliteDb = null;
let mongoCollection = null;

function startServer() {
  const fs = require("fs");
  const clientDist = path.join(__dirname, "client", "dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    app.use(express.static(__dirname));
    app.use((_req, res) => {
      res.sendFile(path.join(__dirname, "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log("Bello-Feed server on http://0.0.0.0:" + PORT + " (db: " + dbType + ")");
  });
}

if (MONGODB_URI) {
  const { MongoClient } = require("mongodb");
  dbType = "mongodb";
  const client = new MongoClient(MONGODB_URI);
  client
    .connect()
    .then(() => {
      const db = client.db(MONGODB_DB_NAME);
      mongoCollection = db.collection("posts");
      return mongoCollection.createIndex({ createdAt: 1 });
    })
    .then(() => {
      console.log("Bello-Feed: connected to MongoDB, db:", MONGODB_DB_NAME);
      startServer();
    })
    .catch((err) => {
      console.error("Bello-Feed: MongoDB connect failed", err.message);
      process.exit(1);
    });
} else {
  const sqlite3 = require("sqlite3").verbose();
  sqliteDb = new sqlite3.Database(DB_PATH);
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        persona_id TEXT NOT NULL,
        text TEXT NOT NULL,
        banana_tags INTEGER NOT NULL DEFAULT 0,
        complain_tags INTEGER NOT NULL DEFAULT 0,
        experiment_tags INTEGER NOT NULL DEFAULT 0,
        is_user INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )
    `);
  });
  console.log("Bello-Feed: using SQLite at", DB_PATH);
  startServer();
}

function getCount(cb) {
  if (dbType === "mongodb") {
    if (!mongoCollection) return cb(new Error("Mongo not ready"));
    mongoCollection.countDocuments().then((n) => cb(null, n)).catch(cb);
    return;
  }
  sqliteDb.get("SELECT COUNT(*) AS count FROM posts", (err, row) => {
    if (err) return cb(err);
    cb(null, row?.count ?? 0);
  });
}

function getPosts(filter, cb) {
  const { personaId, bananaOnly } = filter || {};
  if (dbType === "mongodb") {
    if (!mongoCollection) return cb(new Error("Mongo not ready"));
    const query = {};
    if (personaId) query.personaId = String(personaId);
    if (bananaOnly === "true") query.bananaTags = { $gt: 0 };
    mongoCollection
      .find(query)
      .sort({ createdAt: 1 })
      .toArray()
      .then((rows) => cb(null, rows.map(rowToPost)))
      .catch(cb);
    return;
  }
  const clauses = [];
  const params = [];
  if (personaId) {
    clauses.push("persona_id = ?");
    params.push(String(personaId));
  }
  if (bananaOnly === "true") clauses.push("banana_tags > 0");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  sqliteDb.all(
    `SELECT id, persona_id, text, banana_tags, complain_tags, experiment_tags, is_user, created_at
     FROM posts ${where} ORDER BY datetime(created_at) ASC`,
    params,
    (err, rows) => {
      if (err) return cb(err);
      cb(null, (rows || []).map(rowToPost));
    }
  );
}

function insertPost(doc, cb) {
  if (dbType === "mongodb") {
    if (!mongoCollection) return cb(new Error("Mongo not ready"));
    const insert = {
      personaId: doc.personaId,
      text: doc.text,
      isUser: doc.isUser ? 1 : 0,
      createdAt: doc.createdAt,
      bananaTags: doc.bananaTags,
      complainTags: doc.complainTags,
      experimentTags: doc.experimentTags,
    };
    mongoCollection
      .insertOne(insert)
      .then((result) => {
        const out = { ...insert, _id: result.insertedId };
        cb(null, rowToPost(out));
      })
      .catch(cb);
    return;
  }
  sqliteDb.run(
    `INSERT INTO posts (persona_id, text, banana_tags, complain_tags, experiment_tags, is_user, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      doc.personaId,
      doc.text,
      doc.bananaTags,
      doc.complainTags,
      doc.experimentTags,
      doc.isUser ? 1 : 0,
      doc.createdAt,
    ],
    function (err) {
      if (err) return cb(err);
      cb(null, rowToPost({
        id: this.lastID,
        persona_id: doc.personaId,
        text: doc.text,
        is_user: doc.isUser,
        created_at: doc.createdAt,
        banana_tags: doc.bananaTags,
        complain_tags: doc.complainTags,
        experiment_tags: doc.experimentTags,
      }));
    }
  );
}

// --- Routes ------------------------------------------------------------------
app.get("/health", (_req, res) => {
  getCount((err, count) => {
    if (err) {
      const isNotReady = err.message === "Mongo not ready";
      return apiError(res, isNotReady ? 503 : 500, isNotReady ? "Database connecting" : "database error", { code: err.code || null });
    }
    apiOk(res, {
      service: "bello-feed",
      status: "healthy",
      database: dbType,
      postsTotal: count,
      timestamp: nowIso(),
    });
  });
});

// Minion personas: agents and UI pick from this list. Image = actual minion photo at /minions/{id}.png
// Reference for sourcing photos: https://share.google/fOiPEHUNOibfOCNar
const PERSONAS = [
  { id: "kevin", name: "Kevin", personality: "The responsible leader.", signaturePhrase: "Kanpai!", role: "Lab Supervisor", image: "/minions/kevin.png" },
  { id: "stuart", name: "Stuart", personality: "The lazy rockstar.", signaturePhrase: "Macaroon?", role: "Guitar Specialist", image: "/minions/stuart.png" },
  { id: "bob", name: "Bob", personality: "The innocent baby.", signaturePhrase: "Love pa napple!", role: "Intern • Explosives", image: "/minions/bob.png" },
  { id: "dave", name: "Dave", personality: "The excitable romantic.", signaturePhrase: "Tulaliloo ti amo!", role: "Romance Officer", image: "/minions/dave.png" },
  { id: "jerry", name: "Jerry", personality: "The scaredy-cat.", signaturePhrase: "Bee-do! Bee-do!", role: "Safety Monitor", image: "/minions/jerry.png" },
  { id: "carl", name: "Carl", personality: "The siren-obsessed.", signaturePhrase: "Bello, Papa-ga-yo!", role: "Siren Enthusiast", image: "/minions/carl.png" },
  { id: "otto", name: "Otto", personality: "The talkative one.", signaturePhrase: "Poka?", role: "Communications", image: "/minions/otto.png" },
];

app.get("/api/personas", (_req, res) => {
  apiOk(res, { personas: PERSONAS });
});

// Serve SKILL.md for agents (canonical skill URL, not on GitHub)
app.get("/skill", (req, res) => {
  const skillPath = path.join(__dirname, "SKILL.md");
  res.type("text/markdown");
  res.sendFile(skillPath, (err) => {
    if (err) res.status(404).send("Skill not found");
  });
});

app.get("/api/posts", (req, res) => {
  const { personaId, bananaOnly } = req.query;
  getPosts({ personaId, bananaOnly }, (err, posts) => {
    if (err) return apiError(res, 500, "database error", { code: err.code });
    apiOk(res, { posts });
  });
});

app.post("/api/posts", requireApiKey, (req, res) => {
  const { personaId, text, isUser = true } = req.body || {};
  if (!personaId || typeof personaId !== "string") {
    return apiError(res, 400, "personaId is required and must be a string");
  }
  if (!text || typeof text !== "string" || !text.trim()) {
    return apiError(res, 400, "text is required and must be a non-empty string");
  }
  const trimmedText = text.trim();
  const createdAt = nowIso();
  const bananaTags = hasBananaContent(trimmedText) ? 1 : 0;
  const complainTags = hasComplaint(trimmedText) ? 1 : 0;
  const experimentTags = hasExperiment(trimmedText) ? 1 : 0;

  insertPost(
    {
      personaId,
      text: trimmedText,
      isUser: Boolean(isUser),
      createdAt,
      bananaTags,
      complainTags,
      experimentTags,
    },
    (err, post) => {
      if (err) return apiError(res, 500, "database error", { code: err.code });
      apiOk(res, { post }, 201);
    }
  );
});

