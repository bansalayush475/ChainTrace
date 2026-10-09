import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Shield,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Copy,
  Printer,
  Search,
  Activity,
  Zap,
  Info,
  Layers,
  Filter
} from 'lucide-react';
import { useStore } from '../store/useStore';

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

interface CrossChainHop {
  chain: string;
  txHash: string;
  fromAddress: string;
  toAddress: string;
  protocol: string;
  token: string;
  amount: number;
  usdValue: number;
  timestamp: string;
  status: 'CONFIRMED' | 'IN_TRANSIT' | 'MIXED';
}

interface CorrelationResult {
  id: string;
  sourceChain: string;
  targetChain: string;
  depositTx: string;
  mintOrWithdrawTx: string;
  depositAmount: string;
  receivedAmount: string;
  timeDeltaSec: number;
  bridgeService: string;
  confidenceScore: number;
  gasRelayerAddress: string;
  deAnonymizedExitAddress: string;
  status: 'RESOLVED' | 'ANALYZING';
}

const DEMO_CORRELATIONS: CorrelationResult[] = [
  {
    id: 'XCHAIN-2024-8921',
    sourceChain: 'TRON (TRC-20)',
    targetChain: 'Ethereum Mainnet',
    depositTx: '0x4a82190148b8c29014fa289194e819ac28914b91048291048291049201948291',
    mintOrWithdrawTx: '0x1948291048291048291048291048291048291048291048291048291048291048',
    depositAmount: '48,500 USDT',
    receivedAmount: '18.42 ETH',
    timeDeltaSec: 114,
    bridgeService: 'FixedFloat / THORChain',
    confidenceScore: 95.8,
    gasRelayerAddress: '0x71C839019284102948102948102948102948102a',
    deAnonymizedExitAddress: '0x498b928190dAc01828139184b29',
    status: 'RESOLVED',
  },
  {
    id: 'TORNADO-DEOBF-3419',
    sourceChain: 'Ethereum (Tornado 100 ETH)',
    targetChain: 'Polygon (Matic PoS Bridge)',
    depositTx: '0x918f029104829104829104829104829104829104829104829104829104829104',
    mintOrWithdrawTx: '0x3819401948291048291048291048291048291048291048291048291048291048',
    depositAmount: '100.00 ETH',
    receivedAmount: '264,800 POL',
    timeDeltaSec: 420,
    bridgeService: 'PoS Bridge + Tornado Relayer',
    confidenceScore: 93.2,
    gasRelayerAddress: '0x9028F1029481029481029481029481029481029b',
    deAnonymizedExitAddress: '0x389201948210482910482910482910482910482b',
    status: 'RESOLVED',
  },
];

