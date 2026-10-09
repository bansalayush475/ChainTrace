import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  AlertTriangle,
  Wallet,
  ArrowLeftRight,
  GitBranch,
  Shield,
  ShieldAlert,
  Clock,
  FileText,
  StickyNote,
  BarChart3,
  Network,
  Building2,
  CheckCircle2,
  Plus,
  X,
  Send,
  Download,
} from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';
import RiskScoreGauge from '../components/ui/RiskScoreGauge';
import DataTable from '../components/ui/DataTable';
import TransactionGraph from '../components/graph/TransactionGraph';
import { walletClusters, exchangeAttributions } from '../data/mockData';
import { useStore } from '../store/useStore';
import { truncateAddress, getRiskColor, getDefaultRiskFactors, formatUSD } from '../utils/riskEngine';
import type { Transaction, Evidence } from '../data/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: <BarChart3 size={14} /> },
  { id: 'wallets', label: 'Wallets', icon: <Wallet size={14} /> },
  { id: 'transactions', label: 'Transactions', icon: <ArrowLeftRight size={14} /> },
  { id: 'fund-flow', label: 'Fund Flow', icon: <GitBranch size={14} /> },
  { id: 'clusters', label: 'Clusters', icon: <Network size={14} /> },
  { id: 'attribution', label: 'Attribution', icon: <Building2 size={14} /> },
  { id: 'evidence', label: 'Evidence', icon: <Shield size={14} /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote size={14} /> },
  { id: 'reports', label: 'Reports', icon: <FileText size={14} /> },
];

