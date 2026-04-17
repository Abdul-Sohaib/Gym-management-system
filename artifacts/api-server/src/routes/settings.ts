import bcrypt from "bcryptjs";
import { Router } from "express";
import nodemailer from "nodemailer";
import { Admin } from "../models/Admin.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

router.get("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password -emailPass");
    if (!admin) {
      res.status(404).json({ success: false, error: "Admin not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        gymName: admin.gymName,
        gymAddress: admin.gymAddress,
        gymPhone: admin.gymPhone,
        gymLogo: admin.gymLogo,
        emailUser: admin.emailUser,
        adminFullName: admin.fullName,
        adminEmail: admin.email,
      },
    });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.put("/", verifyToken, async (req: AuthRequest, res) => {
  try {
    const {
      gymName,
      gymAddress,
      gymPhone,
      gymLogo,
      emailUser,
      emailPass,
      adminFullName,
      currentPassword,
      newPassword,
    } = req.body;

    const admin = await Admin.findById(req.adminId);
    if (!admin) {
      res.status(404).json({ success: false, error: "Admin not found" });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (gymName) updateData["gymName"] = gymName;
    if (gymAddress !== undefined) updateData["gymAddress"] = gymAddress;
    if (gymPhone !== undefined) updateData["gymPhone"] = gymPhone;
    if (gymLogo !== undefined) updateData["gymLogo"] = gymLogo;
    if (emailUser !== undefined) updateData["emailUser"] = emailUser;
    if (emailPass !== undefined) updateData["emailPass"] = emailPass;
    if (adminFullName) updateData["fullName"] = adminFullName;

    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isValid) {
        res.status(400).json({ success: false, error: "Current password is incorrect" });
        return;
      }
      updateData["password"] = await bcrypt.hash(newPassword, 12);
    }

    const updated = await Admin.findByIdAndUpdate(req.adminId, updateData, { new: true }).select("-password -emailPass");
    res.json({
      success: true,
      data: {
        gymName: updated!.gymName,
        gymAddress: updated!.gymAddress,
        gymPhone: updated!.gymPhone,
        gymLogo: updated!.gymLogo,
        emailUser: updated!.emailUser,
        adminFullName: updated!.fullName,
        adminEmail: updated!.email,
      },
      message: "Settings updated",
    });
  } catch {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/test-email", verifyToken, async (req: AuthRequest, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin || !admin.emailUser || !admin.emailPass) {
      res.status(400).json({ success: false, error: "Email not configured" });
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: admin.emailUser, pass: admin.emailPass },
    });

    await transporter.sendMail({
      from: admin.emailUser,
      to: admin.email,
      subject: `Test Email from ${admin.gymName} CRM`,
      html: `<p>This is a test email from your ${admin.gymName} gym CRM. Email is working correctly!</p>`,
    });

    res.json({ success: true, message: "Test email sent" });
  } catch {
    res.status(500).json({ success: false, error: "Failed to send test email. Check your Gmail credentials." });
  }
});

export default router;
