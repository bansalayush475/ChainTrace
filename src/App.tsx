import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VictimTracePage from './pages/VictimTracePage';
import P2PRadarPage from './pages/P2PRadarPage';
import BulkTriagePage from './pages/BulkTriagePage';
import InvestigationsPage from './pages/InvestigationsPage';
import InvestigationDetailPage from './pages/InvestigationDetailPage';
import WalletAnalysisPage from './pages/WalletAnalysisPage';
import TransactionsPage from './pages/TransactionsPage';
import FundFlowPage from './pages/FundFlowPage';
import ClustersPage from './pages/ClustersPage';
import AttributionPage from './pages/AttributionPage';
import AlertsPage from './pages/AlertsPage';
import EvidencePage from './pages/EvidencePage';
import TimelinePage from './pages/TimelinePage';
import ReportsPage from './pages/ReportsPage';
import WatchlistPage from './pages/WatchlistPage';
import AuditLogsPage from './pages/AuditLogsPage';
import InfrastructurePage from './pages/InfrastructurePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

export default function App() {
  useEffect(() => {
    const saved = localStorage.getItem('chaintrace-theme');
    if (saved === 'day') document.documentElement.setAttribute('data-theme', 'day');
    useStore.getState().initDatabase();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/victim-trace" element={<ProtectedRoute><VictimTracePage /></ProtectedRoute>} />
        <Route path="/p2p-radar" element={<ProtectedRoute><P2PRadarPage /></ProtectedRoute>} />
        <Route path="/bulk-triage" element={<ProtectedRoute><BulkTriagePage /></ProtectedRoute>} />
        <Route path="/investigations" element={<ProtectedRoute><InvestigationsPage /></ProtectedRoute>} />
        <Route path="/investigations/:id" element={<ProtectedRoute><InvestigationDetailPage /></ProtectedRoute>} />
        <Route path="/wallets" element={<ProtectedRoute><WalletAnalysisPage /></ProtectedRoute>} />
        <Route path="/wallets/:address" element={<ProtectedRoute><WalletAnalysisPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
        <Route path="/fund-flow" element={<ProtectedRoute><FundFlowPage /></ProtectedRoute>} />
        <Route path="/clusters" element={<ProtectedRoute><ClustersPage /></ProtectedRoute>} />
        <Route path="/attribution" element={<ProtectedRoute><AttributionPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
        <Route path="/evidence" element={<ProtectedRoute><EvidencePage /></ProtectedRoute>} />
        <Route path="/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogsPage /></ProtectedRoute>} />
        <Route path="/infrastructure" element={<ProtectedRoute><InfrastructurePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
