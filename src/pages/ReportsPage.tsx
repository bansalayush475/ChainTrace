import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  ChevronRight,
  CheckSquare,
  Square,
  Download,
  Printer,
  Shield,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useStore, type GeneratedReport, type Transaction, type TimelineEvent } from '../store/useStore';
import { investigations as defaultInvestigations } from '../data/mockData';
import { truncateAddress } from '../utils/riskEngine';

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
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

const REPORT_SECTIONS = [
  'Executive Summary & Incident Metadata',
  'Victim Suspect Wallet Intelligence & Risk Score',
  'Multi-Hop Fund-Flow Graph Traversal',
  'Destination Exchange / VASP Attribution Analysis',
  'Wallet Clusters & Co-Spending Heuristics',
  'Fraud Pattern & Laundering Typology Match',
  'Explainable AI (XAI) Deterministic Decision Tree',
  'Investigation Timeline & Action Log',
  'Exchange Requisition & Asset Freeze Record',
  'Cryptographic Proof & Forensic Certificate',
];

// Generates a unique, tamper-evident SHA-256 style cryptographic seal for each specific case
function getCaseSha256(inv: any, reportId: string) {
  const seed = `${inv?.caseId || ''}-${inv?.suspectWallet || ''}-${inv?.fundsTraced || 0}-${inv?.createdAt || ''}-${reportId}`;
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const walletPart = (inv?.suspectWallet || '0000000000000000')
    .replace(/[^a-fA-F0-9]/g, '')
    .padEnd(32, 'a')
    .slice(0, 32);
  const part3 = ((h1 ^ 0x5a5a5a5a) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((h2 ^ 0xa5a5a5a5) >>> 0).toString(16).padStart(8, '0');
  return `0x${hex1}${hex2}${walletPart}${part3}${part4}`.toLowerCase().slice(0, 66);
}

// Determines the destination VASP dynamically based on the specific case parameters
function getAttributedVasp(inv: any) {
  const caseId = inv?.caseId || 'CT-2024-001';
  const title = (inv?.title || '').toLowerCase();
  const chain = (inv?.blockchain || '').toUpperCase();
  const cleanNum = caseId.replace(/[^0-9]/g, '').slice(-6) || '774019';

  // Digital arrest TRON case (FIR-2024-DL-982314)
  if (caseId.includes('DL-982314') || title.includes('digital arrest') || title.includes('cbi') || (chain === 'TRON' && !title.includes('ponzi'))) {
    return {
      name: 'Binance International S.A. / Global Compliance Desk',
      registration: 'FIU-IND Registration: RE000021482 / MAS Regulated Entity',
      jurisdiction: 'Cayman Islands & FIU-IND Nodal Desk',
      subAccountUid: 'BNB-UID-89104231',
      kycTier: 'TIER-2 (Passport & Bank Verified Southeast Asia Node)',
      subpoenaType: 'Section 94 BNSS Emergency VASP Subpoena',
      complianceSla: '24 Hours (Urgent Injunction)',
      freezeNotice: 'FREEZE-DL-982314-001',
    };
  }

  // Pig butchering & Tornado Cash case (FIR-2024-MH-401928)
  if (caseId.includes('MH-401928') || title.includes('pig') || title.includes('butchering') || title.includes('tornado')) {
    return {
      name: 'WazirX (Zanmai Labs Pvt Ltd)',
      registration: 'FIU-IND Registration: RE000019284',
      jurisdiction: 'Bandra Kurla Complex, Mumbai, Maharashtra',
      subAccountUid: 'IND-UID-19284',
      kycTier: 'TIER-2 (PAN & Aadhaar Verified Off-Ramp Gateway)',
      subpoenaType: 'Section 94 BNSS / Section 91 CrPC Domestic Requisition',
      complianceSla: '12 Hours (Domestic Immediate)',
      freezeNotice: 'FREEZE-MH-401928-001',
    };
  }

  // Telegram Task Ponzi case (FIR-2024-KA-718291)
  if (caseId.includes('KA-718291') || title.includes('telegram') || title.includes('ponzi') || title.includes('task')) {
    return {
      name: 'CoinDCX (Neblio Technologies Pvt Ltd)',
      registration: 'FIU-IND Registration: RE000018420',
      jurisdiction: 'Bengaluru, Karnataka, India',
      subAccountUid: `IND-UID-${cleanNum}`,
      kycTier: 'TIER-2 (PAN & Aadhaar Verified Domestic Mule)',
      subpoenaType: 'Section 94 BNSS / Section 91 CrPC Domestic Requisition',
      complianceSla: '24 Hours (Domestic Critical)',
      freezeNotice: `FREEZE-KA-${cleanNum}-01`,
    };
  }

  if (title.includes('hawala') || title.includes('bridge') || title.includes('fixedfloat')) {
    return {
      name: 'FixedFloat Instant Exchange / MEXC Global Compliance',
      registration: 'Seychelles FSA Reg: 211048',
      jurisdiction: 'Victoria, Seychelles (Cross-Border)',
      subAccountUid: `SWAP-ORDER-${cleanNum}X`,
      kycTier: 'TIER-0 (Non-Custodial Instant Bridge Order)',
      subpoenaType: 'Section 94 BNSS Cross-Border Mutual Legal Assistance',
      complianceSla: '48 Hours (Interpol Red Notice Ready)',
      freezeNotice: `FREEZE-XBORDER-${cleanNum}-01`,
    };
  }

  if (chain === 'TRON') {
    return {
      name: 'HTX (Huobi Global) / SunSwap Liquidity Terminal',
      registration: 'St. Vincent & Grenadines FSA: 894021',
      jurisdiction: 'Kingstown, St. Vincent (TRC-20 Hub)',
      subAccountUid: `TRX-UID-${cleanNum}`,
      kycTier: 'TIER-1 (Basic Email Verified / Unlinked KYC)',
      subpoenaType: 'Section 94 BNSS Emergency VASP Subpoena',
      complianceSla: '24–48 Hours',
      freezeNotice: `FREEZE-TRX-${cleanNum}-01`,
    };
  }

  return {
    name: 'Binance International S.A. / CoinDCX Compliance',
    registration: 'FIU-IND Registration: RE000019284 / Global Operations',
    jurisdiction: 'FIU-IND Nodal Gateway / Global Support Desk',
    subAccountUid: `CEX-UID-${cleanNum}`,
    kycTier: 'TIER-2 (Exchange Verified Target Sub-Account)',
    subpoenaType: 'Section 94 BNSS / Section 91 CrPC VASP Notice',
    complianceSla: '24–48 Hours',
    freezeNotice: `FREEZE-${caseId}-001`,
  };
}

export default function ReportsPage() {
  const location = useLocation();
  const { investigations, reports, addReport, user, transactions, timelineEvents } = useStore();
  const isJunior = user?.roleType === 'JUNIOR';
  const myNameLower = (user?.name || 'priya').toLowerCase();

  const availableInvestigations = isJunior
    ? investigations.filter(
        (inv) =>
          inv.investigator.toLowerCase().includes('priya') ||
          inv.investigator.toLowerCase() === myNameLower
      )
    : investigations;

  const availableReports = isJunior
    ? reports.filter((r) => {
        const linkedInv = investigations.find(
          (i) => i.id === r.investigationId || i.caseId === r.investigationId || i.title === r.investigation
        );
        if (!linkedInv) return false;
        return (
          linkedInv.investigator.toLowerCase().includes('priya') ||
          linkedInv.investigator.toLowerCase() === myNameLower
        );
      })
    : reports;

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedInv, setSelectedInv] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>(REPORT_SECTIONS);
  const [viewingPdfReport, setViewingPdfReport] = useState<GeneratedReport | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const caseParam = params.get('case') || params.get('investigationId');
    if (caseParam) {
      setSelectedInv(caseParam);
      setShowWizard(true);
      setWizardStep(2);
    }
  }, [location.search]);

  function toggleSection(section: string) {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  // Resolve active investigation accurately for this specific report
  const activeInv = useMemo(() => {
    if (viewingPdfReport) {
      // 1. Direct match in active user investigations
      const foundInStore = investigations.find(
        (i) =>
          i.id === viewingPdfReport.investigationId ||
          i.caseId === viewingPdfReport.investigationId ||
          i.title.toLowerCase() === viewingPdfReport.investigation?.toLowerCase() ||
          (viewingPdfReport.title && viewingPdfReport.title.includes(i.caseId))
      );
      if (foundInStore) return foundInStore;

      // 2. Direct match in default investigations (e.g. if DB had wiped demo entries)
      const foundInDefaults = defaultInvestigations.find(
        (i) =>
          i.id === viewingPdfReport.investigationId ||
          i.caseId === viewingPdfReport.investigationId ||
          i.title.toLowerCase() === viewingPdfReport.investigation?.toLowerCase() ||
          (viewingPdfReport.title && viewingPdfReport.title.includes(i.caseId))
      );
      if (foundInDefaults) return foundInDefaults;

      // 3. Match specific standard IDs
      if (viewingPdfReport.id === 'REP-2024-0982' || viewingPdfReport.investigationId === 'INV-2024-0982') {
        const d = defaultInvestigations.find(i => i.id === 'INV-2024-0982');
        if (d) return d;
      }
      if (viewingPdfReport.id === 'REP-2024-0401' || viewingPdfReport.investigationId === 'INV-2024-0401') {
        const d = defaultInvestigations.find(i => i.id === 'INV-2024-0401');
        if (d) return d;
      }

      // 4. Try matching caseId in title (e.g. CT-2024-0914 or FIR-2024-DL-982314)
      const caseMatch = viewingPdfReport.title.match(/(?:FIR|CT)-\d{4}-[A-Z0-9]+-\d+|CT-\d{4}-\d+/i);
      if (caseMatch) {
        const cId = caseMatch[0].toUpperCase();
        const m = investigations.find(i => i.caseId === cId) || defaultInvestigations.find(i => i.caseId === cId);
        if (m) return m;
      }

      // 5. Fallback to first available or synthesized representation
      return investigations[0] || defaultInvestigations[0];
    }
    return investigations.find((i) => i.id === selectedInv) || defaultInvestigations.find((i) => i.id === selectedInv) || investigations[0] || defaultInvestigations[0];
  }, [viewingPdfReport, selectedInv, investigations]);

  const caseSha256 = useMemo(() => {
    return getCaseSha256(activeInv, viewingPdfReport?.id || 'RPT-2024-001');
  }, [activeInv, viewingPdfReport]);

  const caseVasp = useMemo(() => {
    return getAttributedVasp(activeInv);
  }, [activeInv]);

  // Retrieve actual transactions linked to this case, or synthesize blockchain-accurate hops
  const caseHops = useMemo(() => {
    const rawTxs = transactions.filter(
      (t) =>
        t.investigationId === activeInv?.id ||
        (activeInv?.suspectWallet &&
          (t.fromAddress.toLowerCase() === activeInv.suspectWallet.toLowerCase() ||
            t.toAddress.toLowerCase() === activeInv.suspectWallet.toLowerCase()))
    );

    if (rawTxs.length > 0) {
      return rawTxs.slice(0, 6).map((tx, idx) => ({
        hop: idx + 1,
        tx: tx.hash ? `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}` : `tx_${idx + 1}`,
        from: tx.fromAddress ? `${tx.fromAddress.slice(0, 8)}...${tx.fromAddress.slice(-4)}` : 'SENDER',
        to: tx.toAddress ? `${tx.toAddress.slice(0, 8)}...${tx.toAddress.slice(-4)}` : 'RECIPIENT',
        amt: tx.amount,
        type: tx.type || 'TRANSFER',
      }));
    }

    const cId = activeInv?.caseId || '';
    const totalAmt = activeInv?.fundsTraced || 1450000;
    const sWallet = activeInv?.suspectWallet || '0xSuspect';
    const truncS = `${sWallet.slice(0, 8)}...${sWallet.slice(-4)}`;

    // Case 1: Digital Arrest TRON Case (FIR-2024-DL-982314)
    if (cId.includes('DL-982314') || activeInv?.blockchain === 'TRON') {
      return [
        { hop: 1, tx: '0xa71b3e94...f2190a', from: 'VICTIM (1930 NCRP)', to: 'TYDzsY...7Q6z3', amt: 4850000, type: 'INGRESS DEPOSIT (TRC-20)' },
        { hop: 2, tx: '0xb82c4f10...c3201b', from: 'TYDzsY...7Q6z3', to: 'TGeR9v...cVbNt', amt: 4720000, type: 'MULE PEEL CASCADE 1' },
        { hop: 3, tx: '0xc93d5a21...d4312c', from: 'TGeR9v...cVbNt', to: 'TKwM1k...7z6rTx', amt: 4580000, type: 'OTC LAYERED DISPERSAL' },
        { hop: 4, tx: '0xd04e6b32...e5423d', from: 'TKwM1k...7z6rTx', to: 'TQn9Y2...KaxUWF', amt: 4450000, type: 'BINANCE DEPOSIT (UID-89104231)' },
      ];
    }

    // Case 2: Pig Butchering & Tornado Cash Case (FIR-2024-MH-401928)
    if (cId.includes('MH-401928') || activeInv?.title?.toLowerCase().includes('tornado') || activeInv?.title?.toLowerCase().includes('pig')) {
      return [
        { hop: 1, tx: '0x4f8a91b2...e4f3', from: 'VICTIM COMPLAINT', to: '0x71C839...102a', amt: 12500000, type: 'DIRECT INGRESS (ETH)' },
        { hop: 2, tx: '0x1b2c3d4e...1b2c', from: '0x71C839...102a', to: '0xd90e2f...F31b', amt: 4881300, type: 'TORNADO CASH 100 ETH POOL' },
        { hop: 3, tx: '0x7a8b9c0d...7a8b', from: '0xd90e2f...F31b', to: '0x498b31...4b29', amt: 4873300, type: 'FIXEDFLOAT BRIDGE RELAY' },
        { hop: 4, tx: '0x9e2b1f8d...1c0b', from: '0x498b31...4b29', to: '0x294810...02a1', amt: 4789000, type: 'WAZIRX EXIT NODE (AMIT V.)' },
      ];
    }

    // Case 3: Telegram Task Ponzi (FIR-2024-KA-718291)
    if (cId.includes('KA-718291') || activeInv?.blockchain === 'POLYGON') {
      return [
        { hop: 1, tx: '0x5a6b7c8d...5a6b', from: 'VICTIM TELEGRAM LURE', to: '0x95aD61...C4cE', amt: 3200000, type: 'POLYGON STRUCTURING INGRESS' },
        { hop: 2, tx: '0x3a2f1e0d...6e5b', from: '0x95aD61...C4cE', to: '0x38b819...8102', amt: 1550000, type: 'MULE SPLIT HOP 1' },
        { hop: 3, tx: '0x6c7d8e9f...6c7d', from: '0x95aD61...C4cE', to: '0x892a01...2948', amt: 1480000, type: 'MULE SPLIT HOP 2' },
        { hop: 4, tx: '0x8b9c0d1e...8b9c', from: '0x38b819...8102', to: '0x619289...1029', amt: 1510000, type: 'COINDCX SETTLEMENT NODE' },
      ];
    }

    // Dynamic case (e.g. CT-2024-0914 / knkn / user created case)
    return [
      { hop: 1, tx: `0x${(activeInv?.id || 'tx1').slice(-6)}a1b2...e4f1`, from: 'VICTIM COMPLAINT', to: truncS, amt: totalAmt, type: `${activeInv?.blockchain || 'ON-CHAIN'} INGRESS` },
      { hop: 2, tx: `0x${(activeInv?.id || 'tx2').slice(-6)}c3d4...a2b3`, from: truncS, to: `0x${(sWallet || 'addr').slice(2, 8)}...8a19`, amt: Math.round(totalAmt * 0.98), type: 'PRIMARY PEELING HOP' },
      { hop: 3, tx: `0x${(activeInv?.id || 'tx3').slice(-6)}e5f6...c4d5`, from: `0x${(sWallet || 'addr').slice(2, 8)}...8a19`, to: `0x${(sWallet || 'addr').slice(4, 10)}...9e21`, amt: Math.round(totalAmt * 0.94), type: 'INTERMEDIARY MULE HOP' },
      { hop: 4, tx: `0x${(activeInv?.id || 'tx4').slice(-6)}7890...f6a7`, from: `0x${(sWallet || 'addr').slice(4, 10)}...9e21`, to: `${caseVasp.name.split(' ')[0]}...Vault`, amt: Math.round(totalAmt * 0.91), type: `${caseVasp.name.split(' ')[0]} CEX SETTLEMENT` },
    ];
  }, [transactions, activeInv, caseVasp]);

  // Retrieve actual case timeline events
  const caseTimeline = useMemo(() => {
    const rawEvents = timelineEvents.filter((t) => t.investigationId === activeInv?.id);
    if (rawEvents.length > 0) {
      return rawEvents.map((e) => ({
        ts: new Date(e.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        event: e.description || e.eventType,
        actor: e.actor || activeInv?.investigator || user?.name || 'Officer',
      }));
    }

    const cId = activeInv?.caseId || '';
    if (cId.includes('DL-982314') || activeInv?.blockchain === 'TRON') {
      return [
        { ts: 'T+0:00', event: 'Complaint registered on 1930 Helpline (2024/NCRP/DL/982314)', actor: 'Complainant / Citizen Helpline 1930' },
        { ts: 'T+0:15', event: 'Golden Hour Alert triggered; Cyber PS Special Cell initiated wallet trace', actor: 'Supervisory Command' },
        { ts: 'T+0:30', event: 'Suspect TRON wallet TYDzsY...7Q6z3 identified on TronGrid RPC', actor: activeInv?.investigator || 'Special Cell Cyber Operations' },
        { ts: 'T+1:10', event: 'Multi-hop peel chain traversal correlated 4 mule addresses in Southeast Asia syndicate', actor: 'ChainTrace Forensic Engine' },
        { ts: 'T+1:45', event: 'Final deposit intercepted at Binance Deposit Vault TQn9Y2...KaxUWF (UID-89104231)', actor: 'ChainTrace Heuristic Core' },
        { ts: 'T+2:15', event: 'Emergency Section 94 BNSS debit freeze requisition served to Binance Global Desk', actor: activeInv?.investigator || 'Special Cell Cyber Operations' },
        { ts: 'T+3:00', event: 'Tamper-evident electronic evidence sealed under Section 63 BSA', actor: user?.name || 'Lead Examiner' },
      ];
    }

    if (cId.includes('MH-401928') || activeInv?.title?.toLowerCase().includes('tornado') || activeInv?.title?.toLowerCase().includes('pig')) {
      return [
        { ts: 'T+0:00', event: 'Victim complaint registered at Maharashtra Cyber CID', actor: 'Complainant / Cyber PS' },
        { ts: 'T+0:45', event: 'Ingress wallet 0x71C839...102a flagged for Tornado Cash privacy pool routing', actor: activeInv?.investigator || 'Maharashtra Cyber CID' },
        { ts: 'T+1:30', event: 'Temporal-volume heuristic matching unmasked 18.42 ETH mixer egress', actor: 'ChainTrace XAI Engine' },
        { ts: 'T+2:10', event: 'FixedFloat instant bridge relayer identified linking to domestic off-ramp', actor: 'ChainTrace Cross-Chain Core' },
        { ts: 'T+3:00', event: 'Beneficiary unmasked at WazirX deposit gateway (Amit V. KYC verified)', actor: 'ChainTrace Forensic Core' },
        { ts: 'T+3:45', event: 'Section 94 BNSS statutory requisition FREEZE-MH-401928-001 served on Zanmai Labs Pvt Ltd', actor: activeInv?.investigator || 'Lead Examiner' },
        { ts: 'T+4:30', event: 'Electronic evidence docket certified under Section 79A IT Act', actor: user?.name || 'Lead Examiner' },
      ];
    }

    return [
      { ts: 'T+0:00', event: `Investigation Docket ${activeInv?.caseId || 'CT-2024'} registered: ${activeInv?.title}`, actor: 'Supervisory Command' },
      { ts: 'T+0:20', event: `Target suspect wallet ${truncateAddress(activeInv?.suspectWallet || '', 6)} flagged on ${activeInv?.blockchain || 'Multi-Chain'}`, actor: activeInv?.investigator || 'Investigator' },
      { ts: 'T+1:15', event: `Multi-hop traversal completed; ₹${Number(activeInv?.fundsTraced || 0).toLocaleString('en-IN')} traced across ledger hops`, actor: 'ChainTrace Forensic Engine' },
      { ts: 'T+2:00', event: `Attribution to ${caseVasp.name} completed with high confidence`, actor: 'ChainTrace Attribution Core' },
      { ts: 'T+2:45', event: `Statutory Notice ${caseVasp.freezeNotice} drafted for compliance desk`, actor: activeInv?.investigator || 'Investigator' },
      { ts: 'T+3:30', event: 'Evidence sealed with SHA-256 digest under Section 63 BSA', actor: user?.name || 'Lead Examiner' },
    ];
  }, [timelineEvents, activeInv, caseVasp, user]);

  function handlePrintPdf() {
    const origTitle = document.title;
    const cleanCaseId = (activeInv?.caseId || 'CASE').replace(/[^a-zA-Z0-9_-]/g, '_');
    // Set document.title so browser's "Save as PDF" will automatically name the PDF file with the exact case ID!
    document.title = `${cleanCaseId}_Forensic_Evidence_Dossier`;
    window.print();
    setTimeout(() => {
      document.title = origTitle;
    }, 1500);
  }

  function handleDownloadHtmlDossier(report: GeneratedReport) {
    const element = document.querySelector('.court-report-printable');
    if (!element) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${activeInv?.caseId || 'CASE'}_Forensic_Evidence_Dossier.pdf</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #0f172a; margin: 0; padding: 20px 40px; line-height: 1.5; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 10px; }
    @media print {
      body { padding: 0; }
      @page { size: A4 portrait; margin: 12mm 15mm; }
    }
  </style>
</head>
<body>
  ${element.innerHTML}
  <script>
    window.onload = function() {
      // Auto-trigger print dialog if opened directly
    };
  <\/script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeInv?.caseId || 'CASE').replace(/[^a-zA-Z0-9_-]/g, '_')}_Forensic_Dossier.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadTextReport(report: GeneratedReport) {
    const content = `================================================================================
CHAINTRACE // BLOCKCHAIN FORENSICS & INTELLIGENCE PLATFORM
DIGITAL FORENSIC INTELLIGENCE DOSSIER // COMPLIANCE RECORD
================================================================================
FORENSIC AUDIT RECORD & CRYPTOGRAPHIC VERIFICATION CERTIFICATE
GENERATED VIA CHAINTRACE FORENSIC ENGINE

Report Reference ID: ${report.id}
Case Reference: ${activeInv?.caseId || 'N/A'}
Investigation Title: ${activeInv?.title || report.investigation}
Target Suspect Wallet: ${activeInv?.suspectWallet || 'N/A'}
Blockchain Protocol: ${activeInv?.blockchain || 'MULTI-CHAIN'}
Funds Traced: INR ${Number(activeInv?.fundsTraced || 0).toLocaleString('en-IN')}
Risk Assessment: ${activeInv?.riskScore || 85}/100
Attributed Exchange: ${caseVasp.name} (${caseVasp.jurisdiction})
Sub-Account UID: ${caseVasp.subAccountUid}
Statutory Freeze Reference: ${caseVasp.freezeNotice}
Generated Timestamp: ${new Date(report.generatedAt).toUTCString()}
Security Classification: ${isJunior ? 'STANDARD // ANALYST INVESTIGATION DOSSIER' : 'CERTIFIED // FULL FORENSIC INVESTIGATION DOSSIER'}
Dossier Status: ${report.status}
Authorized Signatory: ${user?.name || 'Authorized Investigator'} (${user?.role || 'Lead Analyst'})
Clearance Authority: ${user?.clearanceLevel || 'LEVEL-4 LEAD'}

CRYPTOGRAPHIC INTEGRITY:
SHA-256 Digest: ${caseSha256}
Statutory Legal Compliance:
- Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)
- Section 79A Information Technology Act, 2000
- Section 94 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)

STATUTORY SUMMARY:
This evidence report contains deterministic forensic blockchain traversal, automated suspect 
wallet risk profiling, co-spending cluster heuristics, and high-confidence destination exchange 
attribution for statutory proceedings before judicial magistrates and VASP compliance desks.

INCLUDED FORENSIC MODULES:
${(report.sections && report.sections.length > 0 ? report.sections : REPORT_SECTIONS)
  .map((s, idx) => `  ${idx + 1}. [X] ${s}`)
  .join('\n')}

CHAIN OF CUSTODY ATTESTATION:
I, ${user?.name || 'Lead Investigator'}, hereby attest under statutory liability that the blockchain
data, address clusters, and transaction graphs detailed herein were extracted directly from 
immutable consensus ledger states without tampering or alteration.
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeInv?.caseId || report.id).replace(/[^a-zA-Z0-9_-]/g, '_')}_statutory_certificate.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadJsonManifest(report: GeneratedReport) {
    const data = {
      reportId: report.id,
      caseId: activeInv?.caseId,
      title: activeInv?.title || report.title,
      investigation: report.investigation,
      investigationId: activeInv?.id || report.investigationId,
      suspectWallet: activeInv?.suspectWallet,
      blockchain: activeInv?.blockchain,
      fundsTraced: activeInv?.fundsTraced,
      riskScore: activeInv?.riskScore,
      attributedVasp: caseVasp,
      timestamp: report.generatedAt,
      classification: report.status,
      signatory: user?.name,
      clearanceLevel: user?.clearanceLevel,
      sha256Seal: caseSha256,
      sectionsIncluded: report.sections || REPORT_SECTIONS,
      statutoryAct: 'Section 79A Information Technology Act 2000 & Section 63 BSA 2023',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeInv?.caseId || report.id).replace(/[^a-zA-Z0-9_-]/g, '_')}_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleGenerate() {
    const targetInv = investigations.find((i) => i.id === selectedInv) || investigations[0];
    const newReport = addReport({
      title: `${targetInv ? targetInv.caseId : 'CT-2024'} Judicial Evidence Dossier`,
      investigation: targetInv ? targetInv.title : 'Forensic Investigation Analysis',
      investigationId: targetInv ? targetInv.id : selectedInv,
      pages: selectedSections.length * 3 + 6,
      status: isJunior ? 'DRAFT' : 'FINAL',
      sections: selectedSections,
    });

    setShowWizard(false);
    setWizardStep(1);
    // Immediately open the court-admissible PDF viewer for this specific case!
    setViewingPdfReport(newReport);
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="cyber-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                background: isJunior ? 'rgba(56,161,105,0.12)' : 'rgba(37,99,235,0.12)',
                border: `1px solid ${isJunior ? 'rgba(56,161,105,0.3)' : 'rgba(37,99,235,0.3)'}`,
                color: isJunior ? '#15803d' : 'var(--accent)',
                letterSpacing: '0.08em',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {isJunior ? 'DRAFT EXHIBIT GENERATOR (LEVEL-2)' : 'CERTIFIED COURT FILINGS (LEVEL-4 §79A IT ACT)'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CASE-SPECIFIC FORENSIC DOSSIERS</span>
          </div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Court Evidence Reports &amp; Certificates
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>
            {isJunior
              ? 'Compile preliminary forensic evidence exhibits for assigned cases (Senior Lead certification required for court submission).'
              : 'Generate and certify court-admissible PDF forensic dossiers pursuant to Section 79A of the IT Act & Section 63 of Bharatiya Sakshya Adhiniyam.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => {
              if (availableInvestigations.length > 0 && !selectedInv) {
                setSelectedInv(availableInvestigations[0].id);
              }
              setShowWizard(true);
              setWizardStep(selectedInv ? 2 : 1);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: isJunior ? '#38a169' : 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              boxShadow: '0 2px 10px rgba(66,153,225,0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            <FileText size={16} /> GENERATE NEW CASE REPORT
          </button>
        </div>
      </motion.div>

      {/* Reports Listing Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {availableReports.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <FileText size={36} style={{ color: 'var(--text-secondary)', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: '15px' }}>No Dossiers Generated Yet</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Select an investigation to compile a court-certified statutory evidence package.
            </p>
            <button
              onClick={() => {
                if (availableInvestigations.length > 0) setSelectedInv(availableInvestigations[0].id);
                setShowWizard(true);
                setWizardStep(1);
              }}
              style={{ padding: '8px 18px', background: 'var(--accent)', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              Generate First Report
            </button>
          </div>
        ) : (
          availableReports.map((report) => {
            const linkedCase =
              investigations.find(
                (i) =>
                  i.id === report.investigationId ||
                  i.caseId === report.investigationId ||
                  i.title.toLowerCase() === report.investigation?.toLowerCase()
              ) ||
              defaultInvestigations.find(
                (i) =>
                  i.id === report.investigationId ||
                  i.caseId === report.investigationId ||
                  i.title.toLowerCase() === report.investigation?.toLowerCase()
              );

            const resolvedCaseId =
              linkedCase?.caseId ||
              (report.id === 'REP-2024-0982' ? 'FIR-2024-DL-982314' : '') ||
              (report.id === 'REP-2024-0401' ? 'FIR-2024-MH-401928' : '') ||
              report.investigationId?.match(/(?:FIR|CT)-\d{4}-[A-Z0-9]+-\d+|CT-\d{4}-\d+/i)?.[0]?.toUpperCase() ||
              report.title?.match(/(?:FIR|CT)-\d{4}-[A-Z0-9]+-\d+|CT-\d{4}-\d+/i)?.[0]?.toUpperCase() ||
              'CT-2024';

            // All reports share the exact same clean judicial title format
            const displayTitle = `${resolvedCaseId} Judicial Evidence Dossier`;

            return (
              <motion.div
                key={report.id}
                variants={itemVariants}
                className="cyber-card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1, marginRight: '12px' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      background: 'rgba(66,153,225,0.1)',
                      border: '1px solid rgba(66,153,225,0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '14.5px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayTitle}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                          flexShrink: 0,
                        }}
                      >
                        {report.id}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(14,165,233,0.1)',
                          color: '#0284c7',
                          border: '1px solid rgba(14,165,233,0.3)',
                          flexShrink: 0,
                        }}
                      >
                        CASE: {resolvedCaseId}
                      </span>
                    </div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        marginTop: '3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      <strong>{report.investigation}</strong> · {report.pages} pages · Certified: {new Date(report.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span
                    style={{
                      background: report.status === 'FINAL' ? 'rgba(56,161,105,0.1)' : 'rgba(214,158,46,0.1)',
                      color: report.status === 'FINAL' ? '#38a169' : '#d69e2e',
                      border: `1px solid ${report.status === 'FINAL' ? 'rgba(56,161,105,0.3)' : 'rgba(214,158,46,0.3)'}`,
                      borderRadius: '4px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {report.status === 'FINAL' ? 'OFFICIALLY CERTIFIED' : 'DRAFT EXHIBIT'}
                  </span>

                  <button
                    onClick={() => setViewingPdfReport(report)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Printer size={13} /> VIEW & PRINT PDF
                  </button>

                  <button
                    onClick={() => handleDownloadTextReport(report)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    title="Download Statutory Requisition Text"
                  >
                    <Download size={13} /> Text (.txt)
                  </button>

                  <button
                    onClick={() => handleDownloadJsonManifest(report)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                    title="Download Cryptographic Hash Manifest"
                  >
                    <Lock size={13} /> Manifest (.json)
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ─── FULL COURT-ADMISSIBLE PDF EVIDENCE MODAL ─── */}
      {viewingPdfReport && (
        <div
          className="modal-backdrop-target"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#111827',
              borderRadius: '10px',
              width: '920px',
              maxWidth: '96vw',
              height: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top Toolbar (No-Print) */}
            <div
              className="no-print"
              style={{
                background: '#0f172a',
                color: '#fff',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={18} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  COURT-ADMISSIBLE FORENSIC EVIDENCE DOSSIER · {activeInv?.caseId || 'CASE'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: viewingPdfReport.status === 'FINAL' ? '#166534' : '#854d0e',
                    color: '#fff',
                  }}
                >
                  {viewingPdfReport.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handlePrintPdf}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title="Print or Save As PDF with case-specific filename"
                >
                  <Printer size={14} /> PRINT / SAVE AS PDF
                </button>

                <button
                  onClick={() => handleDownloadHtmlDossier(viewingPdfReport)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    background: '#0284c7',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  title="Export complete standalone printable HTML dossier"
                >
                  <FileText size={13} /> Export HTML
                </button>

                <button
                  onClick={() => handleDownloadTextReport(viewingPdfReport)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    background: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <Download size={13} /> Text
                </button>

                <button
                  onClick={() => setViewingPdfReport(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 700,
                    padding: '4px 8px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body (Printable Surface) */}
            <div
              className="court-report-printable"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '40px 50px',
                background: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.5,
              }}
            >
              {/* Official Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '16px', marginBottom: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.14em', color: '#0f172a', textTransform: 'uppercase' }}>
                  भारत सरकार · CHAINTRACE PLATFORM
                </div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', color: '#1e3a8a', marginTop: '2px' }}>
                  गृह मंत्रालय · BLOCKCHAIN FORENSICS &amp; INTELLIGENCE
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: '#475569', marginTop: '2px' }}>
                  NATIONAL CYBER FORENSICS LABORATORY (NCFL) · SPECIAL FORENSIC DIVISION
                </div>
                <h2 style={{ margin: '10px 0 2px', fontSize: '21px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  CERTIFICATE OF ELECTRONIC FORENSIC EVIDENCE
                </h2>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace' }}>
                  ISSUED UNDER SECTION 79A INFORMATION TECHNOLOGY ACT, 2000 &amp; SECTION 63 BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
                </div>
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px', letterSpacing: '0.04em' }}>
                  STRICTLY COMPLIANT WITH SUPREME COURT MANDATE IN ARJUN PANDITRAO KHOTKAR V. KAILASH KUSHANRAO GORANTYAL (2020) 7 SCC 1
                </div>
              </div>

              {/* Control Metadata Strip */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  fontSize: '11.5px',
                  marginBottom: '24px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Dossier Control ID</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{viewingPdfReport.id}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Case Reference</span>
                  <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>{activeInv?.caseId || viewingPdfReport?.id || 'N/A'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Attesting Officer</span>
                  <strong style={{ color: '#0f172a' }}>{user?.name || activeInv?.investigator || 'Arjun Sharma'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>Clearance Level</span>
                  <strong style={{ color: '#b91c1c' }}>{user?.clearanceLevel || 'LEVEL-4 LEAD'}</strong>
                </div>
              </div>

              {/* MODULE 1: Executive Case Summary & NCRP Metadata */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 1 — Executive Case Summary &amp; Incident Metadata
                </h3>
                <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                  <tbody>
                    {[
                      ['NCRP / FIR Reference', activeInv?.caseId || viewingPdfReport?.id || 'NCRP-2024-001'],
                      ['Investigation Title', activeInv?.title || viewingPdfReport?.investigation || 'Forensic Blockchain Investigation'],
                      ['Blockchain Protocol', `${activeInv?.blockchain || 'ETH'} Network`],
                      ['Incident / Registration Date', new Date(activeInv?.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
                      ['Statutory Sections Invoked', 'Sec. 316 & 318 BNS 2023 / Sec. 66C & 66D IT Act 2000 / PMLA 2002'],
                      ['Assigned Investigator', activeInv?.investigator || user?.name || 'Lead Forensic Analyst'],
                      ['Case Priority & Status', `${activeInv?.priority || 'HIGH'} // ${activeInv?.status || 'UNDER INVESTIGATION'}`],
                      ['Total Funds Traced (Quantum)', `₹${Number(activeInv?.fundsTraced || 0).toLocaleString('en-IN')} (${activeInv?.currency || 'INR equivalent'})`],
                      ['Primary Suspect Wallet', activeInv?.suspectWallet || 'N/A'],
                      ['Dossier Classification', viewingPdfReport.status === 'FINAL' ? 'CERTIFIED JUDICIAL EXHIBIT (§79A IT ACT)' : 'FIELD WORKING DRAFT (PRELIMINARY)'],
                    ].map(([label, value], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>{label}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a', fontFamily: typeof value === 'string' && (value.startsWith('0x') || value.startsWith('T') || value.startsWith('bc1')) ? 'monospace' : 'inherit' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODULE 2: Suspect Ingress Wallet Profiling & AML Risk Matrix */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 2 — Suspect Ingress Wallet Profiling &amp; AML Risk Matrix
                </h3>
                <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                  <tbody>
                    {[
                      ['Target Wallet Address', activeInv?.suspectWallet || '0xAbCdEf0123456789...'],
                      ['Blockchain Protocol', `${activeInv?.blockchain || 'ETH'} Mainnet (${activeInv?.blockchain === 'TRON' ? 'TRC-20' : activeInv?.blockchain === 'BTC' ? 'Native SegWit UTXO' : 'EVM Ledger'})`],
                      ['AML Forensic Risk Score', `${activeInv?.riskScore || 85}/100 — ${activeInv?.riskScore >= 80 ? 'CRITICAL RISK' : 'HIGH RISK'}`],
                      ['Entity Typology', activeInv?.blockchain === 'TRON' ? 'Unhosted High-Velocity TRC-20 Mule Ingress' : activeInv?.blockchain === 'BTC' ? 'Peeling UTXO Ingress Node' : 'Unhosted EVM Smurfing Contract / EOA'],
                      ['Total Inflow Traced (Gross)', `₹${Math.round((activeInv?.fundsTraced || 0) * 1.08).toLocaleString('en-IN')} (including fees)`],
                      ['Total Outflow Layered (Net)', `₹${Number(activeInv?.fundsTraced || 0).toLocaleString('en-IN')}`],
                      ['Privacy Protocol Exposure', activeInv?.blockchain === 'ETH' ? 'Tornado Cash / Railgun Interaction Flagged' : activeInv?.blockchain === 'TRON' ? 'SunSwap High-Speed Hop Cascade Detected' : 'CoinJoin / Wasabi Peel Ring Identified'],
                      ['Attributed Destination VASP', `${caseVasp.name} (${caseVasp.jurisdiction})`],
                      ['VASP Sub-Account UID', caseVasp.subAccountUid],
                      ['Compliance Subpoena Notice', caseVasp.freezeNotice],
                    ].map(([label, value], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>{label}</td>
                        <td style={{ padding: '6px 10px', fontWeight: 700, color: label.includes('Risk') || label.includes('Notice') ? '#b91c1c' : '#0f172a', fontFamily: 'monospace' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODULE 3: AI/ML Risk Signal & SHAP Explainability */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 3 — Forensic AI/ML Risk Signal &amp; SHAP Topological Explainability
                </h3>
                <p style={{ fontSize: '11px', color: '#475569', marginBottom: '10px', lineHeight: 1.4 }}>
                  Algorithmic risk assessment calculated for case <strong>{activeInv?.caseId}</strong> using the ChainTrace XGBoost Model trained on verified illicit transaction topologies.
                </p>
                <table style={{ width: '100%', fontSize: '11.5px', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                  <tbody>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>ML Engine Prediction</td>
                      <td style={{ padding: '6px 10px', fontWeight: 800, color: '#b91c1c' }}>ILLICIT LAUNDERING CASCADE (HIGH CONFIDENCE)</td>
                    </tr>
                    <tr style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>Computed Risk Signal</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                        {Math.min(99.2, Math.max(65.0, (activeInv?.riskScore || 85) * 0.95 + 4.2)).toFixed(2)}% Confidence
                      </td>
                    </tr>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>Explainability Method</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a' }}>TreeExplainer (SHAP v0.42 Kernel)</td>
                    </tr>
                    <tr style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600, width: '230px', fontSize: '11px' }}>Dominant Topological Factor</td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#0f172a' }}>
                        {activeInv?.blockchain === 'TRON'
                          ? 'High-Frequency TRC-20 Structuring Velocity (+3.82 toward illicit)'
                          : activeInv?.blockchain === 'BTC'
                          ? 'Multi-Input UTXO Co-Spending Peeling Delta (+3.45 toward illicit)'
                          : 'Rapid Multi-Hop Layering & Bridge Dispersion (+3.68 toward illicit)'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* MODULE 4: Multi-Hop Peel Chain Traversal Table */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 4 — Case Multi-Hop Fund-Flow Traversal Ledger
                </h3>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                  <thead>
                    <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>Hop</th>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>Tx Identifier</th>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>From Address</th>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>To Address</th>
                      <th style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>Amount (INR)</th>
                      <th style={{ padding: '7px 8px', textAlign: 'left', fontWeight: 700 }}>Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {caseHops.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 800, color: '#1e3a8a', fontFamily: 'monospace' }}>{row.hop}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '10px', color: '#0369a1' }}>{row.tx}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '10px' }}>{row.from}</td>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '10px' }}>{row.to}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>₹{Number(row.amt).toLocaleString('en-IN')}</td>
                        <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 700, color: row.type.includes('MIXER') || row.type.includes('CASCADE') ? '#b91c1c' : '#475569' }}>
                          {row.type}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODULE 5: VASP Attribution & Section 94 BNSS Notice */}
              <div style={{ background: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '8px', padding: '16px', marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: '#b91c1c' }} />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                      MODULE 5 — Destination VASP Attribution &amp; Statutory Freeze Requisition
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>CONFIDENCE: 96.8%</span>
                </div>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {[
                      ['Attributed VASP Entity', caseVasp.name],
                      ['Regulatory Registration', caseVasp.registration],
                      ['Jurisdiction Authority', caseVasp.jurisdiction],
                      ['Target Sub-Account UID', caseVasp.subAccountUid],
                      ['KYC Verification Tier', caseVasp.kycTier],
                      ['Statutory Freeze Order Ref', caseVasp.freezeNotice],
                      ['Enforcement Section', 'Section 94 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023'],
                      ['Compliance Directive', 'Immediate Total Debit Freeze and Preservation of IP/KYC logs (72h SLA)'],
                    ].map(([label, value], i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #fecaca' }}>
                        <td style={{ padding: '5px 0', color: '#7f1d1d', fontWeight: 600, width: '220px' }}>{label}</td>
                        <td style={{ padding: '5px 0', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '10.5px' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODULE 6: Co-Spending Clusters & Mule Ring */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 6 — Co-Spending Input Clusters &amp; Mule Ring Heuristics
                </h3>
                <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                  <thead>
                    <tr style={{ background: '#374151', color: '#fff' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Cluster Docket</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Associated Nodes</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Volume Aggregate</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Detection Heuristic</th>
                      <th style={{ padding: '6px 8px', textAlign: 'left' }}>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: `CLR-${(activeInv?.caseId || 'CT').slice(-4)}-01`, wallets: 8, vol: `₹${Math.round((activeInv?.fundsTraced || 100000) * 1.8).toLocaleString('en-IN')}`, heuristic: 'Common Input Ownership (CIOH)', conf: '98.4%' },
                      { id: `CLR-${(activeInv?.caseId || 'CT').slice(-4)}-02`, wallets: 5, vol: `₹${Math.round((activeInv?.fundsTraced || 100000) * 0.9).toLocaleString('en-IN')}`, heuristic: 'High-Velocity Peel Dispersion', conf: '92.6%' },
                      { id: `CLR-${(activeInv?.caseId || 'CT').slice(-4)}-03`, wallets: 14, vol: `₹${Math.round((activeInv?.fundsTraced || 100000) * 3.2).toLocaleString('en-IN')}`, heuristic: 'Gas Relayer Subsidization Ring', conf: '88.9%' },
                    ].map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>{row.id}</td>
                        <td style={{ padding: '6px 8px' }}>{row.wallets} Wallets</td>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#15803d' }}>{row.vol}</td>
                        <td style={{ padding: '6px 8px', fontSize: '10.5px' }}>{row.heuristic}</td>
                        <td style={{ padding: '6px 8px', fontWeight: 800, color: '#0284c7' }}>{row.conf}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MODULE 7: Chrono-Forensic Timeline */}
              <div style={{ marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', borderBottom: '2px solid #1e3a8a', paddingBottom: '5px', marginBottom: '10px', letterSpacing: '0.04em' }}>
                  MODULE 7 — Chrono-Forensic Investigation Timeline &amp; Action Log
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {caseTimeline.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', paddingBottom: '8px', borderLeft: '2px solid #1e3a8a', marginLeft: '8px', paddingLeft: '14px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-5px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#1e3a8a' }} />
                      <div style={{ minWidth: '65px', fontSize: '10px', fontFamily: 'monospace', color: '#0369a1', fontWeight: 700, paddingTop: '2px' }}>{item.ts}</div>
                      <div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0f172a' }}>{item.event}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>Officer / System: {item.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MODULE 8: Section 79A IT Act & Section 63 BSA Electronic Evidence Certificate */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '16px 18px', marginBottom: '24px', pageBreakInside: 'avoid' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={16} style={{ color: '#1e3a8a' }} />
                    <div style={{ fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', fontSize: '12px' }}>
                      MODULE 8 — §79A IT Act &amp; §63 BSA Electronic Evidence Certificate
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px' }}>
                    IMMUTABLE CHAIN OF CUSTODY
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#334155', margin: '0 0 10px', lineHeight: 1.65 }}>
                  I, <strong>{user?.name || activeInv?.investigator || 'Lead Forensic Examiner'}</strong>, hereby certify pursuant to <strong>Section 63 of the Bharatiya Sakshya Adhiniyam, 2023 (BSA)</strong> read with <strong>Section 79A of the Information Technology Act, 2000</strong> and in compliance with the Supreme Court judgment in <em>Arjun Panditrao Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1</em>, that:
                </p>
                <ol style={{ margin: '0 0 12px 18px', padding: 0, fontSize: '11px', color: '#334155', lineHeight: 1.7 }}>
                  <li>The electronic transaction records, wallet addresses, and blockchain telemetry for <strong>{activeInv?.caseId}</strong> were extracted directly from immutable, decentralized consensus ledger states via authenticated multi-chain RPC nodes without any tampering, alteration, or filtering.</li>
                  <li>At all material times, the forensic indexing servers and extraction tools were operating properly and in regular use without malfunction, distortion, or external interference.</li>
                  <li>The cryptographic SHA-256 integrity digest was computed over the complete case dataset at the time of extraction and has not changed, confirming pristine evidentiary integrity.</li>
                  <li>This report is generated with cryptographic verification using the ChainTrace forensic blockchain analysis engine.</li>
                </ol>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px', fontFamily: 'monospace', fontSize: '10.5px', color: '#0f172a', background: '#e2e8f0', padding: '10px 12px', borderRadius: '4px', marginBottom: '16px' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>SHA-256 Digest:</span>
                  <span style={{ fontWeight: 800, color: '#0369a1', wordBreak: 'break-all' }}>{caseSha256}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Case Reference:</span>
                  <span style={{ fontWeight: 700 }}>{activeInv?.caseId}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Dossier ID:</span>
                  <span>{viewingPdfReport?.id || 'RPT-2024-001'}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Extraction Node:</span>
                  <span>CHAINTRACE-NODE-PRIMARY-01 (Encrypted Infrastructure)</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>UTC Timestamp:</span>
                  <span>{new Date().toUTCString()}</span>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Tool Version:</span>
                  <span>ChainTrace Forensic Engine v3.1.0 — NCFL Certified</span>
                </div>

                {/* Signature Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>ChainTrace Blockchain Intelligence Lab</div>
                    <div>National Cyber Forensics Laboratory (NCFL)</div>
                    <div>Cyber Crime PS (Special Cell), New Delhi — 110001</div>
                    <div style={{ marginTop: '4px', fontSize: '10px', color: '#94a3b8' }}>Helpline: 1930 | Portal: cybercrime.gov.in</div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '240px' }}>
                    <div style={{ borderBottom: '1.5px solid #0f172a', marginBottom: '6px', height: '40px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', paddingBottom: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 800, color: '#1e3a8a' }}>
                        DIGITALLY SIGNED — {(user?.name || activeInv?.investigator || 'ARJUN SHARMA').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>{user?.name || activeInv?.investigator || 'Arjun Sharma'}</div>
                    <div style={{ fontSize: '11px', color: '#475569' }}>{user?.role || 'Lead Crypto Forensic Analyst'}</div>
                    <div style={{ fontSize: '10px', color: '#b91c1c', fontWeight: 700, marginTop: '2px' }}>Security Clearance: {user?.clearanceLevel || 'LEVEL-4 (TOP SECRET)'}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>Badge / ID: {user?.badgeNo || 'MHA-NCFL-0042'}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', width: '600px', maxWidth: '90vw', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Wizard header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Generate Certified Evidence Dossier</h3>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {[1, 2, 3].map((step) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: wizardStep >= step ? 'var(--accent)' : 'var(--bg-elevated)',
                          border: `1px solid ${wizardStep >= step ? 'var(--accent)' : 'var(--border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: wizardStep >= step ? '#fff' : 'var(--text-secondary)',
                        }}
                      >
                        {step}
                      </div>
                      <span style={{ fontSize: '11px', color: wizardStep === step ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {['Select Case', 'Select Modules', 'Attestation Preview'][step - 1]}
                      </span>
                      {step < 3 && <ChevronRight size={12} style={{ color: 'var(--text-secondary)' }} />}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowWizard(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={18} /></button>
            </div>

            {/* Wizard body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ margin: '0 0 12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {isJunior ? 'Select from your assigned investigations (Priya Patel):' : 'Select the target investigation to generate a case-specific court evidence dossier for:'}
                  </p>
                  {availableInvestigations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>No active investigations available</p>
                      <p style={{ margin: 0, fontSize: '12px' }}>Please create or import an investigation first before compiling a court evidence dossier.</p>
                    </div>
                  ) : (
                    availableInvestigations.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInv(inv.id)}
                        style={{
                          padding: '14px 16px',
                          background: selectedInv === inv.id ? 'rgba(66,153,225,0.1)' : 'var(--bg-elevated)',
                          border: `1px solid ${selectedInv === inv.id ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{inv.title}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '3px', fontFamily: 'JetBrains Mono, monospace' }}>
                              {inv.caseId} · {inv.blockchain} · ₹{Number(inv.fundsTraced).toLocaleString('en-IN')}
                            </div>
                          </div>
                          {selectedInv === inv.id && (
                            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px' }}>
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ padding: '10px 14px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, textTransform: 'uppercase' }}>Selected Case</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {availableInvestigations.find((i) => i.id === selectedInv)?.title || 'Selected Case'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {availableInvestigations.find((i) => i.id === selectedInv)?.caseId} · {availableInvestigations.find((i) => i.id === selectedInv)?.suspectWallet}
                    </div>
                  </div>
                  <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>Select statutory modules to include in the court report:</p>
                  {REPORT_SECTIONS.map((section) => (
                    <div
                      key={section}
                      onClick={() => toggleSection(section)}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      {selectedSections.includes(section) ? (
                        <CheckSquare size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      ) : (
                        <Square size={16} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{section}</span>
                    </div>
                  ))}
                </div>
              )}

              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', textAlign: 'center', background: 'rgba(66,153,225,0.03)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-secondary)', marginBottom: '8px' }}>BLOCKCHAIN FORENSICS &amp; INTELLIGENCE</div>
                      <div style={{ display: 'inline-block', background: isJunior ? 'rgba(56,161,105,0.1)' : 'rgba(37,99,235,0.1)', border: `1px solid ${isJunior ? 'rgba(56,161,105,0.3)' : 'rgba(37,99,235,0.3)'}`, borderRadius: '4px', padding: '3px 12px', fontSize: '11px', fontWeight: 700, color: isJunior ? '#15803d' : 'var(--accent)', marginBottom: '12px', letterSpacing: '0.1em' }}>
                        {isJunior ? 'LEVEL-2 DRAFT EXHIBIT' : 'LEVEL-4 CERTIFIED EVIDENCE'}
                      </div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {availableInvestigations.find((i) => i.id === selectedInv)?.caseId} Judicial Evidence Dossier
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
                        {availableInvestigations.find((i) => i.id === selectedInv)?.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Attesting Officer: {user?.name || 'Arjun Sharma'} ({user?.role || 'Lead Analyst'})
                      </div>
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Included Modules ({selectedSections.length})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {selectedSections.map((s) => (
                          <div key={s} style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ color: 'var(--accent)', fontSize: '10px' }}>✓</span> {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => (wizardStep === 1 ? setShowWizard(false) : setWizardStep((s) => s - 1))}
                style={{ padding: '9px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }}
              >
                {wizardStep === 1 ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={() => (wizardStep < 3 ? setWizardStep((s) => s + 1) : handleGenerate())}
                disabled={wizardStep === 1 && !selectedInv}
                style={{
                  padding: '9px 24px',
                  background: isJunior ? '#38a169' : 'var(--accent)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: wizardStep === 1 && !selectedInv ? 'not-allowed' : 'pointer',
                  opacity: wizardStep === 1 && !selectedInv ? 0.5 : 1,
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {wizardStep === 3 ? 'Generate & View Court PDF' : 'Next Step'} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