export default function CrossChainPage() {
  const { user } = useStore();
  const [correlations, setCorrelations] = useState<CorrelationResult[]>(DEMO_CORRELATIONS);
  const [selectedCase, setSelectedCase] = useState<CorrelationResult | null>(DEMO_CORRELATIONS[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'FLOW' | 'XAI_MATH' | 'MIXER_BREAKDOWN' | 'STATUTORY_NOTICE'>('FLOW');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunCorrelation = () => {
    setCorrelations(DEMO_CORRELATIONS);
    setSelectedCase(DEMO_CORRELATIONS[0]);
  };

  const handleClear = () => {
    setCorrelations([]);
    setSelectedCase(null);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'linear-gradient(135deg, rgba(128,90,213,0.12) 0%, rgba(66,153,225,0.08) 50%, var(--bg-surface) 100%)',
          border: '1px solid rgba(128,90,213,0.3)',
          borderRadius: '10px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: '#805ad5',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: '#fff' }} />
              CHAINTRACE CROSS-CHAIN RADAR
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              BRIDGE TIME-CORRELATION &amp; MIXER DE-OBFUSCATION
            </span>
          </div>
          <h1 style={{ margin: '8px 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Cross-Chain Bridge &amp; Privacy Mixer De-Anonymizer
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.45 }}>
            Evades chain-hopping laundering techniques (Tron → Ethereum → Bitcoin → Privacy Pools). De-obfuscates cross-chain swap services (THORChain, FixedFloat, ChangeNOW) and breaks Tornado Cash / Railgun zero-knowledge obscurity via time-series mathematical correlation and gas payer clustering.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          {correlations.length === 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunCorrelation}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.4)',
              }}
            >
              <Zap size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
              <span>Run Correlation Engine</span>
            </motion.button>
          ) : (
            <button
              onClick={handleClear}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset to Blank Slate
            </button>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              De-Anonymized Volume
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#805ad5', fontFamily: 'JetBrains Mono, monospace' }}>
              {selectedCase ? '$202,720 USD' : '$0 USD'}
            </div>
            <div style={{ fontSize: '11px', color: selectedCase ? '#38a169' : 'var(--text-secondary)', fontWeight: 600 }}>
              {selectedCase ? `Avg Confidence: ${selectedCase.confidenceScore}%` : 'No Active Correlations'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Case Selector Strip & Details */}
      {!selectedCase ? (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{ padding: '60px 20px', background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: '10px', textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          <Layers size={36} style={{ color: '#805ad5', opacity: 0.5, margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No Cross-Chain Correlations Active</h3>
          <p style={{ margin: '0 auto 16px', fontSize: '13px', maxWidth: '520px', lineHeight: 1.5 }}>
            No chain-hopping transactions or mixer exit correlations are currently tracked. De-anonymize cross-chain swap services and privacy pools by inputting suspect bridge transactions.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRunCorrelation}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 18px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={14} /> Load Tracked Bridge Transfers
          </motion.button>
        </motion.div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {correlations.map((item) => {
              const isSelected = item.id === selectedCase.id;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  onClick={() => setSelectedCase(item)}
                  className="cyber-card-interactive"
                  style={{
                    background: isSelected ? 'rgba(128,90,213,0.1)' : 'var(--bg-surface)',
                    border: `1.5px solid ${isSelected ? '#805ad5' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    boxShadow: isSelected ? '0 0 16px rgba(128,90,213,0.2)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                      {item.id}
                    </span>
                    <span style={{ fontSize: '11px', color: '#38a169', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="radar-ping-ring" style={{ width: '5px', height: '5px', background: '#38a169' }} />
                      {item.confidenceScore}% CONFIDENCE
                    </span>
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 800 }}>
                    <span>{item.sourceChain.split(' ')[0]}</span>
                    <ArrowRight size={13} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ color: '#805ad5' }}>{item.targetChain.split(' ')[0]}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Protocol: <strong style={{ color: 'var(--text-primary)' }}>{item.bridgeService}</strong>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Detail Area */}
          <motion.div
            variants={itemVariants}
            className="cyber-card"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
          {[
            { id: 'FLOW', label: '1. Cross-Chain Visual Hop Pipeline' },
            { id: 'XAI_MATH', label: '2. Time-Volume Correlation Math (XAI)' },
            { id: 'MIXER_BREAKDOWN', label: '3. Tornado Cash Anonymity De-Pool' },
            { id: 'STATUTORY_NOTICE', label: '4. Section 91 Swap Service Subpoena' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: activeTab === t.id ? 700 : 500,
                cursor: 'pointer',
                border: activeTab === t.id ? '1px solid #805ad5' : '1px solid transparent',
                background: activeTab === t.id ? 'rgba(128,90,213,0.15)' : 'transparent',
                color: activeTab === t.id ? '#805ad5' : 'var(--text-secondary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: FLOW */}
        {activeTab === 'FLOW' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Visual de-anonymization flow connecting victim suspect address on Tron through the cross-chain swap protocol into the destination unmasked wallet on Ethereum:
            </div>

            <div className="crosschain-hops-grid">
              {/* Node 1 */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--risk-critical)', letterSpacing: '0.06em' }}>STEP 1: SOURCE CHAIN</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>TRON (TRC-20)</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', margin: '6px 0' }}>
                  48,500 USDT
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Victim Deposit to Suspect Wallet <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>TTX9...82a1</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Block #58,921,021 | 14:22:10 UTC
                </div>
              </div>

              {/* Node 2 */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid #d69e2e', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#d69e2e', letterSpacing: '0.06em' }}>STEP 2: BRIDGE SWAP PROTOCOL</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>FixedFloat / THORChain</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#d69e2e', fontFamily: 'JetBrains Mono, monospace', margin: '6px 0' }}>
                  No-KYC Cross-Chain Swap
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Lock 48,500 USDT on Tron → Liquidity Pool Swap with -1.2% fee
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Delta: 114s execution window
                </div>
              </div>

              {/* Node 3 */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid #805ad5', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#805ad5', letterSpacing: '0.06em' }}>STEP 3: TARGET MINT / SWAP</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>Ethereum Mainnet</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#805ad5', fontFamily: 'JetBrains Mono, monospace', margin: '6px 0' }}>
                  18.42 ETH ($47,890)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Minted to intermediary relayer wallet <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>0x71C...910a</span>
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'JetBrains Mono, monospace' }}>
                  Block #19,482,910 | 14:24:05 UTC
                </div>
              </div>

              {/* Node 4 */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid #38a169', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#38a169', letterSpacing: '0.06em' }}>STEP 4: UNMASKED EXIT NODE</div>
                <div style={{ fontSize: '13px', fontWeight: 700, marginTop: '4px' }}>WazirX VASP Deposit</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#38a169', fontFamily: 'JetBrains Mono, monospace', margin: '6px 0' }}>
                  Attribution: 95.8%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Destination Address: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>0x498b...4b29</span>
                </div>
                <div style={{ fontSize: '10px', color: '#38a169', marginTop: '8px', fontWeight: 600 }}>
                  Indian KYC Linked: Amit V. (Delhi)
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} style={{ color: '#38a169' }} />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Forensic Chain-Hopping Evidence Integrity
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    SHA-256 Hash of Cross-Chain Correlation Graph: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>7f81a9420b92da10482c1990ab81e912</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard('0x498b928190dAc01828139184b29', 'Exit Address')}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                <Copy size={12} />
                Copy Unmasked Exit Address
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: XAI MATH */}
        {activeTab === 'XAI_MATH' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'rgba(66,153,225,0.08)', border: '1px solid rgba(66,153,225,0.25)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Heuristic & Mathematical Proof:</strong> Why our engine connects the Tron deposit of 48,500 USDT to the Ethereum payout of 18.42 ETH with 95.8% certainty:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#805ad5', textTransform: 'uppercase' }}>1. Temporal Proximity Factor</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>114 Seconds</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Standard FixedFloat Tron-to-ETH swap latency is 90–150 seconds. Delta fits exactly within the 99th percentile window.
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#805ad5', textTransform: 'uppercase' }}>2. Volume & Fee Conservation</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>99.2% Match</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Input: 48,500 USDT ($48,500). Output: 18.42 ETH @ $2,600/ETH = $47,892. Variance matches exact 1.25% protocol slippage.
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#805ad5', textTransform: 'uppercase' }}>3. Gas Relayer Signature</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', margin: '4px 0' }}>Identical Nonce</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Relayer address 0x71C...910a was funded with exactly 0.05 ETH 8 minutes before transaction execution.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MIXER BREAKDOWN */}
        {activeTab === 'MIXER_BREAKDOWN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', color: 'var(--risk-critical)' }}>
              <strong style={{ color: 'var(--risk-critical)' }}>Zero-Knowledge Pool De-Anonymization:</strong> Analysis of Tornado Cash 10 ETH pool deposits and subsequent relayers to isolate the criminal withdrawal:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Tornado Cash 10 ETH Pool Anonymity Set
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Total active unspent notes in pool: <strong>38 notes</strong><br />
                  Filtered by deposit time window (24h): <strong>6 notes</strong><br />
                  Filtered by destination gas relayer fee: <strong>1 matching note</strong><br />
                  Probability of false match: <strong style={{ color: '#38a169' }}>&lt; 0.02%</strong>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Gas-Paying Relayer Attribution
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Relayer Service: <strong>Tornado Cash Relayer Registry #4</strong><br />
                  Gas Fee Paid: <strong>0.0084 ETH</strong><br />
                  Beneficiary Wallet: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>0x498b928190dAc01828139184b29</span><br />
                  Result: <strong>Full Address Unmasked & Admissible</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STATUTORY NOTICE */}
        {activeTab === 'STATUTORY_NOTICE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                STATUTORY EVIDENCE PRODUCTION NOTICE (§91 CrPC / §94 BNSS) TO SWAP PROVIDER
              </span>
              <button
                onClick={() => window.print()}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-primary)',
                }}
              >
                <Printer size={13} />
                Print / Save Subpoena
              </button>
            </div>

            <div
              style={{
                background: '#0d1117',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '16px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11.5px',
                lineHeight: '1.6',
                color: '#e6edf3',
                maxHeight: '360px',
                overflowY: 'auto',
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '1px solid #30363d', paddingBottom: '8px', marginBottom: '12px' }}>
                <strong>CHAINTRACE FORENSICS &bull; CROSS-CHAIN INTELLIGENCE</strong><br />
                DECENTRALIZED BRIDGE &amp; SWAP TELEMETRY<br />
                STATUTORY SUMMONS UNDER SECTION 91 CrPC / SECTION 94 BNSS
              </div>
              <div>
                <strong>TO:</strong> Compliance Officer / Legal Counsel, FixedFloat & THORChain Liquidity Operations<br />
                <strong>REF:</strong> International Mutual Legal Assistance / Cyber Investigation Ref #XCHAIN-2024-8841<br />
                <br />
                <strong>DEMAND FOR ELECTRONIC EVIDENCE & CONNECTION LOGS:</strong><br />
                You are hereby notified that the transaction hash <strong>{selectedCase.depositTx}</strong> represents the siphoned proceeds of an aggravated digital arrest & cyber extortion crime in India.<br />
                <br />
                Under the authority of Section 91 CrPC and Section 79A IT Act, you are commanded to produce within 48 hours:<br />
                1. Full server connection logs (IP addresses, port, user-agent, timestamp) for order swap.<br />
                2. Originating refund wallet address designated by the sender.<br />
                3. Destination receiving address on Ethereum Mainnet.<br />
                4. Any API keys or automated bot identifiers associated with the swap transaction.<br />
                <br />
                Digital Verification Seal: SHA-256: 88f192ac81048201da9180bac10492810a<br />
                Investigating Officer: Lead Cyber Forensics Specialist ({user?.name || 'Authorized IO'})
              </div>
            </div>
          </div>
        )}
      </motion.div>
      </>
      )}
    </motion.div>
  );
}
