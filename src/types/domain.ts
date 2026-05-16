export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "GRADUATED";
export type StudentBatchStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";
export type FeeRecordStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
export type ReminderChannel = "SMS" | "WHATSAPP" | "EMAIL" | "MANUAL";
export type ReminderStatus = "PENDING" | "SENT" | "FAILED";
export type ReminderAutomationTrigger = "FEE_DUE" | "FEE_OVERDUE" | "PAYMENT_RECEIVED";
export type ReminderRecipientTarget = "STUDENT" | "GUARDIAN" | "BOTH";
export type MailMessageStatus = "DRAFT" | "SENT";
export type MailRecipientType = "TO" | "CC" | "BCC";
export type MailAudienceGroup = "STAFF" | "TEACHER" | "STUDENT" | "PARENT";
export type ReminderScheduleStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "CANCELLED" | "SKIPPED";
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "ONLINE" | "CHEQUE" | "OTHER";
export type ContactInquiryStatus = "NEW" | "REVIEWED" | "CONTACTED";
export type TimetableDayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type ClassDeliveryMode = "OFFLINE" | "ONLINE" | "HYBRID";
export type OnlineClassProvider = "GOOGLE_MEET" | "ZOOM";
export type OnlineClassSessionStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type SyncJobStatus = "PENDING" | "SUCCESS" | "FAILED";
export type AssessmentType = "QUIZ" | "TEST" | "ASSIGNMENT" | "PRACTICE";
export type AssessmentQuestionType = "MCQ" | "TRUE_FALSE" | "FILL_IN_THE_BLANK" | "SHORT_ANSWER" | "LONG_ANSWER";
export type AssessmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type AssessmentResultStatus = "PROVISIONAL" | "FINALIZED";
export type StudentDocumentType = "ID_CARD" | "ADMISSION_FORM" | "BIRTH_CERTIFICATE" | "GUARDIAN_ID" | "ACADEMIC_RECORD" | "MEDICAL_RECORD" | "OTHER";
export type OrganizationAssetType = "LOGO" | "LETTERHEAD" | "STAMP" | "BROCHURE" | "OTHER";
export type AiPromptPreset = "STANDARD" | "CONCISE" | "FRIENDLY" | "FORMAL" | "PARENT" | "STAFF" | "FINANCE";
export type AiReviewKind = "NOTICE" | "NOTICE_CAMPAIGN" | "MAIL" | "SUPPORT" | "ADMISSION" | "RISK" | "FEES" | "ATTENDANCE" | "REMINDER";
export type AiReviewStatus = "DRAFT" | "APPROVED" | "ARCHIVED";
export type OrganizationModule =
  | "USERS"
  | "STUDENTS"
  | "PORTALS"
  | "BATCHES"
  | "ACADEMICS"
  | "FEES"
  | "ATTENDANCE"
  | "REMINDERS"
  | "MAIL"
  | "REPORTS"
  | "ACTIVITY_LOGS"
  | "SETTINGS"
  | "MEDIA";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";
export type BillingEntryType = "SUBSCRIPTION" | "TRIAL_EXTENSION" | "ADJUSTMENT" | "MANUAL_INVOICE";
export type BillingEntryStatus = "OPEN" | "PAID" | "VOID";

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
  subscriptionStatus: SubscriptionStatus;
  trialDays: number;
  trialStartsAt: string;
  trialEndsAt: string | null;
  subscriptionStartsAt: string | null;
  subscriptionEndsAt: string | null;
  subscriptionNotes: string | null;
  aiDraftApprovalRequired: boolean;
  userLimit: number;
  studentLimit: number;
  hasOpenAiApiKey: boolean;
  hasTrialAiAccess: boolean;
  openAiApiKeyUpdatedAt: string | null;
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

