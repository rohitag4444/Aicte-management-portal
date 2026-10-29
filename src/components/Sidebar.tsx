import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  CheckSquare,
  CalendarDays,
  RefreshCw,
  FolderLock,
  BarChart3,
  ScrollText,
  Users,
  Sliders,
  TestTube2,
  Search,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  // Define navigation items with server-enforced role visibility
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'track-application',
      label: 'Track Application',
      icon: Search,
      badge: 'Feature 6',
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'fdr-list',
      label: 'FDR Records',
      icon: FileSpreadsheet,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'fdr-create',
      label: 'Add FDR',
      icon: PlusCircle,
      roles: ['INSTITUTION_USER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'verification-queue',
      label: 'Verification Queue',
      icon: CheckSquare,
      badge: 'Officer',
      roles: ['VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'maturity-calendar',
      label: 'Maturity Calendar',
      icon: CalendarDays,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'renewal-release',
      label: 'Renewal & Release',
      icon: RefreshCw,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FolderLock,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: ScrollText,
      roles: ['VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      roles: ['SYSTEM_ADMIN'],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Sliders,
      roles: ['SYSTEM_ADMIN'],
    },
    {
      id: 'automated-tests',
      label: 'Compliance Test Suite',
      icon: TestTube2,
      badge: '16 Invariants',
      roles: ['INSTITUTION_USER', 'VERIFICATION_OFFICER', 'SYSTEM_ADMIN'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-24 bottom-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full py-4 overflow-y-auto">
          {/* Institutional / Role Header */}
          <div className="px-4 mb-4 pb-3 border-b border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Active Scope
            </span>
            <div className="text-sm font-semibold text-white truncate mt-1">
              {role === 'INSTITUTION_USER'
                ? user.institutionName || 'Educational Institute'
                : role === 'VERIFICATION_OFFICER'
                ? 'AICTE Scrutiny Division'
                : 'AICTE Headquarters HQ'}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {user.designation}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isActive
                          ? 'bg-blue-800 text-blue-100'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Portal metadata note */}
          <div className="px-4 pt-3 mt-auto border-t border-slate-800 text-[11px] text-slate-500">
            <div>AICTE FDR Portal v2.4</div>
            <div className="text-[10px] text-slate-600 mt-0.5">Secure Encrypted Session</div>
          </div>
        </div>
      </aside>
    </>
  );
};
