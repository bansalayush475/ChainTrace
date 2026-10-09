import React from 'react';

type StatusType = string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md';
  dot?: boolean;
}

function getStatusStyle(status: string): { bg: string; color: string; label: string } {
  switch (status.toUpperCase()) {
    case 'CRITICAL': return { bg: 'rgba(239,68,68,0.08)', color: 'var(--risk-critical)', label: 'CRITICAL' };
    case 'HIGH': return { bg: 'rgba(245,158,11,0.08)', color: 'var(--risk-high)', label: 'HIGH' };
    case 'MEDIUM': return { bg: 'rgba(234,179,8,0.08)', color: 'var(--risk-medium)', label: 'MEDIUM' };
    case 'LOW': return { bg: 'rgba(16,185,129,0.08)', color: 'var(--risk-low)', label: 'LOW' };
    case 'ONLINE': return { bg: 'rgba(16,185,129,0.08)', color: 'var(--risk-low)', label: 'ONLINE' };
    case 'OFFLINE': return { bg: 'rgba(239,68,68,0.08)', color: 'var(--risk-critical)', label: 'OFFLINE' };
    case 'DEGRADED': return { bg: 'rgba(245,158,11,0.08)', color: 'var(--risk-high)', label: 'DEGRADED' };
    case 'NEW': return { bg: 'rgba(56,189,248,0.08)', color: 'var(--accent)', label: 'NEW' };
    case 'ANALYZING': return { bg: 'rgba(56,189,248,0.08)', color: 'var(--accent)', label: 'ANALYZING' };
    case 'UNDER_INVESTIGATION': return { bg: 'rgba(234,179,8,0.08)', color: 'var(--risk-medium)', label: 'INVESTIGATING' };
    case 'ESCALATED': return { bg: 'rgba(239,68,68,0.08)', color: 'var(--risk-critical)', label: 'ESCALATED' };
    case 'CLOSED': return { bg: 'rgba(113,128,150,0.1)', color: 'var(--text-secondary)', label: 'CLOSED' };
    case 'VERIFIED': return { bg: 'rgba(16,185,129,0.08)', color: 'var(--risk-low)', label: 'VERIFIED' };
    case 'PENDING': return { bg: 'rgba(234,179,8,0.08)', color: 'var(--risk-medium)', label: 'PENDING' };
    case 'FAILED': return { bg: 'rgba(239,68,68,0.08)', color: 'var(--risk-critical)', label: 'FAILED' };
    default: return { bg: 'rgba(136,146,160,0.08)', color: 'var(--text-secondary)', label: status };
  }
}

export default function StatusBadge({ status, size = 'sm', dot = false }: StatusBadgeProps) {
  const style = getStatusStyle(status);
  const padding = size === 'sm' ? '2px 8px' : '4px 12px';
  const fontSize = size === 'sm' ? '10px' : '11.5px';
  const isPulseStatus = ['CRITICAL', 'ONLINE', 'ANALYZING', 'UNDER_INVESTIGATION', 'ESCALATED', 'LIVE'].includes(status.toUpperCase());

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.color}35`,
        borderRadius: '4px',
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        fontFamily: 'JetBrains Mono, monospace',
        boxShadow: isPulseStatus ? `0 0 8px ${style.color}20` : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      {(dot || isPulseStatus) && (
        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '8px', height: '8px', flexShrink: 0 }}>
          {isPulseStatus && (
            <span
              className="radar-ping-ring"
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: style.color,
                opacity: 0.6,
              }}
            />
          )}
          <span
            style={{
              position: 'relative',
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: style.color,
              boxShadow: `0 0 6px ${style.color}`,
            }}
          />
        </span>
      )}
      {style.label}
    </span>
  );
}
