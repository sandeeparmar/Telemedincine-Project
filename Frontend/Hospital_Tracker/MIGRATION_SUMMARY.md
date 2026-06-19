# Migration Summary: Backend to Frontend Integration

## What Was Done

This document summarizes the changes made to prepare your Hospital Management System for Vercel deployment.

### 1. **Project Structure Reorganization**

#### Before:
```
Hospital M/
├── Backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── ...
└── Frontend/
    └── Hospital_Tracker/
        ├── src/
        ├── package.json
        └── ...
```

#### After:
```
Hospital M/
└── Frontend/
    └── Hospital_Tracker/
        ├── server/                 # ← Backend moved here
        │   ├── server.js
        │   ├── config/
        │   ├── controllers/
        │   ├── models/
        │   ├── routes/
        │   ├── services/
        │   └── package.json (old)
        ├── src/                    # Frontend React code
        ├── api/                    # ← Vercel serverless functions
        ├── package.json            # ← Combined dependencies
        ├── vercel.json             # ← Vercel configuration
        ├── .env.example            # ← Environment template
        ├── .gitignore              # ← Updated with env files
        ├── DEPLOYMENT_GUIDE.md     # ← This file
        └── ...
```

### 2. **Files Created/Modified**

#### Created Files:
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `api/index.js` - Vercel API handler for Express routes
- ✅ `.env.example` - Environment variables template
- ✅ `DEPLOYMENT_GUIDE.md` - Deployment instructions
- ✅ `MIGRATION_SUMMARY.md` - This file

#### Modified Files:
- ✅ `package.json` - Added backend dependencies + scripts
- ✅ `vite.config.js` - Added build configuration
- ✅ `.gitignore` - Added .env files and other ignores

#### Unchanged:
- ✅ `server/server.js` - Works as-is (relative imports)
- ✅ `src/` - All frontend code unchanged
- ✅ `server/config/`, `routes/`, `controllers/`, etc. - All unchanged

### 3. **Key Changes Explained**

#### Package.json Integration
**Before:** Two separate package.json files
- Backend: Backend dependencies only
- Frontend: React dependencies only

**After:** Single package.json
- Combines all dependencies (React + Express + MongoDB + etc.)
- Single `npm install` command installs everything
- Vercel automatically handles both

```json
{
  "scripts": {
    "dev": "vite",                          // Frontend dev
    "build": "vite build",                  // Frontend build
    "server": "node server/server.js",      // Backend start
    "server:dev": "nodemon server/server.js" // Backend dev
  }
}
```

#### Vercel Configuration
The `vercel.json` routes all requests:
- `/api/*` → `server/server.js` (backend Express routes)
- `/uploads/*` → `server/server.js` (static files)
- `/socket.io/*` → `server/server.js` (WebSocket)
- All other → `dist/index.html` (React SPA)

### 4. **Environment Variables Setup**

#### Required Variables
```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret_key

# Email
EMAIL_USER=your@email.com
EMAIL_PASSWORD=app_password

# Server
PORT=5000
NODE_ENV=production

# Frontend
FRONTEND_URL=https://your-domain.vercel.app
CORS_ORIGINS=https://your-domain.vercel.app
```

#### How to Set in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.example`
5. Redeploy project

### 5. **Local Development**

#### Setup
```bash
cd Frontend/Hospital_Tracker
npm install
```

#### Development (Two terminals)
```bash
# Terminal 1: Frontend
npm run dev
# Runs on http://localhost:5173

# Terminal 2: Backend  
npm run server:dev
# Runs on http://localhost:5000
```

The frontend proxies API calls to the backend via Vite's dev server proxy configuration.

### 6. **Deployment to Vercel**

#### Step 1: Push to GitHub
```bash
git add .
git commit -m "Migrate backend to frontend for Vercel deployment"
git push origin main
```

#### Step 2: Deploy
Option A - Via Vercel CLI:
```bash
npm i -g vercel
vercel
```

Option B - Via GitHub:
1. Create GitHub repo
2. Connect to Vercel dashboard
3. Auto-deploys on every push

