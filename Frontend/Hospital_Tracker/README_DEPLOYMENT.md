# Hospital Management System

A comprehensive hospital management and patient care system with real-time chat, video calls, appointment scheduling, and intelligent disease management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (cloud) or local MongoDB
- npm or yarn

### Installation

```bash
cd Frontend/Hospital_Tracker
npm install
```

### Local Development

**Terminal 1 - Frontend (Vite dev server)**
```bash
npm run dev
```
Runs on `http://localhost:5173`

**Terminal 2 - Backend (Express server)**
```bash
npm run server:dev
```
Runs on `http://localhost:5000`

### Configuration

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hospitaldb
JWT_SECRET=your_secret_key
EMAIL_USER=your@email.com
EMAIL_PASSWORD=your_app_password
# ... other variables
```

3. Start development servers (see above)

## 📁 Project Structure

```
Frontend/Hospital_Tracker/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── context/          # React Context (Auth, Socket, Toast)
│   ├── api/              # API client
│   ├── App.jsx           # Main App component
│   └── main.jsx          # Entry point
├── server/
│   ├── config/           # Database & Redis config
│   ├── controllers/       # Route handlers
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── middleware/       # Auth & upload middleware
│   ├── server.js         # Express app
│   └── package.json      # (Legacy, use root package.json)
├── api/
│   └── index.js          # Vercel serverless handler
├── public/               # Static assets
├── dist/                 # Build output (auto-generated)
├── package.json          # Dependencies (frontend + backend)
├── vite.config.js        # Vite configuration
├── vercel.json           # Vercel deployment config
├── .env.example          # Environment template
├── .gitignore            # Git ignore rules
├── DEPLOYMENT_GUIDE.md   # Vercel deployment guide
└── MIGRATION_SUMMARY.md  # Backend migration details
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Appointments
- `GET /api/appointment/list` - List appointments
- `POST /api/appointment/create` - Create appointment
- `PUT /api/appointment/:id` - Update appointment
- `DELETE /api/appointment/:id` - Cancel appointment

### Chat
- `POST /api/chat/message` - Send message
- `GET /api/chat/history/:roomId` - Get chat history
- `POST /api/chat/createRoom` - Create chat room

### Doctors
- `GET /api/doctor/list` - List doctors
- `GET /api/doctor/:id` - Get doctor details
- `POST /api/doctor/create` - Create doctor

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/list` - List users

### Notifications
- `POST /api/notification/send` - Send notification
- `GET /api/notification/list` - Get notifications

### IDM (Integrated Disease Management)
- `POST /api/idm/create` - Create health record
- `GET /api/idm/list` - Get health records

### Reminders
- `POST /api/reminder/create` - Create reminder
- `GET /api/reminder/list` - Get reminders

## 🔧 Build & Deploy

### Build for Production
```bash
npm run build
```
Creates optimized build in `dist/` folder.

### Deploy to Vercel

**Option 1: Using Vercel CLI**
```bash
npm i -g vercel
vercel
```

**Option 2: Via GitHub (Recommended)**
1. Push code to GitHub
2. Connect repository to Vercel dashboard
3. Auto-deploys on every push

### Environment Variables in Vercel

Set these in Vercel dashboard → Settings → Environment Variables:

```
MONGODB_URI
JWT_SECRET
EMAIL_USER
EMAIL_PASSWORD
OPENAI_API_KEY
REDIS_URL
FRONTEND_URL
CORS_ORIGINS
NODE_ENV=production
PORT=5000
```

## 🏗️ Architecture

### Frontend (React + Vite)
- Component-based UI
- Real-time updates via Socket.IO
- Context API for state management
- Axios for HTTP requests
- i18n for internationalization

### Backend (Node.js + Express)
- RESTful API
- MongoDB for database
- Socket.IO for real-time features
- JWT authentication
- Nodemailer for emails
- OpenAI integration

### Deployment (Vercel)
- Frontend: Static hosting + React SPA
- Backend: Serverless functions
- Database: MongoDB Atlas (cloud)
- Cache: Redis Cloud (optional)

## 📝 Features

- **User Management**: Registration, authentication, profiles
- **Appointments**: Booking, scheduling, reminders
- **Chat**: Real-time messaging, chat rooms
- **Video Calls**: Peer-to-peer video conferencing
- **Notifications**: Email and in-app notifications
- **IDM**: Integrated disease management tracking
- **Multi-language**: i18n support
- **Doctor Dashboard**: Appointment management
- **Patient Dashboard**: Health tracking

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Environment variables for secrets
- Secure cookie handling
- Input validation

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## 📞 Support

For issues and questions:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help
2. Check [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) for architecture details
3. Run `node verify-setup.js` to diagnose issues

## 📄 License

ISC

## 👨‍💻 Author

Sandeep Parmar

---

**Last Updated**: 2026-06-19
**Project Status**: Ready for Vercel Deployment ✅
