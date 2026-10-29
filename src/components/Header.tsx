import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SystemNotification } from '../types';
import { Bell, Shield, Building2, UserCheck, LogOut, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export const Header: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { user, logout, switchRole, demoAccounts } = useAuth();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [evaluatingMaturity, setEvaluatingMaturity] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleTriggerMaturity = async () => {
    setEvaluatingMaturity(true);
    try {
      await api.triggerMaturityEvaluation();
      await loadNotifications();
    } finally {
      setEvaluatingMaturity(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="bg-[#0b1f3a] text-white shadow-md sticky top-0 z-40 border-b border-slate-700">
      {/* Official Government Tricolor Strip */}
      <div className="h-1 w-full flex">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* Main Topbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center p-1.5 border border-white/20">
              <Building2 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                  AICTE · Government of India
                </span>
                <span className="text-[10px] bg-blue-900/80 text-blue-200 px-1.5 py-0.2 rounded border border-blue-700/50">
                  AICTE JFDR System
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                Joint Fixed Deposit Receipt (JFDR) Portal
              </h1>
            </div>
          </div>

          {/* Right actions: Live Maturity Scan, Notifications, User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Run Maturity Check */}
            <button
              onClick={handleTriggerMaturity}
              disabled={evaluatingMaturity}
              title="Execute server-side maturity engine & notification triggers"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded border border-slate-600 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${evaluatingMaturity ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{evaluatingMaturity ? 'Scanning...' : 'Scan Maturity'}</span>
            </button>

            {/* In-App Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                title="Notifications & Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Drawer */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 text-slate-800 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      System Alerts & Notifications ({unreadCount} new)
                    </span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No active alerts. All FDR maturities and verifications are up to date.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            handleMarkRead(n.id);
                            if (n.linkedFdrId) {
                              onNavigate(`fdr-detail-${n.linkedFdrId}`);
                              setShowNotifMenu(false);
                            }
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 ${
                            !n.isRead ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.type === 'ALERT' ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            ) : n.type === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                                {!n.isRead && <span className="text-amber-700 font-medium">Unread</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                    <button
                      onClick={() => {
                        onNavigate('maturity-calendar');
                        setShowNotifMenu(false);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                    >
                      View Full Maturity & Alert Calendar →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Info */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/20">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[11px] text-slate-300">
                    {user.role === 'INSTITUTION_USER' && (user.institutionName || 'Institution Rep')}
                    {user.role === 'VERIFICATION_OFFICER' && 'AICTE Regional Scrutiny Officer'}
                    {user.role === 'SYSTEM_ADMIN' && 'System Administrator'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Sign out of portal"
                  className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quick Role Switcher */}
      <div className="bg-[#071527] border-t border-slate-800/80 px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-amber-400 text-[11px] tracking-wide uppercase flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Active User Switcher:
            </span>
            <span className="hidden md:inline text-[11px] text-slate-400">
              Switch stakeholder perspective between Institute and AICTE Officials
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {demoAccounts.map((acc) => {
              const isActive = user?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => switchRole(acc.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {acc.role === 'INSTITUTION_USER' && <Building2 className="w-3 h-3 text-emerald-400" />}
                  {acc.role === 'VERIFICATION_OFFICER' && <UserCheck className="w-3 h-3 text-amber-400" />}
                  {acc.role === 'SYSTEM_ADMIN' && <Shield className="w-3 h-3 text-cyan-400" />}
                  <span>
                    {acc.role === 'INSTITUTION_USER'
                      ? '1. Institution (Delhi Tech)'
                      : acc.role === 'VERIFICATION_OFFICER'
                      ? '2. Verification Officer'
                      : '3. System Admin'}
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
