import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { FdrListPage } from './pages/FdrListPage';
import { FdrCreateEditPage } from './pages/FdrCreateEditPage';
import { FdrDetailPage } from './pages/FdrDetailPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';
import { MaturityCalendarPage } from './pages/MaturityCalendarPage';
import { RenewalReleasePage } from './pages/RenewalReleasePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { AutomatedTestsPage } from './pages/AutomatedTestsPage';
import { ApplicationTrackingPage } from './pages/ApplicationTrackingPage';
import { Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-sm font-semibold tracking-wide uppercase text-amber-400">
          AICTE FDR Management Portal
        </div>
        <div className="text-xs text-slate-400 mt-1">Initializing secure session...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Parse detail routes (e.g. "fdr-detail-FDR-2026-DEL-001")
  let pageComponent: React.ReactNode;
  if (currentPage.startsWith('fdr-detail-')) {
    const recordId = currentPage.replace('fdr-detail-', '');
    pageComponent = <FdrDetailPage recordId={recordId} onNavigate={setCurrentPage} />;
  } else {
    switch (currentPage) {
      case 'dashboard':
        pageComponent = <DashboardPage onNavigate={setCurrentPage} />;
        break;
      case 'track-application':
        pageComponent = <ApplicationTrackingPage onNavigate={setCurrentPage} />;
        break;
      case 'fdr-list':
        pageComponent = <FdrListPage onNavigate={setCurrentPage} />;
        break;
      case 'fdr-create':
        pageComponent = <FdrCreateEditPage onNavigate={setCurrentPage} />;
        break;
      case 'verification-queue':
        pageComponent = <VerificationQueuePage onNavigate={setCurrentPage} />;
        break;
      case 'maturity-calendar':
        pageComponent = <MaturityCalendarPage onNavigate={setCurrentPage} />;
        break;
      case 'renewal-release':
        pageComponent = <RenewalReleasePage onNavigate={setCurrentPage} />;
        break;
      case 'documents':
        pageComponent = <DocumentsPage onNavigate={setCurrentPage} />;
        break;
      case 'reports':
        pageComponent = <ReportsPage onNavigate={setCurrentPage} />;
        break;
      case 'audit-logs':
        pageComponent = <AuditLogsPage onNavigate={setCurrentPage} />;
        break;
      case 'user-management':
        pageComponent = <UserManagementPage onNavigate={setCurrentPage} />;
        break;
      case 'settings':
        pageComponent = <SystemSettingsPage onNavigate={setCurrentPage} />;
        break;
      case 'automated-tests':
        pageComponent = <AutomatedTestsPage onNavigate={setCurrentPage} />;
        break;
      default:
        pageComponent = <DashboardPage onNavigate={setCurrentPage} />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Header onNavigate={setCurrentPage} />

      {/* Mobile subheader with hamburger button */}
      <div className="lg:hidden bg-slate-800 text-white px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white"
        >
          <Menu className="w-4 h-4" />
          <span>Navigation Menu</span>
        </button>
        <span className="text-[11px] text-amber-400 font-semibold uppercase">
          {currentPage.replace('-', ' ')}
        </span>
      </div>

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {pageComponent}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-4 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            AICTE Joint Fixed Deposit Receipt (JFDR) Management & Refund Portal
          </div>
          <div className="text-[11px] text-slate-500">
            Compliant with AICTE Approval Process Handbook (APH) Regulatory Standards
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
