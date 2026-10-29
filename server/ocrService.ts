/**
 * OCR-assisted receipt data extraction service.
 * Modular, secure parser that extracts structured FDR fields from document text or simulated scan.
 * Per specification: Extracted text is treated as UNTRUSTED suggestions and requires human confirmation.
 */

export interface OcrExtractedResult {
  confidenceScore: number; // 0 - 100
  disclaimer: string;
  extractedFields: {
    bankName?: string;
    branchName?: string;
    ifscCode?: string;
    fdrNumber?: string;
    depositAmountINR?: number;
    issueDate?: string;
    maturityDate?: string;
    tenureMonths?: number;
    interestRatePercent?: number;
    jointAccountHolders?: string;
  };
  fieldConfidence: Record<string, number>;
  rawExtractedLines: string[];
}

export function extractFdrFromDocumentText(text: string, filename?: string): OcrExtractedResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const result: OcrExtractedResult = {
    confidenceScore: 0,
    disclaimer:
      'Automated OCR extraction suggestions are advisory only and must be verified against original physical receipts before submission.',
    extractedFields: {},
    fieldConfidence: {},
    rawExtractedLines: lines.slice(0, 15),
  };

  let totalConfidence = 0;
  let detectedFieldCount = 0;

  // 1. Bank Name detection
  const indianBanks = [
    { name: 'State Bank of India', regex: /state bank of india|sbi/i },
    { name: 'Punjab National Bank', regex: /punjab national bank|pnb/i },
    { name: 'Bank of Baroda', regex: /bank of baroda|bob/i },
    { name: 'Canara Bank', regex: /canara bank/i },
    { name: 'Union Bank of India', regex: /union bank of india|union bank/i },
    { name: 'HDFC Bank', regex: /hdfc bank|hdfc/i },
    { name: 'ICICI Bank', regex: /icici bank|icici/i },
    { name: 'Axis Bank', regex: /axis bank/i },
    { name: 'Bank of India', regex: /bank of india/i },
    { name: 'Kotak Mahindra Bank', regex: /kotak mahindra/i },
  ];

  for (const b of indianBanks) {
    if (b.regex.test(text) || (filename && b.regex.test(filename))) {
      result.extractedFields.bankName = b.name;
      result.fieldConfidence.bankName = 92;
      totalConfidence += 92;
      detectedFieldCount++;
      break;
    }
  }

  // 2. FDR Number Detection (e.g. "FDR No: 481920311" or "Receipt No: SBI-FDR-992817451" or alphanumeric)
  const fdrRegex = /(?:fdr|fixed deposit|receipt|fd|account)\s*(?:no\.?|number|#|ref)?[:\-\s]+([A-Z0-9\-]{7,20})/i;
  const fdrMatch = text.match(fdrRegex);
  if (fdrMatch && fdrMatch[1]) {
    result.extractedFields.fdrNumber = fdrMatch[1].trim();
    result.fieldConfidence.fdrNumber = 88;
    totalConfidence += 88;
    detectedFieldCount++;
  } else {
    // Check filename for clue
    const fileFdrMatch = filename?.match(/(?:FDR|Receipt)[_\-]?([A-Z0-9\-]{6,16})/i);
    if (fileFdrMatch) {
      result.extractedFields.fdrNumber = fileFdrMatch[1];
      result.fieldConfidence.fdrNumber = 65;
      totalConfidence += 65;
      detectedFieldCount++;
    }
  }

  // 3. Deposit Amount INR (e.g. ₹ 35,00,000 or Rs. 1500000 or Amount: 2500000)
  const amountRegex = /(?:₹|rs\.?|inr|amount|deposit amount|principal)[:\s]*([0-9,]{5,12})(?:\.\d{2})?/i;
  const amountMatch = text.match(amountRegex);
  if (amountMatch && amountMatch[1]) {
    const cleaned = amountMatch[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 10000) {
      result.extractedFields.depositAmountINR = num;
      result.fieldConfidence.depositAmountINR = 90;
      totalConfidence += 90;
      detectedFieldCount++;
    }
  }

  // 4. Dates (Issue and Maturity dates)
  // Look for date patterns like 2025-04-10 or 10/04/2025 or 10-04-2025
  const dateRegex = /(?:issue(?:d)?(?:\s+date)?|date of deposit)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i;
  const issueMatch = text.match(dateRegex);
  if (issueMatch && issueMatch[1]) {
    const parsed = normalizeDateString(issueMatch[1]);
    if (parsed) {
      result.extractedFields.issueDate = parsed;
      result.fieldConfidence.issueDate = 85;
      totalConfidence += 85;
      detectedFieldCount++;
    }
  }

  const matRegex = /(?:maturity(?:\s+date)?|due date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i;
  const matMatch = text.match(matRegex);
  if (matMatch && matMatch[1]) {
    const parsed = normalizeDateString(matMatch[1]);
    if (parsed) {
      result.extractedFields.maturityDate = parsed;
      result.fieldConfidence.maturityDate = 85;
      totalConfidence += 85;
      detectedFieldCount++;
    }
  }

  // 5. Interest Rate
  const roiRegex = /(?:rate of interest|roi|interest rate|int\.?\s*rate)[:\s]+(\d+(?:\.\d+)?)\s*%/i;
  const roiMatch = text.match(roiRegex);
  if (roiMatch && roiMatch[1]) {
    const roi = parseFloat(roiMatch[1]);
    if (roi > 0 && roi <= 15) {
      result.extractedFields.interestRatePercent = roi;
      result.fieldConfidence.interestRatePercent = 90;
      totalConfidence += 90;
      detectedFieldCount++;
    }
  }

  // 6. IFSC Code
  const ifscRegex = /\b([A-Z]{4}0[A-Z0-9]{6})\b/i;
  const ifscMatch = text.match(ifscRegex);
  if (ifscMatch && ifscMatch[1]) {
    result.extractedFields.ifscCode = ifscMatch[1].toUpperCase();
    result.fieldConfidence.ifscCode = 95;
    totalConfidence += 95;
    detectedFieldCount++;
  }

  // 7. Joint Lien Holdership Check
  if (/aicte|all india council for technical education|regional officer/i.test(text)) {
    result.extractedFields.jointAccountHolders =
      'Regional Officer, AICTE & Authorized Institution Trustee';
    result.fieldConfidence.jointAccountHolders = 80;
    detectedFieldCount++;
    totalConfidence += 80;
  }

  result.confidenceScore = detectedFieldCount > 0 ? Math.round(totalConfidence / detectedFieldCount) : 0;
  return result;
}

function normalizeDateString(raw: string): string | null {
  const parts = raw.split(/[\/\-\.]/);
  if (parts.length !== 3) return null;

  if (parts[0].length === 4) {
    // YYYY-MM-DD
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return `${y}-${m}-${d}`;
  } else {
    // DD-MM-YYYY or MM-DD-YYYY
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    let y = parts[2];
    if (y.length === 2) y = '20' + y;
    return `${y}-${m}-${d}`;
  }
}
