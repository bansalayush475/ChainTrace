import { db } from '../db/database.js';
import { getSupabase } from '../db/supabase.js';

console.log('🏛️  CBFIS Sovereign LEA Database Seeder starting...');

const INITIAL_INVESTIGATIONS = [
  {
    id: 'INV-001',
    caseId: 'CT-2024-0891',
    title: 'Operation Garuda: Southeast Asia Cyber Slavery & Digital Arrest Syndicate',
    suspectWallet: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    blockchain: 'TRON',
    riskScore: 94,
    fundsTraced: 4850000.00,
    currency: 'INR',
    investigator: 'Arjun Sharma',
    status: 'UNDER_INVESTIGATION',
    priority: 'CRITICAL',
    description: 'Southeast Asian call center syndicate running impersonation of CBI, ED, and Mumbai Police. High-velocity TRC-20 laundering intercepted.',
    tags: ['DIGITAL_ARREST', 'MHA_I4C', 'TRC20_VELOCITY', 'SECTION_94_BNSS'],
    jurisdiction: 'Delhi Police Cyber Crime PS (Special Cell)',
  },
  {
    id: 'INV-002',
    caseId: 'CT-2024-0892',
    title: 'Telegram Merchant Rating & Algorithmic Task Scam',
    suspectWallet: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    blockchain: 'ETH',
    riskScore: 88,
    fundsTraced: 1420000.00,
    currency: 'INR',
    investigator: 'Priya Patel',
    status: 'ANALYZING',
    priority: 'HIGH',
    description: 'Victims lured with part-time product rating tasks on Telegram. Layer-1 mule bank deposits converted to USDT via OTC escrow.',
    tags: ['TASK_SCAM', 'TELEGRAM_OTC', 'EVM_PEELING', 'BYBIT_OFFRAMP'],
    jurisdiction: 'Maharashtra Cyber CID (Mumbai HQ)',
  },
  {
    id: 'INV-003',
    caseId: 'CT-2024-0893',
    title: 'Hawala Crypto Peeling & Cross-Border Drug Escrow',
    suspectWallet: 'bc1q9x37f48a92kdn38v94kd82ms93kd82jf83kd92',
    blockchain: 'BTC',
    riskScore: 96,
    fundsTraced: 3100000.00,
    currency: 'INR',
    investigator: 'Rahul Verma',
    status: 'ESCALATED',
    priority: 'CRITICAL',
    description: 'Narcotics Control Bureau (NCB) referral. Darknet vendor funds split across Wasabi mixer CoinJoin rounds and peeled into OTC brokers.',
    tags: ['DARKNET_HAWALA', 'COINJOIN_MIXER', 'BITCOIN_PEELING', 'NCB_COORDINATION'],
    jurisdiction: 'Karnataka Cyber Crime PS (Bengaluru)',
  },
  {
    id: 'INV-004',
    caseId: 'CT-2024-0894',
    title: 'Fake IPO & AI Arbitrage Ponzi Syndicate',
    suspectWallet: '0x388c818ca8b9251b393131c08a736a67ccb19297',
    blockchain: 'POLYGON',
    riskScore: 79,
    fundsTraced: 2850000.00,
    currency: 'INR',
    investigator: 'Karan Mehta',
    status: 'ANALYZING',
    priority: 'HIGH',
    description: 'Fraudulent institutional pre-IPO allocations and fake AI trading bot platform. Victims forced into depositing USDT on Polygon.',
    tags: ['FAKE_IPO', 'POLYGON_USDT', 'WHATSAPP_INVESTMENT', 'PONZI'],
    jurisdiction: 'Gujarat Cyber Crime Cell (Ahmedabad)',
  },
  {
    id: 'INV-005',
    caseId: 'CT-2024-0895',
    title: 'Digital Arrest Senior Citizen Extortion (NCRP Linked)',
    suspectWallet: '0x71C8fb8613F9320Bc04b050f67117251a5929496',
    blockchain: 'ETH',
    riskScore: 91,
    fundsTraced: 7500000.00,
    currency: 'INR',
    investigator: 'Arjun Sharma',
    status: 'UNDER_INVESTIGATION',
    priority: 'CRITICAL',
    description: 'High-value digital arrest of retired professor in South Delhi. Rapid IMPS layering through 4 mule banks and Binance P2P conversion.',
    tags: ['SENIOR_CITIZEN', 'DIGITAL_ARREST', 'GOLDEN_HOUR', 'BNSS_SEC106'],
    jurisdiction: 'Delhi Police Cyber Crime PS (Special Cell)',
  },
];

