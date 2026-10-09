import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronRight, Settings, Sun, Moon, LogOut, ShieldCheck, Zap, AlertCircle, CheckCircle2, X as XIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import ExecutiveBriefingModal from '../ui/ExecutiveBriefingModal';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/victim-trace': 'Fund Trace',
  '/p2p-radar': 'P2P & UPI Radar',
  '/cross-chain': 'Cross-Chain Bridge & Mixer',
  '/bulk-triage': 'Bulk Triage',
  '/investigations': 'Investigations',
  '/wallets': 'Wallet Analysis',
  '/transactions': 'Transaction Explorer',
  '/fund-flow': 'Fund Flow Intelligence',
  '/clusters': 'Wallet Clusters',
  '/attribution': 'Exchange Attribution',
  '/alerts': 'Security Alerts',
  '/evidence': 'Evidence Vault',
  '/timeline': 'Investigation Timeline',
  '/reports': 'Reports',
  '/watchlist': 'Watchlist Monitor',
  '/audit-logs': 'Audit Logs',
  '/infrastructure': 'API Status',
  '/settings': 'Settings',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSearchOpen, alerts, dismissAlert, user, theme, toggleTheme, logout } = useStore();

  const [briefingOpen, setBriefingOpen] = useState(false);
  const [showAlertDropdown, setShowAlertDropdown] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const ist = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const utc = now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour12: false });
      setTimeStr(`IST: ${ist}.${ms} | UTC: ${utc}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 75);
    return () => clearInterval(timer);
  }, []);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const pageLabel = ROUTE_LABELS['/' + pathSegments[0]] ?? pathSegments[0] ?? 'Dashboard';
  const unreadAlerts = alerts.filter((a) => !a.dismissed).length;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setSearchOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Product Info Strip */}
      <div style={{
        height: '26px',
        background: 'var(--bg-base)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        fontSize: '10.5px',
        color: 'var(--text-secondary)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>ChainTrace</span>
          <span style={{ opacity: 0.4 }}>|</span>
          <span>Blockchain Forensics Platform</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 600, color: 'var(--accent)' }}>ENTERPRISE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live Precision Clock Ticker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#10b981', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', display: 'inline-block' }} />
            <span>{timeStr || 'CLOCK SYNCING...'}</span>
          </div>
          <span className="topbar-strip-extra" style={{ opacity: 0.4 }}>|</span>
          <span className="topbar-strip-extra" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>NODE-01</span>
          <span className="topbar-strip-extra" style={{ opacity: 0.4 }}>|</span>
          <span className="topbar-strip-extra" style={{ color: '#38a169', fontWeight: 600, fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38a169' }} />
            TLS ENCRYPTED
          </span>
        </div>
      </div>

      <div
        style={{
          height: '52px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: '16px',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.04em' }}>ChainTrace</span>
        <ChevronRight size={12} style={{ color: 'var(--text-secondary)' }} />
        <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{pageLabel}</span>
      </div>

      {/* Search */}
      <div style={{ flex: '0 1 280px', maxWidth: '280px', minWidth: '130px', margin: '0 auto' }}>
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            width: '100%',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: '12px',
            textAlign: 'left',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <Search size={13} style={{ flexShrink: 0, opacity: 0.8 }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Search wallet, hash, case...
          </span>
          <kbd style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '1px 5px',
            fontSize: '10px',
            fontFamily: 'JetBrains Mono, monospace',
            color: 'var(--text-secondary)',
            flexShrink: 0,
          }}>
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
        {/* Executive Pitch Mode Trigger Button */}
        <button
          onClick={() => setBriefingOpen(true)}
          title="Open Platform Executive Briefing"
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '5px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.02em',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.35)';
          }}
        >
          <Zap size={13} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
          <span className="topbar-pitch-text">EXECUTIVE BRIEFING</span>
        </button>



        {/* Theme toggle */}
        <button
          onClick={(e) => {
            // Ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'theme-ripple';
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            ripple.style.left = rect.left + rect.width / 2 - 20 + 'px';
            ripple.style.top = rect.top + rect.height / 2 - 20 + 'px';
            document.body.appendChild(ripple);
            setTimeout(() => ripple.remove(), 700);
            toggleTheme();
          }}
          title={theme === 'night' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          style={{
            background: theme === 'night' ? 'rgba(66,153,225,0.12)' : 'rgba(43,108,176,0.1)',
            border: `1px solid ${theme === 'night' ? 'rgba(66,153,225,0.35)' : 'rgba(43,108,176,0.3)'}`,
            borderRadius: '20px',
            padding: '5px 14px',
            display: 'flex', alignItems: 'center', gap: '6px',
            cursor: 'pointer',
            color: 'var(--accent)',
            fontSize: '12px', fontWeight: 600,
          }}
        >
          {theme === 'night'
            ? <Sun size={14} style={{ color: '#d69e2e' }} />
            : <Moon size={14} style={{ color: '#4299e1' }} />}
          <span>{theme === 'night' ? 'Day' : 'Night'}</span>
        </button>

        {/* Bell with Dropdown */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlertDropdown((v) => !v)}
            title="Security Alerts"
            style={{
              position: 'relative',
              background: showAlertDropdown ? 'var(--bg-elevated)' : 'none',
              border: 'none',
              cursor: 'pointer',
              color: unreadAlerts > 0 ? 'var(--risk-critical)' : 'var(--text-secondary)',
              display: 'flex',
              padding: '5px',
              borderRadius: '6px',
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              if (!showAlertDropdown) e.currentTarget.style.background = 'none';
            }}
          >
            <Bell size={18} />
            <AnimatePresence>
              {unreadAlerts > 0 && (
                <motion.span
                  key={unreadAlerts}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  style={{
                    position: 'absolute',
                    top: 2, right: 2,
                    width: '14px', height: '14px',
                    borderRadius: '50%',
                    background: 'var(--risk-critical)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                  }}
                >
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Alert Dropdown Panel */}
          <AnimatePresence>
            {showAlertDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: '38px',
                  right: 0,
                  width: '360px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 9999,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={14} style={{ color: unreadAlerts > 0 ? 'var(--risk-critical)' : 'var(--accent)' }} />
                    <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Security Alerts</span>
                    {unreadAlerts > 0 && (
                      <span style={{ background: 'var(--risk-critical)', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '10px' }}>
                        {unreadAlerts} NEW
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAlertDropdown(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '2px' }}
                  >
                    <XIcon size={14} />
                  </button>
                </div>

                {/* Alert List */}
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {alerts.filter((a) => !a.dismissed).length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      <CheckCircle2 size={26} style={{ margin: '0 auto 8px', color: '#10b981', display: 'block' }} />
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>All Caught Up</div>
                      <div style={{ fontSize: '11px' }}>No unread forensic alerts</div>
                    </div>
                  ) : (
                    alerts
                      .filter((a) => !a.dismissed)
                      .slice(0, 5)
                      .map((alert) => (
                        <div
                          key={alert.id}
                          style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid var(--border)',
                            background: 'rgba(239,68,68,0.04)',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'flex-start',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <AlertCircle
                            size={14}
                            style={{
                              color: alert.severity === 'CRITICAL' ? 'var(--risk-critical)' : alert.severity === 'HIGH' ? '#ed8936' : 'var(--accent)',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}
                          />
                          <div
                            onClick={() => {
                              setShowAlertDropdown(false);
                              navigate('/alerts');
                            }}
                            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{alert.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {alert.message}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                              {new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlert(alert.id);
                            }}
                            title="Mark as Read & Dismiss"
                            style={{
                              background: 'rgba(16,185,129,0.1)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#10b981',
                              flexShrink: 0,
                              padding: '3px 6px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '10px',
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Read</span>
                          </button>
                        </div>
                      ))
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={() => { alerts.filter(a => !a.dismissed).forEach(a => dismissAlert(a.id)); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: 0 }}
                  >
                    Mark All Read
                  </button>
                  <button
                    onClick={() => { setShowAlertDropdown(false); navigate('/alerts'); }}
                    style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    View All Alerts →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Settings icon */}
        <button
          onClick={() => navigate('/settings')}
          title="Settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: '4px', transition: 'color 0.15s' }}
        >
          <Settings size={16} />
        </button>

        {/* Institutional Officer Badge & Profile */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Clearance Security Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 9px',
                background: user.roleType === 'JUNIOR' ? 'rgba(56,161,105,0.12)' : 'rgba(37,99,235,0.12)',
                border: `1px solid ${user.roleType === 'JUNIOR' ? 'rgba(56,161,105,0.35)' : 'rgba(37,99,235,0.35)'}`,
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 800,
                color: user.roleType === 'JUNIOR' ? '#15803d' : 'var(--accent)',
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.04em',
              }}
              title={`Role: ${user.clearanceLevel}`}
            >
              <ShieldCheck size={12} style={{ color: user.roleType === 'JUNIOR' ? '#15803d' : 'var(--accent)' }} />
              <span>{user.roleType === 'JUNIOR' ? 'ANALYST' : 'RESEARCHER'}</span>
            </div>

            {/* Officer Profile Pill */}
            <div
              onClick={() => navigate('/settings')}
              title={`${user.name} (${user.role} · ${user.clearanceLevel}) - Click for Settings`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 10px 3px 6px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: user.roleType === 'JUNIOR' ? '#38a169' : 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {user.avatar}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.15, maxWidth: '180px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={user.team || user.role}
                >
                  {user.team ? user.team.replace(/ \([^)]*\)/, '') : user.role}
                </span>
              </div>
            </div>


          </div>
        )}
      </div>
      </div>
      <ExecutiveBriefingModal
        isOpen={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        activeJurisdiction=""
      />
      <style>{`
        @media (max-width: 860px) {
          .topbar-strip-extra {
            display: none !important;
          }
          .topbar-pitch-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
