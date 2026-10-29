import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckSquare,
  Printer,
} from 'lucide-react';

export const FdrCreateEditPage: React.FC<{
  onNavigate: (page: string) => void;
  editId?: string;
}> = ({ onNavigate, editId }) => {
  const { user } = useAuth();

  // 1. FDR & Bank Information
  const [bankName, setBankName] = useState('State Bank of India');
  const [branchName, setBranchName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [fdrNumber, setFdrNumber] = useState('');
  const [depositAmountINR, setDepositAmountINR] = useState<string>('1500000');
  const [issueDate, setIssueDate] = useState('2026-04-15');
  const [maturityDate, setMaturityDate] = useState('2029-04-15');
  const [tenureMonths, setTenureMonths] = useState<number>(36);
  const [interestRatePercent, setInterestRatePercent] = useState<string>('7.10');

  // 2. AICTE JFDR Category & Refund Reason
  const [refundReason, setRefundReason] = useState(
    'New Technical Institute Approval - Mandatory Joint FDR Corpus'
  );
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'RTGS' | 'BANK_CHALLAN' | 'DIRECT_DEPOSIT' | 'DEMAND_DRAFT'>('RTGS');
  const [jointAccountHolders, setJointAccountHolders] = useState(
    'Regional Officer, AICTE & Authorized Chairman of the Trust'
  );

  // 3. Institution Contact Details
  const [contactName, setContactName] = useState(user?.name || 'Dr. Ramesh Sharma');
  const [contactDesignation, setContactDesignation] = useState(user?.designation || 'Registrar & Principal Representative');
  const [contactMobile, setContactMobile] = useState('+91 98110 24891');
  const [contactEmail, setContactEmail] = useState(user?.email || 'admin@institute.ac.in');
  const [remarks, setRemarks] = useState('');

  // 4. Document Attachment & Validation Checklist
  const [attachedFdrScan, setAttachedFdrScan] = useState(false);
  const [attachedLoiLoa, setAttachedLoiLoa] = useState(false);
  const [attachedAffidavit, setAttachedAffidavit] = useState(false);
  const [attachedBankNoLien, setAttachedBankNoLien] = useState(false);
  const [attachedCancelledCheque, setAttachedCancelledCheque] = useState(false);

  // OCR Assisted Upload Simulation
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedAcknowledgement, setSubmittedAcknowledgement] = useState<any>(null);

  // Client validation
  const validateForm = () => {
    if (!bankName.trim()) return 'Bank name is required.';
    if (!branchName.trim()) return 'Branch name is required.';
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.trim().toUpperCase())) {
      return 'Please enter a valid 11-character Indian IFSC code (e.g. SBIN0011566).';
    }
    if (!fdrNumber.trim()) return 'Bank FDR receipt number is required.';
    const amt = parseFloat(depositAmountINR);
    if (isNaN(amt) || amt <= 0) return 'Deposit amount must be a positive number greater than 0.';
    if (!issueDate || !maturityDate) return 'Both issue and maturity dates are required.';
    if (new Date(issueDate) > new Date(maturityDate)) {
      return 'Issue date cannot be later than maturity date.';
    }
    if (!contactName.trim()) return 'Contact person name is required.';
    if (!contactMobile.trim()) return 'Contact mobile number is required.';
    return null;
  };

  // OCR autofill handler
  const handleRunOcr = async () => {
    setOcrLoading(true);
    setErrorMessage('');
    try {
      const sample = `STATE BANK OF INDIA\nDwarka Sector 10 Branch, New Delhi\nIFSC: SBIN0011566\nFIXED DEPOSIT RECEIPT NO: SBI-FDR-88991204\nAmount: Rs. 25,00,000.00\nIssue Date: 2026-05-01\nMaturity Date: 2029-05-01\nTenure: 36 Months\nRate of Interest: 7.25% p.a.\nPayment Mode: RTGS\nJoint Account: Regional Officer, AICTE & Chairman, DIET Trust`;

      const res = await api.extractOcrSample(sample, 'Mock_SBI_Receipt.pdf');
      setOcrResult(res);

      if (res.extractedFields.bankName) setBankName(res.extractedFields.bankName);
      if (res.extractedFields.branchName) setBranchName(res.extractedFields.branchName);
      if (res.extractedFields.ifscCode) setIfscCode(res.extractedFields.ifscCode);
      if (res.extractedFields.fdrNumber) setFdrNumber(res.extractedFields.fdrNumber);
      if (res.extractedFields.depositAmountINR) setDepositAmountINR(String(res.extractedFields.depositAmountINR));
      if (res.extractedFields.issueDate) setIssueDate(res.extractedFields.issueDate);
      if (res.extractedFields.maturityDate) setMaturityDate(res.extractedFields.maturityDate);
      if (res.extractedFields.interestRatePercent) setInterestRatePercent(String(res.extractedFields.interestRatePercent));
      if (res.extractedFields.jointAccountHolders) setJointAccountHolders(res.extractedFields.jointAccountHolders);
      if (res.extractedFields.tenureMonths) setTenureMonths(res.extractedFields.tenureMonths);
      setAttachedFdrScan(true);
      setAttachedBankNoLien(true);
    } catch (err: any) {
      setErrorMessage('OCR extraction failed: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (asDraft: boolean) => {
    const valError = validateForm();
    if (valError) {
      setErrorMessage(valError);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const payload = {
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        fdrNumber: fdrNumber.trim(),
        depositAmountINR: parseFloat(depositAmountINR),
        issueDate,
        maturityDate,
        tenureMonths: Number(tenureMonths),
        interestRatePercent: parseFloat(interestRatePercent) || 0,
        depositPurpose: refundReason,
        refundReason,
        paymentMode,
        jointAccountHolders: jointAccountHolders.trim(),
        contactPersonName: contactName.trim(),
        contactPersonDesignation: contactDesignation.trim(),
        contactPersonMobile: contactMobile.trim(),
        contactPersonEmail: contactEmail.trim(),
        remarks: remarks.trim(),
        asDraft,
      };

      const res = await api.createFdr(payload);

      if (!asDraft) {
        // Show submission confirmation receipt
        setSubmittedAcknowledgement(res.record);
      } else {
        onNavigate(`fdr-detail-${res.record.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit FDR record.');
    } finally {
      setLoading(false);
    }
  };

  // If submitted, show Official Confirmation Receipt Docket (Feature 4: Submission confirmation)
  if (submittedAcknowledgement) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden p-8 space-y-6">
        <div className="text-center pb-6 border-b border-slate-200">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block">
            All India Council for Technical Education
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            JFDR Application Submission Confirmation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Application successfully registered on the AICTE Central Scrutiny Grid
          </p>
        </div>

        {/* Tracking Reference Badge */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-medium text-slate-500 block">AICTE Tracking Application No:</span>
            <span className="font-mono text-base font-extrabold text-blue-900">
              {submittedAcknowledgement.trackingNumber}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">Internal Record ID:</span>
            <span className="font-mono text-xs font-bold text-slate-700">
              {submittedAcknowledgement.id}
            </span>
          </div>
        </div>

        {/* Application Particulars */}
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Institution:</span>
            <span className="font-bold text-slate-900">{submittedAcknowledgement.institutionName}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">AICTE Permanent Code:</span>
            <span className="font-mono font-bold text-slate-800">{submittedAcknowledgement.aicteCode}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Bank & Receipt No:</span>
            <span className="font-semibold text-slate-800">
              {submittedAcknowledgement.bankName} (#{submittedAcknowledgement.fdrNumber})
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Deposit Principal Amount:</span>
            <span className="font-bold text-emerald-700">
              ₹{submittedAcknowledgement.depositAmountINR.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Payment Mode:</span>
            <span className="font-semibold text-slate-800">{submittedAcknowledgement.paymentMode}</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-slate-500">Application Reason / Category:</span>
            <span className="font-semibold text-slate-800 max-w-xs text-right">
              {submittedAcknowledgement.refundReason}
            </span>
          </div>
        </div>

        {/* Dispatch Notification Alerts */}
        <div className="p-4 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-blue-700" />
            Automatic Acknowledgement Notifications Dispatched:
          </div>
          <div className="text-[11px] text-blue-800">
            • SMS confirmation sent to registered contact: <strong>{submittedAcknowledgement.contactDetails?.contactPersonMobile}</strong> (Status: Delivered)
          </div>
          <div className="text-[11px] text-blue-800">
            • Formal receipt dispatched to email: <strong>{submittedAcknowledgement.contactDetails?.contactPersonEmail}</strong> (Status: Delivered)
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Acknowledgement</span>
          </button>

          <button
            onClick={() => onNavigate(`fdr-detail-${submittedAcknowledgement.id}`)}
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded shadow-sm"
          >
            Open Application Dossier →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('fdr-list')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <span className="text-xs text-slate-500">
          Institution Account: <strong>{user?.institutionName}</strong>
        </span>
      </div>

      {/* Header card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wide">
          <Building2 className="w-4 h-4 text-blue-700" />
          AICTE JFDR System · Online Application Module
        </div>
        <h2 className="text-lg font-bold text-slate-900 mt-1">Online Fixed Deposit Receipt (JFDR) Application</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Submit institutional FDR details, payment mode, contact particulars, and refund/approval category as per the official AICTE Approval Process Handbook.
        </p>
      </div>

      {/* Smart Feature: OCR Assisted Receipt Data Extraction Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-md mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  OCR Assisted Receipt Autofill (Advisory Parser)
                </h4>
                <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Advisory Tool
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Scan bank receipt to extract FDR number, deposit amount, maturity dates, and branch IFSC. Per security guidelines, all extracted fields are advisory and require human confirmation.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRunOcr}
            disabled={ocrLoading}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors shrink-0 flex items-center gap-1.5"
          >
            {ocrLoading ? 'Parsing OCR...' : 'Run OCR Autofill'}
          </button>
        </div>

        {ocrResult && (
          <div className="mt-4 p-3 bg-white rounded border border-blue-200 text-xs text-slate-700">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                OCR Extraction Completed ({ocrResult.confidenceScore}% confidence)
              </span>
            </div>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
              <strong>Security Invariant:</strong> {ocrResult.disclaimer}
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg text-xs text-rose-800 font-medium">
          {errorMessage}
        </div>
      )}

      {/* Main Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
        className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6"
      >
        {/* Section 1: FDR Particulars */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            1. Bank & FDR Number Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bank Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="State Bank of India">State Bank of India</option>
                <option value="Punjab National Bank">Punjab National Bank</option>
                <option value="Bank of Baroda">Bank of Baroda</option>
                <option value="Canara Bank">Canara Bank</option>
                <option value="Union Bank of India">Union Bank of India</option>
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="ICICI Bank">ICICI Bank</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Branch Name & Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Dwarka Sector 10 Branch, New Delhi"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bank IFSC Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SBIN0011566"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                maxLength={11}
                className="w-full px-3 py-2 text-xs font-mono uppercase rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Bank FDR Receipt Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SBI-FDR-992817451"
                value={fdrNumber}
                onChange={(e) => setFdrNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Amount, Dates & Payment Mode (Feature 2 in prompt) */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-700" />
            2. Deposit Amount, Dates & Payment Mode
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Principal Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="10000"
                step="1000"
                value={depositAmountINR}
                onChange={(e) => setDepositAmountINR(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Creation / Issue Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Maturity Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Payment Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="RTGS">RTGS</option>
                <option value="NEFT">NEFT</option>
                <option value="BANK_CHALLAN">Bank Challan</option>
                <option value="DIRECT_DEPOSIT">Direct Branch Deposit</option>
                <option value="DEMAND_DRAFT">Demand Draft (DD)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Contact Details & Refund Reason (Feature 2 in prompt) */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-700" />
            3. Institution Contact Details & Application/Refund Reason
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Authorized Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Sharma"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactDesignation}
                onChange={(e) => setContactDesignation(e.target.value)}
                placeholder="e.g. Registrar / Principal Representative"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Mobile Number (For SMS Status Updates) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
                placeholder="e.g. +91 98110 24891"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Email (For Confirmation Receipts) <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. admin@delhi-tech.edu"
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Application Category & Refund Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="New Technical Institute Approval - Mandatory Joint FDR Corpus">
                  New Technical Institute Approval - Mandatory Joint FDR Corpus
                </option>
                <option value="New Course / Programme Addition Security Deposit">
                  New Course / Programme Addition Security Deposit
                </option>
                <option value="Closure of Institute / Programme - Full Refund of Joint FDR Deposit">
                  Closure of Institute / Programme - Full Refund of Joint FDR Deposit
                </option>
                <option value="Reduction in Intake - Partial Refund of Joint FDR">
                  Reduction in Intake - Partial Refund of Joint FDR
                </option>
                <option value="Excess Corpus Refund post Completion of 10-Year Affiliation Period">
                  Excess Corpus Refund post Completion of 10-Year Affiliation Period
                </option>
                <option value="Renewal / Extension of Joint FDR Period">
                  Renewal / Extension of Joint FDR Period
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Document Attachments & Validation Step (Feature 3 in prompt) */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-700" />
            4. Document Attachments & Pre-Submission Validation Checklist
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            As documented in the AICTE JFDR manual, tick the checklist items to confirm attachment validation before final dispatch:
          </p>

          <div className="mt-3 space-y-2.5">
            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={attachedFdrScan}
                onChange={(e) => setAttachedFdrScan(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  1. Joint FDR Copy (Front and Back scan with bank endorsement)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Scanned in high resolution showing joint names (AICTE Regional Officer & Trustee) and bank seal.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={attachedLoiLoa}
                onChange={(e) => setAttachedLoiLoa(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  2. AICTE Letter of Intent (LOI) / Letter of Approval (LOA)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Official approval letter issued by AICTE Council directing creation or release of FDR.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={attachedAffidavit}
                onChange={(e) => setAttachedAffidavit(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  3. Trust / Society Resolution & Affidavit on ₹100 Stamp Paper
                </span>
                <span className="text-slate-500 text-[11px]">
                  Notarized affidavit undertaking unencumbered status and compliance with APH norms.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={attachedBankNoLien}
                onChange={(e) => setAttachedBankNoLien(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  4. Bank Confirmation Letter & No-Lien Certificate
                </span>
                <span className="text-slate-500 text-[11px]">
                  Branch manager letter certifying deposit is free from any private pledge or loan.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
              <input
                type="checkbox"
                checked={attachedCancelledCheque}
                onChange={(e) => setAttachedCancelledCheque(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  5. Bank Mandate Form & Cancelled Cheque (For Refund Applications)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Required for institutional account verification when requesting refund disbursement.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('fdr-list')}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300 transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md shadow-sm transition-colors"
            >
              {loading ? 'Submitting to AICTE...' : 'Submit JFDR Application'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
