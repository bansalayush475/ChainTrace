import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Folder, Bell, Wallet, ArrowLeftRight, GitBranch, Network,
  Building2, AlertTriangle, Briefcase, Shield, Clock, FileText, Eye,
  ScrollText, Activity, Settings, ChevronLeft, ChevronRight, LogOut, Zap,
  Landmark, Layers, ShieldCheck
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: 'WORKSPACE',
    items: [
      { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard size={15} /> },
      { label: 'Fund Trace', href: '/victim-trace', icon: <Zap size={15} />, badge: 'LIVE' },
      { label: 'Bulk Triage', href: '/bulk-triage', icon: <FileText size={15} /> },
      { label: 'Investigations', href: '/investigations', icon: <Folder size={15} /> },
      { label: 'Alerts', href: '/alerts', icon: <Bell size={15} /> },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { label: 'P2P & UPI Radar', href: '/p2p-radar', icon: <Landmark size={15} />, badge: 'NEW' },
      { label: 'Wallet Analysis', href: '/wallets', icon: <Wallet size={15} /> },
      { label: 'Transaction Explorer', href: '/transactions', icon: <ArrowLeftRight size={15} /> },
      { label: 'Fund Flow', href: '/fund-flow', icon: <GitBranch size={15} /> },
      { label: 'Wallet Clusters', href: '/clusters', icon: <Network size={15} /> },
      { label: 'Exchange Attribution', href: '/attribution', icon: <Building2 size={15} /> },
    ],
  },
  {
    group: 'CASE MANAGEMENT',
    items: [
      { label: 'Evidence', href: '/evidence', icon: <Shield size={15} /> },
      { label: 'Investigation Timeline', href: '/timeline', icon: <Clock size={15} /> },
      { label: 'Reports', href: '/reports', icon: <FileText size={15} /> },
    ],
  },
  {
    group: 'SYSTEM',
    items: [
      { label: 'Watchlist', href: '/watchlist', icon: <Eye size={15} /> },
      { label: 'Audit Logs', href: '/audit-logs', icon: <ScrollText size={15} />, badge: 'ADMIN' },
      { label: 'API Status', href: '/infrastructure', icon: <Activity size={15} />, badge: 'ADMIN' },
      { label: 'Settings', href: '/settings', icon: <Settings size={15} /> },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, logout } = useStore();
  const navigate = useNavigate();
  const width = sidebarCollapsed ? 68 : 248;

  return (
    <aside
      style={{
        width,
        minWidth: width,
        height: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), min-width 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 20,
        boxShadow: '3px 0 20px rgba(0,0,0,0.25)',
      }}
    >
      {/* Ambient gradient line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '100px',
        background: 'linear-gradient(180deg, var(--sidebar-glow) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Header / Brand Logo */}
      <div style={{
        padding: sidebarCollapsed ? '14px 10px' : '14px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
        minHeight: '56px',
        position: 'relative',
        zIndex: 1,
      }}>
        {!sidebarCollapsed ? (
          <div style={{ minWidth: 0 }}>
            <div style={{
              color: 'var(--accent)',
              fontWeight: 800,
              fontSize: '13.5px',
              letterSpacing: '0.1em',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '5px',
                background: 'rgba(56,189,248,0.12)',
                border: '1px solid rgba(56,189,248,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <Shield size={13} />
              </div>
              <span style={{ whiteSpace: 'nowrap' }}>CHAINTRACE FORENSICS</span>
            </div>
            <div style={{
              color: 'var(--text-secondary)',
              fontSize: '8.5px',
              letterSpacing: '0.08em',
              marginTop: '3px',
              fontFamily: 'JetBrains Mono, monospace',
              fontWeight: 600,
            }}>
              BLOCKCHAIN FORENSICS PLATFORM
            </div>
          </div>
        ) : (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            fontWeight: 800,
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            CT
          </div>
        )}
      </div>

      {/* Navigation Group Items */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0', position: 'relative', zIndex: 1 }} className="hide-scrollbar">
        {sidebarCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 10px' }}>
            <button
              onClick={toggleSidebar}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                display: 'flex',
                padding: '5px',
              }}
              title="Expand Sidebar"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {navGroups.map((group) => (
          <div key={group.group} style={{ marginBottom: '12px' }}>
            {!sidebarCollapsed && (
              <div style={{
                padding: '6px 18px 4px',
                fontSize: '9.5px',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--text-secondary)',
                opacity: 0.65,
                textTransform: 'uppercase',
              }}>
                {group.group}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.href + item.label}
                to={item.href}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  padding: sidebarCollapsed ? '10px' : '8px 16px',
                  margin: sidebarCollapsed ? '2px 8px' : '2px 10px',
                  borderRadius: '6px',
                  justifyContent: sidebarCollapsed ? 'center' : 'space-between',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(56,189,248,0.3)' : '1px solid transparent',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 0 12px rgba(56,189,248,0.08)' : 'none',
                })}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0 }}>
                  <span style={{ opacity: 0.9, flexShrink: 0 }}>{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                  )}
                </div>
                {!sidebarCollapsed && item.badge && (
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background:
                      item.badge === 'LIVE' ? 'rgba(239,68,68,0.12)' : 'rgba(56,189,248,0.12)',
                    color:
                      item.badge === 'LIVE' ? 'var(--risk-critical)' : 'var(--accent)',
                    border: `1px solid ${
                      item.badge === 'LIVE' ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'
                    }`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}>
                    {item.badge === 'LIVE' && (
                      <span style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'var(--risk-critical)',
                        display: 'inline-block',
                      }} className="pulse-dot" />
                    )}
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* Footer / Officer Credentials Card */}
      {user && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: sidebarCollapsed ? '12px 8px' : '12px 14px',
          background: 'var(--bg-elevated)',
          position: 'relative',
          zIndex: 1,
        }}>
          {!sidebarCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: user.roleType === 'JUNIOR'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}>
                {user.avatar}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {user.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                  <ShieldCheck size={10} style={{ color: user.roleType === 'JUNIOR' ? '#10b981' : 'var(--accent)' }} />
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: user.roleType === 'JUNIOR' ? '#10b981' : 'var(--accent)',
                      letterSpacing: '0.04em',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {user.roleType === 'JUNIOR' ? 'ANALYST' : 'RESEARCHER'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  padding: '5px',
                  transition: 'all 0.15s ease',
                }}
                title="Sign Out"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--risk-critical)';
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                onClick={() => { logout(); navigate('/login'); }}
                title={`${user.name} (${user.role}) - Click to Sign Out`}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.roleType === 'JUNIOR' ? '#10b981' : 'var(--accent)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                }}
              >
                {user.avatar}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
