import React, { useState } from 'react';
import {
  X,
  Shield,
  Zap,
  BookOpen,
  FileCheck,
  Scale,
  Building,
  AlertTriangle,
  Layers,
  ArrowRight,
  Clock,
  Lock,
  Cpu,
  Award,
  Globe,
  CheckCircle,
  Hash,
  ExternalLink
} from 'lucide-react';

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeJurisdiction?: string;
}

export default function ExecutiveBriefingModal({
  isOpen,
  onClose,
  activeJurisdiction = 'Delhi Police Cyber Crime PS (Special Cell)',
}: ExecutiveBriefingModalProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'pipeline' | 'statutory' | 'innovations'>('problem');

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1080px',
          maxHeight: '90vh',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(37, 99, 235, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary)',
        }}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(90deg, #09172f 0%, #11264c 100%)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
              }}
            >
              <Shield size={22} style={{ color: '#fff' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#60a5fa',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  NATIONAL DEFENSE & CYBER SECURITY DOCKET
                </span>
                <span
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#4ade80',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  CONFIDENTIAL · I4C JURISDICTION
                </span>
              </div>
              <h2
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  letterSpacing: '-0.01em',
                }}
              >
                ChainTrace Executive Briefing · National Forensic Architecture
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                textAlign: 'right',
                marginRight: '8px',
              }}
            >
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                Active Jurisdiction
              </div>
              <div style={{ fontSize: '11.5px', color: '#e2e8f0', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
                {activeJurisdiction}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-base)',
            borderBottom: '1px solid var(--border)',
            padding: '0 24px',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {[
            { id: 'problem', label: '1. National Problem & Impact', icon: AlertTriangle },
            { id: 'pipeline', label: '2. 5-Stage Interception Pipeline', icon: Layers },
            { id: 'statutory', label: '3. Statutory Law & Admissibility', icon: Scale },
            { id: 'innovations', label: '4. Sovereign Technical Breakthroughs', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 700 : 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div
          style={{
            padding: '28px 32px',
            overflowY: 'auto',
            flex: 1,
            lineHeight: 1.6,
          }}
        >
          {/* TAB 1: National Problem & Impact */}
          {activeTab === 'problem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '10px',
                  padding: '18px 22px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ef4444',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', color: '#f87171', fontWeight: 700 }}>
                    The ₹1,200+ Crore Sovereign Threat: Transnational Crypto-Laundering
                  </h3>
                  <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    Syndicates operating across Southeast Asia (Myanmar, Cambodia, Laos) orchestrate "Digital Arrest", "FedEx Drug Parcel", and "Algorithmic Telegram Investment" scams. Victim funds deposited via domestic IMPS/UPI into Layer-1 mule accounts are converted to USDT within <strong>47 minutes</strong> via OTC/P2P escrow and bridge out of Indian jurisdiction before banks can even generate a formal freeze acknowledgment.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
                    <Clock size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>THE GOLDEN WINDOW</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    &lt; 3 Hours
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Time from victim transfer to TRC-20 USDT dispatch onto overseas privacy mixers or decentralized bridges. After this window, recovery drops by 94%.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', marginBottom: '8px' }}>
                    <Building size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>BANKING BLIND SPOT</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Zero On-Chain Sight
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    Traditional bank Section 102 notices stop at the bank account. When a mule sends INR to a P2P crypto vendor, police lose the trail without unified ledger correlation.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
                    <Scale size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>NEW CRIMINAL LAWS</span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    BNSS & BSA 2023
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                    The transition from CrPC to BNSS and Evidence Act to Bharatiya Sakshya Adhiniyam requires strict cryptographic SHA-256 certificate chains for high court admissibility.
                  </p>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Why ChainTrace is Built Specifically for Indian Law Enforcement:
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>1930 NCRP Direct Ingestion:</strong> Ingests victim complaint acknowledgments, reverse-resolves UPI handles, UTR numbers, and bank account trails.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>Real-Time P2P Escrow Interception:</strong> Tracks active orders on Binance, WazirX, CoinDCX, Bybit to freeze INR and crypto simultaneously before release.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>Multi-Chain Graph Traversal:</strong> Deterministic tracing across TRON, Ethereum, Bitcoin UTXO, Polygon, Arbitrum, and BSC with hop-by-hop taint tracking.
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '3px' }} />
                    <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      <strong>1-Click Statutory Subpoena Dispatch:</strong> Formats ready-to-serve Section 106 BNSS Bank Freezes and Section 94 BNSS VASP Subpoenas with official Ashoka Stambh styling.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 5-Stage Interception Pipeline */}
          {activeTab === 'pipeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                ChainTrace implements an end-to-end, multi-jurisdictional cyber forensic workflow that connects citizen emergency calls to court-admissible evidence packages:
              </p>

              {[
                {
                  stage: 'STAGE 01',
                  title: 'Citizen Victim Intake & 1930 NCRP Ingestion',
                  desc: 'The victim reports fraud on 1930 helpline or the National Cybercrime Reporting Portal. ChainTrace ingests the acknowledgment, victim identity, fraud category (e.g. Digital Arrest / Part-time Task), and initial deposit UTR numbers.',
                  statute: 'NCRP Intake Protocol / I4C Incident Docket',
                  badge: 'Citizen Emergency Layer',
                  badgeColor: '#3b82f6',
                },
                {
                  stage: 'STAGE 02',
                  title: 'UPI / Mule Bank Cascade & Section 106 BNSS Freeze Notice',
                  desc: 'Reverse lookups determine the receiving mule bank account. ChainTrace instantly generates a legally mandated Section 106 BNSS (former §102 CrPC) Debit Freeze order addressed to the Branch Manager and Nodal Officer to lock INR balances.',
                  statute: 'Section 106 Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)',
                  badge: 'Banking & Mule Interception',
                  badgeColor: '#f59e0b',
                },
                {
                  stage: 'STAGE 03',
                  title: 'P2P Escrow & Deposit Correlation to Exchange Hot Wallets',
                  desc: 'Detects the fiat-to-crypto pivot. Matches the suspect UTR and fiat amount against live P2P order books and exchange deposit gateways (WazirX, CoinDCX, Binance, OKX, Bybit). Identifies suspect wallet address.',
                  statute: 'PMLA 2002 / FIU-IND Reporting Guidelines',
                  badge: 'Fiat-to-Crypto Pivot Point',
                  badgeColor: '#8b5cf6',
                },
                {
                  stage: 'STAGE 04',
                  title: 'Sovereign Multi-Chain Graph Tracing & Cross-Chain Peel Traversal',
                  desc: 'Traverses on-chain hops via direct node RPC. Tracks peeling chains, smart contract token swaps, bridge interactions (ThorChain, Wormhole, Stargate), and privacy mixers (Tornado, Cyclone). Calculates mathematical taint coefficient.',
                  statute: 'Section 79A Information Technology Act Standards',
                  badge: 'Forensic Graph Engine',
                  badgeColor: '#06b6d4',
                },
                {
                  stage: 'STAGE 05',
                  title: 'Section 94 BNSS VASP Subpoena & Section 63 BSA Court Certificate',
                  desc: 'Auto-generates statutory Section 94 BNSS (former §91 CrPC) summons to FIU-registered crypto exchanges for beneficiary KYC, IP logs, and wallet freeze. Compiles Section 63 BSA (2023) digital certificate with SHA-256 integrity hash for Trial Courts.',
                  statute: 'Section 94 BNSS 2023 & Section 63 Bharatiya Sakshya Adhiniyam',
                  badge: 'Judicial Admissibility',
                  badgeColor: '#10b981',
                },
              ].map((step, idx) => (
                <div
                  key={step.stage}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    display: 'flex',
                    gap: '18px',
                    alignItems: 'flex-start',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(37, 99, 235, 0.15)',
                      border: '1px solid rgba(37, 99, 235, 0.3)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '13px',
                      fontFamily: 'JetBrains Mono, monospace',
                      flexShrink: 0,
                    }}
                  >
                    0{idx + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {step.stage}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {step.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: `${step.badgeColor}22`,
                          color: step.badgeColor,
                          border: `1px solid ${step.badgeColor}44`,
                          marginLeft: 'auto',
                        }}
                      >
                        {step.badge}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {step.desc}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
                      <Scale size={12} />
                      <span>{step.statute}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Statutory Law & Admissibility */}
          {activeTab === 'statutory' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: '14px',
                  alignItems: 'center',
                }}
              >
                <Award size={24} style={{ color: '#10b981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>
                    100% Aligned with New Bharatiya Sanhita Criminal Codes (2023)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ChainTrace generates legal documents automatically mapped to the Bharatiya Nagarik Suraksha Sanhita (BNSS), Bharatiya Nyaya Sanhita (BNS), and Bharatiya Sakshya Adhiniyam (BSA), maintaining full retroactive compatibility with legacy CrPC and IPC citations.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Scale size={18} style={{ color: '#3b82f6' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Section 106 BNSS / 102 CrPC
                    </h4>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Emergency Account & Asset Debit Freeze
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Empowers police investigating officers to seize or freeze any property found under suspicious circumstances that creates suspicion of the commission of any offence. ChainTrace auto-populates branch addresses, IFSC codes, UTR debit trails, and immediate freeze directives without needing prior Magistrate warrant in exigent situations.
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '8px', borderRadius: '6px' }}>
                    <strong>Mandate:</strong> Notice dispatched within 24 hours of 1930 NCRP complaint logging to prevent mule withdrawal.
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Scale size={18} style={{ color: '#8b5cf6' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Section 94 BNSS / 91 CrPC
                    </h4>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Summons to Produce Documents & VASP Records
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Statutory requisition order served upon registered Virtual Asset Service Providers (VASPs like CoinDCX, WazirX, Binance, Mudrex) to mandate production of KYC documents, government ID scans, registered phone/email, login IP access audit logs, and account transaction ledgers within 48 hours.
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '8px', borderRadius: '6px' }}>
                    <strong>Compliance:</strong> In accordance with FIU-IND AML/CFT obligations under Prevention of Money Laundering Act (PMLA).
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Shield size={18} style={{ color: '#10b981' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Section 63 BSA 2023 / 65B Evidence Act
                    </h4>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Electronic Record Admissibility Certificate
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Trial courts strictly reject computer printouts and digital evidence lacking statutory certification. ChainTrace issues an automatic, cryptographically sealed Section 63 BSA Certificate bearing the SHA-256 payload hash, UTC/IST timestamp, server hash, and digital forensic officer attestation.
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '8px', borderRadius: '6px' }}>
                    <strong>Integrity:</strong> Hardens case files against defense challenges under <em>Arjun Panditrao Khotkar (2020)</em> jurisprudence.
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Cpu size={18} style={{ color: '#06b6d4' }} />
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Section 79A Information Technology Act
                    </h4>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Central Government Digital Examiner Standard
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 10px 0' }}>
                    Prescribes standards for notified Examiners of Electronic Evidence. ChainTrace enforces immutable audit logs, deterministic heuristic weighting, zero data-poisoning vulnerabilities, and strict chain-of-custody logging for every officer action.
                  </p>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '8px', borderRadius: '6px' }}>
                    <strong>Sovereignty:</strong> No foreign cloud dependencies or offshore data exfiltration risks.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Sovereign Technical Breakthroughs */}
          {activeTab === 'innovations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'linear-gradient(90deg, rgba(37,99,235,0.1) 0%, rgba(147,51,234,0.1) 100%)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: '10px',
                  padding: '18px 22px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Zap size={20} style={{ color: '#3b82f6' }} />
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#60a5fa', fontWeight: 700 }}>
                    Sovereign Engineering: 4 Core Breakthroughs
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Unlike foreign commercial forensic tools (e.g. Chainalysis, TRM Labs) that cost ₹50 Lakhs/year and ship Indian police investigation queries to US servers, ChainTrace runs entirely on sovereign infrastructure with 100% indigenous data retention.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '8px' }}>
                    <Lock size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>ZERO-LEAKAGE PRIVACY</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Direct Sovereign Node RPC Architecture
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Queries are dispatched to National Cyber Forensic Lab (NCFL) dedicated nodes. Suspect crypto addresses, FIR numbers, and victim bank account numbers never leave government perimeter networks, eliminating leak hazards to overseas cloud providers.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '8px' }}>
                    <Hash size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>DETERMINISTIC XAI</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Explainable AI (XAI) Taint Attribution
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Black-box machine learning is readily dismissed by Indian High Courts under cross-examination. ChainTrace uses deterministic graph-theoretic taint propagation: hop distance decay, volume conservation, peel pattern clustering, and time-window velocity metrics that can be mathematically defended in court.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', marginBottom: '8px' }}>
                    <Layers size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>MULTI-CHAIN CORRELATION</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Cross-Chain Bridge & Peel De-anonymization
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Synthesizes transactions across TRON (TRC-20 USDT), Ethereum (ERC-20 USDT/USDC), Bitcoin UTXO, Polygon, Arbitrum, and BSC into a single unified temporal graph, piercing decentralized mixers and bridge contract obfuscation in seconds.
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '18px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', marginBottom: '8px' }}>
                    <FileCheck size={18} />
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>ZERO-DEPENDENCY AIR-GAP</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Client-Side Sovereign IndexedDB Persistence
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Operates seamlessly in secured, air-gapped forensic labs with zero mandatory internet egress. All investigative dockets, case files, Section 106 freeze notices, and court exhibits are cryptographically generated and stored locally in browser sandbox storage.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: 'var(--bg-elevated)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <Shield size={14} style={{ color: '#10b981' }} />
            <span>National Cybercrime Forensics & Intelligence System · Ministry of Home Affairs (MHA / I4C)</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                const tabs: ('problem' | 'pipeline' | 'statutory' | 'innovations')[] = ['problem', 'pipeline', 'statutory', 'innovations'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                } else {
                  onClose();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span>{activeTab === 'innovations' ? 'Return to Command Center' : 'Next Briefing Section'}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
