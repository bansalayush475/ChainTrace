import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Users,
  Shield,
  Download,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Printer,
  Zap,
  Copy,
  X,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { resolveVaspAttribution, compileSection91Notice } from '../services/vaspAttributionService';

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
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export interface TriageComplaint {
  ncrpId: string;
  state: string;
  district: string;
  victimName: string;
  suspectAddress: string;
  chain: string;
  amountLostINR: number;
  amountCrypto: string;
  timeSinceReportMin: number;
  syndicate: string;
  attributedVasp: string;
  recoveryUrgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'COLD';
  depositUid?: string;
}

const SAMPLE_NCRP_COMPLAINTS: TriageComplaint[] = [
  {
    ncrpId: '2024/NCRP/DL/982314',
    state: 'Delhi',
    district: 'Special Cell Cyber PS',
    victimName: 'Rajeshwar Sharma',
    suspectAddress: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    chain: 'TRON (TRC-20)',
    amountLostINR: 4850000,
    amountCrypto: '54,500 USDT',
    timeSinceReportMin: 28,
    syndicate: 'Southeast Asia Digital Arrest',
    attributedVasp: 'Binance (FIU-IND)',
    recoveryUrgency: 'CRITICAL',
    depositUid: 'UID-89104231',
  },
  {
    ncrpId: '2024/NCRP/KA/189402',
    state: 'Karnataka',
    district: 'Cyber Crime PS, Bengaluru',
    victimName: 'Arun Kulkarni',
    suspectAddress: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    chain: 'TRON (TRC-20)',
    amountLostINR: 2500000,
    amountCrypto: '28,100 USDT',
    timeSinceReportMin: 45,
    syndicate: 'Southeast Asia Digital Arrest',
    attributedVasp: 'Binance (FIU-IND)',
    recoveryUrgency: 'CRITICAL',
    depositUid: 'UID-89104231',
  },
  {
    ncrpId: '2024/NCRP/MH/310492',
    state: 'Maharashtra',
    district: 'BKC Cyber Police, Mumbai',
    victimName: 'Sunita Mehra',
    suspectAddress: '0x71C839019284102948102948102948102948102a',
    chain: 'Ethereum',
    amountLostINR: 3200000,
    amountCrypto: '12.4 ETH',
    timeSinceReportMin: 85,
    syndicate: 'FedEx Customs Impersonation',
    attributedVasp: 'WazirX (Zanmai Labs)',
    recoveryUrgency: 'HIGH',
    depositUid: 'UID-WZ-39182',
  },
  {
    ncrpId: '2024/NCRP/TS/492102',
    state: 'Telangana',
    district: 'Cyberabad Cyber Crime PS',
    victimName: 'K. Venkat Rao',
    suspectAddress: 'bc1q98210498210498210498210498210498210498',
    chain: 'Bitcoin (BTC)',
    amountLostINR: 1750000,
    amountCrypto: '0.28 BTC',
    timeSinceReportMin: 140,
    syndicate: 'Telegram Part-Time Job Scam',
    attributedVasp: 'CoinDCX (Neblio)',
    recoveryUrgency: 'MEDIUM',
    depositUid: 'UID-DCX-19482',
  },
];

