import { db } from './db.js';
import { FDRRecord } from './types.js';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  score: number; // 0 - 100
  matchedRecords: Array<{
    recordId: string;
    institutionName: string;
    aicteCode: string;
    fdrNumber: string;
    bankName: string;
    depositAmountINR: number;
    issueDate: string;
    maturityDate: string;
    matchedFields: string[];
    explanation: string;
  }>;
}

export function checkFdrDuplicates(
  candidate: {
    id?: string;
    institutionId: string;
    bankName: string;
    fdrNumber: string;
    depositAmountINR: number;
    issueDate: string;
    maturityDate: string;
  }
): DuplicateCheckResult {
  const data = db.getData();
  const normalizedCandidateFDR = candidate.fdrNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedCandidateBank = candidate.bankName.trim().toLowerCase();

  const matches: DuplicateCheckResult['matchedRecords'] = [];
  let highestScore = 0;

  for (const record of data.fdrRecords) {
    // Don't compare with itself if editing
    if (candidate.id && record.id === candidate.id) continue;

    const normalizedRecordFDR = record.fdrNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedRecordBank = record.bankName.trim().toLowerCase();

    const matchedFields: string[] = [];
    let recordScore = 0;

    // 1. Exact or normalized FDR Number match (Weight: 50)
    if (normalizedCandidateFDR && normalizedRecordFDR && normalizedCandidateFDR === normalizedRecordFDR) {
      matchedFields.push('FDR Receipt Number');
      recordScore += 50;
    }

    // 2. Bank match (Weight: 20)
    if (
      normalizedCandidateBank &&
      normalizedRecordBank &&
      (normalizedCandidateBank.includes(normalizedRecordBank) ||
        normalizedRecordBank.includes(normalizedCandidateBank))
    ) {
      matchedFields.push('Bank Name');
      recordScore += 20;
    }

    // 3. Deposit Amount match (Weight: 15)
    if (
      candidate.depositAmountINR > 0 &&
      record.depositAmountINR === candidate.depositAmountINR
    ) {
      matchedFields.push('Deposit Amount');
      recordScore += 15;
    }

    // 4. Issue Date match (Weight: 10)
    if (candidate.issueDate && record.issueDate === candidate.issueDate) {
      matchedFields.push('Issue Date');
      recordScore += 10;
    }

    // 5. Maturity Date match (Weight: 5)
    if (candidate.maturityDate && record.maturityDate === candidate.maturityDate) {
      matchedFields.push('Maturity Date');
      recordScore += 5;
    }

    // If FDR number matched or score >= 65, flag for review
    if (recordScore >= 50) {
      let explanation = '';
      if (candidate.institutionId === record.institutionId) {
        explanation = `Matches existing record ${record.id} in your institution with identical ${matchedFields.join(', ')}.`;
      } else {
        explanation = `Cross-institution collision: Matches record ${record.id} at "${record.institutionName}" (${record.aicteCode}) with matching ${matchedFields.join(', ')}.`;
      }

      matches.push({
        recordId: record.id,
        institutionName: record.institutionName,
        aicteCode: record.aicteCode,
        fdrNumber: record.fdrNumber,
        bankName: record.bankName,
        depositAmountINR: record.depositAmountINR,
        issueDate: record.issueDate,
        maturityDate: record.maturityDate,
        matchedFields,
        explanation,
      });

      if (recordScore > highestScore) {
        highestScore = recordScore;
      }
    }
  }

  return {
    isDuplicate: matches.length > 0,
    score: highestScore,
    matchedRecords: matches,
  };
}
