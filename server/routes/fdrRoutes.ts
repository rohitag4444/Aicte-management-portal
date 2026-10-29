import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticateToken, verifyInstitutionAccess } from '../auth.js';
import { recordAuditLog } from '../audit.js';
import { checkFdrDuplicates } from '../duplicateDetection.js';
import { FDRRecord, SystemNotification } from '../types.js';

export const fdrRouter = Router();
fdrRouter.use(authenticateToken);

const fdrInputSchema = z.object({
  bankName: z.string().min(2, 'Bank name is required'),
  branchName: z.string().min(2, 'Branch name is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Valid 11-character Indian IFSC code required (e.g. SBIN0011566)'),
  fdrNumber: z.string().min(4, 'Bank-issued FDR receipt number is required'),
  depositAmountINR: z.number().positive('Deposit amount must be a positive number greater than zero'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid issue date in YYYY-MM-DD required'),
  maturityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid maturity date in YYYY-MM-DD required'),
  tenureMonths: z.number().int().min(1, 'Tenure must be at least 1 month'),
  interestRatePercent: z.number().min(0).max(25, 'Interest rate must be between 0% and 25%'),
  depositPurpose: z.string().min(5, 'Deposit purpose or category is required'),
  jointAccountHolders: z.string().min(5, 'Joint account holders specification is required'),
  paymentMode: z.enum(['NEFT', 'RTGS', 'BANK_CHALLAN', 'DIRECT_DEPOSIT', 'DEMAND_DRAFT']).optional(),
  refundReason: z.string().optional(),
  contactPersonName: z.string().optional(),
  contactPersonDesignation: z.string().optional(),
  contactPersonMobile: z.string().optional(),
  contactPersonEmail: z.string().optional(),
  remarks: z.string().optional(),
  asDraft: z.boolean().optional(),
});

// GET /api/fdr - List FDRs with filters, search, and pagination
fdrRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let records = [...data.fdrRecords];

  // RBAC isolation: Institution users only see their own records
  if (user.role === 'INSTITUTION_USER') {
    if (!user.institutionId) {
      return res.status(403).json({ error: 'User is not linked to any institution.' });
    }
    records = records.filter((r) => r.institutionId === user.institutionId);
  }

  // Filters
  const {
    search,
    status,
    lifecycle,
    bank,
    institutionId,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    page = '1',
    limit = '15',
  } = req.query as Record<string, string>;

  if (institutionId && (user.role === 'VERIFICATION_OFFICER' || user.role === 'SYSTEM_ADMIN')) {
    records = records.filter((r) => r.institutionId === institutionId);
  }

  if (status && status !== 'ALL') {
    records = records.filter((r) => r.verificationStatus === status);
  }

  if (lifecycle && lifecycle !== 'ALL') {
    records = records.filter((r) => r.lifecycleStatus === lifecycle);
  }

  if (bank && bank !== 'ALL') {
    records = records.filter((r) => r.bankName.toLowerCase().includes(bank.toLowerCase()));
  }

  if (search) {
    const q = search.toLowerCase().trim();
    records = records.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.fdrNumber.toLowerCase().includes(q) ||
        r.bankName.toLowerCase().includes(q) ||
        r.institutionName.toLowerCase().includes(q) ||
        r.depositPurpose.toLowerCase().includes(q) ||
        r.aicteCode.toLowerCase().includes(q)
    );
  }

  // Sorting
  records.sort((a, b) => {
    let valA: any = (a as any)[sortBy] || '';
    let valB: any = (b as any)[sortBy] || '';

    if (sortBy === 'depositAmountINR') {
      valA = Number(valA);
      valB = Number(valB);
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const total = records.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginated = records.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  return res.json({
    data: paginated,
    pagination: {
      total,
      page: pageNum,
      limit: pageSize,
      totalPages,
    },
  });
});

// GET /api/fdr/:id - Get single record
fdrRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const record = data.fdrRecords.find((r) => r.id === id);

  if (!record) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  // RBAC ownership check
  if (!verifyInstitutionAccess(req, record.institutionId)) {
    recordAuditLog({
      eventType: 'ACCESS_DENIED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: id,
      targetType: 'FDR',
      outcome: 'FAILURE',
      changeSummary: `Unauthorized attempt by ${user.name} to view FDR ${id} belonging to ${record.institutionName}.`,
      ipAddress: req.ip,
    });
    return res.status(403).json({ error: 'Access denied: You cannot view records from another institution.' });
  }

  // Also run duplicate check to return duplicate insights
  const duplicateInfo = checkFdrDuplicates({
    id: record.id,
    institutionId: record.institutionId,
    bankName: record.bankName,
    fdrNumber: record.fdrNumber,
    depositAmountINR: record.depositAmountINR,
    issueDate: record.issueDate,
    maturityDate: record.maturityDate,
  });

  return res.json({
    record,
    duplicateAnalysis: duplicateInfo,
  });
});

