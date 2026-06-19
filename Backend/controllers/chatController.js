import { chatRoom } from "../models/ChatRoom.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { encrypt, decrypt } from "../services/encryptionService.js";


export const createRoom = async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({ message: "doctorId and patientId are required" });
    }

    // Only allow participants (doctor or patient) to create/access their own room
    const requesterId = req.user.id;
    const isParticipant =
    String(requesterId) === String(doctorId) ||
    String(requesterId) === String(patientId);

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    let room = await chatRoom.findOne({ doctorId, patientId });
    if (!room) {
      room = await chatRoom.create({ doctorId, patientId });
    }
    res.json(room);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Failed to create room" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const room = await chatRoom.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requesterId = req.user.id;
    const isParticipant =
      String(requesterId) === String(room.doctorId) ||
      String(requesterId) === String(room.patientId);

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      roomId: req.params.roomId
    })
      .sort("createdAt")
      .populate("senderId", "name email");

    // Decrypt messages before sending to frontend
    const decryptedMessages = messages.map(msg => ({
      ...msg._doc,
      content: msg.type === "TEXT" ? decrypt(msg.content) : msg.content
    }));

    res.json(decryptedMessages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const sendTextMessage = async (req, res) => {
  try {
    
    const [sender, room] = await Promise.all([
      User.findById(req.user.id),
      chatRoom.findById(req.body.roomId)
    ]);
    
    if(!sender){
      return res.status(404).json({message : "Receipnt not found"}) ;
    }

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requesterId = req.user.id;
    const isParticipant =
      String(requesterId) === String(room.doctorId) ||
      String(requesterId) === String(room.patientId);

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const encryptedContent = encrypt(req.body.text);

    const message = await Message.create({
      roomId: room._id,
      senderId: sender._id,
      senderRole: sender.role,
      type: "TEXT",
      content: encryptedContent
    });

    // Populate sender details for the response
    await message.populate("senderId", "name email");

    // Decrypt for the response and socket emission
    const outgoingMessage = {
      ...message._doc,
      content: req.body.text
    };

    const io = req.app.get("io");
    io.to(req.body.roomId).emit("newMessage", outgoingMessage);

    res.json(outgoingMessage);
  } catch (error) {
    console.error("Error in sendTextMessage:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}

export const sendAudioMessage = async (req, res) => {
  try {
    const room = await chatRoom.findById(req.body.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requesterId = req.user.id;
    const isParticipant =
      String(requesterId) === String(room.doctorId) ||
      String(requesterId) === String(room.patientId);

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await Message.create({
      roomId: req.body.roomId,
      senderId: req.user.id,
      senderRole: req.user.role,
      content: req.file.path,
      type: "AUDIO"
    });

    await message.populate("senderId", "name email");

    const io = req.app.get("io");
    io.to(req.body.roomId).emit("newMessage", message);
    res.json(message);
  } catch (err) {
    console.error("Error sending audio:", err);
    res.status(500).json({ message: "Failed to send audio" });
  }
};

export const getConversationHistory = async (req, res) => {
  try {
    const room = await chatRoom.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const requesterId = req.user.id;
    const isParticipant =
      String(requesterId) === String(room.doctorId) ||
      String(requesterId) === String(room.patientId);

    if (!isParticipant && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({
      roomId: req.params.roomId
    }).sort({ createdAt: 1 });

    const decryptedMessages = messages.map(msg => ({
      ...msg._doc,
      content: msg.type === "TEXT" ? decrypt(msg.content) : msg.content,
      translatedContent: msg.type === "TEXT" && msg.translatedContent ? decrypt(msg.translatedContent) : msg.translatedContent
    }));

    res.json(decryptedMessages);
  } catch (err) {
    console.error("Error fetching history:", err);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};