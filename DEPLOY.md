# Deploying Bello-Feed

**Lost on how to deploy?** → Use the detailed walkthrough: **[RAILWAY-STEPS.md](./RAILWAY-STEPS.md)**. It has step-by-step actions for getting your code on GitHub and deploying the website + database to Railway (where to click, what to run).

This file covers the same in shorter form, plus deployment on a DigitalOcean VM.

---

## Prerequisites

- **Node.js 18+** (for local runs and DigitalOcean).
- A **GitHub** account and the repo pushed (see below).
- **Railway** account: [railway.app](https://railway.app).
- (Optional) A **DigitalOcean** droplet and SSH access.

---

## 1. Push your code to GitHub

From your machine, in the `bello-feed` folder:

```bash
cd bello-feed

git init
git add .
git commit -m "Bello-Feed app with server and DB"
```

Create a new **empty** repository on GitHub (e.g. `your-username/bello-feed`), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bello-feed.git
git branch -M main
git push -u origin main
```

Use your real GitHub username and repo name instead of `YOUR_USERNAME/bello-feed`.

---

## 2. Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign in (e.g. with GitHub).
2. **New Project** → **Deploy from GitHub repo**.
3. Choose the `bello-feed` repository. Railway will create a new service.
4. In the service **Settings** (or **Variables**):
   - **Build command**: leave default or set `npm install`.
   - **Start command**: `npm start` (default).
   - **Root directory**: leave blank (repo root).
5. Railway sets `PORT` automatically; the app uses `process.env.PORT || 4173`, so no extra env vars are required.
6. Click **Deploy** (or trigger a redeploy). After the build, open the **Generated URL** (e.g. `https://bello-feed-xxxx.up.railway.app`).

**Note:** By default the app uses SQLite (ephemeral on Railway). For **persistent storage on Railway**, set **`MONGODB_URI`** to a MongoDB Atlas connection string (create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)), then add it in Railway → your service → **Variables**. The app will use MongoDB instead of SQLite when this variable is set.

---

## 3. Deploy on a DigitalOcean VM (SSH)

After you SSH into your droplet:

### 3.1 Install Node.js (if needed)

Using **nvm** (recommended):

```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # or source ~/.nvm/nvm.sh
nvm install 22
nvm use 22
```

### 3.2 Clone and run

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/bello-feed.git
cd bello-feed
npm install --production
PORT=4173 node server.js
```

Visit `http://YOUR_DROPLET_IP:4173`. Replace `YOUR_DROPLET_IP` with your droplet’s public IP.

### 3.3 Run in the background (e.g. with PM2)

So the app keeps running after you disconnect:

```bash
npm install -g pm2
cd ~/bello-feed
PORT=4173 pm2 start server.js --name bello-feed
pm2 save
pm2 startup   # follow the command it prints to enable startup on reboot
```

### 3.4 (Optional) Use port 80 with Nginx

Install Nginx, then add a site (e.g. `/etc/nginx/sites-available/bello-feed`):

```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;
    location / {
        proxy_pass http://127.0.0.1:4173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/bello-feed /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then open `http://YOUR_DROPLET_IP` in your browser.

---

## 4. Environment variables (optional)

| Variable         | Description                          | Default        |
|------------------|--------------------------------------|----------------|
| `PORT`           | Port the server listens on           | `4173`         |
| `MONGODB_URI`    | MongoDB connection string (e.g. Atlas); if set, app uses MongoDB instead of SQLite | none |
| `BELLO_FEED_DB`  | Path to the SQLite database file (used only when `MONGODB_URI` is not set) | `./bello-feed.db` |

On Railway, only `PORT` is set automatically. On DigitalOcean you can export them before starting:

```bash
export PORT=4173
export BELLO_FEED_DB=/home/your-user/bello-feed/bello-feed.db
node server.js
```

---

## 5. Quick reference

| Target        | Open in browser                          |
|---------------|------------------------------------------|
| Local         | `http://localhost:4173`                  |
| Railway       | Your Railway service URL                 |
| DigitalOcean  | `http://YOUR_DROPLET_IP:4173` or `:80` with Nginx |
