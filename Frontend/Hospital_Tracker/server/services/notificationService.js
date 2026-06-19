import { Queue, Worker } from "bullmq";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { sendEmail } from "./emailService.js";
import { createRedisClient } from "../config/redis.js";

const NOTIFICATION_QUEUE = "notifications";

let notificationQueue = null;
let notificationWorker = null;

function queueConnection() {
  return createRedisClient();
}

export function initializeNotificationSystem(io) {
  if (!process.env.REDIS_URL) {
    console.warn("REDIS_URL missing; notification queue is disabled.");
    return;
  }

  if (!notificationQueue) {
    notificationQueue = new Queue(NOTIFICATION_QUEUE, {
      connection: queueConnection(),
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 200,
        removeOnFail: 100,
      },
    });
  }

  if (!notificationWorker) {
    notificationWorker = new Worker(
      NOTIFICATION_QUEUE,
      async (job) => processNotificationJob(job, io),
      {
        connection: queueConnection(),
        concurrency: 20,
      }
    );

    notificationWorker.on("failed", (job, err) => {
      console.error(`Notification job failed (${job?.id}):`, err.message);
    });

    notificationWorker.on("error", (err) => {
      console.error("Notification worker error:", err.message);
    });
  }

  console.log("Notification queue initialized with Redis");
}

async function processNotificationJob(job, io) {
  const { notificationId } = job.data;
  const notification = await Notification.findById(notificationId);

  if (!notification) return;

  let socketDelivered = false;
  let emailDelivered = false;

  try {
    if (notification.channels.socket) {
      io.to(String(notification.userId)).emit("notification", {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
      });
      socketDelivered = true;
    }

    if (notification.channels.email) {
      const user = await User.findById(notification.userId).select("email name");
      if (user?.email) {
        const text = `${notification.title}\n\n${notification.message}`;
        const html = `<p>Hello ${user.name || "User"},</p><p>${notification.message}</p>`;
        await sendEmail(user.email, notification.title, text, html);
        emailDelivered = true;
      }
    }

    notification.attempts += 1;
    notification.sentAt = new Date();
    notification.lastError = null;

    if (notification.channels.socket && notification.channels.email) {
      notification.status = socketDelivered && emailDelivered ? "SENT" : "PARTIAL";
    } else {
      notification.status = "SENT";
    }

    await notification.save();
  } catch (error) {
    notification.attempts += 1;
    notification.lastError = error.message;
    notification.status = "FAILED";
    await notification.save();
    throw error;
  }
}

export async function enqueueNotification(payload) {
  if (!payload?.userId || !payload?.title || !payload?.message || !payload?.type) {
    throw new Error("Missing required notification payload fields");
  }

  if (!notificationQueue) {
    throw new Error("Notification queue is not initialized");
  }

  const notification = await Notification.create({
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
    channels: {
      socket: payload.channels?.socket !== false,
      email: payload.channels?.email === true,
    },
    status: "QUEUED",
  });

  await notificationQueue.add(
    "deliver",
    { notificationId: String(notification._id) },
    {
      jobId: `notification_${notification._id}`,
    }
  );

  return notification;
}
