import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, Shield, User, Briefcase, Eye, Database, Download, CheckCircle2, Trash2, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';
import { useStore } from '../store/useStore';
import { truncateAddress, getRiskColor } from '../utils/riskEngine';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export default function InvestigationsPage() {
  const navigate = useNavigate();
  const {
    investigations,
    user,
    evidence,
    wallets,
    auditLogs,
    exportDatabaseBackup,
    clearAllDatabaseData,
    restoreSampleDemoData,
  } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const isSenior = user?.roleType === 'SENIOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'INVESTIGATOR_LEAD';
  const isJunior = !isSenior;

  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [teamMemberFilter, setTeamMemberFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // JUNIOR: Strictly isolated to Priya Patel's own assigned investigations
  // SENIOR: Sees the entire team's work across all investigators
  const myNameLower = (user?.name || 'priya').toLowerCase();
  const baseInvestigations = isJunior
    ? investigations.filter(
        (inv) =>
          inv.investigator.toLowerCase().includes('priya') ||
          inv.investigator.toLowerCase() === myNameLower
      )
    : investigations;

  const filtered = baseInvestigations.filter((inv) => {
    if (isSenior && teamMemberFilter !== 'ALL' && !inv.investigator.toLowerCase().includes(teamMemberFilter.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
    if (blockchainFilter !== 'ALL' && inv.blockchain !== blockchainFilter) return false;
    if (priorityFilter !== 'ALL' && inv.priority !== priorityFilter) return false;
    if (search && !inv.title.toLowerCase().includes(search.toLowerCase()) && !inv.caseId.toLowerCase().includes(search.toLowerCase()) && !inv.suspectWallet.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Team roster & what each team member is doing (for Senior Lead oversight)
  const TEAM_ROSTER = [
    {
      name: 'Arjun Sharma',
      role: 'Lead Crypto Forensic Analyst',
      badge: 'LEAD · L4',
      badgeColor: '#d69e2e',
      currentTask: investigations.filter((i) => i.investigator.toLowerCase().includes('arjun')).length > 0
        ? 'Supervising high-profile exchange theft and DeFi laundering flows'
        : 'Standby · Ready for casework allocation',
      activeCases: investigations.filter((i) => i.investigator.toLowerCase().includes('arjun')),
      specialty: 'CEX Subpoenas & Mixer Unpeeling',
    },
    {
      name: 'Priya Patel',
      role: 'Junior Forensic Analyst',
      badge: 'JUNIOR · L2',
      badgeColor: '#38a169',
      currentTask: investigations.filter((i) => i.investigator.toLowerCase().includes('priya')).length > 0
        ? 'Tracing TRON USDT romance scam counterparties & bridge flows'
        : 'Standby · Ready for casework allocation',
      activeCases: investigations.filter((i) => i.investigator.toLowerCase().includes('priya')),
      specialty: 'Field Tracing & Counterparty Profiling',
    },
    {
      name: 'Rahul Verma',
      role: 'Senior Intelligence Analyst',
      badge: 'ANALYST · L3',
      badgeColor: '#4299e1',
      currentTask: investigations.filter((i) => i.investigator.toLowerCase().includes('rahul')).length > 0
        ? 'Tracing ransomware peel chains across UTXO network'
        : 'Standby · Ready for casework allocation',
      activeCases: investigations.filter((i) => i.investigator.toLowerCase().includes('rahul')),
      specialty: 'BTC Peel Chains & Ransomware Clusters',
    },
    {
      name: 'Karan Mehta',
      role: 'Smart Contract Forensic Specialist',
      badge: 'SPECIALIST · L3',
      badgeColor: '#9f7aea',
      currentTask: investigations.filter((i) => i.investigator.toLowerCase().includes('karan')).length > 0
        ? 'Decompiling cross-chain bridge duplicate validation exploits'
        : 'Standby · Ready for casework allocation',
      activeCases: investigations.filter((i) => i.investigator.toLowerCase().includes('karan')),
      specialty: 'BNB / EVM Bridge Exploits',
    },
  ];

  const columns = [
    { key: 'caseId', label: 'Case ID', render: (v: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mono)', fontSize: '12px' }}>{String(v)}</span>, sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    {
      key: 'suspectWallet',
      label: 'Suspect Wallet',
      render: (v: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>{truncateAddress(String(v), 8)}</span>,
    },
    {
      key: 'blockchain',
      label: 'Chain',
      render: (v: unknown) => (
        <span style={{ background: 'rgba(66,153,225,0.1)', color: 'var(--accent)', border: '1px solid rgba(66,153,225,0.2)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 600 }}>
          {String(v)}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      render: (v: unknown) => (
        <span style={{ color: getRiskColor(Number(v)), fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: '14px' }}>{String(v)}</span>
      ),
      sortable: true,
    },
    {
      key: 'fundsTraced',
      label: 'Funds Traced',
      render: (v: unknown, row: unknown) => {
        const r = row as { fundsTraced: number; currency: string };
        return <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>${r.fundsTraced.toLocaleString()} {r.currency}</span>;
      },
      sortable: true,
    },
    {
      key: 'investigator',
      label: 'Assigned Investigator',
      render: (v: unknown) => {
        const name = String(v);
        const isSelf = name.toLowerCase().includes('priya') && isJunior;
        const isLead = name.toLowerCase().includes('arjun');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isLead ? '#d69e2e' : name.toLowerCase().includes('priya') ? '#38a169' : '#4299e1',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: isSelf ? 700 : 500, color: isSelf ? '#38a169' : 'var(--text-primary)' }}>
              {name} {isSelf && '(You)'}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    { key: 'status', label: 'Status', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'priority', label: 'Priority', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    {
      key: 'updatedAt',
      label: 'Last Updated',
      render: (v: unknown) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{new Date(String(v)).toLocaleDateString()}</span>,
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

      {/* Header */}
      <motion.div
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {isJunior ? 'My Assigned Investigations' : 'Team Investigations & Master Roster'}
          </h1>
          <span style={{ background: 'rgba(66,153,225,0.15)', color: 'var(--accent)', border: '1px solid rgba(66,153,225,0.3)', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: 'var(--accent)' }} />
            {filtered.length} {filtered.length === 1 ? 'Case' : 'Cases'}
          </span>
          {isSenior ? (
            <span style={{ background: 'rgba(214,158,46,0.12)', color: '#d69e2e', border: '1px solid rgba(214,158,46,0.35)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} /> LEVEL-4 COMMAND · ALL TEAM MEMBERS VISIBLE
            </span>
          ) : (
            <span style={{ background: 'rgba(56,161,105,0.12)', color: '#38a169', border: '1px solid rgba(56,161,105,0.35)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={13} /> LEVEL-2 COMPARTMENTALIZED · PRIYA PATEL ONLY
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '7px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            letterSpacing: '0.02em',
          }}
        >
          <Plus size={15} /> NEW INVESTIGATION
        </motion.button>
      </motion.div>



      {/* JUNIOR BANNER: Clear notice that only their specific cases are visible */}
      {isJunior && (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            background: 'linear-gradient(135deg, rgba(56,161,105,0.1) 0%, rgba(56,161,105,0.03) 100%)',
            border: '1px solid rgba(56,161,105,0.3)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(56,161,105,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Shield size={20} style={{ color: '#38a169' }} />
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <strong style={{ color: '#38a169' }}>Personal Case Queue (Priya Patel):</strong> Under Level-2 confidentiality protocols, your view is strictly limited to investigations assigned directly to you. Dossiers belonging to Senior Lead Arjun Sharma and other specialists are restricted.
          </div>
        </motion.div>
      )}

      {/* SENIOR WORKFORCE OVERVIEW: Task Force Member Allocation & Active Dockets */}
      {isSenior && (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '18px 22px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(214,158,46,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={16} style={{ color: '#d69e2e' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Federal Task Force Deployment &amp; Casework Allocation
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {teamMemberFilter !== 'ALL' && (
                <button
                  onClick={() => setTeamMemberFilter('ALL')}
                  style={{
                    background: 'rgba(214,158,46,0.15)',
                    border: '1px solid #d69e2e',
                    color: '#d69e2e',
                    borderRadius: '5px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ✕ Clear Filter (Show Everyone)
                </button>
              )}
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Click any investigator to isolate their assigned docket</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {TEAM_ROSTER.map((member) => {
              const isSelected = teamMemberFilter.toLowerCase() === member.name.toLowerCase().split(' ')[0];
              const totalFunds = member.activeCases.reduce((sum, c) => sum + (c.fundsTraced || 0), 0);

              return (
                <motion.div
                  key={member.name}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  onClick={() => {
                    const firstName = member.name.split(' ')[0];
                    setTeamMemberFilter(isSelected ? 'ALL' : firstName);
                  }}
                  className="cyber-card-interactive"
                  style={{
                    background: isSelected ? 'rgba(214,158,46,0.1)' : 'var(--bg-elevated)',
                    border: `1px solid ${isSelected ? '#d69e2e' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 14px rgba(214,158,46,0.2)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: `${member.badgeColor}20`,
                          border: `1.5px solid ${member.badgeColor}`,
                          color: member.badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          boxShadow: `0 0 8px ${member.badgeColor}33`,
                        }}
                      >
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>{member.name}</div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>{member.role}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        background: `${member.badgeColor}15`,
                        color: member.badgeColor,
                        border: `1px solid ${member.badgeColor}40`,
                        borderRadius: '4px',
                        padding: '2px 7px',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {member.badge}
                    </span>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '9px 12px', borderRadius: '6px', marginBottom: '10px', fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4, border: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>Active Work:</strong> {member.currentTask}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    <span>
                      <strong style={{ color: 'var(--text-primary)' }}>{member.activeCases.length}</strong> active {member.activeCases.length === 1 ? 'case' : 'cases'}
                    </span>
                    <span>
                      Traced: <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>${(totalFunds / 1000000).toFixed(2)}M</strong>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '14px 18px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px' }}
      >
        <div style={{ position: 'relative', flex: '0 1 320px', minWidth: '200px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isJunior ? 'Search your assigned cases...' : 'Search all team cases...'}
            style={{ width: '100%', paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* SENIOR ONLY: Filter by specific team member */}
        {isSenior && (
          <select
            value={teamMemberFilter}
            onChange={(e) => setTeamMemberFilter(e.target.value)}
            style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            <option value="ALL">👥 All Team Investigators ({investigations.length} Cases)</option>
            <option value="Arjun">🛡️ Arjun Sharma — Lead ({investigations.filter((i) => i.investigator.toLowerCase().includes('arjun')).length} Cases)</option>
            <option value="Priya">🔍 Priya Patel — Junior Analyst ({investigations.filter((i) => i.investigator.toLowerCase().includes('priya')).length} Cases)</option>
            <option value="Rahul">📊 Rahul Verma — Senior Analyst ({investigations.filter((i) => i.investigator.toLowerCase().includes('rahul')).length} Cases)</option>
            <option value="Karan">⚡ Karan Mehta — Bridge Specialist ({investigations.filter((i) => i.investigator.toLowerCase().includes('karan')).length} Cases)</option>
          </select>
        )}

        {[
          { label: 'Status', value: statusFilter, setter: setStatusFilter, options: ['ALL', 'NEW', 'ANALYZING', 'UNDER_INVESTIGATION', 'ESCALATED', 'CLOSED'] },
          { label: 'Blockchain', value: blockchainFilter, setter: setBlockchainFilter, options: ['ALL', 'ETH', 'BTC', 'TRON', 'POLYGON', 'BNB'] },
          { label: 'Priority', value: priorityFilter, setter: setPriorityFilter, options: ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
        ].map(({ label, value, setter, options }) => (
          <select
            key={label}
            value={value}
            onChange={(e) => setter(e.target.value)}
            style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            {options.map((o) => <option key={o} value={o}>{o === 'ALL' ? `All ${label}` : o}</option>)}
          </select>
        ))}
      </motion.div>

      {/* Table or Clean State */}
      {investigations.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border)',
            borderRadius: '10px',
            padding: '52px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(66,153,225,0.1)',
              border: '1px solid rgba(66,153,225,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Database size={26} />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Forensic Database is Empty (0 Records)
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: 1.6 }}>
            All evaluation records have been deleted from the sovereign IndexedDB database. You have a completely clean slate ready for real-time cybercrime complaint intake.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <Plus size={15} /> START NEW INVESTIGATION
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}
        >
          <div style={{ padding: '14px' }}>
            <DataTable
              columns={columns as Parameters<typeof DataTable>[0]['columns']}
              data={filtered as unknown as Record<string, unknown>[]}
              onRowClick={(row) => navigate(`/investigations/${(row as { id: string }).id}`)}
              pageSize={10}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

