import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDRRecord } from '../types';
import { VerificationBadge, LifecycleBadge } from '../components/StatusBadges';
import {
  Search,
  Filter,
  PlusCircle,
  Download,
  AlertTriangle,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
} from 'lucide-react';

export const FdrListPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<FDRRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState('ALL');
  const [bankFilter, setBankFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '10',
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (lifecycleFilter !== 'ALL') params.lifecycle = lifecycleFilter;
      if (bankFilter !== 'ALL') params.bank = bankFilter;

      const res = await api.getFdrs(params);
      setRecords(res.data);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalRecords(res.pagination.total);
    } catch (err) {
      console.error('Failed to load FDR records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter, lifecycleFilter, bankFilter, sortBy, sortOrder, page, user]);

  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete draft record ${id}?`)) return;
    try {
      await api.deleteDraftFdr(id);
      fetchRecords();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/reports/export-csv';
  };

  const formatINR = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Institutional FDR Records Repository</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage, scrutinize, and track Fixed Deposit Receipts across authorized tenures and banks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {user?.role === 'INSTITUTION_USER' && (
            <button
              onClick={() => onNavigate('fdr-create')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add FDR</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by FDR No, Record ID, Bank name, Purpose..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Verification Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="APPROVED">Verified & Approved</option>
              <option value="SUBMITTED">Submitted for Scrutiny</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORRECTION_REQUIRED">Correction Required</option>
              <option value="DRAFT">Draft</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Lifecycle Status Filter */}
          <div>
            <select
              value={lifecycleFilter}
              onChange={(e) => {
                setLifecycleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Lifecycle States</option>
              <option value="ACTIVE">Active</option>
              <option value="MATURITY_APPROACHING">Maturity Approaching</option>
              <option value="MATURED">Matured</option>
              <option value="RENEWAL_REQUESTED">Renewal Requested</option>
              <option value="RELEASE_REQUESTED">Release Requested</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>

        {/* Second Row: Bank filter & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Bank:</span>
            <select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Banks</option>
              <option value="State Bank of India">State Bank of India</option>
              <option value="Punjab National Bank">Punjab National Bank</option>
              <option value="Bank of Baroda">Bank of Baroda</option>
              <option value="Canara Bank">Canara Bank</option>
              <option value="Union Bank of India">Union Bank of India</option>
              <option value="HDFC Bank">HDFC Bank</option>
              <option value="ICICI Bank">ICICI Bank</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 py-1 text-xs rounded border border-slate-300 focus:outline-none"
            >
              <option value="updatedAt">Last Updated</option>
              <option value="maturityDate">Maturity Date</option>
              <option value="issueDate">Issue Date</option>
              <option value="depositAmountINR">Deposit Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-slate-100 rounded border border-slate-300 text-slate-600"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading records...
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching FDR records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting search query or active filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Institution / Code</th>
                  <th className="py-3 px-4">Bank & Branch</th>
                  <th className="py-3 px-4">FDR Receipt Number</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4">Scrutiny Status</th>
                  <th className="py-3 px-4">Lifecycle</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => onNavigate(`fdr-detail-${r.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-blue-900">
                      {r.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 truncate max-w-[180px]">
                        {r.institutionName}
                      </div>
                      <div className="text-[10px] text-slate-400">AICTE: {r.aicteCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.bankName}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                        {r.branchName}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{r.fdrNumber}</span>
                        {r.isDuplicateFlagged && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300"
                            title={r.duplicateNotes || 'Duplicate collision detected'}
                          >
                            FLAG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatINR(r.depositAmountINR)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{r.maturityDate}</div>
                      <div className="text-[10px] text-slate-400">
                        {r.tenureMonths} mo @ {r.interestRatePercent}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <VerificationBadge status={r.verificationStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <LifecycleBadge status={r.lifecycleStatus} />
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onNavigate(`fdr-detail-${r.id}`)}
                          className="px-2 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                        >
                          View
                        </button>
                        {r.verificationStatus === 'DRAFT' && user?.role === 'INSTITUTION_USER' && (
                          <button
                            onClick={(e) => handleDeleteDraft(r.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete draft record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong>{records.length}</strong> of <strong>{totalRecords}</strong> total records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-300 disabled:opacity-40 hover:bg-white text-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
