import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getAppointmentReminders,
  getPatientReminders,
  getDoctorReminders,
  getReminderStatistics,
  updateReminderPreferences,
  getNotificationPreferences,
  resendReminder
} from "../controllers/reminderController.js";

const router = express.Router();

// Get reminders for a specific appointment
router.get("/appointment/:appointmentId", verifyToken, getAppointmentReminders);

// Get all reminders for logged-in patient
router.get("/patient", verifyToken, getPatientReminders);

// Get all reminders for logged-in doctor
router.get("/doctor", verifyToken, getDoctorReminders);

// Get reminder statistics (admin only)
router.get("/admin/statistics", verifyToken, getReminderStatistics);

// Get user notification preferences (patient only)
router.get("/preferences", verifyToken, getNotificationPreferences);

// Update user notification preferences (patient only)
router.patch("/preferences", verifyToken, updateReminderPreferences);

// Resend a reminder (admin only)
router.patch("/:reminderId/resend", verifyToken, resendReminder);

export default router;
