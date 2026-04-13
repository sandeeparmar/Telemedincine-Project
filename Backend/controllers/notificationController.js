import { Notification } from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      readAt: null,
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Failed to fetch notifications:", error.message);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Failed to mark notification read:", error.message);
    res.status(500).json({ message: "Failed to mark notification read" });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark all notifications read:", error.message);
    res.status(500).json({ message: "Failed to mark all notifications read" });
  }
};
