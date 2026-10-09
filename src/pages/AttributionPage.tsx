import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronRight,
  Building2,
  ShieldCheck,
  FileText,
  Send,
  ExternalLink,
  Search,
  Scale,
} from 'lucide-react';
import { exchangeAttributions } from '../data/mockData';
import { getRiskColor, formatUSD } from '../utils/riskEngine';
import StatusBadge from '../components/ui/StatusBadge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
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

export default function AttributionPage() {
  const [selected, setSelected] = useState<string | null>(exchangeAttributions[0]?.id || null);
  const selectedAttr = exchangeAttributions.find((a) => a.id === selected);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAttributions = exchangeAttributions.filter(
    (a) =>
      a.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Banner */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Building2 size={20} style={{ color: 'var(--accent)' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Exchange Attribution Intelligence
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              Statutory VASP identification, KYC clustering, and on-chain exchange exposure analytics
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(66,153,225,0.12)',
                border: '1px solid rgba(66,153,225,0.3)',
                color: 'var(--accent)',
              }}
            >
              FIU-IND COMPLIANT REGISTRY
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '14px',
            padding: '10px 14px',
            background: 'rgba(214,158,46,0.08)',
            border: '1px solid rgba(214,158,46,0.25)',
            borderRadius: '7px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={15} style={{ color: '#d69e2e', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#d69e2e', lineHeight: 1.4 }}>
            Attribution confidence based on deterministic heuristics and deposit cluster heuristics. Section 91 CrPC / Section 102 BNSS legal process required for statutory VASP requests.
          </span>
        </div>
      </motion.div>

      {/* Summary KPI Cards */}
      {exchangeAttributions.length > 0 && (
        <motion.div
          variants={itemVariants}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}
        >
          {exchangeAttributions.slice(0, 4).map((attr) => (
            <motion.div
              key={attr.id}
              whileHover={{ y: -3 }}
              className="cyber-card"
              style={{ padding: '16px', cursor: 'pointer' }}
              onClick={() => setSelected(attr.id)}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: '6px',
                }}
              >
                {attr.entity}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {formatUSD(attr.exposureAmount)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                <StatusBadge status={attr.type} size="sm" />
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace',
                    color: getRiskColor(attr.confidence),
                  }}
                >
                  {attr.confidence}% conf.
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Main Content Area */}
      {exchangeAttributions.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="cyber-card"
          style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          <AlertTriangle size={36} style={{ color: 'var(--text-secondary)', opacity: 0.4, marginBottom: '10px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Exchange Attributions Registered
          </h3>
          <p style={{ margin: 0, fontSize: '13px' }}>
            No VASP deposit/withdrawal attributions recorded in the sovereign database.
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '20px', alignItems: 'start' }}>
          {/* Table of Attributions */}
          <motion.div variants={itemVariants} className="cyber-card" style={{ overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 700, fontSize: '13px' }}>
                  Registered VASP Clusters ({filteredAttributions.length})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={13}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-secondary)',
                    }}
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter VASPs..."
                    style={{
                      padding: '6px 12px 6px 28px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['Entity', 'Type', 'Exposure Amount', 'Confidence', 'Evidence', 'KYC Level', 'Jurisdiction', ''].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 14px',
                          textAlign: 'left',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAttributions.map((attr) => {
                    const isRowSelected = attr.id === selected;
                    return (
                      <tr
                        key={attr.id}
                        onClick={() => setSelected(isRowSelected ? null : attr.id)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isRowSelected ? 'rgba(66,153,225,0.08)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isRowSelected) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--bg-elevated)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = isRowSelected ? 'rgba(66,153,225,0.08)' : 'transparent';
                        }}
                      >
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{attr.entity}</td>
                        <td style={{ padding: '14px' }}>
                          <StatusBadge status={attr.type} />
                        </td>
                        <td
                          style={{
                            padding: '14px',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          {formatUSD(attr.exposureAmount)}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '70px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${attr.confidence}%`,
                                  background: getRiskColor(attr.confidence),
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: getRiskColor(attr.confidence),
                              }}
                            >
                              {attr.confidence}%
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{attr.evidenceCount} records</td>
                        <td style={{ padding: '14px' }}>
                          <StatusBadge status={attr.kycLevel} />
                        </td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)', fontSize: '12px' }}>{attr.jurisdiction}</td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <ChevronRight
                            size={16}
                            style={{
                              color: isRowSelected ? 'var(--accent)' : 'var(--text-secondary)',
                              transform: isRowSelected ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Attribution Evidence & Subpoena Action Drawer */}
          <AnimatePresence>
            {selectedAttr && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="cyber-card"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} style={{ color: '#38a169' }} />
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{selectedAttr.entity}</h3>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(66,153,225,0.12)',
                      color: 'var(--accent)',
                    }}
                  >
                    {selectedAttr.jurisdiction}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      marginBottom: '10px',
                    }}
                  >
                    Attribution Heuristics &amp; Cluster Evidence
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedAttr.supporting.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          padding: '10px 12px',
                          background: 'var(--bg-elevated)',
                          borderRadius: '7px',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--accent)',
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '11px',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => alert(`Generating Statutory Section 91 CrPC Notice for ${selectedAttr.entity}...`)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      borderRadius: '7px',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
                    }}
                  >
                    <Send size={14} /> Dispatch Section 91 / 102 Notice
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => alert(`Exporting forensic attribution packet for ${selectedAttr.entity}...`)}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '7px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FileText size={14} /> Export Attribution Dossier
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