// POST /api/fdr - Create new FDR record
fdrRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'INSTITUTION_USER' && user.role !== 'SYSTEM_ADMIN') {
    return res.status(403).json({ error: 'Only institution representatives can register FDR records.' });
  }

  const parseResult = fdrInputSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: parseResult.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
    });
  }

  const payload = parseResult.data;

  // Date validation: Issue date must be <= Maturity date
  if (new Date(payload.issueDate) > new Date(payload.maturityDate)) {
    return res.status(400).json({
      error: 'Invalid dates: Issue date cannot be later than the maturity date.',
    });
  }

  const data = db.getData();
  const institution = data.institutions.find(
    (i) => i.id === (user.institutionId || req.body.institutionId)
  );

  if (!institution) {
    return res.status(400).json({ error: 'Valid institution reference required.' });
  }

  // Generate unique internal ID and AICTE tracking number
  const seq = String(data.fdrRecords.length + 1).padStart(3, '0');
  const year = new Date().getFullYear();
  const internalId = `FDR-${year}-${institution.state.substring(0, 3).toUpperCase()}-${seq}`;
  const trackingNumber = `AICTE/JFDR/${year}/${String(400 + data.fdrRecords.length).padStart(4, '0')}`;

  // Run duplicate check
  const duplicateCheck = checkFdrDuplicates({
    institutionId: institution.id,
    bankName: payload.bankName,
    fdrNumber: payload.fdrNumber,
    depositAmountINR: payload.depositAmountINR,
    issueDate: payload.issueDate,
    maturityDate: payload.maturityDate,
  });

  const isDraft = !!payload.asDraft;
  const initialVerificationStatus = isDraft ? 'DRAFT' : 'SUBMITTED';

  const newRecord: FDRRecord = {
    id: internalId,
    trackingNumber,
    institutionId: institution.id,
    institutionName: institution.name,
    aicteCode: institution.aicteCode,
    bankName: payload.bankName,
    branchName: payload.branchName,
    ifscCode: payload.ifscCode,
    fdrNumber: payload.fdrNumber,
    depositAmountINR: payload.depositAmountINR,
    issueDate: payload.issueDate,
    maturityDate: payload.maturityDate,
    tenureMonths: payload.tenureMonths,
    interestRatePercent: payload.interestRatePercent,
    depositPurpose: payload.depositPurpose,
    jointAccountHolders: payload.jointAccountHolders,
    paymentMode: payload.paymentMode || 'RTGS',
    contactDetails: {
      contactPersonName: payload.contactPersonName || user.name,
      contactPersonDesignation: payload.contactPersonDesignation || user.designation,
      contactPersonMobile: payload.contactPersonMobile || '+91 98110 00000',
      contactPersonEmail: payload.contactPersonEmail || user.email,
    },
    refundReason: payload.refundReason || payload.depositPurpose,
    attachmentValidationStatus: 'PENDING',
    trackingStage: isDraft ? 1 : 2,
    confirmationSentAt: isDraft ? undefined : new Date().toISOString(),
    smsNotificationStatus: isDraft ? undefined : 'DELIVERED',
    emailNotificationStatus: isDraft ? undefined : 'DELIVERED',
    remarks: payload.remarks || '',
    verificationStatus: initialVerificationStatus,
    lifecycleStatus: 'ACTIVE',
    documents: [],
    timeline: [
      {
        id: `tm-${Date.now()}-1`,
        fdrRecordId: internalId,
        reviewerId: user.id,
        reviewerName: user.name,
        reviewerRole: user.role,
        action: isDraft ? 'SUBMIT' : 'SUBMIT',
        notes: isDraft
          ? 'Draft JFDR application saved by institution.'
          : 'JFDR application submitted with acknowledgement receipt generated.',
        createdAt: new Date().toISOString(),
      },
    ],
    isDuplicateFlagged: duplicateCheck.isDuplicate,
    duplicateNotes: duplicateCheck.isDuplicate
      ? duplicateCheck.matchedRecords.map((m) => m.explanation).join(' | ')
      : undefined,
    createdBy: {
      id: user.id,
      name: user.name,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submittedAt: isDraft ? undefined : new Date().toISOString(),
  };

  data.fdrRecords.unshift(newRecord);
  db.save();

  recordAuditLog({
    eventType: isDraft ? 'FDR_CREATED' : 'FDR_SUBMITTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: internalId,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `FDR record ${internalId} (${payload.fdrNumber}, ₹${payload.depositAmountINR.toLocaleString('en-IN')}) created as ${initialVerificationStatus}.`,
    ipAddress: req.ip,
  });

  if (duplicateCheck.isDuplicate) {
    recordAuditLog({
      eventType: 'DUPLICATE_FLAGGED',
      actorId: 'system',
      actorName: 'AICTE Duplicate Rule Engine',
      actorRole: 'SYSTEM_ADMIN',
      targetRecordId: internalId,
      targetType: 'FDR',
      outcome: 'WARNING',
      changeSummary: `Duplicate potential flagged for ${payload.fdrNumber}: ${duplicateCheck.matchedRecords[0].explanation}`,
      ipAddress: req.ip,
    });
  }

  return res.status(201).json({
    record: newRecord,
    duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck : null,
  });
});

