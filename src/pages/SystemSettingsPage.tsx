import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { Sliders, ShieldCheck, RefreshCw, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

export const SystemSettingsPage: React.FC<{ onNavigate: (page: string) => void }> = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [reseedLoading, setReseedLoading] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all demo data back to default initial seed state? This is useful for repeatable hackathon demonstrations.')) return;
    setReseedLoading(true);
    try {
      await api.resetDemoData();
      alert('Demo data successfully re-initialized!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReseedLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-700" />
            Module 3C · Governance & System Configuration
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Portal Policy & Workflow Settings</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated alert thresholds, mandatory documentation rules, and collision matching sensitivity
          </p>
        </div>

        <button
          onClick={handleResetDemoData}
          disabled={reseedLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-md border border-rose-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
          <span>Reset Demo Dataset</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Maturity Alerts */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
            1. Automated Maturity Alert Intervals (Days Prior to Maturity)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Server cron schedules automated alerts to institutions at these threshold intervals:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {[30, 15, 7, 0].map((days) => (
              <div key={days} className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
                <span className="text-base font-bold text-blue-900">{days === 0 ? 'Due Date' : `${days} Days`}</span>
                <span className="block text-[10px] text-slate-500 mt-0.5">Automated Dispatch</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Scrutiny Prerequisites */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
            2. Mandatory Scrutiny Verification Rules
          </h3>
          <div className="space-y-3 mt-4 text-xs">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireJointLienLetter}
                onChange={(e) => setSettings({ ...settings, requireJointLienLetter: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Enforce Mandatory Joint Account Lien Endorsement
                </span>
                <span className="text-slate-500 text-[11px]">
                  FDR receipt title must strictly include the AICTE Regional Officer as joint holder.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireBankConfirmation}
                onChange={(e) => setSettings({ ...settings, requireBankConfirmation: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Require Independent Bank Confirmation Letter
                </span>
                <span className="text-slate-500 text-[11px]">
                  Branch manager letter confirming unencumbered deposit status with branch seal.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Smart Detection Controls */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200">
            3. AI & Automation Engines
          </h3>
          <div className="space-y-3 mt-4 text-xs">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableOcrExtraction}
                onChange={(e) => setSettings({ ...settings, enableOcrExtraction: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Enable OCR-Assisted Receipt Autofill (Advisory Parser)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Parses uploaded receipt images to suggest bank, deposit amount, and maturity dates with mandatory human-in-the-loop review.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableAutomaticMaturityAlerts}
                onChange={(e) => setSettings({ ...settings, enableAutomaticMaturityAlerts: e.target.checked })}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-bold text-slate-900 block">
                  Automated Background Maturity Alert Scheduler
                </span>
                <span className="text-slate-500 text-[11px]">
                  Continuously monitors upcoming dates and dispatches deduplicated alerts.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Bar */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          {saveSuccess ? (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Settings updated and logged to audit trail.
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Last saved: {new Date(settings.updatedAt).toLocaleDateString()} by {settings.updatedBy}
            </span>
          )}

          <button
            type="submit"
            className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
