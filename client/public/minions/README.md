# Minion persona photos

Place **actual minion photos** here so each persona shows the real character.

**Required filenames:**

- `kevin.png` — Kevin (responsible leader)
- `stuart.png` — Stuart (lazy rockstar)
- `bob.png` — Bob (innocent baby)
- `dave.png` — Dave (excitable romantic)
- `jerry.png` — Jerry (scaredy-cat)
- `carl.png` — Carl (siren-obsessed)
- `otto.png` — Otto (talkative one)

**Reference for sourcing images:**  
[https://share.google/fOiPEHUNOibfOCNar](https://share.google/fOiPEHUNOibfOCNar) (e.g. Google Image result for “Minions Name” / Pinterest-style reference).

You can use `.png` or `.jpg`; the app looks for `/minions/{id}.png` by default. If you use `.jpg`, update the `image` path in `client/src/lib/personas.js` and in `server.js` to `/minions/{id}.jpg`.

If a file is missing, the UI falls back to a letter placeholder.
