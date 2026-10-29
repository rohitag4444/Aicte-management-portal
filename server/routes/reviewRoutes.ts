import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../auth.js';
import { recordAuditLog } from '../audit.js';
import { SystemNotification } from '../types.js';

export const reviewRouter = Router();
reviewRouter.use(authenticateToken);

// GET /api/reviews/queue - Verification Queue (Officer only)
reviewRouter.get(
  '/queue',
  requireRole(['VERIFICATION_OFFICER', 'SYSTEM_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const user = req.user!;

    // Records that require scrutiny
    const queue = data.fdrRecords.filter(
      (r) =>
        r.verificationStatus === 'SUBMITTED' ||
        r.verificationStatus === 'UNDER_REVIEW'
    );

    // Also include stats
    const totalPending = queue.length;
    const correctionAwaitingResubmit = data.fdrRecords.filter(
      (r) => r.verificationStatus === 'CORRECTION_REQUIRED'
    ).length;
    const recentlyApproved = data.fdrRecords.filter(
      (r) => r.verificationStatus === 'APPROVED'
    ).length;

    return res.json({
      queue,
      stats: {
        totalPending,
        correctionAwaitingResubmit,
        recentlyApproved,
      },
    });
  }
);

// POST /api/reviews/:id/start-review
reviewRouter.post(
  '/:id/start-review',
  requireRole(['VERIFICATION_OFFICER']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = db.getData();
    const record = data.fdrRecords.find((r) => r.id === id);

    if (!record) {
      return res.status(404).json({ error: 'FDR record not found' });
    }

    if (record.verificationStatus !== 'SUBMITTED') {
      return res.status(400).json({
        error: `Cannot start review: Record is currently in status "${record.verificationStatus}".`,
      });
    }

    record.verificationStatus = 'UNDER_REVIEW';
    record.assignedReviewerId = user.id;
    record.assignedReviewerName = user.name;
    record.updatedAt = new Date().toISOString();

    record.timeline.push({
      id: `tm-${Date.now()}`,
      fdrRecordId: record.id,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      action: 'START_REVIEW',
      notes: `Review initiated by ${user.name} (${user.designation}).`,
      createdAt: new Date().toISOString(),
    });

    db.save();

    return res.json({ record, message: 'Review successfully claimed and started.' });
  }
);

// POST /api/reviews/:id/approve - Approve FDR
reviewRouter.post(
  '/:id/approve',
  requireRole(['VERIFICATION_OFFICER']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = db.getData();
    const record = data.fdrRecords.find((r) => r.id === id);

    if (!record) {
      return res.status(404).json({ error: 'FDR record not found' });
    }

    if (
      record.verificationStatus !== 'SUBMITTED' &&
      record.verificationStatus !== 'UNDER_REVIEW'
    ) {
      return res.status(400).json({
        error: `Invalid transition: Cannot approve record with verification status "${record.verificationStatus}".`,
      });
    }

    const { notes = 'All mandatory documents, bank endorsement, and joint lien clauses verified compliant with AICTE Approval Process Handbook.' } =
      req.body;

    record.verificationStatus = 'APPROVED';
    record.lifecycleStatus = 'ACTIVE';
    record.assignedReviewerId = user.id;
    record.assignedReviewerName = user.name;
    record.reviewDecisionAt = new Date().toISOString();
    record.reviewDecisionBy = user.name;
    record.updatedAt = new Date().toISOString();

    record.timeline.push({
      id: `tm-${Date.now()}`,
      fdrRecordId: record.id,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      action: 'APPROVE',
      notes,
      createdAt: new Date().toISOString(),
    });

    // Notify institution
    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'INSTITUTION_USER',
      recipientInstitutionId: record.institutionId,
      title: `FDR Record Approved: ${record.id}`,
      message: `Your FDR of ₹${record.depositAmountINR.toLocaleString('en-IN')} with ${record.bankName} (#${record.fdrNumber}) has been approved by Regional Scrutiny Officer ${user.name}.`,
      type: 'SUCCESS',
      linkedFdrId: record.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notif);

    // Update institution aggregates
    const institution = data.institutions.find((i) => i.id === record.institutionId);
    if (institution) {
      const allApproved = data.fdrRecords.filter(
        (r) => r.institutionId === institution.id && r.verificationStatus === 'APPROVED'
      );
      institution.totalApprovedFDRs = allApproved.length;
      institution.totalDepositAmountINR = allApproved.reduce(
        (sum, r) => sum + r.depositAmountINR,
        0
      );
    }

    db.save();

    recordAuditLog({
      eventType: 'FDR_APPROVED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: record.id,
      targetType: 'FDR',
      outcome: 'SUCCESS',
      changeSummary: `FDR ${record.id} approved by ${user.name}. Financial lifecycle state set to ACTIVE.`,
      ipAddress: req.ip,
    });

    return res.json({ record, message: 'FDR successfully verified and approved.' });
  }
);

