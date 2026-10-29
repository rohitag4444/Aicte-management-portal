import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Institution,
  FDRRecord,
  FdrDocument,
  RenewalRequest,
  ReleaseRequest,
  AuditLog,
  SystemNotification,
  SystemSettings,
} from './types.js';

interface DatabaseSchema {
  users: User[];
  institutions: Institution[];
  fdrRecords: FDRRecord[];
  renewalRequests: RenewalRequest[];
  releaseRequests: ReleaseRequest[];
  notifications: SystemNotification[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'fdr_database.json');
const TEMP_FILE = path.join(DATA_DIR, 'fdr_database.json.tmp');
export const UPLOAD_DIR = path.resolve(process.cwd(), '.uploads');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private loadOrSeed(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure JFDR trackingNumber & paymentMode exist on records
        if (parsed.fdrRecords && parsed.fdrRecords.length > 0 && !parsed.fdrRecords[0].trackingNumber) {
          return this.generateInitialSeed();
        }
        return parsed;
      } catch (err) {
        console.error('Failed to parse database file, reseeding...', err);
      }
    }
    const seeded = this.generateInitialSeed();
    this.persistSync(seeded);
    return seeded;
  }

  private persistSync(dataToSave: DatabaseSchema) {
    try {
      fs.writeFileSync(TEMP_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(TEMP_FILE, DB_FILE);
    } catch (err) {
      console.error('Failed to write database atomically:', err);
    }
  }

  public save() {
    this.persistSync(this.data);
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public reseed() {
    this.data = this.generateInitialSeed();
    this.save();
    return this.data;
  }

  private generateInitialSeed(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('Password@123', salt);

    const now = new Date();
    const isoNow = now.toISOString();

    const users: User[] = [
      {
        id: 'usr-inst-01',
        email: 'admin@delhi-tech.edu',
        name: 'Dr. Ramesh Sharma',
        role: 'INSTITUTION_USER',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        designation: 'Registrar & Principal Representative',
        isActive: true,
        lastLoginAt: isoNow,
        createdAt: '2026-01-15T09:00:00.000Z',
        passwordHash: defaultPasswordHash,
      },
      {
        id: 'usr-inst-02',
        email: 'finance@maharashtra-eng.ac.in',
        name: 'Prof. Anjali Kulkarni',
        role: 'INSTITUTION_USER',
        institutionId: 'INST-MH-02',
        institutionName: 'Maharashtra Academy of Engineering Pune',
        designation: 'Chief Accounts Officer',
        isActive: true,
        lastLoginAt: isoNow,
        createdAt: '2026-01-20T11:00:00.000Z',
        passwordHash: defaultPasswordHash,
      },
      {
        id: 'usr-officer-01',
        email: 'officer.verma@aicte.gov.in',
        name: 'Sunita Verma',
        role: 'VERIFICATION_OFFICER',
        designation: 'AICTE Regional Scrutiny Officer (Northern Region)',
        isActive: true,
        lastLoginAt: isoNow,
        createdAt: '2025-11-01T10:00:00.000Z',
        passwordHash: defaultPasswordHash,
      },
      {
        id: 'usr-admin-01',
        email: 'sysadmin@aicte.gov.in',
        name: 'Rajesh K. Mehta',
        role: 'SYSTEM_ADMIN',
        designation: 'AICTE Headquarters System Administrator',
        isActive: true,
        lastLoginAt: isoNow,
        createdAt: '2025-10-10T08:30:00.000Z',
        passwordHash: defaultPasswordHash,
      },
    ];

    const institutions: Institution[] = [
      {
        id: 'INST-DEL-01',
        aicteCode: '1-351299401',
        name: 'Delhi Institute of Technology & Management',
        category: 'Engineering & Tech',
        state: 'Delhi',
        city: 'New Delhi',
        address: 'Sector 14, Dwarka, New Delhi 110078',
        trustName: 'Vidyapeeth Educational Charitable Trust',
        establishedYear: 2004,
        contactEmail: 'admin@delhi-tech.edu',
        contactPhone: '+91 11 2508 4100',
        totalApprovedFDRs: 3,
        totalDepositAmountINR: 7500000,
        status: 'ACTIVE',
        createdAt: '2025-01-10T00:00:00.000Z',
      },
      {
        id: 'INST-MH-02',
        aicteCode: '1-492100882',
        name: 'Maharashtra Academy of Engineering Pune',
        category: 'Engineering & Tech',
        state: 'Maharashtra',
        city: 'Pune',
        address: 'Alandi Road, Pune, Maharashtra 412105',
        trustName: 'Pratishthan Shikshan Sanstha',
        establishedYear: 2008,
        contactEmail: 'finance@maharashtra-eng.ac.in',
        contactPhone: '+91 20 2718 5000',
        totalApprovedFDRs: 2,
        totalDepositAmountINR: 5000000,
        status: 'ACTIVE',
        createdAt: '2025-02-14T00:00:00.000Z',
      },
      {
        id: 'INST-KA-03',
        aicteCode: '1-789021345',
        name: 'Bangalore Institute of Applied Science & Tech',
        category: 'Management',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: 'Whitefield Main Road, Bengaluru, Karnataka 560066',
        trustName: 'Southern Education Foundation',
        establishedYear: 2012,
        contactEmail: 'director@biast.edu.in',
        contactPhone: '+91 80 4129 9900',
        totalApprovedFDRs: 1,
        totalDepositAmountINR: 3500000,
        status: 'ACTIVE',
        createdAt: '2025-03-01T00:00:00.000Z',
      },
    ];

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const addDays = (d: Date, days: number) => {
      const res = new Date(d);
      res.setDate(res.getDate() + days);
      return res;
    };

    const today = new Date();

    const fdrRecords: FDRRecord[] = [
      // 1. Approved & Active
      {
        id: 'FDR-2026-DEL-001',
        trackingNumber: 'AICTE/JFDR/2025/0104',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        aicteCode: '1-351299401',
        bankName: 'State Bank of India',
        branchName: 'Dwarka Sector 10 Branch, New Delhi',
        ifscCode: 'SBIN0011566',
        fdrNumber: 'SBI-FDR-992817451',
        depositAmountINR: 3500000,
        issueDate: '2025-04-10',
        maturityDate: formatDate(addDays(today, 320)),
        tenureMonths: 24,
        interestRatePercent: 7.1,
        depositPurpose: 'AICTE Mandatory Security Corpus - B.Tech Computer Science & AI Expansion',
        jointAccountHolders: 'Regional Officer, AICTE (North) & Chairman, Vidyapeeth Trust',
        paymentMode: 'RTGS',
        contactDetails: {
          contactPersonName: 'Dr. Ramesh Sharma',
          contactPersonDesignation: 'Registrar',
          contactPersonMobile: '+91 98110 24891',
          contactPersonEmail: 'admin@delhi-tech.edu',
        },
        refundReason: 'New Course Approval Mandatory Corpus Deposit',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 5,
        confirmationSentAt: '2025-04-12T10:15:00.000Z',
        smsNotificationStatus: 'DELIVERED',
        emailNotificationStatus: 'DELIVERED',
        verificationStatus: 'APPROVED',
        lifecycleStatus: 'ACTIVE',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        reviewDecisionAt: '2025-04-20T14:30:00.000Z',
        reviewDecisionBy: 'Sunita Verma',
        documents: [
          {
            id: 'doc-001-a',
            fdrRecordId: 'FDR-2026-DEL-001',
            documentType: 'FDR_RECEIPT',
            fileName: 'SBI_FDR_Receipt_Scan_992817451.pdf',
            originalFileName: 'SBI_Receipt_Dwarka.pdf',
            fileSizeBytes: 1420500,
            mimeType: 'application/pdf',
            storagePath: 'doc-001-a.pdf',
            scanStatus: 'CLEAN',
            uploadedBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma', role: 'INSTITUTION_USER' },
            version: 1,
            uploadedAt: '2025-04-12T10:00:00.000Z',
            sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
          {
            id: 'doc-001-b',
            fdrRecordId: 'FDR-2026-DEL-001',
            documentType: 'BANK_CONFIRMATION',
            fileName: 'SBI_Bank_Confirmation_Lien.pdf',
            originalFileName: 'Bank_Confirmation_Lien_Letter.pdf',
            fileSizeBytes: 840200,
            mimeType: 'application/pdf',
            storagePath: 'doc-001-b.pdf',
            scanStatus: 'CLEAN',
            uploadedBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma', role: 'INSTITUTION_USER' },
            version: 1,
            uploadedAt: '2025-04-12T10:05:00.000Z',
            sha256Hash: 'a89f41b9c9f4d728e23f890a8cb1e39b7829fa7b40924cb89e248a3915bc6782',
          },
        ],
        timeline: [
          {
            id: 'tm-001-1',
            fdrRecordId: 'FDR-2026-DEL-001',
            reviewerId: 'usr-inst-01',
            reviewerName: 'Dr. Ramesh Sharma',
            reviewerRole: 'INSTITUTION_USER',
            action: 'SUBMIT',
            notes: 'Initial submission of 35 Lakh corpus FDR with bank lien confirmation.',
            createdAt: '2025-04-12T10:10:00.000Z',
          },
          {
            id: 'tm-001-2',
            fdrRecordId: 'FDR-2026-DEL-001',
            reviewerId: 'usr-officer-01',
            reviewerName: 'Sunita Verma',
            reviewerRole: 'VERIFICATION_OFFICER',
            action: 'APPROVE',
            notes: 'Verified against bank branch stamp and AICTE joint lien endorsement clause 4.3. Record approved.',
            createdAt: '2025-04-20T14:30:00.000Z',
          },
        ],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2025-04-12T09:45:00.000Z',
        updatedAt: '2025-04-20T14:30:00.000Z',
        submittedAt: '2025-04-12T10:10:00.000Z',
      },

      // 2. Approaching Maturity (12 days remaining)
      {
        id: 'FDR-2026-DEL-002',
        trackingNumber: 'AICTE/JFDR/2023/0892',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        aicteCode: '1-351299401',
        bankName: 'Punjab National Bank',
        branchName: 'Janakpuri District Centre, New Delhi',
        ifscCode: 'PUNB0182400',
        fdrNumber: 'PNB-FDR-481920311',
        depositAmountINR: 1500000,
        issueDate: '2023-11-05',
        maturityDate: formatDate(addDays(today, 12)),
        tenureMonths: 36,
        interestRatePercent: 6.85,
        depositPurpose: 'AICTE Endowment Fund - Mechanical Engg Dept',
        jointAccountHolders: 'Regional Officer, AICTE & Secretary, Vidyapeeth Trust',
        paymentMode: 'NEFT',
        contactDetails: {
          contactPersonName: 'Dr. Ramesh Sharma',
          contactPersonDesignation: 'Registrar',
          contactPersonMobile: '+91 98110 24891',
          contactPersonEmail: 'admin@delhi-tech.edu',
        },
        refundReason: 'Mandatory Endowment Corpus Renewal Due',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 4,
        confirmationSentAt: '2023-11-06T11:10:00.000Z',
        smsNotificationStatus: 'DELIVERED',
        emailNotificationStatus: 'DELIVERED',
        verificationStatus: 'APPROVED',
        lifecycleStatus: 'MATURITY_APPROACHING',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        reviewDecisionAt: '2023-11-15T12:00:00.000Z',
        reviewDecisionBy: 'Sunita Verma',
        maturityAlertLevel: 'FIFTEEN_DAYS',
        lastAlertSentAt: formatDate(addDays(today, -1)),
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2023-11-06T10:30:00.000Z',
        updatedAt: '2026-10-20T08:00:00.000Z',
        submittedAt: '2023-11-06T11:05:00.000Z',
      },

      // 3. Matured FDR
      {
        id: 'FDR-2026-DEL-003',
        trackingNumber: 'AICTE/JFDR/2023/0741',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        aicteCode: '1-351299401',
        bankName: 'Bank of Baroda',
        branchName: 'Connaught Place Branch, New Delhi',
        ifscCode: 'BARB0CONNAU',
        fdrNumber: 'BOB-FDR-778291044',
        depositAmountINR: 2500000,
        issueDate: '2023-10-18',
        maturityDate: formatDate(addDays(today, -6)),
        tenureMonths: 36,
        interestRatePercent: 7.25,
        depositPurpose: 'AICTE Security Deposit - MBA Programme Affiliation',
        jointAccountHolders: 'Regional Officer, AICTE & Treasurer, Vidyapeeth Trust',
        paymentMode: 'DIRECT_DEPOSIT',
        contactDetails: {
          contactPersonName: 'Dr. Ramesh Sharma',
          contactPersonDesignation: 'Registrar',
          contactPersonMobile: '+91 98110 24891',
          contactPersonEmail: 'admin@delhi-tech.edu',
        },
        refundReason: 'Matured Deposit - Refund / Renewal Action Required',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 4,
        verificationStatus: 'APPROVED',
        lifecycleStatus: 'MATURED',
        maturityAlertLevel: 'OVERDUE',
        lastAlertSentAt: formatDate(addDays(today, -5)),
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2023-10-20T10:00:00.000Z',
        updatedAt: '2026-10-21T09:00:00.000Z',
        submittedAt: '2023-10-20T10:30:00.000Z',
      },

      // 4. Renewal Requested
      {
        id: 'FDR-2026-MH-001',
        trackingNumber: 'AICTE/JFDR/2023/0620',
        institutionId: 'INST-MH-02',
        institutionName: 'Maharashtra Academy of Engineering Pune',
        aicteCode: '1-492100882',
        bankName: 'Canara Bank',
        branchName: 'Shivajinagar Branch, Pune',
        ifscCode: 'CNRB0001289',
        fdrNumber: 'CNB-FDR-554190823',
        depositAmountINR: 5000000,
        issueDate: '2023-10-01',
        maturityDate: formatDate(addDays(today, 25)),
        tenureMonths: 36,
        interestRatePercent: 7.0,
        depositPurpose: 'AICTE Mandatory Corpus - Autonomous Institute Status',
        jointAccountHolders: 'Regional Officer, AICTE (Western) & President, Pratishthan Sanstha',
        paymentMode: 'RTGS',
        contactDetails: {
          contactPersonName: 'Prof. Anjali Kulkarni',
          contactPersonDesignation: 'Chief Accounts Officer',
          contactPersonMobile: '+91 94220 81920',
          contactPersonEmail: 'finance@maharashtra-eng.ac.in',
        },
        refundReason: '3-Year Term Extension / Renewal of Joint FDR',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 3,
        verificationStatus: 'APPROVED',
        lifecycleStatus: 'RENEWAL_REQUESTED',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-02', name: 'Prof. Anjali Kulkarni' },
        createdAt: '2023-10-05T09:00:00.000Z',
        updatedAt: '2026-10-22T14:00:00.000Z',
        submittedAt: '2023-10-05T09:30:00.000Z',
      },

      // 5. In Verification Queue: SUBMITTED
      {
        id: 'FDR-2026-DEL-004',
        trackingNumber: 'AICTE/JFDR/2026/0491',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        aicteCode: '1-351299401',
        bankName: 'Union Bank of India',
        branchName: 'South Extension Part II, New Delhi',
        ifscCode: 'UBIN0539121',
        fdrNumber: 'UBI-FDR-881293041',
        depositAmountINR: 2000000,
        issueDate: '2026-09-15',
        maturityDate: '2029-09-15',
        tenureMonths: 36,
        interestRatePercent: 7.3,
        depositPurpose: 'AICTE Polytechnic Diploma Wing Security Deposit',
        jointAccountHolders: 'Regional Officer, AICTE & Chairman, Vidyapeeth Trust',
        paymentMode: 'NEFT',
        contactDetails: {
          contactPersonName: 'Dr. Ramesh Sharma',
          contactPersonDesignation: 'Registrar',
          contactPersonMobile: '+91 98110 24891',
          contactPersonEmail: 'admin@delhi-tech.edu',
        },
        refundReason: 'New Programme Approval Security Deposit',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 2,
        confirmationSentAt: '2026-09-18T10:35:00.000Z',
        smsNotificationStatus: 'DELIVERED',
        emailNotificationStatus: 'DELIVERED',
        verificationStatus: 'SUBMITTED',
        lifecycleStatus: 'ACTIVE',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2026-09-18T09:30:00.000Z',
        updatedAt: '2026-09-18T10:30:00.000Z',
        submittedAt: '2026-09-18T10:30:00.000Z',
      },

      // 6. Correction Required (Deficiency Raised by AICTE)
      {
        id: 'FDR-2026-MH-002',
        trackingNumber: 'AICTE/JFDR/2026/0388',
        institutionId: 'INST-MH-02',
        institutionName: 'Maharashtra Academy of Engineering Pune',
        aicteCode: '1-492100882',
        bankName: 'HDFC Bank',
        branchName: 'Kothrud Branch, Pune',
        ifscCode: 'HDFC0000214',
        fdrNumber: 'HDFC-FDR-310492811',
        depositAmountINR: 1800000,
        issueDate: '2026-08-10',
        maturityDate: '2029-08-10',
        tenureMonths: 36,
        interestRatePercent: 7.25,
        depositPurpose: 'AICTE Mandatory Endowment - Electrical Engg Accreditation',
        jointAccountHolders: 'Principal MAEP & Branch Manager HDFC',
        paymentMode: 'BANK_CHALLAN',
        contactDetails: {
          contactPersonName: 'Prof. Anjali Kulkarni',
          contactPersonDesignation: 'Chief Accounts Officer',
          contactPersonMobile: '+91 94220 81920',
          contactPersonEmail: 'finance@maharashtra-eng.ac.in',
        },
        refundReason: 'Accreditation Endowment Corpus',
        attachmentValidationStatus: 'DEFICIENT',
        trackingStage: 2,
        verificationStatus: 'CORRECTION_REQUIRED',
        lifecycleStatus: 'ACTIVE',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        correctionRequirements:
          '1. Deficient Joint Title: The FDR joint account title must explicitly state "Regional Officer, Western Region AICTE". Currently only lists Branch Manager.\n2. Upload bank confirmation letter signed by Chief Manager with branch seal.',
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-02', name: 'Prof. Anjali Kulkarni' },
        createdAt: '2026-08-12T10:00:00.000Z',
        updatedAt: '2026-08-16T15:20:00.000Z',
        submittedAt: '2026-08-12T11:00:00.000Z',
      },

      // 7. Draft Record
      {
        id: 'FDR-2026-DEL-005',
        trackingNumber: 'AICTE/JFDR/2026/0512',
        institutionId: 'INST-DEL-01',
        institutionName: 'Delhi Institute of Technology & Management',
        aicteCode: '1-351299401',
        bankName: 'ICICI Bank',
        branchName: 'Rohini Sector 7 Branch, New Delhi',
        ifscCode: 'ICIC0000102',
        fdrNumber: 'ICICI-FDR-66291044',
        depositAmountINR: 1200000,
        issueDate: '2026-10-15',
        maturityDate: '2028-10-15',
        tenureMonths: 24,
        interestRatePercent: 7.1,
        depositPurpose: 'AICTE Additional Division - MCA Programme',
        jointAccountHolders: 'Regional Officer AICTE & President Vidyapeeth Trust',
        paymentMode: 'DEMAND_DRAFT',
        contactDetails: {
          contactPersonName: 'Dr. Ramesh Sharma',
          contactPersonDesignation: 'Registrar',
          contactPersonMobile: '+91 98110 24891',
          contactPersonEmail: 'admin@delhi-tech.edu',
        },
        refundReason: 'Additional Course Affiliation Security Deposit',
        attachmentValidationStatus: 'PENDING',
        trackingStage: 1,
        verificationStatus: 'DRAFT',
        lifecycleStatus: 'ACTIVE',
        documents: [],
        timeline: [],
        isDuplicateFlagged: false,
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2026-10-24T11:30:00.000Z',
        updatedAt: '2026-10-24T11:30:00.000Z',
      },

      // 8. Duplicate Flagged Record
      {
        id: 'FDR-2026-KA-001',
        trackingNumber: 'AICTE/JFDR/2026/0477',
        institutionId: 'INST-KA-03',
        institutionName: 'Bangalore Institute of Applied Science & Tech',
        aicteCode: '1-789021345',
        bankName: 'State Bank of India',
        branchName: 'Whitefield Branch, Bengaluru',
        ifscCode: 'SBIN0004128',
        fdrNumber: 'SBI-FDR-992817451',
        depositAmountINR: 3500000,
        issueDate: '2025-04-10',
        maturityDate: '2027-04-10',
        tenureMonths: 24,
        interestRatePercent: 7.1,
        depositPurpose: 'AICTE Mandatory Corpus - MBA Marketing',
        jointAccountHolders: 'Regional Officer AICTE (South-West) & Foundation Secretary',
        paymentMode: 'RTGS',
        contactDetails: {
          contactPersonName: 'Dr. Suresh Rao',
          contactPersonDesignation: 'Director',
          contactPersonMobile: '+91 98450 12345',
          contactPersonEmail: 'director@biast.edu.in',
        },
        refundReason: 'MBA Intake Security Deposit',
        attachmentValidationStatus: 'VERIFIED',
        trackingStage: 3,
        verificationStatus: 'UNDER_REVIEW',
        lifecycleStatus: 'ACTIVE',
        assignedReviewerId: 'usr-officer-01',
        assignedReviewerName: 'Sunita Verma',
        isDuplicateFlagged: true,
        duplicateNotes:
          'Potential duplicate reference: Exact FDR number "SBI-FDR-992817451" with State Bank of India was previously registered by Delhi Institute of Technology (Record ID: FDR-2026-DEL-001). Under scrutiny.',
        documents: [],
        timeline: [],
        createdBy: { id: 'usr-inst-01', name: 'Dr. Ramesh Sharma' },
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2026-10-18T10:00:00.000Z',
        submittedAt: '2026-10-15T11:00:00.000Z',
      },
    ];

    const renewalRequests: RenewalRequest[] = [
      {
        id: 'ren-req-001',
        fdrRecordId: 'FDR-2026-MH-001',
        institutionId: 'INST-MH-02',
        requestedBy: { id: 'usr-inst-02', name: 'Prof. Anjali Kulkarni' },
        requestDate: '2026-10-22',
        proposedTenureMonths: 36,
        proposedMaturityDate: '2029-10-25',
        justification:
          'FDR reaching maturity in 25 days. The institution requests approval to roll over the 50 Lakh corpus for another 3-year term as per AICTE handbook regulations.',
        status: 'PENDING',
      },
    ];

    const releaseRequests: ReleaseRequest[] = [];

    const notifications: SystemNotification[] = [
      {
        id: 'notif-001',
        recipientRole: 'INSTITUTION_USER',
        recipientInstitutionId: 'INST-DEL-01',
        title: 'Maturity Alert: PNB-FDR-481920311',
        message: 'Fixed Deposit Receipt of ₹15,00,000 with Punjab National Bank will mature in 12 days. Please initiate renewal request.',
        type: 'WARNING',
        linkedFdrId: 'FDR-2026-DEL-002',
        isRead: false,
        createdAt: '2026-10-24T08:00:00.000Z',
      },
      {
        id: 'notif-002',
        recipientRole: 'VERIFICATION_OFFICER',
        title: 'Duplicate FDR Flagged',
        message: 'FDR record FDR-2026-KA-001 shares FDR number SBI-FDR-992817451 with an existing institution. Manual verification required.',
        type: 'ALERT',
        linkedFdrId: 'FDR-2026-KA-001',
        isRead: false,
        createdAt: '2026-10-18T10:05:00.000Z',
      },
      {
        id: 'notif-003',
        recipientRole: 'INSTITUTION_USER',
        recipientInstitutionId: 'INST-MH-02',
        title: 'Correction Requested on FDR-2026-MH-002',
        message: 'Scrutiny Officer has requested correction: AICTE Regional Officer must be added as mandatory joint holder.',
        type: 'WARNING',
        linkedFdrId: 'FDR-2026-MH-002',
        isRead: false,
        createdAt: '2026-08-16T15:21:00.000Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'aud-001',
        eventType: 'AUTH_LOGIN_SUCCESS',
        actorId: 'usr-officer-01',
        actorName: 'Sunita Verma',
        actorRole: 'VERIFICATION_OFFICER',
        outcome: 'SUCCESS',
        changeSummary: 'Verification Officer authenticated via AICTE official session.',
        ipAddress: '192.168.1.45',
        timestamp: '2026-10-26T08:30:00.000Z',
      },
      {
        id: 'aud-002',
        eventType: 'FDR_APPROVED',
        actorId: 'usr-officer-01',
        actorName: 'Sunita Verma',
        actorRole: 'VERIFICATION_OFFICER',
        targetRecordId: 'FDR-2026-DEL-001',
        targetType: 'FDR',
        outcome: 'SUCCESS',
        changeSummary: 'Approved ₹35 Lakh FDR record after cross-checking SBI bank confirmation letter.',
        timestamp: '2025-04-20T14:30:00.000Z',
      },
      {
        id: 'aud-003',
        eventType: 'DUPLICATE_FLAGGED',
        actorId: 'system',
        actorName: 'AICTE Duplicate Rule Engine',
        actorRole: 'SYSTEM_ADMIN',
        targetRecordId: 'FDR-2026-KA-001',
        targetType: 'FDR',
        outcome: 'WARNING',
        changeSummary: 'Flagged collision on FDR #SBI-FDR-992817451 with State Bank of India.',
        timestamp: '2026-10-18T10:00:00.000Z',
      },
    ];

    const settings: SystemSettings = {
      alertThresholdDays: [30, 15, 7, 0],
      requireJointLienLetter: true,
      requireBankConfirmation: true,
      maxFileUploadSizeMB: 5,
      duplicateMatchingThresholdPercent: 80,
      enableAutomaticMaturityAlerts: true,
      enableOcrExtraction: true,
      maintenanceMode: false,
      updatedAt: '2026-10-01T00:00:00.000Z',
      updatedBy: 'Rajesh K. Mehta',
    };

    return {
      users,
      institutions,
      fdrRecords,
      renewalRequests,
      releaseRequests,
      notifications,
      auditLogs,
      settings,
    };
  }
}

export const db = new Database();
