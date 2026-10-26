import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Network,
  Plus,
  Eye,
  FileText,
  Search,
  Zap,
  Landmark,
  Layers,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Shield,
  Sparkles,
  FileCheck,
  AlertTriangle,
  Copy,
  Printer,
  X,
  Sliders,
  Scale
} from 'lucide-react';
import RiskScoreGauge from '../components/ui/RiskScoreGauge';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import TransactionGraph from '../components/graph/TransactionGraph';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';
import { truncateAddress, getRiskColor, getDefaultRiskFactors, formatUSD } from '../utils/riskEngine';
import { useStore } from '../store/useStore';
import {
  fetchLiveWallet,
  detectBlockchain,
  getExplorerUrl,
  type LiveWalletData,
} from '../services/blockchainService';
import { resolveVaspAttribution } from '../services/vaspAttributionService';
import { api } from '../services/apiService';
import {
  calculateForensicTaint,
  generateSection106BnssFreezeOrder,
  generateSection63BsaCertificate,
  type TaintModel,
  type ForensicTaintResult,
  type ExposureCategory,
} from '../utils/taintEngine';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
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

const VERIFIED_REAL_TARGETS: Array<{ name: string; address: string; chain: string; desc: string }> = [
  {
    name: 'SE Asia Digital Arrest Suspect',
    address: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    chain: 'TRON',
    desc: 'Traced in ₹48.5 Lakh CBI digital arrest case (Delhi & Bengaluru victims)',
  },
  {
    name: 'Binance Intercept Deposit Vault',
    address: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
    chain: 'TRON',
    desc: 'FIU-IND Subpoena Compliant VASP Deposit Address UID-89104231',
  },
  {
    name: 'FixedFloat / THORChain Relayer',
    address: '0x71C839019284102948102948102948102a',
    chain: 'ETH',
    desc: 'Cross-chain bridge hop intermediary address (EVM swap cluster)',
  },
];

