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
  FolderOpen,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '../components/ui/KpiCard';
import AlertCard from '../components/ui/AlertCard';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import TransactionGraph from '../components/graph/TransactionGraph';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';
import { useStore } from '../store/useStore';
import { getRiskColor, formatUSD, truncateAddress } from '../utils/riskEngine';

const containerVariants: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    investigations,
    currentInvestigationId,
    setCurrentInvestigation,
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
  const myNameLower = (user?.name || '').toLowerCase();
  const myEmailLower = (user?.email || '').toLowerCase();

  // Supervisory officer filter state (for Senior Lead view)
  const [investigatorFilter, setInvestigatorFilter] = useState<string>('ALL');

  // In Junior mode, strictly isolate to their specific investigations
  // In Senior mode, show everyone's work across the entire unit, with optional filter
  const visibleInvestigations = isJunior
    ? investigations.filter((inv) => {
        const invName = (inv.investigator || '').toLowerCase();
        return (myNameLower && invName.includes(myNameLower)) || (myEmailLower && invName.includes(myEmailLower));
      })
    : investigatorFilter === 'ALL'
    ? investigations
    : investigations.filter((inv) => (inv.investigator || '').toLowerCase().includes(investigatorFilter.toLowerCase()));

  const availableTopographyCases = visibleInvestigations.length > 0 ? visibleInvestigations : investigations;
  const activeTopographyCase = availableTopographyCases.find((i) => i.id === currentInvestigationId) || null;

  const [liveAlerts, setLiveAlerts] = useState(alerts.slice(0, 5));
  const [showModal, setShowModal] = useState(false);

  // Table filter state
  const [tableFilter, setTableFilter] = useState<'ALL' | 'HIGH_RISK' | 'ACTIVE'>('ALL');

  // Junior Quick Tracer state
  const [quickTraceAddr, setQuickTraceAddr] = useState('');
  const [quickTraceChain, setQuickTraceChain] = useState('ETH');

  // Senior approval state
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});

  const totalFunds = visibleInvestigations.reduce((sum, inv) => sum + (inv.fundsTraced || 0), 0);
  const teamTotalFunds = investigations.reduce((sum, inv) => sum + (inv.fundsTraced || 0), 0);

  useEffect(() => {
    setLiveAlerts(alerts.slice(0, 5));
  }, [alerts]);

  function handleSeniorApprove(id: string, invId: string, title: string, actionType: string) {
    setApprovedItems((prev) => ({ ...prev, [id]: true }));
    if (invId) {
      updateInvestigationStatus(invId, 'ESCALATED');
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

  const unitOfficers = React.useMemo(() => {
    const list: { name: string; role: string; cases: string; color: string; caseId?: string }[] = [];
    const seen = new Set<string>();

    if (user?.name) {
      seen.add(user.name.toLowerCase());
      const myCases = investigations.filter((i) => (i.investigator || '').toLowerCase() === user.name.toLowerCase());
      const myFunds = myCases.reduce((s, c) => s + (c.fundsTraced || 0), 0);
      list.push({
        name: user.name,
        role: `${user.role || 'Supervisory Lead'} (You)`,
        cases: `${myCases.length} case${myCases.length !== 1 ? 's' : ''} (${formatUSD(myFunds)})`,
        color: '#d69e2e',
        caseId: myCases[0]?.id,
      });
    }

    investigations.forEach((inv) => {
      const invName = inv.investigator;
      if (invName && !seen.has(invName.toLowerCase())) {
        seen.add(invName.toLowerCase());
        const officerCases = investigations.filter((i) => (i.investigator || '').toLowerCase() === invName.toLowerCase());
        const funds = officerCases.reduce((s, c) => s + (c.fundsTraced || 0), 0);
        list.push({
          name: invName,
          role: 'Investigator',
          cases: `${officerCases.length} case${officerCases.length !== 1 ? 's' : ''} (${formatUSD(funds)})`,
          color: '#4299e1',
          caseId: officerCases[0]?.id,
        });
      }
    });

    return list;
  }, [investigations, user]);

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
        const isSelf = Boolean(myNameLower && name.toLowerCase().includes(myNameLower));
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
                icon: <LayoutDashboard size={18} />,
                variant: 'blue' as const,
                subtitle: `${visibleInvestigations.filter(i => i.status === 'UNDER_INVESTIGATION' || i.status === 'ANALYZING').length} active, ${visibleInvestigations.filter(i => i.status === 'CLOSED').length} closed`,
              },
              {
                title: 'Assigned Traced Volume',
                value: formatUSD(totalFunds),
                icon: <DollarSign size={18} />,
                variant: 'safe' as const,
                subtitle: `${visibleInvestigations.length} case docket(s)`,
              },
              {
                title: 'Active Target Alerts',
                value: alerts.filter((a) => !a.dismissed).length,
                icon: <AlertTriangle size={18} />,
                variant: 'critical' as const,
                subtitle: `${alerts.filter(a => a.severity === 'CRITICAL').length} critical threats`,
              },
              {
                title: 'Wallets Profiled',
                value: wallets.length,
                icon: <Wallet size={18} />,
                variant: 'warning' as const,
                subtitle: 'On-chain forensic targets',
              },
              {
                title: 'Draft Exhibits',
                value: evidence.length,
                icon: <FileCheck size={18} />,
                variant: 'safe' as const,
                subtitle: 'Section 79A IT Act vault',
              },
            ]
          : [
              {
                title: 'All Unit Cases',
                value: investigations.filter((i) => i.status !== 'CLOSED').length,
                icon: <LayoutDashboard size={18} />,
                variant: 'blue' as const,
                subtitle: `${investigations.length} total register`,
              },
              {
                title: 'Total Unit Traced',
                value: formatUSD(teamTotalFunds),
                icon: <DollarSign size={18} />,
                variant: 'safe' as const,
                subtitle: 'Cumulative cross-chain',
              },
              {
                title: 'Critical Anomalies',
                value: alerts.filter((a) => a.severity === 'CRITICAL' && !a.dismissed).length,
                icon: <AlertTriangle size={18} />,
                variant: 'critical' as const,
                subtitle: 'Active AML / mixer alerts',
              },
              {
                title: 'Monitored Wallets',
                value: wallets.length,
                icon: <Building2 size={18} />,
                variant: 'blue' as const,
                subtitle: 'Surveillance register',
              },
              {
                title: 'Supervisory Review',
                value: investigations.filter((i) => i.status === 'ANALYZING' || i.status === 'ESCALATED' || i.status === 'NEW').length,
                icon: <Shield size={18} />,
                variant: 'warning' as const,
                subtitle: 'Pending docket actions',
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
                    ? `Restricted to ${user?.name || 'Assigned Officer'} caseload · Other unit dossiers shielded under Level-2 protocol`
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
                    {Array.from(new Set(investigations.map((i) => i.investigator).filter(Boolean))).map((officer) => (
                      <option key={officer} value={officer}>{officer}</option>
                    ))}
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

            {displayedInvestigations.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(66, 153, 225, 0.1)',
                    border: '1px solid rgba(66, 153, 225, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                  }}
                >
                  <FolderOpen size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No Active Case Dossiers Registered
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                    The investigative ledger is currently unpopulated. Initiate a formal cyber fraud investigation or intake complaints from the NCRP 1930 portal.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    onClick={() => setShowModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Open New Investigation
                  </button>
                  <button
                    onClick={() => navigate('/bulk-triage')}
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
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Layers size={14} /> Intake 1930 Complaints
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '12px' }}>
                <DataTable
                  columns={invColumns as Parameters<typeof DataTable>[0]['columns']}
                  data={displayedInvestigations.slice(0, 6) as unknown as Record<string, unknown>[]}
                  onRowClick={(row) => navigate(`/investigations/${(row as { id: string }).id}`)}
                  pagination={false}
                />
              </div>
            )}
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
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  Multi-Chain Fund Flow Topography
                </span>
                {activeTopographyCase && (
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '4px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    Active Docket: {activeTopographyCase.caseId}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {availableTopographyCases.length > 0 && (
                  <select
                    value={activeTopographyCase?.id || ''}
                    onChange={(e) => setCurrentInvestigation(e.target.value || null)}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '5px',
                      color: 'var(--text-primary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                  >
                    <option value="">-- Choose Case Docket --</option>
                    {availableTopographyCases.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.caseId}: {inv.title.slice(0, 32)} ({inv.blockchain})
                      </option>
                    ))}
                  </select>
                )}

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
            </div>

            <div style={{ padding: '14px' }}>
              {activeTopographyCase ? (
                <TransactionGraph compact height={350} investigationId={activeTopographyCase.id} />
              ) : (
                <div
                  style={{
                    height: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: 'rgba(15, 23, 42, 0.3)',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(56, 189, 248, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                    }}
                  >
                    <GitBranch size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Select an Active Case Docket to View Topography
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                      To prevent displaying mixed multi-graph linkages across unrelated investigations, choose a specific case docket from the selector above or launch a new investigation.
                    </div>
                  </div>
                  {availableTopographyCases.length > 0 ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) setCurrentInvestigation(e.target.value);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--accent)',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="" disabled>-- Click Here to Select Case Docket --</option>
                        {availableTopographyCases.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.caseId}: {inv.title.slice(0, 35)} ({inv.blockchain})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowModal(true)}
                      style={{
                        padding: '7px 16px',
                        background: 'var(--accent)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + Start New Investigation
                    </button>
                  )}
                </div>
              )}
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
                {visibleInvestigations.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <CheckCircle2 size={28} style={{ color: '#10b981', margin: '0 auto 8px', display: 'block', opacity: 0.8 }} />
                    <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>Supervisory Queue Cleared</span>
                    No pending case dossiers or exhibits awaiting level-4 supervisory review.
                  </div>
                ) : (
                  <>
                    {/* Sign-off Item 1 */}
                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {visibleInvestigations[0]?.caseId}
                        </span>
                        <StatusBadge status={approvedItems[`REV-${visibleInvestigations[0]?.id}`] ? 'ESCALATED' : (visibleInvestigations[0]?.status || 'ANALYZING')} size="sm" />
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '11.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {visibleInvestigations[0]?.title} — Submitted for task force review.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                          ₹{formatUSD(visibleInvestigations[0]?.fundsTraced || 0)}
                        </span>
                        {approvedItems[`REV-${visibleInvestigations[0]?.id}`] ? (
                          <span style={{ color: '#38a169', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={13} /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSeniorApprove(`REV-${visibleInvestigations[0]?.id}`, visibleInvestigations[0]?.id, visibleInvestigations[0]?.title, 'Priority Escalation')}
                            style={{ padding: '4px 10px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                          >
                            Approve Escalation
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
                  <span style={{ fontSize: '10.5px', color: visibleInvestigations.length > 0 ? '#38a169' : 'var(--text-secondary)', fontWeight: 700 }}>
                    {visibleInvestigations.length > 0 ? `${visibleInvestigations.length} ACTIVE` : '0 PENDING'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visibleInvestigations.length === 0 ? (
                    <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      <CheckCircle2 size={24} style={{ color: '#10b981', margin: '0 auto 6px', display: 'block', opacity: 0.8 }} />
                      <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>No Assigned Field Tasks</span>
                      All case tasks complete. Intake new complaints or open investigations to assign tasks.
                    </div>
                  ) : (
                    visibleInvestigations.slice(0, 2).map((inv, idx) => (
                      <div key={inv.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 700 }}>TASK #{idx + 1} · {inv.blockchain} TRACE</span>
                          <span style={{ fontSize: '10px', color: inv.priority === 'CRITICAL' ? 'var(--risk-critical)' : '#d69e2e', fontWeight: 700 }}>{inv.priority}</span>
                        </div>
                        <p style={{ margin: '0 0 6px', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                          Trace hops downstream from <code>{truncateAddress(inv.suspectWallet, 6)}</code> on {inv.blockchain}.
                        </p>
                        <button
                          onClick={() => navigate(`/investigations/${inv.id}`)}
                          style={{ padding: '4px 8px', background: 'var(--accent)', border: 'none', borderRadius: '4px', color: '#fff', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Open Case →
                        </button>
                      </div>
                    ))
                  )}
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
                {unitOfficers.length === 0 ? (
                  <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <Users size={24} style={{ color: '#d69e2e', margin: '0 auto 6px', display: 'block', opacity: 0.8 }} />
                    <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>No Unit Officers</span>
                    New officers will appear here once authenticated.
                  </div>
                ) : (
                  unitOfficers.map((officer) => (
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
                          {officer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{officer.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{officer.cases}</div>
                        </div>
                      </div>
                      {officer.caseId && (
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
                      )}
                    </div>
                  ))
                )}
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
                {wallets.length === 0 ? (
                  <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                    <Target size={24} style={{ color: '#10b981', margin: '0 auto 6px', display: 'block', opacity: 0.8 }} />
                    <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>No Monitored Entities</span>
                    Target wallets added during investigation or triage will appear here.
                  </div>
                ) : (
                  wallets.slice(0, 4).map((item) => (
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
                        <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label || truncateAddress(item.address, 6)}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{truncateAddress(item.address, 6)} ({item.blockchain})</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: getRiskColor(item.riskScore), fontFamily: 'JetBrains Mono, monospace' }}>
                        {item.riskScore}
                      </span>
                    </div>
                  ))
                )}
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
              {liveAlerts.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                  <CheckCircle2 size={24} style={{ color: '#10b981', margin: '0 auto 6px', display: 'block', opacity: 0.8 }} />
                  <span style={{ fontWeight: 600, display: 'block', color: 'var(--text-primary)', marginBottom: '3px' }}>Network Nominal</span>
                  No real-time anomalies or AML triggers detected across watched networks.
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