const INITIAL_NCRP = [
  {
    id: 'NCRP-982314',
    ackNo: '2024/NCRP/DL/982314',
    victimName: 'Rajeshwar Sharma',
    contactPhone: '+91 98112-40912',
    lossInr: 4850000,
    suspectWallet: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    blockchain: 'TRON',
    bankUtr: 'SBIN982314981',
    upiVpa: 'manojverma.98@oksbi',
    crimeCategory: 'Digital Arrest & Financial Cyber Extortion',
    sourceChannel: '1930_HELPLINE',
    status: 'ESCALATED_TO_CASE',
  },
  {
    id: 'NCRP-412093',
    ackNo: '2024/NCRP/MH/412093',
    victimName: 'Dr. Ananya Sen',
    contactPhone: '+91 98201-94812',
    lossInr: 1420000,
    suspectWallet: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    blockchain: 'ETH',
    bankUtr: 'HDFC412093812',
    upiVpa: 'merchant.fastpay@okhdfcbank',
    crimeCategory: 'Telegram Part-Time Task & Merchant Escrow',
    sourceChannel: '1930_HELPLINE',
    status: 'ESCALATED_TO_CASE',
  },
  {
    id: 'NCRP-310492',
    ackNo: '2024/NCRP/MH/310492',
    victimName: 'Sunita Mehra',
    contactPhone: '+91 98334-11209',
    lossInr: 3200000,
    suspectWallet: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    blockchain: 'TRON',
    bankUtr: 'ICIC310492711',
    upiVpa: 'sunita.m@okicici',
    crimeCategory: 'Digital Arrest & FedEx Parcel Extortion',
    sourceChannel: '1930_HELPLINE',
    status: 'ANALYZING',
  },
  {
    id: 'NCRP-189402',
    ackNo: '2024/NCRP/KA/189402',
    victimName: 'Arun Kulkarni',
    contactPhone: '+91 94480-23910',
    lossInr: 2500000,
    suspectWallet: 'bc1q9x37f48a92kdn38v94kd82ms93kd82jf83kd92',
    blockchain: 'BTC',
    bankUtr: 'CNRB189402634',
    crimeCategory: 'Darknet Escrow & Crypto Hawala',
    sourceChannel: '1930_HELPLINE',
    status: 'ANALYZING',
  },
  {
    id: 'NCRP-209184',
    ackNo: '2024/NCRP/GJ/209184',
    victimName: 'Hiren Patel',
    contactPhone: '+91 97240-58192',
    lossInr: 890000,
    suspectWallet: '0x388c818ca8b9251b393131c08a736a67ccb19297',
    blockchain: 'POLYGON',
    bankUtr: 'UTIB209184519',
    crimeCategory: 'Pre-IPO Institutional Allocation Fraud',
    sourceChannel: '1930_HELPLINE',
    status: 'PENDING',
  },
  {
    id: 'NCRP-114920',
    ackNo: '2024/NCRP/DL/114920',
    victimName: 'Vikram Malhotra',
    contactPhone: '+91 98101-77890',
    lossInr: 7500000,
    suspectWallet: '0x71C8fb8613F9320Bc04b050f67117251a5929496',
    blockchain: 'ETH',
    bankUtr: 'PUNB114920384',
    crimeCategory: 'Digital Arrest Senior Citizen Extortion',
    sourceChannel: '1930_HELPLINE',
    status: 'ESCALATED_TO_CASE',
  },
];

