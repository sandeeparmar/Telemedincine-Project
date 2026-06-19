import { Appointment } from "../models/Appointment.js";
import { mongoose } from "mongoose";
import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import { calculateWaitingTime } from "../utils/waitingTime.js";
import { idmMetric } from "../models/IDMMetric.js";
import { sendEmail } from "../services/emailService.js";
import { enqueueNotification } from "../services/notificationService.js";

async function queueNotification(payload) {
  try {
    await enqueueNotification(payload);
  } catch (error) {
    console.log(error);
    console.error("Notification enqueue failed:", error.message);
  }
}

export const bookAppointment = async (req, res) => {

  if (req.user.role !== "PATIENT") {
    return res.status(403).json({
      message: "Only patients can book appointments"
    });
  }
  const { doctorId, date, timeSlot, reason } = req.body; 

  if (!doctorId || !date || !timeSlot || !reason) {
    return res.status(400).json({
      message: "doctorId, date, timeSlot and reason are required"
    });
  }

  const selectedDateTime = new Date(`${date}T${timeSlot}`);

  if (Number.isNaN(selectedDateTime.getTime())) {
    return res.status(400).json({
      message: "Invalid date or time format"
    });
  }

  const now = new Date();
  if (selectedDateTime < now) {
    return res.status(400).json({
      message: "Selected appointment time is in the past"
    });
  }

  const hour = selectedDateTime.getHours();
  if (hour < 6 || hour > 22) {
    return res.status(400).json({
      message: "Appointment time must be between 6:00 AM and 10:00 PM"
    });
  }

  const existingAppointment = await Appointment.findOne({
    patientId: req.user.id,
    date,
    status: { $in: ["BOOKED", "IN_PROGRESS", "PENDING"] }
  });

  if (existingAppointment) {
    return res.status(400).json({
      message: "You already have an appointment on this date. Please choose another date."
    });
  }

  const count = await Appointment.countDocuments({
    doctorId,
    date,
    timeSlot
  });


  const appointment = await Appointment.create({
    patientId: req.user.id,
    doctorId,
    date,
    timeSlot,
    reason, // Save reason
    queueNumber: count + 1
  });

  let doctorUserId = null;
  // Send email to Doctor
  try {
    const doctor = await Doctor.findById(doctorId).populate("userId");
    if (doctor && doctor.userId && doctor.userId.email) {
      doctorUserId = doctor.userId._id;
      const subject = "New Appointment Request";
      const text = `Hello Dr. ${doctor.userId.name},\n\nYou have a new appointment request from a patient.\n\nDate: ${date}\nTime Slot: ${timeSlot}\nReason: ${reason}\n\nPlease check your dashboard to confirm.`;
      await sendEmail(doctor.userId.email, subject, text);
    }
  } catch (emailErr) {
    console.error("Failed to send booking email:", emailErr);
  }

  if (!doctorUserId) {
    const doctor = await Doctor.findById(doctorId).select("userId");
    doctorUserId = doctor?.userId;
  }

  if (doctorUserId) {
    await queueNotification({
      userId: doctorUserId,
      type: "APPOINTMENT_REQUESTED",
      title: "New appointment request",
      message: `A patient requested an appointment on ${date} at ${timeSlot}.`,
      data: {
        appointmentId: appointment._id,
        doctorId,
        date,
        timeSlot,
      },
      channels: { socket: true, email: false },
    });
  }

  res.status(201).json(appointment);
};

export const getDoctorAppointments = async (req, res) => {

  if (req.user.role !== "DOCTOR") {
    return res.status(403).json({ message: "Access Denied" });
  }

  const doctorProfile = await Doctor.findOne({ userId: req.user.id });

  if (!doctorProfile) {
    return res.status(404).json({ message: "Doctor Not Found" });
  }

  const appointments = await Appointment.find({
    doctorId: doctorProfile._id,
    status: { $in: ["PENDING", "BOOKED", "IN_PROGRESS"] }
  })
    .sort("queueNumber")
    .populate("patientId", "name email phone preferredLanguage"); // Populate patient details

  const withWaitingTime = appointments.map(a => ({
    ...a._doc,
    waitingTime: calculateWaitingTime(
      a.queueNumber,
      doctorProfile.consultationTime
    )
  }));
  res.json(withWaitingTime);
};

