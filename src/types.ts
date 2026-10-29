export type UserRole = 'INSTITUTION_USER' | 'VERIFICATION_OFFICER' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  designation: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface Institution {
  id: string;
  aicteCode: string;
  name: string;
  category: 'Engineering & Tech' | 'Management' | 'Pharmacy' | 'Polytechnic' | 'Architecture';
  state: string;
  city: string;
  address: string;
  trustName: string;
  establishedYear: number;
  contactEmail: string;
  contactPhone: string;
  totalApprovedFDRs: number;
  totalDepositAmountINR: number;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CORRECTION_REQUIRED';

export type FdrLifecycleStatus =
  | 'ACTIVE'
  | 'MATURITY_APPROACHING'
  | 'MATURED'
  | 'RENEWAL_REQUESTED'
  | 'RELEASE_REQUESTED'
  | 'CLOSED';

export interface FdrDocument {
  id: string;
  fdrRecordId: string;
  documentType: 'FDR_RECEIPT' | 'BANK_CONFIRMATION' | 'JOINT_LIEN_LETTER' | 'RENEWAL_LETTER' | 'RELEASE_NOC' | 'OTHER';
  fileName: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storagePath: string;
  scanStatus: 'CLEAN' | 'PENDING_SCAN' | 'FLAGGED';
  uploadedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  version: number;
  uploadedAt: string;
  sha256Hash: string;
  ocrExtractedData?: any;
}

export interface VerificationComment {
  id: string;
  fdrRecordId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  action: 'SUBMIT' | 'START_REVIEW' | 'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | 'RESUBMIT';
  notes: string;
  reasonCategory?: string;
  createdAt: string;
}

export type PaymentMode = 'NEFT' | 'RTGS' | 'BANK_CHALLAN' | 'DIRECT_DEPOSIT' | 'DEMAND_DRAFT';

export interface InstitutionContactDetails {
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonMobile: string;
  contactPersonEmail: string;
}

export interface FDRRecord {
  id: string;
  trackingNumber: string;
  institutionId: string;
  institutionName: string;
  aicteCode: string;
  bankName: string;
  branchName: string;
  ifscCode: string;
  fdrNumber: string;
  depositAmountINR: number;
  issueDate: string;
  maturityDate: string;
  tenureMonths: number;
  interestRatePercent: number;
  depositPurpose: string;
  jointAccountHolders: string;
  paymentMode: PaymentMode;
  contactDetails: InstitutionContactDetails;
  refundReason: string;
  attachmentValidationStatus: 'VERIFIED' | 'PENDING' | 'DEFICIENT';
  trackingStage: 1 | 2 | 3 | 4 | 5;
  confirmationSentAt?: string;
  smsNotificationStatus?: 'SENT' | 'DELIVERED';
  emailNotificationStatus?: 'SENT' | 'DELIVERED';
  verificationStatus: VerificationStatus;
  lifecycleStatus: FdrLifecycleStatus;
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewDecisionAt?: string;
  reviewDecisionBy?: string;
  rejectionReason?: string;
  correctionRequirements?: string;
  documents: FdrDocument[];
  timeline: VerificationComment[];
  isDuplicateFlagged: boolean;
  duplicateNotes?: string;
  maturityAlertLevel?: 'NONE' | 'THIRTY_DAYS' | 'FIFTEEN_DAYS' | 'SEVEN_DAYS' | 'DUE_TODAY' | 'OVERDUE';
  lastAlertSentAt?: string;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  remarks?: string;
}

export interface RenewalRequest {
  id: string;
  fdrRecordId: string;
  institutionId: string;
  requestedBy: {
    id: string;
    name: string;
  };
  requestDate: string;
  proposedTenureMonths: number;
  proposedMaturityDate: string;
  justification: string;
  supportingDocumentId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface ReleaseRequest {
  id: string;
  fdrRecordId: string;
  institutionId: string;
  requestedBy: {
    id: string;
    name: string;
  };
  requestDate: string;
  reasonForRelease: 'PROGRAMME_CLOSURE' | 'EXCESS_CORPUS' | 'REPLACEMENT_GUARANTEE' | 'OTHER';
  nocDetails: string;
  supportingDocumentId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: {
    id: string;
    name: string;
  };
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface AuditLog {
  id: string;
  eventType: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetRecordId?: string;
  targetType?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  changeSummary: string;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  recipientRole?: UserRole;
  recipientUserId?: string;
  recipientInstitutionId?: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  linkedFdrId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  alertThresholdDays: number[];
  requireJointLienLetter: boolean;
  requireBankConfirmation: boolean;
  maxFileUploadSizeMB: number;
  duplicateMatchingThresholdPercent: number;
  enableAutomaticMaturityAlerts: boolean;
  enableOcrExtraction: boolean;
  maintenanceMode: boolean;
  updatedAt: string;
  updatedBy: string;
}
