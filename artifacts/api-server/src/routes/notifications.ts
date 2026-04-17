import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

router.get("/unread-count", verifyToken, async (_req, res) => {
  try {
    const count = await Notification.countDocuments({ isRead: false });
    res.json({ success: true, data: { count } });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/", verifyToken, async (_req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: notifications });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.put("/read-all", verifyToken, async (_req, res) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params["id"], { isRead: true });
    res.json({ success: true, message: "Notification marked as read" });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.delete("/clear-all", verifyToken, async (_req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true, message: "All notifications cleared" });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
