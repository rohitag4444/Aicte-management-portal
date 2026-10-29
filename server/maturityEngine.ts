import { db } from './db.js';
import { FDRRecord, SystemNotification } from './types.js';

export interface MaturityOverview {
  totalActiveOrMatured: number;
  upcoming30Days: number;
  upcoming15Days: number;
  upcoming7Days: number;
  maturedUnresolved: number;
  renewalPending: number;
  records: Array<FDRRecord & { daysUntilMaturity: number; urgency: 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'HEALTHY' | 'OVERDUE' }>;
}

export function evaluateMaturityStatuses(): {
  updatedCount: number;
  newAlertsCount: number;
} {
  const data = db.getData();
  const now = new Date();
  // Normalize today at midnight UTC for accurate day calculations
  const todayMs = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  let updatedCount = 0;
  let newAlertsCount = 0;

  for (const fdr of data.fdrRecords) {
    // Only check records that are approved and not closed
    if (fdr.verificationStatus !== 'APPROVED' || fdr.lifecycleStatus === 'CLOSED') {
      continue;
    }

    const matDate = new Date(fdr.maturityDate);
    const matMs = new Date(Date.UTC(matDate.getFullYear(), matDate.getMonth(), matDate.getDate())).getTime();
    const diffDays = Math.round((matMs - todayMs) / MS_PER_DAY);

    let newAlertLevel: FDRRecord['maturityAlertLevel'] = 'NONE';
    let newLifecycle = fdr.lifecycleStatus;

    if (diffDays < 0) {
      newAlertLevel = 'OVERDUE';
      if (fdr.lifecycleStatus !== 'RENEWAL_REQUESTED' && fdr.lifecycleStatus !== 'RELEASE_REQUESTED') {
        newLifecycle = 'MATURED';
      }
    } else if (diffDays === 0) {
      newAlertLevel = 'DUE_TODAY';
      if (fdr.lifecycleStatus !== 'RENEWAL_REQUESTED' && fdr.lifecycleStatus !== 'RELEASE_REQUESTED') {
        newLifecycle = 'MATURED';
      }
    } else if (diffDays <= 7) {
      newAlertLevel = 'SEVEN_DAYS';
      if (fdr.lifecycleStatus === 'ACTIVE') newLifecycle = 'MATURITY_APPROACHING';
    } else if (diffDays <= 15) {
      newAlertLevel = 'FIFTEEN_DAYS';
      if (fdr.lifecycleStatus === 'ACTIVE') newLifecycle = 'MATURITY_APPROACHING';
    } else if (diffDays <= 30) {
      newAlertLevel = 'THIRTY_DAYS';
      if (fdr.lifecycleStatus === 'ACTIVE') newLifecycle = 'MATURITY_APPROACHING';
    } else {
      newAlertLevel = 'NONE';
    }

    let changed = false;
    if (fdr.lifecycleStatus !== newLifecycle) {
      fdr.lifecycleStatus = newLifecycle;
      changed = true;
    }

    // Trigger in-app notification if alert level escalated and not previously notified for this level
    if (newAlertLevel !== 'NONE' && fdr.maturityAlertLevel !== newAlertLevel) {
      fdr.maturityAlertLevel = newAlertLevel;
      fdr.lastAlertSentAt = new Date().toISOString();
      changed = true;

      // Create in-app notification for the institution
      const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const notif: SystemNotification = {
        id: notifId,
        recipientRole: 'INSTITUTION_USER',
        recipientInstitutionId: fdr.institutionId,
        title:
          diffDays < 0
            ? `OVERDUE: FDR ${fdr.fdrNumber} Matured`
            : diffDays === 0
            ? `URGENT: FDR ${fdr.fdrNumber} Matures Today`
            : `Maturity Alert: FDR ${fdr.fdrNumber} (${diffDays} days remaining)`,
        message: `FDR of ₹${(fdr.depositAmountINR).toLocaleString('en-IN')} with ${fdr.bankName} (${fdr.fdrNumber}) requires renewal or release action.`,
        type: diffDays <= 7 ? 'ALERT' : 'WARNING',
        linkedFdrId: fdr.id,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      data.notifications.unshift(notif);
      newAlertsCount++;
    }

    if (changed) {
      fdr.updatedAt = new Date().toISOString();
      updatedCount++;
    }
  }

  if (updatedCount > 0 || newAlertsCount > 0) {
    db.save();
  }

  return { updatedCount, newAlertsCount };
}

export function getMaturityOverview(userInstitutionId?: string): MaturityOverview {
  const data = db.getData();
  const now = new Date();
  const todayMs = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).getTime();
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  let records = data.fdrRecords.filter(
    (r) => r.verificationStatus === 'APPROVED' && r.lifecycleStatus !== 'CLOSED'
  );

  if (userInstitutionId) {
    records = records.filter((r) => r.institutionId === userInstitutionId);
  }

  let upcoming30Days = 0;
  let upcoming15Days = 0;
  let upcoming7Days = 0;
  let maturedUnresolved = 0;
  let renewalPending = 0;

  const enriched = records.map((fdr) => {
    const matDate = new Date(fdr.maturityDate);
    const matMs = new Date(Date.UTC(matDate.getFullYear(), matDate.getMonth(), matDate.getDate())).getTime();
    const daysUntilMaturity = Math.round((matMs - todayMs) / MS_PER_DAY);

    let urgency: 'CRITICAL' | 'WARNING' | 'UPCOMING' | 'HEALTHY' | 'OVERDUE' = 'HEALTHY';
    if (daysUntilMaturity < 0) {
      urgency = 'OVERDUE';
      maturedUnresolved++;
    } else if (daysUntilMaturity <= 7) {
      urgency = 'CRITICAL';
      upcoming7Days++;
      upcoming15Days++;
      upcoming30Days++;
    } else if (daysUntilMaturity <= 15) {
      urgency = 'WARNING';
      upcoming15Days++;
      upcoming30Days++;
    } else if (daysUntilMaturity <= 30) {
      urgency = 'UPCOMING';
      upcoming30Days++;
    }

    if (fdr.lifecycleStatus === 'RENEWAL_REQUESTED') {
      renewalPending++;
    }

    return {
      ...fdr,
      daysUntilMaturity,
      urgency,
    };
  });

  // Sort by urgency: earliest maturing or overdue first
  enriched.sort((a, b) => a.daysUntilMaturity - b.daysUntilMaturity);

  return {
    totalActiveOrMatured: records.length,
    upcoming30Days,
    upcoming15Days,
    upcoming7Days,
    maturedUnresolved,
    renewalPending,
    records: enriched,
  };
}