const INITIAL_WALLETS = [
  {
    address: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    blockchain: 'TRON',
    label: 'Digital Arrest Primary Extortion Vault',
    entityType: 'SUSPECT',
    riskScore: 94,
    balance: 54500,
    totalReceived: 320000,
    totalSent: 265500,
    txCount: 48,
    firstSeen: '2024-08-15T04:20:00Z',
    lastActivity: '2024-09-15T08:12:00Z',
    counterparties: 14,
    flags: ['SANCTIONED_AFFINITY', 'PEELING_SOURCE', 'HIGH_VELOCITY_DISPERSAL'],
    cluster: 'CLUSTER-CAMBODIA-CALLCENTER-04',
  },
  {
    address: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
    blockchain: 'TRON',
    label: 'Binance Hot Wallet Ingress (UID-89104231)',
    entityType: 'EXCHANGE',
    riskScore: 85,
    balance: 1240000,
    totalReceived: 18500000,
    totalSent: 17260000,
    txCount: 1420,
    firstSeen: '2023-01-10T00:00:00Z',
    lastActivity: '2024-09-15T09:40:00Z',
    counterparties: 320,
    flags: ['EXCHANGE_DEPOSIT', 'SUBPOENA_TARGET', 'FIU_IND_REPORTABLE'],
    exchange: 'Binance',
  },
  {
    address: 'TGeR9vjM7Fm5n8sA3e19kLxWzP2q4cVbNt',
    blockchain: 'TRON',
    label: 'Peeling Chain Split Address Hop-2',
    entityType: 'INTERMEDIATE',
    riskScore: 82,
    balance: 240,
    totalReceived: 54480,
    totalSent: 54240,
    txCount: 6,
    firstSeen: '2024-09-02T10:14:00Z',
    lastActivity: '2024-09-02T10:21:00Z',
    counterparties: 3,
    flags: ['RAPID_TRANSIT_HOP', 'AUTOMATED_PEELING'],
    cluster: 'CLUSTER-CAMBODIA-CALLCENTER-04',
  },
  {
    address: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    blockchain: 'ETH',
    label: 'Telegram Task Merchant Deposit Address',
    entityType: 'SUSPECT',
    riskScore: 88,
    balance: 16000,
    totalReceived: 98000,
    totalSent: 82000,
    txCount: 22,
    firstSeen: '2024-07-20T11:00:00Z',
    lastActivity: '2024-09-14T14:30:00Z',
    counterparties: 8,
    flags: ['TELEGRAM_TASK_ESCROW', 'OTC_LAUNDERING'],
    cluster: 'CLUSTER-TELEGRAM-MERC-88',
  },
  {
    address: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    blockchain: 'ETH',
    label: 'Bybit Deposit Contract (UID-492109)',
    entityType: 'EXCHANGE',
    riskScore: 90,
    balance: 3850000,
    totalReceived: 42000000,
    totalSent: 38150000,
    txCount: 890,
    firstSeen: '2023-04-12T00:00:00Z',
    lastActivity: '2024-09-15T07:15:00Z',
    counterparties: 190,
    flags: ['EXCHANGE_OFFRAMP', 'SUBPOENA_FIU_COMPLIANT'],
    exchange: 'Bybit',
  },
  {
    address: '0x71C8fb8613F9320Bc04b050f67117251a5929496',
    blockchain: 'ETH',
    label: 'South Delhi Senior Citizen Extortion Target',
    entityType: 'SUSPECT',
    riskScore: 92,
    balance: 82000,
    totalReceived: 480000,
    totalSent: 398000,
    txCount: 34,
    firstSeen: '2024-08-01T08:00:00Z',
    lastActivity: '2024-09-15T11:00:00Z',
    counterparties: 12,
    flags: ['DIGITAL_ARREST_TARGET', 'HIGH_VALUE_MULE_INTERCEPT'],
    cluster: 'CLUSTER-MYANMAR-CYBER-02',
  },
  {
    address: 'bc1q9x37f48a92kdn38v94kd82ms93kd82jf83kd92',
    blockchain: 'BTC',
    label: 'Wasabi CoinJoin Hawala Exit',
    entityType: 'MIXER',
    riskScore: 96,
    balance: 4.85,
    totalReceived: 48.2,
    totalSent: 43.35,
    txCount: 84,
    firstSeen: '2024-05-10T02:00:00Z',
    lastActivity: '2024-09-14T19:00:00Z',
    counterparties: 52,
    flags: ['DARKNET_MARKET_LINK', 'WASABI_COINJOIN', 'NCB_FLAGGED'],
    cluster: 'CLUSTER-DARKNET-HAWALA-01',
  },
];

