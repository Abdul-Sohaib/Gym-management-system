import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

interface GymProfile {
  gymName: string;
  gymAddress?: string;
  gymPhone?: string;
  gymLogo?: string;
  emailUser?: string;
  emailPass?: string;
}

interface MemberData {
  fullName: string;
  email: string;
  phone?: string;
  packageType?: string;
  packageEndDate?: Date;
  packageStartDate?: Date;
}

function createTransporter(gymProfile: GymProfile) {
  const emailUser = gymProfile.emailUser || env.smtpEmail;
  const emailPass = gymProfile.emailPass || env.smtpPassword;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: emailUser, pass: emailPass },
  });
}

function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

export async function sendRenewalReminderToCustomer(
  member: MemberData,
  gymProfile: GymProfile
): Promise<void> {
  const transporter = createTransporter(gymProfile);
  if (!transporter) {
    logger.warn("Email not configured — skipping renewal reminder to customer");
    return;
  }

  const daysLeft = member.packageEndDate ? getDaysRemaining(member.packageEndDate) : 0;
  const endDateStr = member.packageEndDate
    ? new Date(member.packageEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
      <div style="background: #6366f1; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        ${gymProfile.gymLogo ? `<img src="${gymProfile.gymLogo}" alt="${gymProfile.gymName}" style="height: 60px; margin-bottom: 10px;" />` : ""}
        <h1 style="color: white; margin: 0; font-size: 24px;">${gymProfile.gymName}</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">Hi ${member.fullName},</h2>
        <p style="color: #4a4a6a; font-size: 16px;">Your membership is expiring soon! Don't miss out on your fitness journey.</p>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-weight: bold;">
            Your ${member.packageType} membership expires on ${endDateStr} (${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining)
          </p>
        </div>
        <p style="color: #4a4a6a;">To renew your membership, please visit us at ${gymProfile.gymName} or call us at ${gymProfile.gymPhone || "our gym"}.</p>
        <p style="color: #4a4a6a;"><strong>Address:</strong> ${gymProfile.gymAddress || "Our gym location"}</p>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #94a3b8; font-size: 14px;">Stay strong and keep training!</p>
          <p style="color: #94a3b8; font-size: 14px;">${gymProfile.gymName} Team</p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: gymProfile.emailUser || env.smtpEmail,
    to: member.email,
    subject: `Your ${gymProfile.gymName} membership is expiring soon!`,
    html,
  });
}

export async function sendRenewalAlertToAdmin(
  member: MemberData,
  gymProfile: GymProfile,
  adminEmail: string
): Promise<void> {
  const transporter = createTransporter(gymProfile);
  if (!transporter) return;

  const daysLeft = member.packageEndDate ? getDaysRemaining(member.packageEndDate) : 0;
  const endDateStr = member.packageEndDate
    ? new Date(member.packageEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
      <div style="background: #ef4444; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Renewal Alert</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">Member Renewal Alert</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #94a3b8;">Name:</td><td style="padding: 8px; font-weight: bold;">${member.fullName}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Email:</td><td style="padding: 8px;">${member.email}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Phone:</td><td style="padding: 8px;">${member.phone || "N/A"}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Package:</td><td style="padding: 8px;">${member.packageType}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Expiry Date:</td><td style="padding: 8px; color: #ef4444; font-weight: bold;">${endDateStr}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Days Remaining:</td><td style="padding: 8px; color: #ef4444; font-weight: bold;">${daysLeft} day${daysLeft === 1 ? "" : "s"}</td></tr>
        </table>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: gymProfile.emailUser || env.smtpEmail,
    to: adminEmail,
    subject: `Renewal Alert: ${member.fullName} expires on ${endDateStr}`,
    html,
  });
}

export async function sendWelcomeEmail(
  member: MemberData,
  gymProfile: GymProfile
): Promise<void> {
  const transporter = createTransporter(gymProfile);
  if (!transporter) return;

  const startDateStr = member.packageStartDate
    ? new Date(member.packageStartDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";
  const endDateStr = member.packageEndDate
    ? new Date(member.packageEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        ${gymProfile.gymLogo ? `<img src="${gymProfile.gymLogo}" alt="${gymProfile.gymName}" style="height: 60px; margin-bottom: 10px;" />` : ""}
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${gymProfile.gymName}!</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">Hello ${member.fullName}!</h2>
        <p style="color: #4a4a6a; font-size: 16px;">We're thrilled to have you as part of our fitness family! Your membership has been successfully created.</p>
        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1a1a2e; margin-top: 0;">Membership Details</h3>
          <p style="color: #4a4a6a; margin: 4px 0;"><strong>Package:</strong> ${member.packageType}</p>
          <p style="color: #4a4a6a; margin: 4px 0;"><strong>Start Date:</strong> ${startDateStr}</p>
          <p style="color: #4a4a6a; margin: 4px 0;"><strong>Valid Until:</strong> ${endDateStr}</p>
        </div>
        <p style="color: #4a4a6a;">Visit us at: ${gymProfile.gymAddress || gymProfile.gymName}</p>
        ${gymProfile.gymPhone ? `<p style="color: #4a4a6a;">Contact: ${gymProfile.gymPhone}</p>` : ""}
        <p style="color: #6366f1; font-weight: bold; text-align: center; margin-top: 20px;">Let's crush those fitness goals together! 💪</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: gymProfile.emailUser || env.smtpEmail,
    to: member.email,
    subject: `Welcome to ${gymProfile.gymName}!`,
    html,
  });
}

export async function sendAdminNewMemberAlert(
  member: MemberData,
  gymProfile: GymProfile,
  adminEmail: string
): Promise<void> {
  const transporter = createTransporter(gymProfile);
  if (!transporter) return;

  const startDateStr = member.packageStartDate
    ? new Date(member.packageStartDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";
  const endDateStr = member.packageEndDate
    ? new Date(member.packageEndDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "N/A";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
      <div style="background: #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 20px;">New Member Added</h1>
      </div>
      <div style="background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #1a1a2e;">New Member: ${member.fullName}</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #94a3b8;">Name:</td><td style="padding: 8px; font-weight: bold;">${member.fullName}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Email:</td><td style="padding: 8px;">${member.email}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Phone:</td><td style="padding: 8px;">${member.phone || "N/A"}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Package:</td><td style="padding: 8px;">${member.packageType}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Start Date:</td><td style="padding: 8px;">${startDateStr}</td></tr>
          <tr><td style="padding: 8px; color: #94a3b8;">Valid Until:</td><td style="padding: 8px;">${endDateStr}</td></tr>
        </table>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: gymProfile.emailUser || env.smtpEmail,
    to: adminEmail,
    subject: `New Member Added: ${member.fullName}`,
    html,
  });
}