// POST /api/reviews/:id/request-correction - Request correction with mandatory feedback
reviewRouter.post(
  '/:id/request-correction',
  requireRole(['VERIFICATION_OFFICER']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = db.getData();
    const record = data.fdrRecords.find((r) => r.id === id);

    if (!record) {
      return res.status(404).json({ error: 'FDR record not found' });
    }

    if (
      record.verificationStatus !== 'SUBMITTED' &&
      record.verificationStatus !== 'UNDER_REVIEW'
    ) {
      return res.status(400).json({
        error: `Cannot request correction: Record status is "${record.verificationStatus}".`,
      });
    }

    const { correctionRequirements, reasonCategory = 'Document Discrepancy' } = req.body;
    if (!correctionRequirements || correctionRequirements.trim().length < 10) {
      return res.status(400).json({
        error: 'Mandatory correction instructions required (minimum 10 characters).',
      });
    }

    record.verificationStatus = 'CORRECTION_REQUIRED';
    record.correctionRequirements = correctionRequirements.trim();
    record.assignedReviewerId = user.id;
    record.assignedReviewerName = user.name;
    record.updatedAt = new Date().toISOString();

    record.timeline.push({
      id: `tm-${Date.now()}`,
      fdrRecordId: record.id,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      action: 'REQUEST_CORRECTION',
      notes: correctionRequirements.trim(),
      reasonCategory,
      createdAt: new Date().toISOString(),
    });

    // Notify institution
    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'INSTITUTION_USER',
      recipientInstitutionId: record.institutionId,
      title: `Action Required: Correction Requested on FDR ${record.id}`,
      message: `Scrutiny Officer ${user.name} has requested corrections on FDR #${record.fdrNumber}: ${correctionRequirements.substring(0, 120)}...`,
      type: 'WARNING',
      linkedFdrId: record.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notif);

    db.save();

    recordAuditLog({
      eventType: 'FDR_CORRECTION_REQUESTED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: record.id,
      targetType: 'FDR',
      outcome: 'WARNING',
      changeSummary: `Correction requested for FDR ${record.id}: ${correctionRequirements.substring(0, 100)}`,
      ipAddress: req.ip,
    });

    return res.json({ record, message: 'Correction request recorded and dispatched to institution.' });
  }
);

// POST /api/reviews/:id/reject - Reject FDR submission with mandatory reason
reviewRouter.post(
  '/:id/reject',
  requireRole(['VERIFICATION_OFFICER']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = db.getData();
    const record = data.fdrRecords.find((r) => r.id === id);

    if (!record) {
      return res.status(404).json({ error: 'FDR record not found' });
    }

    const { rejectionReason, reasonCategory = 'Eligibility Non-Compliance' } = req.body;
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        error: 'Mandatory rejection reason required (minimum 10 characters).',
      });
    }

    record.verificationStatus = 'REJECTED';
    record.rejectionReason = rejectionReason.trim();
    record.assignedReviewerId = user.id;
    record.assignedReviewerName = user.name;
    record.reviewDecisionAt = new Date().toISOString();
    record.reviewDecisionBy = user.name;
    record.updatedAt = new Date().toISOString();

    record.timeline.push({
      id: `tm-${Date.now()}`,
      fdrRecordId: record.id,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerRole: user.role,
      action: 'REJECT',
      notes: rejectionReason.trim(),
      reasonCategory,
      createdAt: new Date().toISOString(),
    });

    // Notify institution
    const notif: SystemNotification = {
      id: `notif-${Date.now()}`,
      recipientRole: 'INSTITUTION_USER',
      recipientInstitutionId: record.institutionId,
      title: `Submission Rejected: FDR ${record.id}`,
      message: `Your FDR #${record.fdrNumber} was rejected by scrutiny officer ${user.name}. Reason: ${rejectionReason}`,
      type: 'ALERT',
      linkedFdrId: record.id,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    data.notifications.unshift(notif);

    db.save();

    recordAuditLog({
      eventType: 'FDR_REJECTED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: record.id,
      targetType: 'FDR',
      outcome: 'FAILURE',
      changeSummary: `FDR ${record.id} rejected: ${rejectionReason}`,
      ipAddress: req.ip,
    });

    return res.json({ record, message: 'FDR submission rejected with recorded rationale.' });
  }
);