export default function BulkTriagePage() {
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [complaints, setComplaints] = useState<TriageComplaint[]>(SAMPLE_NCRP_COMPLAINTS);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [filterState, setFilterState] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [batchActionRunning, setBatchActionRunning] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [modalNoticeText, setModalNoticeText] = useState('');
  const [modalCopied, setModalCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) return;

        const newComplaints: TriageComplaint[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          if (cols.length < 5) continue;

          const ncrpId = cols[0] || `NCRP-2024-${Math.floor(10000 + Math.random() * 90000)}`;
          const state = cols[1] || 'National Cyber Cell';
          const district = cols[2] || 'Cyber PS';
          const victimName = cols[3] || 'Complainant';
          const suspectAddress = cols[4] || '';
          const chain = cols[5] || 'TRON (TRC-20)';
          const amountLostINR = parseFloat(cols[6]) || 1250000;
          const amountCrypto = cols[7] || '14,000 USDT';
          const timeSinceReportMin = parseInt(cols[8], 10) || 45;
          const syndicate = cols[9] || 'Unassigned Syndicate';

          const cleanChain = chain.toUpperCase().includes('TRON')
            ? 'TRON'
            : chain.toUpperCase().includes('BTC')
            ? 'BTC'
            : 'ETH';
          const attr = resolveVaspAttribution(suspectAddress, cleanChain as any);

          let recoveryUrgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'COLD' = 'COLD';
          if (timeSinceReportMin <= 120) recoveryUrgency = 'CRITICAL';
          else if (timeSinceReportMin <= 360) recoveryUrgency = 'HIGH';
          else if (timeSinceReportMin <= 720) recoveryUrgency = 'MEDIUM';

          newComplaints.push({
            ncrpId,
            state,
            district,
            victimName,
            suspectAddress,
            chain,
            amountLostINR,
            amountCrypto,
            timeSinceReportMin,
            syndicate,
            attributedVasp: attr.vasp.name.split(' ')[0],
            recoveryUrgency,
            depositUid: attr.depositUid,
          });
        }

        if (newComplaints.length > 0) {
          setComplaints(newComplaints);
          const critCount = newComplaints.filter((c) => c.recoveryUrgency === 'CRITICAL').length;
          setBatchSuccessMsg(
            `Successfully ingested ${newComplaints.length} complaints from ${file.name}. Isolated ${critCount} Golden Hour (<2h) cases for immediate freeze.`
          );
          setTimeout(() => setBatchSuccessMsg(null), 8000);
        }
      } catch (err) {
        console.error('Failed to parse CSV file:', err);
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be reloaded if desired
    e.target.value = '';
  };

  const handleDownloadSampleCsv = () => {
    const csvHeader =
      'NCRP_Ack_No,State,District,Victim_Name,Suspect_Crypto_Address,Blockchain,Amount_INR,Amount_Crypto,Minutes_Since_Report,Syndicate\n';
    const csvRows = [
      '2024/NCRP/MH/910281,Maharashtra,Cyber Crime Cell BKC,Kavita M. Deshmukh,TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE,TRON (TRC-20),1450000,16270 USDT,38,Lao SEZ Digital Arrest Syndicate',
      '2024/NCRP/KA/881294,Karnataka,Bengaluru CID CEN PS,Sridhar Ramanathan,TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE,TRON (TRC-20),2800000,31425 USDT,55,Lao SEZ Digital Arrest Syndicate',
      '2024/NCRP/DL/551029,Delhi,IFSO Special Cell,Rajinder Pal Singh,0x28C6c06298d514Db089934071355E5743bf21d60,Ethereum,950000,4.2 ETH,82,SEBI Fraudulent Institutional IPO Syndicate',
      '2024/NCRP/GJ/449120,Gujarat,Surat Cyber PS,Hasmukhbhai Patel,0x5b38Da6a701c568545dCfcB03FcB875f56beddC4,Ethereum,1850000,8.1 ETH,190,SEBI Fraudulent Institutional IPO Syndicate',
      '2024/NCRP/UP/339102,Uttar Pradesh,Noida Cyber Thana,Priyanka Verma,TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE,TRON (TRC-20),420000,4710 USDT,310,Telegram Task Scam Syndicate',
      '2024/NCRP/TG/220199,Telangana,Hyderabad TGCSB,Venkat Rao K.,1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,Bitcoin,3200000,0.48 BTC,1820,Offshore Cold Storage Syndicate',
    ].join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'NCRP_1930_Complaint_Batch_Sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = complaints.filter((c) => {
    if (filterUrgency !== 'ALL' && c.recoveryUrgency !== filterUrgency) return false;
    if (filterState !== 'ALL' && c.state !== filterState) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.ncrpId.toLowerCase().includes(q) ||
        c.victimName.toLowerCase().includes(q) ||
        c.suspectAddress.toLowerCase().includes(q) ||
        c.syndicate.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalComplaints = complaints.filter((c) => c.recoveryUrgency === 'CRITICAL');
  const criticalCount = criticalComplaints.length;
  const totalExposureINR = complaints.reduce((sum, c) => sum + c.amountLostINR, 0);

  // Group duplicate suspect wallets to highlight multi-district syndicates
  const walletCounts: Record<string, number> = {};
  complaints.forEach((c) => {
    walletCounts[c.suspectAddress] = (walletCounts[c.suspectAddress] || 0) + 1;
  });

  const handleRunBatchNotice = () => {
    setBatchActionRunning(true);
    setTimeout(() => {
      setBatchActionRunning(false);

      const notice = `================================================================================
OFFICE OF THE SUPERINTENDENT OF POLICE // CYBER CRIME INVESTIGATION DIVISION
CHAINTRACE // DIGITAL ASSET FORENSICS
================================================================================

CONSOLIDATED STATUTORY REQUISITION & FREEZE ORDER UNDER SECTION 91 CrPC / §180 BNSS
BATCH REFERENCE: CT/BATCH-ANALYSIS/${new Date().getFullYear()}/0492
DATE: ${new Date().toLocaleDateString('en-IN')}
URGENCY: CRITICAL (GOLDEN HOUR TIME-SENSITIVE ASSET PRESERVATION)

SUMMARY OF CONSOLIDATED CRITICAL INTAKES (<2 HOURS ELAPSED):
--------------------------------------------------------------------------------
${criticalComplaints
  .map(
    (c, idx) =>
      `[${idx + 1}] ACK: ${c.ncrpId} | POLICE: ${c.district} (${c.state})
     VICTIM     : ${c.victimName} (Loss: ₹${c.amountLostINR.toLocaleString()} / ${c.amountCrypto})
     SUSPECT WLT: ${c.suspectAddress} [${c.chain}]
     TARGET VASP: ${c.attributedVasp} | IDENTIFIED SUB-ACCOUNT UID: ${c.depositUid || 'AUTO-RESOLVED'}
     URGENCY    : ${c.timeSinceReportMin} min elapsed (GOLDEN WINDOW ACTIVE)`
  )
  .join('\n\n')}
--------------------------------------------------------------------------------

STATUTORY DIRECTIVE:
Pursuant to Section 91 and Section 102 of the Code of Criminal Procedure, 1973,
all recipient Virtual Asset Service Providers (VASPs) are hereby commanded to:
1. Immediately place an ADMINISTRATIVE FREEZE on all listed UIDs and sub-accounts.
2. Furnish full verified Tier-2 KYC dossier (Aadhaar/PAN/Passport), IP login session
   logs, and fiat bank settlement account statements within 24 hours.

AUTHORIZED BY: ${user?.name || 'Superintendent of Police'} (${user?.role || 'Senior Cyber Crime Lead'})
CHAINTRACE CRYPTOGRAPHIC SHA-256 DIGITAL SEAL AFFIXED
================================================================================`;

      setModalNoticeText(notice);
      setShowBatchModal(true);
      setBatchSuccessMsg(
        `Generated consolidated freeze order for ${criticalCount} Golden Hour cases covering ₹${criticalComplaints
          .reduce((sum, c) => sum + c.amountLostINR, 0)
          .toLocaleString()} in active deposits.`
      );
      setTimeout(() => setBatchSuccessMsg(null), 8000);
    }, 1200);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Hidden file input for CSV uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'linear-gradient(135deg, rgba(66,153,225,0.12) 0%, rgba(56,161,105,0.08) 50%, var(--bg-surface) 100%)',
          border: '1px solid rgba(66,153,225,0.3)',
          borderRadius: '10px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'var(--accent)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: '#fff' }} />
              1930 / NCRP BULK INGESTION ENGINE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              LIVE CSV INTAKE &amp; GOLDEN HOUR DEDUPLICATION
            </span>
          </div>
          <h1 style={{ margin: '8px 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            NCRP Multi-District Complaint Triage Matrix
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '780px', lineHeight: 1.45 }}>
            Ingests daily complaint batches from the National Cybercrime Reporting Portal (1930 Helpline). Automatically
            correlates suspect crypto addresses across districts, isolates <strong style={{ color: 'var(--text-primary)' }}>Golden Hour</strong> recovery opportunities, and dispatches batch legal freezes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Total Batch Exposure
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{(totalExposureINR / 100000).toFixed(2)} Lakhs
            </div>
            <div style={{ fontSize: '11px', color: 'var(--risk-critical)', fontWeight: 700 }}>
              {criticalCount} in Golden Window (&lt;2 hrs)
            </div>
          </div>
        </div>
      </motion.div>

      {/* Control Bar: Ingestion & Filter Actions */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 1 420px', minWidth: '240px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by NCRP ID, Victim Name, Address, Syndicate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px' }}>
            <Filter size={14} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>PRIORITY:</span>
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '11.5px', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
            >
              <option value="ALL">All Levels ({complaints.length})</option>
              <option value="CRITICAL">Critical &lt;2h ({criticalCount})</option>
              <option value="HIGH">High Urgency</option>
              <option value="MEDIUM">Medium / Peeling</option>
            </select>
          </div>

          {/* Load NCRP Feed Button */}
          <button
            onClick={() => setComplaints(SAMPLE_NCRP_COMPLAINTS)}
            style={{
              padding: '7px 12px',
              background: 'rgba(37,99,235,0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} />
            LOAD NCRP FEED
          </button>

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '7px 12px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Upload size={14} style={{ color: 'var(--accent)' }} />
            UPLOAD NCRP CSV
          </button>

          {/* Download Sample CSV Template */}
          <button
            onClick={handleDownloadSampleCsv}
            style={{
              padding: '7px 12px',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            title="Download formatted sample CSV template to test ingestion"
          >
            <Download size={14} />
            CSV TEMPLATE
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRunBatchNotice}
            disabled={batchActionRunning || criticalCount === 0}
            style={{
              padding: '8px 14px',
              background: 'var(--risk-critical)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: batchActionRunning ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <Zap size={14} />
            {batchActionRunning
              ? 'DISPATCHING FREEZE...'
              : `1-CLICK BATCH VASP FREEZE (${criticalCount} CASES)`}
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 14px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={14} />
            PRINT DOSSIER
          </button>
        </div>
      </motion.div>

      {batchSuccessMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(56,161,105,0.15)', border: '1px solid #38a169', borderRadius: '8px', fontSize: '13px', color: '#38a169', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{batchSuccessMsg}</span>
        </div>
      )}

      {/* Table of Complaints */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '13px' }}>
              Complaints Queue ({filtered.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Sorted by Recovery Urgency &amp; Golden Window
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Rows highlighted with badge indicate multi-district syndicate hit
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>NCRP Ack / Station</th>
              <th style={{ padding: '10px 14px' }}>Victim &amp; Exposure</th>
              <th style={{ padding: '10px 14px' }}>Suspect Crypto Wallet</th>
              <th style={{ padding: '10px 14px' }}>Attributed VASP</th>
              <th style={{ padding: '10px 14px' }}>Syndicate Cluster</th>
              <th style={{ padding: '10px 14px' }}>Urgency Window</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Upload size={32} style={{ opacity: 0.4, margin: '0 auto 8px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>No Complaints in Triage Queue</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>Click "UPLOAD NCRP CSV / EXCEL" to ingest real batch complaints into the triage queue.</div>
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isCrit = item.recoveryUrgency === 'CRITICAL';
              const isDuplicateWallet = (walletCounts[item.suspectAddress] || 0) > 1;

              return (
                <tr
                  key={item.ncrpId}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isCrit ? 'rgba(239,68,68,0.03)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                      {item.ncrpId}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.district}, {item.state}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.victimName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--risk-critical)', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                      ₹{item.amountLostINR.toLocaleString()} ({item.amountCrypto})
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11.5px', color: 'var(--text-primary)' }}>
                        {item.suspectAddress}
                      </span>
                      {isDuplicateWallet && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(239,68,68,0.15)',
                            color: 'var(--risk-critical)',
                          }}
                          title="This wallet appears in multiple complaints across different police stations!"
                        >
                          MULTI-DISTRICT HIT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.chain}
                    </div>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.attributedVasp}
                    </div>
                    {item.depositUid && (
                      <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: '#38a169', fontWeight: 600 }}>
                        UID: {item.depositUid}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {item.syndicate}
                    </span>
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    {isCrit ? (
                      <span
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: 'var(--risk-critical)',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Clock size={11} />
                        GOLDEN HOUR ({item.timeSinceReportMin}m)
                      </span>
                    ) : item.recoveryUrgency === 'HIGH' ? (
                      <span
                        style={{
                          background: 'rgba(214,158,46,0.15)',
                          color: '#d69e2e',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        HIGH ({item.timeSinceReportMin}m)
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(113,128,150,0.15)',
                          color: 'var(--text-secondary)',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        COLD ARCHIVE
                      </span>
                    )}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Batch Freeze Modal */}
      {showBatchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              width: '100%',
              maxWidth: '840px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} style={{ color: 'var(--risk-critical)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  Consolidated Section 91 CrPC Batch Freeze Directive
                </h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <pre
                style={{
                  background: 'var(--bg-base)',
                  padding: '16px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                {modalNoticeText}
              </pre>
            </div>

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(modalNoticeText);
                  setModalCopied(true);
                  setTimeout(() => setModalCopied(false), 2500);
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={13} />
                {modalCopied ? 'COPIED TO CLIPBOARD!' : 'COPY STATUTORY NOTICE'}
              </button>
              <a
                href={`mailto:?subject=Section%2091%20CrPC%20%2F%20Section%2093%20BNSS%20Batch%20Freeze%20Directive&body=${encodeURIComponent(modalNoticeText)}`}
                style={{
                  padding: '8px 16px',
                  background: '#38a169',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={13} />
                SEND VIA EMAIL
              </a>
              <button
                onClick={() => {
                  const now = new Date();
                  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                  const lines = modalNoticeText.split('\n');
                  const bodyLines = lines.map((line: string) => {
                    if (!line.trim()) return '<br/>';
                    if (line.startsWith('===') || line.startsWith('---')) return `<hr style="border:1px solid #c00;margin:10px 0"/>`;
                    if (line.match(/^[A-Z\s]{6,}:?$/)) return `<p style="font-weight:800;color:#1a1a1a;margin:14px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em">${line}</p>`;
                    if (line.match(/^\d+\./)) return `<p style="margin:6px 0 6px 18px;font-size:12.5px">${line}</p>`;
                    return `<p style="margin:4px 0;font-size:12.5px">${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
                  }).join('');

                  const printWin = window.open('', '_blank', 'width=850,height=1100');
                  if (!printWin) return;
                  printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Section 91 CrPC / 93 BNSS Batch Freeze Directive</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 13px; line-height: 1.6; margin: 0; padding: 0; color: #111; background: #fff; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 22mm; }
    .header { text-align: center; border-bottom: 3px double #8B0000; padding-bottom: 14px; margin-bottom: 18px; }
    .header .emblem { font-size: 38px; margin-bottom: 4px; }
    .header .country { font-size: 11px; letter-spacing: 0.12em; color: #555; text-transform: uppercase; }
    .header .dept { font-size: 16px; font-weight: 900; color: #1a1a1a; margin: 4px 0; letter-spacing: 0.03em; }
    .header .platform { font-size: 12px; color: #555; }
    .title-banner { background: #8B0000; color: #fff; text-align: center; padding: 10px 18px; border-radius: 3px; margin: 16px 0; }
    .title-banner .main { font-size: 15px; font-weight: 900; letter-spacing: 0.04em; }
    .title-banner .sub { font-size: 11px; margin-top: 3px; opacity: 0.9; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; border: 1px solid #ccc; border-radius: 3px; padding: 12px 14px; margin: 14px 0; background: #fafafa; }
    .meta-item { font-size: 11.5px; }
    .meta-item .label { font-weight: 700; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta-item .value { font-weight: 600; color: #111; font-family: 'Courier New', monospace; }
    .section { margin: 14px 0; }
    .section-title { font-size: 13px; font-weight: 900; color: #8B0000; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
    .body-text { font-size: 12.5px; line-height: 1.7; text-align: justify; }
    .notice-body { background: #fefefe; border: 1px solid #e0e0e0; padding: 14px 16px; border-radius: 3px; }
    .footer { margin-top: 28px; border-top: 2px solid #8B0000; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-block { text-align: center; }
    .sig-line { width: 160px; border-bottom: 1px solid #333; margin-bottom: 4px; height: 40px; }
    .sig-label { font-size: 10px; color: #555; }
    .watermark { text-align: center; margin-top: 16px; font-size: 9.5px; color: #aaa; letter-spacing: 0.06em; }
    .urgent-badge { display:inline-block; background:#8B0000; color:#fff; font-size:10px; font-weight:800; padding:2px 10px; border-radius:2px; letter-spacing:0.08em; vertical-align:middle; margin-left:8px; }
    @media print {
      body { margin: 0; }
      .page { padding: 15mm 18mm; width: 100%; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="emblem">⚖️</div>
    <div class="country">ChainTrace Digital Forensics Lab</div>
    <div class="dept">Cyber Crime Investigation Division</div>
    <div class="platform">ChainTrace Sovereign LEA Intelligence Platform</div>
  </div>

  <div class="title-banner">
    <div class="main">STATUTORY BATCH FREEZE DIRECTIVE <span class="urgent-badge">URGENT</span></div>
    <div class="sub">Issued under Section 91 Cr.P.C. / Section 93 BNSS | Ref: CHAINTRACE-LEA/${now.getFullYear()}/${Math.floor(Math.random()*90000+10000)}</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><div class="label">Date of Issue</div><div class="value">${dateStr}</div></div>
    <div class="meta-item"><div class="label">Classification</div><div class="value">CONFIDENTIAL — LEA USE ONLY</div></div>
    <div class="meta-item"><div class="label">Issuing Authority</div><div class="value">CCID / ChainTrace Platform</div></div>
    <div class="meta-item"><div class="label">Legal Framework</div><div class="value">Sec 91 CrPC / Sec 93 BNSS / IT Act 2000</div></div>
  </div>

  <div class="section">
    <div class="section-title">Notice Content</div>
    <div class="notice-body body-text">
      ${bodyLines}
    </div>
  </div>

  <div class="footer">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Investigating Officer</div>
      <div class="sig-label">Cyber Crime Investigation Division</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Supervising Officer / DCP</div>
      <div class="sig-label">Cyber Crime Investigation Division</div>
    </div>
    <div class="sig-block" style="text-align:right">
      <div style="width:120px;height:120px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:10px;color:#bbb;border-radius:50%">OFFICIAL SEAL</div>
    </div>
  </div>

  <div class="watermark">
    GENERATED BY CHAINTRACE LEA PLATFORM — LEGALLY ADMISSIBLE UNDER SECTION 63 BSA — ${now.toISOString()} UTC
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
                  printWin.document.close();
                }}
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={13} />
                PRINT / SAVE PDF
              </button>

            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
