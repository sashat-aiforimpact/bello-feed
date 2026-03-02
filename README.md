# Bello-Feed 🧪🍌

Minion-themed social feed simulation for an underground lab. Pick a Minion persona and post status updates about lab life, complaining about work, and (of course) bananas.

This is a **full-stack app**:

- Frontend: single-page **HTML/CSS/vanilla JS** UI.
- Backend: **Node/Express** server.
- Database: **SQLite** file (`bello-feed.db`) storing Minion posts.

## Files

- `index.html` – Main Bello-Feed page (personas, composer, feed, lab stats)
- `styles.css` – Minion-inspired, modern UI styling
- `script.js` – Client-side behavior for personas, posting, filtering, and lab stats; talks to backend JSON API
- `server.js` – Express server + SQLite database + JSON API
- `package.json` – Node project manifest (`npm start` runs the server)
- `bello-feed.db` – SQLite database file (created on first run)

## How to run

From the `bello-feed` directory:

```bash
cd bello-feed
npm install
npm start
```

Then open `http://localhost:4173` in your browser.

## How to use the page

1. **Choose a Minion persona** (left column): Kevin, Stuart, Bob, or Scarlet.
2. **Write a status update** (middle column):
   - Rant about work, describe experiments, or obsess over bananas.
   - Max 220 characters.
   - Optional: toggle **“Banana mode”** to auto-inject Minion-style banana phrases.
3. **Post to Bello-Feed**:
   - Your post is sent to the backend API and stored in the SQLite database.
   - It appears in the central feed.
   - Banana posts drain banana stock; “boom”/explosion posts make experiments more unstable.
4. **Filter the feed**:
   - **All Minions** – Show all posts (user + auto-generated, if added later).
   - **My posts** – Only posts from the currently selected persona that *you* wrote.
   - **Bananas only** – Only posts tagged as banana-related.

## Notes for grading / customization

- The backend stores posts in `bello-feed.db` (SQLite).
- The feed starts **empty**, so you (or graders) can write your own Minion posts for demos; restarting the server keeps existing posts as long as the DB file is not deleted.
- You can tweak personas and client behavior in `script.js` and adjust API/database logic in `server.js`.

## API overview (for agents or integrations)

Base URL when running locally: `http://127.0.0.1:4173`

- `GET /health` – health check and total post count.
- `GET /api/posts` – list all posts; accepts optional `personaId` and `bananaOnly=true` filters.
- `POST /api/posts` – create a new post:

  ```json
  {
    "personaId": "kevin",
    "text": "Short message about bananas",
    "isUser": true
  }
  ```

  Response (success):

  ```json
  {
    "ok": true,
    "data": {
      "post": {
        "id": 1,
        "personaId": "kevin",
        "text": "Short message about bananas",
        "isUser": true,
        "createdAt": "2026-01-01T12:00:00.000Z",
        "tags": ["banana"]
      }
    }
  }
  ```

All responses follow the shape `{ "ok": true, "data": { ... } }` on success or `{ "ok": false, "error": { "message": "...", "details": { ... } } }` on errors.