export interface OrganizationBillingEntry {
  id: string;
  organizationId: string;
  type: BillingEntryType;
  status: BillingEntryStatus;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  dueDate: string | null;
  entryDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  userCountSnapshot: number | null;
  moduleCountSnapshot: number | null;
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

export interface AssessmentQuestionOption {
  id: string;
  text: string;
  orderIndex: number;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  helperText: string | null;
  explanation: string | null;
  orderIndex: number;
  marks: number;
  acceptedAnswers: string[];
  correctBooleanAnswer: boolean | null;
  options: AssessmentQuestionOption[];
}

export interface Assessment {
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
  title: string;
  code: string;
  description: string | null;
  instructions: string | null;
  type: AssessmentType;
  status: AssessmentStatus;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  startsAt: string | null;
  endsAt: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  allowMultipleAttempts: boolean;
  maxAttempts: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingPerWrong: number | null;
  questionCount: number;
  questions: AssessmentQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface PortalAssessmentAttemptAnswer {
  questionId: string;
  selectedOptionId: string | null;
  answerText: string | null;
  awardedMarks: number | null;
  isCorrect: boolean | null;
  feedback: string | null;
}

export type AssessmentAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "AUTO_GRADED" | "REVIEW_PENDING" | "COMPLETED";

export interface PortalAssessmentAttempt {
  id: string;
  status: AssessmentAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  requiresManualReview: boolean;
  obtainedMarks: number | null;
  totalMarks: number | null;
  percentage: number | null;
  resultStatus: AssessmentResultStatus | null;
  answers: PortalAssessmentAttemptAnswer[];
}

export interface PortalAssessmentListItem {
  id: string;
  title: string;
  code: string;
  subjectName: string;
  batchName: string;
  type: AssessmentType;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  startsAt: string | null;
  endsAt: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  showResultImmediately: boolean;
  questionCount: number;
  latestAttempt: {
    id: string;
    status: AssessmentAttemptStatus;
    attemptNumber: number;
    submittedAt: string | null;
    resultStatus: AssessmentResultStatus | null;
    percentage: number | null;
  } | null;
}

export interface PortalAssessmentQuestion {
  id: string;
  type: AssessmentQuestionType;
  prompt: string;
  helperText: string | null;
  orderIndex: number;
  marks: number;
  options: Array<{
    id: string;
    text: string;
    orderIndex: number;
  }>;
}

export interface PortalAssessmentDetail {
  id: string;
  title: string;
  code: string;
  description: string | null;
  instructions: string | null;
  subjectName: string;
  batchName: string;
  type: AssessmentType;
  durationMinutes: number;
  totalMarks: number;
  passMarks: number;
  startsAt: string | null;
  endsAt: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  showResultImmediately: boolean;
  allowMultipleAttempts: boolean;
  maxAttempts: number;
  questionCount: number;
  questions: PortalAssessmentQuestion[];
  activeAttempt: PortalAssessmentAttempt | null;
}

export interface PortalAssessmentSubmitResult {
  attemptId: string;
  status: AssessmentResultStatus;
  requiresManualReview: boolean;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredCount: number;
  answers: PortalAssessmentAttemptAnswer[];
}

export interface PortalReportCard {
  studentId: string;
  studentName: string;
  batchName: string;
  batchCode: string;
  classRank: number | null;
  classSize: number;
  overallPercentage: number;
  overallGrade: string;
  examPercentage: number | null;
  assessmentPercentage: number | null;
  assignmentPercentage: number | null;
  publishedExamCount: number;
  finalizedAssessmentCount: number;
  reviewedAssignmentCount: number;
  focusAreas: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    combinedPercentage: number | null;
    message: string;
  }>;
  subjectBreakdown: Array<{
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    examPercentage: number | null;
    assessmentPercentage: number | null;
    assignmentPercentage: number | null;
    combinedPercentage: number | null;
  }>;
}

export type PortalActivityFeedKind = "REMINDER" | "ASSIGNMENT_FEEDBACK" | "ASSESSMENT_FEEDBACK" | "RESULT_PUBLISHED";

export interface PortalActivityFeedItem {
  id: string;
  kind: PortalActivityFeedKind;
  title: string;
  description: string;
  occurredAt: string;
  status: string | null;
  subjectName: string | null;
  scoreLabel: string | null;
  actorName: string | null;
}

export type PortalAcknowledgementKind = "FEE_DUE" | "ASSIGNMENT_FEEDBACK" | "ASSESSMENT_RESULT" | "EXAM_RESULT" | "ANNOUNCEMENT";

export interface PortalAcknowledgementItem {
  itemKey: string;
  kind: PortalAcknowledgementKind;
  title: string;
  description: string;
  occurredAt: string;
  acknowledgedAt: string | null;
  actorName: string | null;
  subjectName: string | null;
  scoreLabel: string | null;
}

export interface PortalDocument {
  id: string;
  title: string;
  kind: "UPLOADED" | "GENERATED";
  category: "ACADEMIC" | "STUDENT_RECORD";
  fileName: string;
  mimeType: string;
  createdAt: string;
  description: string | null;
}

export interface PortalAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  audience: "STUDENT" | "PARENT" | "BOTH";
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  acknowledgedAt: string | null;
}

