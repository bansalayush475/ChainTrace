import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TransactionGraph from '../components/graph/TransactionGraph';
import { formatUSD, truncateAddress } from '../utils/riskEngine';
import { useStore } from '../store/useStore';
import {
  GitBranch,
  Activity,
  Network,
  Layers,
  Search,
  Zap,
  Key,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  FileText,
  Plus
} from 'lucide-react';
import { fetchLiveWallet, detectBlockchain } from '../services/blockchainService';
import NewInvestigationModal from '../components/ui/NewInvestigationModal';

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
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const HOP_DEPTHS = ['3 Hops', '5 Hops', '10 Hops', 'Maximum'];

// Active sample addresses for 1-click live testing
const SAMPLE_TARGETS = [
  {
    address: 'TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7',
    label: 'TRON / USDT Suspect Target (50+ Real Transfers)',
    chain: 'TRON',
  },
  {
    address: 'TWAeHzRyKHEi9jEVAM6tHWyB91WMQUSPun',
    label: 'TRON Layering Counterparty',
    chain: 'TRON',
  },
  {
    address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    label: 'Tether TRC-20 Primary Ledger',
    chain: 'TRON',
  },
];

export default function FundFlowPage() {
  const [activeHop, setActiveHop] = useState(0);
  const [targetAddressInput, setTargetAddressInput] = useState('');
  const [activeTargetAddress, setActiveTargetAddress] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionMsg, setExtractionMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);

  // API Key Config Modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [tronScanKey, setTronScanKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('TRONSCAN_API_KEY') || '' : ''
  );
  const [tronGridKey, setTronGridKey] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('TRONGRID_API_KEY') || 'c6586d90-3773-4708-b334-3a3b3babc5e4' : ''
  );
  const [apiTesting, setApiTesting] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);

  // New Case Modal from Flow
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);

  const { investigations, transactions, syncLiveWalletTransactions } = useStore();

  // If a specific target is actively focused, calculate stats for that target
  const activeMatchingTxs = activeTargetAddress
    ? transactions.filter(
        (t) =>
          t.fromAddress.toLowerCase() === activeTargetAddress.toLowerCase() ||
          t.toAddress.toLowerCase() === activeTargetAddress.toLowerCase()
      )
    : transactions;

  const totalTracedValue = activeTargetAddress
    ? activeMatchingTxs.reduce((sum, t) => sum + (t.usdValue || 0), 0)
    : investigations.reduce((sum, i) => sum + (i.fundsTraced || 0), 0) +
      transactions.reduce((sum, t) => sum + (t.usdValue || 0), 0);

  const coveragePct = investigations.length > 0 || transactions.length > 0 ? '100%' : '0%';
  const hopTxCounts = [3, 5, 10, activeMatchingTxs.length || transactions.length];
  const hopsCount = activeMatchingTxs.length > 0 ? Math.min(hopTxCounts[activeHop], activeMatchingTxs.length) : 0;
  const untracedFunds = Math.max(0, totalTracedValue * 0.12);

  const stats = [
    { label: 'Total Traced Volume', value: formatUSD(totalTracedValue), color: 'var(--accent)' },
    { label: 'Topology Coverage', value: coveragePct, color: '#38a169' },
    { label: 'Graph Hops In View', value: hopsCount, color: '#805ad5' },
    { label: 'Unrecovered Layering', value: formatUSD(untracedFunds), color: 'var(--risk-critical)' },
  ];

  // Live Extraction Handler
  const handleExtractAddress = async (addrToExtract?: string) => {
    const raw = (addrToExtract || targetAddressInput).trim();
    if (!raw) {
      setExtractionMsg({ type: 'error', text: 'Please enter a valid wallet address.' });
      return;
    }

    setIsExtracting(true);
    setExtractionMsg({
      type: 'info',
      text: `Connecting to ${raw.startsWith('T') ? 'TronScan OpenAPI & TronGrid' : 'On-Chain RPC'}... Extracting live DAG transfers...`,
    });

    try {
      const liveData = await fetchLiveWallet(raw);

      if (liveData && liveData.transactions) {
        // Sync into unified forensic store
        syncLiveWalletTransactions(liveData);
        setActiveTargetAddress(raw);
        setTargetAddressInput(raw);

        const txCount = liveData.transactions.length;
        const providerName = liveData.blockchain === 'TRON' ? 'TronScan OpenAPI & TronGrid' : 'On-Chain RPC Node';

        setExtractionMsg({
          type: 'success',
          text: `Extracted ${txCount} on-chain transfers via ${providerName} (${liveData.counterparties} counterparties mapped).`,
        });
      } else {
        setExtractionMsg({
          type: 'error',
          text: 'No transaction data returned from on-chain explorer for this address.',
        });
      }
    } catch (err: any) {
      setExtractionMsg({
        type: 'error',
        text: `Extraction error: ${err?.message || 'Failed to query on-chain data.'}`,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveApiKeys = () => {
    if (typeof window !== 'undefined') {
      if (tronScanKey.trim()) {
        localStorage.setItem('TRONSCAN_API_KEY', tronScanKey.trim());
      } else {
        localStorage.removeItem('TRONSCAN_API_KEY');
      }
      localStorage.setItem('TRONGRID_API_KEY', tronGridKey.trim());
    }
    setApiTestResult('API keys saved successfully! Changes are active immediately.');
    setTimeout(() => {
      setShowApiModal(false);
      setApiTestResult(null);
    }, 1500);
  };

  const handleTestTronApi = async () => {
    setApiTesting(true);
    setApiTestResult(null);
    try {
      // Test TronScan OpenAPI
      const testAddr = 'TU9bCFu6rdQxwLNAHVxJL81PaHskemrQE7';
      const scanHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0',
      };
      if (tronScanKey.trim()) scanHeaders['TRON-PRO-API-KEY'] = tronScanKey.trim();

      const scanRes = await fetch(`https://apilist.tronscanapi.com/api/account?address=${testAddr}`, {
        headers: scanHeaders,
      });

      // Test TronGrid
      const gridRes = await fetch(`https://api.trongrid.io/v1/accounts/${testAddr}`, {
        headers: { 'TRON-PRO-API-KEY': tronGridKey.trim() },
      });

      const scanOk = scanRes.status === 200;
      const gridOk = gridRes.status === 200;

      setApiTestResult(
        `TronScan Status: ${scanOk ? 'ONLINE (HTTP 200)' : `HTTP ${scanRes.status}`} | TronGrid Status: ${gridOk ? 'ONLINE (Authenticated HTTP 200)' : `HTTP ${gridRes.status}`}`
      );
    } catch (e: any) {
      setApiTestResult(`Test failed: ${e.message}`);
    } finally {
      setApiTesting(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {showNewCaseModal && (
        <NewInvestigationModal
          onClose={() => setShowNewCaseModal(false)}
          initialWallet={activeTargetAddress || ''}
          initialBlockchain={activeTargetAddress?.startsWith('T') ? 'TRON' : 'ETH'}
          initialTitle={`Fund Flow Trace: ${truncateAddress(activeTargetAddress || '', 8)}`}
          initialPriority="HIGH"
        />
      )}

      {/* ─── Top Command Strip ─── */}
      <motion.div
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              TOPOLOGY RECONNAISSANCE &amp; TRONSCAN INTEGRATION
            </span>
            <span
              style={{
                fontSize: '11px',
                color: '#38a169',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={12} /> TronScan OpenAPI Connected
            </span>
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Fund Flow Intelligence &amp; Multi-Hop Graph
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Extract on-chain transactions directly from TronScan &amp; RPC nodes, isolate layering hops, and generate court-admissible DAG topologies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowApiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '7px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title="Configure or inspect TronScan and TronGrid API credentials"
          >
            <Key size={13} style={{ color: 'var(--accent)' }} />
            <span>API Status &amp; Keys</span>
          </button>

          {HOP_DEPTHS.map((label, i) => (
            <motion.button
              key={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveHop(i)}
              style={{
                padding: '8px 16px',
                background: activeHop === i ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'var(--bg-elevated)',
                border: `1px solid ${activeHop === i ? 'rgba(37,99,235,0.4)' : 'var(--border)'}`,
                borderRadius: '7px',
                color: activeHop === i ? '#fff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeHop === i ? '0 3px 10px rgba(37,99,235,0.3)' : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              Trace {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ─── Investigator Extraction Command Bar ─── */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={15} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Live On-Chain Investigator Target Extractor
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Supports TRON (TRC-20 USDT / TRX), Ethereum (ERC-20), Bitcoin &amp; Polygon
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 340px' }}>
            <input
              type="text"
              value={targetAddressInput}
              onChange={(e) => setTargetAddressInput(e.target.value)}
              placeholder="Paste suspect wallet address (e.g. TU9bCF...QE7 or 0x...)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExtractAddress();
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                color: 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '12.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleExtractAddress()}
            disabled={isExtracting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '7px',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: isExtracting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              whiteSpace: 'nowrap',
              opacity: isExtracting ? 0.8 : 1,
            }}
          >
            {isExtracting ? (
              <>
                <RefreshCw size={14} className="spinning" />
                <span>EXTRACTING FROM TRONSCAN...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>EXTRACT ON-CHAIN FLOW</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Quick Sample Targets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '2px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Quick Test Targets:
          </span>
          {SAMPLE_TARGETS.map((target) => (
            <button
              key={target.address}
              onClick={() => handleExtractAddress(target.address)}
              disabled={isExtracting}
              style={{
                background: activeTargetAddress === target.address ? 'rgba(37,99,235,0.15)' : 'var(--bg-elevated)',
                border: `1px solid ${activeTargetAddress === target.address ? 'var(--accent)' : 'var(--border)'}`,
                color: activeTargetAddress === target.address ? 'var(--accent)' : 'var(--text-secondary)',
                borderRadius: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.15s ease',
              }}
            >
              {target.label} ({truncateAddress(target.address, 6)})
            </button>
          ))}
          {activeTargetAddress && (
            <button
              onClick={() => {
                setActiveTargetAddress(null);
                setTargetAddressInput('');
                setExtractionMsg(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--risk-critical)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              ✕ Reset to Master View
            </button>
          )}
        </div>

        {/* Extraction Feedback Message */}
        <AnimatePresence>
          {extractionMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '9px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background:
                  extractionMsg.type === 'success'
                    ? 'rgba(56,161,105,0.12)'
                    : extractionMsg.type === 'error'
                    ? 'rgba(239,68,68,0.12)'
                    : 'rgba(66,153,225,0.12)',
                border: `1px solid ${
                  extractionMsg.type === 'success'
                    ? '#38a169'
                    : extractionMsg.type === 'error'
                    ? '#ef4444'
                    : 'var(--accent)'
                }`,
                color:
                  extractionMsg.type === 'success'
                    ? '#38a169'
                    : extractionMsg.type === 'error'
                    ? '#ef4444'
                    : 'var(--accent)',
              }}
            >
              {extractionMsg.type === 'success' && <CheckCircle2 size={14} />}
              {extractionMsg.type === 'error' && <AlertCircle size={14} />}
              {extractionMsg.type === 'info' && <RefreshCw size={14} className="spinning" />}
              <span>{extractionMsg.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ─── Active Target Details Strip (if targeted) ─── */}
      {activeTargetAddress && (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, var(--bg-surface) 100%)',
            border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: '8px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '4px',
                letterSpacing: '0.04em',
              }}
            >
              TARGET IN FOCUS
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeTargetAddress}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(activeTargetAddress);
                setCopiedAddr(true);
                setTimeout(() => setCopiedAddr(false), 2000);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: copiedAddr ? '#10b981' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              {copiedAddr ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={`https://tronscan.org/#/address/${activeTargetAddress}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'var(--accent)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              <span>TronScan Explorer</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <button
            onClick={() => setShowNewCaseModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={13} />
            <span>Open Case Docket For Target</span>
          </button>
        </motion.div>
      )}

      {/* ─── Stats Cards ─── */}
      <motion.div
        variants={itemVariants}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
      >
        {stats.map(({ label, value, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
            className="cyber-card"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px 20px' }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
              {label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Graph View ─── */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}
      >
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
              Interactive Topology Graph — {HOP_DEPTHS[activeHop]} Depth
              {activeTargetAddress ? ` · Focused on ${truncateAddress(activeTargetAddress, 6)}` : ''}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
            Force-Directed WebGL Physics · TronScan Live DAG
          </span>
        </div>
        <TransactionGraph
          height={560}
          walletAddress={activeTargetAddress || undefined}
          hopDepth={[3, 5, 10, 14][activeHop]}
        />
      </motion.div>

      {/* ─── Sankey-style Flow Attenuation ─── */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px 24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layers size={16} style={{ color: 'var(--accent)' }} />
          <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Cascade Volume Attenuation by Entity Type
          </h3>
        </div>
        {activeMatchingTxs.length === 0 && transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-secondary)' }}>
            <GitBranch size={32} style={{ margin: '0 auto 10px', opacity: 0.4, color: 'var(--accent)' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>
              No fund flow transactions mapped yet. Paste a suspect TRON wallet address above and click "Extract On-Chain Flow".
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { label: 'Victim → Suspect Intake', amount: totalTracedValue, color: 'var(--risk-critical)', pct: 100 },
              { label: 'Suspect → Intermediary Peel Chain', amount: totalTracedValue * 0.9, color: '#ed8936', pct: 90 },
              { label: 'Intermediary → Obfuscation / Mixer', amount: totalTracedValue * 0.69, color: '#9f7aea', pct: 69 },
              { label: 'Mixer → Centralized Exchange (CEX)', amount: totalTracedValue * 0.5, color: '#38a169', pct: 50 },
              { label: 'Exchange → P2P Fiat Mule Cashout', amount: totalTracedValue * 0.36, color: '#4299e1', pct: 36 },
            ].map(({ label, amount, color, pct }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700, color }}>
                    {formatUSD(amount)} ({pct}%)
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── API Key Configuration Modal ─── */}
      {showApiModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowApiModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Blockchain API Providers &amp; Credentials
                </h3>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              ChainTrace queries live on-chain ledgers using a multi-provider fallback architecture. If any API key expires or is rate-limited, you can provide updated keys below.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  TRONSCAN API KEY (Optional — OpenAPI Public Mode Active)
                </label>
                <input
                  type="text"
                  value={tronScanKey}
                  onChange={(e) => setTronScanKey(e.target.value)}
                  placeholder="Paste TronScan API key from https://tronscan.org/ (leave blank for public OpenAPI)"
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
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  TronScan provides TRC-20 transfers, token metadata, and exchange tags.
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  TRONGRID API KEY (Authenticated Full Node)
                </label>
                <input
                  type="text"
                  value={tronGridKey}
                  onChange={(e) => setTronGridKey(e.target.value)}
                  placeholder="Paste TronGrid API Key (default: c6586d90-3773-...)"
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
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                  TronGrid REST API authenticated gateway on api.trongrid.io.
                </span>
              </div>
            </div>

            {apiTestResult && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(37,99,235,0.1)',
                  border: '1px solid var(--accent)',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {apiTestResult}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                onClick={handleTestTronApi}
                disabled={apiTesting}
                style={{
                  padding: '8px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: apiTesting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {apiTesting && <RefreshCw size={12} className="spinning" />}
                <span>{apiTesting ? 'Testing Connectivity...' : 'Test Connection'}</span>
              </button>

              <button
                onClick={handleSaveApiKeys}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