// PATCH /api/fdr/:id - Update draft or record under correction
fdrRouter.patch('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const record = data.fdrRecords.find((r) => r.id === id);

  if (!record) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  if (!verifyInstitutionAccess(req, record.institutionId)) {
    return res.status(403).json({ error: 'Access denied: Cannot edit records belonging to another institution.' });
  }

  // State guard: Only DRAFT or CORRECTION_REQUIRED can be updated by institution
  if (
    user.role === 'INSTITUTION_USER' &&
    record.verificationStatus !== 'DRAFT' &&
    record.verificationStatus !== 'CORRECTION_REQUIRED'
  ) {
    return res.status(400).json({
      error: `Record cannot be edited while in status "${record.verificationStatus}". Only DRAFT or CORRECTION_REQUIRED records may be edited.`,
    });
  }

  const updates = req.body;
  if (updates.depositAmountINR !== undefined && updates.depositAmountINR <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be a positive number.' });
  }

  const allowedFields = [
    'bankName',
    'branchName',
    'ifscCode',
    'fdrNumber',
    'depositAmountINR',
    'issueDate',
    'maturityDate',
    'tenureMonths',
    'interestRatePercent',
    'depositPurpose',
    'refundReason',
    'paymentMode',
    'jointAccountHolders',
    'contactDetails',
    'remarks',
  ];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      (record as any)[field] = updates[field];
    }
  }

  // Also support updating nested contact details if sent flatly
  if (updates.contactPersonName || updates.contactPersonMobile || updates.contactPersonEmail || updates.contactPersonDesignation) {
    record.contactDetails = {
      contactPersonName: updates.contactPersonName || record.contactDetails?.contactPersonName || '',
      contactPersonDesignation: updates.contactPersonDesignation || record.contactDetails?.contactPersonDesignation || '',
      contactPersonMobile: updates.contactPersonMobile || record.contactDetails?.contactPersonMobile || '',
      contactPersonEmail: updates.contactPersonEmail || record.contactDetails?.contactPersonEmail || '',
    };
  }

  // Re-run duplicate detection
  const duplicateCheck = checkFdrDuplicates({
    id: record.id,
    institutionId: record.institutionId,
    bankName: record.bankName,
    fdrNumber: record.fdrNumber,
    depositAmountINR: record.depositAmountINR,
    issueDate: record.issueDate,
    maturityDate: record.maturityDate,
  });

  record.isDuplicateFlagged = duplicateCheck.isDuplicate;
  record.duplicateNotes = duplicateCheck.isDuplicate
    ? duplicateCheck.matchedRecords.map((m) => m.explanation).join(' | ')
    : undefined;
  record.updatedAt = new Date().toISOString();

  db.save();

  recordAuditLog({
    eventType: 'FDR_UPDATED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: record.id,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `FDR record ${record.id} updated by ${user.name}.`,
    ipAddress: req.ip,
  });

  return res.json({ record });
});

