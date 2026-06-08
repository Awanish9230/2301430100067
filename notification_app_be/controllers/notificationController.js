import Notification from "../models/notification.js";
import Log from "../../logging_middleware/logger.js";

export const createNotification = async (req, res, next) => {
  try {
    await Log(
      "backend",
      "info",
      "controller",
      "Creating notification"
    );

    const notification = await Notification.create(req.body);

    await Log(
      "backend",
      "info",
      "controller",
      "Notification created successfully"
    );

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    await Log(
      "backend",
      "error",
      "controller",
      error.message
    );

    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    await Log(
      "backend",
      "info",
      "controller",
      "Fetching notifications"
    );

    const notifications = await Notification.find();

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications,
    });
  } catch (error) {
    await Log(
      "backend",
      "error",
      "controller",
      error.message
    );

    next(error);
  }
};