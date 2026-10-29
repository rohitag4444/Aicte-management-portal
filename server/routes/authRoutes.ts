import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { generateToken, AuthenticatedRequest, authenticateToken } from '../auth.js';
import { recordAuditLog } from '../audit.js';
import { User } from '../types.js';

export const authRouter = Router();

// POST /api/auth/login
// Accepts ANY credentials for Institute or AICTE Department login
authRouter.post('/login', async (req, res: Response) => {
  const { identifier, email, password, loginType = 'INSTITUTE' } = req.body;
  const loginId = (identifier || email || '').trim();

  if (!loginId) {
    return res.status(400).json({ error: 'Please enter a valid Login ID, AICTE Application ID, or Email.' });
  }

  const data = db.getData();
  const lowerId = loginId.toLowerCase();

  // 1. Try to find existing matching user by email or AICTE institution code or username
  let user = data.users.find(
    (u) =>
      u.email.toLowerCase() === lowerId ||
      u.id.toLowerCase() === lowerId ||
      (u.institutionId && u.institutionId.toLowerCase() === lowerId)
  );

  // 2. If user exists, update login timestamp
  if (user) {
    user.lastLoginAt = new Date().toISOString();
    db.save();
  } else {
    // 3. User requested: "accept evry login details"
    // Dynamically provision account for the given login type so ANY input succeeds!
    if (loginType === 'AICTE_DEPT') {
      const isHqAdmin = lowerId.includes('admin') || lowerId.includes('hq');
      user = {
        id: `usr-dept-${Date.now()}`,
        email: loginId.includes('@') ? loginId : `${loginId}@aicte.gov.in`,
        name: isHqAdmin ? `AICTE Administrator (${loginId})` : `AICTE Scrutiny Officer (${loginId})`,
        role: isHqAdmin ? 'SYSTEM_ADMIN' : 'VERIFICATION_OFFICER',
        designation: isHqAdmin
          ? 'AICTE Headquarters System Administrator'
          : 'AICTE Regional Scrutiny Officer',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      db.save();
    } else {
      // Institute User
      const newInstId = `INST-${Date.now().toString().slice(-4)}`;
      const cleanAicteCode = loginId.startsWith('1-') ? loginId : `1-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const instName = loginId.includes('@')
        ? loginId.split('@')[1].replace(/\.[^/.]+$/, '').toUpperCase() + ' Technical Institute'
        : `AICTE Approved Institute (${loginId})`;

      // Create new institution if not exists
      const newInst = {
        id: newInstId,
        aicteCode: cleanAicteCode,
        name: instName,
        category: 'Engineering & Tech' as const,
        state: 'Delhi',
        city: 'New Delhi',
        address: 'Institutional Area, Technical Campus',
        trustName: 'Educational & Charitable Trust',
        establishedYear: 2010,
        contactEmail: loginId.includes('@') ? loginId : `${loginId}@institute.ac.in`,
        contactPhone: '+91 11 2800 1234',
        totalApprovedFDRs: 0,
        totalDepositAmountINR: 0,
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
      };
      data.institutions.push(newInst);

      user = {
        id: `usr-inst-${Date.now()}`,
        email: loginId.includes('@') ? loginId : `${loginId}@institute.ac.in`,
        name: `Institutional Representative (${loginId})`,
        role: 'INSTITUTION_USER',
        institutionId: newInstId,
        institutionName: instName,
        designation: 'Authorized Signatory & Principal Representative',
        isActive: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      data.users.push(user);
      db.save();
    }
  }

  const token = generateToken(user);

  recordAuditLog({
    eventType: 'AUTH_LOGIN_SUCCESS',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    outcome: 'SUCCESS',
    changeSummary: `User ${user.name} (${user.role}) logged in via ${loginType === 'AICTE_DEPT' ? 'AICTE Department Gateway' : 'Institute Portal'}.`,
    ipAddress: req.ip,
  });

  res.cookie('fdr_auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({
    token,
    user: safeUser,
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { passwordHash, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

// POST /api/auth/logout
authRouter.post('/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    recordAuditLog({
      eventType: 'AUTH_LOGOUT',
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      outcome: 'SUCCESS',
      changeSummary: `User logged out and session invalidated.`,
      ipAddress: req.ip,
    });
  }

  res.clearCookie('fdr_auth_token');
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/demo-accounts - Returns quick pre-set accounts for testing
authRouter.get('/demo-accounts', (req, res: Response) => {
  const users = db.getData().users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    institutionName: u.institutionName,
    designation: u.designation,
  }));
  return res.json({ demoAccounts: users });
});

// POST /api/auth/demo-switch - Switch active user session
authRouter.post('/demo-switch', (req, res: Response) => {
  const { userId } = req.body;
  const user = db.getData().users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.lastLoginAt = new Date().toISOString();
  db.save();

  const token = generateToken(user);
  res.cookie('fdr_auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });

  recordAuditLog({
    eventType: 'AUTH_LOGIN_SUCCESS',
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    outcome: 'SUCCESS',
    changeSummary: `Switched user context to: ${user.name} (${user.role})`,
    ipAddress: req.ip,
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});
