# Fixing Railway Buildpack Detection Issue

## Problem

Railway is trying to use buildpacks (Railpack) instead of Docker Compose. This happens when Railway doesn't detect Docker configuration properly.

## Solution: Configure Railway to Use Docker

You have **two options**:

### Option 1: Use Railway UI (Easiest)

1. Go to your Railway project dashboard
2. Click on your service (or create a new one)
3. Go to **Settings** → **Build**
4. Change **Build Command** to: `docker-compose up -d`
5. Or better: Go to **Settings** → **Service** → **Source**
6. Select **"Docker Compose"** as the build method
7. Railway should detect `docker-compose.yml` automatically

### Option 2: Use Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set build method to Docker
railway variables set RAILWAY_DOCKERFILE_PATH=docker-compose.yml
```

### Option 3: Create Separate Services (Recommended for Railway)

Railway works better when you deploy services separately rather than using docker-compose. Here's how:

1. **Create Backend Service:**
   - New Service → Deploy from GitHub
   - Select your repo
   - **Root Directory:** `backend`
   - **Build Command:** (leave empty, Railway will detect Dockerfile)
   - Railway will use `backend/Dockerfile`

2. **Create Frontend Service:**
   - New Service → Deploy from GitHub
   - Select your repo
   - **Root Directory:** `frontend`
   - **Build Command:** (leave empty, Railway will detect Dockerfile)
   - Railway will use `frontend/Dockerfile`

3. **Configure Networking:**
   - Both services will get Railway URLs
   - Set `VITE_API_URL` in frontend to backend's Railway URL
   - Set `ALLOWED_ORIGINS` in backend to frontend's Railway URL

### Option 4: Use nixpacks.toml (Alternative)

Create `nixpacks.toml` in root:

```toml
[phases.setup]
nixPkgs = ["docker", "docker-compose"]

[phases.install]
cmds = ["docker-compose build"]

[start]
cmd = "docker-compose up"
```

But this is more complex. **Option 3 is recommended.**

---

## Recommended: Deploy Services Separately

Railway works best when you deploy each service separately:

### Step 1: Deploy Backend

1. **New Service** → **GitHub Repo** → Select your repo
2. **Settings** → **Root Directory:** `backend`
3. Railway will detect `backend/Dockerfile`
4. Add environment variables
5. Deploy!

### Step 2: Deploy Frontend

1. **New Service** → **GitHub Repo** → Select your repo
2. **Settings** → **Root Directory:** `frontend`
3. Railway will detect `frontend/Dockerfile`
4. Add environment variables (including `VITE_API_URL` pointing to backend)
5. Deploy!

### Step 3: Configure URLs

After both deploy, you'll get:
- Frontend URL: `https://frontend-production.up.railway.app`
- Backend URL: `https://backend-production.up.railway.app`

Update:
- Frontend env: `VITE_API_URL=https://backend-production.up.railway.app`
- Backend env: `ALLOWED_ORIGINS=https://frontend-production.up.railway.app`
- Backend env: `FRONTEND_URL=https://frontend-production.up.railway.app`

---

## Why This Happens

Railway's buildpack system (Railpack) tries to auto-detect your app type. When it sees multiple directories and no clear entry point, it gets confused. 

**Docker Compose** is better for local development, but Railway prefers **individual Dockerfiles** for each service.

---

## Quick Fix: Use Railway UI

The fastest solution:

1. In Railway dashboard, go to your service
2. **Settings** → **Source**
3. Make sure it's set to use **Dockerfile** (not buildpack)
4. If using docker-compose, select **"Docker Compose"** option
5. Set **Root Directory** if needed

If Railway still doesn't detect Docker Compose, use **Option 3** (separate services) - it's the most reliable approach.
