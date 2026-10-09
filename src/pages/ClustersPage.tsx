import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Network, Filter, Sparkles, ShieldAlert, ChevronRight } from 'lucide-react';
import { walletClusters } from '../data/mockData';
import { getRiskColor, getRiskLevel, formatUSD } from '../utils/riskEngine';
import StatusBadge from '../components/ui/StatusBadge';

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
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function MiniRiskArc({ score }: { score: number }) {
  const r = 28;
  const cx = 38;
  const cy = 38;
  const circumference = 2 * Math.PI * r;
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const dashOffset = arcLength * (1 - score / 100);
  const color = getRiskColor(score);

  return (
    <svg width="76" height="76" viewBox="0 0 76 76">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="7"
        strokeDasharray={`${arcLength} ${circumference}`} strokeLinecap="round"
        transform={`rotate(135, ${cx}, ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${arcLength} ${circumference}`} strokeDashoffset={dashOffset}
        strokeLinecap="round" transform={`rotate(135, ${cx}, ${cy})`} />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        style={{ fill: color, fontSize: '15px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
        {score}
      </text>
    </svg>
  );
}

export default function ClustersPage() {
  const navigate = useNavigate();
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [blockchainFilter, setBlockchainFilter] = useState('ALL');

  const filtered = walletClusters.filter((c) => {
    if (riskFilter !== 'ALL' && getRiskLevel(c.riskScore) !== riskFilter) return false;
    if (blockchainFilter !== 'ALL' && c.blockchain !== blockchainFilter) return false;
    return true;
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Network size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Wallet Clusters
              </h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(66,153,225,0.12)',
                  color: 'var(--accent)',
                }}
              >
                HEURISTIC CO-SPEND CLUSTERS
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Algorithmically identified wallet groups sharing common ownership, multi-input clustering, or behavioral patterns
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {filtered.length} Discovered Clusters
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ display: 'flex', gap: '12px', padding: '14px 18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by:</span>
        </div>
        {[
          { value: riskFilter, setter: setRiskFilter, options: ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], label: 'Risk Level' },
          { value: blockchainFilter, setter: setBlockchainFilter, options: ['ALL', 'ETH', 'BTC', 'TRON', 'POLYGON', 'BNB'], label: 'Blockchain' },
        ].map(({ value, setter, options, label }) => (
          <select
            key={label}
            value={value}
            onChange={(e) => setter(e.target.value)}
            style={{ padding: '7px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
          >
            {options.map((o) => <option key={o}>{o === 'ALL' ? `All ${label}s` : o}</option>)}
          </select>
        ))}
      </motion.div>

      {/* Cluster grid */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Network size={36} style={{ color: 'var(--text-secondary)', opacity: 0.4, marginBottom: '10px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>No Wallet Clusters Identified</h3>
          <p style={{ margin: 0, fontSize: '13px' }}>No algorithmic clusters detected or registered in the database matching criteria.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map((cluster) => (
            <motion.div
              key={cluster.id}
              whileHover={{ y: -3 }}
              className="cyber-card"
              style={{
                border: `1px solid ${getRiskColor(cluster.riskScore)}35`,
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>{cluster.id}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: 600 }}>{cluster.blockchain} Protocol</div>
                </div>
                <MiniRiskArc score={cluster.riskScore} />
              </div>

              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{cluster.label}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{cluster.detectionReason}</p>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  ['Wallet Count', cluster.walletCount.toLocaleString()],
                  ['Total Volume', formatUSD(cluster.totalVolume)],
                  ['Fraud Reports', cluster.fraudReports],
                  ['Exchange Exposure', `${cluster.exchangeExposure}%`],
                ].map(([label, value]) => (
                  <div key={String(label)} style={{ background: 'var(--bg-elevated)', borderRadius: '6px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                {[
                  { label: 'Expand Graph', onClick: () => navigate('/fund-flow'), danger: false },
                  { label: 'View Members', onClick: () => navigate('/wallets'), danger: false },
                  { label: 'Create Case', onClick: () => navigate('/investigations'), danger: true },
                ].map(({ label, onClick, danger }) => (
                  <motion.button
                    key={label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClick}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      background: danger ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)',
                      border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      color: danger ? 'var(--risk-critical)' : 'var(--text-secondary)',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
