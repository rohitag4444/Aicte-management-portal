import React from 'react';
import { VerificationStatus, FdrLifecycleStatus } from '../types';

export const VerificationBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          Verified & Approved
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
          Under Scrutiny
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
          Submitted
        </span>
      );
    case 'CORRECTION_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          Correction Required
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Rejected
        </span>
      );
    case 'DRAFT':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Draft
        </span>
      );
  }
};

export const LifecycleBadge: React.FC<{ status: FdrLifecycleStatus }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Active Deposit
        </span>
      );
    case 'MATURITY_APPROACHING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          Maturity Approaching
        </span>
      );
    case 'MATURED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
          Matured (Action Due)
        </span>
      );
    case 'RENEWAL_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-purple-800 bg-purple-50 border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
          Renewal Requested
        </span>
      );
    case 'RELEASE_REQUESTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
          Release Requested
        </span>
      );
    case 'CLOSED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Closed & Liquidated
        </span>
      );
    default:
      return null;
  }
};
