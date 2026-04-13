import { ReminderTemplate } from "../models/ReminderTemplate"; 

async function seedDefaultTemplates(){
  const count = await ReminderTemplate.countDocuments() ;
  if(count > 0)return ;
   await ReminderTemplate.insertMany([
    {
      name: "SMS 24h before",
      channel: "SMS",
      language: "en",
      body: "Hi {{patientName}}, reminder: appointment with Dr. {{doctorName}} on {{dateTime}}. Reply YES to confirm. - MediConnect"
    },
    {
      name: "Email 3 days before",
      channel: "EMAIL",
      language: "en",
      subject: "Upcoming Appointment Reminder",
      body: `<p>Hi {{patientName}},</p>
             <p>Your appointment with <strong>Dr. {{doctorName}}</strong> 
             is on <strong>{{dateTime}}</strong>.</p>`
    },
    {
      name: "Hindi SMS",
      channel: "SMS",
      language: "hi",
      body: "नमस्ते {{patientName}}, Dr. {{doctorName}} के साथ आपकी अपॉइंटमेंट {{dateTime}} को है।"
    }
  ]);
} 