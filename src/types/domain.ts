export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED";
export type StudentBatchStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";
export type FeeRecordStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
export type ReminderChannel = "SMS" | "WHATSAPP" | "EMAIL" | "MANUAL";
export type ReminderStatus = "PENDING" | "SENT" | "FAILED";
export type ReminderAutomationTrigger = "FEE_DUE" | "FEE_OVERDUE" | "PAYMENT_RECEIVED";
export type ReminderRecipientTarget = "STUDENT" | "GUARDIAN" | "BOTH";
export type ReminderScheduleStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED" | "SKIPPED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "ONLINE" | "CHEQUE" | "OTHER";
export type ContactInquiryStatus = "NEW" | "REVIEWED" | "CONTACTED";

export interface ActivityLogActor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ActivityLog {
  id: string;
  organizationId: string | null;
  organizationName: string | null;
  actorUserId: string | null;
  module: string;
  action: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actorUser: ActivityLogActor | null;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string | null;
  organizationName: string | null;
  isActive: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  totalUsers: number;
  totalAdmins: number;
  totalStaff: number;
  totalStudents: number;
  totalBatches: number;
  totalFeePlans: number;
  totalFeeRecords: number;
  totalAttendanceRecords: number;
  totalReminderLogs: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  rolePermissions: Array<{
    roleId: string;
    permissionId: string;
    assignedAt: string;
    permission: Permission;
  }>;
}

export interface Batch {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  scheduleInfo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentBatchSummary {
  id: string;
  name: string;
  code: string;
  status: StudentBatchStatus;
}

export interface Student {
  id: string;
  organizationId: string;
  organizationName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  guardianName: string;
  guardianEmail: string | null;
  guardianPhone: string;
  address: string | null;
  dateOfBirth: string | null;
  admissionDate: string;
  status: StudentStatus;
  batches: StudentBatchSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentImportError {
  rowNumber: number;
  message: string;
}

export interface StudentImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: StudentImportError[];
}

export interface FeePlan {
  id: string;
  studentId: string;
  batchId: string | null;
  monthlyFee: string;
  dueDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  batchId: string | null;
  feePlanId: string;
  month: number;
  year: number;
  amountDue: string;
  amountPaid: string;
  status: FeeRecordStatus;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  batchId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderLog {
  id: string;
  studentId: string;
  feeRecordId: string | null;
  channel: ReminderChannel;
  message: string;
  sentByUserId: string | null;
  sentAt: string | null;
  status: ReminderStatus;
  deliveryReference?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderTemplate {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  channel: ReminderChannel;
  target: ReminderRecipientTarget;
  subject: string | null;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderRule {
  id: string;
  organizationId: string;
  templateId: string;
  name: string;
  trigger: ReminderAutomationTrigger;
  offsetDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template?: ReminderTemplate;
}

export interface ReminderProviderSetting {
  id: string;
  organizationId: string;
  autoRemindersEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  smsEnabled: boolean;
  paymentConfirmationEnabled: boolean;
  senderName: string | null;
  replyToEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  institutionName: string;
  phone: string | null;
  institutionType: string | null;
  expectedUserCount: string | null;
  requestedModules: string[];
  inquiryType: string | null;
  message: string;
  status: ContactInquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalStudents: number;
  activeStudents: number;
  monthlyFeeCollection: number;
  unpaidFeeCount: number;
  presentAttendanceCount: number;
}

export interface EnrollmentTrendPoint {
  month: string;
  count: number;
}

export interface FeeCollectionTrendPoint {
  month: string;
  collected: number;
}

export interface EnrollmentTrendPoint {
  month: string;
  count: number;
}

export interface FeeCollectionTrendPoint {
  month: string;
  collected: number;
}

export interface BatchCollectionPoint {
  batchId: string | null;
  batchName: string;
  batchCode: string;
  total: number;
}

export interface AttendanceStatusPoint {
  status: AttendanceStatus;
  total: number;
}

export interface ReminderChannelPoint {
  channel: ReminderChannel;
  count: number;
}

export interface StudentStatusPoint {
  status: StudentStatus;
  total: number;
}

export interface StudentBatchDistributionPoint {
  batchId: string;
  batchName: string;
  batchCode: string;
  total: number;
}

export interface BatchStatusPoint {
  status: "ACTIVE" | "INACTIVE";
  total: number;
}

export interface FeeStatusPoint {
  status: FeeRecordStatus;
  total: number;
}

export interface AttendanceDailyTrendPoint {
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
}

export interface AttendanceBatchPoint {
  batchId: string;
  batchName: string;
  batchCode: string;
  total: number;
}

export interface ReminderStatusPoint {
  status: ReminderStatus;
  total: number;
}

export interface ReminderDailyTrendPoint {
  date: string;
  total: number;
}

export interface UserRoleDistributionPoint {
  roleId: string;
  roleName: string;
  total: number;
}

export interface UserStatusPoint {
  status: "ACTIVE" | "INACTIVE";
  total: number;
}
