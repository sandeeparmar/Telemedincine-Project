import mongoose from "mongoose";

const appointmentReminderSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment",
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true
  },
  reminderType: {
    type: String,
    enum: ["15_MINS", "30_MINS", "1_HOUR"],
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  sentAt: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["PENDING", "SENT", "FAILED"],
    default: "PENDING"
  },
  notificationChannels: {
    email: {
      type: Boolean,
      default: true
    },
    socket: {
      type: Boolean,
      default: true
    }
  },
  errorMessage: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const AppointmentReminder = mongoose.model("AppointmentReminder", appointmentReminderSchema);
