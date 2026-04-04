import { AppointmentReminder } from "../models/AppointmentReminder.js";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import { sendEmail } from "./emailService.js";

/**
 * Create reminders for a confirmed appointment
 * Creates reminders for 1 hour, 30 minutes, and 15 minutes before appointment
 */
export const createAppointmentReminders = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email"
        }
      });

    if (!appointment) {
      console.error(`Appointment ${appointmentId} not found`);
      return null;
    }

    // Parse appointment date and time
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.timeSlot}`);

    if (isNaN(appointmentDateTime.getTime())) {
      console.error(`Invalid appointment date/time: ${appointment.date} ${appointment.timeSlot}`);
      return null;
    }

    const patient = appointment.patientId;
    const doctor = appointment.doctorId;

    // Check patient notification preferences
    let patientPreferences = {
      emailNotifications: true,
      socketNotifications: true,
      reminderTiming: ["15_MINS", "30_MINS", "1_HOUR"]
    };

    if (patient && patient.notificationPreferences) {
      patientPreferences = patient.notificationPreferences;
    }

    // Only create reminders for enabled timing preferences
    const reminderTimings = [
      { type: "1_HOUR", minutes: 60 },
      { type: "30_MINS", minutes: 30 },
      { type: "15_MINS", minutes: 15 }
    ];

    const reminders = [];

    for (const timing of reminderTimings) {
      // Skip if this timing is not in user preferences
      if (!patientPreferences.reminderTiming.includes(timing.type)) {
        continue;
      }

      const scheduledTime = new Date(appointmentDateTime.getTime() - timing.minutes * 60000);

      // Only create reminders for future times
      if (scheduledTime > new Date()) {
        const reminder = await AppointmentReminder.create({
          appointmentId: appointment._id,
          patientId: patient._id,
          doctorId: doctor._id,
          reminderType: timing.type,
          scheduledTime,
          notificationChannels: {
            email: patientPreferences.emailNotifications,
            socket: patientPreferences.socketNotifications
          }
        });

        reminders.push(reminder);
      }
    }

    // Mark reminders as created in appointment
    await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        remindersCreated: true,
        reminders: reminders.map(r => r._id)
      }
    );

    console.log(`Created ${reminders.length} reminders for appointment ${appointmentId}`);
    return reminders;

  } catch (error) {
    console.error("Error creating appointment reminders:", error);
    return null;
  }
};

/**
 * Send pending reminders for appointments
 * Called by scheduler to check for and send reminders
 */
export const sendPendingReminders = async (io) => {
  try {
    const now = new Date();
    
    // Find all pending reminders that are due (scheduledTime <= now)
    const pendingReminders = await AppointmentReminder.find({
      status: "PENDING",
      scheduledTime: { $lte: now }
    })
      .populate("appointmentId")
      .populate("patientId")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email"
        }
      });

    console.log(`Found ${pendingReminders.length} pending reminders to send`);

    for (const reminder of pendingReminders) {
      try {
        const appointment = reminder.appointmentId;
        const patient = reminder.patientId;
        const doctor = reminder.doctorId;

        // Skip if appointment is not in BOOKED or IN_PROGRESS status
        if (!["BOOKED", "IN_PROGRESS"].includes(appointment.status)) {
          reminder.status = "FAILED";
          reminder.errorMessage = "Appointment status is not BOOKED or IN_PROGRESS";
          await reminder.save();
          continue;
        }

        let emailSent = false;
        let socketSent = false;

        // Send email notification if enabled
        if (reminder.notificationChannels.email && patient && patient.email) {
          try {
            const timeBeforeAppointment = reminder.reminderType.replace("_", " ");
            const subject = `Appointment Reminder: ${timeBeforeAppointment} before your appointment`;
            const html = `
              <h2>Appointment Reminder</h2>
              <p>Hello ${patient.name},</p>
              <p>This is a reminder that you have an appointment in <strong>${timeBeforeAppointment}</strong>.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Appointment Details:</strong></p>
                <p>📅 Date: ${appointment.date}</p>
                <p>🕐 Time: ${appointment.timeSlot}</p>
                <p>👨‍⚕️ Doctor: Dr. ${doctor && doctor.userId ? doctor.userId.name : 'N/A'}</p>
                <p>📝 Reason: ${appointment.reason}</p>
              </div>
              <p>Please arrive a few minutes early.</p>
              <p>Best regards,<br/>MediConnect Team</p>
            `;
            
            await sendEmail(patient.email, subject, null, html);
            emailSent = true;
          } catch (emailError) {
            console.error(`Failed to send email reminder for ${reminder._id}:`, emailError.message);
          }
        }

        // Send socket.io notification if enabled
        if (reminder.notificationChannels.socket && io) {
          try {
            const notificationMessage = {
              type: "APPOINTMENT_REMINDER",
              appointmentId: appointment._id,
              reminderType: reminder.reminderType,
              date: appointment.date,
              timeSlot: appointment.timeSlot,
              doctor: doctor && doctor.userId ? doctor.userId.name : 'N/A',
              message: `You have an appointment in ${reminder.reminderType.replace("_", " ")}`
            };

            // Send to patient
            if (patient && patient._id) {
              io.to(String(patient._id)).emit("appointmentReminder", notificationMessage);
            }

            // Send to doctor
            if (doctor && doctor.userId && doctor.userId._id) {
              const doctorNotification = {
                ...notificationMessage,
                patientName: patient.name,
                message: `Reminder: Appointment with ${patient.name} in ${reminder.reminderType.replace("_", " ")}`
              };
              io.to(String(doctor.userId._id)).emit("appointmentReminder", doctorNotification);
            }

            socketSent = true;
          } catch (socketError) {
            console.error(`Failed to send socket reminder for ${reminder._id}:`, socketError.message);
          }
        }

        // Update reminder status
        if (emailSent || socketSent) {
          reminder.status = "SENT";
          reminder.sentAt = new Date();
        } else {
          reminder.status = "FAILED";
          reminder.errorMessage = "No notification channel sent successfully";
        }

        await reminder.save();
        console.log(`Reminder ${reminder._id} status updated to ${reminder.status}`);

      } catch (reminderError) {
        console.error(`Error processing reminder ${reminder._id}:`, reminderError);
        reminder.status = "FAILED";
        reminder.errorMessage = reminderError.message;
        await reminder.save();
      }
    }

    return pendingReminders.length;

  } catch (error) {
    console.error("Error sending pending reminders:", error);
    return 0;
  }
};

/**
 * Cleanup reminders for cancelled/completed appointments
 */
export const cleanupAppointmentReminders = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return;
    }

    // Update all PENDING reminders to FAILED if appointment is cancelled/completed
    if (["CANCELLED", "REJECTED", "COMPLETED"].includes(appointment.status)) {
      const deleted = await AppointmentReminder.updateMany(
        {
          appointmentId: appointmentId,
          status: "PENDING"
        },
        {
          status: "FAILED",
          errorMessage: `Appointment ${appointment.status}`
        }
      );

      console.log(`Cleaned up ${deleted.modifiedCount} reminders for appointment ${appointmentId}`);
    }
  } catch (error) {
    console.error("Error cleaning up reminders:", error);
  }
};

/**
 * Get reminder statistics
 */
export const getReminderStats = async (filters = {}) => {
  try {
    const stats = await AppointmentReminder.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    return stats;
  } catch (error) {
    console.error("Error fetching reminder stats:", error);
    return [];
  }
};
