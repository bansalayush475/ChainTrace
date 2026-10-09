import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, ShieldAlert, SlidersHorizontal, ChevronDown } from 'lucide-react';
import AlertCard from '../components/ui/AlertCard';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';
import { useStore } from '../store/useStore';
import type { Alert } from '../data/mockData';

const SEVERITY_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function AlertsPage() {
  const navigate = useNavigate();
  const { alerts, dismissAlert, wallets } = useStore();
  const [activeTab, setActiveTab] = useState<typeof SEVERITY_OPTIONS[number]>('ALL');
  const [showDismissed, setShowDismissed] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [caseModalAlert, setCaseModalAlert] = useState<Alert | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const dismissedCount = alerts.filter((a) => a.dismissed).length;

  const filtered = alerts.filter((a) => {
    if (!showDismissed && a.dismissed) return false;
    if (activeTab !== 'ALL' && a.severity !== activeTab) return false;
    return true;
  });

  const counts = SEVERITY_OPTIONS.reduce((acc, tab) => {
    const list = showDismissed ? alerts : activeAlerts;
    acc[tab] = tab === 'ALL' ? list.length : list.filter((a) => a.severity === tab).length;
    return acc;
  }, {} as Record<string, number>);

  function handleDismiss(id: string) {
    dismissAlert(id);
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 450);
  }

  const tabColors: Record<string, string> = {
    ALL: 'var(--accent)',
    CRITICAL: 'var(--risk-critical)',
    HIGH: 'var(--risk-high)',
    MEDIUM: 'var(--risk-medium)',
    LOW: 'var(--risk-low)',
  };

  const severityDotColors: Record<string, string> = {
    ALL: '#60a5fa',
    CRITICAL: '#ef4444',
    HIGH: '#f97316',
    MEDIUM: '#eab308',
    LOW: '#22c55e',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={22} style={{ color: 'var(--risk-critical)' }} />
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Security Alerts &amp; Telemetry</h1>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
            {alerts.filter((a) => !a.dismissed).length} active anomalies requiring forensic intervention
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            <div
              onClick={() => setAutoRefresh((v) => !v)}
              style={{
                width: '36px', height: '20px', borderRadius: '10px',
                background: autoRefresh ? '#10b981' : 'var(--border)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                position: 'absolute', top: '2px', left: autoRefresh ? '18px' : '2px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            Auto-stream
          </label>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Scanning Chains...' : 'Poll Alerts'}
          </button>
          {dismissedCount > 0 && (
            <button
              onClick={() => setShowDismissed((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                background: showDismissed ? 'rgba(66,153,225,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${showDismissed ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: showDismissed ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} />
              {showDismissed ? 'Hide Read' : `Show Read (${dismissedCount})`}
            </button>
          )}
        </div>
      </div>

      {caseModalAlert && (
        <NewInvestigationModal
          onClose={() => setCaseModalAlert(null)}
          initialWallet={caseModalAlert.walletAddress}
          initialPriority={caseModalAlert.severity}
          initialTitle={`Alert Case: ${caseModalAlert.type.replace(/_/g, ' ')}`}
        />
      )}

      {/* Filter tube icon + active filter badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Tube / funnel icon button */}
        <div ref={filterRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowFilterMenu((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: showFilterMenu ? 'rgba(37,99,235,0.12)' : 'var(--bg-elevated)',
              border: `1px solid ${showFilterMenu ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '8px',
              color: showFilterMenu ? 'var(--accent)' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <SlidersHorizontal size={15} />
            Filter
            <ChevronDown size={13} style={{ transform: showFilterMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
          </button>

          {/* Dropdown panel */}
          <AnimatePresence>
            {showFilterMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 999,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  minWidth: '200px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '10px 14px 6px', fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace' }}>
                  SEVERITY FILTER
                </div>
                {SEVERITY_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setActiveTab(opt); setShowFilterMenu(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 14px',
                      background: activeTab === opt ? `${tabColors[opt]}12` : 'transparent',
                      border: 'none',
                      borderLeft: activeTab === opt ? `3px solid ${tabColors[opt]}` : '3px solid transparent',
                      color: activeTab === opt ? tabColors[opt] : 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: activeTab === opt ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: severityDotColors[opt],
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      {opt === 'ALL' ? 'All Severities' : opt}
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: '10px',
                      background: activeTab === opt ? `${tabColors[opt]}20` : 'var(--bg-elevated)',
                      color: activeTab === opt ? tabColors[opt] : 'var(--text-secondary)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {counts[opt]}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active filter badge */}
        {activeTab !== 'ALL' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: `${tabColors[activeTab]}15`,
              border: `1px solid ${tabColors[activeTab]}40`,
              borderRadius: '20px',
              color: tabColors[activeTab],
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: tabColors[activeTab], display: 'inline-block' }} />
            {activeTab}
            <button
              onClick={() => setActiveTab('ALL')}
              style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '0 0 0 2px', fontSize: '14px', lineHeight: 1, opacity: 0.7 }}
            >
              ×
            </button>
          </motion.div>
        )}

        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
          {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert grid with AnimatePresence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '14px' }}>
        <AnimatePresence>
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onInvestigate={() => {
                const wallet = wallets.find((w) => w.address === alert.walletAddress);
                if (wallet) navigate(`/wallets/${wallet.address}`);
                else navigate('/wallets');
              }}
              onDismiss={() => handleDismiss(alert.id)}
              onAddToCase={() => setCaseModalAlert(alert)}
            />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No {activeTab === 'ALL' ? '' : activeTab.toLowerCase()} anomalies detected in current buffer
          </div>
        )}
      </div>
    </div>
  );
}
