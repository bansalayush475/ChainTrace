import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Bell, Search, X, Plus, Copy, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { truncateAddress } from '../../utils/riskEngine';
import type { Alert } from '../../data/mockData';

interface AlertCardProps {
  alert: Alert;
  onInvestigate?: () => void;
  onDismiss?: () => void;
  onAddToCase?: () => void;
  compact?: boolean;
}

const severityBorder: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.35)',
  HIGH: 'rgba(245,158,11,0.35)',
  MEDIUM: 'rgba(234,179,8,0.3)',
  LOW: 'rgba(16,185,129,0.3)',
};

export default function AlertCard({ alert, onInvestigate, onDismiss, onAddToCase, compact = false }: AlertCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(alert.walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: alert.dismissed ? 0.45 : 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${severityBorder[alert.severity] ?? 'var(--border)'}`,
        borderRadius: '8px',
        padding: compact ? '10px 12px' : '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        position: 'relative',
        boxShadow: alert.severity === 'CRITICAL' ? '0 0 14px rgba(239,68,68,0.08)' : 'var(--card-shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      className="cyber-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge status={alert.severity} dot />
          <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
            {alert.type}
          </span>
        </div>
        <span style={{ color: 'var(--text-secondary)', fontSize: '10.5px', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>
          {new Date(alert.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.4, fontWeight: 500 }}>
        {alert.message}
      </div>

      {/* Wallet address chip with copy */}
      <div
        onClick={handleCopy}
        title="Click to copy suspect wallet"
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          color: 'var(--text-mono)',
          fontSize: '11px',
          background: 'rgba(56,189,248,0.06)',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid rgba(56,189,248,0.18)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          cursor: 'pointer',
          alignSelf: 'flex-start',
          transition: 'all 0.15s ease',
        }}
      >
        <span>{truncateAddress(alert.walletAddress, 10)}</span>
        {copied ? (
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
            <Check size={11} /> Copied
          </span>
        ) : (
          <Copy size={11} style={{ opacity: 0.7 }} />
        )}
      </div>

      {!compact && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {onInvestigate && (
            <button
              onClick={onInvestigate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(56,189,248,0.12)',
                color: 'var(--accent)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56,189,248,0.22)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56,189,248,0.12)';
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)';
              }}
            >
              <Search size={11} /> Investigate
            </button>
          )}
          {onAddToCase && (
            <button
              onClick={onAddToCase}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'rgba(245,158,11,0.1)',
                color: 'var(--risk-high)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(245,158,11,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
              }}
            >
              <Plus size={11} /> Add to Case
            </button>
          )}
          {onDismiss && !alert.dismissed && (
            <button
              onClick={onDismiss}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '5px',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <X size={11} /> Dismiss
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
