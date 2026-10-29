import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest, authenticateToken, requireRole } from '../auth.js';
import { recordAuditLog } from '../audit.js';

export const adminRouter = Router();
adminRouter.use(authenticateToken);

// GET /api/admin/audit-logs - Query immutable audit trail (Admin & Officer only)
adminRouter.get(
  '/audit-logs',
  requireRole(['SYSTEM_ADMIN', 'VERIFICATION_OFFICER']),
  (req: AuthenticatedRequest, res: Response) => {
    const data = db.getData();
    const { eventType, actorRole, outcome, search, limit = '100' } = req.query as Record<string, string>;

    let logs = [...data.auditLogs];

    if (eventType && eventType !== 'ALL') {
      logs = logs.filter((l) => l.eventType === eventType);
    }

    if (actorRole && actorRole !== 'ALL') {
      logs = logs.filter((l) => l.actorRole === actorRole);
    }

    if (outcome && outcome !== 'ALL') {
      logs = logs.filter((l) => l.outcome === outcome);
    }

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actorName.toLowerCase().includes(q) ||
          l.changeSummary.toLowerCase().includes(q) ||
          (l.targetRecordId && l.targetRecordId.toLowerCase().includes(q))
      );
    }

    const maxItems = Math.min(500, parseInt(limit, 10) || 100);
    return res.json({
      auditLogs: logs.slice(0, maxItems),
      total: logs.length,
    });
  }
);

// GET /api/admin/users - Manage users (Admin only)
adminRouter.get('/users', requireRole(['SYSTEM_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const users = db.getData().users.map(({ passwordHash, ...safeUser }) => safeUser);
  return res.json({ users });
});

// PATCH /api/admin/users/:id/toggle-status - Activate/Deactivate user
adminRouter.patch(
  '/users/:id/toggle-status',
  requireRole(['SYSTEM_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const data = db.getData();
    const targetUser = data.users.find((u) => u.id === id);

    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.id === user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
    }

    targetUser.isActive = !targetUser.isActive;
    db.save();

    recordAuditLog({
      eventType: 'SYSTEM_SETTINGS_UPDATED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetRecordId: targetUser.id,
      targetType: 'USER',
      outcome: 'SUCCESS',
      changeSummary: `User ${targetUser.email} account status updated to ${targetUser.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`,
      ipAddress: req.ip,
    });

    return res.json({ success: true, isActive: targetUser.isActive });
  }
);

// GET /api/admin/institutions - Manage institutions
adminRouter.get('/institutions', (req: AuthenticatedRequest, res: Response) => {
  const institutions = db.getData().institutions;
  return res.json({ institutions });
});

// GET /api/admin/settings - System settings
adminRouter.get('/settings', requireRole(['SYSTEM_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  return res.json({ settings: db.getData().settings });
});

// PATCH /api/admin/settings - Update system settings
adminRouter.patch(
  '/settings',
  requireRole(['SYSTEM_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const data = db.getData();
    const updates = req.body;

    data.settings = {
      ...data.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    };
    db.save();

    recordAuditLog({
      eventType: 'SYSTEM_SETTINGS_UPDATED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      targetType: 'SETTINGS',
      outcome: 'SUCCESS',
      changeSummary: `System configuration updated by ${user.name}.`,
      ipAddress: req.ip,
    });

    return res.json({ settings: data.settings });
  }
);

// POST /api/admin/reset-demo-data - Safe reseed endpoint for presentation
adminRouter.post(
  '/reset-demo-data',
  requireRole(['SYSTEM_ADMIN']),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    db.reseed();

    recordAuditLog({
      eventType: 'SYSTEM_SETTINGS_UPDATED',
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      outcome: 'SUCCESS',
      changeSummary: `Demo dataset safely re-initialized by administrator.`,
      ipAddress: req.ip,
    });

    return res.json({ message: 'Demo data re-seeded successfully.' });
  }
);
