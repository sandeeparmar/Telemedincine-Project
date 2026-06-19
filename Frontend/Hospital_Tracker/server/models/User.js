import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
      type : String ,
      required : true
    } ,
    email : {
      type : String ,
      unique : true ,
      required : true ,
      lowercase : true ,
      trim : true
    } ,   
    phone : {
      type : String ,
      required : true 
    } ,
    password : {
      type : String ,
      required : true 
    } , 
    role : {
      type : String ,
       enum : ["PATIENT" , "DOCTOR" , "ADMIN"] ,
       default : "PATIENT" ,
    }, 
    preferredLanguage : {
      type : String ,
      default :"en" 
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    notificationPreferences: {
      appointmentReminders: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      socketNotifications: {
        type: Boolean,
        default: true
      },
      reminderTiming: {
        type: [String],
        enum: ["15_MINS", "30_MINS", "1_HOUR"],
        default: ["15_MINS", "30_MINS", "1_HOUR"]
      }
    }
}) ;

export const User = mongoose.model("User" , userSchema) ;