#### Step 3: Configure Environment Variables
- Set all variables in Vercel dashboard
- Redeploy project

### 7. **How API Calls Work**

#### Development
```javascript
// Frontend code
const response = await axios.get('/api/appointment/list');

// Vite proxy intercepts and forwards to:
// http://localhost:5000/api/appointment/list
```

#### Production (Vercel)
```javascript
// Frontend code (same)
const response = await axios.get('/api/appointment/list');

// Vercel routes to:
// /api → server/server.js
// Which handles /api/appointment/list
```

### 8. **Socket.IO Connection**

The frontend automatically detects environment:

```javascript
// SocketContext.jsx
const socketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.DEV ? undefined : import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/i, "") || undefined);

const socket = io(socketUrl, { withCredentials: true });
```

- **Dev mode**: Uses Vite proxy (no explicit URL needed)
- **Production**: Uses environment variable or same origin

### 9. **Important Considerations**

#### File Uploads
- ⚠️ Vercel has `/tmp` for temporary files only
- ✅ For persistent storage, use AWS S3 or Vercel Blob Storage
- Update `UPLOAD_DIR` in environment or use cloud storage

#### Session/Cache
- ⚠️ Don't use filesystem for sessions in serverless
- ✅ Use MongoDB or Redis for session storage
- Configure `store` option in Express session middleware

#### Database Constraints
- Ensure MongoDB Atlas allows Vercel IPs
- Or whitelist `0.0.0.0/0` (less secure)

#### Build Size
- Vite handles tree-shaking well
- Backend code won't be bundled into frontend
- Serverless functions keep code separate

### 10. **Verification Checklist**

Before deploying:

- [ ] All dependencies installed: `npm install`
- [ ] Frontend builds: `npm run build`
- [ ] Backend starts locally: `npm run server:dev`
- [ ] API calls work: `npm run dev` + `npm run server:dev`
- [ ] Environment variables configured locally in `.env`
- [ ] MongoDB connection works
- [ ] Email service configured
- [ ] No uncommitted changes with sensitive data

Before production:

- [ ] Environment variables set in Vercel dashboard
- [ ] MongoDB whitelist includes Vercel IPs
- [ ] CORS_ORIGINS includes production domain
- [ ] JWT_SECRET is production value (not default)
- [ ] Email credentials are correct
- [ ] Redis configured (if using Socket.IO adapter)
- [ ] Domain DNS points to Vercel
- [ ] SSL certificate auto-configured by Vercel

### 11. **Rollback Instructions**

If you need to revert to separate Backend/Frontend:

```bash
# Keep using the current setup but separate deployment:
# - Deploy Frontend to Vercel
# - Deploy Backend to Heroku/Railway/own server
# - Update API_URL in frontend .env

# Or restore original structure:
rm -rf Frontend/Hospital_Tracker/server
# Use original Backend/ folder with separate deployment
```

### 12. **Troubleshooting**

#### "Cannot find module" error
```bash
# Solution
npm install
npm run build
```

#### API returns 404
- Check vercel.json routes
- Verify server/server.js imports are correct
- Check endpoint paths in routes

#### Database connection fails
- Verify MONGODB_URI is correct
- Check MongoDB Atlas whitelist
- Ensure .env file is loaded (or set in Vercel dashboard)

#### Socket.IO not connecting
- Check WebSocket support in Vercel config
- Verify CORS origins
- Check browser console for errors

#### Slow deployment
- First deploy is slower (cold start)
- Subsequent deploys are faster
- Consider splitting into multiple serverless functions

### 13. **Next Steps**

1. ✅ Review this migration summary
2. ✅ Set up local `.env` file
3. ✅ Test locally with `npm run dev` + `npm run server:dev`
4. ✅ Push to GitHub
5. ✅ Deploy to Vercel
6. ✅ Configure Vercel environment variables
7. ✅ Monitor deployment logs
8. ✅ Test production endpoints

---

**Last Updated:** 2026-06-19
**Project:** Hospital Management System
**Target Platform:** Vercel
