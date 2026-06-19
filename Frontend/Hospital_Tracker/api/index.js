import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "../server/config/db.js";
import appointmentRoutes from "../server/routes/appointmentRoutes.js";
import authRoutes from "../server/routes/authRoutes.js";
import userRoutes from "../server/routes/userRoutes.js";
import chatRoutes from "../server/routes/chatRoutes.js";
import doctorRoutes from "../server/routes/doctorRoutes.js";
import idmRoutes from "../server/routes/idmRoutes.js";
import odmRoutes from "../server/routes/odmRoutes.js";
import notificationRoutes from "../server/routes/notificationRoutes.js";

dotenv.config();
connectDB();

const app = express();

const defaultOrigins = [
  "https://mediconnect-eta-coral.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const extraOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = new Set([...defaultOrigins, ...extraOrigins]);

function allowOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;
  return /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:5173$/.test(origin);
}

app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"] === "true") {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (allowOrigin(origin)) callback(null, true);
      else callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/appointment", appointmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/idm", idmRoutes);
app.use("/api/odm", odmRoutes);
app.use("/api/notification", notificationRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

export default app;
