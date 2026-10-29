import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { RenewalRequest, ReleaseRequest } from '../types';
import {
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
} from 'lucide-react';

export const RenewalReleasePage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'renewals' | 'releases'>('renewals');
  const [renewals, setRenewals] = useState<RenewalRequest[]>([]);
  const [releases, setReleases] = useState<ReleaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Decision state for Officer/Admin
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decidingType, setDecidingType] = useState<'renewal' | 'release'>('renewal');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [decidingLoading, setDecidingLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getLifecycleRequests();
      setRenewals(res.renewalRequests || []);
      setReleases(res.releaseRequests || []);
    } catch (err) {
      console.error('Failed to load lifecycle requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [user]);

  const handleDecide = async (decision: 'APPROVE' | 'REJECT') => {
    if (!decidingId) return;
    setDecidingLoading(true);
    try {
      await api.decideLifecycleRequest(decidingType, decidingId, decision, decisionNotes);
      setDecidingId(null);
      setDecisionNotes('');
      loadRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDecidingLoading(false);
    }
  };

  const isOfficerOrAdmin = user?.role === 'VERIFICATION_OFFICER' || user?.role === 'SYSTEM_ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-700" />
            Module 8 · FDR Lifecycle Request Workflows
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Renewal Rollovers & Release Closure Requests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal institutional applications to extend maturity tenures or release corpus upon course closure
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('renewals')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'renewals'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Renewal Requests ({renewals.length})
          </button>
          <button
            onClick={() => setActiveTab('releases')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'releases'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Release / Closure Requests ({releases.length})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading request registry...
          </div>
        ) : activeTab === 'renewals' ? (
          renewals.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Renewal Requests Pending</p>
              <p className="text-xs text-slate-500 mt-1">
                Institutions can request renewal for matured or maturing FDRs directly from the FDR detail view.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Request ID</th>
                    <th className="py-3 px-4">Linked FDR</th>
                    <th className="py-3 px-4">Proposed Extension</th>
                    <th className="py-3 px-4">Justification</th>
                    <th className="py-3 px-4">Requested On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {renewals.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-blue-900">{r.id}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onNavigate(`fdr-detail-${r.fdrRecordId}`)}
                          className="font-mono text-blue-700 hover:underline font-bold"
                        >
                          {r.fdrRecordId}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          +{r.proposedTenureMonths} Months
                        </div>
                        {r.proposedMaturityDate && (
                          <div className="text-[10px] text-slate-400">
                            New Due: {r.proposedMaturityDate}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={r.justification}>
                        {r.justification}
                      </td>
                      <td className="py-3 px-4">{r.requestDate}</td>
                      <td className="py-3 px-4">
                        {r.status === 'APPROVED' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Approved
                          </span>
                        ) : r.status === 'REJECTED' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                            Rejected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            Pending Scrutiny
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isOfficerOrAdmin && r.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setDecidingId(r.id);
                              setDecidingType('renewal');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded border border-blue-200"
                          >
                            Decide Request
                          </button>
                        ) : (
                          <button
                            onClick={() => onNavigate(`fdr-detail-${r.fdrRecordId}`)}
                            className="text-xs text-slate-600 hover:text-slate-900"
                          >
                            View FDR →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : releases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Lock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Release Requests Pending</p>
            <p className="text-xs text-slate-500 mt-1">
              Institutions with approved course closure NOCs can apply for FDR liquidation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Linked FDR</th>
                  <th className="py-3 px-4">Reason Category</th>
                  <th className="py-3 px-4">AICTE NOC References</th>
                  <th className="py-3 px-4">Requested On</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {releases.map((rel) => (
                  <tr key={rel.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-900">{rel.id}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate(`fdr-detail-${rel.fdrRecordId}`)}
                        className="font-mono text-blue-700 hover:underline font-bold"
                      >
                        {rel.fdrRecordId}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {rel.reasonForRelease}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={rel.nocDetails}>
                      {rel.nocDetails}
                    </td>
                    <td className="py-3 px-4">{rel.requestDate}</td>
                    <td className="py-3 px-4">
                      {rel.status === 'APPROVED' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Approved & Released
                        </span>
                      ) : rel.status === 'REJECTED' ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          Rejected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
                          Pending Council NOC
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isOfficerOrAdmin && rel.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setDecidingId(rel.id);
                            setDecidingType('release');
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded border border-blue-200"
                        >
                          Decide Release
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate(`fdr-detail-${rel.fdrRecordId}`)}
                          className="text-xs text-slate-600 hover:text-slate-900"
                        >
                          View FDR →
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {decidingId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Official Decision: {decidingType === 'renewal' ? 'FDR Renewal' : 'FDR Release / Closure'}
            </h3>
            <p className="text-xs text-slate-600">
              Record officer review findings. Approving renewal will update the FDR's maturity date and reset alert status. Approving release marks the FDR closed.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Review Decision Remarks
              </label>
              <textarea
                rows={3}
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Enter remarks or approval dispatch references..."
                className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDecidingId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-700 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDecide('REJECT')}
                disabled={decidingLoading}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleDecide('APPROVE')}
                disabled={decidingLoading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm"
              >
                {decidingLoading ? 'Recording...' : 'Approve Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
