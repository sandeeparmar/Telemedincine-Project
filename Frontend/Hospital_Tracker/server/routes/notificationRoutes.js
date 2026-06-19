import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", verifyToken, getMyNotifications);
router.patch("/:id/read", verifyToken, markNotificationRead);
router.patch("/read-all", verifyToken, markAllNotificationsRead);

export default router;
