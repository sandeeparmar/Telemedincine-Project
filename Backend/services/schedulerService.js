import schedule from "node-schedule";
import { sendPendingReminders } from "./reminderService.js";

let schedulerJob = null;

/**
 * Initialize the appointment reminder scheduler
 * Checks for pending reminders every minute
 */
export const initializeReminderScheduler = (io) => {
  try {
    // Run every minute to check for pending reminders
    schedulerJob = schedule.scheduleJob("*/1 * * * *", async () => {
      console.log(`[${new Date().toISOString()}] Running appointment reminder scheduler...`);
      await sendPendingReminders(io);
    });

    console.log("✅ Appointment Reminder Scheduler initialized - runs every minute");
    return true;

  } catch (error) {
    console.error("❌ Error initializing reminder scheduler:", error);
    return false;
  }
};

/**
 * Stop the reminder scheduler
 */
export const stopReminderScheduler = () => {
  try {
    if (schedulerJob) {
      schedulerJob.cancel();
      schedulerJob = null;
      console.log("✅ Appointment Reminder Scheduler stopped");
      return true;
    }
  } catch (error) {
    console.error("❌ Error stopping reminder scheduler:", error);
    return false;
  }
};

/**
 * Get scheduler status
 */
export const getReminderSchedulerStatus = () => {
  return {
    isRunning: schedulerJob !== null,
    nextExecution: schedulerJob ? schedulerJob.nextDate() : null
  };
};
