import cron from "node-cron";
import { Admin } from "../models/Admin.js";
import { Member } from "../models/Member.js";
import { Notification } from "../models/Notification.js";
import { sendRenewalAlertToAdmin, sendRenewalReminderToCustomer } from "./emailService.js";
import { logger } from "../lib/logger.js";

export function initCronJobs() {
  cron.schedule("0 8 * * *", async () => {
    logger.info("Running daily renewal check cron job");

    try {
      const admin = await Admin.findOne();
      if (!admin) {
        logger.warn("No admin found — skipping renewal check");
        return;
      }

      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 3);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const expiringMembers = await Member.find({
        packageEndDate: { $gte: yesterday, $lte: tomorrow },
      });

      for (const member of expiringMembers) {
        try {
          const lastSent = member.lastReminderSent;
          if (lastSent && lastSent >= today) {
            continue;
          }

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

          const daysLeft = Math.ceil(
            (member.packageEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await Notification.create({
            type: "renewal_alert",
            title: "Membership Expiring Soon",
            message: `${member.fullName}'s ${member.packageType} membership expires in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
            memberId: member._id,
          });

          await Member.findByIdAndUpdate(member._id, { lastReminderSent: new Date() });

          logger.info({ memberId: member._id }, "Renewal reminder sent");
        } catch (err) {
          logger.error({ err, memberId: member._id }, "Failed to send renewal reminder");
        }
      }

      logger.info({ count: expiringMembers.length }, "Daily renewal check complete");
    } catch (err) {
      logger.error({ err }, "Error in daily renewal check cron");
    }
  });

  logger.info("Cron jobs initialized");
}