export interface PortalFeePaymentProof {
  id: string;
  title: string;
  notes: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  status: "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED";
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface PortalFeeRecord {
  id: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid: number;
  pendingAmount: number;
  status: string;
  paidAt: string | null;
  remarks: string | null;
  paymentMethod: string | null;
  proofs: PortalFeePaymentProof[];
}

export interface AssessmentReviewAnswer {
  id: string;
  questionId: string;
  prompt: string;
  type: AssessmentQuestionType;
  maxMarks: number;
  answerText: string | null;
  selectedOptionText: string | null;
  awardedMarks: number | null;
  isCorrect: boolean | null;
  feedback: string | null;
  reviewedAt: string | null;
}

export interface AssessmentReviewAttempt {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  status: AssessmentAttemptStatus;
  attemptNumber: number;
  submittedAt: string | null;
  requiresManualReview: boolean;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  resultStatus: AssessmentResultStatus;
  answers: AssessmentReviewAnswer[];
}

export interface AssessmentReviewQueue {
  assessmentId: string;
  assessmentTitle: string;
  totalAttempts: number;
  reviewPendingAttempts: number;
  completedAttempts: number;
  attempts: AssessmentReviewAttempt[];
}

export interface AssessmentAnalytics {
  assessmentId: string;
  assessmentTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  averagePercentage: number;
  passRate: number;
  topScore: number | null;
  lowestScore: number | null;
  questionBreakdown: Array<{
    questionId: string;
    prompt: string;
    type: AssessmentQuestionType;
    maxMarks: number;
    averageAwardedMarks: number;
    correctResponses: number;
    attemptedResponses: number;
    accuracyRate: number;
  }>;
}

export type StudentExamResultStatus = "DRAFT" | "PUBLISHED";
export type AssignmentStatus = "DRAFT" | "PUBLISHED" | "CLOSED";
export type AssignmentSubmissionStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
export type PortalAccountType = "STUDENT" | "PARENT";

export interface AssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  status: AssignmentSubmissionStatus;
  submissionText: string | null;
  attachmentLinks: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  awardedMarks: number | null;
  reviewedByTeacherId: string | null;
  reviewedByTeacherName: string | null;
}

