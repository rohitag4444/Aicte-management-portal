import { db } from './db.js';
import { AuditLog, UserRole } from './types.js';

export function recordAuditLog(params: {
  eventType: AuditLog['eventType'];
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetRecordId?: string;
  targetType?: AuditLog['targetType'];
  outcome: 'SUCCESS' | 'FAILURE' | 'WARNING';
  changeSummary: string;
  ipAddress?: string;
  correlationId?: string;
}): AuditLog {
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    eventType: params.eventType,
    actorId: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    targetRecordId: params.targetRecordId,
    targetType: params.targetType,
    outcome: params.outcome,
    changeSummary: params.changeSummary,
    ipAddress: params.ipAddress || '127.0.0.1',
    timestamp: new Date().toISOString(),
    correlationId: params.correlationId || `req-${Date.now()}`,
  };

  const data = db.getData();
  // Append-only guarantee: unshift or push
  data.auditLogs.unshift(log);
  // Keep up to 2000 logs in storage
  if (data.auditLogs.length > 2000) {
    data.auditLogs = data.auditLogs.slice(0, 2000);
  }
  db.save();
  return log;
}