export default function InvestigationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    investigations,
    updateInvestigationStatus,
    updateInvestigation,
    saveInvestigationNotes,
    investigationNotes,
    evidence,
    wallets,
    transactions,
    timelineEvents,
    addTransaction,
    addEvidence,
    addTimelineEvent,
  } = useStore();

  const isSenior = user?.roleType === 'SENIOR' || user?.role === 'SUPER_ADMIN' || user?.role === 'INVESTIGATOR_LEAD';
  const isJunior = !isSenior;

  const [activeTab, setActiveTab] = useState('overview');
  const [notesSaved, setNotesSaved] = useState(false);
  const [notes, setNotes] = useState('');
  const [seniorDirectives, setSeniorDirectives] = useState('Priority 1: Trace all intermediary hop wallets to identify CEX off-ramps. Ensure SHA-256 evidence integrity is verified before filing subpoenas.');
  const [directiveSaved, setDirectiveSaved] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationSuccess, setEscalationSuccess] = useState(false);

  // Modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    hash: '',
    fromAddress: '',
    toAddress: '',
    amount: '10.5',
    token: 'USDT',
    type: 'TRANSFER' as Transaction['type'],
    riskScore: 75,
  });

  // New Evidence Form State
  const [evForm, setEvForm] = useState({
    type: 'TRANSACTION_RECORD' as Evidence['type'],
    description: '',
    source: 'On-Chain Node RPC',
    size: '142 KB',
    fileName: '',
  });

  const investigation = investigations.find((inv) => inv.id === id);

  useEffect(() => {
    if (id && investigationNotes[id] !== undefined) {
      setNotes(investigationNotes[id]);
    } else {
      setNotes('');
    }
  }, [id, investigationNotes]);

  useEffect(() => {
    if (investigation) {
      setTxForm((prev) => ({
        ...prev,
        fromAddress: investigation.suspectWallet,
        token: investigation.currency || 'USDT',
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      }));
    }
  }, [investigation]);

  if (!investigation) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', flexDirection: 'column', gap: '12px' }}>
        <AlertTriangle size={32} style={{ color: 'var(--text-secondary)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Investigation not found</p>
        <button onClick={() => navigate('/investigations')} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Investigations</button>
      </div>
    );
  }

  // JUNIOR: Can only view their specific assigned investigations
  // SENIOR: Can view all investigations across the entire team
  const isCaseAssignedToUser =
    !isJunior ||
    investigation.investigator.toLowerCase().includes('priya') ||
    (user?.name && investigation.investigator.toLowerCase() === user.name.toLowerCase());

  if (!isCaseAssignedToUser) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '440px', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(237,137,54,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={30} style={{ color: '#ed8936' }} />
        </div>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Access Restricted · Compartmentalized Team Case
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, maxWidth: '480px' }}>
            Case <strong>{investigation.caseId}</strong> is assigned to <strong>{investigation.investigator}</strong>. Under Level-2 confidentiality protocol, junior analysts can only view and work on investigations in their personal assigned queue.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/investigations')}
            style={{ padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Return to My Assigned Investigations
          </button>
        </div>
      </div>
    );
  }

  const isSeedBenchmarkCase = false;
  const targetLower = investigation.suspectWallet.toLowerCase();

  // Transactions specifically linked to this investigation
  const caseTransactions = isSeedBenchmarkCase
    ? transactions.filter((t) => (t as any).investigationId === investigation.id || transactions.slice(0, 8).includes(t))
    : transactions.filter(
        (t) =>
          (t as any).investigationId === investigation.id ||
          t.fromAddress.toLowerCase() === targetLower ||
          t.toAddress.toLowerCase() === targetLower
      );

  // Wallets specifically linked to this investigation
  const txConnectedAddresses = new Set<string>();
  txConnectedAddresses.add(targetLower);
  caseTransactions.forEach((t) => {
    txConnectedAddresses.add(t.fromAddress.toLowerCase());
    txConnectedAddresses.add(t.toAddress.toLowerCase());
  });

  const caseWallets = isSeedBenchmarkCase
    ? wallets.slice(0, 6)
    : Array.from(txConnectedAddresses).map((addr) => {
        const existing = wallets.find((w) => w.address.toLowerCase() === addr);
        if (existing) return existing;
        return {
          address: addr,
          blockchain: investigation.blockchain,
          label: addr === targetLower ? 'Case Suspect Target' : 'Counterparty',
          entityType: addr === targetLower ? 'SUSPECT' : ('INTERMEDIATE' as const),
          riskScore: addr === targetLower ? investigation.riskScore : 50,
          balance: 0,
          totalReceived: 0,
          totalSent: 0,
          txCount: 0,
          firstSeen: investigation.createdAt,
          lastActivity: investigation.updatedAt,
          counterparties: 0,
          flags: addr === targetLower ? ['CASE_SUSPECT_TARGET'] : [],
        };
      });

  // Evidence specifically linked to this investigation
  const caseEvidence = isSeedBenchmarkCase
    ? evidence.filter((e) => e.investigationId === investigation.id || evidence.slice(0, 3).includes(e))
    : evidence.filter((e) => e.investigationId === investigation.id);

  // Timeline specifically linked to this investigation
  const caseTimeline = isSeedBenchmarkCase
    ? timelineEvents.filter((t) => t.investigationId === investigation.id || timelineEvents.slice(0, 5).includes(t))
    : timelineEvents.filter(
        (t) =>
          t.investigationId === investigation.id ||
          (t.walletAddress && t.walletAddress.toLowerCase() === targetLower)
      );

  // Clusters linked to this investigation
  const caseClusters = isSeedBenchmarkCase
    ? walletClusters
    : walletClusters.filter((c) => (c as any).wallets?.some((w: string) => w.toLowerCase() === targetLower));

  // Attributions linked to this investigation
  const caseAttributions = isSeedBenchmarkCase
    ? exchangeAttributions
    : exchangeAttributions.filter((a) => (a as any).walletAddress?.toLowerCase() === targetLower);

  const riskFactors = getDefaultRiskFactors(investigation.riskScore);

  const keyFindings = isSeedBenchmarkCase
    ? [
        `Suspect wallet ${truncateAddress(investigation.suspectWallet)} identified with risk score ${investigation.riskScore}/100`,
        `$${(investigation.fundsTraced / 1000000).toFixed(2)}M ${investigation.currency} traced across ${investigation.blockchain} blockchain`,
        'Rapid multi-hop transfer pattern detected - 3 intermediate wallets identified',
        'Mixer service interaction confirmed with 94% confidence',
        'Exchange attribution: Binance deposit detected (PARTIAL KYC)',
      ]
    : [
        `Suspect target wallet ${truncateAddress(investigation.suspectWallet)} under forensic tracking on ${investigation.blockchain} network`,
        `Assessed baseline risk score: ${investigation.riskScore}/100 with ${investigation.priority} priority`,
        `$${investigation.fundsTraced.toLocaleString()} ${investigation.currency} tracked under active dossier`,
        `${caseTransactions.length} transaction(s) and ${caseWallets.length} target address(es) recorded`,
        `Status: ${investigation.status} · Lead Investigator: ${investigation.investigator}`,
      ];

  const walletColumns = [
    { key: 'address', label: 'Address', render: (v: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>{truncateAddress(String(v))}</span> },
    { key: 'entityType', label: 'Type', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'riskScore', label: 'Risk', render: (v: unknown) => <span style={{ color: getRiskColor(Number(v)), fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{String(v)}</span>, sortable: true },
    { key: 'balance', label: 'Balance', render: (v: unknown, row: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{((row as any).balance ?? 0).toFixed(4)}</span> },
    { key: 'txCount', label: 'Tx Count', sortable: true },
    { key: 'lastActivity', label: 'Last Active', render: (v: unknown) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>, sortable: true },
  ];

  const txColumns = [
    { key: 'hash', label: 'Tx Hash', render: (v: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>{truncateAddress(String(v))}</span> },
    { key: 'type', label: 'Type', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    { key: 'amount', label: 'Amount', render: (v: unknown, row: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{(row as { amount: number; token: string }).amount.toFixed(4)} {(row as { amount: number; token: string }).token}</span>, sortable: true },
    { key: 'usdValue', label: 'USD Value', render: (v: unknown) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>{formatUSD(Number(v))}</span>, sortable: true },
    { key: 'riskScore', label: 'Risk', render: (v: unknown) => <span style={{ color: getRiskColor(Number(v)), fontWeight: 700 }}>{String(v)}</span>, sortable: true },
    { key: 'timestamp', label: 'Time', render: (v: unknown) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>, sortable: true },
  ];

  function handleCreateTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!txForm.toAddress.trim()) return;

    const amt = parseFloat(txForm.amount) || 1;
    const usdVal = amt * (txForm.token === 'BTC' ? 62000 : txForm.token === 'ETH' ? 3200 : 1);

    addTransaction({
      hash: txForm.hash || `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      fromAddress: txForm.fromAddress.trim(),
      toAddress: txForm.toAddress.trim(),
      amount: amt,
      token: txForm.token,
      usdValue: usdVal,
      timestamp: new Date().toISOString(),
      blockNumber: 19420000 + Math.floor(Math.random() * 50000),
      confirmations: 16,
      fee: 0.002,
      type: txForm.type,
      riskScore: txForm.riskScore,
      flags: ['MANUAL_CASE_RECORD'],
      investigationId: investigation?.id,
    });

    setShowAddTxModal(false);
    setTxForm({
      hash: '',
      fromAddress: investigation ? investigation.suspectWallet : '',
      toAddress: '',
      amount: '10.5',
      token: investigation?.currency || 'USDT',
      type: 'TRANSFER',
      riskScore: 75,
    });
  }

  function handleCreateEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!evForm.description.trim()) return;

    const computedEvidenceHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    addEvidence({
      type: evForm.type,
      description: evForm.description.trim(),
      source: evForm.source.trim(),
      size: evForm.size.trim(),
      hash: computedEvidenceHash,
      investigationId: investigation ? investigation.id : '',
      integrity: 'VERIFIED',
    });

    setShowAddEvidenceModal(false);
    setEvForm({
      type: 'TRANSACTION_RECORD',
      description: '',
      source: 'On-Chain Node RPC',
      size: '142 KB',
      fileName: '',
    });
  }

  function handleRequestEscalation(e: React.FormEvent) {
    e.preventDefault();
    if (!investigation) return;
    addTimelineEvent({
      investigationId: investigation.id,
      eventType: 'ESCALATION',
      description: `[LEVEL-4 ESCALATION DISPATCH]: Junior Analyst Priya Patel submitted case for supervisory lead review: "${escalationReason || 'Risk indicators exceeded threshold, requesting senior subpoena & closure review.'}"`,
      timestamp: new Date().toISOString(),
      investigatorNote: 'Forwarded to Senior Lead Arjun Sharma for judicial authorization',
    });
    setEscalationSuccess(true);
    setTimeout(() => {
      setEscalationSuccess(false);
      setShowEscalateModal(false);
      setEscalationReason('');
    }, 1800);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button onClick={() => navigate('/investigations')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}>
          <ChevronLeft size={14} /> Investigations
        </button>
        <span style={{ color: 'var(--text-secondary)' }}>/</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-mono)' }}>{investigation.caseId}</span>
      </div>

      {/* Supervisory Notice Banner */}
      {isJunior ? (
        <motion.div variants={itemVariants} style={{ background: 'rgba(49,130,206,0.08)', border: '1px solid rgba(49,130,206,0.25)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} style={{ color: '#4299e1', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#4299e1' }}>Junior Workspace:</strong> Operating under supervisory clearance of Senior Lead Arjun Sharma. High-impact operations (Subpoena issuance, Final case closure, Judicial certification) require Level-4 authorization.
            </span>
          </div>
          <button
            onClick={() => setShowEscalateModal(true)}
            style={{ background: 'rgba(237,137,54,0.15)', border: '1px solid #ed8936', color: '#ed8936', borderRadius: '4px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
          >
            Submit for Lead Review →
          </button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} style={{ background: 'rgba(214,158,46,0.08)', border: '1px solid rgba(214,158,46,0.25)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} style={{ color: '#d69e2e', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#d69e2e' }}>Senior Oversight Active:</strong> You hold Level-4 Top Secret clearance. You can certify judicial exhibits, authorize exchange subpoenas, and execute final case dispositions.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => updateInvestigationStatus(investigation.id, 'ESCALATED')}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--risk-critical)', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚡ Fast-Track Escalate
            </button>
            <button
              onClick={() => navigate(`/reports?case=${investigation.id}`)}
              style={{ background: 'rgba(214,158,46,0.2)', border: '1px solid #d69e2e', color: '#d69e2e', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              ⚖️ Certify Evidence File
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-mono)', fontWeight: 600 }}>{investigation.caseId}</span>
              
              {/* Role Clearance Pill */}
              {isSenior ? (
                <span style={{ background: 'rgba(214,158,46,0.15)', border: '1px solid rgba(214,158,46,0.35)', color: '#d69e2e', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  🛡️ L4 LEAD REVIEW
                </span>
              ) : (
                <span style={{ background: 'rgba(56,161,105,0.15)', border: '1px solid rgba(56,161,105,0.35)', color: '#38a169', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  🔍 L2 FIELD ANALYST
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status:</span>
                <select
                  value={investigation.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as any;
                    if (isJunior && (newStatus === 'ESCALATED' || newStatus === 'CLOSED')) {
                      setShowEscalateModal(true);
                      return;
                    }
                    updateInvestigationStatus(investigation.id, newStatus);
                  }}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  <option value="NEW">NEW</option>
                  <option value="ANALYZING">ANALYZING</option>
                  <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
                  <option value="ESCALATED">
                    {isJunior ? 'ESCALATED (Req. Senior Approval)' : 'ESCALATED'}
                  </option>
                  <option value="CLOSED">
                    {isJunior ? 'CLOSED (Req. Senior Approval)' : 'CLOSED'}
                  </option>
                </select>
              </div>

              {isJunior && (
                <button
                  onClick={() => setShowEscalateModal(true)}
                  style={{
                    background: 'rgba(237,137,54,0.12)',
                    border: '1px solid #ed8936',
                    color: '#ed8936',
                    borderRadius: '4px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Request Escalation
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Priority:</span>
                <select
                  value={investigation.priority}
                  disabled={isJunior}
                  onChange={(e) => updateInvestigation(investigation.id, { priority: e.target.value as any })}
                  title={isJunior ? 'Priority classification is set by Senior Lead Investigator' : 'Change case priority'}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    fontSize: '11px',
                    padding: '3px 8px',
                    cursor: isJunior ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    opacity: isJunior ? 0.75 : 1,
                  }}
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>{investigation.title}</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '700px' }}>{investigation.description}</p>
            <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
              {investigation.tags.map((tag) => (
                <span key={tag} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>{tag}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minWidth: '260px' }}>
            {[
              ['Investigator', investigation.investigator],
              ['Blockchain', investigation.blockchain],
              ['Funds Traced', `$${investigation.fundsTraced.toLocaleString()} ${investigation.currency}`],
              ['Last Updated', new Date(investigation.updatedAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', borderBottom: '1px solid var(--border)' }} className="hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            {tab.icon} {tab.label}
            {tab.id === 'wallets' && ` (${caseWallets.length})`}
            {tab.id === 'transactions' && ` (${caseTransactions.length})`}
            {tab.id === 'evidence' && ` (${caseEvidence.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Risk Assessment</h3>
              <RiskScoreGauge score={investigation.riskScore} factors={riskFactors} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600 }}>Key Findings</h3>
              <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {keyFindings.map((finding) => (
                  <li key={finding} style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>{finding}</li>
                ))}
              </ul>
            </div>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600 }}>Suspect Wallet</h3>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(126,200,227,0.2)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mono)', fontSize: '13px', wordBreak: 'break-all' }}>{investigation.suspectWallet}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Chain: <strong style={{ color: 'var(--text-primary)' }}>{investigation.blockchain}</strong></span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Risk: <strong style={{ color: getRiskColor(investigation.riskScore) }}>{investigation.riskScore}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wallets' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Case Wallets ({caseWallets.length})</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Target suspect address and confirmed transaction counterparties attached to this investigation
              </p>
            </div>
          </div>
          <DataTable
            columns={walletColumns as Parameters<typeof DataTable>[0]['columns']}
            data={caseWallets as unknown as Record<string, unknown>[]}
            searchable
            pageSize={10}
          />
        </div>
      )}

      {activeTab === 'transactions' && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Case Transactions ({caseTransactions.length})</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Only transactions directly involving this case's target wallets are tracked
              </p>
            </div>
            <button
              onClick={() => setShowAddTxModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Add Transaction
            </button>
          </div>

          {caseTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <ArrowLeftRight size={36} style={{ color: 'var(--text-secondary)', marginBottom: '10px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '15px' }}>No Transactions Recorded In This Docket</h4>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                Freshly initiated investigative docket. No external on-chain transactions have been associated with this record yet. Ingest verified transaction hashes or connect validator RPC nodes to begin forensic mapping.
              </p>
              <button
                onClick={() => setShowAddTxModal(true)}
                style={{
                  padding: '9px 18px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Record Verified Transaction
              </button>
            </div>
          ) : (
            <DataTable
              columns={txColumns as Parameters<typeof DataTable>[0]['columns']}
              data={caseTransactions as unknown as Record<string, unknown>[]}
              searchable
              pageSize={10}
            />
          )}
        </div>
      )}

      {activeTab === 'fund-flow' && (
        <div>
          <TransactionGraph investigationId={investigation.id} height={600} />
        </div>
      )}

      {activeTab === 'clusters' && (
        <div>
          {caseClusters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Network size={40} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '16px' }}>No Algorithmic Clusters Detected</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                Wallet {truncateAddress(investigation.suspectWallet)} has not triggered multi-wallet co-spend or clustering heuristics. Cluster detection runs automatically when multiple transaction inputs share common ownership signatures.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {caseClusters.map((cluster) => (
                <div key={cluster.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mono)', fontSize: '12px' }}>{cluster.id}</span>
                    <span style={{ color: getRiskColor(cluster.riskScore), fontWeight: 700 }}>{cluster.riskScore}</span>
                  </div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-primary)' }}>{cluster.label}</h4>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>{cluster.detectionReason}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      ['Wallets', cluster.walletCount],
                      ['Volume', `$${(cluster.totalVolume / 1000000).toFixed(1)}M`],
                      ['Fraud Reports', cluster.fraudReports],
                      ['Exchange Exposure', `${cluster.exchangeExposure}%`],
                    ].map(([label, value]) => (
                      <div key={String(label)}>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'attribution' && (
        <div>
          {caseAttributions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <Building2 size={40} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)', fontSize: '16px' }}>No VASP Attributions Identified</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                No direct centralized exchange (CEX) deposit, off-ramp, or KYC-identified service provider has been confirmed for target wallet {truncateAddress(investigation.suspectWallet)}. Attribution scans update dynamically as exchange deposit addresses are uncovered.
              </p>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Entity', 'Type', 'Exposure', 'Confidence', 'KYC Level', 'Jurisdiction', 'Evidence'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {caseAttributions.map((attr) => (
                    <tr key={attr.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{attr.entity}</td>
                      <td style={{ padding: '12px' }}><StatusBadge status={attr.type} /></td>
                      <td style={{ padding: '12px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>${(attr.exposureAmount / 1000000).toFixed(2)}M</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px' }}>
                            <div style={{ height: '100%', width: `${attr.confidence}%`, background: getRiskColor(attr.confidence), borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', color: getRiskColor(attr.confidence) }}>{attr.confidence}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}><StatusBadge status={attr.kycLevel} /></td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>{attr.jurisdiction}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{attr.evidenceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Forensic Evidence Chain ({caseEvidence.length})</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>Cryptographically secured forensic exhibits attached to this case file</p>
            </div>
            <button
              onClick={() => setShowAddEvidenceModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Register Evidence
            </button>
          </div>

          {caseEvidence.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <Shield size={40} style={{ color: 'var(--text-secondary)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '15px' }}>No Evidence Exhibits Attached</h4>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                Secure on-chain proof, node logs, and wallet snapshots can be registered with immutable SHA-256 integrity digests.
              </p>
              <button
                onClick={() => setShowAddEvidenceModal(true)}
                style={{
                  padding: '9px 18px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} /> Register Case Evidence
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {caseEvidence.map((ev) => (
                <div key={ev.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mono)', fontSize: '12px', fontWeight: 600 }}>{ev.id}</span>
                    <StatusBadge status={ev.integrity} />
                  </div>
                  <div style={{ marginBottom: '8px' }}><StatusBadge status={ev.type} /></div>
                  <p style={{ margin: '8px 0', fontSize: '13px', color: 'var(--text-primary)' }}>{ev.description}</p>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: '8px', background: 'var(--bg-elevated)', padding: '6px 8px', borderRadius: '4px' }}>{ev.hash}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{ev.source} · {ev.size} · {new Date(ev.timestamp).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {caseTimeline.map((event, idx) => (
            <div key={event.id} style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '32px', flexShrink: 0 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-base)', marginTop: '14px', flexShrink: 0 }} />
                {idx < caseTimeline.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '4px' }} />}
              </div>
              <div style={{ flex: 1, paddingBottom: '24px' }}>
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>{event.timestamp.replace('T', ' ').slice(0, 19)} UTC</span>
                    <StatusBadge status={event.eventType} />
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>{event.description}</p>
                  {event.txHash && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)', marginTop: '6px' }}>{truncateAddress(event.txHash)}</div>}
                  {event.investigatorNote && <blockquote style={{ margin: '8px 0 0', padding: '8px 12px', borderLeft: '3px solid var(--accent)', background: 'rgba(66,153,225,0.05)', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{event.investigatorNote}</blockquote>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Senior Supervisory Directive Card */}
          {isSenior ? (
            <div style={{ background: 'rgba(214,158,46,0.06)', border: '1px solid rgba(214,158,46,0.25)', borderRadius: '8px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} style={{ color: '#d69e2e' }} />
                  <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#d69e2e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Lead Investigator Directives to Field Team
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Level-4 Top Secret</span>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Directives entered here guide junior analysts assigned to this case file (Priya Patel).
              </p>
              <textarea
                value={seniorDirectives}
                onChange={(e) => setSeniorDirectives(e.target.value)}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)', borderRadius: '6px',
                  color: 'var(--text-primary)', fontSize: '12px', outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5,
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => {
                    setDirectiveSaved(true);
                    setTimeout(() => setDirectiveSaved(false), 2500);
                  }}
                  style={{ padding: '6px 14px', background: '#d69e2e', border: 'none', borderRadius: '4px', color: '#1a202c', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Broadcast Directive
                </button>
                {directiveSaved && (
                  <span style={{ color: '#38a169', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Directive logged to case dossier
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(66,153,225,0.06)', border: '1px solid rgba(66,153,225,0.25)', borderRadius: '8px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Shield size={16} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>
                  Lead Directive from Arjun Sharma (Senior Lead)
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', background: 'var(--bg-elevated)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--accent)' }}>
                "{seniorDirectives}"
              </p>
            </div>
          )}

          {/* Standard Notes */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                {isSenior ? 'Comprehensive Case Notes & Dossier Annotations' : 'Analyst Field Observations Log'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isSenior ? 'Author: Arjun Sharma (Lead)' : 'Author: Priya Patel (Junior Analyst)'}
              </span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isJunior ? "Record technical leads, wallet observation timestamps, and tracing deductions..." : "Add strategic observations, multi-jurisdictional notes, or legal findings..."}
              rows={16}
              style={{
                width: '100%', padding: '12px', background: 'var(--bg-elevated)',
                border: '1px solid var(--border)', borderRadius: '6px',
                color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
                resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6,
                fontFamily: 'Inter, sans-serif',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <button
                onClick={() => {
                  saveInvestigationNotes(investigation.id, notes);
                  setNotesSaved(true);
                  setTimeout(() => setNotesSaved(false), 2500);
                }}
                style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save Notes
              </button>
              {notesSaved && (
                <span style={{ color: '#38a169', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={14} /> Notes saved to case file
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', padding: '48px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <FileText size={48} style={{ color: isSenior ? '#d69e2e' : 'var(--accent)' }} />
          
          {isSenior ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(214,158,46,0.15)', border: '1px solid #d69e2e', color: '#d69e2e', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  ⚖️ LEVEL-4 CERTIFIED DOSSIER
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Court Admissible Evidence Package</span>
              </div>
              <h3 style={{ margin: '4px 0 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                Generate Certified Judicial Evidence Report
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '480px', fontSize: '13px', lineHeight: 1.5 }}>
                As Lead Investigator, generating this report includes cryptographic HMAC signatures, full chain-of-custody proofs, and warrant attestation ready for law enforcement submission.
              </p>
              <button
                onClick={() => navigate(`/reports?case=${investigation.id}`)}
                style={{ padding: '12px 28px', background: '#d69e2e', border: 'none', borderRadius: '6px', color: '#1a202c', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Generate Certified Dossier →
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: 'rgba(237,137,54,0.15)', border: '1px solid #ed8936', color: '#ed8936', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  📝 LEVEL-2 FIELD DRAFT
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pending Senior Sign-Off</span>
              </div>
              <h3 style={{ margin: '4px 0 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                Generate Analyst Working Exhibit
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '480px', fontSize: '13px', lineHeight: 1.5 }}>
                Generates a field working draft with a prominent <strong style={{ color: '#ed8936' }}>DRAFT</strong> watermark. Final court certification must be authorized by Senior Lead Arjun Sharma.
              </p>
              <button
                onClick={() => navigate(`/reports?case=${investigation.id}`)}
                style={{ padding: '12px 28px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
              >
                Generate Field Draft →
              </button>
            </>
          )}
        </div>
      )}

      {/* Add Transaction Modal */}
      {showAddTxModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddTxModal(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '540px',
              maxWidth: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Record New Case Transaction</h3>
              <button
                onClick={() => setShowAddTxModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Transaction Hash</label>
                <input
                  type="text"
                  value={txForm.hash}
                  onChange={(e) => setTxForm({ ...txForm, hash: e.target.value })}
                  placeholder="0x..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>From Address</label>
                  <input
                    type="text"
                    value={txForm.fromAddress}
                    onChange={(e) => setTxForm({ ...txForm, fromAddress: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>To Address *</label>
                  <input
                    type="text"
                    value={txForm.toAddress}
                    onChange={(e) => setTxForm({ ...txForm, toAddress: e.target.value })}
                    placeholder="Recipient 0x..."
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Amount</label>
                  <input
                    type="number"
                    step="any"
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Token</label>
                  <input
                    type="text"
                    value={txForm.token}
                    onChange={(e) => setTxForm({ ...txForm, token: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Type</label>
                  <select
                    value={txForm.type}
                    onChange={(e) => setTxForm({ ...txForm, type: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="SWAP">SWAP</option>
                    <option value="BRIDGE">BRIDGE</option>
                    <option value="MIXER">MIXER</option>
                    <option value="EXCHANGE_DEPOSIT">EXCHANGE_DEPOSIT</option>
                    <option value="EXCHANGE_WITHDRAWAL">EXCHANGE_WITHDRAWAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Risk Score ({txForm.riskScore}/100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={txForm.riskScore}
                  onChange={(e) => setTxForm({ ...txForm, riskScore: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddTxModal(false)}
                  style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddEvidenceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddEvidenceModal(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '520px',
              maxWidth: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Register Evidence for {investigation.caseId}</h3>
              <button
                onClick={() => setShowAddEvidenceModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Evidence Category</label>
                <select
                  value={evForm.type}
                  onChange={(e) => setEvForm({ ...evForm, type: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="TRANSACTION_RECORD">TRANSACTION_RECORD</option>
                  <option value="WALLET_SNAPSHOT">WALLET_SNAPSHOT</option>
                  <option value="EXCHANGE_RECORD">EXCHANGE_RECORD</option>
                  <option value="CLUSTER_ANALYSIS">CLUSTER_ANALYSIS</option>
                  <option value="PATTERN_REPORT">PATTERN_REPORT</option>
                  <option value="BLOCKCHAIN_EXPORT">BLOCKCHAIN_EXPORT</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Description *</label>
                <textarea
                  value={evForm.description}
                  onChange={(e) => setEvForm({ ...evForm, description: e.target.value })}
                  placeholder="Describe the forensic exhibit or evidence snapshot..."
                  rows={3}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Source Node / Platform</label>
                  <input
                    type="text"
                    value={evForm.source}
                    onChange={(e) => setEvForm({ ...evForm, source: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Estimated File Size</label>
                  <input
                    type="text"
                    value={evForm.size}
                    onChange={(e) => setEvForm({ ...evForm, size: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Upload Document (Optional)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.zip,.csv,.txt"
                  onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                        setEvForm({ ...evForm, fileName: file.name });
                     }
                  }}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Supported formats: PDF, Images, CSV, ZIP, TXT. Hash will be generated automatically.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                >
                  Register Exhibit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Senior Escalation Modal */}
      {showEscalateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(5px)',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEscalateModal(false);
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              width: '520px',
              maxWidth: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: '#ed8936' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Request Senior Escalation & Review
                </h3>
              </div>
              <button
                onClick={() => setShowEscalateModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(237,137,54,0.1)', border: '1px solid rgba(237,137,54,0.3)', borderRadius: '6px', padding: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong style={{ color: '#ed8936' }}>Authorization Policy:</strong> Junior Forensic Analysts (Level-2) cannot unilaterally close or escalate case files to law enforcement agencies. This request will be queued in <strong>Senior Lead Arjun Sharma's</strong> Supervisory Command Center.
            </div>

            {escalationSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center', background: 'rgba(56,161,105,0.1)', borderRadius: '8px', border: '1px solid rgba(56,161,105,0.3)' }}>
                <CheckCircle2 size={36} style={{ color: '#38a169', marginBottom: '8px' }} />
                <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)', fontSize: '15px' }}>Escalation Request Dispatched</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Forwarded to Senior Lead Arjun Sharma. A case timeline event has been recorded.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestEscalation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Case Identifier</label>
                  <input
                    type="text"
                    disabled
                    value={`${investigation.caseId} — ${investigation.title}`}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Target Reviewer</label>
                  <input
                    type="text"
                    disabled
                    value="Arjun Sharma (Senior Lead Investigator · Level-4)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: '#d69e2e',
                      fontSize: '12px',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Escalation Rationale / Requested Action *</label>
                  <textarea
                    value={escalationReason}
                    onChange={(e) => setEscalationReason(e.target.value)}
                    placeholder="E.g., High mixer volume detected ($1.8M), counterparty CEX identified. Requesting subpoena freeze order..."
                    rows={4}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(false)}
                    style={{ padding: '8px 16px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', background: '#ed8936', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Dispatch to Senior Lead
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