// POST /api/fdr/:id/submit - Submit draft or resubmit corrected record
fdrRouter.post('/:id/submit', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const record = data.fdrRecords.find((r) => r.id === id);

  if (!record) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  if (!verifyInstitutionAccess(req, record.institutionId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (record.verificationStatus !== 'DRAFT' && record.verificationStatus !== 'CORRECTION_REQUIRED') {
    return res.status(400).json({
      error: `Invalid transition: Record with status "${record.verificationStatus}" cannot be submitted.`,
    });
  }

  const isResubmission = record.verificationStatus === 'CORRECTION_REQUIRED';
  record.verificationStatus = 'SUBMITTED';
  record.submittedAt = new Date().toISOString();
  record.updatedAt = new Date().toISOString();

  const noteText = req.body.notes || (isResubmission ? 'Resubmitted after attending to correction requirements.' : 'Submitted for scrutiny review.');

  record.timeline.push({
    id: `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    fdrRecordId: record.id,
    reviewerId: user.id,
    reviewerName: user.name,
    reviewerRole: user.role,
    action: isResubmission ? 'RESUBMIT' : 'SUBMIT',
    notes: noteText,
    createdAt: new Date().toISOString(),
  });

  // Notify Verification Officers
  const notif: SystemNotification = {
    id: `notif-${Date.now()}`,
    recipientRole: 'VERIFICATION_OFFICER',
    title: `${isResubmission ? 'Resubmission' : 'New FDR Submission'}: ${record.id}`,
    message: `${record.institutionName} has ${isResubmission ? 'resubmitted' : 'submitted'} FDR #${record.fdrNumber} (₹${record.depositAmountINR.toLocaleString('en-IN')}) for verification.`,
    type: 'INFO',
    linkedFdrId: record.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  data.notifications.unshift(notif);

  db.save();

  recordAuditLog({
    eventType: isResubmission ? 'FDR_RESUBMITTED' : 'FDR_SUBMITTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: record.id,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `FDR ${record.id} transitioned to SUBMITTED status.`,
    ipAddress: req.ip,
  });

  return res.json({ record, message: 'FDR successfully submitted for scrutiny.' });
});

// DELETE /api/fdr/:id - Delete draft record only
fdrRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const index = data.fdrRecords.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  const record = data.fdrRecords[index];
  if (!verifyInstitutionAccess(req, record.institutionId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (record.verificationStatus !== 'DRAFT') {
    return res.status(400).json({
      error: 'Cannot delete record: Only DRAFT records can be deleted. Records under submission or verification must remain for auditability.',
    });
  }

  data.fdrRecords.splice(index, 1);
  db.save();

  recordAuditLog({
    eventType: 'FDR_UPDATED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: id,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `Draft FDR record ${id} was deleted by institution user.`,
    ipAddress: req.ip,
  });

  return res.json({ message: 'Draft record deleted successfully.' });
});

// POST /api/fdr/:id/validate-attachments - Attachment validation step by Scrutiny Officer
fdrRouter.post('/:id/validate-attachments', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, remarks } = req.body; // status: 'VERIFIED' | 'DEFICIENT'
  const user = req.user!;
  const data = db.getData();
  const record = data.fdrRecords.find((r) => r.id === id);

  if (!record) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  record.attachmentValidationStatus = status === 'VERIFIED' ? 'VERIFIED' : 'DEFICIENT';
  if (status === 'VERIFIED') {
    record.trackingStage = 3; // Promoted to Scrutiny Officer verification stage
  } else {
    record.attachmentValidationStatus = 'DEFICIENT';
    record.verificationStatus = 'CORRECTION_REQUIRED';
    record.correctionRequirements = remarks || 'Missing mandatory document attachments or illegible scans.';
  }
  record.updatedAt = new Date().toISOString();

  record.timeline.push({
    id: `tm-${Date.now()}`,
    fdrRecordId: record.id,
    reviewerId: user.id,
    reviewerName: user.name,
    reviewerRole: user.role,
    action: status === 'VERIFIED' ? 'START_REVIEW' : 'REQUEST_CORRECTION',
    notes: `Document & Attachment Validation: ${record.attachmentValidationStatus}. ${remarks || ''}`,
    createdAt: new Date().toISOString(),
  });

  db.save();

  recordAuditLog({
    eventType: 'DOCUMENT_VIEWED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: record.id,
    targetType: 'DOCUMENT',
    outcome: status === 'VERIFIED' ? 'SUCCESS' : 'WARNING',
    changeSummary: `Attachment validation step completed: ${record.attachmentValidationStatus}`,
    ipAddress: req.ip,
  });

  return res.json({ record, message: `Attachment validation completed: ${record.attachmentValidationStatus}` });
});

// GET /api/fdr/track/:ref - Track application by trackingNumber or FDR ID
fdrRouter.get('/track/:ref', (req: AuthenticatedRequest, res: Response) => {
  const { ref } = req.params;
  const data = db.getData();
  const cleanRef = decodeURIComponent(ref).trim().toUpperCase();

  const record = data.fdrRecords.find(
    (r) =>
      r.trackingNumber.toUpperCase() === cleanRef ||
      r.id.toUpperCase() === cleanRef ||
      r.fdrNumber.toUpperCase() === cleanRef
  );

  if (!record) {
    return res.status(404).json({ error: 'No application found with tracking reference: ' + ref });
  }

  return res.json({
    trackingNumber: record.trackingNumber,
    recordId: record.id,
    institutionName: record.institutionName,
    aicteCode: record.aicteCode,
    bankName: record.bankName,
    depositAmountINR: record.depositAmountINR,
    verificationStatus: record.verificationStatus,
    lifecycleStatus: record.lifecycleStatus,
    attachmentValidationStatus: record.attachmentValidationStatus,
    trackingStage: record.trackingStage,
    confirmationSentAt: record.confirmationSentAt,
    smsNotificationStatus: record.smsNotificationStatus,
    emailNotificationStatus: record.emailNotificationStatus,
    correctionRequirements: record.correctionRequirements,
    timeline: record.timeline,
  });
});
