import mongoose, { version } from "mongoose" ;

const schema = new mongoose.Schema({
  name   :{
    type : String ,
  } ,
  channel : {
     type : String ,
     enum : [ "EMAIL" , "SMS"] 
  },
  language : {
    type : String ,
    default : "en" 
  } ,
  subject : String ,
  body : {
    type : String ,
    required : true  
  } ,
  version : {
    type : Number ,
    default : 1
  } 
} , {timestamps : true}) ;

export const ReminderTemplate = mongoose.Model("ReminderTemplate" , schema) ;