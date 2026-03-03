# Deploy Bello-Feed to Railway — Step by Step

Follow these steps in order. The **website** and **database** (SQLite) are both part of the same app: Railway runs your Node server, which serves the site and writes to a database file. You deploy once and get both.

---

## Part A: Get your code on GitHub

Do this from your computer, in Terminal (or Command Prompt).

### Step A1: Open the project folder

```bash
cd bello-feed
```

(If your project lives somewhere else, use that path, e.g. `cd ~/Desktop/bello-feed`.)

### Step A2: Start Git (if you haven’t already)

```bash
git init
```

### Step A3: Stage and commit everything

```bash
git add .
git status
```

You should see files like `server.js`, `package.json`, `index.html`, etc. Then:

```bash
git commit -m "Bello-Feed app ready for Railway"
```

### Step A4: Create a new repo on GitHub

1. Open a browser and go to **https://github.com**
2. Log in.
3. Click the **+** (top right) → **New repository**.
4. **Repository name:** e.g. `bello-feed`
5. Leave “Add a README” **unchecked** (you already have files).
6. Click **Create repository**.

### Step A5: Connect your folder to GitHub and push

GitHub will show you “push an existing repository from the command line.” Use your **actual** repo URL. It looks like:

`https://github.com/YOUR_USERNAME/bello-feed.git`

Run (replace `YOUR_USERNAME` and `bello-feed` if your repo name is different):

```bash
git remote add origin https://github.com/YOUR_USERNAME/bello-feed.git
git branch -M main
git push -u origin main
```

If it asks for login, use your GitHub username and a **Personal Access Token** as the password (GitHub → Settings → Developer settings → Personal access tokens). After this, your code is on GitHub.

---

## Part B: Deploy on Railway

### Step B1: Open Railway

1. Go to **https://railway.app** in your browser.
2. Click **Login** (or **Start a New Project**).
3. Choose **Login with GitHub** and authorize Railway when asked.

### Step B2: Create a new project from GitHub

1. On the Railway dashboard, click **New Project**.
2. Select **Deploy from GitHub repo**.
3. If asked, click **Configure GitHub App** and allow Railway access to your GitHub account (or to the repo you want).
4. In the list of repositories, find **bello-feed** (or whatever you named it) and click it.
5. Railway may ask “Add variables?” — you can click **Deploy Now** or **Add variables later**. You don’t need any variables for a basic deploy.

### Step B3: Wait for the first deploy

1. Railway will create a “service” for your repo and start building.
2. You’ll see a **Build** log (installing dependencies, etc.). Wait until it finishes.
3. Then it will **Deploy** and start your app. Status should turn green/success.

### Step B4: Get your live website URL

1. Click your **service** (the box with your app name, e.g. “bello-feed”).
2. Open the **Settings** tab for that service.
3. Scroll to **Networking** or **Public Networking**.
4. Click **Generate Domain**. Railway will assign a URL like:

   `https://bello-feed-production-xxxx.up.railway.app`

5. Copy that URL or click it. That’s your live site.

### Step B5: Open your site

1. Paste the URL in your browser and press Enter.
2. You should see the Bello-Feed page (Minion personas, composer, feed).
3. Choose a persona, type a message, and click **Post to Bello-Feed**. The post is saved in the database and will show in the feed.

---

## What you’ve deployed

| Thing        | What it is on Railway |
|-------------|------------------------|
| **Website** | The same `index.html` + CSS + JS, served by your Node server. |
| **Database**| SQLite file (`bello-feed.db`) created and used by your server inside the container. |
| **API**     | `/health`, `/api/posts` (GET/POST) are part of the same server. |

You did **one** deploy: the server runs the site and the database together. No separate “database deploy” step.

---

## If something goes wrong

- **“Application failed to respond” / site doesn’t load**  
  - In Railway, open your service → **Deployments** → click the latest deployment and check the **logs** at the bottom.  
  - The app must listen on `process.env.PORT`. Your `server.js` already does this (`PORT = process.env.PORT || 4173`), so no change needed.

- **Build fails**  
  - In the **Build** log, look for red error lines.  
  - Often it’s “module not found”: make sure `package.json` has `express` and `sqlite3` and that you committed it (`git add package.json` and push again).

- **Repo not in the list when connecting GitHub**  
  - Click **Configure GitHub App** and grant Railway access to the organization or account that owns the repo, then try **New Project** → **Deploy from GitHub repo** again.

---

## Summary checklist

- [ ] Code is in the `bello-feed` folder with `server.js`, `package.json`, `index.html`, etc.
- [ ] `git init`, `git add .`, `git commit`, repo created on GitHub, `git remote add origin ...`, `git push`.
- [ ] Logged in at railway.app with GitHub.
- [ ] New Project → Deploy from GitHub repo → choose `bello-feed`.
- [ ] Wait for build and deploy to succeed.
- [ ] In the service → Settings → Generate Domain.
- [ ] Open the generated URL in the browser and test posting.

After that, your database and website are both live on Railway.
