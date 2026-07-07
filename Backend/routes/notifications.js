const router = require('express').Router();
const prisma = require('../db');

// GET /notifications — all notifications for current user
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /notifications/unread-count
router.get("/unread-count", async (req, res) => {
  const userId = req.user.userId;
  try {
    const count = await prisma.notification.count({ where: { userId, read: false } });
    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /notifications/:id/read — mark single notification as read
router.put("/:id/read", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  try {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
    res.json({ message: "Marked as read", notification: updated });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /notifications/read-all — mark all as read
router.put("/read-all", async (req, res) => {
  const userId = req.user.userId;
  try {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /notifications/:id
router.delete("/:id", async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  try {
    const notif = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return res.status(404).json({ error: "Notification not found" });

    await prisma.notification.delete({ where: { id } });
    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
