# Deploying to Render — Step-by-Step Guide

This guide walks you through deploying the Store Rating Web Application on [Render](https://render.com) with the backend as a **Web Service** and the frontend as a **Static Site**.

---

## Prerequisites

- [ ] A [Render](https://render.com) account (free tier works)
- [ ] Your code pushed to a **GitHub** or **GitLab** repository
- [ ] A PostgreSQL database (you can use Render's managed PostgreSQL or your existing Neon database)

---

## Step 1: Push Code to GitHub

If not done already:

```bash
cd Roxiler
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## Step 2: Create PostgreSQL Database (Optional)

> **Skip this step** if you're already using Neon or an external PostgreSQL provider.

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **PostgreSQL**
3. Fill in:
   - **Name:** `roxiler-db`
   - **Region:** Choose closest to you
   - **Plan:** Free
4. Click **Create Database**
5. Once created, copy the **Internal Database URL** (used in Step 3)

---

## Step 3: Deploy Backend (Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `roxiler-backend` |
| **Region** | Same as your database |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` (⚠️ NOT `npm run dev`) |
| **Plan** | Free |

5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your PostgreSQL connection string (from Neon or Render DB) |
| `JWT_SECRET` | A strong random secret (e.g. `myS3cretK3y!2026xR`) |
| `PORT` | `10000` (Render's default) |
| `NODE_ENV` | `production` |

6. Click **Create Web Service**
7. Wait for the build to complete (2–3 minutes)
8. Note your backend URL: `https://roxiler-3m7g.onrender.com`

### 3.1 Run Database Migrations

After the backend deploys, run migrations using Render's **Shell** tab:

1. Go to your backend service on Render
2. Click the **Shell** tab
3. Run:
```bash
node src/config/db_init.js
```

This creates all tables and seeds the default admin account (`admin@roxiler.com` / `AdminPassword123!`).

### 3.2 Verify Backend

Visit `https://roxiler-3m7g.onrender.com/health` — you should see:
```json
{ "status": "ok", "message": "Store Rating API is active" }
```

Swagger docs: `https://roxiler-3m7g.onrender.com/api-docs`

---

## Step 4: Deploy Frontend (Static Site)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Static Site**
3. Connect the same GitHub repository
4. Configure the site:

| Setting | Value |
|---------|-------|
| **Name** | `roxiler-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

5. Add **Environment Variable**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://roxiler-3m7g.onrender.com/api` |

> ⚠️ **Important:** The `VITE_` prefix is required — Vite only exposes env vars starting with `VITE_` to the client bundle.

6. Add **Rewrite Rule** (for SPA client-side routing):
   - Go to **Redirects/Rewrites** tab
   - Add a rule:

| Source | Destination | Action |
|--------|-------------|--------|
| `/*` | `/index.html` | **Rewrite** |

   This ensures React Router works correctly when users refresh on routes like `/admin` or `/owner`.

7. Click **Create Static Site**
8. Wait for the build to complete (1–2 minutes)
9. Your frontend URL: `https://roxiler-frontend.onrender.com`

---

## Step 5: Configure CORS (Backend)

The backend already reads allowed origins from the `CORS_ORIGIN` environment variable.

On Render, go to your **backend service** → **Environment** → add:

| Key | Value |
|-----|-------|
| `CORS_ORIGIN` | `https://roxiler-frontend.onrender.com` |

For multiple origins (e.g. local dev + production), comma-separate them:
```
CORS_ORIGIN=http://localhost:5173,https://roxiler-frontend.onrender.com
```

No code changes needed — Render will auto-restart the service after adding the env var.

---

## Step 6: Test the Deployment

1. Open `https://roxiler-frontend.onrender.com`
2. Login with: `admin@roxiler.com` / `AdminPassword123!`
3. Verify:
   - [ ] Login redirects to Admin Dashboard
   - [ ] Stats cards load with correct values
   - [ ] Add User and Add Store modals work
   - [ ] Logout and login as different roles
   - [ ] Star rating submission works for Normal User
   - [ ] Owner dashboard shows metrics

---

## Troubleshooting

### Backend returns 503 or times out
- Render free tier spins down after 15 minutes of inactivity — first request takes ~30 seconds to cold start
- Check the **Logs** tab on Render for errors

### Frontend shows blank page or API errors
- Verify `VITE_API_URL` env var is correct (must include `/api` at the end)
- Check browser DevTools → Network tab for CORS errors
- Ensure the rewrite rule `/* → /index.html` is set

### Database connection errors
- Verify `DATABASE_URL` has `?sslmode=require` for external databases
- For Render PostgreSQL, use the **Internal Database URL** (not external)

### Environment variable not working
- `VITE_` prefix is mandatory for Vite apps
- After changing env vars, trigger a **Manual Deploy** (Render doesn't auto-deploy for env changes on static sites)

---

## Architecture on Render

```
┌───────────────────────────────┐
│   Render Static Site          │
│   roxiler-frontend            │
│   (React + Vite build)        │
│   https://roxiler-frontend    │
│        .onrender.com          │
└──────────────┬────────────────┘
               │ HTTPS API calls
               ▼
┌───────────────────────────────┐
│   Render Web Service          │
│   roxiler-backend             │
│   (Node.js + Express)         │
│   https://roxiler-backend     │
│        .onrender.com          │
└──────────────┬────────────────┘
               │ pg.Pool (SSL)
               ▼
┌───────────────────────────────┐
│   PostgreSQL Database         │
│   (Render managed / Neon)     │
└───────────────────────────────┘
```

---

## Cost Summary (Render Free Tier)

| Resource | Free Tier Limits |
|----------|-----------------|
| Web Service | 750 hours/month, sleeps after 15 min inactivity |
| Static Site | 100 GB bandwidth/month, unlimited sites |
| PostgreSQL | 1 GB storage, expires after 90 days |

> For production use, upgrade to the **Starter plan** ($7/month per service) to avoid cold starts and database expiry.