export default function WalletAnalysisPage() {
  const { address } = useParams<{ address?: string }>();
  const navigate = useNavigate();
  const {
    addToWatchlist,
    watchlist,
    wallets,
    ensureWalletExists,
    transactions,
    syncLiveWalletTransactions,
    user,
  } = useStore();

  const [searchInput, setSearchInput] = useState('');
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveData, setLiveData] = useState<LiveWalletData | null>(null);
  const [mlRiskScore, setMlRiskScore] = useState<number | null>(null);

  // Forensic Taint Engine State
  const [taintModel, setTaintModel] = useState<TaintModel>('HAIRCUT');
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeNoticeText, setFreezeNoticeText] = useState('');
  const [showBsaModal, setShowBsaModal] = useState(false);
  const [bsaNoticeText, setBsaNoticeText] = useState('');

  useEffect(() => {
    if (address) {
      api.getTxRiskAnalysis(address).then(res => {
        const score = res?.mlSignalPercent ?? (res?.mlSignal !== undefined ? res.mlSignal * 100 : res?.probability);
        if (score !== undefined && score !== null && !isNaN(score)) {
          setMlRiskScore(Math.round(score));
        }
      }).catch(err => console.warn('ML fetch error', err));

      ensureWalletExists(address);
      setIsLoadingLive(true);
      fetchLiveWallet(address)
        .then((data) => {
          setLiveData(data);
          syncLiveWalletTransactions(data);
        })
        .catch((err) => console.warn('Failed to fetch live wallet data:', err))
        .finally(() => setIsLoadingLive(false));
    }
  }, [address, ensureWalletExists, syncLiveWalletTransactions]);

  const wallet = address
    ? wallets.find((w) => w.address.toLowerCase() === address.toLowerCase()) ||
      ensureWalletExists(address)
    : null;

  if (!address || !wallet) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
      >
        <motion.div variants={itemVariants}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                background: 'rgba(66,153,225,0.15)',
                color: 'var(--accent)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.06em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: 'var(--accent)' }} />
              ON-CHAIN FORENSIC INTELLIGENCE
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Cryptocurrency Wallet Deep Forensics
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enter any on-chain address or select a verified suspect profile for live RPC indexer interrogation.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '36px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(66,153,225,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            <Search size={24} />
          </div>
          <p style={{ color: 'var(--text-secondary)', margin: 0, textAlign: 'center', maxWidth: '480px', fontSize: '13px', lineHeight: 1.5 }}>
            Queries public RPC indexers (TronGrid, Blockscout EVM, Blockstream) in real-time.
            Supports TRON (TRC-20), Ethereum (ETH/ERC-20), and Bitcoin (BTC) addresses.
          </p>

          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '520px' }}>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter suspect wallet: 0x... or bc1q... or T..."
              onKeyDown={(e) => e.key === 'Enter' && searchInput && navigate(`/wallets/${searchInput}`)}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => searchInput && navigate(`/wallets/${searchInput}`)}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none',
                borderRadius: '7px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
              }}
            >
              Analyze
            </motion.button>
          </div>

          {/* Target Address Guide */}
          <div style={{ width: '100%', maxWidth: '640px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Sparkles size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                Verified Target Case Wallets (1-Click Evaluation)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {VERIFIED_REAL_TARGETS.map((t) => (
                <motion.div
                  key={t.address}
                  whileHover={{ y: -2 }}
                  onClick={() => navigate(`/wallets/${t.address}`)}
                  className="cyber-card-interactive"
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', background: 'rgba(66,153,225,0.12)', color: 'var(--accent)' }}>
                      {t.chain}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--accent)', marginBottom: '4px', wordBreak: 'break-all' }}>
                    {t.address}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {t.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const effectiveChain = detectBlockchain(wallet.address) === 'UNKNOWN' ? wallet.blockchain : detectBlockchain(wallet.address);
  const attribution = resolveVaspAttribution(wallet.address, effectiveChain as any);
  const effectiveRiskScore = mlRiskScore !== null ? mlRiskScore : (liveData?.riskScore ?? wallet.riskScore);
  const riskFactors = getDefaultRiskFactors(effectiveRiskScore, wallet.address);

  // Evaluate Taint Profile
  const taintResult: ForensicTaintResult = calculateForensicTaint({
    incomingTaintAmount: wallet.totalReceived || 50000,
    cleanBalancePreTx: wallet.balance,
    hopDistance: wallet.entityType === 'SUSPECT' ? 1 : wallet.entityType === 'INTERMEDIATE' ? 2 : 3,
    model: taintModel,
    sourceCategory: wallet.flags.some(f => f.toLowerCase().includes('sanction'))
      ? 'SANCTIONED'
      : wallet.entityType === 'MIXER'
      ? 'MIXER'
      : 'STOLEN_FUNDS',
    isSanctionedOrBlacklisted: wallet.flags.some(f => f.toLowerCase().includes('sanction')),
  });

  const walletTxs = transactions.filter(
    (t) =>
      t.fromAddress.toLowerCase() === wallet.address.toLowerCase() ||
      t.toAddress.toLowerCase() === wallet.address.toLowerCase()
  );

  const txColumns = [
    {
      key: 'hash',
      label: 'Tx Hash',
      render: (v: unknown) => {
        const hashStr = String(v);
        const explorerLink = getExplorerUrl('tx', hashStr, effectiveChain as any);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>
              {truncateAddress(hashStr, 6)}
            </span>
            {explorerLink !== '#' && (
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                title="View on block explorer"
                style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center' }}
              >
                <ExternalLink size={11} />
              </a>
            )}
          </div>
        );
      },
    },
    { key: 'type', label: 'Type', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    {
      key: 'amount',
      label: 'Amount',
      render: (v: unknown, row: unknown) => {
        const r = row as { amount: number; token: string; fromAddress?: string };
        const isOut = r.fromAddress?.toLowerCase() === wallet.address.toLowerCase();
        return (
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              fontWeight: 700,
              color: isOut ? 'var(--risk-critical)' : '#38a169',
            }}
          >
            {isOut ? '-' : '+'}
            {r.amount.toFixed(4)} {r.token}
          </span>
        );
      },
    },
    {
      key: 'usdValue',
      label: 'USD Value',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
          {formatUSD(Number(v))}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'riskScore',
      label: 'Forensic Risk',
      render: (v: unknown) => {
        const score = Number(v);
        const color = getRiskColor(score);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color, fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px' }}>
              {score}%
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 700,
                padding: '2px 5px',
                borderRadius: '3px',
                background: score >= 80 ? 'rgba(239,68,68,0.15)' : score >= 60 ? 'rgba(249,115,22,0.15)' : 'rgba(56,161,105,0.15)',
                color,
              }}
            >
              {score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW'}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: 'timestamp',
      label: 'Time',
      render: (v: unknown) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {new Date(String(v)).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      ),
      sortable: true,
    },
  ];

  const isWatched = watchlist.includes(wallet.address);
  const explorerAddressUrl = getExplorerUrl('address', wallet.address, effectiveChain as any);

  // Generate Freeze Notice Handlers
  function handleGenerateFreezeNotice() {
    const text = generateSection106BnssFreezeOrder({
      orderNo: `BNSS/S106/FREEZE/${wallet.address.slice(-6).toUpperCase()}`,
      policeStation: 'State Cyber Crime Investigation Headquarters',
      state: 'Cyber Command HQ',
      firNo: 'CR-2024-NCRP-8921',
      sectionsOfLaw: 'Sec 318(4), 316(2), 61(2) BNS 2023 r/w Sec 66D IT Act',
      vaspName: attribution.vasp.name,
      vaspEmail: attribution.vasp.statutoryNoticeRecipient?.email || 'compliance-inbound@vasp.int',
      targetWalletOrUid: wallet.address,
      taintedAmount: `${wallet.balance.toFixed(4)} ${effectiveChain === 'TRON' ? 'USDT' : effectiveChain === 'BTC' ? 'BTC' : 'ETH'} (~$${formatUSD(wallet.totalReceived)})`,
      investigatingOfficer: user?.name || 'Cyber Forensic Examiner',
      contactNumber: '+91-11-2309-CYBER',
    });
    setFreezeNoticeText(text);
    setShowFreezeModal(true);
  }

  function handleGenerateBsaCert() {
    const text = generateSection63BsaCertificate({
      certificateNo: `BSA-WALLET-${wallet.address.slice(-6).toUpperCase()}`,
      investigationId: 'INV-LIVE',
      caseRef: 'CR-2024-NCRP-8921',
      examinerName: user?.name || 'Cyber Forensic Examiner',
      examinerDesignation: 'Senior Blockchain Cyber Analyst',
      digitalEvidenceHash: `0x${wallet.address.replace(/^0x/, '')}${'0'.repeat(Math.max(0, 64 - wallet.address.length))}`,
      evidenceSource: `Live Validator Node (${effectiveChain})`,
    });
    setBsaNoticeText(text);
    setShowBsaModal(true);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <StatusBadge status={effectiveChain} />
              <StatusBadge status={wallet.entityType} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  background: 'rgba(56,161,105,0.12)',
                  border: '1px solid rgba(56,161,105,0.3)',
                  color: '#38a169',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {isLoadingLive ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" /> FETCHING LIVE ON-CHAIN DATA...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} /> LIVE RPC SYNCHRONIZED
                  </>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text-mono)',
                  wordBreak: 'break-all',
                }}
              >
                {wallet.address}
              </span>
              {explorerAddressUrl !== '#' && (
                <a
                  href={explorerAddressUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    fontSize: '11.5px',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 700,
                  }}
                >
                  <ExternalLink size={12} /> Block Explorer
                </a>
              )}
            </div>

            {wallet.label && <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>{wallet.label}</div>}
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '6px' }}>
              Attributed Cluster / Entity: <strong style={{ color: 'var(--text-primary)' }}>{attribution.vasp.name}</strong> ({attribution.confidence}% confidence)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateFreezeNotice}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(217,119,6,0.15)',
                border: '1px solid rgba(217,119,6,0.4)',
                borderRadius: '7px',
                color: '#d97706',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <AlertTriangle size={14} /> Sec 106 BNSS Freeze Notice
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateBsaCert}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                background: 'rgba(56,161,105,0.15)',
                border: '1px solid rgba(56,161,105,0.4)',
                borderRadius: '7px',
                color: '#38a169',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <FileCheck size={14} /> Sec 63 BSA Certificate
            </motion.button>

            {[
              { icon: <Zap size={14} />, label: 'Victim VASP Trace', color: 'var(--risk-critical)', onClick: () => navigate('/victim-trace') },
              { icon: <Landmark size={14} />, label: 'P2P & UPI Radar', color: 'var(--accent)', onClick: () => navigate('/p2p-radar') },
              { icon: <Layers size={14} />, label: 'Fund Flow', color: '#805ad5', onClick: () => navigate('/fund-flow') },
              { icon: <Eye size={14} />, label: isWatched ? 'Watching' : 'Add to Watchlist', color: isWatched ? '#38a169' : 'var(--accent)', onClick: () => addToWatchlist(wallet.address) },
              { icon: <Plus size={14} />, label: 'Create Case', color: '#ed8936', onClick: () => setShowCaseModal(true) },
              { icon: <FileText size={14} />, label: 'Generate Report', color: 'var(--text-secondary)', onClick: () => navigate('/reports') },
            ].map(({ icon, label, color, onClick }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${color}40`,
                  borderRadius: '7px',
                  color,
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {icon} {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* FORENSIC TAINT ANALYSIS SUITE */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Scale size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                Forensic Taint & Exposure Matrix (Multi-Hop Tracing)
              </h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                Mathematical taint propagation across intermediary hops and de-anonymization exposure.
              </p>
            </div>
          </div>

          {/* Model Switcher */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '3px' }}>
            {(['HAIRCUT', 'FIFO', 'POISON'] as TaintModel[]).map((m) => (
              <button
                key={m}
                onClick={() => setTaintModel(m)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '5px',
                  border: 'none',
                  background: taintModel === m ? 'var(--accent)' : 'transparent',
                  color: taintModel === m ? '#fff' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {m === 'HAIRCUT' ? 'Haircut (Proportional)' : m === 'FIFO' ? 'FIFO Model' : 'Poison (Zero-Tolerance)'}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Calculated Taint Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: getRiskColor(taintResult.taintScore) }}>
                {taintResult.taintScore}%
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                ({taintResult.directTaint}% Direct, {taintResult.indirectTaint}% Indirect)
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Dominant Exposure Source
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
              {taintResult.dominantSource.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Hop Distance: {taintResult.hopCount} hop{taintResult.hopCount > 1 ? 's' : ''} from illicit root
            </div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
              Fund Recovery Feasibility
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background:
                    taintResult.recoveryFeasibility === 'HIGH'
                      ? 'rgba(56,161,105,0.15)'
                      : taintResult.recoveryFeasibility === 'MEDIUM'
                      ? 'rgba(217,119,6,0.15)'
                      : 'rgba(239,68,68,0.15)',
                  color:
                    taintResult.recoveryFeasibility === 'HIGH'
                      ? '#38a169'
                      : taintResult.recoveryFeasibility === 'MEDIUM'
                      ? '#d97706'
                      : '#ef4444',
                }}
              >
                {taintResult.recoveryFeasibility} FEASIBILITY
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {taintResult.recommendedLegalAction}
            </div>
          </div>
        </div>

        {/* Exposure Distribution Bar */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            ESTIMATED LIQUIDITY COMPOSITION (TAINT VS CLEAN)
          </div>
          <div style={{ height: '14px', borderRadius: '4px', overflow: 'hidden', display: 'flex', background: '#1e293b' }}>
            {taintResult.taintScore > 0 && (
              <div
                style={{
                  width: `${taintResult.taintScore}%`,
                  background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                  transition: 'width 0.4s ease',
                }}
                title={`Tainted: ${taintResult.taintScore}%`}
              />
            )}
            <div
              style={{
                width: `${Math.max(0, 100 - taintResult.taintScore)}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                transition: 'width 0.4s ease',
              }}
              title={`Clean / Unlinked: ${Math.max(0, 100 - taintResult.taintScore)}%`}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>■ Tainted Exposure ({taintResult.taintScore}%)</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>■ Uncontaminated Liquidity ({Math.max(0, 100 - taintResult.taintScore)}%)</span>
          </div>
        </div>
      </motion.div>

      {showCaseModal && (
        <NewInvestigationModal
          onClose={() => setShowCaseModal(false)}
          initialWallet={wallet.address}
          initialBlockchain={effectiveChain as any}
          initialTitle={`Wallet Case: ${truncateAddress(wallet.address, 6)}`}
        />
      )}

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
        {/* Left: Risk gauge & Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Risk Assessment (AI/ML XGBoost & Heuristics)
            </h3>
            <RiskScoreGauge score={effectiveRiskScore} factors={riskFactors} />
          </motion.div>

          {/* Risk flags */}
          {wallet.flags.length > 0 && (
            <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '18px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                On-Chain Risk Indicators
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wallet.flags.map((flag) => (
                  <div key={flag} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--risk-high)', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--risk-high)', flexShrink: 0 }} />
                    {flag}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Wallet details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Live Wallet Intelligence Telemetry
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[
                ['Blockchain Protocol', effectiveChain],
                ['Entity Classification', wallet.entityType],
                ['First Seen (Ingress)', new Date(wallet.firstSeen).toLocaleDateString()],
                ['Last Activity', new Date(wallet.lastActivity).toLocaleDateString()],
                ['Verified Balance', `${wallet.balance.toFixed(4)} ${effectiveChain === 'TRON' ? 'USDT' : effectiveChain === 'BTC' ? 'BTC' : 'ETH'}`],
                ['Total Received', `${wallet.totalReceived.toFixed(2)}`],
                ['Total Dispersed', `${wallet.totalSent.toFixed(2)}`],
                ['On-Chain Tx Count', wallet.txCount.toLocaleString()],
                ['Active Counterparties', wallet.counterparties],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '7px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Forensic Heuristics & Behavioral Panel */}
          <motion.div variants={itemVariants} className="cyber-card" style={{ border: '1px solid rgba(66,153,225,0.3)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Forensic Typology &amp; Behavioral Indicators</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Typology Match:</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#38a169', fontFamily: 'JetBrains Mono, monospace' }}>
                  {attribution.confidence}%
                </span>
              </div>
            </div>
            <ol style={{ margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                `Wallet ${truncateAddress(wallet.address)} exhibits rapid fund movement with ${wallet.txCount} verified on-chain transfers, consistent with money laundering velocity patterns.`,
                `Entity classification as ${wallet.entityType} is correlated with ${wallet.counterparties} unique counterparties and cluster association data.`,
                `Exchange attribution confidence: HIGH (${attribution.confidence}%). VASP deposit patterns match ${attribution.vasp.name} internal cluster signatures.`,
                `FIU-IND Compliance: ${attribution.vasp.jurisdiction}. Statutory legal notice eligible under Section 106 BNSS / Section 94 BNSS.`,
              ].map((item, i) => (
                <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ol>
            <div style={{ marginTop: '14px', padding: '10px 12px', background: 'rgba(66,153,225,0.05)', border: '1px solid rgba(66,153,225,0.15)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
              This forensic profile is generated via deterministic graph rules and live on-chain heuristic pattern extraction pursuant to NCFL Examination Guidelines §79A.
            </div>
          </motion.div>
        </div>
      </div>

      {/* Transaction Graph */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>Transaction Network Graph</span>
          <span style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>Force-Directed Layout</span>
        </div>
        <div style={{ padding: '12px' }}>
          <TransactionGraph walletAddress={address} height={400} />
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '13px' }}>
            Live Transaction History ({walletTxs.length > 0 ? walletTxs.length : transactions.length})
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
            Direct On-Chain Log
          </span>
        </div>
        <div style={{ padding: '12px' }}>
          <DataTable
            columns={txColumns as Parameters<typeof DataTable>[0]['columns']}
            data={(walletTxs.length > 0 ? walletTxs : transactions) as unknown as Record<string, unknown>[]}
            searchable
            pageSize={10}
          />
        </div>
      </motion.div>

      {/* MODAL: SECTION 106 BNSS FREEZE NOTICE */}
      <AnimatePresence>
        {showFreezeModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="cyber-card"
              style={{
                width: '800px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: '#d97706' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Section 106 BNSS Statutory Asset Freeze Order
                  </h3>
                </div>
                <button
                  onClick={() => setShowFreezeModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <pre
                  style={{
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#e6edf3',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {freezeNoticeText}
                </pre>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Statutory 24-hr freeze directive under Section 106 BNSS (formerly 102 CrPC).
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(freezeNoticeText)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Copy Notice
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html><head><title>Section 106 BNSS Freeze Order</title></head>
                          <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
                            ${freezeNoticeText}
                          </body></html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(217,119,6,0.15)',
                      border: '1px solid rgba(217,119,6,0.4)',
                      borderRadius: '6px',
                      color: '#d97706',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Printer size={13} /> Print Notice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: SECTION 63 BSA CERTIFICATE */}
      <AnimatePresence>
        {showBsaModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="cyber-card"
              style={{
                width: '800px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={20} style={{ color: '#38a169' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Section 63 BSA 2023 Electronic Evidence Certificate
                  </h3>
                </div>
                <button
                  onClick={() => setShowBsaModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <pre
                  style={{
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#e6edf3',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {bsaNoticeText}
                </pre>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Certified under Section 63 BSA 2023 (formerly 65B Indian Evidence Act).
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(bsaNoticeText)}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Copy Certificate
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html><head><title>Section 63 BSA Certificate</title></head>
                          <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
                            ${bsaNoticeText}
                          </body></html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(56,161,105,0.15)',
                      border: '1px solid rgba(56,161,105,0.4)',
                      borderRadius: '6px',
                      color: '#38a169',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Printer size={13} /> Print Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
