import mongoose from "mongoose";

const conversationSummarySchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointment"
  },
  summary: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String
  },
  treatment: {
    type: String
  },
  notes: {
    type: String
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ["COMPLETED", "PENDING", "CANCELLED"],
    default: "COMPLETED"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const ConversationSummary = mongoose.model("ConversationSummary", conversationSummarySchema);
