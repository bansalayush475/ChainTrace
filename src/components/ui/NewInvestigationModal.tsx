import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
  Wallet,
  FileText,
  Database,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { detectBlockchain } from '../../services/blockchainService';

interface NewInvestigationModalProps {
  onClose: () => void;
  initialWallet?: string;
  initialBlockchain?: 'ETH' | 'BTC' | 'TRON' | 'POLYGON' | 'BNB';
  initialTitle?: string;
  initialPriority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  onCreated?: (caseId: string, id: string) => void;
}

export default function NewInvestigationModal({
  onClose,
  initialWallet = '',
  initialBlockchain = 'ETH',
  initialTitle = '',
  initialPriority = 'HIGH',
  onCreated,
}: NewInvestigationModalProps) {
  const navigate = useNavigate();
  const { addInvestigation, user } = useStore();

  const [form, setForm] = useState({
    title: initialTitle,
    suspectWallet: initialWallet,
    blockchain: initialBlockchain,
    priority: initialPriority,
    fundsTraced: '1450000',
    description: '',
    tags: 'ncrp-intake, cyber-fraud, freeze-ready',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  function handleWalletChange(val: string) {
    const detected = detectBlockchain(val);
    if (detected !== 'UNKNOWN') {
      setForm((prev) => ({
        ...prev,
        suspectWallet: val,
        blockchain: detected as any,
      }));
    } else {
      setForm((prev) => ({ ...prev, suspectWallet: val }));
    }
  }

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      setError('Please provide a title or complaint name for the investigation.');
      return;
    }

    const funds = parseFloat(form.fundsTraced.replace(/[^0-9.]/g, '')) || 500000;
    const tagArray = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    setCurrentStep(3);

    const newInv = addInvestigation({
      title: form.title,
      suspectWallet: form.suspectWallet,
      blockchain: form.blockchain as 'ETH' | 'BTC' | 'TRON' | 'POLYGON' | 'BNB',
      priority: form.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
      fundsTraced: funds,
      currency: form.blockchain === 'TRON' ? 'USDT' : form.blockchain === 'BTC' ? 'BTC' : 'ETH',
      description: form.description,
      tags: tagArray.length > 0 ? tagArray : undefined,
    });

    setSuccess(true);
    if (onCreated) {
      onCreated(newInv.caseId, newInv.id);
    }

    setTimeout(() => {
      onClose();
      navigate(`/investigations/${newInv.id}`);
    }, 900);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '12px',
          width: '640px',
          maxWidth: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 25px rgba(56,189,248,0.1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37,99,235,0.12)',
                border: '1px solid rgba(37,99,235,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <ShieldAlert size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  New Case Docket &amp; Investigation Intake
                </h3>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(56,161,105,0.15)',
                    color: '#38a169',
                    border: '1px solid rgba(56,161,105,0.3)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  INDEXEDDB ATTACHED
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Authorizing Officer: <strong style={{ color: 'var(--text-primary)' }}>{user?.name || 'Arjun Sharma'}</strong> ({user?.role || 'Lead Analyst'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              padding: '6px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── Visual Workflow Stage Tracker ─── */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-base)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          {[
            { step: 1, title: '1. Incident Intake' },
            { step: 2, title: '2. Priority & Legal' },
            { step: 3, title: '3. DB Commit (§79A)' },
          ].map((s) => {
            const isDone = currentStep >= s.step;
            return (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11.5px',
                  fontWeight: isDone ? 700 : 500,
                  color: isDone ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isDone ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: isDone ? '#fff' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {isDone ? '✓' : s.step}
                </div>
                <span>{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '6px',
                  color: 'var(--risk-critical)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(56,161,105,0.12)',
                  border: '1px solid rgba(56,161,105,0.35)',
                  borderRadius: '6px',
                  color: '#38a169',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} /> Committed to Sovereign Database (IndexedDB). Initializing live case docket...
              </div>
            )}

            {/* Case Title / FIR */}
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Case Docket Title &amp; NCRP Reference <span style={{ color: 'var(--risk-critical)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => {
                  setForm({ ...form, title: e.target.value });
                  if (error) setError('');
                }}
                placeholder="e.g. [NCRP-904128] Telegram Task & High-Yield Investment Fraud"
                style={{
                  width: '100%',
                  padding: '10px 12px',
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

            {/* Suspect Wallet */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Suspect Wallet Address (Ingress Point)
                </label>
                <span style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                  Auto-Detects Protocol
                </span>
              </div>
              <input
                type="text"
                value={form.suspectWallet}
                onChange={(e) => handleWalletChange(e.target.value)}
                placeholder="Paste TRON (T...), Ethereum (0x...), or Bitcoin (bc1...)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            </div>

            {/* Blockchain & Priority Level */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Blockchain Protocol
                </label>
                <select
                  value={form.blockchain}
                  onChange={(e) => setForm({ ...form, blockchain: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    outline: 'none',
                  }}
                >
                  <option value="TRON">TRON (USDT TRC-20 - 82% of Scams)</option>
                  <option value="ETH">Ethereum (ETH / ERC-20)</option>
                  <option value="BTC">Bitcoin (BTC / UTXO)</option>
                  <option value="POLYGON">Polygon (POL / MATIC)</option>
                  <option value="BNB">BNB Smart Chain</option>
                </select>
              </div>

              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Statutory Urgency &amp; Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    outline: 'none',
                  }}
                >
                  <option value="CRITICAL">CRITICAL (&lt;2h Golden Hour / P2P Active)</option>
                  <option value="HIGH">HIGH (Risk Score 75-89)</option>
                  <option value="MEDIUM">MEDIUM (Layering in progress)</option>
                  <option value="LOW">LOW (Cold archive trace)</option>
                </select>
              </div>
            </div>

            {/* Funds Traced */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Defrauded Amount (INR ₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={form.fundsTraced}
                  onChange={(e) => setForm({ ...form, fundsTraced: e.target.value })}
                  placeholder="e.g. 1450000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    fontSize: '12.5px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Forensic Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. digital-arrest, p2p-merchant, sec91-ready"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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
            </div>

            {/* Incident Summary */}
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, display: 'block', marginBottom: '5px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Incident Summary &amp; Statutory Grounds
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief narrative of the cyber fraud: victim communication vector, fraudulent merchant credentials, or freeze objectives under Section 91/102 CrPC..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  fontSize: '12.5px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Sovereign Database Persistence Notice */}
            <div
              style={{
                padding: '10px 12px',
                background: 'rgba(66,153,225,0.06)',
                border: '1px solid rgba(66,153,225,0.2)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
              }}
            >
              <Database size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span>
                Committed directly to <strong style={{ color: 'var(--text-primary)' }}>ChainTrace_Sovereign_DB</strong> (IndexedDB). Persisted permanently across browser reloads with automatic Section 79A genesis hash generation.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={success}
              style={{
                padding: '9px 22px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                cursor: success ? 'not-allowed' : 'pointer',
                fontSize: '12.5px',
                fontWeight: 700,
                letterSpacing: '0.03em',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Lock size={14} />
              {success ? 'COMMITTING TO DATABASE...' : 'SAVE & INITIALIZE CASE'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
