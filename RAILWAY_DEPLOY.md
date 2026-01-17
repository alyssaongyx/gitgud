# Railway Deployment - Fix Buildpack Issue

## Problem

Railway is trying to use buildpacks (Railpack) instead of Docker. Railway works better when you deploy **services separately** rather than using docker-compose.

## Solution: Deploy Services Separately

Railway prefers individual services over docker-compose. Here's how:

---

## Step 1: Delete Current Service (If Created)

If you already created a service that's trying to use buildpacks:
1. Go to Railway dashboard
2. Delete the current service
3. Start fresh

---

## Step 2: Deploy Backend Service

1. **Create New Service:**
   - Click **"New"** → **"GitHub Repo"**
   - Select your `gitgud` repository

2. **Configure Service:**
   - Go to **Settings** → **Source**
   - Set **Root Directory:** `backend`
   - Railway will automatically detect `backend/Dockerfile`
   - **Build Command:** (leave empty - Railway uses Dockerfile)
   - **Start Command:** (leave empty - uses Dockerfile CMD)

3. **Set Port:**
   - Go to **Settings** → **Networking**
   - Railway will auto-detect port 3000 from Dockerfile

4. **Add Environment Variables:**
   Go to **Variables** tab and add:
   ```env
   NODE_ENV=production
   PORT=3000
   OPENAI_API_KEY=sk-proj-...
   ELEVENLABS_API_KEY=sk_...
   GITHUB_TOKEN=...
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   SESSION_SECRET=your-random-32-char-secret
   OPENAI_MODEL=gpt-4o-mini
   LOG_LEVEL=info
   # URLs - update after frontend deploys
   FRONTEND_URL=https://frontend-production.up.railway.app
   BACKEND_URL=https://backend-production.up.railway.app
   ALLOWED_ORIGINS=https://frontend-production.up.railway.app
   ```

5. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the **Railway URL** (e.g., `https://backend-production.up.railway.app`)

---

## Step 3: Deploy Frontend Service

1. **Create New Service:**
   - Click **"New"** → **"GitHub Repo"**
   - Select your `gitgud` repository (same repo)

2. **Configure Service:**
   - Go to **Settings** → **Source**
   - Set **Root Directory:** `frontend`
   - Railway will automatically detect `frontend/Dockerfile`
   - **Build Command:** (leave empty)
   - **Start Command:** (leave empty)

3. **Set Port:**
   - Go to **Settings** → **Networking**
   - Railway will auto-detect port 80 from Dockerfile

4. **Add Environment Variables:**
   Go to **Variables** tab and add:
   ```env
   # Use the backend URL from Step 2
   VITE_API_URL=https://backend-production.up.railway.app
   ```

5. **Add Build Arguments:**
   - Go to **Settings** → **Build**
   - Add build argument:
     - **Name:** `VITE_API_URL`
     - **Value:** `https://backend-production.up.railway.app`

6. **Deploy:**
   - Railway will automatically build and deploy
   - Wait for deployment to complete
   - Copy the **Railway URL** (e.g., `https://frontend-production.up.railway.app`)

---

## Step 4: Update Environment Variables

After both services are deployed:

### Update Backend Variables:
Go to backend service → **Variables**:
```env
FRONTEND_URL=https://frontend-production.up.railway.app
ALLOWED_ORIGINS=https://frontend-production.up.railway.app
```

### Update Frontend Variables:
Go to frontend service → **Variables**:
```env
VITE_API_URL=https://backend-production.up.railway.app
```

**Important:** After updating `VITE_API_URL`, you need to **rebuild** the frontend because it's a build-time variable.

Go to frontend service → **Deployments** → **Redeploy** (or push a new commit)

---

## Step 5: Update GitHub OAuth (If Using PVP)

1. Go to https://github.com/settings/developers
2. Edit your OAuth App
3. Update **Authorization callback URL:**
   ```
   https://backend-production.up.railway.app/auth/github/callback
   ```

---

## Alternative: Force Docker Compose (Not Recommended)

If you really want to use docker-compose:

1. In Railway dashboard, go to your service
2. **Settings** → **Source**
3. Look for **"Docker Compose"** option
4. If available, select it
5. Railway should detect `docker-compose.yml`

However, Railway's docker-compose support is limited. **Separate services work better.**

---

## Why Separate Services?

✅ **Better resource management** - Scale services independently  
✅ **Clearer configuration** - Each service has its own settings  
✅ **Easier debugging** - Separate logs and metrics  
✅ **More reliable** - Railway's native deployment method  
✅ **Better networking** - Railway handles service-to-service communication  

---

## Troubleshooting

### Build Fails

**Check:**
1. Root directory is set correctly (`backend` or `frontend`)
2. Dockerfile exists in that directory
3. All environment variables are set
4. Check build logs in Railway dashboard

### Services Can't Communicate

**Fix:**
1. Make sure `VITE_API_URL` points to backend's Railway URL
2. Make sure `ALLOWED_ORIGINS` includes frontend's Railway URL
3. Check CORS configuration in backend

### Frontend Shows Old API URL

**Fix:**
- `VITE_API_URL` is a **build-time** variable
- After changing it, you must **rebuild** the frontend
- Either redeploy or push a new commit

---

## Summary

**Best Approach:**
1. Deploy backend as separate service (Root: `backend`)
2. Deploy frontend as separate service (Root: `frontend`)
3. Connect them via environment variables
4. Update URLs after deployment

This is the **most reliable** way to deploy on Railway! 🚀
