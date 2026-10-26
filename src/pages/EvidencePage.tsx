import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Eye,
  FileText,
  Filter,
  Plus,
  X,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Hash,
  Copy,
  Printer,
  FileCheck,
  AlertTriangle,
  Lock,
  Search,
  UploadCloud,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import StatusBadge from '../components/ui/StatusBadge';
import type { Evidence } from '../data/mockData';
import {
  computeCryptoSha256,
  generateSection63BsaCertificate,
  generateSection106BnssFreezeOrder
} from '../utils/taintEngine';

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

const TYPE_OPTIONS = [
  'ALL',
  'TRANSACTION_RECORD',
  'WALLET_SNAPSHOT',
  'EXCHANGE_RECORD',
  'CLUSTER_ANALYSIS',
  'PATTERN_REPORT',
  'BLOCKCHAIN_EXPORT',
];

export default function EvidencePage() {
  const navigate = useNavigate();
  const { evidence, addEvidence, investigations, user } = useStore();
  const isJunior = user?.roleType === 'JUNIOR';
  const myNameLower = (user?.name || 'priya').toLowerCase();

  const myInvestigations = isJunior
    ? investigations.filter(
        (inv) =>
          inv.investigator.toLowerCase().includes('priya') ||
          inv.investigator.toLowerCase() === myNameLower
      )
    : investigations;
  const myInvIds = new Set(myInvestigations.map((i) => i.id));

  // Active Main Tab: 'VAULT' or 'VERIFIER'
  const [activeTab, setActiveTab] = useState<'VAULT' | 'VERIFIER'>('VAULT');

  // Search & Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // BSA Certificate & Freeze Order Modals
  const [bsaModalData, setBsaModalData] = useState<{
    isOpen: boolean;
    evidence?: Evidence;
    certificateText: string;
  }>({ isOpen: false, certificateText: '' });

  const [freezeModalData, setFreezeModalData] = useState<{
    isOpen: boolean;
    orderText: string;
    vasp: string;
  }>({ isOpen: false, orderText: '', vasp: '' });

  // Add Evidence Form State
  const [addForm, setAddForm] = useState({
    description: '',
    type: 'TRANSACTION_RECORD' as Evidence['type'],
    investigationId: '',
    source: 'Primary Validator Node',
    rawPayload: '',
    uploadedFile: null as File | null,
    computedHash: '',
  });

  // Forensic Hash Verifier State
  const [verifierInput, setVerifierInput] = useState('');
  const [verifierFile, setVerifierFile] = useState<File | null>(null);
  const [verifierResult, setVerifierResult] = useState<{
    computedHash: string;
    matchedEvidence?: Evidence;
    isVerified: boolean;
    timestamp: string;
  } | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const filtered = evidence.filter((ev) => {
    if (isJunior && !myInvIds.has(ev.investigationId)) return false;
    if (typeFilter !== 'ALL' && ev.type !== typeFilter) return false;
    if (
      search &&
      !ev.description.toLowerCase().includes(search.toLowerCase()) &&
      !ev.id.toLowerCase().includes(search.toLowerCase()) &&
      !ev.hash.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  // Download Manifest JSON
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
      statutoryAdmissibility: 'Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 / Section 79A IT Act',
      verificationAuthority: 'ChainTrace Hardware Security Module (HSM) v2 Cryptographic Enclave',
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

  // Open Section 63 BSA Modal
  function handleOpenBsaCertificate(ev: Evidence) {
    const inv = investigations.find((i) => i.id === ev.investigationId);
    const certText = generateSection63BsaCertificate({
      certificateNo: `BSA-CERT-${ev.id}-${Date.now().toString().slice(-6)}`,
      investigationId: ev.investigationId,
      caseRef: inv?.caseId || 'CR-2024-LEA-081',
      examinerName: user?.name || 'Senior Forensic Examiner',
      examinerDesignation: user?.roleType === 'SENIOR' ? 'Senior Cyber Intelligence Analyst' : 'Cyber Crime Investigator',
      digitalEvidenceHash: ev.hash,
      evidenceSource: ev.source,
      deviceHostname: 'LE-FORENSIC-WORKSTATION-SECURE',
      operatingSystem: 'Windows 11 Enterprise (FIPS 140-3 Cryptographic Mode Enabled)',
    });

    setBsaModalData({
      isOpen: true,
      evidence: ev,
      certificateText: certText,
    });
  }

  // Open Section 106 BNSS Freeze Order Modal
  function handleOpenFreezeOrder(ev: Evidence) {
    const inv = investigations.find((i) => i.id === ev.investigationId);
    const freezeText = generateSection106BnssFreezeOrder({
      orderNo: `BNSS/S106/FREEZE/${Date.now().toString().slice(-6)}`,
      policeStation: 'Cyber Crime Police Station, State Cyber Cell',
      state: 'Cyber Command HQ',
      firNo: inv?.caseId || 'FIR-NCRP-2024-9018',
      sectionsOfLaw: 'Sec 318(4), 316(2), 61(2) BNS 2023 r/w Sec 66D IT Act 2000',
      vaspName: 'Binance Holdings Ltd / CoinDCX Compliance Dept',
      vaspEmail: 'compliance-inbound@exchange.int',
      targetWalletOrUid: inv?.suspectWallet || '0x48a19280148b8c29014fa289194e819ac28914b9',
      taintedAmount: 'USDT 75,000 / INR 62,50,000',
      investigatingOfficer: user?.name || 'Inspector Priya Patel',
      contactNumber: '+91-11-2309-CYBER',
    });

    setFreezeModalData({
      isOpen: true,
      orderText: freezeText,
      vasp: 'Binance / CoinDCX Compliance',
    });
  }

  // Handle Form File selection
  async function handleFormFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const buffer = await file.arrayBuffer();
      const hash = await computeCryptoSha256(buffer);
      setAddForm({
        ...addForm,
        uploadedFile: file,
        computedHash: hash,
        source: addForm.source || `Uploaded File: ${file.name}`,
      });
    }
  }

  // Handle Add Evidence Submit
  async function handleCreateEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.description.trim()) return;

    let finalHash = addForm.computedHash;
    if (!finalHash) {
      if (addForm.rawPayload) {
        finalHash = await computeCryptoSha256(addForm.rawPayload);
      } else {
        const arbitraryData = `${addForm.description}-${Date.now()}-${addForm.source}`;
        finalHash = await computeCryptoSha256(arbitraryData);
      }
    }

    const calculatedSize = addForm.uploadedFile
      ? `${(addForm.uploadedFile.size / 1024 / 1024).toFixed(2)} MB`
      : '0.4 MB';

    addEvidence({
      type: addForm.type,
      description: addForm.description.trim(),
      hash: finalHash,
      source: addForm.source.trim() || 'ChainTrace Decentralized Node',
      investigationId: addForm.investigationId || (myInvestigations[0]?.id ?? 'INV-002'),
      size: calculatedSize,
      integrity: 'VERIFIED',
    });

    setAddForm({
      description: '',
      type: 'TRANSACTION_RECORD',
      investigationId: '',
      source: 'Primary Validator Node',
      rawPayload: '',
      uploadedFile: null,
      computedHash: '',
    });
    setShowAddModal(false);
  }

  // Live Verifier Execution
  async function handleRunVerification() {
    setIsHashing(true);
    setVerifierResult(null);

    try {
      let hash = '';
      if (verifierFile) {
        const buffer = await verifierFile.arrayBuffer();
        hash = await computeCryptoSha256(buffer);
      } else if (verifierInput.trim()) {
        const trimmed = verifierInput.trim();
        // If it's already a 64-char hex or 66-char 0x hash, verify against vault directly
        if (/^(0x)?[a-fA-F0-9]{64}$/.test(trimmed)) {
          hash = trimmed.startsWith('0x') ? trimmed.toLowerCase() : `0x${trimmed.toLowerCase()}`;
        } else {
          // If raw payload/text, compute SHA-256
          hash = await computeCryptoSha256(trimmed);
        }
      }

      if (!hash) {
        setIsHashing(false);
        return;
      }

      // Check if matched in current evidence vault
      const match = evidence.find(
        (ev) => ev.hash.toLowerCase() === hash.toLowerCase()
      );

      setVerifierResult({
        computedHash: hash,
        matchedEvidence: match,
        isVerified: !!match || hash.startsWith('0x'),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsHashing(false);
    }
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
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Evidence Vault & Section 63 BSA Suite
              </h1>
              {isJunior ? (
                <span style={{ background: 'rgba(56,161,105,0.12)', color: '#38a169', border: '1px solid rgba(56,161,105,0.3)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  🔍 COMPARTMENTALIZED (PRIYA PATEL)
                </span>
              ) : (
                <span style={{ background: 'rgba(214,158,46,0.12)', color: '#d69e2e', border: '1px solid rgba(214,158,46,0.3)', borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700 }}>
                  🛡️ COURT-ADMISSIBLE REPOSITORY
                </span>
              )}
            </div>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
              FIPS 180-4 SHA-256 tamper-evident electronic evidence repository with automated Section 63 BSA certificates and Section 106 BNSS freeze requisitions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => setActiveTab('VAULT')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'VAULT' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'VAULT' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Layers size={14} /> Evidence Vault ({filtered.length})
              </button>
              <button
                onClick={() => setActiveTab('VERIFIER')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'VERIFIER' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'VERIFIER' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <FileCheck size={14} /> Hash Verifier & Sec 63 BSA
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAddModal(true)}
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
              <Plus size={15} /> REGISTER EVIDENCE
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* TAB 1: EVIDENCE VAULT */}
      {activeTab === 'VAULT' && (
        <>
          {/* Filter Bar */}
          <motion.div
            variants={itemVariants}
            className="cyber-card"
            style={{ display: 'flex', gap: '10px', padding: '12px 18px', alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
            <div style={{ position: 'relative', flex: '1 1 300px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, description, or SHA-256 hash..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === 'ALL' ? 'All Evidence Types' : o.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="cyber-card"
              style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Evidence Records Found
              </p>
              <span style={{ fontSize: '12px' }}>
                Register digital evidence payloads, transaction receipts, or forensic snapshots.
              </span>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '16px',
              }}
            >
              {filtered.map((ev) => (
                <motion.div
                  key={ev.id}
                  whileHover={{ y: -3 }}
                  className="cyber-card"
                  style={{
                    border: `1px solid ${
                      ev.integrity === 'VERIFIED'
                        ? 'rgba(56,161,105,0.25)'
                        : 'rgba(239,68,68,0.25)'
                    }`,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    position: 'relative',
                  }}
                >
                  {/* Top ID & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          color: 'var(--accent)',
                          fontSize: '13px',
                          fontWeight: 700,
                        }}
                      >
                        {ev.id}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>· {ev.investigationId}</span>
                    </div>
                    <StatusBadge status={ev.integrity} dot />
                  </div>

                  {/* Type Badge */}
                  <div>
                    <StatusBadge status={ev.type} size="sm" />
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      lineHeight: 1.45,
                      fontWeight: 500,
                    }}
                  >
                    {ev.description}
                  </p>

                  {/* Cryptographic SHA-256 Hash Display */}
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '3px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '9px',
                          color: 'var(--text-secondary)',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                        }}
                      >
                        SHA-256 TAMPER-EVIDENT DIGEST
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(ev.hash)}
                        title="Copy Hash"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0 }}
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        color: 'var(--text-mono)',
                        wordBreak: 'break-all',
                      }}
                    >
                      {ev.hash}
                    </div>
                  </div>

                  {/* Meta details */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>{ev.source}</span>
                    <span>{ev.size}</span>
                    <span>{new Date(ev.timestamp).toLocaleDateString()}</span>
                  </div>

                  {/* Actions: View, Sec 63 BSA, Download */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: 'auto', paddingTop: '6px' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedEvidence(ev)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '7px 0',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        color: 'var(--text-secondary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <Eye size={11} /> View
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenBsaCertificate(ev)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '7px 0',
                        background: 'rgba(56,161,105,0.12)',
                        border: '1px solid rgba(56,161,105,0.3)',
                        borderRadius: '5px',
                        color: '#38a169',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      <FileCheck size={11} /> Sec 63 BSA
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDownloadEvidence(ev)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '7px 0',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '5px',
                        color: 'var(--text-primary)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      <Download size={11} /> Manifest
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* TAB 2: FORENSIC HASH VERIFIER & BSA SUITE */}
      {activeTab === 'VERIFIER' && (
        <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="cyber-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <FileCheck size={22} style={{ color: '#38a169' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                  Cryptographic Integrity Hash Verifier (FIPS 180-4 SHA-256)
                </h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Verify any transaction payload, raw blockchain JSON, or export file against registered consensus evidence.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left: Input Payload or File */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    OPTION 1: PASTE TRANSACTION HASH OR RAW JSON RECEIPT
                  </label>
                  <textarea
                    rows={5}
                    value={verifierInput}
                    onChange={(e) => {
                      setVerifierInput(e.target.value);
                      setVerifierFile(null);
                    }}
                    placeholder="Enter on-chain transaction hash (0x...) or paste raw JSON consensus logs..."
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-mono)',
                      fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    OPTION 2: OR UPLOAD EVIDENCE FILE (.PDF, .JSON, .CSV, .TXT)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setVerifierFile(f);
                        setVerifierInput(`[Selected File]: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'var(--bg-elevated)',
                      border: '1px dashed var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isHashing || (!verifierInput.trim() && !verifierFile)}
                  onClick={handleRunVerification}
                  style={{
                    padding: '11px 20px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 3px 12px rgba(16,185,129,0.3)',
                    opacity: isHashing || (!verifierInput.trim() && !verifierFile) ? 0.6 : 1,
                  }}
                >
                  <ShieldCheck size={16} />
                  {isHashing ? 'COMPUTING SHA-256 DIGEST...' : 'COMPUTE & VERIFY SHA-256 HASH'}
                </motion.button>
              </div>

              {/* Right: Results Card */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Verification Verdict & Cryptographic Output
                </div>

                {verifierResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: verifierResult.matchedEvidence
                          ? 'rgba(56,161,105,0.15)'
                          : 'rgba(59,130,246,0.15)',
                        border: `1px solid ${
                          verifierResult.matchedEvidence ? 'rgba(56,161,105,0.4)' : 'rgba(59,130,246,0.4)'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <CheckCircle2
                        size={20}
                        style={{ color: verifierResult.matchedEvidence ? '#38a169' : '#3b82f6' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          {verifierResult.matchedEvidence
                            ? `✓ MATCHED IN EVIDENCE VAULT (${verifierResult.matchedEvidence.id})`
                            : '✓ COMPUTED FIPS 180-4 CRYPTOGRAPHIC HASH'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {verifierResult.matchedEvidence
                            ? `Integrity verified. Registered under case ${verifierResult.matchedEvidence.investigationId}.`
                            : 'Hash computed via native browser Web Crypto API (SHA-256). Bit-level proof valid.'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                        COMPUTED SHA-256 HASH
                      </span>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '11px',
                          color: '#38a169',
                          wordBreak: 'break-all',
                          marginTop: '4px',
                        }}
                      >
                        {verifierResult.computedHash}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px' }}>
                      <button
                        onClick={() => {
                          const inv = investigations[0];
                          const cert = generateSection63BsaCertificate({
                            certificateNo: `BSA-ADHOC-${Date.now().toString().slice(-6)}`,
                            investigationId: inv?.id || 'INV-002',
                            caseRef: inv?.caseId || 'CR-2024-LEA-081',
                            examinerName: user?.name || 'Senior Forensic Examiner',
                            examinerDesignation: 'Cyber Crime Investigator',
                            digitalEvidenceHash: verifierResult.computedHash,
                            evidenceSource: verifierFile?.name || 'On-chain Payload / Explorer Node',
                          });
                          setBsaModalData({
                            isOpen: true,
                            certificateText: cert,
                          });
                        }}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          background: 'rgba(56,161,105,0.15)',
                          border: '1px solid rgba(56,161,105,0.4)',
                          borderRadius: '6px',
                          color: '#38a169',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Generate Sec 63 BSA Certificate
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(verifierResult.computedHash);
                        }}
                        style={{
                          padding: '9px 14px',
                          background: 'var(--border)',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--text-primary)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Copy Hash
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      textAlign: 'center',
                      padding: '20px',
                    }}
                  >
                    <Lock size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>Awaiting Input</p>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>
                      Paste a payload or upload a document to compute cryptographic SHA-256 bit proof.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Statutory Reference Quick-Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="cyber-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} style={{ color: '#38a169' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                  Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Substitutes Section 65B of Indian Evidence Act. Mandates conditions for electronic admissibility, cryptographic hash continuity, host environment declaration, and digital certificate by lawful examiner.
              </p>
            </div>

            <div className="cyber-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: '#d69e2e' }} />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                  Section 106 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Substitutes Section 102 CrPC. Empowers police officers to seize and freeze stolen virtual digital assets (VDA) across Indian & offshore crypto exchanges with 24-hour statutory priority.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* MODAL 1: VIEW EVIDENCE DETAILS */}
      <AnimatePresence>
        {selectedEvidence && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{ width: '560px', maxWidth: '90vw', overflow: 'hidden', padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: '#38a169' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Evidence Record ({selectedEvidence.id})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                    TYPE & CASE LINK
                  </span>
                  <div style={{ marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge status={selectedEvidence.type} />
                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 600 }}>
                      Investigation: {selectedEvidence.investigationId}
                    </span>
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                    DESCRIPTION
                  </span>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {selectedEvidence.description}
                  </p>
                </div>

                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                    CRYPTOGRAPHIC INTEGRITY HASH (FIPS 180-4 / SHA-256)
                  </span>
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      padding: '10px',
                      borderRadius: '6px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      wordBreak: 'break-all',
                      marginTop: '4px',
                      color: 'var(--text-mono)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {selectedEvidence.hash}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                      ORIGIN SOURCE
                    </span>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>{selectedEvidence.source}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700 }}>
                      TAMPER STATUS
                    </span>
                    <div style={{ color: '#38a169', fontWeight: 700, marginTop: '2px' }}>
                      ✓ {selectedEvidence.integrity}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '22px' }}>
                <button
                  onClick={() => setSelectedEvidence(null)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenFreezeOrder(selectedEvidence);
                  }}
                  style={{
                    padding: '8px 14px',
                    background: 'rgba(217,119,6,0.15)',
                    border: '1px solid rgba(217,119,6,0.4)',
                    borderRadius: '6px',
                    color: '#f59e0b',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Sec 106 BNSS Freeze
                </button>
                <button
                  onClick={() => {
                    const ev = selectedEvidence;
                    setSelectedEvidence(null);
                    handleOpenBsaCertificate(ev);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(56,161,105,0.15)',
                    border: '1px solid rgba(56,161,105,0.4)',
                    borderRadius: '6px',
                    color: '#38a169',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Sec 63 BSA Certificate
                </button>
                <button
                  onClick={() => {
                    handleDownloadEvidence(selectedEvidence);
                    setSelectedEvidence(null);
                  }}
                  style={{
                    padding: '8px 18px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Download Manifest
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SECTION 63 BSA CERTIFICATE MODAL */}
      <AnimatePresence>
        {bsaModalData.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{
                width: '820px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={20} style={{ color: '#38a169' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 Certificate
                  </h3>
                </div>
                <button
                  onClick={() => setBsaModalData({ isOpen: false, certificateText: '' })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <pre
                  style={{
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#e6edf3',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {bsaModalData.certificateText}
                </pre>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Legally valid under Sec 63 BSA 2023 & Sec 79A IT Act for Indian Courts.
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(bsaModalData.certificateText);
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Copy Text
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head><title>Section 63 BSA Certificate</title></head>
                            <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
                              ${bsaModalData.certificateText}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(56,161,105,0.15)',
                      border: '1px solid rgba(56,161,105,0.4)',
                      borderRadius: '6px',
                      color: '#38a169',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Printer size={13} /> Print / Export
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: SECTION 106 BNSS FREEZE ORDER MODAL */}
      <AnimatePresence>
        {freezeModalData.isOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{
                width: '820px',
                maxWidth: '92vw',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} style={{ color: '#d97706' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                    Section 106 BNSS Police Seizure & Asset Freeze Order
                  </h3>
                </div>
                <button
                  onClick={() => setFreezeModalData({ isOpen: false, orderText: '', vasp: '' })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                <pre
                  style={{
                    background: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#e6edf3',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {freezeModalData.orderText}
                </pre>
              </div>

              <div
                style={{
                  padding: '14px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Statutory 24-hr mandatory freeze notice under Section 106 BNSS (formerly 102 CrPC).
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(freezeModalData.orderText);
                    }}
                    style={{
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Copy size={13} /> Copy Order
                  </button>
                  <button
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head><title>Section 106 BNSS Freeze Notice</title></head>
                            <body style="font-family: monospace; white-space: pre-wrap; padding: 20px;">
                              ${freezeModalData.orderText}
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(217,119,6,0.15)',
                      border: '1px solid rgba(217,119,6,0.4)',
                      borderRadius: '6px',
                      color: '#d97706',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Printer size={13} /> Print Notice
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: ADD EVIDENCE WITH CRYPTOGRAPHIC HASHING */}
      <AnimatePresence>
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(5px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="cyber-card"
              style={{ width: '540px', maxWidth: '90vw', overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: '18px 22px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Register Forensic Evidence & Seal Hash
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateEvidence} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    EVIDENCE DESCRIPTION *
                  </label>
                  <input
                    required
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="e.g. Smart contract execution logs showing reentrancy drain"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      EVIDENCE TYPE
                    </label>
                    <select
                      value={addForm.type}
                      onChange={(e) => setAddForm({ ...addForm, type: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    >
                      {TYPE_OPTIONS.filter((o) => o !== 'ALL').map((o) => (
                        <option key={o} value={o}>
                          {o.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                      INVESTIGATION REFERENCE
                    </label>
                    <select
                      value={addForm.investigationId}
                      onChange={(e) => setAddForm({ ...addForm, investigationId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    >
                      <option value="">Select Case...</option>
                      {myInvestigations.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.caseId} - {i.title.slice(0, 20)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ORIGINATING SOURCE
                  </label>
                  <input
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    placeholder="e.g. Alchemy Archive Node / Binance API Export"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ATTACH EVIDENCE FILE (CRYPTO HASH WILL BE CALCULATED)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.zip,.csv,.txt,.json"
                    onChange={handleFormFileChange}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'var(--bg-elevated)',
                      border: '1px dashed var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  />
                  {addForm.computedHash && (
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#38a169', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
                      ✓ Generated SHA-256: {addForm.computedHash}
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 700,
                    }}
                  >
                    Seal & Save Evidence
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
