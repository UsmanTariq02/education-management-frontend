import { APP_NAME } from "@/lib/constants/app";
import { formatCurrency } from "@/lib/formatters";
import type { FeeRecord, ReminderChannel, Student } from "@/types/domain";

export function buildReminderMessage(student: Student | undefined, channel: ReminderChannel, feeRecord?: FeeRecord) {
  const studentName = student?.fullName ?? "Student";
  const guardianName = student?.guardianName ?? "Parent/Guardian";
  const organizationName = student?.organizationName ?? APP_NAME;
  const greeting = channel === "EMAIL" ? `Dear ${guardianName},` : `Assalam o Alaikum ${guardianName},`;
  const totalFee = feeRecord ? Number(feeRecord.amountDue) : 0;
  const paidFee = feeRecord ? Number(feeRecord.amountPaid) : 0;
  const pendingFee = Math.max(totalFee - paidFee, 0);
  const billingCycle = feeRecord ? `${feeRecord.month}/${feeRecord.year}` : "the current billing cycle";
  const feeContext = feeRecord
    ? `This is a detailed fee reminder from ${organizationName} for ${studentName}.`
    : `This is a reminder from ${organizationName} regarding ${studentName}'s school dues and attendance follow-up.`;
  const paymentContext = feeRecord
    ? `Student name: ${studentName}
School name: ${organizationName}
Billing cycle: ${billingCycle}
Total fee: ${formatCurrency(totalFee)}
Paid fee: ${formatCurrency(paidFee)}
Pending fee: ${formatCurrency(pendingFee)}

Please contact ${organizationName} administration if payment has already been made or if you need any clarification.`
    : `Please contact ${organizationName} administration if payment is pending or if you need any clarification.`;

  return `${greeting}

${feeContext}
${paymentContext}

Regards,
${organizationName}
School Administration`;
}