export interface Assignment {
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
  title: string;
  code: string;
  description: string | null;
  instructions: string | null;
  status: AssignmentStatus;
  maxMarks: number;
  dueAt: string;
  allowLateSubmission: boolean;
  publishedAt: string | null;
  submissionCount: number;
  reviewedCount: number;
  submissions: AssignmentSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface PortalAssignmentSubmission {
  id: string;
  status: AssignmentSubmissionStatus;
  submissionText: string | null;
  attachmentLinks: string[];
  submittedAt: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  awardedMarks: number | null;
  reviewedByTeacherName: string | null;
}

export interface PortalAssignmentListItem {
  id: string;
  title: string;
  code: string;
  subjectName: string;
  batchName: string;
  teacherName: string | null;
  maxMarks: number;
  dueAt: string;
  status: AssignmentStatus;
  allowLateSubmission: boolean;
  submission: PortalAssignmentSubmission | null;
}

export interface PortalAssignmentDetail {
  id: string;
  title: string;
  code: string;
  description: string | null;
  instructions: string | null;
  subjectName: string;
  batchName: string;
  teacherName: string | null;
  maxMarks: number;
  dueAt: string;
  status: AssignmentStatus;
  allowLateSubmission: boolean;
  canSubmit: boolean;
  submission: PortalAssignmentSubmission | null;
}

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
    assessmentSummary: {
      availableCount: number;
      inProgressCount: number;
      completedCount: number;
      upcoming: Array<{
        id: string;
        title: string;
        subjectName: string;
        type: AssessmentType;
        availableUntil: string | null;
        durationMinutes: number;
      }>;
      recentAttempts: Array<{
        attemptId: string;
        assessmentId: string;
        title: string;
        subjectName: string;
        status: AssessmentAttemptStatus;
        percentage: number | null;
        submittedAt: string | null;
      }>;
    };
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

export interface WeeklyPrincipalSummary {
  organizationId: string | null;
  organizationName: string;
  generatedAt: string;
  headline: string;
  overview: string;
  highlights: string[];
  risks: string[];
  nextActions: string[];
}

export interface FeeEscalationOrganizationSummary {
  organizationId: string;
  organizationName: string;
  candidateRecords: number;
  remindersCreated: number;
  remindersSkipped: number;
}

export interface FeeEscalationAutomationSummary {
  processedOrganizations: number;
  candidateRecords: number;
  remindersCreated: number;
  remindersSkipped: number;
  organizations: FeeEscalationOrganizationSummary[];
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

export interface AttendanceFollowUpOrganizationSummary {
  organizationId: string;
  organizationName: string;
  candidateStudents: number;
  remindersCreated: number;
  remindersSkipped: number;
}

export interface AttendanceFollowUpAutomationSummary {
  processedOrganizations: number;
  candidateStudents: number;
  remindersCreated: number;
  remindersSkipped: number;
  organizations: AttendanceFollowUpOrganizationSummary[];
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

export interface MailConversation {
  id: string;
  organizationId: string;
  subject: string;
  createdByEmail: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailRecipient {
  id: string;
  mailMessageId: string;
  email: string;
  name: string | null;
  recipientType: MailRecipientType;
  readAt: string | null;
  starredAt: string | null;
  archivedAt: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MailMessage {
  id: string;
  organizationId: string;
  conversationId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  body: string;
  status: MailMessageStatus;
  sentAt: string | null;
  senderReadAt: string | null;
  senderStarredAt: string | null;
  senderArchivedAt: string | null;
  senderTrashedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recipients: MailRecipient[];
  conversation?: MailConversation;
}

export interface MailMailboxItem extends MailMessage {
  conversationSubject: string;
  bodyPreview: string;
  isSender: boolean;
  folder: "inbox" | "sent" | "drafts" | "starred" | "trash" | "all";
  state: {
    readAt: string | null;
    starredAt: string | null;
    archivedAt: string | null;
    trashedAt: string | null;
  };
  unread: boolean;
}

export interface MailFolderCounts {
  inbox: { total: number; unread: number };
  sent: { total: number; unread: number };
  drafts: { total: number; unread: number };
  starred: { total: number; unread: number };
  trash: { total: number; unread: number };
}

export interface MailMailboxResponse {
  items: MailMailboxItem[];
  total: number;
  page: number;
  limit: number;
  counts: MailFolderCounts;
}

export interface MailConversationDetail {
  id: string;
  organizationId: string;
  subject: string;
  createdByEmail: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messages: MailMailboxItem[];
}

export interface MailContact {
  email: string;
  name: string;
  role: string;
  kind: "USER" | "TEACHER" | "STUDENT" | "PORTAL";
  audienceGroup?: MailAudienceGroup;
}

export interface AiNoticeDraft {
  title: string;
  subject: string;
  body: string;
  audienceSummary: string;
  tone: string;
  callToAction: string;
  keyPoints: string[];
}

export type NoticeCampaignAudience = "STUDENT" | "PARENT" | "BOTH";

export interface NoticeCampaignSummary {
  id: string;
  title: string;
  category: string;
  audience: NoticeCampaignAudience;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  targetScope: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeCampaignAnalytics {
  organizationId: string;
  organizationName: string;
  totalCampaigns: number;
  publishedCampaigns: number;
  scheduledCampaigns: number;
  pinnedCampaigns: number;
  expiringSoonCampaigns: number;
  audienceBreakdown: Array<{ audience: NoticeCampaignAudience; count: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
  latestPublishedAt: string | null;
}

export interface AnnouncementDeliveryAnalytics {
  organizationId: string;
  organizationName: string;
  publishedAnnouncements: number;
  activeAnnouncements: number;
  pinnedAnnouncements: number;
  deliveryTargets: number;
  readReceipts: number;
  uniqueReadAnnouncements: number;
  readRate: number;
  audienceBreakdown: Array<{ audience: "STUDENT" | "PARENT" | "BOTH"; count: number }>;
  latestPublishedAt: string | null;
}

export interface AiReviewItem {
  id: string;
  kind: AiReviewKind;
  title: string;
  summary: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  status: AiReviewStatus;
  archivedAt: string | null;
  approvedAt: string | null;
}

export interface AiReviewQueueSummary {
  organizationId: string;
  organizationName: string;
  totalItems: number;
  draftItems: number;
  approvedItems: number;
  archivedItems: number;
  kindBreakdown: Array<{ kind: string; count: number }>;
  latestCreatedAt: string | null;
  latestUpdatedAt: string | null;
  latestApprovedAt: string | null;
  latestArchivedAt: string | null;
}

export interface AiOrganizationQueueSummary {
  organizationId: string;
  organizationName: string;
  totalItems: number;
  draftItems: number;
  approvedItems: number;
  archivedItems: number;
  kindBreakdown: Array<{ kind: string; count: number }>;
  userBreakdown: Array<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    count: number;
    latestUpdatedAt: string | null;
  }>;
  latestCreatedAt: string | null;
  latestUpdatedAt: string | null;
}

export interface AiOrganizationQueueTrendPoint {
  date: string;
  createdCount: number;
  updatedCount: number;
  draftCount: number;
  approvedCount: number;
  archivedCount: number;
}

export interface AiMailDraft {
  subject: string;
  body: string;
  tone: string;
  followUp: string;
  keyPoints: string[];
}

export interface AiSupportReply {
  reply: string;
  escalationNeeded: boolean;
  reason: string;
  suggestedActions: string[];
}

export interface AiStudentRiskRecommendation {
  overview: string;
  riskLevel: string;
  keySignals: string[];
  recommendedActions: string[];
  parentMessageDraft: string;
  staffNote: string;
  escalationNeeded: boolean;
  confidence: number;
}

export interface AiFeeCollectionPlan {
  overview: string;
  riskLevel: string;
  keySignals: string[];
  collectionStrategy: string;
  recommendedActions: string[];
  parentMessageDraft: string;
  internalNote: string;
  escalationNeeded: boolean;
  confidence: number;
}

export interface AiAttendanceIntervention {
  overview: string;
  riskLevel: string;
  keySignals: string[];
  recommendedActions: string[];
  parentMessageDraft: string;
  staffNote: string;
  escalationNeeded: boolean;
  confidence: number;
}

export interface AiReminderDraft {
  subject: string;
  body: string;
  audienceSummary: string;
  tone: string;
  callToAction: string;
  keyPoints: string[];
  deliveryTip: string;
  confidence: number;
}

export interface AiUsageBreakdownItem {
  provider?: string;
  schemaName?: string;
  count: number;
}

export interface AiUsageSummary {
  organizationId: string;
  organizationName: string;
  trialAccess: boolean;
  todayCount: number;
  weekCount: number;
  monthCount: number;
  trialTodayCount: number;
  trialDailyLimit: number;
  trialRemaining: number;
  lastGeneratedAt: string | null;
  providerBreakdown: Array<{ provider: "openai" | "groq"; count: number }>;
  schemaBreakdown: Array<{ schemaName: string; count: number }>;
}

export interface AiAdmissionExtractionStudent {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  address: string;
  dateOfBirth: string;
  admissionDate: string;
  status: StudentStatus;
  batchCodes: string[];
}

export interface AiAdmissionExtraction {
  student: AiAdmissionExtractionStudent;
  missingFields: string[];
  notes: string[];
  confidence: number;
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

export interface UnifiedReportCardSubjectPoint {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  examPercentage: number | null;
  assessmentPercentage: number | null;
  assignmentPercentage: number | null;
  combinedPercentage: number | null;
}

export interface UnifiedReportCard {
  studentId: string;
  studentName: string;
  batchId: string | null;
  batchName: string;
  batchCode: string;
  overallPercentage: number;
  overallGrade: string;
  examPercentage: number | null;
  assessmentPercentage: number | null;
  assignmentPercentage: number | null;
  publishedExamCount: number;
  finalizedAssessmentCount: number;
  reviewedAssignmentCount: number;
  subjectBreakdown: UnifiedReportCardSubjectPoint[];
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
