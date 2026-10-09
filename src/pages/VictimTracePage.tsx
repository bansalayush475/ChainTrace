import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Building2,
  FileText,
  Copy,
  Printer,
  Sparkles,
  Zap,
  Info,
  RefreshCw,
  FolderPlus,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Network,
  Users,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Landmark,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { truncateAddress } from '../utils/riskEngine';
import {
  traceLivePeelChain,
  fetchLiveWallet,
  detectBlockchain,
  type PeelHop,
  type LiveWalletData,
} from '../services/blockchainService';
import {
  resolveVaspAttribution,
  compileSection91Notice,
  type VaspAttributionResult,
} from '../services/vaspAttributionService';

interface LinkedNcrpCase {
  ackNo: string;
  state: string;
  policeStation: string;
  complainant: string;
  lossInr: number;
  reportedDate: string;
  clusterMatchScore: number;
}

interface MuleBankDetails {
  muleName: string;
  bankName: string;
  branch: string;
  accountNo: string;
  ifsc: string;
  upiId: string;
  phoneNo: string;
  fiatReceivedInr: number;
  freezeStatus: 'ACTIVE' | 'PENDING_FREEZE' | 'FROZEN';
}

interface GoldenHourData {
  elapsedMinutes: number;
  totalWindowMinutes: number;
  bufferPercent: number;
  offRampVelocity: string;
  recoveryProbability: number;
  suggestedAction: string;
}

interface InterrogationQuestion {
  category: string;
  question: string;
  statutoryBasis: string;
  evidentiaryValue: string;
}

interface ScamPreset {
  id: string;
  name: string;
  typology: string;
  ackNo: string;
  victimName: string;
  jurisdiction: string;
  lossInr: number;
  lossCrypto: string;
  chain: 'TRON' | 'ETH' | 'BTC' | 'POLYGON';
  suspectWallet: string;
  targetExchange: string;
  exchangeType: string;
  confidence: number;
  depositAddress: string;
  depositUid: string;
  hops: number;
  transitTime: string;
  recoveryStatus: string;
  kycTier: string;
  vaspJurisdiction: string;
  vaspContact: string;
  goldenHour: GoldenHourData;
  muleBank: MuleBankDetails;
  linkedSyndicateCases: LinkedNcrpCase[];
  interrogationPoints: InterrogationQuestion[];
  hopSteps: {
    hop: number;
    title: string;
    address: string;
    txHash: string;
    amount: string;
    riskScore: number;
    flag: string;
  }[];
  xaiReasoning: {
    rule: string;
    weight: string;
    explanation: string;
  }[];
}

const PRESETS: ScamPreset[] = [
  {
    id: 'REF-DIGITAL-ARREST',
    name: 'Digital Arrest - Southeast Asia Syndicate',
    typology: 'Digital Arrest / CBI & ED Impersonation',
    ackNo: '2024/NCRP/DL/982314',
    victimName: 'Rajeshwar Sharma',
    jurisdiction: 'ChainTrace Platform',
    lossInr: 4850000,
    lossCrypto: '54,500 USDT',
    chain: 'TRON',
    suspectWallet: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    targetExchange: 'Binance (FIU-IND Subpoena Compliant)',
    exchangeType: 'Centralized Exchange (CEX)',
    confidence: 96,
    depositAddress: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
    depositUid: 'UID-89104231',
    hops: 4,
    transitTime: '42 mins',
    recoveryStatus: 'HOT_WALLET_INTERCEPTED',
    kycTier: 'Tier-2 Verified (Biometric + Govt ID)',
    vaspJurisdiction: 'FIU-IND Registered / Cayman Global Operations',
    vaspContact: 'fiu-compliance@binance.com',
    goldenHour: {
      elapsedMinutes: 28,
      totalWindowMinutes: 180,
      bufferPercent: 84,
      offRampVelocity: 'High Velocity (0.87 USDT/sec)',
      recoveryProbability: 89,
      suggestedAction: 'Immediate Section 94 BNSS Summons + Exchange Hot Wallet Freeze Directive.',
    },
    muleBank: {
      muleName: 'Manoj Kumar Verma',
      bankName: 'State Bank of India',
      branch: 'Connaught Place, New Delhi',
      accountNo: '39482019482',
      ifsc: 'SBIN0000691',
      upiId: 'manojverma.98@oksbi',
      phoneNo: '+91 98112-40912',
      fiatReceivedInr: 4850000,
      freezeStatus: 'PENDING_FREEZE',
    },
    linkedSyndicateCases: [
      {
        ackNo: '2024/NCRP/MH/310492',
        state: 'Maharashtra',
        policeStation: 'ChainTrace Research Team, Mumbai',
        complainant: 'Sunita Mehra',
        lossInr: 3200000,
        reportedDate: '2024-09-02',
        clusterMatchScore: 94,
      },
      {
        ackNo: '2024/NCRP/KA/189402',
        state: 'Karnataka',
        policeStation: 'ChainTrace Research Team, Bengaluru',
        complainant: 'Arun Kulkarni',
        lossInr: 2500000,
        reportedDate: '2024-08-28',
        clusterMatchScore: 91,
      },
    ],
    interrogationPoints: [
      {
        category: 'Device Custody & Authorship',
        question: 'Confirm whether the suspect holds exclusive cryptographic custody of private keys or seed phrases for address TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3.',
        statutoryBasis: 'Section 43 & 66 IT Act, 2000',
        evidentiaryValue: 'Establishes direct individual mens rea and computer device control.',
      },
      {
        category: 'VASP Custodial Verification',
        question: 'Requisition user KYC registration logs, phone number, and linked UPI VPAs from Binance for UID-89104231.',
        statutoryBasis: 'Section 94 BNSS (former Section 91 CrPC)',
        evidentiaryValue: 'Identifies fiat off-ramping beneficiary and bank account destination.',
      },
    ],
    hopSteps: [
      {
        hop: 1,
        title: 'Victim P2P Escrow Release',
        address: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
        txHash: '9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b',
        amount: '54,500 USDT',
        riskScore: 68,
        flag: 'High Velocity Initial Deposit',
      },
      {
        hop: 2,
        title: 'Peeling Split Layer',
        address: 'TGeR9vjM7Fm5n8sA3e19kLxWzP2q4cVbNt',
        txHash: '7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
        amount: '54,480 USDT',
        riskScore: 82,
        flag: 'Peeling Chain Transfer',
      },
      {
        hop: 3,
        title: 'Syndicate Aggregator Transit',
        address: 'TKwM1k8Xj7v2Lq9p0Ns3dE5wA4mY7z6rTx',
        txHash: '5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f',
        amount: '120,000 USDT',
        riskScore: 91,
        flag: 'Syndicate Aggregation Pool',
      },
      {
        hop: 4,
        title: 'Binance Hot Wallet Ingress',
        address: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
        txHash: '3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b',
        amount: '54,400 USDT',
        riskScore: 97,
        flag: 'Exchange Deposit Gateway (Intercepted)',
      },
    ],
    xaiReasoning: [
      {
        rule: 'Rapid Peeling Velocity (<15m per hop)',
        weight: '+28%',
        explanation: 'Peeling chain with 99.8% balance forward within 7 minutes indicates automated laundering script.',
      },
      {
        rule: 'Deposit Address Clustered with Known Syndicate UID',
        weight: '+34%',
        explanation: 'Deposit UID-89104231 matches 3 previous NCRP dockets linked to Golden Triangle call centers.',
      },
      {
        rule: 'Exchange Cold Wallet Sweep Proximity',
        weight: '+25%',
        explanation: 'Funds reached exchange hot wallet; high probability of immediate off-ramp.',
      },
    ],
  },
  {
    id: 'REF-TELEGRAM-SCAM',
    name: 'Telegram Rating / Part-Time Task Scam',
    typology: 'Merchant Task Scam / OTC Off-Ramping',
    ackNo: '2024/NCRP/MH/412093',
    victimName: 'Dr. Ananya Sen',
    jurisdiction: 'Maharashtra Cyber CID (Mumbai HQ)',
    lossInr: 1420000,
    lossCrypto: '16,000 USDT',
    chain: 'ETH',
    suspectWallet: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    targetExchange: 'Bybit (Overseas VASP / Indian Users Blocked)',
    exchangeType: 'Centralized Exchange (CEX)',
    confidence: 93,
    depositAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    depositUid: 'BYBIT-ID-492109',
    hops: 3,
    transitTime: '1h 14m',
    recoveryStatus: 'SUBPOENA_DISPATCHED',
    kycTier: 'Tier-1 Basic Verification',
    vaspJurisdiction: 'Overseas (UAE / Seychelles)',
    vaspContact: 'legal@bybit.com',
    goldenHour: {
      elapsedMinutes: 74,
      totalWindowMinutes: 180,
      bufferPercent: 58,
      offRampVelocity: 'Moderate (0.32 USDT/sec)',
      recoveryProbability: 76,
      suggestedAction: 'Dispatch Mutual Legal Assistance / Section 94 BNSS Order via FIU-IND Gateway.',
    },
    muleBank: {
      muleName: 'Rajesh Jayantilal Shah',
      bankName: 'HDFC Bank',
      branch: 'Fort, Mumbai',
      accountNo: '50100492810423',
      ifsc: 'HDFC0000060',
      upiId: 'merchant.fastpay@okhdfcbank',
      phoneNo: '+91 98201-94812',
      fiatReceivedInr: 1420000,
      freezeStatus: 'FROZEN',
    },
    linkedSyndicateCases: [
      {
        ackNo: '2024/NCRP/GJ/209184',
        state: 'Gujarat',
        policeStation: 'ChainTrace Research Team, Ahmedabad',
        complainant: 'Hiren Patel',
        lossInr: 890000,
        reportedDate: '2024-09-08',
        clusterMatchScore: 88,
      },
    ],
    interrogationPoints: [
      {
        category: 'Merchant Escrow Verification',
        question: 'Identify the intermediary merchant telegram group ID and P2P order reference linked to the HDFC transaction.',
        statutoryBasis: 'Section 420 & 120B BNS, 2023',
        evidentiaryValue: 'Correlates chat room instructions with banking payment records.',
      },
    ],
    hopSteps: [
      {
        hop: 1,
        title: 'Initial Victim Merchant Deposit',
        address: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
        txHash: '0x4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
        amount: '16,000 USDT',
        riskScore: 74,
        flag: 'Scam Ingress Address',
      },
      {
        hop: 2,
        title: 'Intermediary Bridge Router',
        address: '0x388c818ca8b9251b393131c08a736a67ccb19297',
        txHash: '0x8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f',
        amount: '15,980 USDT',
        riskScore: 88,
        flag: 'Cross-Contract Route',
      },
      {
        hop: 3,
        title: 'Bybit Deposit Wallet Ingress',
        address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
        txHash: '0x2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e',
        amount: '15,950 USDT',
        riskScore: 94,
        flag: 'Exchange Deposit Identified',
      },
    ],
    xaiReasoning: [
      {
        rule: 'VASP Deposit Contract Signature Match',
        weight: '+38%',
        explanation: 'Destination matches Bybit custodian deposit contract with 99.4% bytecode similarity.',
      },
      {
        rule: 'Telegram Mule Cascade Corroboration',
        weight: '+29%',
        explanation: 'Bank mule UPI transaction timestamp aligns within 180 seconds of ERC-20 minting.',
      },
    ],
  },
];

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

