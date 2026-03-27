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
export type TimetableDayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type ClassDeliveryMode = "OFFLINE" | "ONLINE" | "HYBRID";
export type OnlineClassProvider = "GOOGLE_MEET" | "ZOOM";
export type OnlineClassSessionStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type SyncJobStatus = "PENDING" | "SUCCESS" | "FAILED";
export type StudentDocumentType = "ID_CARD" | "ADMISSION_FORM" | "BIRTH_CERTIFICATE" | "GUARDIAN_ID" | "ACADEMIC_RECORD" | "MEDICAL_RECORD" | "OTHER";
export type OrganizationAssetType = "LOGO" | "LETTERHEAD" | "STAMP" | "BROCHURE" | "OTHER";
export type OrganizationModule =
  | "USERS"
  | "STUDENTS"
  | "PORTALS"
  | "BATCHES"
  | "ACADEMICS"
  | "FEES"
  | "ATTENDANCE"
  | "REMINDERS"
  | "REPORTS"
  | "ACTIVITY_LOGS"
  | "SETTINGS"
  | "MEDIA";

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
  userLimit: number;
  studentLimit: number;
  enabledModules: OrganizationModule[];
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

export interface AcademicSession {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  code: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  organizationId: string;
  organizationName: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string;
  qualification: string | null;
  specialization: string | null;
  joinedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BatchSubjectAssignment {
  id: string;
  organizationId: string;
  organizationName: string;
  academicSessionId: string | null;
  academicSessionName: string | null;
  batchId: string;
  batchName: string;
  batchCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string | null;
  teacherName: string | null;
  weeklyClasses: number;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimetableEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  academicSessionId: string | null;
  academicSessionName: string | null;
  batchId: string;
  batchName: string;
  batchCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string | null;
  teacherName: string | null;
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  deliveryMode: ClassDeliveryMode;
  onlineClassProvider: OnlineClassProvider | null;
  onlineMeetingUrl: string | null;
  onlineMeetingCode: string | null;
  externalCalendarEventId: string | null;
  autoAttendanceEnabled: boolean;
  attendanceJoinThresholdMinutes: number;
  room: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineClassParticipantSession {
  id: string;
  studentId: string | null;
  studentName: string | null;
  participantEmail: string | null;
  participantName: string | null;
  externalParticipantId: string | null;
  joinedAt: string;
  leftAt: string | null;
  totalMinutes: number;
  attendanceMarked: boolean;
}

export interface OnlineClassSession {
  id: string;
  organizationId: string;
  organizationName: string;
  timetableEntryId: string;
  academicSessionId: string | null;
  academicSessionName: string | null;
  batchId: string;
  batchName: string;
  batchCode: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherId: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  provider: OnlineClassProvider;
  status: OnlineClassSessionStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  actualStartAt: string | null;
  actualEndAt: string | null;
  meetingUrl: string | null;
  meetingCode: string | null;
  externalCalendarEventId: string | null;
  externalSpaceId: string | null;
  externalConferenceRecordId: string | null;
  lastParticipantSyncAt: string | null;
  lastParticipantSyncStatus: SyncJobStatus;
  lastParticipantSyncError: string | null;
  attendanceProcessedAt: string | null;
  participantSessions: OnlineClassParticipantSession[];
  createdAt: string;
  updatedAt: string;
}

export interface OnlineClassProviderSetting {
  id: string;
  organizationId: string;
  provider: OnlineClassProvider;
  integrationEnabled: boolean;
  autoCreateMeetLinks: boolean;
  autoSyncParticipants: boolean;
  calendarId: string | null;
  impersonatedUserEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineClassAutomationRun {
  id: string;
  organizationId: string | null;
  triggeredByUserId: string | null;
  status: SyncJobStatus;
  generatedCount: number;
  syncedCount: number;
  attendanceProcessedCount: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnlineClassAutomationSummary {
  lastRun: OnlineClassAutomationRun | null;
  recentRuns: OnlineClassAutomationRun[];
  failedSessionsCount: number;
  pendingAttendanceCount: number;
  upcomingSessions: OnlineClassSession[];
}

export interface OnlineClassAlert {
  id: string;
  type: "SYNC_FAILED" | "PENDING_ATTENDANCE" | "CLASS_STARTING_SOON";
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  sessionId: string | null;
  scheduledAt: string | null;
}

export interface ExamSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalMarks: number;
  passMarks: number;
}

export interface Exam {
  id: string;
  organizationId: string;
  organizationName: string;
  academicSessionId: string | null;
  academicSessionName: string | null;
  batchId: string;
  batchName: string;
  batchCode: string;
  teacherId: string | null;
  teacherName: string | null;
  name: string;
  code: string;
  description: string | null;
  examDate: string;
  isPublished: boolean;
  subjects: ExamSubject[];
  createdAt: string;
  updatedAt: string;
}

export type StudentExamResultStatus = "DRAFT" | "PUBLISHED";
export type PortalAccountType = "STUDENT" | "PARENT";

export interface ExamResultItem {
  id: string;
  examSubjectId: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  obtainedMarks: number;
  totalMarks: number;
  passMarks: number;
  grade: string | null;
  remarks: string | null;
}

export interface ExamResult {
  id: string;
  organizationId: string;
  organizationName: string;
  academicSessionId: string | null;
  academicSessionName: string | null;
  examId: string;
  examName: string;
  examCode: string;
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  totalObtained: number;
  percentage: number;
  grade: string | null;
  remarks: string | null;
  status: StudentExamResultStatus;
  publishedAt: string | null;
  items: ExamResultItem[];
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

export interface StudentDetail extends Student {
  academicSummary?: {
    publishedResults: number;
    latestPercentage: number | null;
    latestGrade: string | null;
    recentResults: Array<{
      id: string;
      examName: string;
      batchName: string;
      percentage: number;
      grade: string | null;
      publishedAt: string | null;
      items: Array<{
        subjectName: string;
        obtainedMarks: number;
        totalMarks: number;
        grade: string | null;
      }>;
    }>;
    timetable: Array<{
      id: string;
      dayOfWeek: TimetableDayOfWeek;
      startTime: string;
      endTime: string;
      subjectName: string;
      teacherName: string | null;
      room: string | null;
      batchName: string;
    }>;
  } | null;
}

export interface StudentDocument {
  id: string;
  organizationId: string;
  studentId: string;
  uploadedByUserId: string | null;
  title: string;
  type: StudentDocumentType;
  notes: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationAsset {
  id: string;
  organizationId: string;
  uploadedByUserId: string | null;
  title: string;
  type: OrganizationAssetType;
  notes: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortalAccessAccount {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface StudentPortalAccess {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  guardianEmail: string | null;
  studentAccount: PortalAccessAccount | null;
  parentAccount: PortalAccessAccount | null;
}

export interface PortalDashboard {
  accountType: PortalAccountType;
  student: {
    id: string;
    fullName: string;
    guardianName: string;
    email: string | null;
    guardianEmail: string | null;
    phone: string;
    guardianPhone: string;
    status: StudentStatus;
    organizationName: string;
    batches: Array<{ id: string; name: string; code: string }>;
  };
  feeSummary: {
    totalDue: number;
    totalPaid: number;
    pendingAmount: number;
    overdueCount: number;
    recentRecords: Array<{
      id: string;
      month: number;
      year: number;
      amountDue: number;
      amountPaid: number;
      status: FeeRecordStatus;
      paidAt: string | null;
    }>;
  };
  attendanceSummary: {
    totalEntries: number;
    attendanceRate: number;
    breakdown: Array<{ status: AttendanceStatus; total: number }>;
    recentRecords: Array<{
      id: string;
      attendanceDate: string;
      status: AttendanceStatus;
      notes: string | null;
      batchName: string;
    }>;
  };
  reminderSummary: {
    total: number;
    sent: number;
    failed: number;
    recentRecords: Array<{
      id: string;
      channel: ReminderChannel;
      status: ReminderStatus;
      createdAt: string;
      message: string;
    }>;
  };
  academicSummary: {
    publishedResults: number;
    latestPercentage: number | null;
    latestGrade: string | null;
    recentResults: Array<{
      id: string;
      examName: string;
      batchName: string;
      percentage: number;
      grade: string | null;
      publishedAt: string | null;
      items: Array<{
        subjectName: string;
        obtainedMarks: number;
        totalMarks: number;
        grade: string | null;
      }>;
    }>;
    timetable: Array<{
      id: string;
      dayOfWeek: TimetableDayOfWeek;
      startTime: string;
      endTime: string;
      subjectName: string;
      teacherName: string | null;
      room: string | null;
      batchName: string;
    }>;
  };
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

export interface AcademicDashboardSummary {
  totalExams: number;
  publishedExams: number;
  totalResults: number;
  publishedResults: number;
  averagePercentage: number;
}

export interface GradeDistributionPoint {
  grade: string;
  total: number;
}

export interface ExamSchedulePoint {
  month: string;
  count: number;
}

export interface BatchPerformancePoint {
  batchId: string;
  batchName: string;
  batchCode: string;
  averagePercentage: number;
}

export interface ResultStatusPoint {
  status: string;
  total: number;
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

export interface FeeCollectionPeriodSummary {
  label: string;
  billed: number;
  collected: number;
  pending: number;
  overdue: number;
  collectionRate: number;
}

export interface FeeCollectionOverview {
  currentMonth: FeeCollectionPeriodSummary;
  currentQuarter: FeeCollectionPeriodSummary;
  currentYear: FeeCollectionPeriodSummary;
}

export interface FeeCollectionComparisonPoint {
  period: "MONTH" | "QUARTER" | "YEAR";
  currentCollected: number;
  previousCollected: number;
  currentPending: number;
  previousPending: number;
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
