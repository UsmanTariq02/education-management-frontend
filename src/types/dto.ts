import type {
  ContactInquiryStatus,
  AttendanceStatus,
  FeeRecordStatus,
  PaymentMethod,
  ReminderAutomationTrigger,
  ReminderChannel,
  ReminderRecipientTarget,
  ReminderStatus,
  StudentStatus,
} from "@/types/domain";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

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
}

export interface UpdateOrganizationDto extends Partial<CreateOrganizationDto> {}

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
