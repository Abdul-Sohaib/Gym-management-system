import { Router } from "express";
import { Member } from "../models/Member.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();

router.get("/summary", verifyToken, async (_req, res) => {
  try {
    const now = new Date();
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);
    const sevenDays = new Date(now);
    sevenDays.setDate(sevenDays.getDate() + 7);

    const totalMembers = await Member.countDocuments();
    const expiredMembers = await Member.countDocuments({ packageEndDate: { $lt: now } });
    const expiringThisWeek = await Member.countDocuments({
      packageEndDate: { $gte: now, $lte: sevenDays },
    });
    const activeMembers = totalMembers - expiredMembers;

    const recentMembers = await Member.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const recentWithStatus = recentMembers.map((m) => {
      const daysRemaining = Math.ceil(
        (m.packageEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      let status = "Active";
      if (m.packageEndDate < now) status = "Expired";
      else if (m.packageEndDate <= threeDays) status = "Expiring Soon";
      return { ...m.toObject(), status, daysRemaining: Math.max(0, daysRemaining) };
    });

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        expiringThisWeek,
        expiredMembers,
        recentMembers: recentWithStatus,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/monthly-signups", verifyToken, async (_req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const result = await Member.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const found = result.find((r) => r._id.year === year && r._id.month === month);
      data.push({
        month: months[month - 1],
        value: found ? found.count : 0,
      });
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/revenue", verifyToken, async (_req, res) => {
  try {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const result = await Member.aggregate([
      { $match: { createdAt: { $gte: twelveMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalFeesPaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const found = result.find((r) => r._id.year === year && r._id.month === month);
      data.push({
        month: months[month - 1],
        value: found ? found.revenue : 0,
      });
    }

    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/packages", verifyToken, async (_req, res) => {
  try {
    const result = await Member.aggregate([
      {
        $group: {
          _id: "$packageType",
          count: { $sum: 1 },
        },
      },
    ]);

    const data = result.map((r) => ({ packageType: r._id, count: r.count }));
    res.json({ success: true, data });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
