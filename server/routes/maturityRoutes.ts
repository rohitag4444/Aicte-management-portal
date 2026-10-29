import { Router, Response } from 'express';
import { AuthenticatedRequest, authenticateToken } from '../auth.js';
import { getMaturityOverview, evaluateMaturityStatuses } from '../maturityEngine.js';
import { db } from '../db.js';

export const maturityRouter = Router();
maturityRouter.use(authenticateToken);

// GET /api/maturity/overview
maturityRouter.get('/overview', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const instId = user.role === 'INSTITUTION_USER' ? user.institutionId : undefined;
  const overview = getMaturityOverview(instId);
  return res.json(overview);
});

// POST /api/maturity/trigger-evaluation - Manually run the scheduled maturity alert engine
maturityRouter.post('/trigger-evaluation', (req: AuthenticatedRequest, res: Response) => {
  const result = evaluateMaturityStatuses();
  return res.json({
    message: `Maturity evaluation executed successfully.`,
    ...result,
  });
});

// GET /api/maturity/notifications - Get in-app notifications
maturityRouter.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const data = db.getData();

  let notifs = [...data.notifications];

  if (user.role === 'INSTITUTION_USER') {
    notifs = notifs.filter(
      (n) =>
        (n.recipientRole === 'INSTITUTION_USER' && n.recipientInstitutionId === user.institutionId) ||
        n.recipientUserId === user.id
    );
  } else if (user.role === 'VERIFICATION_OFFICER') {
    notifs = notifs.filter(
      (n) => n.recipientRole === 'VERIFICATION_OFFICER' || n.recipientUserId === user.id
    );
  }

  return res.json({ notifications: notifs.slice(0, 30) });
});

// POST /api/maturity/notifications/:id/mark-read
maturityRouter.post('/notifications/:id/mark-read', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = db.getData();
  const notif = data.notifications.find((n) => n.id === id);
  if (notif) {
    notif.isRead = true;
    db.save();
  }
  return res.json({ success: true });
});
