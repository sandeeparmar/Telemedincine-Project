import ReminderProfile from  "../models/ReminderProfile.js" ;
import AppointmentReminder from "../models/AppointmentReminder.js" ;
import {enqueueReminder} from "./schedulerService.js" ;
import {DateTime} from "luxon" ;

export const scheduleReminders =  async function scheduleReminders(appointment){
  if(appointment.remindersDisabled)return ;

  //load profile - appointment-specific or default 
  let profile = null ;
  
  if(appointment.reminderProfileId) {
    profile = await ReminderProfile.findById(appointment.reminderProfileId).populate("reminders.templateId") ;
  }

  if(!profile) {
    profile = await ReminderProfile.findOne({isDefault : true}).populate("reminders.templateId") ;
  }
  if(!profile){
    return  ;
  }

  const timeZone = appointment.timeZone  ;
  const apptLocalTime = DateTime.fromJSDate(appointment.startTime).setZone(timeZone) ;

  for(let i=0; i < profile.reminders.length ;i++) {
    const entry = profile.reminders[i] ;
    const {channel , offsetNumber , offsetUnit , direction } = entry ;

    //compute sendAt in clinic local time , then convert to UTC 
    const unitMap = {MINUTES : "minutes" ,HOURS : "hours" , DAYS : "days"} ;

    const sendAtLocal =  direction === "BEFORE" ? apptLocalTime.minus({ [unitMap[offsetUnit]]: offsetNumber })
      : apptLocalTime.plus({ [unitMap[offsetUnit]]: offsetNumber }); // for mapping a unit string offset 30 minute before appointment 

    
      //convert local time -> utc -> native js date object 
    const sendAtUTC = sendAtLocal.toUTC().toJSDate();
    if (sendAtUTC <= new Date()) continue; // already past
    

    // create a unique a deduplication key using internal information for unique identifying this exact notification 
    const key = `appt:${appointment._id}:profile:${profile._id}:idx:${i}:ch:${channel}`;

    const reminder = await AppointmentReminder.findOneAndUpdate(
       {idempotencyKey : key} ,
       {
         $setOnInsert : {
           appointmentId : appointment._id ,
           patientId : appointment.patient ,
           doctorId : appointment.doctor ,
           channel ,
           templateId : entry.templateId?._id ,
           sendAtUTC ,
           status : "PENDING" ,
           idempotencyKey : key ,
           variables: {
            // populated at send time for freshness
           }
         }
       } , 
       {upset : true , new : true} 
    ) ;

    await enqueueReminder(reminder) ; // BULLMQ with Exact Delay
  }
} 

export const cancelReminders =  async function cancelReminders(appointmentId) {
  // cancel BullMQ jobs by idempotencyKey (jobId in BullMQ)
  const reminders = await AppointmentReminder.find({
    appointmentId,
    status: "PENDING"
  });

  for (const r of reminders) {
    const { reminderQueue } = require("./schedulerService");
    const job = await reminderQueue.getJob(r.idempotencyKey);
    if (job) await job.remove();
    r.status = "CANCELLED";
    await r.save();
  }
}