export const getPatientAppointments = async (req, res) => {
  if (req.user.role !== "PATIENT") {
    return res.status(403).json({ message: "Access Denied" });
  }

  try {
    const appointments = await Appointment.find({
      patientId: req.user.id
    })
      .sort({ date: 1, timeSlot: 1 })
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email phone"
        }
      });

    res.json(appointments);
  } catch (err) {
    console.error("Error fetching patient appointments:", err);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
};

export const updateStatus = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction(); 
  try {
    let { status } = req.body;
    status = status.toUpperCase();

    if (req.user.role !== "DOCTOR") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json("your role is " + req.user.role);
    }

    const appointment = await Appointment.findById(req.params.id).session(session);

    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    if (appointment.status === "COMPLETED") {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "This appointment is already completed and locked"
      });
    }

    const oldQueueNumber = appointment.queueNumber;
    const oldStatus = appointment.status; // old status before update
    appointment.status = status; // update the status 
    await appointment.save({ session }); // save inside the db 


    if (status === "COMPLETED" || (status === "CANCELLED" && ["BOOKED", "IN_PROGRESS", "PENDING"].includes(oldStatus))) {
      await Appointment.updateMany(
        {
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status: { $in: ["BOOKED", "IN_PROGRESS"] },
          queueNumber: { $gt: oldQueueNumber }
        }, {
        $inc: { queueNumber: -1 }
      },
        { session }
      );

      if (status === "COMPLETED") {
        await idmMetric.create([{
          metricName: "ConsultationCompleted",
          category: "PROCESS",
          value: 1,
          context: {
            doctorId: appointment.doctorId, // Corrected from Appointment.doctorId
            patientId: appointment.patientId // Corrected from Appointment.patientId
          }
        }], { session });
      }

    }

    await session.commitTransaction();
    session.endSession();

    const doctorProfile = await Doctor.findById(appointment.doctorId).select("userId").lean();
    if (doctorProfile?.userId) {
      await queueNotification({
        userId: doctorProfile.userId,
        type: "QUEUE_UPDATED",
        title: "Queue updated",
        message: `Appointment queue changed for ${appointment.date} at ${appointment.timeSlot}.`,
        data: {
          appointmentId: appointment._id,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status,
        },
        channels: { socket: true, email: false },
      });
    }

    // Send Email if Cancelled
    if (status === "CANCELLED") {
      try {
        await appointment.populate("patientId");
        if (appointment.patientId && appointment.patientId.email) {
          const subject = "Appointment Update: Denied/Cancelled";
          const text = `Hello ${appointment.patientId.name},\n\nYour appointment on ${appointment.date} at ${appointment.timeSlot} has been denied or cancelled by the doctor.\n\nPlease check your dashboard for more details or to book another slot.`;
          await sendEmail(appointment.patientId.email, subject, text);
        }
      } catch (emailErr) {
        console.error("Failed to send cancellation email:", emailErr);
      }

    }

    res.json({
      message: "Status updated successfully",
      appointment
    })
  }
  catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error in updateStatus:", err.message);
    console.error("Stack:", err.stack);
    res.status(400).json({
      message: err.message
    });
  }
};

