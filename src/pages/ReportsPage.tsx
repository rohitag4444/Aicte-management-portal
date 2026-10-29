import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';

export const ReportsPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.getReportSummary();
      setSummary(res);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [user]);

  const handleExportCsv = () => {
    window.location.href = '/api/reports/export-csv';
  };

  const handlePrint = () => {
    window.print();
  };

  const formatINR = (amt: number) => `₹${(amt || 0).toLocaleString('en-IN')}`;

  const statusData = summary?.statusDistribution
    ? Object.entries(summary.statusDistribution).map(([name, count]) => ({
        name: name.replace('_', ' '),
        count,
      }))
    : [];

  const bankData = summary?.bankDistribution
    ? Object.entries(summary.bankDistribution).map(([bank, data]: [string, any]) => ({
        bank: bank.replace('State Bank of India', 'SBI').replace('Punjab National Bank', 'PNB'),
        amountLakhs: Math.round(data.totalINR / 100000),
        count: data.count,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-700" />
            Module 10 · Institutional Analytics & Statutory Reporting
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            FDR Status, Bank Allocation & Compliance Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade reporting with DDE formula-injection sanitization on all CSV outputs
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Sanitized CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Fixed Deposits</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.totalRecords || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across authorized banks</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Total Deposit Corpus Value</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {formatINR(summary?.totalAmountINR || 0)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Secured under AICTE custody</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Missing Mandatory Receipts</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {summary?.missingDocumentsCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requires document upload</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Flagged Duplicate Cases</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">
            {summary?.duplicateFlaggedCount || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Under scrutinizer review</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 1: Verification Status Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Scrutiny & Verification Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e40af" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bank Corpus Concentration (INR Lakhs) */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Bank Exposure & Concentration (₹ in Lakhs)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="bank" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <Tooltip formatter={(val: any) => [`₹${val} Lakhs`, 'Deposit Value']} />
                <Bar dataKey="amountLakhs" fill="#047857" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statutory Statement Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Bank-Wise Exposure & Security Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated holding report for statutory compliance audit
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">Financial Institution</th>
              <th className="py-2.5 px-4">Active Deposit Count</th>
              <th className="py-2.5 px-4">Aggregate Principal (INR)</th>
              <th className="py-2.5 px-4">Share of Total Corpus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {summary?.bankDistribution &&
              Object.entries(summary.bankDistribution).map(([bank, data]: [string, any]) => {
                const pct =
                  summary.totalAmountINR > 0
                    ? ((data.totalINR / summary.totalAmountINR) * 100).toFixed(1)
                    : '0';
                return (
                  <tr key={bank} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{bank}</td>
                    <td className="py-2.5 px-4">{data.count} FDRs</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {formatINR(data.totalINR)}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-medium text-slate-600">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
