import { AppointmentReminder } from "../models/AppointmentReminder.js";
import { Appointment } from "../models/Appointment.js";
import { User } from "../models/User.js";
import { getReminderSchedulerStatus } from "../services/schedulerService.js";
import { getReminderStats } from "../services/reminderService.js";

/**
 * Get all reminders for an appointment
 */
export const getAppointmentReminders = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Verify appointment belongs to user (patient or doctor)
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check authorization
    const isDoctorOfAppointment = req.user.role === "DOCTOR" && 
      (await Appointment.exists({ _id: appointmentId, doctorId: req.user.doctorId }));
    
    const isPatientOfAppointment = req.user.role === "PATIENT" && 
      String(appointment.patientId) === String(req.user.id);

    if (!isDoctorOfAppointment && !isPatientOfAppointment && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const reminders = await AppointmentReminder.find({ appointmentId })
      .sort({ scheduledTime: 1 });

    res.json(reminders);

  } catch (error) {
    console.error("Error fetching appointment reminders:", error);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

/**
 * Get all reminders for a patient
 */
export const getPatientReminders = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Only patients can fetch their reminders" });
    }

    const reminders = await AppointmentReminder.find({ patientId: req.user.id })
      .populate("appointmentId")
      .sort({ scheduledTime: -1 })
      .limit(50);

    res.json(reminders);

  } catch (error) {
    console.error("Error fetching patient reminders:", error);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

/**
 * Get all reminders for a doctor
 */
export const getDoctorReminders = async (req, res) => {
  try {
    if (req.user.role !== "DOCTOR") {
      return res.status(403).json({ message: "Only doctors can fetch their reminders" });
    }

    const reminders = await AppointmentReminder.find({ doctorId: req.user.doctorId })
      .populate("appointmentId")
      .populate("patientId", "name email phone")
      .sort({ scheduledTime: -1 })
      .limit(50);

    res.json(reminders);

  } catch (error) {
    console.error("Error fetching doctor reminders:", error);
    res.status(500).json({ message: "Failed to fetch reminders" });
  }
};

/**
 * Get reminder statistics
 */
export const getReminderStatistics = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can access statistics" });
    }

    const stats = await getReminderStats();
    const schedulerStatus = getReminderSchedulerStatus();

    res.json({
      statsbyStatus: stats,
      schedulerStatus
    });

  } catch (error) {
    console.error("Error fetching reminder statistics:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

/**
 * Update reminder notification preferences
 */
export const updateReminderPreferences = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Only patients can update preferences" });
    }

    const { appointmentReminders, emailNotifications, socketNotifications, reminderTiming } = req.body;

    // Validate reminderTiming
    const validTimings = ["15_MINS", "30_MINS", "1_HOUR"];
    if (reminderTiming && Array.isArray(reminderTiming)) {
      const invalidTimings = reminderTiming.filter(t => !validTimings.includes(t));
      if (invalidTimings.length > 0) {
        return res.status(400).json({ 
          message: `Invalid reminder timings: ${invalidTimings.join(", ")}. Valid options: ${validTimings.join(", ")}` 
        });
      }
    }

    const updatedPreferences = {
      "notificationPreferences.appointmentReminders": appointmentReminders !== undefined ? appointmentReminders : true,
      "notificationPreferences.emailNotifications": emailNotifications !== undefined ? emailNotifications : true,
      "notificationPreferences.socketNotifications": socketNotifications !== undefined ? socketNotifications : true
    };

    if (reminderTiming) {
      updatedPreferences["notificationPreferences.reminderTiming"] = reminderTiming;
    }

    const updateResult = await User.findByIdAndUpdate(
      req.user.id,
      updatedPreferences,
      { new: true }
    ).select("notificationPreferences");

    res.json({
      message: "Preferences updated successfully",
      preferences: updateResult.notificationPreferences
    });

  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Failed to update preferences" });
  }
};

/**
 * Get user notification preferences
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    if (req.user.role !== "PATIENT") {
      return res.status(403).json({ message: "Only patients can fetch preferences" });
    }

    const user = await User.findById(req.user.id).select("notificationPreferences");

    res.json(user.notificationPreferences || {
      appointmentReminders: true,
      emailNotifications: true,
      socketNotifications: true,
      reminderTiming: ["15_MINS", "30_MINS", "1_HOUR"]
    });

  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Failed to fetch preferences" });
  }
};

/**
 * Manually resend a reminder (Admin/Test endpoint)
 */
export const resendReminder = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can resend reminders" });
    }

    const { reminderId } = req.params;
    const reminder = await AppointmentReminder.findById(reminderId);

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    // Reset to pending and scheduled time to now, so it gets sent in next scheduler run
    reminder.status = "PENDING";
    reminder.sentAt = null;
    reminder.scheduledTime = new Date();
    await reminder.save();

    res.json({
      message: "Reminder reset and will be sent in next scheduler cycle",
      reminder
    });

  } catch (error) {
    console.error("Error resending reminder:", error);
    res.status(500).json({ message: "Failed to resend reminder" });
  }
};
