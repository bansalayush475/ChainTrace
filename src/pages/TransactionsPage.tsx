import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftRight, ShieldAlert, Zap, Filter, Search, X } from 'lucide-react';
import { useStore, Transaction } from '../store/useStore';
import { truncateAddress, getRiskColor, formatUSD } from '../utils/riskEngine';
import { transactions as mockTransactions } from '../data/mockData';
import TransactionDetailsModal from '../components/ui/TransactionDetailsModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
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

// Rule: ETH amounts >= 0.2 are automatically classified as HIGH RISK (82-98)
export function getTxEffectiveRisk(tx: { token?: string; amount?: number; riskScore: number }): number {
  const isEth = (tx.token || '').toUpperCase().includes('ETH');
  const amount = Number(tx.amount || 0);
  if (isEth && amount >= 0.2) {
    return Math.max(82, tx.riskScore || 85);
  }
  return tx.riskScore || 50;
}

// Map flag text → descriptive sub-label for the flag card (matches image)
function getFlagSubLabel(flag: string): string {
  if (flag.toLowerCase().includes('tornado') || flag.toLowerCase().includes('mixer')) return 'Tornado Cash Router Ingress';
  if (flag.toLowerCase().includes('wazirx') || flag.toLowerCase().includes('off-ramp')) return 'Off-Ramp Candidate';
  if (flag.toLowerCase().includes('cross-chain') || flag.toLowerCase().includes('bridge')) return 'Syndicate Outflow';
  if (flag.toLowerCase().includes('peeling hop 1') || flag.toLowerCase().includes('mule')) return 'Mule Structuring';
  if (flag.toLowerCase().includes('peeling hop 2') || flag.toLowerCase().includes('automated')) return 'Automated Script';
  if (flag.toLowerCase().includes('dex') || flag.toLowerCase().includes('layering')) return 'Layering Node';
  if (flag.toLowerCase().includes('aggregation') || flag.toLowerCase().includes('syndicate sub')) return 'Aggregation Node';
  if (flag.toLowerCase().includes('dispersal')) return 'Dispersal Branch';
  if (flag.toLowerCase().includes('1inch') || flag.toLowerCase().includes('inflow')) return 'Aggregator Inflow';
  if (flag.toLowerCase().includes('threshold')) return 'Threshold Flagged';
  if (flag.toLowerCase().includes('deposit')) return 'Deposit Candidate';
  if (flag.toLowerCase().includes('sub-threshold') || flag.toLowerCase().includes('medium')) return 'Sub-Threshold Transfer';
  if (flag.toLowerCase().includes('relay') || flag.toLowerCase().includes('gas')) return 'Relay Gas Provision';
  if (flag.toLowerCase().includes('micro') || flag.toLowerCase().includes('fee')) return 'Micro Fee Split';
  if (flag.toLowerCase().includes('high risk')) return '≥ 0.2 ETH';
  return flag;
}

