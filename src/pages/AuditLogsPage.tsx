import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import DataTable from '../components/ui/DataTable';

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

export default function AuditLogsPage() {
  const { auditLogs, user } = useStore();
  const isJunior = user?.roleType === 'JUNIOR';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Only show LOGIN and LOGOUT entries — all other actions are internal system events
  const sessionLogs = auditLogs.filter(
    (l) => l.action === 'LOGIN' || l.action === 'LOGOUT'
  );

  const filtered = sessionLogs.filter((log) => {
    if (dateFrom && log.timestamp < dateFrom) return false;
    if (dateTo && log.timestamp > dateTo + 'T23:59:59') return false;
    return true;
  });

  function handleExportLogs() {
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Details'];
    const rows = filtered.map((l) => [
      `"${l.timestamp}"`,
      `"${l.user}"`,
      `"${l.action}"`,
      `"${l.resource.replace(/"/g, '""')}"`,
      `"${l.ip}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chaintrace_session_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const columns = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>
          {String(v).replace('T', ' ').slice(0, 19)} UTC
        </span>
      ),
      sortable: true,
    },
    { key: 'user', label: 'User', sortable: true },
    {
      key: 'action',
      label: 'Session Event',
      render: (v: unknown) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 12px',
            borderRadius: '4px',
            background: String(v) === 'LOGIN'
              ? 'rgba(56,161,105,0.18)'
              : 'rgba(239,68,68,0.12)',
            color: String(v) === 'LOGIN' ? '#38a169' : '#ef4444',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
          }}
        >
          {String(v) === 'LOGIN' ? '▶ LOGIN' : '⏹ LOGOUT'}
        </span>
      ),
    },
    {
      key: 'resource',
      label: 'Resource',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>
          {String(v).length > 24 ? `${String(v).slice(0, 24)}...` : String(v)}
        </span>
      ),
    },
    {
      key: 'ip',
      label: 'IP Address',
      render: (v: unknown) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{String(v)}</span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (v: unknown) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{String(v)}</span>
      ),
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
              <History size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Session Audit Logs</h1>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isJunior ? 'rgba(56,161,105,0.12)' : 'rgba(37,99,235,0.12)',
                  border: `1px solid ${isJunior ? 'rgba(56,161,105,0.3)' : 'rgba(37,99,235,0.3)'}`,
                  color: isJunior ? '#15803d' : 'var(--accent)',
                  letterSpacing: '0.06em',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {isJunior ? 'LEVEL-2 CONFIDENTIAL' : 'LEVEL-4 UNRESTRICTED'}
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Immutable record of user login and logout sessions — who accessed the system and when.
            </p>
          </div>

          {isJunior ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '7px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Download size={14} /> Export My Session Logs
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExportLogs}
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
              <Download size={14} /> Export Session Log (CSV)
            </motion.button>
          )}
        </div>

        {isJunior && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(56,161,105,0.08)', border: '1px solid rgba(56,161,105,0.2)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#38a169' }}>ANALYST CLEARANCE (LEVEL-2):</strong> You are authorized to review session audit logs. High-privilege actions require Senior Lead sign-off under Cyber Crime Division Policy 14.
          </div>
        )}
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Session Events', value: sessionLogs.length, color: 'var(--accent)' },
          { label: 'Login Events', value: sessionLogs.filter((l) => l.action === 'LOGIN').length, color: '#38a169' },
          { label: 'Logout Events', value: sessionLogs.filter((l) => l.action === 'LOGOUT').length, color: '#ef4444' },
        ].map((stat) => (
          <div key={stat.label} className="cyber-card" style={{ padding: '14px 20px', flex: 1, minWidth: '140px' }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color, fontFamily: 'JetBrains Mono, monospace' }}>{stat.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* Date Filters */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '14px 18px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>From:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', colorScheme: 'dark' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>To:</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none', colorScheme: 'dark' }}
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {sessionLogs.length} session events
        </span>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '14px' }}>
        <DataTable
          columns={columns as Parameters<typeof DataTable>[0]['columns']}
          data={filtered as unknown as Record<string, unknown>[]}
          pageSize={15}
        />
      </motion.div>
    </motion.div>
  );
}
