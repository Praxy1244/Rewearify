import { Router } from "express";
import Notification from "../models/Notification.js";
import { ok, fail } from "../utils/response.js";
import { authMiddleware } from "../middleware/auth.js"; // optional, for protected routes

const router = Router();

// GET all notifications for a user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return ok(res, { notifications });
  } catch (err) {
    console.error("Get notifications error:", err);
    return fail(res, "Server error");
  }
});

// POST create a notification for a user
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId, title, message } = req.body;
    if (!userId || !title || !message) return fail(res, "Missing required fields");

    const notification = await Notification.create({ userId, title, message });
    return ok(res, { notification });
  } catch (err) {
    console.error("Create notification error:", err);
    return fail(res, "Server error");
  }
});

// PATCH mark a notification as read
router.patch("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) return fail(res, "Notification not found");
    return ok(res, { notification });
  } catch (err) {
    console.error("Mark read error:", err);
    return fail(res, "Server error");
  }
});

// DELETE a notification
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    return ok(res, { message: "Notification deleted" });
  } catch (err) {
    console.error("Delete notification error:", err);
    return fail(res, "Server error");
  }
});

export default router;
