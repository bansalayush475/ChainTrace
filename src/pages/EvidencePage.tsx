import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Eye, FileText, Filter, Plus, X, ShieldCheck, CheckCircle2, Sparkles, Hash } from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/ui/StatusBadge';
import type { Evidence } from '../data/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const TYPE_OPTIONS = ['ALL', 'TRANSACTION_RECORD', 'WALLET_SNAPSHOT', 'EXCHANGE_RECORD', 'CLUSTER_ANALYSIS', 'PATTERN_REPORT', 'BLOCKCHAIN_EXPORT'];

export default function EvidencePage() {
  const navigate = useNavigate();
  const { evidence, addEvidence, investigations, user } = useStore();
  const isJunior = user?.roleType === 'JUNIOR';
  const myNameLower = (user?.name || 'priya').toLowerCase();

  // In Junior mode, strictly isolate to their specific assigned investigations
  // In Senior mode, show evidence across all team investigations
  const myInvestigations = isJunior
    ? investigations.filter(
        (inv) =>
          inv.investigator.toLowerCase().includes('priya') ||
          inv.investigator.toLowerCase() === myNameLower
      )
    : investigations;
  const myInvIds = new Set(myInvestigations.map((i) => i.id));

  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    description: '',
    type: 'TRANSACTION_RECORD' as Evidence['type'],
    investigationId: '',
    source: 'Primary Validator Node',
    fileName: '',
  });

  const filtered = evidence.filter((ev) => {
    if (isJunior && !myInvIds.has(ev.investigationId)) return false;
    if (typeFilter !== 'ALL' && ev.type !== typeFilter) return false;
    if (search && !ev.description.toLowerCase().includes(search.toLowerCase()) && !ev.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleDownloadEvidence(ev: Evidence) {
    const data = {
      evidenceId: ev.id,
      timestamp: ev.timestamp,
      integrity: ev.integrity,
      type: ev.type,
      description: ev.description,
      sha256Hash: ev.hash,
      source: ev.source,
      size: ev.size,
      investigationId: ev.investigationId,
      verificationAuthority: 'ChainTrace Hardware Security Module (HSM) v2',
      cryptographicSignature: `SIG_${Math.random().toString(16).substring(2, 66)}`,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ev.id}_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCreateEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.description.trim()) return;

    const sha256ProofHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    addEvidence({
      type: addForm.type,
      description: addForm.description.trim(),
      hash: sha256ProofHash,
      source: addForm.source.trim() || 'ChainTrace Validator Node',
      investigationId: addForm.investigationId || (myInvestigations[0]?.id ?? 'INV-002'),
      size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
      integrity: 'VERIFIED',
    });

    setAddForm({
      description: '',
      type: 'TRANSACTION_RECORD',
      investigationId: '',
      source: 'Primary Validator Node',
      fileName: '',
    });
    setShowAddModal(false);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Top Banner */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <ShieldCheck size={22} style={{ color: '#38a169' }} />
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Evidence Vault</h1>
              {isJunior ? (
                <span style={{ background: 'rgba(56,161,105,0.12)', color: '#38a169', border: '1px solid rgba(56,161,105,0.3)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  🔍 LEVEL-2 COMPARTMENTALIZED (PRIYA PATEL)
                </span>
              ) : (
                <span style={{ background: 'rgba(214,158,46,0.12)', color: '#d69e2e', border: '1px solid rgba(214,158,46,0.3)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  🛡️ LEVEL-4 ALL TEAM EVIDENCE
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              {isJunior
                ? 'Cryptographic evidence manifests attached to your assigned investigations (Priya Patel).'
                : 'Tamper-evident evidence repository with blockchain integrity verification across all team investigations.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: 'rgba(56,161,105,0.1)', color: '#38a169', border: '1px solid rgba(56,161,105,0.3)', borderRadius: '20px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
              ✓ {filtered.filter((e) => e.integrity === 'VERIFIED').length} SHA-256 VERIFIED
            </span>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 18px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                border: 'none', borderRadius: '7px', color: '#fff',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
              }}
            >
              <Plus size={15} /> REGISTER EVIDENCE
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter bar */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ display: 'flex', gap: '10px', padding: '12px 18px', alignItems: 'center' }}>
        <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search evidence records or hashes..."
          style={{ flex: '0 1 320px', padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12.5px', outline: 'none' }}
        >
          {TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o === 'ALL' ? 'All Evidence Types' : o.replace(/_/g, ' ')}</option>)}
        </select>
      </motion.div>

      {/* Evidence grid */}
      {filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>No Evidence Preserved Yet</p>
          <span style={{ fontSize: '12px' }}>Digital evidence hashes, wallet snapshots, and transaction records will appear here as you conduct investigations.</span>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filtered.map((ev) => (
            <motion.div
              key={ev.id}
              whileHover={{ y: -3 }}
              className="cyber-card"
              style={{
                border: `1px solid ${ev.integrity === 'VERIFIED' ? 'rgba(56,161,105,0.25)' : ev.integrity === 'FAILED' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>{ev.id}</span>
                <StatusBadge status={ev.integrity} dot />
              </div>

              {/* Type badge */}
              <div>
                <StatusBadge status={ev.type} size="sm" />
              </div>

              {/* Description */}
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45, fontWeight: 500 }}>{ev.description}</p>

              {/* Hash */}
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px' }}>
                <div style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>SHA-256 INTEGRITY HASH</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10.5px', color: 'var(--text-mono)', wordBreak: 'break-all' }}>{ev.hash}</div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{ev.source}</span>
                <span>{ev.size}</span>
                <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedEvidence(ev)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    padding: '7px 0', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '5px', color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <Eye size={11} /> View
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDownloadEvidence(ev)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    padding: '7px 0', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '5px', color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <Download size={11} /> Download
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/reports?case=${ev.investigationId}`)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                    padding: '7px 0', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '5px', color: 'var(--accent)', fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  <FileText size={11} /> Report
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* View Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{ width: '500px', maxWidth: '90vw', overflow: 'hidden', padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: '#38a169' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Evidence Details ({selectedEvidence.id})</h3>
                </div>
                <button onClick={() => setSelectedEvidence(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>TYPE</span>
                  <div style={{ marginTop: '2px' }}><StatusBadge status={selectedEvidence.type} /></div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>DESCRIPTION</span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-primary)' }}>{selectedEvidence.description}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>CRYPTOGRAPHIC INTEGRITY HASH (SHA-256)</span>
                  <div style={{ background: 'var(--bg-elevated)', padding: '10px', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', wordBreak: 'break-all', marginTop: '4px', color: 'var(--text-mono)' }}>{selectedEvidence.hash}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>ORIGIN SOURCE</span>
                    <div style={{ fontWeight: 600 }}>{selectedEvidence.source}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>STATUS</span>
                    <div style={{ color: '#38a169', fontWeight: 700 }}>✓ {selectedEvidence.integrity}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setSelectedEvidence(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Close</button>
                <button onClick={() => { handleDownloadEvidence(selectedEvidence); setSelectedEvidence(null); }} style={{ padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Download Manifest</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Evidence Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{ width: '520px', maxWidth: '90vw', overflow: 'hidden' }}
            >
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Register Forensic Evidence</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateEvidence} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>EVIDENCE DESCRIPTION *</label>
                  <input
                    required
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="e.g. Smart contract execution logs showing reentrancy drain"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>EVIDENCE TYPE</label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value as any })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    >
                      {TYPE_OPTIONS.filter((o) => o !== 'ALL').map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>INVESTIGATION REFERENCE</label>
                    <select
                      value={addForm.investigationId}
                      onChange={(e) => setAddForm({ ...addForm, investigationId: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="">Select Case...</option>
                      {myInvestigations.map((i) => <option key={i.id} value={i.id}>{i.caseId} - {i.title.slice(0, 20)}...</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>ORIGINATING SOURCE</label>
                  <input
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    placeholder="e.g. Alchemy Archive Node / Binance API Export"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>UPLOAD DOCUMENT (OPTIONAL)</label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.zip,.csv,.txt"
                    onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                          setAddForm({ ...addForm, fileName: file.name });
                       }
                    }}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-elevated)', border: '1px dashed var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '12px', outline: 'none', boxSizing: 'border-box', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Supported formats: PDF, Images, CSV, ZIP, TXT. Hash will be generated.</span>
                </div>
                <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}>Save Evidence</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
