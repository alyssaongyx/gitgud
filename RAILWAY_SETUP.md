# Railway Setup - What You Need

## Good News: Your App is Already Ready! 🎉

Your app is **already configured** for Railway deployment. Railway works directly with your `docker-compose.yml` file.

## What You Already Have ✅

1. ✅ **Docker Compose** (`docker-compose.yml`) - Railway detects this automatically
2. ✅ **Health checks** - Both services have health check endpoints
3. ✅ **Environment variables** - Already configured in docker-compose.yml
4. ✅ **Dockerfiles** - Both frontend and backend have proper Dockerfiles
5. ✅ **Port configuration** - Ports are properly exposed

## Optional: What You Can Add (But Not Required)

I've created these optional files to make Railway deployment smoother:

### 1. `railway.toml` (Optional)
- Helps Railway understand your services better
- Provides additional configuration hints
- **Not required** - Railway works without it

### 2. `.railwayignore` (Optional)
- Similar to `.gitignore` but for Railway builds
- Excludes unnecessary files from deployment
- **Not required** - Railway is smart about what to include

## What You Need to Do

### Step 1: Push to GitHub

```bash
# If you haven't already
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway will automatically:
   - Detect `docker-compose.yml`
   - Create services for `frontend` and `backend`
   - Start building

### Step 3: Add Environment Variables

In Railway dashboard → **Variables** tab, add:

```env
# Required
OPENAI_API_KEY=sk-proj-your-actual-key
ELEVENLABS_API_KEY=sk_your-actual-key
SESSION_SECRET=your-random-32-char-secret

# GitHub OAuth (for PVP mode)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# URLs (Railway will provide these after deployment)
FRONTEND_URL=https://your-project.up.railway.app
BACKEND_URL=https://your-project.up.railway.app
VITE_API_URL=https://your-project.up.railway.app
ALLOWED_ORIGINS=https://your-project.up.railway.app

# Optional
NODE_ENV=production
OPENAI_MODEL=gpt-4o-mini
LOG_LEVEL=info
```

**Important:** After Railway provides your URL, update:
- `FRONTEND_URL`
- `BACKEND_URL`
- `VITE_API_URL`
- `ALLOWED_ORIGINS`

### Step 4: Configure Service Ports (If Needed)

Railway usually auto-detects ports, but you can verify:

1. Go to **frontend** service → **Settings** → **Networking**
   - Should show port `80`

2. Go to **backend** service → **Settings** → **Networking**
   - Should show port `3000`

### Step 5: Deploy!

Railway will automatically deploy when you:
- Push to your main branch, OR
- Click **"Deploy"** in the dashboard

## How Railway Works with Your Setup

### Your Current Architecture:

```
┌─────────────────┐
│   Frontend      │  Port 80 (Nginx)
│   (React/Vite)  │  ──────────────────┐
└─────────────────┘                    │
                                       │
┌─────────────────┐                    │
│   Backend       │  Port 3000         │
│   (Fastify)     │  ──────────────────┘
└─────────────────┘                    │
                                       ▼
                            Railway Public URL
                            (e.g., your-app.up.railway.app)
```

### How Requests Flow:

1. User visits `https://your-app.up.railway.app`
2. Railway routes to **frontend** service (port 80)
3. Frontend Nginx serves React app
4. Frontend makes API calls to `/api/*`
5. Nginx proxies `/api/*` to **backend** service (port 3000)
6. Backend processes request and returns response

This works because your `frontend/nginx.conf` already proxies `/api` to the backend!

## No Code Changes Needed!

Your app is already set up correctly:
- ✅ Frontend's `nginx.conf` proxies `/api` to backend
- ✅ Backend listens on port 3000
- ✅ Health checks are in place
- ✅ Environment variables are configured
- ✅ Docker Compose is properly set up

## Troubleshooting

### If Railway doesn't detect services:

1. Make sure `docker-compose.yml` is in the root directory
2. Check that both Dockerfiles exist:
   - `backend/Dockerfile`
   - `frontend/Dockerfile`

### If build fails:

1. Check build logs in Railway dashboard
2. Verify all environment variables are set
3. Make sure Dockerfiles are correct

### If services don't start:

1. Check service logs in Railway dashboard
2. Verify ports are configured correctly
3. Check health check endpoints are working

## Summary

**You don't need to add anything to your app!** Railway works with your existing:
- `docker-compose.yml`
- Dockerfiles
- Health checks
- Environment variable configuration

The optional files I created (`railway.toml` and `.railwayignore`) are just nice-to-haves, not requirements.

**Just push to GitHub and deploy on Railway!** 🚀
