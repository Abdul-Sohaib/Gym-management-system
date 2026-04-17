import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Admin.js";
import { verifyToken, AuthRequest } from "../middleware/verifyToken.js";

const router = Router();

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

function generateTokens(adminId: string) {
  const secret = process.env["JWT_SECRET"] || "default_jwt_secret";
  const refreshSecret = process.env["JWT_REFRESH_SECRET"] || "default_refresh_secret";

  const accessToken = jwt.sign({ adminId }, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ adminId }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });

  return { accessToken, refreshToken };
}

router.get("/admin-exists", async (_req, res) => {
  try {
    const admin = await Admin.findOne();
    res.json({ success: true, data: { exists: !!admin } });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const existing = await Admin.findOne();
    if (existing) {
      res.status(409).json({ success: false, error: "Admin already exists. Please login." });
      return;
    }

    const { fullName, email, password, gymName, gymAddress, gymPhone, gymLogo } = req.body;

    if (!fullName || !email || !password || !gymName) {
      res.status(400).json({ success: false, error: "Required fields missing" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      gymName,
      gymAddress: gymAddress || "",
      gymPhone: gymPhone || "",
      gymLogo: gymLogo || "",
    });

    const { accessToken, refreshToken } = generateTokens(admin._id.toString());

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        admin: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          gymName: admin.gymName,
          gymAddress: admin.gymAddress,
          gymPhone: admin.gymPhone,
          gymLogo: admin.gymLogo,
        },
      },
      message: "Registration successful",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password required" });
      return;
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      res.status(401).json({ success: false, error: "Invalid credentials" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(admin._id.toString());

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        admin: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          gymName: admin.gymName,
          gymAddress: admin.gymAddress,
          gymPhone: admin.gymPhone,
          gymLogo: admin.gymLogo,
        },
      },
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ success: true, message: "Logged out" });
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: "Refresh token required" });
      return;
    }

    const refreshSecret = process.env["JWT_REFRESH_SECRET"] || "default_refresh_secret";
    const decoded = jwt.verify(refreshToken, refreshSecret) as { adminId: string };

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      res.status(401).json({ success: false, error: "Admin not found" });
      return;
    }

    const tokens = generateTokens(admin._id.toString());

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        admin: {
          _id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          gymName: admin.gymName,
          gymAddress: admin.gymAddress,
          gymPhone: admin.gymPhone,
          gymLogo: admin.gymLogo,
        },
      },
    });
  } catch (err) {
    res.status(401).json({ success: false, error: "Invalid refresh token" });
  }
});

router.get("/me", verifyToken, async (req: AuthRequest, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select("-password");
    if (!admin) {
      res.status(404).json({ success: false, error: "Admin not found" });
      return;
    }
    res.json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;
