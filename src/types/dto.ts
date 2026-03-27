import type {
  BillingEntryStatus,
  BillingEntryType,
  ContactInquiryStatus,
  OrganizationModule,
  SubscriptionStatus,
  AttendanceStatus,
  FeeRecordStatus,
  OrganizationAssetType,
  PortalAccountType,
  PaymentMethod,
  ReminderAutomationTrigger,
  ReminderChannel,
  ReminderRecipientTarget,
  ReminderStatus,
  StudentStatus,
  StudentDocumentType,
  StudentExamResultStatus,
  TimetableDayOfWeek,
  ClassDeliveryMode,
  OnlineClassProvider,
  OnlineClassSessionStatus,
} from "@/types/domain";

export interface LoginDto {
  email: string;
  password: string;
}

export interface PortalLoginDto {
  email: string;
  password: string;
  accountType: PortalAccountType;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface PortalRefreshTokenDto extends RefreshTokenDto {}

export interface LogoutDto {
  reason?: string;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  organizationId?: string;
  isActive?: boolean;
  roleIds: string[];
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  trialDays?: number;
  trialStartsAt?: string;
  trialEndsAt?: string;
  subscriptionStartsAt?: string;
  subscriptionEndsAt?: string;
  subscriptionNotes?: string;
  userLimit?: number;
  studentLimit?: number;
  enabledModules?: OrganizationModule[];
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {}

export interface CreateOrganizationBillingEntryDto {
  type: BillingEntryType;
  status?: BillingEntryStatus;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  dueDate?: string;
  entryDate?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface CreateContactInquiryDto {
  fullName: string;
  email: string;
  institutionName: string;
  phone?: string;
  institutionType?: string;
  expectedUserCount?: string;
  requestedModules: string[];
  inquiryType?: string;
  message: string;
}

export interface UpdateContactInquiryStatusDto {
  status: ContactInquiryStatus;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  guardianName: string;
  guardianEmail?: string;
  guardianPhone: string;
  address?: string;
  dateOfBirth?: string;
  admissionDate: string;
  status?: StudentStatus;
  batchIds?: string[];
}

export interface UpdateStudentDto extends Partial<CreateStudentDto> {}

export interface UpsertPortalAccessDto {
  studentEnabled?: boolean;
  studentPassword?: string;
  parentEnabled?: boolean;
  parentPassword?: string;
}

export interface CreateStudentDocumentDto {
  title: string;
  type: StudentDocumentType;
  notes?: string;
}

export interface CreateOrganizationAssetDto {
  title: string;
  type: OrganizationAssetType;
  notes?: string;
}

export interface CreateBatchDto {
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate?: string;
  scheduleInfo?: string;
  isActive?: boolean;
}

export interface UpdateBatchDto extends Partial<CreateBatchDto> {}

export interface CreateAcademicSessionDto {
  name: string;
  code: string;
  description?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
}

export interface UpdateAcademicSessionDto extends Partial<CreateAcademicSessionDto> {}

export interface CreateSubjectDto {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSubjectDto extends Partial<CreateSubjectDto> {}

export interface CreateTeacherDto {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  qualification?: string;
  specialization?: string;
  joinedAt: string;
  isActive?: boolean;
  createLoginAccess?: boolean;
  accessPassword?: string;
  accessIsActive?: boolean;
}

export interface UpdateTeacherDto extends Partial<CreateTeacherDto> {}

export interface CreateBatchSubjectAssignmentDto {
  academicSessionId?: string;
  batchId: string;
  subjectId: string;
  teacherId?: string;
  weeklyClasses?: number;
  isPrimary?: boolean;
  isActive?: boolean;
}

export interface UpdateBatchSubjectAssignmentDto extends Partial<CreateBatchSubjectAssignmentDto> {}

export interface CreateTimetableEntryDto {
  academicSessionId?: string;
  batchId: string;
  subjectId: string;
  teacherId?: string;
  dayOfWeek: TimetableDayOfWeek;
  startTime: string;
  endTime: string;
  deliveryMode?: ClassDeliveryMode;
  onlineClassProvider?: OnlineClassProvider;
  onlineMeetingUrl?: string;
  onlineMeetingCode?: string;
  externalCalendarEventId?: string;
  autoAttendanceEnabled?: boolean;
  attendanceJoinThresholdMinutes?: number;
  room?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateTimetableEntryDto extends Partial<CreateTimetableEntryDto> {}

export interface CreateOnlineClassSessionDto {
  timetableEntryId: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
}

export interface UpdateOnlineClassSessionDto {
  status?: OnlineClassSessionStatus;
  actualStartAt?: string;
  actualEndAt?: string;
  meetingUrl?: string;
  meetingCode?: string;
  externalCalendarEventId?: string;
  externalSpaceId?: string;
  externalConferenceRecordId?: string;
}

export interface UpsertOnlineClassProviderSettingDto {
  provider?: OnlineClassProvider;
  integrationEnabled?: boolean;
  autoCreateMeetLinks?: boolean;
  autoSyncParticipants?: boolean;
  calendarId?: string;
  impersonatedUserEmail?: string;
}

export interface OnlineClassParticipantInputDto {
  studentId?: string;
  participantEmail?: string;
  participantName?: string;
  externalParticipantId?: string;
  joinedAt: string;
  leftAt?: string;
  totalMinutes: number;
}

export interface CreateExamSubjectDto {
  subjectId: string;
  totalMarks: number;
  passMarks: number;
}

export interface CreateExamDto {
  academicSessionId?: string;
  batchId: string;
  teacherId?: string;
  name: string;
  code: string;
  description?: string;
  examDate: string;
  isPublished?: boolean;
  subjects: CreateExamSubjectDto[];
}

export interface UpdateExamDto extends Partial<CreateExamDto> {}

export interface CreateExamResultItemDto {
  examSubjectId: string;
  subjectId: string;
  obtainedMarks: number;
  remarks?: string;
}

export interface CreateExamResultDto {
  examId: string;
  studentId: string;
  remarks?: string;
  status?: StudentExamResultStatus;
  items: CreateExamResultItemDto[];
}

export interface UpdateExamResultDto extends Partial<CreateExamResultDto> {}

export interface CreateFeePlanDto {
  studentId: string;
  batchId?: string;
  monthlyFee: number;
  dueDay: number;
  isActive?: boolean;
}

export interface CreateFeeRecordDto {
  studentId: string;
  batchId?: string;
  feePlanId: string;
  month: number;
  year: number;
  amountDue: number;
  amountPaid?: number;
  status?: FeeRecordStatus;
  paymentMethod?: PaymentMethod;
  remarks?: string;
}

export interface UpdateFeeRecordDto extends Partial<CreateFeeRecordDto> {}

export interface CreateAttendanceDto {
  studentId: string;
  batchId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface UpdateAttendanceDto extends Partial<CreateAttendanceDto> {}

export interface CreateReminderLogDto {
  studentId: string;
  feeRecordId?: string;
  channel: ReminderChannel;
  message: string;
  status?: ReminderStatus;
}

export interface UpdateReminderLogDto extends Partial<CreateReminderLogDto> {}

export interface CreateReminderTemplateDto {
  name: string;
  code: string;
  channel: ReminderChannel;
  target: ReminderRecipientTarget;
  subject?: string;
  body: string;
  isActive?: boolean;
}

export interface UpdateReminderTemplateDto extends Partial<CreateReminderTemplateDto> {}

export interface CreateReminderRuleDto {
  name: string;
  templateId: string;
  trigger: ReminderAutomationTrigger;
  offsetDays?: number;
  isActive?: boolean;
}

export interface UpdateReminderRuleDto extends Partial<CreateReminderRuleDto> {}

export interface UpsertReminderProviderSettingDto {
  autoRemindersEnabled?: boolean;
  emailEnabled?: boolean;
  whatsappEnabled?: boolean;
  smsEnabled?: boolean;
  paymentConfirmationEnabled?: boolean;
  senderName?: string;
  replyToEmail?: string;
}
