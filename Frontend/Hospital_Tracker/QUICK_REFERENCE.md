# ⚡ Quick Reference Card

## 🚀 Commands Cheat Sheet

### Setup
```bash
cd Frontend/Hospital_Tracker
npm install                          # Install all dependencies
cp .env.example .env.local          # Create environment file
```

### Local Development
```bash
npm run dev                          # Frontend (Terminal 1) → http://localhost:5173
npm run server:dev                  # Backend (Terminal 2) → http://localhost:5000
```

### Testing
```bash
npm run build                        # Build for production
node verify-setup.js                # Verify configuration
```

### Deployment
```bash
npm i -g vercel                     # Install Vercel CLI (one-time)
vercel                              # Deploy to Vercel
vercel logs --follow                # Watch production logs
```

---

## 📂 Important Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies & scripts |
| `.env.example` | Environment template |
| `.env.local` | Your local configuration |
| `vercel.json` | Deployment config |
| `vite.config.js` | Frontend build config |
| `server/server.js` | Express app |
| `api/index.js` | Vercel handler |

---

## 🔑 Environment Variables

### Minimum Required
```
MONGODB_URI
JWT_SECRET
EMAIL_USER
EMAIL_PASSWORD
```

### Recommended
```
OPENAI_API_KEY
REDIS_URL
FRONTEND_URL
CORS_ORIGINS
NODE_ENV=production
PORT=5000
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend Dev | http://localhost:5173 |
| Backend Dev | http://localhost:5000 |
| API Prefix | /api |
| Health Check | /api/health |
| Uploads | /uploads |
| Production | https://your-domain.vercel.app |

---

## 🔗 API Endpoints

```
POST   /api/auth/login              Login
POST   /api/auth/register           Register
GET    /api/user/profile            Get profile
GET    /api/appointment/list        List appointments
POST   /api/appointment/create      Create appointment
POST   /api/chat/message            Send message
GET    /api/doctor/list             List doctors
```

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| Module not found | `npm install` |
| API 404 | Check server/routes/ |
| DB connection fails | Check MONGODB_URI |
| Socket.IO fails | Check CORS_ORIGINS |
| Build fails | `npm run build` locally first |

---

## ✅ Deployment Checklist

- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `npm run dev` works locally
- [ ] `npm run server:dev` works locally
- [ ] `.env.local` has all variables
- [ ] Database connection works
- [ ] Email service works
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Environment variables set in Vercel
- [ ] Project deployed successfully
- [ ] Production endpoints tested

---

## 📞 Quick Help

- **Deployment Issues** → `DEPLOYMENT_GUIDE.md`
- **Architecture** → `MIGRATION_SUMMARY.md`
- **Overview** → `README_DEPLOYMENT.md`
- **Full Checklist** → `DEPLOYMENT_CHECKLIST.md`
- **Verify Setup** → `node verify-setup.js`

---

## 🎯 Deployment in 5 Minutes

```bash
# 1. Setup
npm install
cp .env.example .env.local
# Edit .env.local with your values

# 2. Test
npm run dev &
npm run server:dev
# Visit http://localhost:5173

# 3. Push
git push origin main

# 4. Deploy
vercel

# 5. Configure
# Set environment variables in Vercel Dashboard
# Redeploy
```

---

## 💾 Save This Card!

Print or bookmark this file for quick reference during:
- Local development
- Troubleshooting
- Deployment
- Production monitoring

---

**Last Updated**: 2026-06-19
