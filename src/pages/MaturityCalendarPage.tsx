import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { FDRRecord } from '../types';
import { LifecycleBadge } from '../components/StatusBadges';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Bell,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const MaturityCalendarPage: React.FC<{ onNavigate: (page: string) => void }> = ({
  onNavigate,
}) => {
  const { user } = useAuth();
  const [maturityData, setMaturityData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterBucket, setFilterBucket] = useState<'ALL' | 'OVERDUE' | '7DAYS' | '15DAYS' | '30DAYS' | 'HEALTHY'>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, notifRes] = await Promise.all([
        api.getMaturityOverview(),
        api.getNotifications(),
      ]);
      setMaturityData(matRes);
      setNotifications(notifRes.notifications || []);
    } catch (err) {
      console.error('Failed to load maturity calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRunEvaluation = async () => {
    setScanning(true);
    try {
      await api.triggerMaturityEvaluation();
      await loadData();
    } finally {
      setScanning(false);
    }
  };

  const formatINR = (amt: number) => `₹${amt.toLocaleString('en-IN')}`;

  const allRecords = maturityData?.records || [];
  const filteredRecords = allRecords.filter((r: any) => {
    if (filterBucket === 'OVERDUE') return r.daysUntilMaturity < 0;
    if (filterBucket === '7DAYS') return r.daysUntilMaturity >= 0 && r.daysUntilMaturity <= 7;
    if (filterBucket === '15DAYS') return r.daysUntilMaturity > 7 && r.daysUntilMaturity <= 15;
    if (filterBucket === '30DAYS') return r.daysUntilMaturity > 15 && r.daysUntilMaturity <= 30;
    if (filterBucket === 'HEALTHY') return r.daysUntilMaturity > 30;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wide">
            <CalendarDays className="w-4 h-4 text-blue-700" />
            Module 6 · Automated Maturity Monitoring Engine
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            FDR Maturity Calendar & Scheduled Alert Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated server-calculated 30-day, 15-day, 7-day, and overdue alert windows with deduplicated notifications
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Running In-Memory Engine...' : 'Run Scheduled Alert Engine'}</span>
        </button>
      </div>

      {/* Alert Window Threshold Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {/* Overdue */}
        <div
          onClick={() => setFilterBucket('OVERDUE')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            filterBucket === 'OVERDUE'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="text-rose-700 font-semibold flex items-center justify-between">
            <span>Overdue / Matured</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800 mt-2">
            {maturityData?.maturedUnresolved || 0}
          </div>
          <div className="text-[10px] text-rose-600 mt-1">Requires immediate rollover</div>
        </div>

        {/* 7 Days */}
        <div
          onClick={() => setFilterBucket('7DAYS')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            filterBucket === '7DAYS'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="text-amber-800 font-semibold flex items-center justify-between">
            <span>Within 7 Days</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">
            {allRecords.filter((r: any) => r.daysUntilMaturity >= 0 && r.daysUntilMaturity <= 7).length}
          </div>
          <div className="text-[10px] text-amber-700 mt-1">Urgent action threshold</div>
        </div>

        {/* 15 Days */}
        <div
          onClick={() => setFilterBucket('15DAYS')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            filterBucket === '15DAYS'
              ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200'
              : 'bg-white border-slate-200 hover:border-yellow-300'
          }`}
        >
          <div className="text-yellow-800 font-semibold flex items-center justify-between">
            <span>Within 15 Days</span>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-yellow-700 mt-2">
            {allRecords.filter((r: any) => r.daysUntilMaturity > 7 && r.daysUntilMaturity <= 15).length}
          </div>
          <div className="text-[10px] text-yellow-700 mt-1">Warning notification window</div>
        </div>

        {/* 30 Days */}
        <div
          onClick={() => setFilterBucket('30DAYS')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            filterBucket === '30DAYS'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
        >
          <div className="text-blue-800 font-semibold flex items-center justify-between">
            <span>Within 30 Days</span>
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-2">
            {allRecords.filter((r: any) => r.daysUntilMaturity > 15 && r.daysUntilMaturity <= 30).length}
          </div>
          <div className="text-[10px] text-blue-700 mt-1">Early notice sent</div>
        </div>

        {/* Healthy > 30 Days */}
        <div
          onClick={() => setFilterBucket('HEALTHY')}
          className={`p-4 rounded-lg border cursor-pointer transition-all ${
            filterBucket === 'HEALTHY'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-emerald-800 font-semibold flex items-center justify-between">
            <span>Healthy (&gt;30 Days)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">
            {allRecords.filter((r: any) => r.daysUntilMaturity > 30).length}
          </div>
          <div className="text-[10px] text-emerald-700 mt-1">Normal active custody</div>
        </div>
      </div>

      {/* Main Table of Maturing FDRs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Maturity Schedule Docket ({filteredRecords.length} records)
            </h3>
            {filterBucket !== 'ALL' && (
              <button
                onClick={() => setFilterBucket('ALL')}
                className="text-[11px] text-blue-700 hover:underline font-semibold"
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>
          <span className="text-xs text-slate-500">Sorted by days to maturity</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading maturity schedule...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No records in this maturity bucket.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Record ID</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Bank & FDR No</th>
                  <th className="py-3 px-4">Deposit Amount</th>
                  <th className="py-3 px-4">Maturity Date</th>
                  <th className="py-3 px-4">Days Left / Urgency</th>
                  <th className="py-3 px-4">Current Lifecycle</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-blue-900">{r.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.institutionName}</div>
                      <div className="text-[10px] text-slate-400">{r.aicteCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.bankName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{r.fdrNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatINR(r.depositAmountINR)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.maturityDate}</div>
                      <div className="text-[10px] text-slate-400">Issued: {r.issueDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      {r.daysUntilMaturity < 0 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-100 text-rose-800 border border-rose-300">
                          Overdue ({Math.abs(r.daysUntilMaturity)} days ago)
                        </span>
                      ) : r.daysUntilMaturity === 0 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-600 text-white animate-pulse">
                          Due Today!
                        </span>
                      ) : r.daysUntilMaturity <= 7 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-100 text-amber-800 border border-amber-300">
                          {r.daysUntilMaturity} days left (Critical)
                        </span>
                      ) : r.daysUntilMaturity <= 15 ? (
                        <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-yellow-100 text-yellow-800">
                          {r.daysUntilMaturity} days left
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {r.daysUntilMaturity} days left
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <LifecycleBadge status={r.lifecycleStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onNavigate(`fdr-detail-${r.id}`)}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                      >
                        {r.lifecycleStatus === 'MATURED' || r.daysUntilMaturity <= 15
                          ? 'Initiate Renewal'
                          : 'View Record'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispatched Notification History (Module 6) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-700" />
            In-App Notification Dispatch Log ({notifications.length} logged events)
          </h3>
          <span className="text-[11px] text-slate-400">Deduplicated delivery tracking</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {notifications.map((n) => (
            <div key={n.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="font-semibold text-slate-900">{n.title}</div>
                <div className="text-slate-600 mt-0.5">{n.message}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Dispatched: {new Date(n.createdAt).toLocaleString()} · Recipient: {n.recipientRole}
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-semibold border border-emerald-200 shrink-0">
                Delivered
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
