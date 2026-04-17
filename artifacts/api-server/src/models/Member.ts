import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    profilePhoto: { type: String, default: "" },
    packageType: {
      type: String,
      enum: ["Daily", "Monthly", "6 Months", "1 Year"],
      required: true,
    },
    packageStartDate: { type: Date, required: true },
    packageEndDate: { type: Date, required: true },
    totalFeesPaid: { type: Number, default: 0 },
    notes: { type: String, default: "" },
    lastReminderSent: { type: Date, default: null },
  },
  { timestamps: true }
);

memberSchema.index({ packageEndDate: 1 });
memberSchema.index({ email: 1 });

export const Member = mongoose.model("Member", memberSchema);
