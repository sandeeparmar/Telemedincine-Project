# Hospital Management System - Vercel Deployment Guide

## Project Structure

This is now a monorepo structure with both frontend and backend in a single project:

```
Frontend/Hospital_Tracker/
├── src/                 # React frontend code
├── server/              # Backend Express server (moved from Backend folder)
├── api/                 # Vercel serverless functions
├── public/              # Static assets
├── dist/                # Build output
├── package.json         # Root package.json with both frontend & backend dependencies
├── vite.config.js       # Vite configuration
├── vercel.json          # Vercel configuration
├── .env.example         # Environment variables template
└── ...
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd Frontend/Hospital_Tracker
npm install
```

This installs both frontend (React) and backend (Express, MongoDB, etc.) dependencies.

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

**Critical environment variables:**
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `EMAIL_USER` & `EMAIL_PASSWORD` - For Nodemailer
- `OPENAI_API_KEY` - OpenAI integration
- `REDIS_URL` - Redis for Socket.IO (optional)
- `FRONTEND_URL` - Your Vercel deployment URL

### 3. Local Development

**Terminal 1 - Frontend (Vite dev server):**
```bash
npm run dev
```

**Terminal 2 - Backend (Express server):**
```bash
npm run server:dev
```

This runs:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:5000` (configured in Vite proxy)

### 4. Build for Production

```bash
npm run build
```

This generates:
- `/dist` - Frontend build (React)
- Backend is ready via `/api` routes

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Follow the prompts and configure:
1. **Project name**: hospital-tracker
2. **Framework**: Vite
3. **Root directory**: Frontend/Hospital_Tracker
4. **Build command**: `npm run build`
5. **Output directory**: `dist`
6. **Install command**: `npm install`

**Set environment variables in Vercel dashboard:**
- Go to Settings > Environment Variables
- Add all variables from `.env.example`

## Important Changes

### What Was Changed

1. **Backend moved to Frontend folder** - `/server` directory
2. **Combined package.json** - Single `package.json` with all dependencies
3. **Vercel configuration** - `vercel.json` with serverless routing
4. **API handler** - `/api/index.js` for Vercel functions
5. **Environment setup** - `.env.example` with all required variables

### API Endpoints

All API endpoints work the same:

```javascript
// Frontend code (same as before)
const response = await axios.get('/api/appointment/list');
const response = await axios.post('/api/auth/login', data);
```

### Socket.IO Connection

In development (local):
```javascript
const socket = io('http://localhost:5000');
```

In production (Vercel):
```javascript
const socket = io(window.location.origin);
```

The `SocketContext.jsx` should handle this automatically.

## Database & Redis Setup

### MongoDB
- Ensure your MongoDB Atlas cluster is set up
- Update `MONGODB_URI` with your connection string
- Allow Vercel IP in MongoDB Atlas IP Whitelist

### Redis (Optional)
- If using Socket.IO Redis adapter, set `REDIS_URL`
- For Vercel, use a cloud Redis provider (Redis Cloud, Upstash)

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` again and check node_modules

### Issue: API calls failing in production
**Solution**: 
- Check environment variables in Vercel dashboard
- Verify CORS_ORIGINS includes your Vercel URL
- Check API logs: `vercel logs --follow`

### Issue: MongoDB connection timeout
**Solution**:
- Add Vercel IPs to MongoDB Atlas whitelist
- Or use: `0.0.0.0/0` (less secure, for development only)

### Issue: Socket.IO not connecting
**Solution**:
- Ensure Socket.IO transports are configured for Vercel
- May need WebSocket support configuration

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] MongoDB Atlas whitelist includes Vercel IPs
- [ ] Email service credentials verified
- [ ] CORS_ORIGINS updated with production URL
- [ ] JWT_SECRET changed from default
- [ ] Redis connection tested (if using)
- [ ] Frontend URL in CORS matches production domain
- [ ] SSL certificate verified
- [ ] Database backups configured

## Reverting to Original Structure

If you need to revert:

```bash
# Remove server folder
rm -rf Frontend/Hospital_Tracker/server

# Restore original Backend folder
# (keep the original Backend folder in root)
```

## Support

For issues, check:
1. `.env` variables are correct
2. npm install completed successfully
3. Vercel deployment logs
4. MongoDB connection status
5. Redis connection (if applicable)

## Important Notes

⚠️ **Do not commit `.env` files to git**
- Only commit `.env.example`
- Set actual values in Vercel dashboard

⚠️ **File uploads**
- Vercel has `/tmp` for temporary files
- For persistent storage, use:
  - AWS S3
  - Vercel Blob Storage
  - MongoDB GridFS

⚠️ **Session storage**
- Use MongoDB or Redis for session storage
- Not recommended to use filesystem in serverless