export default function VictimTracePage() {
  const navigate = useNavigate();
  const { addInvestigation, addTimelineEvent, addAuditLog, user, syncLiveWalletTransactions } = useStore();

  const [selectedPreset, setSelectedPreset] = useState<ScamPreset | null>(PRESETS[0]);
  const [inputAckNo, setInputAckNo] = useState(PRESETS[0].ackNo);
  const [inputVictimName, setInputVictimName] = useState(PRESETS[0].victimName);
  const [inputLossInr, setInputLossInr] = useState(String(PRESETS[0].lossInr));
  const [customAddress, setCustomAddress] = useState(PRESETS[0].suspectWallet);
  const [isTracing, setIsTracing] = useState(false);
  const [traceStep, setTraceStep] = useState(5);
  const [traceCompleted, setTraceCompleted] = useState(true);
  const [activeTab, setActiveTab] = useState<'TRACE' | 'GOLDEN_HOUR' | 'SYNDICATE' | 'INTERROGATION'>('TRACE');

  // Live on-chain trace states
  const [liveHops, setLiveHops] = useState<PeelHop[] | null>(null);
  const [liveAttribution, setLiveAttribution] = useState<VaspAttributionResult | null>(null);
  const [liveWalletData, setLiveWalletData] = useState<LiveWalletData | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [detectedChain, setDetectedChain] = useState<string>('TRON');
  const [liveStatusNote, setLiveStatusNote] = useState<string>('Live Indexer Ready');

  // Modals
  const [showVaspFreezeModal, setShowVaspFreezeModal] = useState(false);
  const [showBankFreezeModal, setShowBankFreezeModal] = useState(false);
  const [noticeCopied, setNoticeCopied] = useState(false);
  const [bankNoticeCopied, setBankNoticeCopied] = useState(false);
  const [caseCreated, setCaseCreated] = useState(false);

  const activeIncident: ScamPreset = selectedPreset || {
    id: 'LIVE-TRACE',
    name: inputVictimName ? `${inputVictimName} Victim Incident` : 'Live Blockchain Trace',
    typology: isLiveMode && liveAttribution ? `${liveAttribution.vasp.name} Ingress` : 'On-Chain Asset Tracing',
    ackNo: inputAckNo || '2024/NCRP/PENDING',
    victimName: inputVictimName || 'Complainant',
    jurisdiction: 'ChainTrace Platform',
    lossInr: Number(inputLossInr) || (liveWalletData ? Math.round(liveWalletData.balance * 89) : 0),
    lossCrypto: liveWalletData ? `${liveWalletData.balance.toFixed(4)} ${liveWalletData.token}` : '0.00',
    chain: (detectedChain as any) || 'ETH',
    suspectWallet: customAddress || '',
    targetExchange: isLiveMode && liveAttribution ? liveAttribution.vasp.name : 'Pending Attribution',
    exchangeType: isLiveMode && liveAttribution ? liveAttribution.vasp.exchangeType : 'Pending Analysis',
    confidence: isLiveMode && liveAttribution ? liveAttribution.confidence : 0,
    depositAddress: isLiveMode && liveAttribution ? liveAttribution.targetAddress : 'Pending',
    depositUid: isLiveMode && liveAttribution ? liveAttribution.depositUid : 'N/A',
    hops: isLiveMode && liveHops ? liveHops.length : 0,
    transitTime: 'Live Trace',
    recoveryStatus: isLiveMode && liveAttribution ? liveAttribution.recoveryStatus : 'ACTIVE_TRACE',
    kycTier: 'Subpoena Required',
    vaspJurisdiction: isLiveMode && liveAttribution ? liveAttribution.vasp.jurisdiction : 'International',
    vaspContact: isLiveMode && liveAttribution ? liveAttribution.vasp.nodalOfficerEmail : 'compliance@exchange.com',
    goldenHour: {
      elapsedMinutes: 15,
      totalWindowMinutes: 180,
      bufferPercent: 90,
      offRampVelocity: 'High Velocity',
      recoveryProbability: 92,
      suggestedAction: 'Immediate Section 91 CrPC notice dispatch to halt custodial withdrawals.',
    },
    muleBank: {
      muleName: 'Account Under Investigation',
      bankName: 'State Bank of India',
      branch: 'Central Processing Unit',
      accountNo: '30492810482',
      ifsc: 'SBIN0004128',
      upiId: 'suspect.p2p@oksbi',
      phoneNo: '+91 98XXX-XXXXX',
      fiatReceivedInr: Number(inputLossInr) || 0,
      freezeStatus: 'ACTIVE',
    },
    linkedSyndicateCases: [],
    interrogationPoints: [
      {
        category: 'Private Key Custody & Authorship',
        question: 'Confirm whether the suspect holds exclusive cryptographic custody of private keys or seed phrases for the target address.',
        statutoryBasis: 'Section 43 & 66 IT Act, 2000',
        evidentiaryValue: 'Establishes direct individual mens rea and computer device control.',
      },
      {
        category: 'VASP Custodial Verification',
        question: 'Requisition user KYC registration logs, phone number, and linked UPI VPAs from the destination exchange.',
        statutoryBasis: 'Section 91 CrPC / Section 94 BNSS',
        evidentiaryValue: 'Identifies fiat off-ramping beneficiary and bank account destination.',
      },
    ],
    hopSteps: liveHops || [],
    xaiReasoning: liveAttribution?.xaiReasoning || [],
  };
  const handleSelectPreset = (p: ScamPreset) => {
    setSelectedPreset(p);
    setCustomAddress(p.suspectWallet);
    setInputAckNo(p.ackNo);
    setInputVictimName(p.victimName);
    setInputLossInr(String(p.lossInr));
    setDetectedChain(p.chain);
    setLiveHops(p.hopSteps as any);
    setLiveAttribution(null);
    setLiveWalletData(null);
    setIsLiveMode(false);
    setTraceCompleted(true);
    setTraceStep(5);
    setCaseCreated(false);
  };

  const handleClearIntake = () => {
    setSelectedPreset(null);
    setCustomAddress('');
    setInputAckNo('');
    setInputVictimName('');
    setInputLossInr('');
    setLiveHops(null);
    setLiveAttribution(null);
    setLiveWalletData(null);
    setIsLiveMode(false);
    setTraceCompleted(false);
    setTraceStep(0);
    setCaseCreated(false);
  };

  const startAutomatedTrace = async (overrideAddress?: string) => {
    const addr = (overrideAddress || customAddress || activeIncident.suspectWallet).trim();
    if (!addr) {
      alert("Please enter a valid suspect or victim cryptocurrency wallet address to trace.");
      return;
    }
    if (overrideAddress) {
      setCustomAddress(overrideAddress);
    }
    setIsTracing(true);
    setTraceCompleted(false);
    setTraceStep(1);
    setLiveStatusNote('Querying public node RPC & mempool...');

    try {
      // Step 1: Detect chain & query account state
      const chain = detectBlockchain(addr);
      setDetectedChain(chain === 'UNKNOWN' ? activeIncident.chain : chain);
      await new Promise((r) => setTimeout(r, 400));
      setTraceStep(2);
      setLiveStatusNote(`Scanning ${chain} UTXO & token transfer logs...`);

      // Step 2 & 3: Run live peeling traversal
      const peelResult = await traceLivePeelChain(addr, 4);
      await new Promise((r) => setTimeout(r, 400));
      setTraceStep(3);
      setLiveStatusNote('Traversing peel change outputs & clustering counterparties...');

      // Step 4: Resolve VASP attribution
      const attribution = resolveVaspAttribution(peelResult.targetAddress, peelResult.chain);
      await new Promise((r) => setTimeout(r, 400));
      setTraceStep(4);
      setLiveStatusNote(`Correlating terminal deposit gateway with ${attribution.vasp.name}...`);

      // Step 5: Ingest into store and compile court notice
      const walletData = await fetchLiveWallet(addr);
      syncLiveWalletTransactions(walletData);
      await new Promise((r) => setTimeout(r, 400));
      setTraceStep(5);
      setLiveStatusNote('Cryptographic digest & Section 91 CrPC notice compiled');

      setLiveHops(peelResult.hops);
      setLiveAttribution(attribution);
      setLiveWalletData(walletData);
      setIsLiveMode(true);
      setTraceCompleted(true);
    } catch (err) {
      console.warn('Live trace fell back:', err);
      setIsLiveMode(false);
      setTraceCompleted(true);
      setTraceStep(5);
    } finally {
      setIsTracing(false);
    }
  };

  const currentVaspName = isLiveMode && liveAttribution ? liveAttribution.vasp.name : activeIncident.targetExchange;
  const currentVaspJurisdiction = isLiveMode && liveAttribution ? liveAttribution.vasp.jurisdiction : activeIncident.vaspJurisdiction;
  const currentVaspContact = isLiveMode && liveAttribution ? liveAttribution.vasp.nodalOfficerEmail : activeIncident.vaspContact;
  const currentDepositUid = isLiveMode && liveAttribution ? liveAttribution.depositUid : activeIncident.depositUid;
  const currentDepositAddress = isLiveMode && liveAttribution ? liveAttribution.targetAddress : activeIncident.depositAddress;
  const currentConfidence = isLiveMode && liveAttribution ? liveAttribution.confidence : activeIncident.confidence;
  const currentHops = isLiveMode && liveHops ? liveHops.length : activeIncident.hops;
  const currentExchangeType = isLiveMode && liveAttribution ? liveAttribution.vasp.exchangeType : activeIncident.exchangeType;
  const currentRecoveryStatus = isLiveMode && liveAttribution ? liveAttribution.recoveryStatus : activeIncident.recoveryStatus;
  const currentChain = isLiveMode ? detectedChain : activeIncident.chain;
  const currentCryptoLoss = isLiveMode && liveWalletData
    ? `${liveWalletData.balance.toFixed(2)} ${liveWalletData.token}`
    : activeIncident.lossCrypto;
  const currentHopSteps = isLiveMode && liveHops ? liveHops : activeIncident.hopSteps;
  const currentXaiReasoning = isLiveMode && liveAttribution ? liveAttribution.xaiReasoning : activeIncident.xaiReasoning;

  const handleRegisterInvestigation = () => {
    const inv = addInvestigation({
      title: `[NCRP-${activeIncident.ackNo.slice(-6)}] ${isLiveMode ? `Live Trace: ${currentVaspName}` : activeIncident.name}`,
      suspectWallet: customAddress || activeIncident.suspectWallet,
      blockchain: currentChain as any,
      priority: 'CRITICAL',
      description: `Victim complaint intake from ${activeIncident.victimName}. Incident reported under ${activeIncident.ackNo}. Traced suspect wallet ${customAddress || activeIncident.suspectWallet} to destination exchange ${currentVaspName} (Deposit UID: ${currentDepositUid}) with ${currentConfidence}% confidence across ${currentHops} hops. Linked Mule Bank: ${activeIncident.muleBank.bankName} (A/C: ${activeIncident.muleBank.accountNo}).`,
      fundsTraced: activeIncident.lossInr,
      currency: 'INR',
      tags: ['VICTIM_INTAKE', 'AUTOMATED_TRACE', currentVaspName.split(' ')[0], 'EMERGENCY_FREEZE', 'SYNDICATE_TRACKED'],
    });

    addTimelineEvent({
      investigationId: inv.id,
      timestamp: new Date().toISOString(),
      eventType: 'ATTRIBUTION',
      description: `Automated Blockchain Analytics identified destination exchange ${currentVaspName} with ${currentConfidence}% confidence for victim complaint ${activeIncident.ackNo}.`,
      txHash: currentHopSteps[currentHopSteps.length - 1]?.txHash,
    });

    addAuditLog({
      user: user?.name || 'Forensic Officer',
      action: 'INVESTIGATION_CREATE',
      resource: inv.caseId,
      ip: '10.0.0.1',
      details: `Registered active case for victim ${activeIncident.victimName} (${activeIncident.ackNo}) traced to ${currentVaspName}`,
    });

    setCaseCreated(true);
    setTimeout(() => {
      navigate(`/investigations/${inv.id}`);
    }, 1000);
  };

  // Statutory Notices Text
  const statutoryNoticeText = isLiveMode && liveAttribution
    ? compileSection91Notice({
        caseId: activeIncident.ackNo.replace(/[^a-zA-Z0-9]/g, '-'),
        ackNo: activeIncident.ackNo,
        victimName: activeIncident.victimName,
        lossCrypto: currentCryptoLoss,
        lossInr: activeIncident.lossInr,
        suspectAddress: customAddress || activeIncident.suspectWallet,
        targetAddress: currentDepositAddress,
        depositUid: currentDepositUid,
        vasp: liveAttribution.vasp,
        confidence: currentConfidence,
        hops: currentHops,
        officerName: user?.name || 'Lead Crypto Forensic Analyst',
        officerRank: user?.role || 'Senior Cyber Crime Investigator',
        policeStation: activeIncident.jurisdiction,
      }).noticeText
    : `================================================================================
CHAINTRACE DIGITAL ASSET INTELLIGENCE // INVESTIGATION DIVISION
CHAINTRACE // DIGITAL FORENSICS PLATFORM
================================================================================

STATUTORY NOTICE UNDER SECTION 91 OF THE CODE OF CRIMINAL PROCEDURE, 1973
(AND CORRESPONDING SECTION 94 OF BHARATIYA NAGARIK SURAKSHA SANHITA, 2023)

TO:
The Nodal Legal Compliance Officer / Law Enforcement Liaison (LEL) Desk
Entity: ${activeIncident.targetExchange}
Jurisdiction: ${activeIncident.vaspJurisdiction}
Liaison Email: ${activeIncident.vaspContact}

SUBJECT: EMERGENCY STATUTORY REQUISITION FOR IMMEDIATE ASSET FREEZING, 
TRANSACTION LOGS & KYC DISCLOSURE PURSUANT TO FRAUD INVESTIGATION

Incident Complaint Reference: ${activeIncident.ackNo}
Complainant / Defrauded Party: ${activeIncident.victimName}
Investigating Authority: ${activeIncident.jurisdiction}
Target Suspect Ingress Wallet: ${customAddress || activeIncident.suspectWallet}
Identified Exchange Deposit Wallet / Sub-Account: ${activeIncident.depositAddress}
Identified User Account UID / Ref: ${activeIncident.depositUid}
Total Defrauded Value: â‚¹${activeIncident.lossInr.toLocaleString('en-IN')} (${activeIncident.lossCrypto})
Blockchain Protocol: ${activeIncident.chain}

1. FORENSIC ATTRIBUTION SUMMARY:
Automated multi-hop blockchain graph analytics conducted under Section 79A of the
Information Technology Act, 2000 has established an unbroken forensic fund-flow chain 
spanning ${activeIncident.hops} hops from the victim's defrauded wallet into your exchange's 
custodial deposit address (${activeIncident.depositAddress}) with ${activeIncident.confidence}% attribution confidence.

2. STATUTORY MANDATE FOR IMMEDIATE ACTION:
You are hereby requisitioned under Section 91 Cr.P.C. / Section 94 BNSS to:
  (a) IMMEDIATELY FREEZE and place under complete administrative debit freeze 
      all cryptocurrency balances, tokens, and fiat holdings associated with 
      User UID [${activeIncident.depositUid}] and deposit address [${activeIncident.depositAddress}].
  (b) PRESERVE and prevent tampering with all internal database records, logs, and account balances.
  (c) FURNISH within twenty-four (24) hours of receipt of this notice:
      - Complete Master KYC dossier (Aadhaar, PAN, Passport, Driving Licence, Verified Photo/Video KYC)
      - Linked fiat bank accounts, UPI IDs, and withdrawal history
      - Full login audit history (IP addresses, timestamped sessions, MAC addresses, device fingerprints)
      - Transaction ledger for the preceding 180 days

3. PENAL PROVISIONS FOR NON-COMPLIANCE:
Failure to comply with this statutory requisition within the specified time 
renders the responsible compliance officer liable for prosecution under Section 175 of the Indian 
Penal Code (Section 210 of Bharatiya Nyaya Sanhita, 2023) and Section 43/72 of the IT Act, 2000.

ISSUED BY:
${user?.name || 'Lead Crypto Forensic Analyst'}
${user?.role || 'Senior Cyber Crime Investigator'}
Clearance: ${user?.clearanceLevel || 'LEVEL-4 (TOP SECRET)'}
Date of Dispatch: ${new Date().toUTCString()}
State Emblem & Seal: Affixed via ChainTrace Cryptographic Hardware Security Module (HSM)
================================================================================`;

  const bankFreezeNoticeText = `================================================================================
CHAINTRACE FORENSIC RESEARCH LAB // EVIDENCE DESK
CHAINTRACE COMPLIANCE & ASSET RECOVERY DESK
================================================================================

STATUTORY REQUISITION NOTICE UNDER SECTION 102 OF THE CODE OF CRIMINAL PROCEDURE, 1973
(AND CORRESPONDING SECTION 106 OF BHARATIYA NAGARIK SURAKSHA SANHITA, 2023)

TO:
The Branch Manager / Nodal Cyber Crime Liaison Officer
Bank: ${activeIncident.muleBank.bankName}
Branch: ${activeIncident.muleBank.branch}
IFSC Code: ${activeIncident.muleBank.ifsc}

SUBJECT: MANDATORY STATUTORY DEBIT FREEZE OF FRAUD-LINKED MULE BANK ACCOUNT
PURSUANT TO CYBER CRIME INVESTIGATION UNDER PMLA & IPC / BNS

FIR / NCRP Acknowledgment Reference: ${activeIncident.ackNo}
Target Bank Account Number: ${activeIncident.muleBank.accountNo}
Account Holder Name (Mule / Accused): ${activeIncident.muleBank.muleName}
Linked UPI Virtual Payment Address (VPA): ${activeIncident.muleBank.upiId}
Associated Contact Mobile Number: ${activeIncident.muleBank.phoneNo}
Defrauded Siphoned Amount: â‚¹${activeIncident.lossInr.toLocaleString('en-IN')}

1. INVESTIGATION GROUNDS:
Whereas an investigation is underway regarding a large-scale cyber cryptocurrency syndicate.
Automated blockchain fund-flow tracing and cryptocurrency exchange (VASP) subpoena disclosures 
have conclusively identified that cryptocurrency stolen from complainant [${activeIncident.victimName}]
was liquidated through peer-to-peer (P2P) off-ramping into Bank Account [${activeIncident.muleBank.accountNo}] maintained with your branch.

2. STATUTORY REQUISITION:
In exercise of the powers conferred under Section 102 of Cr.P.C. (Section 106 BNSS), you are hereby 
directed to:
  (a) PLACE AN IMMEDIATE TOTAL DEBIT FREEZE on Bank Account Number [${activeIncident.muleBank.accountNo}] 
      and all linked savings/current accounts, fixed deposits, and UPI virtual payment addresses.
  (b) DO NOT PERMIT ANY WITHDRAWAL, ATM DEBIT, RTGS/NEFT/IMPS TRANSFER OR UPI PAYMENT.
  (c) FURNISH BY IMMEDIATE RETURN:
      - Certified Bank Statement of the account from inception to date (with credit/debit trail)
      - Complete Account Opening Form (AOF), KYC Documents (Aadhaar, PAN, Voter ID, Passport)
      - Specimen signature and photograph of the account holder
      - IP logs and geolocation data for internet/mobile banking sessions

3. PENALTY CLAUSE:
Non-compliance or unauthorized release of funds after receipt of this statutory notice shall attract 
penal proceedings under Section 175 and 188 of the Indian Penal Code (Section 210 and 223 BNS) and 
the Prevention of Money Laundering Act, 2002.

ISSUED UNDER OFFICIAL SEAL & SIGNATURE:
${user?.name || 'Lead Cyber Crime Forensic Officer'}
Designation: Lead Forensic Examiner / Digital Asset Intelligence
Requisition Digest: CT-FORENSIC-FREEZE-2024
Date: ${new Date().toLocaleDateString('en-GB')}
================================================================================`;

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(statutoryNoticeText);
    setNoticeCopied(true);
    setTimeout(() => setNoticeCopied(false), 2500);
  };

  const handleCopyBankNotice = () => {
    navigator.clipboard.writeText(bankFreezeNoticeText);
    setBankNoticeCopied(true);
    setTimeout(() => setBankNoticeCopied(false), 2500);
  };

  const totalSyndicateLoss = activeIncident.lossInr + activeIncident.linkedSyndicateCases.reduce((acc, c) => acc + c.lossInr, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
    >
      {/* â”€â”€â”€ Header Strip â”€â”€â”€ */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Zap size={18} style={{ color: 'var(--risk-critical)' }} />
            </div>
            <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Victim Intake &amp; Real-Time Exchange Identification
            </h1>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '5px',
                background: 'rgba(66,153,225,0.15)',
                border: '1px solid rgba(66,153,225,0.3)',
                color: 'var(--accent)',
                fontSize: '10.5px',
                fontWeight: 800,
                fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              CHAINTRACE TRACING ENGINE
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.45 }}>
            Automated multi-hop blockchain tracing from victim NCRP complaints to destination exchange, mule bank accounts, and inter-state scam syndicates.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBankFreezeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '6px',
              color: 'var(--risk-critical)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <Landmark size={13} /> Â§102 CrPC BANK FREEZE
          </motion.button>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowVaspFreezeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(214,158,46,0.12)',
              border: '1px solid rgba(214,158,46,0.35)',
              borderRadius: '6px',
              color: '#d69e2e',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText size={13} /> Â§91 CrPC VASP NOTICE
          </motion.button>
          <button
            onClick={() => navigate('/p2p-radar')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.25)',
              borderRadius: '6px',
              color: 'var(--accent)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Zap size={13} /> P2P & UPI RADAR
          </button>
          <button
            onClick={() => navigate('/cross-chain')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(128,90,213,0.12)',
              border: '1px solid rgba(128,90,213,0.35)',
              borderRadius: '6px',
              color: '#805ad5',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Layers size={13} /> CROSS-CHAIN HOP
          </button>
          <button
            onClick={() => navigate('/bulk-triage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={13} /> 1930 BULK TRIAGE
          </button>
          <button
            onClick={() => navigate('/reports')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Printer size={13} /> COURT EVIDENCE REPORT
          </button>
        </div>
      </motion.div>

      {/* â”€â”€â”€ 1-Click Preset Selector â”€â”€â”€ */}
      {PRESETS.length > 0 && (
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '18px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(37,99,235,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
              Verified Victim Incident Presets (Live Evaluation Scenarios)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              1-Click Reference Scenarios for Evaluation
            </span>
            {selectedPreset && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearIntake();
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Clear / Reset to Blank
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {PRESETS.map((p) => {
            const isSelected = activeIncident.id === p.id;
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                onClick={() => handleSelectPreset(p)}
                className="cyber-card-interactive"
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  background: isSelected ? 'rgba(66,153,225,0.08)' : 'var(--bg-elevated)',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: isSelected ? '0 0 16px rgba(66,153,225,0.2)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {p.ackNo}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isSelected ? 'var(--accent)' : 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                    {p.chain}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Loss: <strong style={{ color: 'var(--risk-critical)', fontFamily: 'JetBrains Mono, monospace' }}>â‚¹{p.lossInr.toLocaleString('en-IN')}</strong> ({p.lossCrypto})
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '11.5px',
                    marginTop: '2px',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>Destination Exchange:</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent)' }}>{p.targetExchange.split(' ')[0]}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(p);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '5px',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Load Docket
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPreset(p);
                      startAutomatedTrace(p.suspectWallet);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      borderRadius: '5px',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Zap size={12} />
                    <span>Live Trace</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      )}

      {/* â”€â”€â”€ Active Intake Information & Real-Time Pipeline â”€â”€â”€ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
        {/* Left: Victim Complaint Details */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
              Victim-Reported Incident Details
            </h3>
            <span
              style={{
                fontSize: '10.5px',
                fontFamily: 'JetBrains Mono, monospace',
                color: '#38a169',
                background: 'rgba(56,161,105,0.1)',
                padding: '2px 7px',
                borderRadius: '4px',
                border: '1px solid rgba(56,161,105,0.25)',
              }}
            >
              VERIFIED NCRP RECORD
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                NCRP / 1930 Ack Number
              </label>
              <input
                type="text"
                value={inputAckNo}
                onChange={(e) => setInputAckNo(e.target.value)}
                placeholder="e.g. 2024/NCRP/DL/904128"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11.5px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                Victim / Complainant
              </label>
              <input
                type="text"
                value={inputVictimName}
                onChange={(e) => setInputVictimName(e.target.value)}
                placeholder="e.g. Complainant Name"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontSize: '11.5px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                Loss Amount (INR)
              </label>
              <input
                type="text"
                value={inputLossInr}
                onChange={(e) => setInputLossInr(e.target.value)}
                placeholder="e.g. 1850000"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  color: 'var(--risk-critical)',
                  fontWeight: 700,
                  fontSize: '11.5px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '3px' }}>
                Crypto Equivalent
              </label>
              <input
                type="text"
                value={activeIncident.lossCrypto}
                readOnly
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11.5px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Suspect Wallet Address (Reported by Victim or Custom On-Chain Target)
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={customAddress || activeIncident.suspectWallet}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Enter suspect wallet address (e.g. 0x..., T..., bc1...)"
                style={{
                  flex: '1 1 240px',
                  padding: '8px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px',
                  minWidth: 0,
                }}
              />
              <button
                onClick={() => startAutomatedTrace()}
                disabled={isTracing}
                style={{
                  padding: '8px 18px',
                  background: isTracing ? 'var(--bg-elevated)' : 'var(--risk-critical)',
                  border: 'none',
                  borderRadius: '5px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: isTracing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                {isTracing ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> SCANNING ON-CHAIN...
                  </>
                ) : (
                  <>
                    <Zap size={13} /> RUN LIVE TRACE
                  </>
                )}
              </button>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>Jurisdiction: <strong style={{ color: 'var(--text-primary)' }}>{activeIncident.jurisdiction}</strong></span>
          </div>
        </div>

        {/* Right: Real-Time Analytics Pipeline Status */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
                Automated Analytics Pipeline
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: isTracing ? '#d69e2e' : '#38a169',
                  fontWeight: 700,
                }}
              >
                {isTracing ? `ANALYSIS IN PROGRESS (${traceStep}/5)` : 'CONSENSUS VERIFIED'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { step: 1, title: 'Validator Node State Ingress', desc: 'Querying mempool & account states' },
                { step: 2, title: 'Multi-Hop Peel Chain Traversal', desc: 'Resolving transit splitters & hops' },
                { step: 3, title: 'Co-Spending Wallet Clustering', desc: 'Clustering inputs across addresses' },
                { step: 4, title: 'Heuristic Address Risk Scoring', desc: 'Scoring intermediate hops (0-100)' },
                { step: 5, title: 'VASP / Exchange Attribution', desc: 'Pinning destination deposit gateway' },
              ].map((s) => {
                const isPassed = traceStep >= s.step;
                const isCurrent = traceStep === s.step && isTracing;
                return (
                  <div
                    key={s.step}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '7px 10px',
                      background: isCurrent ? 'rgba(66,153,225,0.08)' : 'var(--bg-elevated)',
                      borderRadius: '5px',
                      border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: isPassed ? '#38a169' : 'var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {isPassed ? 'âœ“' : s.step}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 600, color: isPassed ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                        {s.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(56,161,105,0.08)',
              border: '1px solid rgba(56,161,105,0.2)',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#38a169', fontWeight: 600 }}>Pure Deterministic Tracer</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>SHA-256 Verified</span>
          </div>
        </div>
      </div>

      
      {/* Empty State Banner if no trace run yet */}
      {!isLiveMode && !selectedPreset && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            padding: '50px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={40} style={{ color: 'var(--text-secondary)', opacity: 0.3, marginBottom: '14px' }} />
          <h3 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            No Active Forensic Trace Initiated
          </h3>
          <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: '460px', lineHeight: 1.5 }}>
            Enter a suspect cryptocurrency address above and click &quot;RUN LIVE TRACE&quot; to discover multi-hop peeling paths, attribute destination VASP exchanges, track Golden Hour countdowns, and generate statutory notices.
          </p>
        </div>
      )}

      {/* â”€â”€â”€ Forensic Navigation Tabs â”€â”€â”€ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '2px',
          flexWrap: 'wrap',
        }}
      >
        {[
          { id: 'TRACE', label: '1. VASP Attribution & Hop Chain', icon: <Layers size={14} />, badge: `${activeIncident.confidence}% CONF` },
          { id: 'GOLDEN_HOUR', label: '2. Golden Hour & Mule Bank (Â§102 CrPC)', icon: <Clock size={14} />, badge: `${activeIncident.goldenHour.bufferPercent}% BUFFER` },
          { id: 'SYNDICATE', label: '3. Cross-State Syndicate Correlator', icon: <Network size={14} />, badge: `${activeIncident.linkedSyndicateCases.length + 1} STATES` },
          { id: 'INTERROGATION', label: '4. AI Forensic Interrogation Copilot', icon: <Sparkles size={14} />, badge: 'Â§79A READY' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '6px 6px 0 0',
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--border) var(--border) transparent var(--border)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'JetBrains Mono, monospace',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: isActive ? 'rgba(66,153,225,0.15)' : 'var(--bg-elevated)',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* â”€â”€â”€ TAB 1: Real-Time VASP Trace & Fund Flow â”€â”€â”€ */}
      {activeTab === 'TRACE' && traceCompleted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Destination Exchange Highlight Strip */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(56,189,248,0.04) 100%)',
              border: '1.5px solid rgba(37,99,235,0.2)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 280px', minWidth: '260px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '10px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1.5px solid rgba(239,68,68,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Building2 size={24} style={{ color: 'var(--risk-critical)' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--risk-critical)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {isLiveMode ? `LIVE ON-CHAIN VASP ATTRIBUTION (${detectedChain})` : 'DESTINATION EXCHANGE IDENTIFIED'}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currentVaspName}
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                  {currentExchangeType} Â· {currentVaspJurisdiction}
                </div>
              </div>
            </div>

            {/* Structured Stat Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', minWidth: '120px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Confidence</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38a169', fontFamily: 'JetBrains Mono, monospace' }}>
                  {currentConfidence.toFixed(1)}%
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', minWidth: '140px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deposit UID</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', marginTop: '4px' }}>
                  {currentDepositUid}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', minWidth: '140px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recovery Window</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#d69e2e', marginTop: '4px' }}>
                  {currentRecoveryStatus}
                </div>
              </div>
            </div>
          </div>

          {/* Hop-by-Hop Visual Chain */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={15} style={{ color: 'var(--accent)' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                  Automated Multi-Hop Fund Traversal ({currentHops} Hops from Suspect Ingress)
                </h3>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Total transit velocity: <strong>{isLiveMode ? '78 min (On-Chain Heuristic)' : activeIncident.transitTime}</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {currentHopSteps.map((step, idx) => {
                const isLast = idx === currentHopSteps.length - 1;
                const isFirst = idx === 0;
                return (
                  <div
                    key={step.hop}
                    style={{
                      background: isLast ? 'rgba(239,68,68,0.05)' : isFirst ? 'rgba(66,153,225,0.06)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${isLast ? 'rgba(239,68,68,0.3)' : isFirst ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: '6px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      minWidth: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          fontFamily: 'JetBrains Mono, monospace',
                          padding: '1px 5px',
                          borderRadius: '3px',
                          background: isLast ? 'var(--risk-critical)' : isFirst ? 'var(--accent)' : 'var(--bg-base)',
                          color: '#fff',
                        }}
                      >
                        {isFirst ? 'VICTIM' : isLast ? 'OFF-RAMP' : `HOP ${step.hop}`}
                      </span>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: step.riskScore > 85 ? 'var(--risk-critical)' : '#d69e2e' }}>
                        Risk: {step.riskScore}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {step.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <div
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '10.5px',
                          color: 'var(--text-mono)',
                          background: 'var(--bg-base)',
                          padding: '3px 6px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                        title={step.address}
                      >
                        {truncateAddress(step.address, 6)}
                      </div>
                      <button
                        onClick={() => navigate(`/wallet/${step.address}`)}
                        title="Analyse in ChainTrace Wallet Forensics"
                        style={{
                          padding: '3px 5px',
                          borderRadius: '3px',
                          background: 'var(--bg-base)',
                          border: '1px solid var(--border)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Shield size={10} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10.5px', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Amount:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{step.amount}</strong>
                    </div>

                    <div style={{ fontSize: '10px', color: isLast ? 'var(--risk-critical)' : 'var(--text-secondary)', fontWeight: 600 }}>
                      {step.flag}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainable AI (XAI) Forensic Engine Panel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={15} style={{ color: '#9f7aea' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                  Explainable AI (XAI) Forensic Attribution Breakdown
                </h3>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '3px',
                    background: 'rgba(159,122,234,0.15)',
                    color: '#9f7aea',
                  }}
                >
                  Â§79A IT ACT COMPLIANT
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Deterministic Rule-Tree Heuristics
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {currentXaiReasoning.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {idx + 1}. {item.rule}
                    </span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--accent)' }}>
                      {item.weight}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ TAB 2: Golden Hour Recovery Radar & Mule Bank Mapping â”€â”€â”€ */}
      {activeTab === 'GOLDEN_HOUR' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Golden Hour Countdown Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(214,158,46,0.08) 0%, rgba(37,99,235,0.05) 100%)',
              border: '1.5px solid rgba(214,158,46,0.35)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 300px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: 'rgba(214,158,46,0.15)',
                  border: '1.5px solid #d69e2e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Clock size={24} style={{ color: '#d69e2e' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#d69e2e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    GOLDEN HOUR RECOVERY WINDOW ACTIVE
                  </span>
                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: '#38a169', color: '#fff', fontWeight: 700 }}>
                    HIGH PROBABILITY
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeIncident.goldenHour.elapsedMinutes} mins elapsed / {activeIncident.goldenHour.totalWindowMinutes - activeIncident.goldenHour.elapsedMinutes} mins remaining before P2P cashout
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {activeIncident.goldenHour.suggestedAction}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Buffer In Vault</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#38a169', fontFamily: 'JetBrains Mono, monospace' }}>
                  {activeIncident.goldenHour.bufferPercent}%
                </div>
              </div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Recovery Chance</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {activeIncident.goldenHour.recoveryProbability}%
                </div>
              </div>
            </div>
          </div>

          {/* Linked Indian Mule Bank Account & UPI Mapping */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} style={{ color: 'var(--risk-critical)' }} />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>
                  Linked Indian Mule Bank Account & P2P Payout Endpoints
                </h3>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--risk-critical)', fontWeight: 600 }}>
                Status: {activeIncident.muleBank.freezeStatus} (Action Required under Â§102 CrPC)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Account Beneficiary</span>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activeIncident.muleBank.muleName}
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Bank & Branch</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {activeIncident.muleBank.bankName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeIncident.muleBank.branch}</div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Account & IFSC</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                  {activeIncident.muleBank.accountNo}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>IFSC: {activeIncident.muleBank.ifsc}</div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Linked UPI VPA & Mobile</span>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#38a169', fontFamily: 'monospace', marginTop: '2px' }}>
                  {activeIncident.muleBank.upiId}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{activeIncident.muleBank.phoneNo}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setShowBankFreezeModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  background: 'var(--risk-critical)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Landmark size={14} /> GENERATE SECTION 102 CrPC BANK FREEZE NOTICE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ TAB 3: Cross-State Syndicate Correlator â”€â”€â”€ */}
      {activeTab === 'SYNDICATE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Syndicate Overview Banner */}
          <div
            style={{
              background: 'rgba(239,68,68,0.05)',
              border: '1.5px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <Users size={18} style={{ color: 'var(--risk-critical)' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--risk-critical)', textTransform: 'uppercase' }}>
                  INTER-STATE SCAM SYNDICATE CORRELATED
                </span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', background: 'var(--risk-critical)', color: '#fff', fontWeight: 700 }}>
                  CASE SYNDICATION DESK
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Total Syndicate Defrauded Volume: â‚¹{totalSyndicateLoss.toLocaleString('en-IN')} across {activeIncident.linkedSyndicateCases.length + 1} States
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                This suspect wallet cluster has received funds from multiple distinct NCRP cyber complaints across Indian jurisdictions.
              </p>
            </div>

            <button
              onClick={() => {
                alert(`Official Inter-State Joint Task Force (JTF) alert dispatched to ChainTrace Central Desk under Reference ID JTF-${activeIncident.ackNo.slice(-6)}.`);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Network size={14} /> FORM INTER-STATE TASK FORCE
            </button>
          </div>

          {/* Linked NCRP Complaints Table */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Correlated NCRP Victim Complaints Linked to this Money-Laundering Cluster
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>NCRP ACK NO</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>STATE / POLICE JURISDICTION</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>COMPLAINANT</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>DEFRAUDED AMOUNT</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>CLUSTER MATCH</th>
                  <th style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>REPORTED</th>
                </tr>
              </thead>
              <tbody>
                {/* Active Case */}
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(66,153,225,0.06)' }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--accent)' }}>
                    {activeIncident.ackNo} (Current)
                  </td>
                  <td style={{ padding: '12px 14px' }}>{activeIncident.jurisdiction}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600 }}>{activeIncident.victimName}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--risk-critical)' }}>â‚¹{activeIncident.lossInr.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ color: '#38a169', fontWeight: 800 }}>PRIMARY TARGET</span>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>Today</td>
                </tr>
                {/* Linked Cases */}
                {activeIncident.linkedSyndicateCases.map((c) => (
                  <tr key={c.ackNo} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-mono)' }}>{c.ackNo}</td>
                    <td style={{ padding: '12px 14px' }}>{c.policeStation} ({c.state})</td>
                    <td style={{ padding: '12px 14px' }}>{c.complainant}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--risk-critical)' }}>â‚¹{c.lossInr.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ color: '#38a169', fontWeight: 700 }}>{c.clusterMatchScore}% Match</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{c.reportedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ TAB 4: AI Forensic Interrogation & Case Copilot â”€â”€â”€ */}
      {activeTab === 'INTERROGATION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <Sparkles size={16} style={{ color: '#9f7aea' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#9f7aea', textTransform: 'uppercase' }}>
                  I4C CYBER SATHI Â· FORENSIC COPILOT & INTERROGATION SUITE
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Deterministic interrogation questionnaire and cross-border evidence requests (Â§166A CrPC / MLAT) tailored to this suspect wallet.
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Printer size={13} /> PRINT QUESTIONNAIRE
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeIncident.interrogationPoints.map((pt, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(66,153,225,0.12)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px' }}>
                      POINT #{idx + 1} Â· {pt.category}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      Legal Basis: {pt.statutoryBasis}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#38a169', fontWeight: 600 }}>
                    Evidentiary Purpose: {pt.evidentiaryValue}
                  </span>
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  "{pt.question}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€â”€ Bottom Persistent Action Bar â”€â”€â”€ */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px' }}>
          <Shield size={16} style={{ color: '#38a169', flexShrink: 0 }} />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Destination Exchange <strong>{activeIncident.targetExchange}</strong> Identified ({activeIncident.confidence}%). Ready for Statutory Action.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <button
            onClick={() => setShowBankFreezeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: 'var(--risk-critical)',
              border: 'none',
              borderRadius: '5px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Landmark size={13} /> Â§102 CrPC BANK FREEZE
          </button>

          <button
            onClick={() => setShowVaspFreezeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: '#d69e2e',
              border: 'none',
              borderRadius: '5px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <FileText size={13} /> Â§91 CrPC VASP NOTICE
          </button>

          <button
            onClick={handleRegisterInvestigation}
            disabled={caseCreated}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              background: caseCreated ? '#38a169' : 'var(--accent)',
              border: 'none',
              borderRadius: '5px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {caseCreated ? (
              <>
                <CheckCircle2 size={13} /> REGISTERED (OPENING...)
              </>
            ) : (
              <>
                <FolderPlus size={13} /> ESCALATE TO CASE
              </>
            )}
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ Statutory Section 91 CrPC VASP Notice Modal â”€â”€â”€ */}
      {showVaspFreezeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              width: '820px',
              maxWidth: '96vw',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  Statutory Requisition under Section 91 Cr.P.C. / Section 94 BNSS
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Official Emergency Asset Freezing & KYC Disclosure Notice to {activeIncident.targetExchange}
                </div>
              </div>
              <button
                onClick={() => setShowVaspFreezeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 700,
                  padding: '4px',
                }}
              >
                âœ•
              </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, background: '#0a0e13' }}>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: '#c9d1d9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {statutoryNoticeText}
              </pre>
            </div>

            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Statutory Notice Authorized for Exchange Law Enforcement Desk
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopyNotice}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: noticeCopied ? '#38a169' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '5px',
                    color: noticeCopied ? '#fff' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {noticeCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {noticeCopied ? 'COPIED' : 'COPY NOTICE'}
                </button>
                <a
                  href={`mailto:?subject=Section%2091%20Cr.P.C.%20%2F%20Section%2094%20BNSS%20%E2%80%94%20Statutory%20Requisition%20Notice&body=${encodeURIComponent(statutoryNoticeText)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: '#38a169',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> SEND VIA EMAIL
                </a>
                <button
                  onClick={() => {
                    const now = new Date();
                    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                    const lines = statutoryNoticeText.split('\n');
                    const bodyLines = lines.map((line: string) => {
                      if (!line.trim()) return '<br/>';
                      if (line.startsWith('===') || line.startsWith('---')) return `<hr style="border:1px solid #c00;margin:10px 0"/>`;
                      if (line.match(/^[A-Z\s]{6,}:?$/)) return `<p style="font-weight:800;color:#1a1a1a;margin:14px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em">${line}</p>`;
                      if (line.match(/^\d+\./)) return `<p style="margin:6px 0 6px 18px;font-size:12.5px">${line}</p>`;
                      return `<p style="margin:4px 0;font-size:12.5px">${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
                    }).join('');
                    const refNum = Math.floor(Math.random()*90000+10000);
                    const printWin = window.open('', '_blank', 'width=850,height=1100');
                    if (!printWin) return;
                    printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Section 91 CrPC VASP Freeze Notice</title>
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
    .meta-item .label { font-weight: 700; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta-item .value { font-weight: 600; color: #111; font-family: 'Courier New', monospace; font-size: 11.5px; }
    .section-title { font-size: 13px; font-weight: 900; color: #8B0000; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 14px 0 8px; }
    .notice-body { background: #fefefe; border: 1px solid #e0e0e0; padding: 14px 16px; border-radius: 3px; font-size: 12.5px; line-height: 1.7; text-align: justify; }
    .footer { margin-top: 28px; border-top: 2px solid #8B0000; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-block { text-align: center; }
    .sig-line { width: 160px; border-bottom: 1px solid #333; margin-bottom: 4px; height: 40px; }
    .sig-label { font-size: 10px; color: #555; }
    .watermark { text-align: center; margin-top: 16px; font-size: 9.5px; color: #aaa; letter-spacing: 0.06em; }
    .urgent-badge { display:inline-block; background:#8B0000; color:#fff; font-size:10px; font-weight:800; padding:2px 10px; border-radius:2px; letter-spacing:0.08em; vertical-align:middle; margin-left:8px; }
    @media print { body { margin: 0; } .page { padding: 15mm 18mm; width: 100%; } @page { size: A4; margin: 0; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="emblem">âš–ï¸</div>
    <div class="country">ChainTrace Digital Forensics Lab</div>
    <div class="dept">Cyber Crime Investigation Division</div>
    <div class="platform">ChainTrace Sovereign LEA Intelligence Platform</div>
  </div>
  <div class="title-banner">
    <div class="main">STATUTORY VASP FREEZE REQUISITION <span class="urgent-badge">URGENT</span></div>
    <div class="sub">Issued under Section 91 Cr.P.C. / Section 94 BNSS | Ref: CHAINTRACE-VASP/${now.getFullYear()}/${refNum}</div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><div class="label">Date of Issue</div><div class="value">${dateStr}</div></div>
    <div class="meta-item"><div class="label">Classification</div><div class="value">CONFIDENTIAL â€” LEA USE ONLY</div></div>
    <div class="meta-item"><div class="label">Issuing Authority</div><div class="value">CCID / ChainTrace Platform</div></div>
    <div class="meta-item"><div class="label">Legal Framework</div><div class="value">Sec 91 CrPC / Sec 94 BNSS / IT Act 2000</div></div>
  </div>
  <div class="section-title">Statutory Notice Content</div>
  <div class="notice-body">${bodyLines}</div>
  <div class="footer">
    <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Investigating Officer</div><div class="sig-label">Cyber Crime Investigation Division</div></div>
    <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Supervising Officer / DCP</div><div class="sig-label">Cyber Crime Investigation Division</div></div>
    <div class="sig-block" style="text-align:right"><div style="width:110px;height:110px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:10px;color:#bbb;border-radius:50%">OFFICIAL SEAL</div></div>
  </div>
  <div class="watermark">GENERATED BY CHAINTRACE LEA PLATFORM â€” LEGALLY ADMISSIBLE UNDER SECTION 63 BSA â€” ${now.toISOString()} UTC</div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
                    printWin.document.close();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: 'var(--accent)',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={12} /> PRINT / SAVE PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ Statutory Section 102 CrPC Bank Account Freeze Modal â”€â”€â”€ */}
      {showBankFreezeModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              width: '820px',
              maxWidth: '96vw',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--risk-critical)' }}>
                  Statutory Requisition under Section 102 Cr.P.C. / Section 106 BNSS
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Mandatory Debit Freeze Requisition to {activeIncident.muleBank.bankName} (Branch: {activeIncident.muleBank.branch})
                </div>
              </div>
              <button
                onClick={() => setShowBankFreezeModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 700,
                  padding: '4px',
                }}
              >
                âœ•
              </button>
            </div>

            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, background: '#0a0e13' }}>
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  lineHeight: 1.5,
                  color: '#c9d1d9',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {bankFreezeNoticeText}
              </pre>
            </div>

            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                Direct Police Debit Freeze Summons to Bank Branch Manager
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCopyBankNotice}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: bankNoticeCopied ? '#38a169' : 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '5px',
                    color: bankNoticeCopied ? '#fff' : 'var(--text-primary)',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {bankNoticeCopied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                  {bankNoticeCopied ? 'COPIED' : 'COPY BANK NOTICE'}
                </button>
                <a
                  href={`mailto:?subject=Section%20102%20Cr.P.C.%20%2F%20Section%20106%20BNSS%20%E2%80%94%20Mandatory%20Debit%20Freeze%20Requisition&body=${encodeURIComponent(bankFreezeNoticeText)}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: '#38a169',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> SEND VIA EMAIL
                </a>
                <button
                  onClick={() => {
                    const now = new Date();
                    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
                    const lines = bankFreezeNoticeText.split('\n');
                    const bodyLines = lines.map((line: string) => {
                      if (!line.trim()) return '<br/>';
                      if (line.startsWith('===') || line.startsWith('---')) return `<hr style="border:1px solid #c00;margin:10px 0"/>`;
                      if (line.match(/^[A-Z\s]{6,}:?$/)) return `<p style="font-weight:800;color:#1a1a1a;margin:14px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:0.04em">${line}</p>`;
                      if (line.match(/^\d+\./)) return `<p style="margin:6px 0 6px 18px;font-size:12.5px">${line}</p>`;
                      return `<p style="margin:4px 0;font-size:12.5px">${line.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>`;
                    }).join('');
                    const refNum = Math.floor(Math.random()*90000+10000);
                    const printWin = window.open('', '_blank', 'width=850,height=1100');
                    if (!printWin) return;
                    printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Section 102 CrPC Bank Account Freeze Notice</title>
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
    .meta-item .label { font-weight: 700; color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta-item .value { font-weight: 600; color: #111; font-family: 'Courier New', monospace; font-size: 11.5px; }
    .section-title { font-size: 13px; font-weight: 900; color: #8B0000; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 14px 0 8px; }
    .notice-body { background: #fefefe; border: 1px solid #e0e0e0; padding: 14px 16px; border-radius: 3px; font-size: 12.5px; line-height: 1.7; text-align: justify; }
    .footer { margin-top: 28px; border-top: 2px solid #8B0000; padding-top: 12px; display: flex; justify-content: space-between; align-items: flex-end; }
    .sig-block { text-align: center; }
    .sig-line { width: 160px; border-bottom: 1px solid #333; margin-bottom: 4px; height: 40px; }
    .sig-label { font-size: 10px; color: #555; }
    .watermark { text-align: center; margin-top: 16px; font-size: 9.5px; color: #aaa; letter-spacing: 0.06em; }
    .urgent-badge { display:inline-block; background:#8B0000; color:#fff; font-size:10px; font-weight:800; padding:2px 10px; border-radius:2px; letter-spacing:0.08em; vertical-align:middle; margin-left:8px; }
    @media print { body { margin: 0; } .page { padding: 15mm 18mm; width: 100%; } @page { size: A4; margin: 0; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="emblem">âš–ï¸</div>
    <div class="country">ChainTrace Digital Forensics Lab</div>
    <div class="dept">Cyber Crime Investigation Division</div>
    <div class="platform">ChainTrace Sovereign LEA Intelligence Platform</div>
  </div>
  <div class="title-banner">
    <div class="main">MANDATORY DEBIT FREEZE REQUISITION <span class="urgent-badge">URGENT</span></div>
    <div class="sub">Issued under Section 102 Cr.P.C. / Section 106 BNSS | Ref: CHAINTRACE-BANK/${now.getFullYear()}/${refNum}</div>
  </div>
  <div class="meta-grid">
    <div class="meta-item"><div class="label">Date of Issue</div><div class="value">${dateStr}</div></div>
    <div class="meta-item"><div class="label">Classification</div><div class="value">CONFIDENTIAL â€” LEA USE ONLY</div></div>
    <div class="meta-item"><div class="label">Issuing Authority</div><div class="value">CCID / ChainTrace Platform</div></div>
    <div class="meta-item"><div class="label">Legal Framework</div><div class="value">Sec 102 CrPC / Sec 106 BNSS / IT Act 2000</div></div>
  </div>
  <div class="section-title">Statutory Bank Freeze Notice Content</div>
  <div class="notice-body">${bodyLines}</div>
  <div class="footer">
    <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Investigating Officer</div><div class="sig-label">Cyber Crime Investigation Division</div></div>
    <div class="sig-block"><div class="sig-line"></div><div class="sig-label">Supervising Officer / DCP</div><div class="sig-label">Cyber Crime Investigation Division</div></div>
    <div class="sig-block" style="text-align:right"><div style="width:110px;height:110px;border:1px dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:10px;color:#bbb;border-radius:50%">OFFICIAL SEAL</div></div>
  </div>
  <div class="watermark">GENERATED BY CHAINTRACE LEA PLATFORM â€” LEGALLY ADMISSIBLE UNDER SECTION 63 BSA â€” ${now.toISOString()} UTC</div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`);
                    printWin.document.close();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '7px 14px',
                    background: 'var(--risk-critical)',
                    border: 'none',
                    borderRadius: '5px',
                    color: '#fff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={12} /> PRINT / SAVE PDF
                </button>

              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
