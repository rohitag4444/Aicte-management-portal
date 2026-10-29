/**
 * Shared domain models & schemas for AICTE FDR Management Portal
 */

export type UserRole = 'INSTITUTION_USER' | 'VERIFICATION_OFFICER' | 'SYSTEM_ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string; // only for INSTITUTION_USER
  institutionName?: string;
  designation: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  passwordHash?: string;
}

export interface Institution {
  id: string;
  aicteCode: string; // e.g. "1-351299401"
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
  ocrExtractedData?: Record<string, any>;
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
  id: string; // Internal record identifier e.g. "FDR-2026-DEL-0012"
  trackingNumber: string; // AICTE official application tracking no. e.g. "AICTE/JFDR/2026/0491"
  institutionId: string;
  institutionName: string;
  aicteCode: string;

  // Bank & Deposit details
  bankName: string;
  branchName: string;
  ifscCode: string;
  fdrNumber: string; // Bank-issued receipt number
  depositAmountINR: number;
  issueDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  tenureMonths: number;
  interestRatePercent: number;
  depositPurpose: string;
  jointAccountHolders: string;
  
  // JFDR Specific Features
  paymentMode: PaymentMode;
  contactDetails: InstitutionContactDetails;
  refundReason: string; // e.g. "New Institute Mandatory Security Corpus", "Refund of Joint FDR upon Institute Closure", "Reduction in Intake", "Renewal / Extension of Joint FDR Period"
  attachmentValidationStatus: 'VERIFIED' | 'PENDING' | 'DEFICIENT';
  trackingStage: 1 | 2 | 3 | 4 | 5; // 1: Submitted, 2: Attachment Validation, 3: Scrutiny Officer, 4: Regional Approval, 5: Finance Clearance
  confirmationSentAt?: string;
  smsNotificationStatus?: 'SENT' | 'DELIVERED';
  emailNotificationStatus?: 'SENT' | 'DELIVERED';

  // Statuses
  verificationStatus: VerificationStatus;
  lifecycleStatus: FdrLifecycleStatus;

  // Review & Assignment
  assignedReviewerId?: string;
  assignedReviewerName?: string;
  reviewDecisionAt?: string;
  reviewDecisionBy?: string;
  rejectionReason?: string;
  correctionRequirements?: string; // Deficiency comments

  // Associated objects
  documents: FdrDocument[];
  timeline: VerificationComment[];

  // Flags & Monitoring
  isDuplicateFlagged: boolean;
  duplicateNotes?: string;
  maturityAlertLevel?: 'NONE' | 'THIRTY_DAYS' | 'FIFTEEN_DAYS' | 'SEVEN_DAYS' | 'DUE_TODAY' | 'OVERDUE';
  lastAlertSentAt?: string;
  
  // Metadata
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
  eventType:
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAILURE'
    | 'AUTH_LOGOUT'
    | 'FDR_CREATED'
    | 'FDR_UPDATED'
    | 'FDR_SUBMITTED'
    | 'FDR_RESUBMITTED'
    | 'FDR_APPROVED'
    | 'FDR_REJECTED'
    | 'FDR_CORRECTION_REQUESTED'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_DOWNLOADED'
    | 'DOCUMENT_VIEWED'
    | 'RENEWAL_REQUESTED'
    | 'RENEWAL_DECIDED'
    | 'RELEASE_REQUESTED'
    | 'RELEASE_DECIDED'
    | 'DUPLICATE_FLAGGED'
    | 'DATA_EXPORTED'
    | 'SYSTEM_SETTINGS_UPDATED'
    | 'ACCESS_DENIED';
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetRecordId?: string;
  targetType?: 'FDR' | 'DOCUMENT' | 'USER' | 'SETTINGS' | 'REPORT';
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  changeSummary: string;
  ipAddress?: string;
  timestamp: string;
  correlationId?: string;
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
  alertThresholdDays: number[]; // [30, 15, 7, 0]
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
