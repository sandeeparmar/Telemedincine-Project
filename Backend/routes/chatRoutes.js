import express from "express" ;
import {verifyToken} from "../middleware/authMiddleware.js" ;
import upload from "../middleware/uploadAudio.js" ;

const router = express.Router() ;

import {
  createRoom ,
  getMessages ,
  sendTextMessage ,
  sendAudioMessage,
  getConversationHistory
}  from "../controllers/chatController.js" ;

router.post("/room" , verifyToken , createRoom) ;

router.get("/:roomId" , verifyToken , getMessages)  ;

router.post("/text" ,verifyToken , sendTextMessage); 

router.post("/audio" , verifyToken , upload.single("audio") , sendAudioMessage) ;

router.get("/history/:roomId" , verifyToken , getConversationHistory) ;


export default router ;




