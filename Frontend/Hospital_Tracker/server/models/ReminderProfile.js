import mongoose from "mongoose" ;

const reminderEntrySchema = new mongoose.Schema({
  channel : {
    type : String,
    enum : ["EMAIL" , "SMS"] ,
    required : true
  } ,
  offsetNumber : { // how  much time before/after 
    type : Number ,
    required : true 
  } ,
  offsetUnit : {
    type : String ,
    enum : ["MINUTES" , "HOURS" ,"DAYS"] ,
    required : true 
  } ,
  direction : {
    type : String ,
    enum : ["BEFORE" , "AFTER"] ,
    default : "BEFORE" 
  },
  templateId : {
    type : mongoose.Schema.Types.ObjectId ,
    ref : "ReminderTemplate" 
  }
}) ;

const schema = new mongoose.Schema({
  name : {
    type : String  ,
    required : true 
  } ,
  isDefault : {
    type : Boolean ,
    default : false 
  } ,
  reminders : [reminderEntrySchema],
} , {timestamps : true}) ;

export const ReminderProfile = mongoose.model("ReminderProfile" , schema) ;