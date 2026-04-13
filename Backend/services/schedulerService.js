import {Queue , worker}  from "bullmq" ;
import redis from "../config/redis" ;
import AppointmentReminder from "../models/AppointmentReminder" ;
import User from "../models/User.js" ;
import { Appointment  } from "../models/Appointment";
import emailService from "./emailService.js" ;
import { ReminderTemplate } from "../models/ReminderTemplate.js";

const reminderQueue = new Queue("reminders" , {connection : redis}) ;

function renderTemplate(body , vars) {
   return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || "");
}

export const initializeReminderScheduler =  function initializeReminderScheduler(){
   const worker = new Worker("reminders" , async (job) => {
      const {reminderId} = job.data ;
      
      const reminder = await  AppointmentReminder.findById(reminderId) ;

      if(!reminder || reminder.status !== "PENDING")  return ;

      const [patient , appt] = await Promise.all([
        User.findById(reminder.patientId),
        Appointment.findById(reminder.appointmentId).populate("doctor", "name"),
      ]);
      
      if(!patient || !appt) {
        reminder.status = "FAILED" ;
        reminder.errorReason = "Patient or Appointment not Found" ;
        await reminder.save() ;
        return ;
      }


      //load template 
      const template = await ReminderTemplate.findById(reminder.templateId) ;


      const vars = {
      patientName: patient.name,
      doctorName:  appt.doctor?.name || "your doctor",
      dateTime:    appt.startTime?.toLocaleString("en-IN", { timeZone: appt.timeZone }),
      clinicName:  "MediConnect",
    };

    try {
      if (reminder.channel === "EMAIL") {

        const body    = renderTemplate(template?.body    || "", vars);
        
        const subject = renderTemplate(template?.subject || "Appointment Reminder", vars);
        
        await emailService.sendReminderEmail({ to: patient.email, subject, body });

      } else if (reminder.channel === "SMS") {
        const body = renderTemplate(template?.body || "", vars);
        // await smsService.sendSMS({ phone: patient.phone, body });
        console.log("SMS (not yet wired):", body); // placeholder
      }

      reminder.status = "SENT";
      reminder.sentAt = new Date();
      reminder.attempts += 1;
      await reminder.save();

    } catch (err) {
      reminder.attempts += 1;
      reminder.errorReason = err.message;
      // BullMQ handles retries via job config — only mark FAILED after max attempts
      if (reminder.attempts >= 3) reminder.status = "FAILED";
      await reminder.save();
      throw err; // re-throw so BullMQ retry kicks in
    }

  }, {
    connection: redis,
    concurrency: 10,
  });

  worker.on("failed", (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err.message);
  });

  console.log("BullMQ reminder worker started");

}
