import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDRRecord, FdrDocument } from '../types';
import { VerificationBadge, LifecycleBadge } from '../components/StatusBadges';
import {
  ArrowLeft,
  Building2,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldAlert,
  Send,
  RefreshCw,
  FolderLock,
  Lock,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

export const FdrDetailPage: React.FC<{
  recordId: string;
  onNavigate: (page: string) => void;
}> = ({ recordId, onNavigate }) => {
  const { user } = useAuth();
  const [fdr, setFdr] = useState<FDRRecord | null>(null);
  const [duplicateAnalysis, setDuplicateAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Scrutiny Modal / Action states
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_CORRECTION' | 'RENEWAL' | 'RELEASE' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionCategory, setActionCategory] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Renewal/Release fields
  const [renewalMonths, setRenewalMonths] = useState(36);
  const [renewalMaturity, setRenewalMaturity] = useState('');
  const [releaseReason, setReleaseReason] = useState<'PROGRAMME_CLOSURE' | 'EXCESS_CORPUS' | 'REPLACEMENT_GUARANTEE' | 'OTHER'>('PROGRAMME_CLOSURE');
  const [releaseNoc, setReleaseNoc] = useState('');

  // Document upload state
  const [uploadDocType, setUploadDocType] = useState('FDR_RECEIPT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Feature 5: Deficiency Correction Form State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrBankName, setCorrBankName] = useState('');
  const [corrBranchName, setCorrBranchName] = useState('');
  const [corrIfscCode, setCorrIfscCode] = useState('');
  const [corrFdrNumber, setCorrFdrNumber] = useState('');
  const [corrDepositAmountINR, setCorrDepositAmountINR] = useState('');
  const [corrIssueDate, setCorrIssueDate] = useState('');
  const [corrMaturityDate, setCorrMaturityDate] = useState('');
  const [corrPaymentMode, setCorrPaymentMode] = useState<'NEFT' | 'RTGS' | 'BANK_CHALLAN' | 'DIRECT_DEPOSIT' | 'DEMAND_DRAFT'>('RTGS');
  const [corrRefundReason, setCorrRefundReason] = useState('');
  const [corrContactName, setCorrContactName] = useState('');
  const [corrContactMobile, setCorrContactMobile] = useState('');
  const [corrContactEmail, setCorrContactEmail] = useState('');
  const [corrExplanation, setCorrExplanation] = useState('');
  const [corrLoading, setCorrLoading] = useState(false);

  const initCorrectionFields = (rec: FDRRecord) => {
    setCorrBankName(rec.bankName || '');
    setCorrBranchName(rec.branchName || '');
    setCorrIfscCode(rec.ifscCode || '');
    setCorrFdrNumber(rec.fdrNumber || '');
    setCorrDepositAmountINR(String(rec.depositAmountINR || ''));
    setCorrIssueDate(rec.issueDate || '');
    setCorrMaturityDate(rec.maturityDate || '');
    setCorrPaymentMode(rec.paymentMode || 'RTGS');
    setCorrRefundReason(rec.refundReason || rec.depositPurpose || '');
    setCorrContactName(rec.contactDetails?.contactPersonName || '');
    setCorrContactMobile(rec.contactDetails?.contactPersonMobile || '');
    setCorrContactEmail(rec.contactDetails?.contactPersonEmail || '');
    setCorrExplanation('');
  };

  const handleSaveAndResubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrLoading(true);
    try {
      await api.updateFdr(recordId, {
        bankName: corrBankName.trim(),
        branchName: corrBranchName.trim(),
        ifscCode: corrIfscCode.trim().toUpperCase(),
        fdrNumber: corrFdrNumber.trim(),
        depositAmountINR: parseFloat(corrDepositAmountINR) || fdr?.depositAmountINR,
        issueDate: corrIssueDate,
        maturityDate: corrMaturityDate,
        paymentMode: corrPaymentMode,
        refundReason: corrRefundReason.trim(),
        contactPersonName: corrContactName.trim(),
        contactPersonMobile: corrContactMobile.trim(),
        contactPersonEmail: corrContactEmail.trim(),
      });

      await api.submitFdr(
        recordId,
        corrExplanation.trim() || 'Resubmitted after attending to deficiency remarks.'
      );
      setShowCorrectionModal(false);
      await loadRecord();
    } catch (err: any) {
      alert(err.message || 'Failed to resubmit corrected application.');
    } finally {
      setCorrLoading(false);
    }
  };

  const loadRecord = async () => {
    setLoading(true);
    try {
      const res = await api.getFdrById(recordId);
      setFdr(res.record);
      setDuplicateAnalysis(res.duplicateAnalysis);
      initCorrectionFields(res.record);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch FDR record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
  }, [recordId, user]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.approveFdr(recordId, actionNotes);
      setActionType(null);
      setActionNotes('');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!actionNotes || actionNotes.trim().length < 10) {
      alert('Mandatory correction requirements must be specified (min 10 characters).');
      return;
    }
    setActionLoading(true);
    try {
      await api.requestCorrection(recordId, actionNotes, actionCategory || 'Document Discrepancy');
      setActionType(null);
      setActionNotes('');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionNotes || actionNotes.trim().length < 10) {
      alert('Mandatory rejection reason must be specified (min 10 characters).');
      return;
    }
    setActionLoading(true);
    try {
      await api.rejectFdr(recordId, actionNotes, actionCategory || 'Eligibility Non-Compliance');
      setActionType(null);
      setActionNotes('');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidateAttachments = async (status: 'VERIFIED' | 'DEFICIENT') => {
    const remarks = prompt(
      status === 'VERIFIED'
        ? 'Enter remarks confirming compliance of attachments (e.g. All mandatory documents verified):'
        : 'Enter specific deficiency comments regarding missing or invalid attachments:'
    );
    if (remarks === null) return;
    try {
      await api.validateAttachments(recordId, status, remarks);
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResubmit = async () => {
    const resubmitNotes = prompt('Enter your explanation addressing the deficiency raised by the scrutiny officer:');
    if (resubmitNotes === null) return;
    try {
      await api.submitFdr(recordId, resubmitNotes || 'Resubmitted after attending to deficiency requirements.');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRenewalSubmit = async () => {
    if (!actionNotes.trim()) {
      alert('Justification required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.submitRenewalRequest(recordId, {
        proposedTenureMonths: renewalMonths,
        proposedMaturityDate: renewalMaturity,
        justification: actionNotes,
      });
      setActionType(null);
      setActionNotes('');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSubmit = async () => {
    if (!releaseNoc.trim()) {
      alert('NOC and approval references required.');
      return;
    }
    setActionLoading(true);
    try {
      await api.submitReleaseRequest(recordId, {
        reasonForRelease: releaseReason,
        nocDetails: releaseNoc,
      });
      setActionType(null);
      setReleaseNoc('');
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    setUploadLoading(true);
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fdrRecordId', recordId);
      formData.append('documentType', uploadDocType);

      await api.uploadDocument(formData);
      setUploadSuccess('Document successfully uploaded and verified by virus scan.');
      setSelectedFile(null);
      loadRecord();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading FDR scrutiny dossier...
      </div>
    );
  }

  if (error || !fdr) {
    return (
      <div className="p-6 bg-white rounded-lg border border-slate-200">
        <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200">
          {error || 'FDR record not found'}
        </div>
        <button
          onClick={() => onNavigate('fdr-list')}
          className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded"
        >
          ← Return to Records
        </button>
      </div>
    );
  }

  const formatINR = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;
  const isOfficer = user?.role === 'VERIFICATION_OFFICER';
  const isInstitution = user?.role === 'INSTITUTION_USER';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('fdr-list')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <VerificationBadge status={fdr.verificationStatus} />
          <LifecycleBadge status={fdr.lifecycleStatus} />
        </div>
      </div>

      {/* Collision Alert Banner */}
      {fdr.isDuplicateFlagged && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Security Flag: Duplicate Bank FDR Reference Collision
              </h4>
              <p className="text-xs text-rose-800 mt-1">
                {fdr.duplicateNotes ||
                  'The FDR receipt number on this record matches an existing institutional entry in the database. Scrutiny officer verification required.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Correction Requirement Banner if in CORRECTION_REQUIRED (Feature 5: Deficiency Correction) */}
      {fdr.verificationStatus === 'CORRECTION_REQUIRED' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Deficiency Raised by AICTE Scrutiny Officer
                </h4>
                <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                  Action Required
                </span>
              </div>
              <div className="text-xs text-amber-900 mt-2 whitespace-pre-line font-medium bg-white/90 p-3 rounded-md border border-amber-200">
                {fdr.correctionRequirements}
              </div>
              {isInstitution && (
                <div className="mt-3.5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      initCorrectionFields(fdr);
                      setShowCorrectionModal(true);
                    }}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-1.5"
                  >
                    <span>Edit Application & Rectify Deficiency</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleResubmit}
                    className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded shadow-sm transition-colors"
                  >
                    Quick Resubmit
                  </button>
                  <span className="text-[11px] text-amber-800">
                    Review comments, edit permitted fields, upload revised receipts, and resubmit.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Dossier Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-300">
                Tracking No: {fdr.trackingNumber || `AICTE/JFDR/2026/${fdr.id.split('-').pop()}`}
              </span>
              <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded border border-slate-300">
                Internal ID: {fdr.id}
              </span>
              <span className="text-xs text-slate-500 font-medium">· Bank Receipt:</span>
              <span className="font-mono text-xs font-bold text-slate-800">{fdr.fdrNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-2">{fdr.institutionName}</h2>
            <div className="text-xs text-slate-500">AICTE Permanent Institute Code: {fdr.aicteCode}</div>
          </div>

          <div className="text-left md:text-right">
            <div className="text-xs text-slate-500">Fixed Deposit Principal</div>
            <div className="text-2xl font-bold text-slate-900">{formatINR(fdr.depositAmountINR)}</div>
            <div className="text-[11px] text-slate-500">
              Payment Mode: <strong className="text-slate-800">{fdr.paymentMode || 'RTGS'}</strong> · Tenure: {fdr.tenureMonths} Mo @ {fdr.interestRatePercent}%
            </div>
          </div>
        </div>

        {/* 5-Stage Workflow Progress Bar (Feature 6: Application tracking) */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
            <span>Application Workflow Progress</span>
            <span className="font-bold text-blue-900">
              Stage {fdr.trackingStage || 2} of 5:{' '}
              {fdr.trackingStage === 1
                ? 'Draft Saved'
                : fdr.trackingStage === 2
                ? 'Attachment & Document Validation'
                : fdr.trackingStage === 3
                ? 'Regional Scrutiny Officer Verification'
                : fdr.trackingStage === 4
                ? 'Regional Committee Approval'
                : 'Finance Bureau Final Clearance'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            {[
              { num: 1, name: '1. Application Submitted' },
              { num: 2, name: '2. Attachment Validation' },
              { num: 3, name: '3. Scrutiny Verification' },
              { num: 4, name: '4. Regional Approval' },
              { num: 5, name: '5. Finance Clearance' },
            ].map((st) => {
              const currentStage = fdr.trackingStage || (fdr.verificationStatus === 'APPROVED' ? 5 : 2);
              const isPassed = currentStage >= st.num;
              const isCurrent = currentStage === st.num;
              return (
                <div
                  key={st.num}
                  className={`py-1.5 px-1 rounded font-medium truncate ${
                    isPassed
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-900 border border-blue-400 font-bold'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {st.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Toolbar for Scrutiny Officers & Institutions */}
        <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Actions:</span>
            {isOfficer && (fdr.verificationStatus === 'SUBMITTED' || fdr.verificationStatus === 'UNDER_REVIEW') && (
              <>
                <button
                  onClick={() => handleValidateAttachments('VERIFIED')}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  title="Validate document attachments per AICTE manual"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Validate Attachments</span>
                </button>
                <button
                  onClick={() => handleValidateAttachments('DEFICIENT')}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                  title="Raise deficiency regarding missing or invalid attachments"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Raise Deficiency</span>
                </button>
                <button
                  onClick={() => setActionType('APPROVE')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Approve</span>
                </button>
                <button
                  onClick={() => setActionType('REJECT')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {isInstitution && fdr.verificationStatus === 'APPROVED' && (
              <>
                <button
                  onClick={() => setActionType('RENEWAL')}
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Request Renewal / Rollover</span>
                </button>
                <button
                  onClick={() => setActionType('RELEASE')}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Request Release / Closure</span>
                </button>
              </>
            )}

            {isInstitution && fdr.verificationStatus === 'DRAFT' && (
              <button
                onClick={() => handleResubmit()}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit for Scrutiny</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            Created: {new Date(fdr.createdAt).toLocaleDateString()} · Last Updated:{' '}
            {new Date(fdr.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Column 1: Bank & Receipt specifics */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              Bank & Branch Particulars
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-900">{fdr.bankName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Branch Name</span>
                <span className="font-semibold text-slate-900">{fdr.branchName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">IFSC Code</span>
                <span className="font-mono font-semibold text-slate-900">{fdr.ifscCode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank FDR Receipt No</span>
                <span className="font-mono font-bold text-slate-900">{fdr.fdrNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Joint Account Holders</span>
                <span className="font-semibold text-slate-900 text-right max-w-[240px]">
                  {fdr.jointAccountHolders}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Financial & Schedule specifics */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-700" />
              Deposit Purpose & Maturity Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Deposit Purpose</span>
                <span className="font-semibold text-slate-900 text-right max-w-[240px]">
                  {fdr.depositPurpose}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date of Issue</span>
                <span className="font-semibold text-slate-900">{fdr.issueDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Date of Maturity</span>
                <span className="font-bold text-blue-900">{fdr.maturityDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Interest Rate</span>
                <span className="font-semibold text-slate-900">{fdr.interestRatePercent}% p.a.</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Remarks</span>
                <span className="text-slate-700 italic">{fdr.remarks || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Documents Section (Module 4) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-blue-700" />
              Secure Document Attachments ({fdr.documents.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified files with SHA-256 integrity check and malware scanning
            </p>
          </div>
        </div>

        {/* Existing documents table */}
        {fdr.documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded border border-dashed border-slate-300">
            No documents attached yet. Please upload the physical FDR receipt and bank confirmation letter below.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
            {fdr.documents.map((doc: FdrDocument) => (
              <div key={doc.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded border border-blue-100">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{doc.originalFileName}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-semibold text-blue-800">{doc.documentType}</span>
                      <span>·</span>
                      <span>{(doc.fileSizeBytes / 1024).toFixed(1)} KB</span>
                      <span>·</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Scan: {doc.scanStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-sm">
                      SHA256: {doc.sha256Hash}
                    </div>
                  </div>
                </div>

                <a
                  href={api.getDownloadUrl(doc.id)}
                  download={doc.originalFileName}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 border border-blue-200 rounded flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Upload Document Form */}
        <form onSubmit={handleUploadDocument} className="pt-3 border-t border-slate-200 space-y-3">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Upload Supporting Evidence Document
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Document Type</label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="FDR_RECEIPT">FDR Receipt (Scanned Front & Back)</option>
                <option value="BANK_CONFIRMATION">Bank Confirmation & Joint Lien Letter</option>
                <option value="JOINT_LIEN_LETTER">Trust / AICTE Endorsement Undertaking</option>
                <option value="RENEWAL_LETTER">Bank Rollover / Renewal Confirmation</option>
                <option value="RELEASE_NOC">AICTE Release NOC</option>
                <option value="OTHER">Other Annexure</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select File (PDF, PNG, JPG - Max 5MB)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Files are checked against path traversal and stored under randomized cryptographic filenames.
            </span>
            <button
              type="submit"
              disabled={uploadLoading || !selectedFile}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadLoading ? 'Uploading & Scanning...' : 'Upload Document'}</span>
            </button>
          </div>

          {uploadSuccess && (
            <div className="p-2 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded border border-emerald-200">
              {uploadSuccess}
            </div>
          )}
        </form>
      </div>

      {/* Verification Timeline / Audit Log (Module 5 & 9) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-700" />
          Scrutiny History & Audit Trail ({fdr.timeline.length} actions)
        </h3>

        <div className="space-y-3">
          {fdr.timeline.map((item: any) => (
            <div key={item.id} className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
              <div className="flex-1 bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    {item.action === 'APPROVE'
                      ? 'Approved by Scrutiny Officer'
                      : item.action === 'REQUEST_CORRECTION'
                      ? 'Correction Requested'
                      : item.action === 'REJECT'
                      ? 'Rejected'
                      : item.action === 'RESUBMIT'
                      ? 'Resubmitted by Institution'
                      : 'Submitted'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Action taken by: <strong>{item.reviewerName}</strong> ({item.reviewerRole})
                </div>
                {item.notes && (
                  <p className="mt-2 text-slate-800 bg-white p-2 rounded border border-slate-200 whitespace-pre-line">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Dialog Modal */}
      {actionType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {actionType === 'APPROVE' && 'Confirm FDR Verification & Approval'}
              {actionType === 'REQUEST_CORRECTION' && 'Request Document Correction from Institution'}
              {actionType === 'REJECT' && 'Reject Institutional FDR Submission'}
              {actionType === 'RENEWAL' && 'Apply for Fixed Deposit Renewal / Rollover'}
              {actionType === 'RELEASE' && 'Apply for Fixed Deposit Release / Closure'}
            </h3>

            {actionType === 'APPROVE' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  By clicking approve, you verify that the physical receipt, branch confirmation letter, and AICTE joint lien endorsement comply with Council regulations.
                </p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Approval Endorsement Remarks</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Scrutinized and verified against bank stamp. AICTE joint lien verified."
                    className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'REQUEST_CORRECTION' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Specify mandatory corrections and missing documentation. The institution will receive an alert to amend the record.
                </p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Discrepancy Category</label>
                  <select
                    value={actionCategory}
                    onChange={(e) => setActionCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="Joint Lien Title Missing">Joint Lien Title Missing</option>
                    <option value="Document Illegible">Document Illegible / Stamp Missing</option>
                    <option value="Amount or Tenure Discrepancy">Amount or Tenure Discrepancy</option>
                    <option value="Bank Seal Missing">Bank Seal / Signature Missing</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Correction Instructions *</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Detail the exact corrections needed before re-scrutiny..."
                    className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestCorrection}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? 'Sending...' : 'Issue Correction Notice'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'REJECT' && (
              <div className="space-y-3 text-xs">
                <p className="text-rose-700 font-medium">
                  Warning: Rejecting this submission marks the FDR as non-compliant. A clear rationale must be recorded for Council audit.
                </p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Rejection Reason *</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Provide specific regulatory reason for rejection..."
                    className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'RENEWAL' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Proposed Extension Tenure (Months)</label>
                  <input
                    type="number"
                    value={renewalMonths}
                    onChange={(e) => setRenewalMonths(parseInt(e.target.value, 10) || 36)}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">New Proposed Maturity Date</label>
                  <input
                    type="date"
                    value={renewalMaturity}
                    onChange={(e) => setRenewalMaturity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Justification for Renewal *</label>
                  <textarea
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="e.g. Existing course continuation under AICTE handbook rules..."
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRenewalSubmit}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Renewal Request'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'RELEASE' && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Reason for Release</label>
                  <select
                    value={releaseReason}
                    onChange={(e) => setReleaseReason(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                  >
                    <option value="PROGRAMME_CLOSURE">Formal Course / Programme Closure</option>
                    <option value="EXCESS_CORPUS">Excess Corpus Refund Post Affiliation Period</option>
                    <option value="REPLACEMENT_GUARANTEE">Replacement with Bank Guarantee</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">AICTE Council NOC Reference Details *</label>
                  <textarea
                    rows={3}
                    value={releaseNoc}
                    onChange={(e) => setReleaseNoc(e.target.value)}
                    placeholder="e.g. AICTE Western Region Closure Letter Ref: AICTE/WR/CL/2026/099..."
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setActionType(null)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReleaseSubmit}
                    disabled={actionLoading}
                    className="px-4 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded text-xs font-semibold shadow-sm"
                  >
                    {actionLoading ? 'Submitting...' : 'Submit Release Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature 5: Deficiency Rectification Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Deficiency Correction & Application Amendment
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Rectify indicated discrepancies in accordance with AICTE approval guidelines
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrectionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrutiny Comments Banner */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-xs">
              <span className="font-bold text-amber-900 block">AICTE Officer Deficiency Observation:</span>
              <p className="text-amber-800 mt-1 whitespace-pre-line font-medium">
                {fdr.correctionRequirements || 'Please correct document discrepancy or field information.'}
              </p>
            </div>

            <form onSubmit={handleSaveAndResubmitCorrection} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={corrBankName}
                    onChange={(e) => setCorrBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    value={corrBranchName}
                    onChange={(e) => setCorrBranchName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    value={corrIfscCode}
                    onChange={(e) => setCorrIfscCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">FDR Receipt Number *</label>
                  <input
                    type="text"
                    value={corrFdrNumber}
                    onChange={(e) => setCorrFdrNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Principal Amount (INR) *</label>
                  <input
                    type="number"
                    value={corrDepositAmountINR}
                    onChange={(e) => setCorrDepositAmountINR(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Date *</label>
                  <input
                    type="date"
                    value={corrIssueDate}
                    onChange={(e) => setCorrIssueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Maturity Date *</label>
                  <input
                    type="date"
                    value={corrMaturityDate}
                    onChange={(e) => setCorrMaturityDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Mode *</label>
                  <select
                    value={corrPaymentMode}
                    onChange={(e) => setCorrPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs bg-white focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="RTGS">RTGS - Real Time Gross Settlement</option>
                    <option value="NEFT">NEFT - National Electronic Fund Transfer</option>
                    <option value="BANK_CHALLAN">Direct Bank Challan</option>
                    <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                    <option value="DEMAND_DRAFT">Demand Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Approval Category / Refund Reason</label>
                <input
                  type="text"
                  value={corrRefundReason}
                  onChange={(e) => setCorrRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Contact Person Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide block">
                  Institution Contact Person Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Contact Name</label>
                    <input
                      type="text"
                      value={corrContactName}
                      onChange={(e) => setCorrContactName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Contact Mobile</label>
                    <input
                      type="text"
                      value={corrContactMobile}
                      onChange={(e) => setCorrContactMobile(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Contact Email</label>
                    <input
                      type="email"
                      value={corrContactEmail}
                      onChange={(e) => setCorrContactEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Institution Resubmission Explanation */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Institution Compliance & Clarification Explanation *
                </label>
                <textarea
                  rows={3}
                  value={corrExplanation}
                  onChange={(e) => setCorrExplanation(e.target.value)}
                  placeholder="Explain how the deficiency raised by the scrutiny officer was addressed (e.g. Corrected FDR number and uploaded new original receipt with joint lien seal)..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={corrLoading}
                  className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-md text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  {corrLoading ? (
                    <span>Submitting to Scrutiny...</span>
                  ) : (
                    <>
                      <span>Save Corrections & Resubmit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
