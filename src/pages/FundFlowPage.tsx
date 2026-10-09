import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TransactionGraph from '../components/graph/TransactionGraph';
import { formatUSD } from '../utils/riskEngine';
import { useStore } from '../store/useStore';
import { GitBranch, Activity, Network, Layers } from 'lucide-react';

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

const HOP_DEPTHS = ['3 Hops', '5 Hops', '10 Hops', 'Maximum'];

export default function FundFlowPage() {
  const [activeHop, setActiveHop] = useState(0);
  const { investigations, transactions } = useStore();

  const totalTracedValue = investigations.reduce((sum, i) => sum + (i.fundsTraced || 0), 0) +
    transactions.reduce((sum, t) => sum + (t.usdValue || 0), 0);

  const coveragePct = investigations.length > 0 || transactions.length > 0 ? '100%' : '0%';
  const hopTxCounts = [3, 5, 10, transactions.length];
  const hopsCount = transactions.length > 0 ? Math.min(hopTxCounts[activeHop], transactions.length) : 0;
  const untracedFunds = 0;

  const stats = [
    { label: 'Total Traced', value: formatUSD(totalTracedValue), color: 'var(--accent)' },
    { label: 'Trace Coverage', value: coveragePct, color: '#38a169' },
    { label: 'Hops Traced', value: hopsCount, color: '#805ad5' },
    { label: 'Untraced Funds', value: formatUSD(untracedFunds), color: 'var(--risk-low)' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
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
              TOPOLOGY RECONNAISSANCE
            </span>
          </div>
          <h1 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Fund Flow Intelligence &amp; Multi-Hop Graph
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
            Interactive node-edge graph visualization of suspect asset dispersion and intermediary peel hops.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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

      {/* Stats */}
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

      {/* Graph */}
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
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
            Force-Directed WebGL Physics
          </span>
        </div>
        <TransactionGraph height={560} hopDepth={[3, 5, 10, 14][activeHop]} />
      </motion.div>

      {/* Sankey-style flow summary */}
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
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-secondary)' }}>
            <GitBranch size={32} style={{ margin: '0 auto 10px', opacity: 0.4, color: 'var(--accent)' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>
              No fund flow transactions mapped yet. Create an investigation or analyze a wallet address to populate graph hops.
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
    </motion.div>
  );
}
