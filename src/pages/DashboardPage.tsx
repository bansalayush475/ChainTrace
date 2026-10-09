import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Wallet,
  DollarSign,
  Shield,
  Building2,
  Plus,
  CheckCircle2,
  ArrowRight,
  Search,
  Clock,
  FileCheck,
  Send,
  Lock,
  Eye,
  GitBranch,
  ArrowLeftRight,
  Users,
  Target,
  FileText,
  Zap,
  Landmark,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '../components/ui/KpiCard';
import AlertCard from '../components/ui/AlertCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import TransactionGraph from '../components/graph/TransactionGraph';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';
import { fraudPatterns, exchangeAttributions, walletClusters } from '../data/mockData';
import { useStore } from '../store/useStore';
import { getRiskColor, formatUSD, truncateAddress } from '../utils/riskEngine';

const LIVE_ALERT_MESSAGES = [
  { severity: 'CRITICAL' as const, message: 'Mixer interaction detected: 0x7A82...A91F2 sent 45.2 ETH to Tornado Cash relay', type: 'MIXER_INTERACTION' },
  { severity: 'HIGH' as const, message: 'Peel chain pattern detected across 12 hops originating from bc1q7x8m...k9d', type: 'PATTERN_DETECTED' },
  { severity: 'MEDIUM' as const, message: 'Exchange deposit flagged: TQn9Y2...Dx4Pr deposited 180,000 USDT to Huobi', type: 'EXCHANGE_DEPOSIT' },
  { severity: 'HIGH' as const, message: 'Dormant wallet activated: 0xA4B5...2B3 (dormant 847 days) moved 2.3 ETH', type: 'DORMANT_WALLET' },
  { severity: 'CRITICAL' as const, message: 'Ransomware wallet identified: 98% confidence match with WannaCry payment cluster', type: 'RANSOMWARE' },
  { severity: 'LOW' as const, message: 'New counterparty detected on watchlisted wallet 0xD1E2...D9E0', type: 'WATCHLIST_TRIGGER' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    investigations,
    alerts,
    wallets,
    transactions,
    evidence,
    watchlist,
    user,
    updateInvestigationStatus,
    addAuditLog,
  } = useStore();

  const isJunior = user?.roleType === 'JUNIOR';
  const myNameLower = (user?.name || 'priya').toLowerCase();

  // In Junior mode, strictly isolate to their specific investigations
  // In Senior mode, show everyone's work across the entire unit
  const visibleInvestigations = isJunior
    ? investigations.filter(
        (inv) =>
          inv.investigator.toLowerCase().includes('priya') ||
          inv.investigator.toLowerCase() === myNameLower
      )
    : investigations;

  const [liveAlerts, setLiveAlerts] = useState(alerts.slice(0, 5));
  const [showModal, setShowModal] = useState(false);
  const [alertIdx, setAlertIdx] = useState(0);

  // Table filter state
  const [tableFilter, setTableFilter] = useState<'ALL' | 'HIGH_RISK' | 'ACTIVE'>('ALL');
  const [investigatorFilter, setInvestigatorFilter] = useState<string>('ALL');

  // Junior Quick Tracer state
  const [quickTraceAddr, setQuickTraceAddr] = useState('');
  const [quickTraceChain, setQuickTraceChain] = useState('ETH');

  // Senior approval state
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});

  const totalFunds = visibleInvestigations.reduce((sum, inv) => sum + (inv.fundsTraced || 0), 0);
  const teamTotalFunds = investigations.reduce((sum, inv) => sum + (inv.fundsTraced || 0), 0);

  useEffect(() => {
    if (wallets.length === 0 && investigations.length === 0 && alerts.length === 0) {
      setLiveAlerts([]);
      return;
    }
    const interval = setInterval(() => {
      const template = LIVE_ALERT_MESSAGES[alertIdx % LIVE_ALERT_MESSAGES.length];
      const newAlert = {
        id: `live-${Date.now()}`,
        severity: template.severity,
        type: template.type,
        walletAddress: wallets[Math.floor(Math.random() * wallets.length)]?.address || '0x0000000000000000000000000000000000000000',
        message: template.message,
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      setLiveAlerts((prev) => [newAlert, ...prev].slice(0, 10));
      setAlertIdx((i) => i + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, [alertIdx, wallets, investigations.length, alerts.length]);

  function handleSeniorApprove(id: string, title: string, actionType: string) {
    setApprovedItems((prev) => ({ ...prev, [id]: true }));
    if (id === 'REV-01') {
      updateInvestigationStatus('INV-002', 'ESCALATED');
    }
    addAuditLog({
      user: user?.name || 'Senior Officer',
      action: 'SETTINGS_CHANGE',
      resource: id,
      ip: '192.168.1.100',
      details: `Senior Lead approved: ${title} (${actionType}) - Level-4 Executive Sign-off`,
    });
  }

  function handleQuickTrace(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTraceAddr.trim()) return;
    navigate(`/wallets/${quickTraceAddr.trim()}`);
  }

  // Filtered investigations for table
  const displayedInvestigations = visibleInvestigations.filter((inv) => {
    if (investigatorFilter !== 'ALL' && !inv.investigator.toLowerCase().includes(investigatorFilter.toLowerCase())) return false;
    if (tableFilter === 'HIGH_RISK') return inv.riskScore >= 75;
    if (tableFilter === 'ACTIVE') return inv.status === 'UNDER_INVESTIGATION' || inv.status === 'ANALYZING' || inv.status === 'ESCALATED';
    return true;
  });

  const invColumns = [
    {
      key: 'caseId',
      label: 'Case ID',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'var(--accent)' }}>
          {String(v)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'title',
      label: 'Title',
      render: (v: unknown) => (
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
          {String(v)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'fundsTraced',
      label: 'Funds Traced',
      render: (v: unknown, row: unknown) => {
        const r = row as { fundsTraced: number; currency: string };
        return (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            ${r.fundsTraced.toLocaleString()} {r.currency}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: 'riskScore',
      label: 'Risk',
      render: (v: unknown) => (
        <span style={{ color: getRiskColor(Number(v)), fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '12px' }}>
          {String(v)}
        </span>
      ),
      sortable: true,
    },
    { key: 'status', label: 'Status', render: (v: unknown) => <StatusBadge status={String(v)} size="sm" /> },
    { key: 'priority', label: 'Priority', render: (v: unknown) => <StatusBadge status={String(v)} size="sm" /> },
    {
      key: 'investigator',
      label: 'Investigator',
      render: (v: unknown) => {
        const name = String(v);
        const isSelf = name.toLowerCase().includes('priya') && isJunior;
        return (
          <span style={{ fontSize: '11.5px', fontWeight: isSelf ? 700 : 500, color: isSelf ? '#38a169' : 'var(--text-secondary)' }}>
            {name} {isSelf && '(You)'}
          </span>
        );
      },
      sortable: true,
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {showModal && <NewInvestigationModal onClose={() => setShowModal(false)} />}

      {/* ─── Top Command Strip (Government Operations Standard) ─── */}
      <motion.div
        variants={itemVariants}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
        className="cyber-card"
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                padding: '2px 8px',
                borderRadius: '4px',
                background: isJunior ? 'rgba(56,161,105,0.12)' : 'rgba(37,99,235,0.12)',
                border: `1px solid ${isJunior ? 'rgba(56,161,105,0.35)' : 'rgba(37,99,235,0.35)'}`,
                color: isJunior ? '#15803d' : 'var(--accent)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {isJunior ? 'FIELD ANALYST WORKBENCH · CLEARANCE L2' : 'SUPERVISORY COMMAND CONSOLE · CLEARANCE L4'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Active Officer: <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong> ({user?.role})
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isJunior ? 'Field Operations & Tracing Center' : 'Strategic Forensics & Supervisory Command'}
          </h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
            {isJunior
              ? 'Personal assigned docket, multi-hop flow tracking, and evidence exhibit collection under supervisory review.'
              : 'Inter-agency oversight, case escalation sign-offs, judicial report certification, and audit trails.'}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/victim-trace')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 13px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '6px',
              color: 'var(--risk-critical)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={13} style={{ color: 'var(--risk-critical)' }} /> REAL-TIME VICTIM TRACE
          </button>
          {isJunior ? (
            <>
              <button
                onClick={() => navigate('/fund-flow')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <GitBranch size={13} style={{ color: '#38a169' }} /> Fund Flow Tracer
              </button>
              <button
                onClick={() => navigate('/transactions')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  background: '#38a169',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <ArrowLeftRight size={13} /> Explorer
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/audit-logs')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Shield size={13} style={{ color: 'var(--accent)' }} /> Audit Logs (Admin)
              </button>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 13px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={13} /> NEW INVESTIGATION
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ─── Flagship Fund Trace Callout Banner ─── */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        onClick={() => navigate('/victim-trace')}
        style={{
          background: 'linear-gradient(90deg, rgba(37,99,235,0.06) 0%, rgba(56,189,248,0.04) 100%)',
          border: '1px solid rgba(56,189,248,0.25)',
          borderRadius: '8px',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          flexWrap: 'wrap',
          gap: '12px',
        }}
        className="cyber-card cyber-card-interactive"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 360px', minWidth: '280px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(239,68,68,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={16} style={{ color: 'var(--risk-critical)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Real-Time Identification of Fraud-Linked Cryptocurrency Exchanges from Suspect Wallet Addresses
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'var(--accent)',
                color: '#fff',
                flexShrink: 0,
              }}>
                CORE ENGINE
              </span>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              Input suspect wallet address ➔ Automated multi-hop peeling ➔ Identify destination VASP/CEX ➔ Instant forensic report &amp; attribution
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '12px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span>OPEN INTAKE ENGINE</span>
          <ArrowRight size={14} />
        </div>
      </motion.div>


      {/* ─── Balanced 5-Card Operational KPI Strip ─── */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {(isJunior
          ? [
              {
                title: 'My Active Cases',
                value: visibleInvestigations.length,
                change: 1,
                icon: <LayoutDashboard size={18} />,
                variant: 'blue' as const,
                sparklineData: [2, 3, 3, 4, 4, 5, 5],
              },
              {
                title: 'Assigned Traced Volume',
                value: formatUSD(totalFunds),
                change: 14,
                icon: <DollarSign size={18} />,
                variant: 'safe' as const,
                sparklineData: [1, 1.2, 1.4, 1.3, 1.5, 1.5, 1.54],
              },
              {
                title: 'Active Target Alerts',
                value: alerts.filter((a) => !a.dismissed).length,
                change: 15,
                icon: <AlertTriangle size={18} />,
                variant: 'critical' as const,
                sparklineData: [2, 3, 5, 4, 7, 6, 8],
              },
              {
                title: 'Wallets Profiled',
                value: wallets.length,
                change: 8,
                icon: <Wallet size={18} />,
                variant: 'warning' as const,
                sparklineData: [8, 10, 12, 11, 14, 13, 15],
              },
              {
                title: 'Draft Exhibits',
                value: evidence.length,
                change: 4,
                icon: <FileCheck size={18} />,
                variant: 'safe' as const,
                sparklineData: [3, 4, 4, 5, 5, 6, 6],
              },
            ]
          : [
              {
                title: 'All Unit Cases',
                value: investigations.filter((i) => i.status !== 'CLOSED').length,
                change: 12,
                icon: <LayoutDashboard size={18} />,
                variant: 'blue' as const,
                sparklineData: [3, 4, 5, 4, 6, 5, 6],
              },
              {
                title: 'Total Unit Traced',
                value: formatUSD(teamTotalFunds),
                change: 8,
                icon: <DollarSign size={18} />,
                variant: 'safe' as const,
                sparklineData: [3, 3.5, 4, 3.8, 4.2, 4.1, 4.5],
              },
              {
                title: 'Critical Anomalies',
                value: alerts.filter((a) => a.severity === 'CRITICAL' && !a.dismissed).length,
                change: 25,
                icon: <AlertTriangle size={18} />,
                variant: 'critical' as const,
                sparklineData: [2, 3, 5, 4, 7, 6, 8],
              },
              {
                title: 'Threat Clusters',
                value: walletClusters.length,
                change: 10,
                icon: <Building2 size={18} />,
                variant: 'blue' as const,
                sparklineData: [2, 3, 3, 4, 4, 5, 6],
              },
              {
                title: 'Supervisory Approvals',
                value: 3,
                change: 0,
                icon: <Shield size={18} />,
                variant: 'warning' as const,
                sparklineData: [1, 2, 2, 3, 3, 3, 3],
              },
            ]
        ).map((kpi) => (
          <div key={kpi.title}>
            <KpiCard {...kpi} />
          </div>
        ))}
      </motion.div>

      {/* ─── Main Two-Column Console Workspace ─── */}
      <motion.div variants={itemVariants} className="dashboard-main-grid">
        {/* ─── LEFT COLUMN (Primary Casework & Topography - 65%) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Case Dossiers Table */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={15} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                    {isJunior ? 'Assigned Case Dossiers' : 'Unit Investigative Dossiers'}
                  </span>
                  <span
                    style={{
                      background: 'rgba(66,153,225,0.1)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(66,153,225,0.25)',
                      borderRadius: '12px',
                      padding: '1px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {displayedInvestigations.length} Cases
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {isJunior
                    ? 'Restricted to Priya Patel caseload · Other unit dossiers shielded under Level-2 protocol'
                    : 'Master register across all task force officers'}
                </div>
              </div>

              {/* Table Filter Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {!isJunior && (
                  <select
                    value={investigatorFilter}
                    onChange={(e) => setInvestigatorFilter(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      cursor: 'pointer',
                      marginRight: '4px',
                    }}
                    title="Supervisory Filter: Inspect specific officer's case docket"
                  >
                    <option value="ALL">All Officers (Unit-Wide Docket)</option>
                    <option value="priya">Priya Patel (Junior Analyst · L2)</option>
                    <option value="arjun">Arjun Sharma (Senior Lead · L4)</option>
                    <option value="rohan">Rohan Mehra (Forensic Specialist)</option>
                    <option value="neha">Neha Kapoor (Intel Analyst)</option>
                  </select>
                )}
                {(['ALL', 'HIGH_RISK', 'ACTIVE'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setTableFilter(filterKey)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: tableFilter === filterKey ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: tableFilter === filterKey ? 'rgba(66,153,225,0.15)' : 'var(--bg-elevated)',
                      color: tableFilter === filterKey ? 'var(--accent)' : 'var(--text-secondary)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {filterKey === 'ALL' ? 'All' : filterKey === 'HIGH_RISK' ? 'High Risk' : 'Active'}
                  </button>
                ))}
                <button
                  onClick={() => navigate('/investigations')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    fontSize: '11px',
                    fontWeight: 600,
                    marginLeft: '6px',
                  }}
                >
                  View All →
                </button>
              </div>
            </div>

            <div style={{ padding: '12px' }}>
              <DataTable
                columns={invColumns as Parameters<typeof DataTable>[0]['columns']}
                data={displayedInvestigations.slice(0, 6) as unknown as Record<string, unknown>[]}
                onRowClick={(row) => navigate(`/investigations/${(row as { id: string }).id}`)}
                pagination={false}
              />
            </div>
          </div>

          {/* Multi-Chain Fund Flow Topography (Transaction Graph) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Multi-Chain Fund Flow Topography
                </span>
                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Interactive heuristics &amp; cluster linkages
                </span>
              </div>
              <button
                onClick={() => navigate('/fund-flow')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--accent)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Full Graph Explorer <ArrowRight size={12} />
              </button>
            </div>
            <div style={{ padding: '14px' }}>
              <TransactionGraph compact height={350} />
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN (Operations, Supervisory Queue & Telemetry - 35%) ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Tile 1: Role-Specific Primary Action Center */}
          {!isJunior ? (
            /* Senior: Supervisory Sign-off Queue */
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--risk-critical)' }} className="pulse-dot" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Supervisory Review Queue
                  </span>
                </div>
                <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700, background: 'rgba(37,99,235,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                  LEVEL-4 SIGN-OFF
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Sign-off Item 1 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>CT-2024-0892</span>
                    <StatusBadge status={approvedItems['REV-01'] ? 'ESCALATED' : 'ANALYZING'} size="sm" />
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Romance Scam USDT — Submitted by Priya Patel (Junior Analyst) for task force ESCALATION.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>884,000 USDT</span>
                    {approvedItems['REV-01'] ? (
                      <span style={{ color: '#38a169', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={13} /> Approved
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSeniorApprove('REV-01', 'CT-2024-0892', 'Priority Escalation')}
                        style={{ padding: '4px 10px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Approve Escalation
                      </button>
                    )}
                  </div>
                </div>

                {/* Sign-off Item 2 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>EVD-4091</span>
                    <StatusBadge status={approvedItems['REV-02'] ? 'VERIFIED' : 'PENDING'} size="sm" />
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Mixer Hop Analysis Raw Output — Awaiting cryptographic lead signature for court exhibit.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>SHA-256 Digest Verified</span>
                    {approvedItems['REV-02'] ? (
                      <span style={{ color: '#38a169', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={13} /> Certified
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSeniorApprove('REV-02', 'EVD-4091', 'Cryptographic Certification')}
                        style={{ padding: '4px 10px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Certify Exhibit §79A
                      </button>
                    )}
                  </div>
                </div>

                {/* Sign-off Item 3 */}
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#d69e2e', fontFamily: 'JetBrains Mono, monospace' }}>SUBPOENA-REQ</span>
                    <StatusBadge status={approvedItems['REV-03'] ? 'VERIFIED' : 'PENDING'} size="sm" />
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    Binance KYC Records Request: Target deposit address identified on Ronin Bridge hack.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>VASP Legal Team</span>
                    {approvedItems['REV-03'] ? (
                      <span style={{ color: '#38a169', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={13} /> Subpoena Issued
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSeniorApprove('REV-03', 'Subpoena-Binance', 'VASP Notice')}
                        style={{ padding: '4px 10px', background: '#d69e2e', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Authorize Subpoena
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Junior: Target Address Profiler & Field Tasks */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Tracer Form */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Search size={15} style={{ color: '#38a169' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Target Address Profiler</span>
                </div>
                <form onSubmit={handleQuickTrace} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={quickTraceAddr}
                    onChange={(e) => setQuickTraceAddr(e.target.value)}
                    placeholder="Paste 0x..., bc1q..., or TRON address..."
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={quickTraceChain}
                      onChange={(e) => setQuickTraceChain(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        outline: 'none',
                      }}
                    >
                      <option value="ETH">ETH Mainnet</option>
                      <option value="BTC">Bitcoin</option>
                      <option value="TRON">TRON TRC-20</option>
                      <option value="POLYGON">Polygon</option>
                      <option value="BNB">BNB Chain</option>
                    </select>
                    <button
                      type="submit"
                      style={{
                        padding: '8px 14px',
                        background: '#38a169',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Trace Target →
                    </button>
                  </div>
                </form>
              </div>

              {/* Active Field Tasks */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Assigned Field Tasks</span>
                  <span style={{ fontSize: '10.5px', color: '#38a169', fontWeight: 700 }}>3 PENDING</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700 }}>TASK #1 · HOP TRACE</span>
                      <span style={{ fontSize: '10px', color: 'var(--risk-critical)', fontWeight: 700 }}>HIGH</span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                      Trace 3 hops downstream from <code>TQn9Y2...4Pr</code> on TRON.
                    </p>
                    <button
                      onClick={() => navigate('/fund-flow')}
                      style={{ padding: '4px 8px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open Tracer →
                    </button>
                  </div>

                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700 }}>TASK #2 · CASE DOSSIER</span>
                      <span style={{ fontSize: '10px', color: '#d69e2e', fontWeight: 700 }}>MED</span>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                      Log counterparty hashes for Case CT-2024-0892.
                    </p>
                    <button
                      onClick={() => navigate('/investigations/INV-002')}
                      style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Open Case →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tile 2: Team Roster (Senior) or Target Surveillance (Junior) */}
          {!isJunior ? (
            /* Senior: Task Force Operational Roster */
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={15} style={{ color: '#d69e2e' }} />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Task Force Unit Roster
                  </span>
                </div>
                <button
                  onClick={() => navigate('/investigations')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '11px', fontWeight: 600 }}
                >
                  Manage →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Arjun Sharma', role: 'Lead (You)', cases: '2 cases ($7.00M)', color: '#d69e2e', caseId: 'INV-001' },
                  { name: 'Priya Patel', role: 'Junior Analyst', cases: '2 cases ($1.54M)', color: '#38a169', caseId: 'INV-002' },
                  { name: 'Rahul Verma', role: 'Senior Analyst', cases: '1 case ($1.50M)', color: '#4299e1', caseId: 'INV-003' },
                  { name: 'Karan Mehta', role: 'Contract Specialist', cases: '1 case ($3.10M)', color: '#9f7aea', caseId: 'INV-006' },
                ].map((officer) => (
                  <div
                    key={officer.name}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: `${officer.color}20`,
                          border: `1px solid ${officer.color}`,
                          color: officer.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {officer.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{officer.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{officer.cases}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/investigations/${officer.caseId}`)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: 'var(--text-secondary)',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Dossier →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Junior: Monitored Nodes Under Surveillance */
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Target size={15} style={{ color: '#38a169' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Monitored Entities Under Watch
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Tornado Cash Relay #3', chain: 'ETH', risk: 99, address: '0x7A82...A91F2' },
                  { name: 'Huobi Hot Deposit Cluster', chain: 'TRON', risk: 78, address: 'TQn9Y2...Dx4Pr' },
                  { name: 'DefiYield Pool Exploit Sink', chain: 'ETH', risk: 92, address: '0x1A2B...3C4D' },
                ].map((item) => (
                  <div
                    key={item.address}
                    onClick={() => navigate(`/wallets/${item.address}`)}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{item.address} ({item.chain})</div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: getRiskColor(item.risk), fontFamily: 'JetBrains Mono, monospace' }}>
                      {item.risk}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tile 3: Live On-Chain Intelligence Stream */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38a169' }} className="pulse-dot" />
                <span style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)' }}>
                  {isJunior ? 'Network Anomaly Feed' : 'Live Intelligence Stream'}
                </span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '10.5px' }}>Auto-refreshing</span>
            </div>
            <div
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '340px',
                overflowY: 'auto',
              }}
              className="hide-scrollbar"
            >
              <AnimatePresence>
                {liveAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AlertCard alert={alert} compact />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
