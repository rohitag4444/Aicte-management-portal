import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDRRecord } from '../types';
import { VerificationBadge, LifecycleBadge } from '../components/StatusBadges';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const DashboardPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [fdrs, setFdrs] = useState<FDRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [maturityStats, setMaturityStats] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fdrRes, maturityRes] = await Promise.all([
        api.getFdrs({ limit: '50' }),
        api.getMaturityOverview(),
      ]);
      setFdrs(fdrRes.data || []);
      setMaturityStats(maturityRes);
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading secure institutional dashboard...
      </div>
    );
  }

  // Common calculations
  const totalFdrs = fdrs.length;
  const totalAmountINR = fdrs.reduce((acc, r) => acc + r.depositAmountINR, 0);
  const approvedFdrs = fdrs.filter((r) => r.verificationStatus === 'APPROVED');
  const pendingScrutiny = fdrs.filter((r) => r.verificationStatus === 'SUBMITTED' || r.verificationStatus === 'UNDER_REVIEW');
  const correctionRequired = fdrs.filter((r) => r.verificationStatus === 'CORRECTION_REQUIRED');
  const draftFdrs = fdrs.filter((r) => r.verificationStatus === 'DRAFT');
  const duplicatesFlagged = fdrs.filter((r) => r.isDuplicateFlagged);

  const formatINR = (amt: number) => {
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {user?.role === 'INSTITUTION_USER'
              ? 'Institution Portal'
              : user?.role === 'VERIFICATION_OFFICER'
              ? 'AICTE Scrutiny & Verification Desk'
              : 'AICTE Headquarters Administrative Console'}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {user?.role === 'INSTITUTION_USER'
              ? user.institutionName
              : user?.role === 'VERIFICATION_OFFICER'
              ? 'Fixed Deposit Scrutiny Queue'
              : 'National Fixed Deposit Overview'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === 'INSTITUTION_USER'
              ? `AICTE Affiliation ID: ${user.institutionId} · Monitoring compliance corpus & security deposits`
              : 'Scrutiny, maturity monitoring, duplicate detection, and lifecycle audit enforcement'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'INSTITUTION_USER' && (
            <button
              onClick={() => onNavigate('fdr-create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New FDR</span>
            </button>
          )}

          {user?.role === 'VERIFICATION_OFFICER' && (
            <button
              onClick={() => onNavigate('verification-queue')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Open Scrutiny Queue ({pendingScrutiny.length})</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium border border-slate-300 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Reports & CSV</span>
          </button>
        </div>
      </div>

      {/* Critical Action Banners (Correction Required or Matured Alerts) */}
      {correctionRequired.length > 0 && user?.role === 'INSTITUTION_USER' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Correction Requested by AICTE Scrutiny Officer ({correctionRequired.length} record)
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                FDR <strong>{correctionRequired[0].fdrNumber}</strong> has been returned for corrections: "
                {correctionRequired[0].correctionRequirements}". Please upload revised documents and resubmit.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => onNavigate(`fdr-detail-${correctionRequired[0].id}`)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-900 hover:text-amber-950 underline"
                >
                  View Correction Notes & Edit Record →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Maturity Alert Notification Banner */}
      {maturityStats?.upcoming15Days > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
          <div className="flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Upcoming Maturity Alert ({maturityStats.upcoming15Days} deposit within 15 days)
              </h4>
              <p className="text-xs text-rose-800 mt-1">
                Institutional Fixed Deposit is maturing shortly. To maintain uninterrupted AICTE compliance, please initiate the renewal rollover process.
              </p>
              <div className="mt-2">
                <button
                  onClick={() => onNavigate('maturity-calendar')}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-900 hover:text-rose-950 underline"
                >
                  Open Maturity Calendar & Action Center →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Active Corpus */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Verified Corpus Amount</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {formatINR(approvedFdrs.reduce((sum, r) => sum + r.depositAmountINR, 0))}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {approvedFdrs.length} Active Verified FDRs
          </div>
        </div>

        {/* Pending Scrutiny */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Scrutiny</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-700 mt-2">
            {pendingScrutiny.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Awaiting Officer Verification
          </div>
        </div>

        {/* Action Due / Maturing */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Maturity Approaching</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-2">
            {maturityStats?.upcoming30Days || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Due within 30 days
          </div>
        </div>

        {/* Duplicate / Flags */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Duplicate Collisions</span>
            <ShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
            {duplicatesFlagged.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cross-Institution Collisions Flagged
          </div>
        </div>
      </div>

      {/* Main Content Split: Recent FDRs & Quick Action Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {user?.role === 'VERIFICATION_OFFICER'
                ? 'Pending Scrutiny Queue'
                : 'Recent Institutional FDR Records'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, bank details, maturity schedules, and verification progress
            </p>
          </div>
          <button
            onClick={() => onNavigate(user?.role === 'VERIFICATION_OFFICER' ? 'verification-queue' : 'fdr-list')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>View All ({totalFdrs})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Record ID</th>
                <th className="py-3 px-4">Bank & Branch</th>
                <th className="py-3 px-4">FDR Number</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">Maturity Date</th>
                <th className="py-3 px-4">Scrutiny Status</th>
                <th className="py-3 px-4">Lifecycle</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {fdrs.slice(0, 6).map((fdr) => (
                <tr key={fdr.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-blue-900">
                    {fdr.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{fdr.bankName}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {fdr.branchName}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-900">
                    <div className="flex items-center gap-1">
                      <span>{fdr.fdrNumber}</span>
                      {fdr.isDuplicateFlagged && (
                        <span
                          className="px-1 py-0.2 bg-rose-100 text-rose-800 text-[10px] rounded font-bold"
                          title="Collision detected with another record"
                        >
                          DUP!
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {formatINR(fdr.depositAmountINR)}
                  </td>
                  <td className="py-3 px-4">
                    <div>{fdr.maturityDate}</div>
                    <div className="text-[10px] text-slate-400">
                      Tenure: {fdr.tenureMonths} mo @ {fdr.interestRatePercent}%
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <VerificationBadge status={fdr.verificationStatus} />
                  </td>
                  <td className="py-3 px-4">
                    <LifecycleBadge status={fdr.lifecycleStatus} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onNavigate(`fdr-detail-${fdr.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                    >
                      {user?.role === 'VERIFICATION_OFFICER' && fdr.verificationStatus === 'SUBMITTED'
                        ? 'Scrutinize'
                        : 'View Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Institutional Compliance Notice & Guidelines */}
      <div className="bg-slate-50 rounded-lg p-5 border border-slate-200 text-xs text-slate-600">
        <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          AICTE FDR Regulatory & Joint Lien Norms (APH 2024-27)
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-600 leading-relaxed">
          <li>
            Fixed Deposit Receipts submitted for new course approvals or campus expansion must strictly be in joint name of <em>Regional Officer, AICTE</em> and the authorized Chairman/Trustee.
          </li>
          <li>
            FDRs must remain unencumbered without third-party lien, pledge, or loan facilities against deposit corpus.
          </li>
          <li>
            Upon reaching maturity, institutions must submit an official renewal application along with the renewed bank confirmation within 15 days to avoid notice of deficiency.
          </li>
        </ul>
      </div>
    </div>
  );
};