const INITIAL_TRANSACTIONS = [
  {
    hash: '0x9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b',
    fromAddress: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    toAddress: 'TGeR9vjM7Fm5n8sA3e19kLxWzP2q4cVbNt',
    amount: 54500,
    token: 'USDT',
    usdValue: 54500,
    timestamp: '2024-09-15T08:15:00Z',
    blockNumber: 64289012,
    confirmations: 48,
    fee: 1.25,
    status: 'CONFIRMED',
    riskScore: 92,
    type: 'TRANSFER',
    blockchain: 'TRON',
    investigationId: 'INV-001',
  },
  {
    hash: '0x7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    fromAddress: 'TGeR9vjM7Fm5n8sA3e19kLxWzP2q4cVbNt',
    toAddress: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
    amount: 54400,
    token: 'USDT',
    usdValue: 54400,
    timestamp: '2024-09-15T08:22:00Z',
    blockNumber: 64289045,
    confirmations: 42,
    fee: 1.25,
    status: 'CONFIRMED',
    riskScore: 95,
    type: 'EXCHANGE_DEPOSIT',
    blockchain: 'TRON',
    investigationId: 'INV-001',
  },
  {
    hash: '0x4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    fromAddress: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    toAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    amount: 15950,
    token: 'USDT',
    usdValue: 15950,
    timestamp: '2024-09-14T14:35:00Z',
    blockNumber: 20754120,
    confirmations: 120,
    fee: 0.0042,
    status: 'CONFIRMED',
    riskScore: 89,
    type: 'EXCHANGE_DEPOSIT',
    blockchain: 'ETH',
    investigationId: 'INV-002',
  },
  {
    hash: '0x3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b',
    fromAddress: '0x71C8fb8613F9320Bc04b050f67117251a5929496',
    toAddress: '0x1111111254EEB25477B68fb85Ed929f73A960582',
    amount: 82000,
    token: 'USDT',
    usdValue: 82000,
    timestamp: '2024-09-15T11:05:00Z',
    blockNumber: 20755910,
    confirmations: 85,
    fee: 0.0051,
    status: 'CONFIRMED',
    riskScore: 94,
    type: 'EXCHANGE_DEPOSIT',
    blockchain: 'ETH',
    investigationId: 'INV-005',
  },
];

const INITIAL_TIMELINE = [
  {
    id: 'TLE-101',
    investigationId: 'INV-001',
    timestamp: '2024-09-15T08:00:00Z',
    eventType: 'ALERT',
    description: '1930 NCRP Complaint 2024/NCRP/DL/982314 received. Complainant reported digital arrest extortion of ₹48.5 Lakhs.',
    amount: 4850000,
    walletAddress: 'TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3',
    investigatorNote: 'Golden Hour protocol initiated. Off-ramp velocity calculated at 0.87 USDT/sec.',
  },
  {
    id: 'TLE-102',
    investigationId: 'INV-001',
    timestamp: '2024-09-15T08:22:00Z',
    eventType: 'PATTERN_DETECTED',
    description: 'Automated peeling analysis traced 54,400 USDT to Binance Hot Wallet Ingress (Deposit UID-89104231).',
    txHash: '0x7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    amount: 54400,
    walletAddress: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF',
    investigatorNote: 'UID-89104231 matches syndicate cluster from Myanmar Golden Triangle hub.',
  },
  {
    id: 'TLE-103',
    investigationId: 'INV-001',
    timestamp: '2024-09-15T08:45:00Z',
    eventType: 'ESCALATION',
    description: 'Statutory Section 94 BNSS Subpoena issued to Binance Compliance (Ref: MHA/I4C/SEC94/2024/9823).',
    investigatorNote: 'Cryptographic SHA-256 digital seal applied under Section 63 BSA 2023.',
  },
  {
    id: 'TLE-104',
    investigationId: 'INV-002',
    timestamp: '2024-09-14T14:00:00Z',
    eventType: 'ALERT',
    description: 'NCRP Complaint 2024/NCRP/MH/412093 ingested. Complainant defrauded of ₹14.20 Lakhs via Telegram product rating bot.',
    amount: 1420000,
    walletAddress: '0x71C83897F432a148929d5a9e49B0016Fe9244037',
    investigatorNote: 'Layer-1 mule account at HDFC Bank frozen under Section 106 BNSS.',
  },
];

