import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    gymName: { type: String, required: true },
    gymAddress: { type: String, default: "" },
    gymPhone: { type: String, default: "" },
    gymLogo: { type: String, default: "" },
    emailUser: { type: String, default: "" },
    emailPass: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);
