import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { User, UserRole } from './types.js';
import { recordAuditLog } from './audit.js';

const JWT_SECRET = process.env.JWT_SECRET || 'aicte-fdr-portal-secure-token-secret-2026';
const TOKEN_EXPIRY = '8h';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 2. Check cookies
  if (!token && (req as any).cookies && (req as any).cookies.fdr_auth_token) {
    token = (req as any).cookies.fdr_auth_token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please sign in to access this resource.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getData().users.find((u) => u.id === decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User session invalid or account deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session token has expired or is invalid.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      recordAuditLog({
        eventType: 'ACCESS_DENIED',
        actorId: req.user.id,
        actorName: req.user.name,
        actorRole: req.user.role,
        outcome: 'FAILURE',
        changeSummary: `Unauthorized access attempt to endpoint ${req.method} ${req.originalUrl}. Required: [${allowedRoles.join(', ')}].`,
        ipAddress: req.ip,
      });

      return res.status(403).json({
        error: 'Forbidden: You do not possess the required permissions to perform this action.',
      });
    }

    next();
  };
}

/**
 * Check if the requested institution ID is authorized for the current user.
 * Prevents cross-institution data access (IDOR / BOLA protection).
 */
export function verifyInstitutionAccess(
  req: AuthenticatedRequest,
  institutionId: string
): boolean {
  if (!req.user) return false;
  // System Admin and Verification Officer have broad authorized review scope
  if (req.user.role === 'SYSTEM_ADMIN' || req.user.role === 'VERIFICATION_OFFICER') {
    return true;
  }
  // Institution User can strictly only access their own institution's data
  return req.user.institutionId === institutionId;
}
