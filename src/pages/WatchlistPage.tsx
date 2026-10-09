import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Eye, Bell, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import { truncateAddress, getRiskColor } from '../utils/riskEngine';
import type { WatchlistItem } from '../data/mockData';

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

export default function WatchlistPage() {
  const { watchlistItems, addToWatchlist, removeFromWatchlist, toggleWatchlistAlerts } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newTarget, setNewTarget] = useState('');
  const [newType, setNewType] = useState('WALLET');

  function handleAdd() {
    if (!newTarget.trim()) return;
    addToWatchlist(newTarget.trim(), newType as WatchlistItem['targetType']);
    setNewTarget('');
    setShowAdd(false);
  }

  const columns = [
    {
      key: 'target',
      label: 'Target',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-mono)' }}>
          {truncateAddress(String(v), 10)}
        </span>
      ),
    },
    { key: 'targetType', label: 'Type', render: (v: unknown) => <StatusBadge status={String(v)} /> },
    {
      key: 'riskScore',
      label: 'Risk Score',
      render: (v: unknown) => (
        <span style={{ color: getRiskColor(Number(v)), fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{String(v)}</span>
      ),
      sortable: true,
    },
    {
      key: 'lastActivity',
      label: 'Last Activity',
      render: (v: unknown) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>,
      sortable: true,
    },
    {
      key: 'alertsEnabled',
      label: 'Alerts',
      render: (v: unknown, row: unknown) => {
        const item = row as WatchlistItem;
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleWatchlistAlerts(item.id);
            }}
            style={{
              width: '36px', height: '20px', borderRadius: '10px',
              background: Boolean(v) ? '#38a169' : 'var(--border)',
              position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: '2px', left: Boolean(v) ? '18px' : '2px',
              width: '16px', height: '16px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
            }} />
          </div>
        );
      },
    },
    { key: 'addedBy', label: 'Added By' },
    {
      key: 'addedAt',
      label: 'Added',
      render: (v: unknown) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(String(v)).toLocaleDateString()}</span>,
      sortable: true,
    },
    {
      key: 'id',
      label: '',
      render: (v: unknown, row: unknown) => {
        const item = row as WatchlistItem;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFromWatchlist(item.target);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--risk-critical)', display: 'flex', padding: '4px' }}
          >
            <Trash2 size={14} />
          </button>
        );
      },
    },
  ];

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
              <Eye size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Watchlist Monitor</h1>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: 'rgba(56,161,105,0.12)',
                  border: '1px solid rgba(56,161,105,0.3)',
                  color: '#38a169',
                }}
              >
                ACTIVE MEMPOOL SURVEILLANCE
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Live real-time surveillance of high-risk suspect wallets, clusters, and statutory target entities
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: '7px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}
          >
            <Plus size={15} /> ADD TO WATCHLIST
          </motion.button>
        </div>
      </motion.div>

      {/* Table Card */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '16px' }}>
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          data={watchlistItems as unknown as Record<string, unknown>[]}
          searchable
          pageSize={10}
        />
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{ width: '450px', maxWidth: '90vw', overflow: 'hidden' }}
            >
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Add Target to Watchlist</h3>
                <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={16} /></button>
              </div>
              <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>TARGET ADDRESS / ID</label>
                  <input
                    value={newTarget}
                    onChange={(e) => setNewTarget(e.target.value)}
                    placeholder="0x... or bc1q... or case ID"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>ENTITY TYPE</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                    {['WALLET', 'TRANSACTION', 'CLUSTER', 'CASE', 'VASP'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button onClick={handleAdd} style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Add to Watchlist</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
