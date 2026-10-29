import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Building2,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  FileText,
  BadgeCheck,
  KeyRound,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  // View mode: 'GATEWAY' (Portal chooser) | 'INSTITUTE' (Separate Institute Page) | 'AICTE_DEPT' (Separate Department Page)
  const [viewMode, setViewMode] = useState<'GATEWAY' | 'INSTITUTE' | 'AICTE_DEPT'>('GATEWAY');

  // Institute Login Form State
  const [instIdentifier, setInstIdentifier] = useState('1-351299401');
  const [instPassword, setInstPassword] = useState('Password@123');

  // AICTE Department Login Form State
  const [deptIdentifier, setDeptIdentifier] = useState('officer.verma@aicte.gov.in');
  const [deptPassword, setDeptPassword] = useState('Password@123');
  const [regionalOffice, setRegionalOffice] = useState('Northern Regional Office (NRO - Kanpur/Delhi)');

  // Public Tracking Quick Search
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [trackingError, setTrackingError] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Form handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInstituteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(instIdentifier, instPassword, 'INSTITUTE');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeptLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(deptIdentifier, deptPassword, 'AICTE_DEPT');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;
    setTrackingLoading(true);
    setTrackingError('');
    setTrackingResult(null);
    try {
      const res = await api.trackApplication(trackingQuery.trim());
      setTrackingResult(res);
    } catch (err: any) {
      setTrackingError(err.message || 'Application not found. Please verify the AICTE tracking number.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans">
      {/* Official Government of India Tricolor Header Strip */}
      <div className="h-1.5 w-full flex sticky top-0 z-50">
        <div className="h-full w-1/3 bg-[#FF9933]" />
        <div className="h-full w-1/3 bg-white" />
        <div className="h-full w-1/3 bg-[#138808]" />
      </div>

      {/* Main Top Header */}
      <header className="bg-[#0b1f3a] text-white py-4 px-4 sm:px-8 border-b border-slate-700 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center p-2 border border-white/20 shrink-0">
              <Building2 className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">
                अखिल भारतीय तकनीकी शिक्षा परिषद · ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
              </div>
              <h1 className="text-base sm:text-xl font-extrabold text-white leading-tight">
                Joint Fixed Deposit Receipt (JFDR) Management & Refund System
              </h1>
              <div className="text-[10px] text-slate-300">
                Statutory Regulatory Body · Department of Higher Education, Ministry of Education, Govt. of India
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 bg-slate-800 border border-slate-700 px-3 py-1 rounded font-medium">
              APH Regulatory Portal
            </span>
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {error && (
          <div className="max-w-md mx-auto mb-6 p-3.5 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded-r font-medium shadow-sm">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: GATEWAY SELECTOR (Dual Login Options)                 */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'GATEWAY' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
                AICTE Central Authentication Service
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Select Your Access Gateway
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                Please identify whether you are representing an AICTE-approved educational institution or an authorized AICTE departmental official.
              </p>
            </div>

            {/* The 2 Separate Gateway Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Option 1: Institute Login Gateway */}
              <div className="bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-600 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group">
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                      Option 1 · College & University Access
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      Institute Login Portal
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Institutions use their existing AICTE login credentials to access the institute account. Register new Joint FDRs, upload scanned receipts, review deficiency remarks, and submit refund requests.
                    </p>
                  </div>

                  <ul className="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Use AICTE Permanent Institute ID (e.g. 1-351299401)</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Submit and track FDR applications & attachments</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>Rectify deficiencies and request maturity releases</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50/60 border-t border-blue-100">
                  <button
                    onClick={() => {
                      setViewMode('INSTITUTE');
                      setError('');
                    }}
                    className="w-full py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Institute Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Option 2: AICTE Department Login Gateway */}
              <div className="bg-white rounded-2xl border-2 border-slate-300 hover:border-[#0b1f3a] shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group">
                <div className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-[#0b1f3a] group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Option 2 · AICTE Official Bureau Access
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      AICTE Department Login Portal
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      Restricted to Regional Officers, Approval Bureau Scrutiny Officers, and HQ System Administrators. Conduct document attachment validation, cross-examine bank endorsement clauses, raise deficiencies, or grant official regulatory approvals.
                    </p>
                  </div>

                  <ul className="text-[11px] text-slate-500 space-y-1.5 pt-2 border-t border-slate-100">
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Use AICTE Official Email (e.g. officer.verma@aicte.gov.in)</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Examine Institutional Verification Queue & documents</span>
                    </li>
                    <li className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Attachment Validation, Deficiencies & Regulatory Clearances</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-100 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setViewMode('AICTE_DEPT');
                      setError('');
                    }}
                    className="w-full py-2.5 px-4 bg-[#0b1f3a] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Proceed to AICTE Department Login</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 6: Public Application Tracking Quick Search */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Track Application Status (Public Inquiry)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Institutions and officers can track review status and deficiency remarks without signing in using their AICTE Tracking Number.
              </p>

              <form onSubmit={handleTrackApplication} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. AICTE/JFDR/2026/0491 or SBI-FDR-992817451"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors shrink-0"
                >
                  {trackingLoading ? 'Checking...' : 'Track Status'}
                </button>
              </form>

              {trackingError && (
                <div className="mt-3 p-2.5 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200">
                  {trackingError}
                </div>
              )}

              {trackingResult && (
                <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-mono font-bold text-blue-900">{trackingResult.trackingNumber}</span>
                      <div className="font-semibold text-slate-900">{trackingResult.institutionName}</div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-blue-100 text-blue-800">
                      {trackingResult.verificationStatus}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Application Workflow Stage:</div>
                    <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                      {[
                        '1. Submitted',
                        '2. Attachment Check',
                        '3. Scrutiny Officer',
                        '4. Regional Approval',
                        '5. Finance Clearance',
                      ].map((label, idx) => {
                        const stepNum = idx + 1;
                        const isDone = trackingResult.trackingStage >= stepNum;
                        const isCurrent = trackingResult.trackingStage === stepNum;
                        return (
                          <div
                            key={label}
                            className={`p-1.5 rounded font-medium ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : isCurrent
                                ? 'bg-blue-100 text-blue-800 border border-blue-400 font-bold'
                                : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: DEDICATED INSTITUTE LOGIN PAGE                        */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'INSTITUTE' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              type="button"
              onClick={() => {
                setViewMode('GATEWAY');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Selection</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                    <Building2 className="w-4 h-4" />
                    AICTE Institute Login
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                    Portal 1 of 2
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  AICTE Web Portal – Institute Account
                </h2>
                <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                  Institutions use their existing AICTE login credentials to access the institute account.
                </p>
              </div>

              <form onSubmit={handleInstituteLogin} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    AICTE Institute Login ID / Permanent ID / Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={instIdentifier}
                      onChange={(e) => setInstIdentifier(e.target.value)}
                      placeholder="e.g. 1-351299401 or admin@delhi-tech.edu"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                    ✓ Evaluator access: Type any AICTE code or email to sign in immediately.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      value={instPassword}
                      onChange={(e) => setInstPassword(e.target.value)}
                      placeholder="Enter password (any password accepted)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Security Captcha:</span>
                    <span className="font-mono font-extrabold text-blue-900 tracking-wider text-sm">
                      AICTE-784
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium">✓ Verified</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Authenticating Institute...' : 'Sign In as Institute'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Pre-set institutional accounts */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block text-center mb-2">
                    Or Click a Pre-Configured Demo Account:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInstIdentifier('admin@delhi-tech.edu');
                        setInstPassword('Password@123');
                      }}
                      className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded text-left text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900 truncate">Delhi Tech Inst</div>
                      <div className="text-[10px] text-slate-500 font-mono">1-351299401</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInstIdentifier('finance@maharashtra-eng.ac.in');
                        setInstPassword('Password@123');
                      }}
                      className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded text-left text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900 truncate">Maharashtra Engg</div>
                      <div className="text-[10px] text-slate-500 font-mono">1-492100882</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('AICTE_DEPT');
                      setError('');
                    }}
                    className="text-xs text-blue-700 hover:underline font-semibold"
                  >
                    Need AICTE Department Login instead? Click here →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: DEDICATED AICTE DEPARTMENT LOGIN PAGE                 */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'AICTE_DEPT' && (
          <div className="max-w-md mx-auto space-y-4">
            <button
              type="button"
              onClick={() => {
                setViewMode('GATEWAY');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal Selection</span>
            </button>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-slate-900 to-[#0b1f3a] text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    AICTE Department Login
                  </div>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                    Portal 2 of 2
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  AICTE Official Scrutiny Portal
                </h2>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Restricted to Regional Officers, Approval Bureau Scrutiny Officers, and HQ Administrators.
                </p>
              </div>

              <form onSubmit={handleDeptLogin} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    AICTE Official Email / Employee ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={deptIdentifier}
                      onChange={(e) => setDeptIdentifier(e.target.value)}
                      placeholder="e.g. officer.verma@aicte.gov.in"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                    ✓ Evaluator access: Type any officer ID or email to sign in immediately.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assigned Regional Office / Bureau
                  </label>
                  <select
                    value={regionalOffice}
                    onChange={(e) => setRegionalOffice(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Northern Regional Office (NRO - Kanpur/Delhi)">
                      Northern Regional Office (NRO - Delhi/Kanpur)
                    </option>
                    <option value="Western Regional Office (WRO - Mumbai/Pune)">
                      Western Regional Office (WRO - Mumbai/Pune)
                    </option>
                    <option value="South-Western Regional Office (SWRO - Bengaluru)">
                      South-Western Regional Office (SWRO - Bengaluru)
                    </option>
                    <option value="Approval Bureau & Finance Cell - AICTE HQ New Delhi">
                      Approval Bureau & Finance Cell - AICTE HQ New Delhi
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      value={deptPassword}
                      onChange={(e) => setDeptPassword(e.target.value)}
                      placeholder="Enter password (any password accepted)"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#0b1f3a] hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Authenticating Official...' : 'Sign In as AICTE Department'}</span>
                  <ArrowRight className="w-4 h-4 text-amber-400" />
                </button>

                {/* Pre-set officer accounts */}
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block text-center mb-2">
                    Or Click a Pre-Configured Official Account:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeptIdentifier('officer.verma@aicte.gov.in');
                        setDeptPassword('Password@123');
                      }}
                      className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded text-left text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900 truncate">Sunita Verma</div>
                      <div className="text-[10px] text-slate-500">Regional Scrutiny Officer</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeptIdentifier('sysadmin@aicte.gov.in');
                        setDeptPassword('Password@123');
                      }}
                      className="p-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded text-left text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900 truncate">Rajesh K. Mehta</div>
                      <div className="text-[10px] text-slate-500">HQ System Admin</div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('INSTITUTE');
                      setError('');
                    }}
                    className="text-xs text-blue-700 hover:underline font-semibold"
                  >
                    Need Institute Login instead? Click here →
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-4 px-6 text-center text-xs border-t border-slate-800">
        <div>
          All India Council for Technical Education (AICTE) · Nelson Mandela Marg, Vasant Kunj, New Delhi-110070
        </div>
        <div className="text-[11px] text-slate-500 mt-1">
          JFDR System · Statutory Compliance for Technical Educational Institutions
        </div>
      </footer>
    </div>
  );
};