// Get flag name (first part before sub-label)
function getFlagTitle(flag: string): string {
  // Strip the "(> 0.2 ETH)" or "(< 0.2 ETH)" suffix if present
  return flag.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { transactions: storeTxs } = useStore();
  
  // Merge live store transactions with rich mock data so the demo never looks empty,
  // but still shows new transactions added via the app.
  const allTxs = [...storeTxs, ...mockTransactions];
  const transactions = Array.from(new Map(allTxs.map(t => [t.hash, t])).values());
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const types = ['ALL', 'TRANSFER', 'SWAP', 'BRIDGE', 'MIXER', 'EXCHANGE_DEPOSIT', 'EXCHANGE_WITHDRAWAL'];
  const riskLevels = ['ALL', 'High Risk (≥ 0.2 ETH)', 'Medium Risk', 'Low Risk'];

  const filtered = transactions.filter((tx) => {
    if (typeFilter !== 'ALL' && tx.type !== typeFilter) return false;
    const effectiveRisk = getTxEffectiveRisk(tx);
    if (riskFilter !== 'ALL') {
      if (riskFilter === 'High Risk (≥ 0.2 ETH)' && effectiveRisk < 80) return false;
      if (riskFilter === 'Medium Risk' && (effectiveRisk < 30 || effectiveRisk >= 80)) return false;
      if (riskFilter === 'Low Risk' && effectiveRisk >= 30) return false;
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      if (
        !tx.hash.toLowerCase().includes(q) &&
        !tx.fromAddress.toLowerCase().includes(q) &&
        !tx.toAddress.toLowerCase().includes(q) &&
        !(tx.token || '').toLowerCase().includes(q) &&
        !(tx.type || '').toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalValue = filtered.reduce((sum, tx) => sum + tx.usdValue, 0);
  const hasFilter = searchText || typeFilter !== 'ALL' || riskFilter !== 'ALL';

  // Type badge colors
  const typeColors: Record<string, { bg: string; color: string }> = {
    MIXER: { bg: 'rgba(159,122,234,0.15)', color: '#9f7aea' },
    EXCHANGE_DEPOSIT: { bg: 'rgba(56,161,105,0.12)', color: '#38a169' },
    EXCHANGE_WITHDRAWAL: { bg: 'rgba(56,161,105,0.12)', color: '#38a169' },
    BRIDGE: { bg: 'rgba(237,137,54,0.15)', color: '#ed8936' },
    SWAP: { bg: 'rgba(66,153,225,0.12)', color: '#4299e1' },
    TRANSFER: { bg: 'rgba(136,146,160,0.12)', color: '#718096' },
  };

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
              <ArrowLeftRight size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Transaction Explorer</h1>
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
                LIVE CROSS-PROTOCOL TELEMETRY
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {filtered.length} indexed transactions · Total monitored volume:{' '}
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{formatUSD(totalValue)}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--risk-critical)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              {transactions.filter((t) => getTxEffectiveRisk(t) >= 80).length} HIGH RISK (≥ 0.2 ETH)
            </span>
            <span style={{ background: 'rgba(159,122,234,0.1)', color: '#9f7aea', border: '1px solid rgba(159,122,234,0.25)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              {transactions.filter((t) => t.type === 'MIXER').length} MIXER HOPS
            </span>
          </div>
        </div>
      </motion.div>

      {/* Filters — background changes when any filter is active */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          display: 'flex',
          gap: '12px',
          padding: '14px 18px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} style={{ color: hasFilter ? 'var(--accent)' : 'var(--text-secondary)' }} />
          <span style={{ fontSize: '12px', color: hasFilter ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>Filter by:</span>
        </div>
        {/* Text search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search hash, address, token..."
            style={{
              padding: '7px 12px 7px 30px',
              background: 'var(--bg-elevated)',
              border: `1px solid ${searchText ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              outline: 'none',
              width: '220px',
            }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '7px 12px',
            background: typeFilter !== 'ALL' ? 'rgba(37,99,235,0.12)' : 'var(--bg-elevated)',
            border: `1px solid ${typeFilter !== 'ALL' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '6px',
            color: typeFilter !== 'ALL' ? 'var(--accent)' : 'var(--text-primary)',
            fontSize: '12.5px',
            outline: 'none',
            fontWeight: typeFilter !== 'ALL' ? 700 : 400,
          }}
        >
          {types.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All Transaction Types' : t.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          style={{
            padding: '7px 12px',
            background: riskFilter !== 'ALL' ? 'rgba(239,68,68,0.08)' : 'var(--bg-elevated)',
            border: `1px solid ${riskFilter !== 'ALL' ? 'var(--risk-critical)' : 'var(--border)'}`,
            borderRadius: '6px',
            color: riskFilter !== 'ALL' ? 'var(--risk-critical)' : 'var(--text-primary)',
            fontSize: '12.5px',
            outline: 'none',
            fontWeight: riskFilter !== 'ALL' ? 700 : 400,
          }}
        >
          {riskLevels.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All Risk Levels' : r}</option>)}
        </select>
        {hasFilter && (
          <>
            <span style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--accent)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '5px', padding: '4px 10px', fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              {filtered.length} / {transactions.length}
            </span>
            <button
              onClick={() => { setSearchText(''); setTypeFilter('ALL'); setRiskFilter('ALL'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={12} /> Clear
            </button>
          </>
        )}
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                {['TX HASH', 'FROM', 'TO', 'TYPE', 'AMOUNT', 'USD VALUE', 'RISK', 'FLAGS', 'TIME', 'BLOCK'].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      letterSpacing: '0.08em',
                      fontFamily: 'JetBrains Mono, monospace',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, idx) => {
                const effectiveRisk = getTxEffectiveRisk(tx);
                const isHighRisk = effectiveRisk >= 80;
                const tc = typeColors[tx.type] || { bg: 'rgba(136,146,160,0.12)', color: '#718096' };
                const amtFormatted = tx.amount >= 1
                  ? tx.amount.toFixed(4)
                  : tx.amount >= 0.0001
                    ? tx.amount.toFixed(4)
                    : tx.amount > 0
                      ? tx.amount.toFixed(6)
                      : '0.0000';
                const usdVal = (tx.usdValue && tx.usdValue > 0)
                  ? tx.usdValue
                  : ((tx.token || '').toUpperCase().includes('ETH') && tx.amount ? tx.amount * 2650 : 0);
                const flags = tx.flags ?? [];

                return (
                  <tr
                    key={tx.hash}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'transparent',
                    }}
                  >
                    {/* TX HASH */}
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedTx(tx); }}
                        style={{
                          background: 'none', border: 'none', padding: 0, margin: 0,
                          color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                          textDecoration: 'underline', textDecorationStyle: 'dotted'
                        }}
                        title="View Transaction Details"
                      >
                        {truncateAddress(tx.hash, 10)}
                      </button>
                    </td>

                    {/* FROM */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/wallets/${tx.fromAddress}`); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: 'var(--accent)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                      >
                        {truncateAddress(tx.fromAddress, 6)}
                      </button>
                    </td>

                    {/* TO */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/wallets/${tx.toAddress}`); }}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: 'var(--accent)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                      >
                        {truncateAddress(tx.toAddress, 6)}
                      </button>
                    </td>

                    {/* TYPE */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.color}30`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                        {tx.type.replace(/_/g, '_')}
                      </span>
                    </td>

                    {/* AMOUNT */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: isHighRisk ? 800 : 500, color: isHighRisk ? 'var(--risk-critical)' : 'var(--text-primary)', lineHeight: 1.2 }}>
                        {amtFormatted}
                      </div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '1px' }}>
                        {tx.token}
                      </div>
                    </td>

                    {/* USD VALUE */}
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {formatUSD(usdVal)}
                    </td>

                    {/* RISK */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: getRiskColor(effectiveRisk), fontFamily: 'JetBrains Mono, monospace', fontWeight: 800, fontSize: '14px' }}>
                          {effectiveRisk}
                        </span>
                        {isHighRisk && (
                          <span style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--risk-critical)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '3px', fontSize: '9px', fontWeight: 800, padding: '1px 5px', fontFamily: 'JetBrains Mono, monospace' }}>
                            HIGH
                          </span>
                        )}
                      </div>
                    </td>

                    {/* FLAGS — card-style matching the image */}
                    <td style={{ padding: '8px 14px', maxWidth: '200px' }}>
                      {flags.length > 0 ? (
                        <div
                          style={{
                            background: 'rgba(239,68,68,0.06)',
                            border: '1px solid rgba(239,68,68,0.22)',
                            borderRadius: '5px',
                            padding: '5px 9px',
                            minWidth: '150px',
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--risk-critical)', marginBottom: '2px', lineHeight: 1.3 }}>
                            {getFlagTitle(flags[0])}
                          </div>
                          <div style={{ fontSize: '10px', color: 'rgba(239,68,68,0.75)', lineHeight: 1.3 }}>
                            {flags[1] ? getFlagTitle(flags[1]) : getFlagSubLabel(flags[0])}
                            {isHighRisk && (
                              <span style={{ marginLeft: '4px', color: 'rgba(239,68,68,0.6)' }}>(≥ 0.2 ETH)</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>—</span>
                      )}
                    </td>

                    {/* TIME */}
                    <td style={{ padding: '12px 14px', fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}
                    </td>

                    {/* BLOCK */}
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      #{tx.blockNumber}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    No transactions matching active filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <span>{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} shown</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{formatUSD(totalValue)}</strong></span>
          </div>
        )}
      </motion.div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTx}
        isOpen={selectedTx !== null}
        onClose={() => setSelectedTx(null)}
      />
    </motion.div>
  );
}
