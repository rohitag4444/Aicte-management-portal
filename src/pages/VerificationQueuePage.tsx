import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDRRecord } from '../types';
import { VerificationBadge, LifecycleBadge } from '../components/StatusBadges';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Building2,
  FileText,
  AlertOctagon,
} from 'lucide-react';

export const VerificationQueuePage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [queue, setQueue] = useState<FDRRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getVerificationQueue();
      setQueue(res.queue || []);
      setStats(res.stats || {});
    } catch (err) {
      console.error('Failed to load scrutiny queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user]);

  const formatINR = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            AICTE Regional Scrutiny & Approval Desk
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Institutional Verification Queue</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Examine submitted FDRs, cross-examine bank endorsement clauses, and issue official regulatory decisions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Authorized Officer:</span>
            <span className="text-xs font-bold text-slate-800">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Submissions Requiring Review</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {stats?.totalPending || queue.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for immediate scrutiny</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Correction Notices Pending Response</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {stats?.correctionAwaitingResubmit || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Institutions amending documents</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Verified & Approved FDRs</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats?.recentlyApproved || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active under AICTE custody</div>
        </div>
      </div>

      {/* Main Scrutiny Queue Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Pending Submissions Docket ({queue.length})
          </h3>
          <span className="text-xs text-slate-500">Priority order: oldest submissions first</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading pending scrutiny docket...
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Verification Queue is Clear</p>
            <p className="text-xs text-slate-500 mt-1">
              All submitted institutional fixed deposits have been reviewed and decided.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Bank & Branch</th>
                  <th className="py-3 px-4">FDR Number</th>
                  <th className="py-3 px-4">Deposit Amount</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Attachment Validation</th>
                  <th className="py-3 px-4">Collision Flag</th>
                  <th className="py-3 px-4 text-right">Scrutiny Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {queue.map((fdr) => (
                  <tr key={fdr.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-900">{fdr.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fdr.institutionName}</div>
                      <div className="text-[10px] text-slate-400">AICTE: {fdr.aicteCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{fdr.bankName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {fdr.branchName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{fdr.fdrNumber}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatINR(fdr.depositAmountINR)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-medium border border-blue-200">
                        {fdr.documents.length} attached
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          fdr.attachmentValidationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : fdr.attachmentValidationStatus === 'DEFICIENT'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {fdr.attachmentValidationStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {fdr.isDuplicateFlagged ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-300">
                          <AlertOctagon className="w-3 h-3" /> Duplicate Collision
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Clean Reference
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate(`fdr-detail-${fdr.id}`)}
                        className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded text-xs shadow-sm inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Open Scrutiny Dossier</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scrutiny Checklist Reference Card */}
      <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 text-xs">
        <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-700" />
          AICTE Scrutiny Officer Verification Protocol Checklist
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Joint Lien Endorsement:</strong> Verify that the receipt explicitly names the AICTE Regional Officer as joint holder.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Authorized Signatures:</strong> Verify Bank Branch Manager's official seal and signature on confirmation letter.</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Tenure Verification:</strong> Ensure FDR tenure matches course duration (minimum 36 months for engineering colleges).</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>No Prior Encumbrance:</strong> Confirm receipt has no lien mark to any third party or overdraft credit line.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
