import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticateToken } from '../auth.js';
import { recordAuditLog } from '../audit.js';

export const reportRouter = Router();
reportRouter.use(authenticateToken);

// Helper function to sanitize CSV values against CSV Formula Injection (DDE injection)
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();

  // If the cell begins with dangerous formula triggers (=, +, -, @, tab, CR), prepend a single quote
  if (/^[=\+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

// GET /api/reports/fdr-summary - Summary statistics
reportRouter.get('/fdr-summary', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let records = data.fdrRecords;
  if (user.role === 'INSTITUTION_USER') {
    records = records.filter((r) => r.institutionId === user.institutionId);
  }

  const totalRecords = records.length;
  const totalAmountINR = records.reduce((acc, r) => acc + r.depositAmountINR, 0);

  const statusDistribution: Record<string, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_REVIEW: 0,
    APPROVED: 0,
    REJECTED: 0,
    CORRECTION_REQUIRED: 0,
  };

  const lifecycleDistribution: Record<string, number> = {
    ACTIVE: 0,
    MATURITY_APPROACHING: 0,
    MATURED: 0,
    RENEWAL_REQUESTED: 0,
    RELEASE_REQUESTED: 0,
    CLOSED: 0,
  };

  const bankDistribution: Record<string, { count: number; totalINR: number }> = {};

  for (const r of records) {
    statusDistribution[r.verificationStatus] = (statusDistribution[r.verificationStatus] || 0) + 1;
    lifecycleDistribution[r.lifecycleStatus] = (lifecycleDistribution[r.lifecycleStatus] || 0) + 1;

    if (!bankDistribution[r.bankName]) {
      bankDistribution[r.bankName] = { count: 0, totalINR: 0 };
    }
    bankDistribution[r.bankName].count += 1;
    bankDistribution[r.bankName].totalINR += r.depositAmountINR;
  }

  // Missing documents analysis
  const missingDocumentRecords = records.filter((r) => {
    const hasReceipt = r.documents.some((d) => d.documentType === 'FDR_RECEIPT');
    return !hasReceipt;
  });

  return res.json({
    totalRecords,
    totalAmountINR,
    statusDistribution,
    lifecycleDistribution,
    bankDistribution,
    missingDocumentsCount: missingDocumentRecords.length,
    duplicateFlaggedCount: records.filter((r) => r.isDuplicateFlagged).length,
  });
});

// GET /api/reports/export-csv - Formula-injection safe CSV export
reportRouter.get('/export-csv', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let records = data.fdrRecords;
  if (user.role === 'INSTITUTION_USER') {
    records = records.filter((r) => r.institutionId === user.institutionId);
  }

  const headers = [
    'Internal Record ID',
    'Institution Name',
    'AICTE Code',
    'Bank Name',
    'Branch Name',
    'IFSC Code',
    'FDR Receipt Number',
    'Principal Amount (INR)',
    'Issue Date',
    'Maturity Date',
    'Tenure (Months)',
    'Interest Rate (%)',
    'Verification Status',
    'Lifecycle Status',
    'Documents Uploaded',
    'Duplicate Flagged',
    'Created At',
  ];

  const rows = records.map((r) => [
    sanitizeCsvValue(r.id),
    sanitizeCsvValue(r.institutionName),
    sanitizeCsvValue(r.aicteCode),
    sanitizeCsvValue(r.bankName),
    sanitizeCsvValue(r.branchName),
    sanitizeCsvValue(r.ifscCode),
    sanitizeCsvValue(r.fdrNumber),
    sanitizeCsvValue(r.depositAmountINR),
    sanitizeCsvValue(r.issueDate),
    sanitizeCsvValue(r.maturityDate),
    sanitizeCsvValue(r.tenureMonths),
    sanitizeCsvValue(r.interestRatePercent),
    sanitizeCsvValue(r.verificationStatus),
    sanitizeCsvValue(r.lifecycleStatus),
    sanitizeCsvValue(r.documents.length),
    sanitizeCsvValue(r.isDuplicateFlagged ? 'YES' : 'NO'),
    sanitizeCsvValue(r.createdAt),
  ]);

  const csvContent = [headers.map(sanitizeCsvValue).join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  recordAuditLog({
    eventType: 'DATA_EXPORTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    outcome: 'SUCCESS',
    changeSummary: `Exported ${records.length} FDR records as CSV with formula-injection sanitization.`,
    ipAddress: req.ip,
  });

  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="AICTE_FDR_Report_${timestamp}.csv"`);
  return res.send(csvContent);
});