const INITIAL_EVIDENCE = [
  {
    id: 'EV-001',
    investigationId: 'INV-001',
    title: 'TRC-20 Blockchain Transaction Ledger Receipt',
    type: 'TRANSACTION_RECEIPT',
    hash: '9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b',
    fileSize: '240 KB',
    source: 'TronGrid Sovereign Full Node RPC',
    description: 'Cryptographic transaction record verifying 54,500 USDT transfer from victim wallet to syndicate ingress.',
    examinerName: 'Examiner of Electronic Evidence (Sec 79A IT Act)',
    verified: true,
  },
  {
    id: 'EV-002',
    investigationId: 'INV-001',
    title: 'Deposit UID-89104231 Attribution Dossier',
    type: 'EXCHANGE_SUBPOENA',
    hash: '3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b',
    fileSize: '512 KB',
    source: 'FIU-IND Subpoena Gateway',
    description: 'Official requisition order under Section 94 BNSS dispatched to Binance Compliance.',
    examinerName: 'Inspector Arjun Sharma, Special Cell',
    verified: true,
  },
  {
    id: 'EV-003',
    investigationId: 'INV-002',
    title: 'Telegram Merchant Chat Room & Escrow Audit Dump',
    type: 'FORENSIC_REPORT',
    hash: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    fileSize: '1.2 MB',
    source: 'Celite Forensics Station',
    description: 'Extracted chat records demonstrating instruction to victim for depositing funds into mule account.',
    examinerName: 'Priya Patel, Forensic Analyst',
    verified: true,
  },
];

const INITIAL_FREEZE = [
  {
    id: 'FRZ-001',
    dispatchRef: 'MHA/I4C/SEC94/2024/9823',
    noticeType: 'VASP_SUBPOENA_SEC94_BNSS',
    targetEntity: 'Binance Compliance (FIU-IND Registered)',
    targetIdentifier: 'TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF / UID-89104231',
    caseReference: 'INV-001',
    recipientEmail: 'fiu-compliance@binance.com',
    sha256Seal: '9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b',
    status: 'DISPATCHED',
    fullNoticeText: 'STATUTORY LEGAL DIRECTIVE PURSUANT TO SECTION 94 BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS) 2023. You are hereby ordered to immediately restrict and place an emergency debit freeze on UID-89104231 holding 54,400 USDT.',
  },
  {
    id: 'FRZ-002',
    dispatchRef: 'MHA/I4C/SEC106/2024/3948',
    noticeType: 'BANK_FREEZE_SEC106_BNSS',
    targetEntity: 'State Bank of India (Connaught Place Branch)',
    targetIdentifier: 'Account No: 39482019482 (IFSC: SBIN0000691)',
    caseReference: 'INV-001',
    recipientEmail: 'nodal.cyber@sbi.co.in',
    sha256Seal: '7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    status: 'FROZEN',
    fullNoticeText: 'STATUTORY POLICE FREEZE ORDER UNDER SECTION 106 BNSS 2023 (SEIZURE OF PROPERTY). Immediate freeze of Account 39482019482 holding tainted cyber proceeds of INR 48,50,000.',
  },
  {
    id: 'FRZ-003',
    dispatchRef: 'MHA/I4C/SEC94/2024/4120',
    noticeType: 'VASP_SUBPOENA_SEC94_BNSS',
    targetEntity: 'Bybit Legal & Law Enforcement Inquiries',
    targetIdentifier: '0x1111111254EEB25477B68fb85Ed929f73A960582 / UID-492109',
    caseReference: 'INV-002',
    recipientEmail: 'legal@bybit.com',
    sha256Seal: '4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b',
    status: 'DISPATCHED',
    fullNoticeText: 'EMERGENCY REQUISITION ORDER UNDER SECTION 94 BNSS 2023. Restrict off-ramping on UID-492109 regarding INR 14.20 Lakhs defrauded in Telegram merchant task scam.',
  },
];

