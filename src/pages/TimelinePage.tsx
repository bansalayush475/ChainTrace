import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, Shield, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/ui/StatusBadge';
import { truncateAddress } from '../utils/riskEngine';

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

const EVENT_COLORS: Record<string, string> = {
  TRANSACTION: '#4299e1',
  ALERT: '#b91c1c',
  INVESTIGATION_UPDATE: '#38a169',
  EVIDENCE_COLLECTED: '#9f7aea',
  PATTERN_DETECTED: '#ed8936',
  ATTRIBUTION: '#d69e2e',
  ESCALATION: '#b91c1c',
};

export default function TimelinePage() {
  const { timelineEvents } = useStore();

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
              <Clock size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Investigation Timeline
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
                CHRONO-FORENSIC RECONSTRUCTION
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Deterministic chronological log of forensic events, state changes, and evidence acquisitions
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {timelineEvents.length} Recorded Milestones
            </span>
          </div>
        </div>
      </motion.div>

      {timelineEvents.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Clock size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '14px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Timeline Events Recorded
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
            No forensic events or milestone actions have been recorded yet. Events will automatically populate chronologically as you investigate cases, discover attributions, or collect evidence.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {timelineEvents.map((event, idx) => {
            const color = EVENT_COLORS[event.eventType] ?? 'var(--accent)';
            return (
              <motion.div variants={itemVariants} key={event.id} style={{ display: 'flex', gap: '20px' }}>
                {/* Timeline spine */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0 }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: color,
                      border: '2px solid var(--bg-base)',
                      marginTop: '20px',
                      flexShrink: 0,
                      boxShadow: `0 0 10px ${color}80`,
                    }}
                  />
                  {idx < timelineEvents.length - 1 && (
                    <div style={{ width: '2px', flex: 1, background: 'var(--border)', marginTop: '6px' }} />
                  )}
                </div>

                {/* Event card */}
                <div style={{ flex: 1, paddingBottom: '16px' }}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="cyber-card"
                    style={{ padding: '16px 20px', transition: 'all 0.15s ease' }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11.5px',
                          color: 'var(--text-mono)',
                          background: 'var(--bg-elevated)',
                          padding: '3px 8px',
                          borderRadius: '5px',
                          border: '1px solid var(--border)',
                          fontWeight: 600,
                        }}
                      >
                        {event.timestamp.replace('T', ' ').slice(0, 19)} UTC
                      </span>
                      <StatusBadge status={event.eventType} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {event.investigationId}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, fontWeight: 500 }}>
                      {event.description}
                    </p>

                    {/* Tx hash */}
                    {event.txHash && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tx:</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>
                          {truncateAddress(event.txHash, 12)}
                        </span>
                      </div>
                    )}

                    {/* Amount */}
                    {event.amount && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Amount:</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
                          ${event.amount.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Wallet */}
                    {event.walletAddress && (
                      <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Wallet:</span>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-mono)' }}>
                          {truncateAddress(event.walletAddress, 10)}
                        </span>
                      </div>
                    )}

                    {/* Investigator note */}
                    {event.investigatorNote && (
                      <blockquote
                        style={{
                          margin: '12px 0 0',
                          padding: '10px 14px',
                          borderLeft: `3px solid ${color}`,
                          background: `${color}10`,
                          borderRadius: '0 6px 6px 0',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                        }}
                      >
                        {event.investigatorNote}
                      </blockquote>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
