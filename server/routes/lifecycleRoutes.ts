import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticateToken, requireRole, verifyInstitutionAccess } from '../auth.js';
import { recordAuditLog } from '../audit.js';
import { RenewalRequest, ReleaseRequest, SystemNotification } from '../types.js';

export const lifecycleRouter = Router();
lifecycleRouter.use(authenticateToken);

// GET /api/lifecycle/requests - List renewal & release requests
lifecycleRouter.get('/requests', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let renewals = [...data.renewalRequests];
  let releases = [...data.releaseRequests];

  if (user.role === 'INSTITUTION_USER') {
    renewals = renewals.filter((r) => r.institutionId === user.institutionId);
    releases = releases.filter((r) => r.institutionId === user.institutionId);
  }

  return res.json({
    renewalRequests: renewals,
    releaseRequests: releases,
  });
});

// POST /api/fdr/:id/renewal-requests - Submit Renewal Request
lifecycleRouter.post('/fdr/:id/renewal-requests', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const fdr = data.fdrRecords.find((r) => r.id === id);

  if (!fdr) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  if (!verifyInstitutionAccess(req, fdr.institutionId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (fdr.verificationStatus !== 'APPROVED') {
    return res.status(400).json({ error: 'Only approved FDR records can be renewed.' });
  }

  const { proposedTenureMonths, proposedMaturityDate, justification, supportingDocumentId } = req.body;

  if (!proposedTenureMonths || proposedTenureMonths < 1) {
    return res.status(400).json({ error: 'Proposed tenure in months is required.' });
  }
  if (!justification || justification.trim().length < 10) {
    return res.status(400).json({ error: 'Detailed justification required (minimum 10 characters).' });
  }

  const renewalReq: RenewalRequest = {
    id: `ren-req-${Date.now()}`,
    fdrRecordId: fdr.id,
    institutionId: fdr.institutionId,
    requestedBy: { id: user.id, name: user.name },
    requestDate: new Date().toISOString().split('T')[0],
    proposedTenureMonths: Number(proposedTenureMonths),
    proposedMaturityDate: proposedMaturityDate || '',
    justification: justification.trim(),
    supportingDocumentId,
    status: 'PENDING',
  };

  data.renewalRequests.unshift(renewalReq);
  fdr.lifecycleStatus = 'RENEWAL_REQUESTED';
  fdr.updatedAt = new Date().toISOString();

  fdr.timeline.push({
    id: `tm-${Date.now()}`,
    fdrRecordId: fdr.id,
    reviewerId: user.id,
    reviewerName: user.name,
    reviewerRole: user.role,
    action: 'SUBMIT',
    notes: `Renewal request submitted for ${proposedTenureMonths} months tenure. Justification: ${justification.trim()}`,
    createdAt: new Date().toISOString(),
  });

  // Notify Verification Officers
  const notif: SystemNotification = {
    id: `notif-${Date.now()}`,
    recipientRole: 'VERIFICATION_OFFICER',
    title: `Renewal Request: ${fdr.id}`,
    message: `${fdr.institutionName} requested renewal for FDR #${fdr.fdrNumber} (₹${fdr.depositAmountINR.toLocaleString('en-IN')}).`,
    type: 'INFO',
    linkedFdrId: fdr.id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  data.notifications.unshift(notif);

  db.save();

  recordAuditLog({
    eventType: 'RENEWAL_REQUESTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: fdr.id,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `Submitted renewal request for FDR ${fdr.id} (${proposedTenureMonths} months).`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ renewalRequest: renewalReq, fdr });
});

// POST /api/fdr/:id/release-requests - Submit Release / Closure Request
lifecycleRouter.post('/fdr/:id/release-requests', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const data = db.getData();
  const fdr = data.fdrRecords.find((r) => r.id === id);

  if (!fdr) {
    return res.status(404).json({ error: 'FDR record not found' });
  }

  if (!verifyInstitutionAccess(req, fdr.institutionId)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  if (fdr.verificationStatus !== 'APPROVED') {
    return res.status(400).json({ error: 'Only approved FDR records can have release requests.' });
  }

  const { reasonForRelease, nocDetails, supportingDocumentId } = req.body;

  if (!reasonForRelease) {
    return res.status(400).json({ error: 'Reason for release is required.' });
  }
  if (!nocDetails || nocDetails.trim().length < 10) {
    return res.status(400).json({ error: 'AICTE Council NOC or programme closure reference details required.' });
  }

  const releaseReq: ReleaseRequest = {
    id: `rel-req-${Date.now()}`,
    fdrRecordId: fdr.id,
    institutionId: fdr.institutionId,
    requestedBy: { id: user.id, name: user.name },
    requestDate: new Date().toISOString().split('T')[0],
    reasonForRelease,
    nocDetails: nocDetails.trim(),
    supportingDocumentId,
    status: 'PENDING',
  };

  data.releaseRequests.unshift(releaseReq);
  fdr.lifecycleStatus = 'RELEASE_REQUESTED';
  fdr.updatedAt = new Date().toISOString();

  fdr.timeline.push({
    id: `tm-${Date.now()}`,
    fdrRecordId: fdr.id,
    reviewerId: user.id,
    reviewerName: user.name,
    reviewerRole: user.role,
    action: 'SUBMIT',
    notes: `Release / Closure request submitted. Reason: ${reasonForRelease}. NOC Details: ${nocDetails.trim()}`,
    createdAt: new Date().toISOString(),
  });

  db.save();

  recordAuditLog({
    eventType: 'RELEASE_REQUESTED',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    targetRecordId: fdr.id,
    targetType: 'FDR',
    outcome: 'SUCCESS',
    changeSummary: `Submitted release request for FDR ${fdr.id} (${reasonForRelease}).`,
    ipAddress: req.ip,
  });

  return res.status(201).json({ releaseRequest: releaseReq, fdr });
});

// POST /api/lifecycle/requests/:type/:id/decide - Reviewer approves/rejects renewal or release
lifecycleRouter.post(
  '/requests/:type/:id/decide',
  requireRole(['VERIFICATION_OFFICER', 'SYSTEM_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const { type, id } = req.params; // type: 'renewal' or 'release'
    const { decision, notes } = req.body; // decision: 'APPROVE' or 'REJECT'
    const user = req.user!;
    const data = db.getData();

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return res.status(400).json({ error: 'Decision must be APPROVE or REJECT' });
    }

    if (type === 'renewal') {
      const request = data.renewalRequests.find((r) => r.id === id);
      if (!request) return res.status(404).json({ error: 'Renewal request not found' });

      request.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      request.reviewedBy = { id: user.id, name: user.name };
      request.reviewNotes = notes || '';
      request.reviewedAt = new Date().toISOString();

      const fdr = data.fdrRecords.find((r) => r.id === request.fdrRecordId);
      if (fdr) {
        if (decision === 'APPROVE') {
          fdr.lifecycleStatus = 'ACTIVE';
          fdr.tenureMonths = request.proposedTenureMonths;
          if (request.proposedMaturityDate) {
            fdr.maturityDate = request.proposedMaturityDate;
          }
          fdr.maturityAlertLevel = 'NONE';
        } else {
          fdr.lifecycleStatus = 'MATURED';
        }
        fdr.updatedAt = new Date().toISOString();
      }

      db.save();

      recordAuditLog({
        eventType: 'RENEWAL_DECIDED',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetRecordId: request.fdrRecordId,
        targetType: 'FDR',
        outcome: decision === 'APPROVE' ? 'SUCCESS' : 'WARNING',
        changeSummary: `Renewal request ${request.id} for FDR ${request.fdrRecordId} was ${decision}D by ${user.name}.`,
        ipAddress: req.ip,
      });

      return res.json({ request, fdr });
    } else if (type === 'release') {
      const request = data.releaseRequests.find((r) => r.id === id);
      if (!request) return res.status(404).json({ error: 'Release request not found' });

      request.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      request.reviewedBy = { id: user.id, name: user.name };
      request.reviewNotes = notes || '';
      request.reviewedAt = new Date().toISOString();

      const fdr = data.fdrRecords.find((r) => r.id === request.fdrRecordId);
      if (fdr) {
        if (decision === 'APPROVE') {
          fdr.lifecycleStatus = 'CLOSED';
        } else {
          fdr.lifecycleStatus = 'ACTIVE';
        }
        fdr.updatedAt = new Date().toISOString();
      }

      db.save();

      recordAuditLog({
        eventType: 'RELEASE_DECIDED',
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        targetRecordId: request.fdrRecordId,
        targetType: 'FDR',
        outcome: decision === 'APPROVE' ? 'SUCCESS' : 'WARNING',
        changeSummary: `Release request ${request.id} for FDR ${request.fdrRecordId} was ${decision}D by ${user.name}.`,
        ipAddress: req.ip,
      });

      return res.json({ request, fdr });
    }

    return res.status(400).json({ error: 'Invalid request type' });
  }
);