const INITIAL_AUDIT = [
  {
    id: 'LOG-001',
    user: 'Arjun Sharma (Lead Analyst)',
    action: 'INVESTIGATION_CREATE',
    resource: 'CT-2024-0891',
    ip: '10.14.2.89',
    session: 'SESSION-I4C-SOVEREIGN-9128',
    details: 'Created investigation CT-2024-0891 (Operation Garuda: Southeast Asia Cyber Slavery & Digital Arrest Syndicate)',
    integrityHash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
  },
  {
    id: 'LOG-002',
    user: 'Arjun Sharma (Lead Analyst)',
    action: 'FREEZE_ORDER_DISPATCH',
    resource: 'MHA/I4C/SEC94/2024/9823',
    ip: '10.14.2.89',
    session: 'SESSION-I4C-SOVEREIGN-9128',
    details: 'Dispatched Section 94 BNSS Subpoena to Binance Compliance for 54,400 USDT',
    integrityHash: 'b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef0',
  },
  {
    id: 'LOG-003',
    user: 'Priya Patel (Analyst)',
    action: 'NCRP_ESCALATION',
    resource: '2024/NCRP/MH/412093',
    ip: '10.14.2.92',
    session: 'SESSION-I4C-SOVEREIGN-4412',
    details: 'Escalated NCRP complaint 2024/NCRP/MH/412093 to active docket CT-2024-0892',
    integrityHash: 'c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef0',
  },
  {
    id: 'LOG-004',
    user: 'Cyber Cell Inspector',
    action: 'SYSTEM_VERIFY',
    resource: 'SUPABASE_CLOUD_POSTGRES',
    ip: '127.0.0.1',
    session: 'SESSION-SOVEREIGN-MHA',
    details: 'Verified all 8 forensic tables and Row Level Security policies active on Supabase Cloud',
    integrityHash: 'd4e5f6a1b2c37890123456789abcdef0123456789abcdef0123456789abcdef0',
  },
];

async function seed() {
  console.log('Inserting investigations...');
  for (const inv of INITIAL_INVESTIGATIONS) {
    await db.createInvestigation(inv);
    console.log(`  ✓ Investigation: ${inv.id} (${inv.title})`);
  }

  console.log('\nInserting NCRP helpline complaints...');
  for (const n of INITIAL_NCRP) {
    await db.addNcrpComplaint(n);
    console.log(`  ✓ NCRP: ${n.ackNo} (${n.victimName})`);
  }

  console.log('\nInserting wallet intelligence profiles...');
  for (const w of INITIAL_WALLETS) {
    await db.addWallet(w);
    console.log(`  ✓ Wallet: ${w.address} [${w.entityType}]`);
  }

  console.log('\nInserting on-chain transactions...');
  for (const tx of INITIAL_TRANSACTIONS) {
    await db.addTransaction(tx);
    console.log(`  ✓ Transaction: ${tx.hash.slice(0, 16)}...`);
  }

  console.log('\nInserting case timeline milestones...');
  for (const tle of INITIAL_TIMELINE) {
    await db.addTimelineEvent(tle);
    console.log(`  ✓ Timeline: ${tle.id} for ${tle.investigationId}`);
  }

  console.log('\nInserting digital evidence exhibits...');
  for (const ev of INITIAL_EVIDENCE) {
    await db.addEvidence(ev);
    console.log(`  ✓ Evidence: ${ev.id} (${ev.title})`);
  }

  console.log('\nInserting statutory freeze notices...');
  for (const f of INITIAL_FREEZE) {
    await db.addFreezeNotice(f);
    console.log(`  ✓ Freeze Notice: ${f.dispatchRef} to ${f.targetEntity}`);
  }

  console.log('\nInserting immutable audit logs...');
  for (const al of INITIAL_AUDIT) {
    await db.addAuditLog(al);
    console.log(`  ✓ Audit Log: ${al.id} [${al.action}]`);
  }

  const stats = await db.getStats();
  console.log('\n================================================================================');
  console.log('🏛️  SEEDING COMPLETED SUCCESSFULLY');
  console.log('================================================================================');
  console.log(JSON.stringify(stats, null, 2));
  console.log('================================================================================');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
