import React, { useState } from 'react';
import { api } from '../services/api';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  Clock,
  Printer,
} from 'lucide-react';
import { VerificationBadge, LifecycleBadge } from '../components/StatusBadges';

export const ApplicationTrackingPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const [query, setQuery] = useState('AICTE/JFDR/2026/0491');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<any>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setRecord(null);

    try {
      const res = await api.trackApplication(query.trim());
      setRecord(res);
    } catch (err: any) {
      setError(
        err.message ||
          'Application not found. Please verify the AICTE tracking number (e.g. AICTE/JFDR/2026/0491) or FDR Receipt Number.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
            <Search className="w-4 h-4 text-blue-700" />
            AICTE Online Application Tracking System
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Track JFDR Application & Refund Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor scrutiny milestones, attachment validation outcomes, and regional council clearance in real-time
          </p>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Enter AICTE Tracking Number or Bank FDR Reference
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. AICTE/JFDR/2026/0491 or SBI-FDR-992817451"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-md shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
            >
              {loading ? (
                <span>Checking Status...</span>
              ) : (
                <>
                  <span>Track Status</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span>Quick Samples:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('AICTE/JFDR/2026/0491');
              }}
              className="text-blue-700 hover:underline font-mono"
            >
              AICTE/JFDR/2026/0491 (Under Review)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setQuery('AICTE/JFDR/2026/0812');
              }}
              className="text-amber-700 hover:underline font-mono"
            >
              AICTE/JFDR/2026/0812 (Deficiency Raised)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setQuery('AICTE/JFDR/2026/0118');
              }}
              className="text-emerald-700 hover:underline font-mono"
            >
              AICTE/JFDR/2026/0118 (Approved)
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>{error}</div>
          </div>
        )}
      </div>

      {/* Result Dossier Card */}
      {record && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden space-y-6">
          {/* Header */}
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded border border-blue-300">
                  {record.trackingNumber || query}
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Internal ID: {record.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{record.institutionName}</h3>
              <div className="text-xs text-slate-500">
                AICTE Permanent Institute ID: <span className="font-mono">{record.aicteCode}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <VerificationBadge status={record.verificationStatus} />
              <LifecycleBadge status={record.lifecycleStatus} />
            </div>
          </div>

          {/* 5-Stage Visual Workflow Tracker (Feature 6) */}
          <div className="px-6 py-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span>Workflow Milestone Clearance:</span>
              <span className="text-blue-800">
                Current: Stage {record.trackingStage || 2} of 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
              {[
                { step: 1, title: '1. Submission Registered', desc: 'Online FDR Form & Corpus Submitted' },
                { step: 2, title: '2. Attachment Validation', desc: 'FDR, LOI, Affidavit & No-Lien' },
                { step: 3, title: '3. Scrutiny Verification', desc: 'Regional Officer Verification' },
                { step: 4, title: '4. Regional Approval', desc: 'Executive Committee Approval' },
                { step: 5, title: '5. Finance Clearance', desc: 'Corpus Endorsement / Refund Dispatched' },
              ].map((st) => {
                const currentStage = record.trackingStage || (record.verificationStatus === 'APPROVED' ? 5 : 2);
                const isPassed = currentStage >= st.step;
                const isCurrent = currentStage === st.step;

                return (
                  <div
                    key={st.step}
                    className={`p-2.5 rounded-lg border transition-all ${
                      isPassed
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : isCurrent
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-300 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="font-bold">{st.title}</div>
                    <div className="text-[9px] mt-0.5 opacity-80 hidden sm:block">{st.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deficiency Remark Alert if Applicable */}
          {record.correctionRequirements && (
            <div className="mx-6 p-4 bg-amber-50 rounded-lg border border-amber-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Scrutiny Officer Deficiency Observations:
              </div>
              <p className="text-amber-800 whitespace-pre-line pl-6 font-medium">
                {record.correctionRequirements}
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Particulars */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] pb-1 border-b border-slate-200 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                Bank & Deposit Particulars
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-900">{record.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch & IFSC:</span>
                  <span className="font-semibold text-slate-900">
                    {record.branchName} ({record.ifscCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FDR Receipt Number:</span>
                  <span className="font-mono font-bold text-slate-900">{record.fdrNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal Deposit Amount:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    ₹{(record.depositAmountINR || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-semibold text-slate-800">{record.paymentMode || 'RTGS'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenure & Maturity:</span>
                  <span className="font-semibold text-slate-900">
                    {record.tenureMonths || 36} Months (Matures on {record.maturityDate})
                  </span>
                </div>
              </div>
            </div>

            {/* Application & Contact Details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] pb-1 border-b border-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                Category & Contact Details
              </h4>
              <div className="space-y-2">
                <div>
                  <span className="text-slate-500 block">Approval Category / Refund Reason:</span>
                  <span className="font-semibold text-slate-900 block mt-0.5">
                    {record.refundReason || record.depositPurpose}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Attachment Validation:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      record.attachmentValidationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : record.attachmentValidationStatus === 'DEFICIENT'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {record.attachmentValidationStatus || 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institution Contact:</span>
                  <span className="font-semibold text-slate-900">
                    {record.contactDetails?.contactPersonName || 'Authorized Signatory'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Mobile:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {record.contactDetails?.contactPersonMobile || '+91 98110 00000'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submission Date:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(record.submittedAt || record.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Status Docket</span>
            </button>

            <button
              onClick={() => onNavigate(`fdr-detail-${record.id}`)}
              className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Open Detailed Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
