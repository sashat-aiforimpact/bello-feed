const path = require("path");
const express = require("express");

const app = express();
const PORT = Number(process.env.PORT || 4173);
const MONGODB_URI = process.env.MONGODB_URI;
const DB_PATH = process.env.BELLO_FEED_DB || path.join(__dirname, "bello-feed.db");

app.use(express.json());

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

if (MONGODB_URI) {
  const { MongoClient } = require("mongodb");
  dbType = "mongodb";
  const client = new MongoClient(MONGODB_URI);
  client
    .connect()
    .then(() => {
      const db = client.db("bello-feed");
      mongoCollection = db.collection("posts");
      return mongoCollection.createIndex({ createdAt: 1 });
    })
    .then(() => {
      console.log("Bello-Feed: connected to MongoDB");
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
    if (err) return apiError(res, 500, "database error", { code: err.code });
    apiOk(res, {
      service: "bello-feed",
      status: "healthy",
      database: dbType,
      postsTotal: count,
      timestamp: nowIso(),
    });
  });
});

app.get("/api/personas", (_req, res) => {
  apiOk(res, {
    personas: [
      { id: "kevin", name: "Kevin", role: "Lab Supervisor", bio: "Keeps chaos barely under control." },
      { id: "stuart", name: "Stuart", role: "Guitar Specialist", bio: "Jams during fire drills." },
      { id: "bob", name: "Bob", role: "Intern • Explosives", bio: "Accidentally blows up coffee machines." },
      { id: "scarlet", name: "Scarlet", role: "Evil Architect", bio: "Designs overcomplicated traps." },
    ],
  });
});

app.get("/api/posts", (req, res) => {
  const { personaId, bananaOnly } = req.query;
  getPosts({ personaId, bananaOnly }, (err, posts) => {
    if (err) return apiError(res, 500, "database error", { code: err.code });
    apiOk(res, { posts });
  });
});

app.post("/api/posts", (req, res) => {
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

app.use(express.static(__dirname));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Bello-Feed server on http://0.0.0.0:${PORT} (db: ${dbType})`);
});
