import React, { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  variant?: 'critical' | 'warning' | 'safe' | 'blue' | 'default';
  sparklineData?: number[];
  subtitle?: string;
}

function getVariantColors(variant: KpiCardProps['variant']) {
  switch (variant) {
    case 'critical': return { accent: 'var(--risk-critical)', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.25)', glow: 'rgba(239,68,68,0.15)' };
    case 'warning': return { accent: 'var(--risk-high)', bg: 'rgba(237,137,54,0.08)', border: 'rgba(237,137,54,0.25)', glow: 'rgba(237,137,54,0.15)' };
    case 'safe': return { accent: 'var(--risk-low)', bg: 'rgba(56,161,105,0.08)', border: 'rgba(56,161,105,0.25)', glow: 'rgba(56,161,105,0.15)' };
    case 'blue': return { accent: 'var(--accent)', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)', glow: 'rgba(56,189,248,0.15)' };
    default: return { accent: 'var(--text-secondary)', bg: 'rgba(136,146,160,0.05)', border: 'var(--border)', glow: 'rgba(0,0,0,0.1)' };
  }
}

export default function KpiCard({ title, value, change, icon, variant = 'default', sparklineData, subtitle }: KpiCardProps) {
  const colors = getVariantColors(variant);
  const sparkData = sparklineData?.map((v) => ({ v })) ?? [];

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  const isNumeric = typeof value === 'number' && !isNaN(numericValue);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isNumeric) return;
    let start = 0;
    const duration = 1000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.floor(eased * numericValue));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [numericValue, isNumeric]);

  const shown = isNumeric ? displayValue.toLocaleString() : value;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15, ease: 'easeOut' } }}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      className="cyber-card"
    >
      {/* Top accent glow line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${colors.accent} 0%, transparent 100%)`,
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          color: 'var(--text-secondary)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {title}
        </span>
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '6px',
          background: `${colors.accent}15`,
          border: `1px solid ${colors.accent}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accent,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: String(shown).length > 7 ? '21px' : '25px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            title={String(shown)}
          >
            {shown}
          </div>
          {subtitle && (
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Sparkline */}
        {sparkData.length > 0 && (
          <div style={{ width: 68, height: 28, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="v" stroke={colors.accent} strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
          <span style={{
            color: change >= 0 ? 'var(--risk-critical)' : 'var(--risk-low)',
            fontWeight: 700,
            background: change >= 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            padding: '1px 5px',
            borderRadius: '3px',
          }}>
            {change >= 0 ? '▲ +' : '▼ -'}{Math.abs(change)}%
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '10.5px' }}>vs 24h baseline</span>
        </div>
      )}
    </motion.div>
  );
}