export const confirmAppointment = async (req, res) => {

  if (req.user.role !== "DOCTOR") {
    return res.status(401).json({ message: "you have no access to this task" });
  }

  const appointment = await Appointment.findById(req.params.id);


  if (!appointment || (appointment.status === "COMPLETED") || (appointment.status === "BOOKED")) {
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    else if (appointment.status === "COMPLETED") {
      return res.status(400).json({ message: "This Appointment is already completed" });
    }
    else {
      return res.status(400).json({
        message: "This appointment is already confirmed"
      });
    }
  }

  const count = await Appointment.countDocuments({
    doctorId: appointment.doctorId,
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    status: { $in: ["BOOKED", "IN_PROGRESS"] }
  });

  appointment.status = "BOOKED";
  appointment.queueNumber = count + 1;

  await appointment.save();

  // Send Email to Patient
  try {
    await appointment.populate("patientId");
    if (appointment.patientId && appointment.patientId.email) {
      const subject = "Appointment Confirmed";
      const text = `Hello ${appointment.patientId.name},\n\nYour appointment has been confirmed!\n\nDate: ${appointment.date}\nTime Slot: ${appointment.timeSlot}\n\nPlease arrive 10 minutes eary.`;
      await sendEmail(appointment.patientId.email, subject, text);
    }
  } catch (emailErr) {
    console.error("Failed to send confirmation email:", emailErr);
  }

  // Queue production notification to patient (socket + optional email channel)
  try {
    if (appointment.patientId && appointment.patientId._id) {
      await queueNotification({
        userId: appointment.patientId._id,
        type: "APPOINTMENT_CONFIRMED",
        title: "Appointment confirmed",
        message: `Your appointment on ${appointment.date} at ${appointment.timeSlot} has been confirmed.`,
        data: {
          appointmentId: appointment._id,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        },
        channels: { socket: true, email: true },
      });
    }
  } catch (notificationErr) {
    console.error("Failed to queue confirmation notification:", notificationErr);
  }

  res.json({
    message: "Appointment confirmed",
    appointment
  });
};

export const denyAppointment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (req.user.role !== "PATIENT") {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "Only patients can deny appointments" });
    }

    const appointment = await Appointment.findById(req.params.id).session(session);

    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify that the patient owns this appointment
    if (appointment.patientId.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: "You can only deny your own appointments" });
    }

    // Check if appointment can be denied
    if (["COMPLETED", "REJECTED"].includes(appointment.status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "This appointment cannot be denied" });
    }

    const oldQueueNumber = appointment.queueNumber;
    const oldStatus = appointment.status;
    appointment.status = "REJECTED";
    await appointment.save({ session });

    // Update queue numbers for other appointments
    if (["BOOKED", "IN_PROGRESS", "PENDING"].includes(oldStatus)) {
      await Appointment.updateMany(
        {
          doctorId: appointment.doctorId,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          status: { $in: ["BOOKED", "IN_PROGRESS"] },
          queueNumber: { $gt: oldQueueNumber }
        },
        { $inc: { queueNumber: -1 } },
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    const doctor = await Doctor.findById(appointment.doctorId).select("userId").lean();
    if (doctor?.userId) {
      await queueNotification({
        userId: doctor.userId,
        type: "APPOINTMENT_CANCELLED_BY_PATIENT",
        title: "Appointment cancelled",
        message: `A patient cancelled the appointment for ${appointment.date} at ${appointment.timeSlot}.`,
        data: {
          appointmentId: appointment._id,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
        },
        channels: { socket: true, email: false },
      });
    }

    // Send Email to Doctor
    try {
      const doctorForEmail = await Doctor.findById(appointment.doctorId).populate("userId");
      if (doctorForEmail && doctorForEmail.userId && doctorForEmail.userId.email) {
        const subject = "Appointment Denied by Patient";
        const text = `Hello Dr. ${doctorForEmail.userId.name},\n\nThe patient has denied their appointment scheduled for ${appointment.date} at ${appointment.timeSlot}.\n\nPlease check your dashboard to see updated queue.`;
        await sendEmail(doctorForEmail.userId.email, subject, text);
      }
    } catch (emailErr) {
      console.error("Failed to send denial email to doctor:", emailErr);
    }

    res.json({
      message: "Appointment denied successfully",
      appointment
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in denyAppointment:", err.message);
    res.status(400).json({ message: err.message });
  }
};
