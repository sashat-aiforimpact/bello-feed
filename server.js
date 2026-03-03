const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = Number(process.env.PORT || 4173);
const DB_PATH = process.env.BELLO_FEED_DB || path.join(__dirname, "bello-feed.db");

app.use(express.json());

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(`
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

app.get("/health", (_req, res) => {
  db.get("SELECT COUNT(*) AS count FROM posts", (err, row) => {
    if (err) return apiError(res, 500, "database error", { code: err.code });
    apiOk(res, {
      service: "bello-feed",
      status: "healthy",
      postsTotal: row?.count ?? 0,
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
  const clauses = [];
  const params = [];
  if (personaId) {
    clauses.push("persona_id = ?");
    params.push(String(personaId));
  }
  if (bananaOnly === "true") clauses.push("banana_tags > 0");
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  db.all(
    `SELECT id, persona_id, text, banana_tags, complain_tags, experiment_tags, is_user, created_at
     FROM posts ${where} ORDER BY datetime(created_at) ASC`,
    params,
    (err, rows) => {
      if (err) return apiError(res, 500, "database error", { code: err.code });
      const posts = (rows || []).map((row) => ({
        id: row.id,
        personaId: row.persona_id,
        text: row.text,
        isUser: Boolean(row.is_user),
        createdAt: row.created_at,
        tags: [
          ...(row.banana_tags ? ["banana"] : []),
          ...(row.complain_tags ? ["complain"] : []),
          ...(row.experiment_tags ? ["experiment"] : []),
        ],
      }));
      apiOk(res, { posts });
    }
  );
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

  db.run(
    `INSERT INTO posts (persona_id, text, banana_tags, complain_tags, experiment_tags, is_user, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [personaId, trimmedText, bananaTags, complainTags, experimentTags, isUser ? 1 : 0, createdAt],
    function onInsert(err) {
      if (err) return apiError(res, 500, "database error", { code: err.code });
      const id = this.lastID;
      apiOk(
        res,
        {
          post: {
            id,
            personaId,
            text: trimmedText,
            isUser: Boolean(isUser),
            createdAt,
            tags: [
              ...(bananaTags ? ["banana"] : []),
              ...(complainTags ? ["complain"] : []),
              ...(experimentTags ? ["experiment"] : []),
            ],
          },
        },
        201
      );
    }
  );
});

app.use(express.static(__dirname));
// Catch-all: serve index.html for any path not handled above (e.g. SPA deep links).
// Express 5 no longer accepts app.get("*", ...); use middleware instead.
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Bello-Feed server on http://0.0.0.0:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
