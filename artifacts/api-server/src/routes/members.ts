import { Router } from "express";
import { Admin } from "../models/Admin.js";
import { Member } from "../models/Member.js";
import { Notification } from "../models/Notification.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";
import {
  sendAdminNewMemberAlert,
  sendRenewalAlertToAdmin,
  sendRenewalReminderToCustomer,
  sendWelcomeEmail,
} from "../services/emailService.js";

const router = Router();

function calculateEndDate(startDate: Date, packageType: string): Date {
  const end = new Date(startDate);
  switch (packageType) {
    case "Daily":
      end.setDate(end.getDate() + 1);
      break;
    case "Monthly":
      end.setDate(end.getDate() + 30);
      break;
    case "6 Months":
      end.setDate(end.getDate() + 180);
      break;
    case "1 Year":
      end.setDate(end.getDate() + 365);
      break;
  }
  return end;
}

function getMemberStatus(endDate: Date) {
  const now = new Date();
  const threedays = new Date(now);
  threedays.setDate(threedays.getDate() + 3);

  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (endDate < now) return { status: "Expired", daysRemaining: 0 };
  if (endDate <= threedays) return { status: "Expiring Soon", daysRemaining };
  return { status: "Active", daysRemaining };
}

router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { search, status, packageType, page = 1, limit = 50 } = req.query;

    const query: Record<string, unknown> = {};

    if (search) {
      query["$or"] = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (packageType) {
      query["packageType"] = packageType;
    }

    const allMembers = await Member.find(query).sort({ createdAt: -1 });

    const now = new Date();
    const threeDays = new Date(now);
    threeDays.setDate(threeDays.getDate() + 3);

    let members = allMembers.map((m) => {
      const { status: memberStatus, daysRemaining } = getMemberStatus(m.packageEndDate);
      return { ...m.toObject(), status: memberStatus, daysRemaining };
    });

    if (status) {
      members = members.filter((m) => m.status === status);
    }

    const total = members.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const paginatedMembers = members.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: {
        members: paginatedMembers,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const { fullName, email, phone, profilePhoto, packageType, packageStartDate, totalFeesPaid, notes } = req.body;

    if (!fullName || !email || !phone || !packageType || !packageStartDate) {
      res.status(400).json({ success: false, error: "Required fields missing" });
      return;
    }

    const startDate = new Date(packageStartDate);
    const endDate = calculateEndDate(startDate, packageType);

    const member = await Member.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      profilePhoto: profilePhoto || "",
      packageType,
      packageStartDate: startDate,
      packageEndDate: endDate,
      totalFeesPaid: totalFeesPaid || 0,
      notes: notes || "",
    });

    const { status: memberStatus, daysRemaining } = getMemberStatus(endDate);

    await Notification.create({
      type: "new_member",
      title: "New Member Added",
      message: `${fullName} has been added with a ${packageType} membership`,
      memberId: member._id,
    });

    const admin = await Admin.findOne();
    if (admin) {
      const gymProfile = {
        gymName: admin.gymName,
        gymAddress: admin.gymAddress,
        gymPhone: admin.gymPhone,
        gymLogo: admin.gymLogo,
        emailUser: admin.emailUser,
        emailPass: admin.emailPass,
      };
      const memberData = {
        fullName,
        email: email.toLowerCase(),
        phone,
        packageType,
        packageStartDate: startDate,
        packageEndDate: endDate,
      };

      sendWelcomeEmail(memberData, gymProfile).catch(() => {});
      sendAdminNewMemberAlert(memberData, gymProfile, admin.email).catch(() => {});
    }

    res.status(201).json({
      success: true,
      data: { ...member.toObject(), status: memberStatus, daysRemaining },
      message: "Member created successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params["id"]);
    if (!member) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }
    const { status, daysRemaining } = getMemberStatus(member.packageEndDate);
    res.json({ success: true, data: { ...member.toObject(), status, daysRemaining } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { fullName, email, phone, profilePhoto, packageType, packageStartDate, totalFeesPaid, notes } = req.body;

    const updateData: Record<string, unknown> = {};
    if (fullName) updateData["fullName"] = fullName;
    if (email) updateData["email"] = email.toLowerCase();
    if (phone) updateData["phone"] = phone;
    if (profilePhoto !== undefined) updateData["profilePhoto"] = profilePhoto;
    if (notes !== undefined) updateData["notes"] = notes;
    if (totalFeesPaid !== undefined) updateData["totalFeesPaid"] = totalFeesPaid;

    if (packageType || packageStartDate) {
      const existing = await Member.findById(req.params["id"]);
      if (!existing) {
        res.status(404).json({ success: false, error: "Member not found" });
        return;
      }
      const startDate = packageStartDate ? new Date(packageStartDate) : existing.packageStartDate;
      const pType = packageType || existing.packageType;
      updateData["packageType"] = pType;
      updateData["packageStartDate"] = startDate;
      updateData["packageEndDate"] = calculateEndDate(startDate, pType);
    }

    const member = await Member.findByIdAndUpdate(req.params["id"], updateData, { new: true });
    if (!member) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }

    const { status, daysRemaining } = getMemberStatus(member.packageEndDate);
    res.json({ success: true, data: { ...member.toObject(), status, daysRemaining }, message: "Member updated" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params["id"]);
    if (!member) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }

    await Notification.create({
      type: "member_deleted",
      title: "Member Removed",
      message: `${member.fullName}'s membership has been deleted`,
    });

    res.json({ success: true, message: "Member deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/:id/remind", verifyToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params["id"]);
    if (!member) {
      res.status(404).json({ success: false, error: "Member not found" });
      return;
    }

    const admin = await Admin.findOne();
    if (admin) {
      const gymProfile = {
        gymName: admin.gymName,
        gymAddress: admin.gymAddress,
        gymPhone: admin.gymPhone,
        gymLogo: admin.gymLogo,
        emailUser: admin.emailUser,
        emailPass: admin.emailPass,
      };
      const memberData = {
        fullName: member.fullName,
        email: member.email,
        phone: member.phone,
        packageType: member.packageType,
        packageStartDate: member.packageStartDate,
        packageEndDate: member.packageEndDate,
      };

      await sendRenewalReminderToCustomer(memberData, gymProfile);
      await sendRenewalAlertToAdmin(memberData, gymProfile, admin.email);
    }

    await Member.findByIdAndUpdate(member._id, { lastReminderSent: new Date() });

    await Notification.create({
      type: "manual_reminder",
      title: "Reminder Sent",
      message: `Renewal reminder sent to ${member.fullName}`,
      memberId: member._id,
    });

    res.json({ success: true, message: "Reminder sent" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
