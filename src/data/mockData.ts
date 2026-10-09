export interface Investigation {
  id: string;
  caseId: string;
  title: string;
  suspectWallet: string;
  blockchain: "ETH" | "BTC" | "TRON" | "POLYGON" | "BNB";
  riskScore: number;
  fundsTraced: number;
  currency: string;
  investigator: string;
  status: "NEW" | "ANALYZING" | "UNDER_INVESTIGATION" | "ESCALATED" | "CLOSED";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
  description: string;
  tags: string[];
}

export interface Wallet {
  address: string;
  blockchain: string;
  label: string;
  entityType:
    | "VICTIM"
    | "SUSPECT"
    | "INTERMEDIATE"
    | "MIXER"
    | "EXCHANGE"
    | "BRIDGE"
    | "UNKNOWN";
  riskScore: number;
  balance: number;
  totalReceived: number;
  totalSent: number;
  txCount: number;
  firstSeen: string;
  lastActivity: string;
  counterparties: number;
  flags: string[];
  cluster?: string;
  exchange?: string;
}

export interface Transaction {
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: string;
  usdValue: number;
  timestamp: string;
  blockNumber: number;
  confirmations: number;
  fee: number;
  type:
    | "TRANSFER"
    | "SWAP"
    | "BRIDGE"
    | "MIXER"
    | "EXCHANGE_DEPOSIT"
    | "EXCHANGE_WITHDRAWAL";
  riskScore: number;
  flags: string[];
}

export interface Alert {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: string;
  walletAddress: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
  investigationId?: string;
}

export interface Evidence {
  id: string;
  type:
    | "TRANSACTION_RECORD"
    | "WALLET_SNAPSHOT"
    | "EXCHANGE_RECORD"
    | "CLUSTER_ANALYSIS"
    | "PATTERN_REPORT"
    | "BLOCKCHAIN_EXPORT";
  description: string;
  hash: string;
  timestamp: string;
  source: string;
  integrity: "VERIFIED" | "PENDING" | "FAILED";
  investigationId: string;
  size: string;
}

export interface WalletCluster {
  id: string;
  label: string;
  riskScore: number;
  walletCount: number;
  totalVolume: number;
  fraudReports: number;
  exchangeExposure: number;
  detectionReason: string;
  wallets: string[];
  blockchain: string;
}

export interface FraudPattern {
  id: string;
  name: string;
  riskScore: number;
  confidence: number;
  occurrences: number;
  affectedWallets: number;
  description: string;
  whatHappened: string;
  whyRisky: string;
  whereSeen: string;
  whenDetected: string;
  whoInvolved: string;
  howConfident: string;
}

export interface ExchangeAttribution {
  id: string;
  entity: string;
  type: "CEX" | "DEX" | "MIXER" | "BRIDGE" | "P2P";
  exposureAmount: number;
  confidence: number;
  evidenceCount: number;
  jurisdiction: string;
  kycLevel: "FULL" | "PARTIAL" | "NONE" | "UNKNOWN";
  supporting: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  eventType:
    | "TRANSACTION"
    | "ALERT"
    | "INVESTIGATION_UPDATE"
    | "EVIDENCE_COLLECTED"
    | "PATTERN_DETECTED"
    | "ATTRIBUTION"
    | "ESCALATION";
  description: string;
  txHash?: string;
  amount?: number;
  walletAddress?: string;
  investigatorNote?: string;
  investigationId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action:
    | "LOGIN"
    | "WALLET_LOOKUP"
    | "INVESTIGATION_CREATE"
    | "EVIDENCE_EXPORT"
    | "REPORT_GENERATE"
    | "ALERT_DISMISS"
    | "WATCHLIST_ADD"
    | "SETTINGS_CHANGE";
  resource: string;
  ip: string;
  session: string;
  details: string;
}

export interface WatchlistItem {
  id: string;
  target: string;
  targetType: "WALLET" | "TRANSACTION" | "CLUSTER" | "CASE" | "VASP";
  riskScore: number;
  lastActivity: string;
  alertsEnabled: boolean;
  addedAt: string;
  addedBy: string;
}

export interface ApiStatus {
  id: string;
  name: string;
  blockchain: string;
  status: "ONLINE" | "DEGRADED" | "OFFLINE";
  latencyMs: number;
  lastBlock: number;
  requestsPerMin: number;
  syncPercent: number;
  lastUpdated: string;
  endpoint: string;
}

// ─── DYNAMIC FORENSIC REPOSITORIES (INTERCONNECTED LEA CASE DATA) ─────────────

export const investigations: Investigation[] = [
  {
    id: "INV-2024-0982",
    caseId: "FIR-2024-DL-982314",
    title: "Digital Arrest & CBI Cyber Extortion Syndicate (Southeast Asia)",
    suspectWallet: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    blockchain: "TRON",
    riskScore: 94,
    fundsTraced: 4850000,
    currency: "INR",
    investigator: "Special Cell Cyber Operations",
    status: "UNDER_INVESTIGATION",
    priority: "CRITICAL",
    createdAt: "2024-09-12T10:15:00.000Z",
    updatedAt: new Date().toISOString(),
    description: "Citizen complaint escalated from 1930 Helpline. Senior citizen coerced into liquidating ₹48.5L into TRC-20 USDT via P2P mule escrow. Traced to Binance deposit UID-89104231 and intercepted before off-ramping.",
    tags: ["1930-escalation", "digital-arrest", "golden-hour", "mule-cascade", "binance-subpoena"]
  },
  {
    id: "INV-2024-0401",
    caseId: "FIR-2024-MH-401928",
    title: "Pig Butchering Investment Scam & Tornado Cash Laundering",
    suspectWallet: "0x71C839019284102948102948102948102a",
    blockchain: "ETH",
    riskScore: 91,
    fundsTraced: 12500000,
    currency: "INR",
    investigator: "Maharashtra Cyber CID & Financial Tracing Unit",
    status: "ESCALATED",
    priority: "CRITICAL",
    createdAt: "2024-09-08T14:22:00.000Z",
    updatedAt: new Date().toISOString(),
    description: "Fake institutional crypto trading app lure. Victim funds bridged across Ethereum and routed through Tornado Cash privacy router. De-anonymized through temporal-volume correlation and unmasked at WazirX deposit gateway.",
    tags: ["pig-butchering", "mixer-deanonymized", "section-94-bnss", "cross-chain"]
  },
  {
    id: "INV-2024-0718",
    caseId: "FIR-2024-KA-718291",
    title: "Work-From-Home Telegram Task Ponzi & High-Velocity Mule Ring",
    suspectWallet: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    blockchain: "POLYGON",
    riskScore: 86,
    fundsTraced: 3200000,
    currency: "INR",
    investigator: "Karnataka Cyber Crime PS (Bengaluru)",
    status: "ANALYZING",
    priority: "HIGH",
    createdAt: "2024-09-15T09:40:00.000Z",
    updatedAt: new Date().toISOString(),
    description: "Victims recruited via Telegram to perform YouTube video rating tasks. Deposit funds split through 14 Polygon wallets in 8 minutes. Correlated with Karnataka mule network bank accounts.",
    tags: ["telegram-scam", "polygon-peeling", "task-fraud", "upi-mules"]
  },
  {
    id: "INV-2024-0512",
    caseId: "FIR-2024-GJ-512093",
    title: "Cross-Chain Hawala Bridge Smurfing via FixedFloat & THORChain",
    suspectWallet: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    blockchain: "BTC",
    riskScore: 78,
    fundsTraced: 8500000,
    currency: "INR",
    investigator: "Gujarat Cyber Crime Cell (Ahmedabad)",
    status: "NEW",
    priority: "HIGH",
    createdAt: "2024-09-18T16:05:00.000Z",
    updatedAt: new Date().toISOString(),
    description: "Illicit gaming syndicate routing cross-chain swaps between Bitcoin and Tron to obscure Hawala settlements. Monitored for off-ramp at domestic exchanges.",
    tags: ["cross-chain-swap", "fixedfloat", "hawala-evasion"]
  }
];

export const wallets: Wallet[] = [
  {
    address: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    blockchain: "TRON",
    label: "Digital Arrest Syndicate Primary Collector",
    entityType: "SUSPECT",
    riskScore: 94,
    balance: 54500,
    totalReceived: 210000,
    totalSent: 155500,
    txCount: 48,
    firstSeen: "2024-08-10T12:00:00Z",
    lastActivity: "2024-09-19T06:30:00Z",
    counterparties: 18,
    flags: ["High Velocity Peeling", "NCRP Complaint Linked", "Mule Cashout Target"],
    cluster: "WC-4821",
    exchange: "Binance P2P"
  },
  {
    address: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF",
    blockchain: "TRON",
    label: "Binance Intercept Deposit Vault (UID-89104231)",
    entityType: "EXCHANGE",
    riskScore: 72,
    balance: 1420000,
    totalReceived: 9800000,
    totalSent: 8380000,
    txCount: 342,
    firstSeen: "2023-11-05T08:00:00Z",
    lastActivity: "2024-09-19T09:12:00Z",
    counterparties: 89,
    flags: ["Subpoena Intercept Active", "CEX Ingress Node"],
    exchange: "Binance (FIU-IND)"
  },
  {
    address: "0x71C839019284102948102948102948102a",
    blockchain: "ETH",
    label: "FixedFloat / Tornado Intermediary Relayer",
    entityType: "MIXER",
    riskScore: 91,
    balance: 18.42,
    totalReceived: 145.8,
    totalSent: 127.38,
    txCount: 84,
    firstSeen: "2024-02-14T11:20:00Z",
    lastActivity: "2024-09-18T18:45:00Z",
    counterparties: 24,
    flags: ["Tornado Relayer Interaction", "Cross-Chain Bridge Hop"],
    cluster: "WC-4823"
  },
  {
    address: "0x498b31a294810294810294810294810294814b29",
    blockchain: "ETH",
    label: "WazirX VASP Deposit Node (Amit V. KYC)",
    entityType: "EXCHANGE",
    riskScore: 65,
    balance: 4.25,
    totalReceived: 82.5,
    totalSent: 78.25,
    txCount: 56,
    firstSeen: "2024-04-01T07:10:00Z",
    lastActivity: "2024-09-18T20:10:00Z",
    counterparties: 15,
    flags: ["Section 94 Subpoena Served", "Domestic CEX Gateway"],
    exchange: "WazirX"
  },
  {
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    blockchain: "POLYGON",
    label: "Telegram Task Ponzi Dispersal Hot Wallet",
    entityType: "SUSPECT",
    riskScore: 86,
    balance: 38200,
    totalReceived: 450000,
    totalSent: 411800,
    txCount: 112,
    firstSeen: "2024-07-20T14:30:00Z",
    lastActivity: "2024-09-19T08:15:00Z",
    counterparties: 42,
    flags: ["Rapid Structuring", "Multi-Hop Cascade"],
    cluster: "WC-4822"
  },
  {
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    blockchain: "BTC",
    label: "Cross-Chain Hawala Ingress Pool",
    entityType: "BRIDGE",
    riskScore: 78,
    balance: 1.84,
    totalReceived: 12.6,
    totalSent: 10.76,
    txCount: 29,
    firstSeen: "2024-06-11T09:00:00Z",
    lastActivity: "2024-09-18T14:00:00Z",
    counterparties: 11,
    flags: ["Bridge Swapping", "Hawala Settlement"]
  }
];

export const transactions: Transaction[] = [
  {
    hash: "0x4f8a91b204c9e8d7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
    fromAddress: "0x71C839019284102948102948102948102a",
    toAddress: "0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
    amount: 18.42,
    token: "ETH",
    usdValue: 48813,
    timestamp: "2024-09-19T06:30:00Z",
    blockNumber: 20781910,
    confirmations: 1420,
    fee: 0.0048,
    type: "MIXER",
    riskScore: 98,
    flags: ["Tornado Cash Router Ingress", "High Risk (> 0.2 ETH)"]
  },
  {
    hash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    fromAddress: "0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
    toAddress: "0x498b31a294810294810294810294810294814b29",
    amount: 18.39,
    token: "ETH",
    usdValue: 48733,
    timestamp: "2024-09-19T06:37:00Z",
    blockNumber: 20781921,
    confirmations: 1280,
    fee: 0.0051,
    type: "EXCHANGE_DEPOSIT",
    riskScore: 96,
    flags: ["WazirX Exit Node", "Off-Ramp Candidate (> 0.2 ETH)"]
  },
  {
    hash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
    fromAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    toAddress: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    amount: 12.50,
    token: "ETH",
    usdValue: 33125,
    timestamp: "2024-09-19T07:15:00Z",
    blockNumber: 20782104,
    confirmations: 980,
    fee: 0.0039,
    type: "BRIDGE",
    riskScore: 94,
    flags: ["Cross-Chain Bridge", "Syndicate Outflow (> 0.2 ETH)"]
  },
  {
    hash: "0x9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
    fromAddress: "0x71C8fb8613F9320Bc04b050f67117251a5929496",
    toAddress: "0x1fbc491029481029481029481029481dadbe2",
    amount: 8.75,
    token: "ETH",
    usdValue: 23187,
    timestamp: "2024-09-19T07:45:00Z",
    blockNumber: 20782250,
    confirmations: 850,
    fee: 0.0032,
    type: "TRANSFER",
    riskScore: 92,
    flags: ["Peeling Hop 1", "Mule Structuring (> 0.2 ETH)"]
  },
  {
    hash: "0x3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b",
    fromAddress: "0x1fbc491029481029481029481029481dadbe2",
    toAddress: "0x5ef1b0192841029481029481029481f6f617",
    amount: 5.45,
    token: "ETH",
    usdValue: 14442,
    timestamp: "2024-09-19T08:10:00Z",
    blockNumber: 20782410,
    confirmations: 720,
    fee: 0.0028,
    type: "TRANSFER",
    riskScore: 90,
    flags: ["Peeling Hop 2", "Automated Script (> 0.2 ETH)"]
  },
  {
    hash: "0x6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d",
    fromAddress: "0x5ef1b0192841029481029481029481f6f617",
    toAddress: "0x3c8610294810294810294810294810ab562a",
    amount: 3.20,
    token: "ETH",
    usdValue: 8480,
    timestamp: "2024-09-19T08:35:00Z",
    blockNumber: 20782580,
    confirmations: 610,
    fee: 0.0025,
    type: "SWAP",
    riskScore: 88,
    flags: ["DEX Swap", "Layering Node (> 0.2 ETH)"]
  },
  {
    hash: "0x8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
    fromAddress: "0x3c8610294810294810294810294810ab562a",
    toAddress: "0xde4f10294810294810294810294810551655",
    amount: 1.85,
    token: "ETH",
    usdValue: 4902,
    timestamp: "2024-09-19T09:00:00Z",
    blockNumber: 20782740,
    confirmations: 520,
    fee: 0.0021,
    type: "TRANSFER",
    riskScore: 86,
    flags: ["Mule Aggregation", "Syndicate Sub-Hop (> 0.2 ETH)"]
  },
  {
    hash: "0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e",
    fromAddress: "0xde4f10294810294810294810294810551655",
    toAddress: "0xa7e210294810294810294810294810d0f19b",
    amount: 0.95,
    token: "ETH",
    usdValue: 2517,
    timestamp: "2024-09-19T09:20:00Z",
    blockNumber: 20782890,
    confirmations: 430,
    fee: 0.0019,
    type: "TRANSFER",
    riskScore: 84,
    flags: ["Dispersal Branch", "High Risk (> 0.2 ETH)"]
  },
  {
    hash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    fromAddress: "0xa7e210294810294810294810294810d0f19b",
    toAddress: "0x1111111254EEB25477B68fb85Ed929f73A960582",
    amount: 0.48,
    token: "ETH",
    usdValue: 1272,
    timestamp: "2024-09-19T09:40:00Z",
    blockNumber: 20783010,
    confirmations: 340,
    fee: 0.0016,
    type: "TRANSFER",
    riskScore: 83,
    flags: ["1inch Aggregator Inflow", "High Risk (> 0.2 ETH)"]
  },
  {
    hash: "0x8915fde1029481029481029481029481cfaefc6f371029481029481029481029",
    fromAddress: "0xa7e210294810294810294810294810d0f19b",
    toAddress: "0x71C839019284102948102948102948102a",
    amount: 0.28,
    token: "ETH",
    usdValue: 742,
    timestamp: "2024-09-19T10:05:00Z",
    blockNumber: 20783150,
    confirmations: 250,
    fee: 0.0015,
    type: "TRANSFER",
    riskScore: 82,
    flags: ["Threshold Flagged", "High Risk (> 0.2 ETH)"]
  },
  {
    hash: "0xaf6ad6810294810294810294810294816a99e9b3461029481029481029481029",
    fromAddress: "0x38b8192041284910248102498102948102948102",
    toAddress: "0x498b31a294810294810294810294810294814b29",
    amount: 0.22,
    token: "ETH",
    usdValue: 583,
    timestamp: "2024-09-19T10:30:00Z",
    blockNumber: 20783280,
    confirmations: 180,
    fee: 0.0014,
    type: "EXCHANGE_DEPOSIT",
    riskScore: 81,
    flags: ["Deposit Candidate", "High Risk (> 0.2 ETH)"]
  },
  {
    hash: "0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    fromAddress: "0x498b31a294810294810294810294810294814b29",
    toAddress: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    amount: 0.18,
    token: "ETH",
    usdValue: 477,
    timestamp: "2024-09-19T10:55:00Z",
    blockNumber: 20783420,
    confirmations: 120,
    fee: 0.0012,
    type: "TRANSFER",
    riskScore: 62,
    flags: ["Sub-Threshold Transfer", "Medium Risk (< 0.2 ETH)"]
  },
  {
    hash: "0x4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
    fromAddress: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
    toAddress: "0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
    amount: 0.085,
    token: "ETH",
    usdValue: 225,
    timestamp: "2024-09-19T11:20:00Z",
    blockNumber: 20783580,
    confirmations: 75,
    fee: 0.0009,
    type: "TRANSFER",
    riskScore: 52,
    flags: ["Relay Gas Provision", "Low Risk (< 0.2 ETH)"]
  },
  {
    hash: "0x5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e",
    fromAddress: "0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
    toAddress: "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
    amount: 0.045,
    token: "ETH",
    usdValue: 119,
    timestamp: "2024-09-19T11:45:00Z",
    blockNumber: 20783710,
    confirmations: 40,
    fee: 0.0008,
    type: "TRANSFER",
    riskScore: 42,
    flags: ["Micro Fee Split", "Low Risk (< 0.2 ETH)"]
  }
];

export const alerts: Alert[] = [
  {
    id: "ALT-1091",
    severity: "CRITICAL",
    type: "P2P_ESCROW_DISPATCH",
    walletAddress: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    message: "Golden Hour Alert: 54,500 USDT escrow release detected towards suspect wallet. Immediate §106 BNSS Freeze Notice required.",
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    dismissed: false,
    investigationId: "INV-2024-0982"
  },
  {
    id: "ALT-1092",
    severity: "CRITICAL",
    type: "MIXER_INTERACTION",
    walletAddress: "0x71C839019284102948102948102948102a",
    message: "Direct deposit to Tornado Cash mixer contract detected. Temporal-volume correlation active.",
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    dismissed: false,
    investigationId: "INV-2024-0401"
  },
  {
    id: "ALT-1093",
    severity: "HIGH",
    type: "HIGH_VELOCITY_TRANSFER",
    walletAddress: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    message: "Rapid dispersal of funds across 14 Polygon wallets in under 8 minutes.",
    timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
    dismissed: false,
    investigationId: "INV-2024-0718"
  },
  {
    id: "ALT-1094",
    severity: "HIGH",
    type: "DORMANT_WALLET_ACTIVATION",
    walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    message: "Dormant Bitcoin Hawala node transferred 1.84 BTC through cross-chain bridge gateway.",
    timestamp: new Date(Date.now() - 110 * 60000).toISOString(),
    dismissed: false,
    investigationId: "INV-2024-0512"
  }
];

export const evidence: Evidence[] = [
  {
    id: "EVD-2024-891",
    type: "EXCHANGE_RECORD",
    description: "Binance Section 94 BNSS Legal Intercept Record for UID-89104231 (KYC, Linked Bank UTR, IP 103.21.244.12)",
    hash: "0x7f81a9420b92da10482c1998ab81e912f7182940294810294810294810294810",
    timestamp: "2024-09-19T06:50:00Z",
    source: "Binance FIU-IND Compliance Gateway",
    integrity: "VERIFIED",
    investigationId: "INV-2024-0982",
    size: "4.8 MB"
  },
  {
    id: "EVD-2024-892",
    type: "TRANSACTION_RECORD",
    description: "TRON On-Chain 4-Hop Peeling Ledger Export with Cryptographic Validator Signatures",
    hash: "0x3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b",
    timestamp: "2024-09-19T06:45:00Z",
    source: "TronGrid Enterprise Forensic RPC Node",
    integrity: "VERIFIED",
    investigationId: "INV-2024-0982",
    size: "1.2 MB"
  },
  {
    id: "EVD-2024-893",
    type: "CLUSTER_ANALYSIS",
    description: "Heuristic Co-Spending Graph Analysis isolating 14 Mule Wallets across Delhi & Bengaluru",
    hash: "0x9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
    timestamp: "2024-09-19T07:10:00Z",
    source: "ChainTrace Heuristic Clustering Engine",
    integrity: "VERIFIED",
    investigationId: "INV-2024-0982",
    size: "6.4 MB"
  },
  {
    id: "EVD-2024-894",
    type: "PATTERN_REPORT",
    description: "Tornado Cash Temporal-Volume De-Anonymization Proof & Gas Payer Clustering Certificate",
    hash: "0x4f8a91b204c9e8d7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
    timestamp: "2024-09-18T19:00:00Z",
    source: "ChainTrace XAI De-Anonymization Core",
    integrity: "VERIFIED",
    investigationId: "INV-2024-0401",
    size: "3.1 MB"
  },
  {
    id: "EVD-2024-895",
    type: "BLOCKCHAIN_EXPORT",
    description: "Polygon Layer-2 State Witness Export certifying ₹32L illicit structuring transfers",
    hash: "0x5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b",
    timestamp: "2024-09-19T08:30:00Z",
    source: "Polygon POS Validator Archive",
    integrity: "VERIFIED",
    investigationId: "INV-2024-0718",
    size: "8.9 MB"
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: "AUD-901",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    user: "Officer (MHA-DEL-091)",
    action: "REPORT_GENERATE",
    resource: "FIR-2024-DL-982314",
    ip: "10.0.4.12",
    session: "SES-849201",
    details: "Generated §79A IT Act Electronic Evidence Certificate with SHA-256 seal."
  },
  {
    id: "AUD-902",
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    user: "Officer (MHA-DEL-091)",
    action: "INVESTIGATION_CREATE",
    resource: "INV-2024-0982",
    ip: "10.0.4.12",
    session: "SES-849201",
    details: "Escalated NCRP complaint 2024/NCRP/DL/982314 into formal case docket."
  },
  {
    id: "AUD-903",
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    user: "Officer (MHA-DEL-091)",
    action: "WALLET_LOOKUP",
    resource: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    ip: "10.0.4.12",
    session: "SES-849201",
    details: "Initiated multi-hop peeling trace on TRON Mainnet via TronGrid indexer."
  },
  {
    id: "AUD-904",
    timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
    user: "Junior Analyst (MH-MUM-402)",
    action: "EVIDENCE_EXPORT",
    resource: "EVD-2024-894",
    ip: "10.0.8.44",
    session: "SES-719302",
    details: "Exported cryptographic XAI proof for Tornado Cash mixer de-anonymization."
  },
  {
    id: "AUD-905",
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    user: "Officer (MHA-DEL-091)",
    action: "WATCHLIST_ADD",
    resource: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF",
    ip: "10.0.4.12",
    session: "SES-849201",
    details: "Placed Binance deposit gateway UID-89104231 under automated telemetry watch."
  },
  {
    id: "AUD-906",
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
    user: "Officer (MHA-DEL-091)",
    action: "LOGIN",
    resource: "AUTH_GATEWAY",
    ip: "10.0.4.12",
    session: "SES-849201",
    details: "Successful biometric / MFA authentication with LEVEL-4 clearance."
  }
];

export const timelineEvents: TimelineEvent[] = [
  {
    id: "TLE-101",
    timestamp: "2024-09-19T06:15:00Z",
    eventType: "ALERT",
    description: "NCRP 1930 Helpline Citizen Escalation: ₹48.5L digital arrest reported by Rajeshwar Sharma.",
    investigationId: "INV-2024-0982",
    amount: 4850000,
    investigatorNote: "Immediate Golden Hour window opened (180 mins total)."
  },
  {
    id: "TLE-102",
    timestamp: "2024-09-19T06:30:00Z",
    eventType: "TRANSACTION",
    description: "Initial suspect wallet TYDzs...z3 received 54,500 USDT from P2P Escrow release.",
    txHash: "0x9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b",
    amount: 54500,
    walletAddress: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    investigationId: "INV-2024-0982"
  },
  {
    id: "TLE-103",
    timestamp: "2024-09-19T06:37:00Z",
    eventType: "PATTERN_DETECTED",
    description: "Peeling chain automated transfer detected: 54,480 USDT transferred to intermediary layer.",
    txHash: "0x7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d",
    investigationId: "INV-2024-0982",
    investigatorNote: "Algorithmic script laundering pattern verified."
  },
  {
    id: "TLE-104",
    timestamp: "2024-09-19T06:44:00Z",
    eventType: "ATTRIBUTION",
    description: "Funds entered Binance Hot Wallet Ingress (UID-89104231) at address TQn9...WF.",
    txHash: "0x3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9e2b1f8d4c7a6e5b",
    amount: 54400,
    walletAddress: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF",
    investigationId: "INV-2024-0982",
    investigatorNote: "VASP Interception target identified with 96% confidence."
  },
  {
    id: "TLE-105",
    timestamp: "2024-09-19T06:50:00Z",
    eventType: "EVIDENCE_COLLECTED",
    description: "Cryptographic Section 94 BNSS summons and Section 106 BNSS bank freeze notice drafted.",
    investigationId: "INV-2024-0982",
    investigatorNote: "Mule Bank: State Bank of India CP Branch (A/C: 39482019482) placed on notice."
  },
  {
    id: "TLE-106",
    timestamp: "2024-09-18T18:45:00Z",
    eventType: "ALERT",
    description: "Pig Butchering Fund Laundering: 18.42 ETH deposited into Tornado Cash Router.",
    txHash: "0x4f8a91b204c9e8d7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3",
    investigationId: "INV-2024-0401"
  },
  {
    id: "TLE-107",
    timestamp: "2024-09-18T18:47:14Z",
    eventType: "ATTRIBUTION",
    description: "Tornado Cash de-anonymized output unmasked at WazirX deposit gateway (Amit V. KYC).",
    txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    investigationId: "INV-2024-0401",
    investigatorNote: "Time-volume correlation confidence 93.2%."
  }
];

export const watchlistItems: WatchlistItem[] = [
  {
    id: "WTL-001",
    target: "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
    targetType: "WALLET",
    riskScore: 94,
    lastActivity: "2024-09-19T06:30:00Z",
    alertsEnabled: true,
    addedAt: "2024-09-12T10:15:00Z",
    addedBy: "Special Cell Cyber Operations"
  },
  {
    id: "WTL-002",
    target: "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF",
    targetType: "VASP",
    riskScore: 72,
    lastActivity: "2024-09-19T09:12:00Z",
    alertsEnabled: true,
    addedAt: "2024-09-14T08:00:00Z",
    addedBy: "Special Cell Cyber Operations"
  },
  {
    id: "WTL-003",
    target: "0x71C839019284102948102948102948102a",
    targetType: "WALLET",
    riskScore: 91,
    lastActivity: "2024-09-18T18:45:00Z",
    alertsEnabled: true,
    addedAt: "2024-09-10T12:00:00Z",
    addedBy: "Maharashtra Cyber CID"
  },
  {
    id: "WTL-004",
    target: "WC-4821",
    targetType: "CLUSTER",
    riskScore: 92,
    lastActivity: "2024-09-19T06:44:00Z",
    alertsEnabled: true,
    addedAt: "2024-09-15T09:00:00Z",
    addedBy: "Special Cell Cyber Operations"
  }
];
export const walletClusters: WalletCluster[] = [
  {
    id: "WC-4821",
    label: "Southeast Asia Syndicate - Digital Arrest Cluster",
    riskScore: 94,
    walletCount: 14,
    totalVolume: 4850000,
    fraudReports: 8,
    exchangeExposure: 88,
    detectionReason: "Multi-input co-spending and rapid peeling cascade correlating with 8 NCRP 1930 dockets.",
    wallets: [
      "TYDzsYUE3bmaipmxsioCGvPGMW5eN7Q6z3",
      "TGeR9vjM7Fm5n8sA3e19kLxWzP2q4cVbNt",
      "TKwM1k8Xj7v2Lq9p0Ns3dE5wA4mY7z6rTx",
      "TQn9Y2khEsLJW1ChVWFMSMeSTow5KaxUWF"
    ],
    blockchain: "TRON"
  },
  {
    id: "WC-4822",
    label: "Telegram Task Ponzi & UPI Mule Dispersal Ring",
    riskScore: 86,
    walletCount: 22,
    totalVolume: 3200000,
    fraudReports: 12,
    exchangeExposure: 76,
    detectionReason: "High-frequency structuring below $500 threshold across 22 Polygon child addresses.",
    wallets: [
      "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
      "0x38b8192041284910248102498102948102948102",
      "0x892a019248102948102948102948102948102948"
    ],
    blockchain: "POLYGON"
  },
  {
    id: "WC-4823",
    label: "Ethereum Privacy Mixer & Bridge Relayer Syndicate",
    riskScore: 91,
    walletCount: 8,
    totalVolume: 12500000,
    fraudReports: 5,
    exchangeExposure: 94,
    detectionReason: "Temporal and volume delta matching across FixedFloat bridge and Tornado Cash pool.",
    wallets: [
      "0x71C839019284102948102948102948102a",
      "0x498b31a294810294810294810294810294814b29"
    ],
    blockchain: "ETH"
  }
];

export const exchangeAttributions: ExchangeAttribution[] = [
  {
    id: "EXA-9281",
    entity: "Binance (FIU-IND Registered)",
    type: "CEX",
    exposureAmount: 4850000,
    confidence: 96.4,
    evidenceCount: 14,
    jurisdiction: "FIU-IND Registered / Global Operations",
    kycLevel: "FULL",
    supporting: [
      "Deposit Address Re-use UID-89104231",
      "Nodal Officer API Confirmation",
      "Hot Wallet Aggregation Cluster"
    ]
  },
  {
    id: "EXA-9282",
    entity: "WazirX (Zanmai Labs Pvt Ltd)",
    type: "CEX",
    exposureAmount: 4789000,
    confidence: 95.8,
    evidenceCount: 6,
    jurisdiction: "India (Domestic FIU-IND Compliant)",
    kycLevel: "FULL",
    supporting: [
      "Subpoena Served (Amit V. KYC Matched)",
      "INR Fiat Off-Ramp Gateway Linked"
    ]
  },
  {
    id: "EXA-9283",
    entity: "FixedFloat / THORChain Bridge",
    type: "BRIDGE",
    exposureAmount: 8500000,
    confidence: 89.2,
    evidenceCount: 4,
    jurisdiction: "Decentralized / Non-Custodial",
    kycLevel: "NONE",
    supporting: [
      "Time-Series Gas Correlation Math",
      "Liquidity Pool Cross-Hop Analysis"
    ]
  }
];

export const fraudPatterns: FraudPattern[] = [
  {
    id: "FP-101",
    name: "Peel Chain Dispersal",
    riskScore: 94,
    confidence: 96,
    occurrences: 18,
    affectedWallets: 42,
    description: "Rapid dispersal of high-volume incoming transfers into smaller structured fractions to evade AML thresholds.",
    whatHappened: "Victim funds (54,500 USDT) were immediately split through 4 automated hops within 14 minutes.",
    whyRisky: "Primary money laundering typology used by cyber syndicates to avoid exchange deposit freezes.",
    whereSeen: "TRON Network (TRC-20 USDT)",
    whenDetected: new Date().toISOString(),
    whoInvolved: "Suspect Cluster WC-4821",
    howConfident: "Deterministic co-spend correlation with time-delta < 5 mins."
  },
  {
    id: "FP-102",
    name: "Layered Privacy Mixer Hopping",
    riskScore: 98,
    confidence: 93,
    occurrences: 8,
    affectedWallets: 16,
    description: "Conversion of illicit funds through decentralized zero-knowledge privacy pools (Tornado Cash) followed by immediate CEX deposit.",
    whatHappened: "18.42 ETH deposited into mixer smart contract and unmasked at domestic VASP within 134 seconds.",
    whyRisky: "Designed to permanently sever the cryptographic audit trail for court evidence.",
    whereSeen: "Ethereum Mainnet",
    whenDetected: new Date().toISOString(),
    whoInvolved: "Suspect Cluster WC-4823",
    howConfident: "Temporal-volume matching with 93.2% mathematical confidence."
  },
  {
    id: "FP-103",
    name: "High-Velocity Mule Structuring",
    riskScore: 86,
    confidence: 89,
    occurrences: 24,
    affectedWallets: 38,
    description: "Splitting fraudulent proceeds across multiple domestic mule bank accounts via UPI VPAs and Polygon smart contracts.",
    whatHappened: "₹32L structured into 14 distinct transactions matching Telegram task fraud victim complaints.",
    whyRisky: "Bypasses automated banking fraud detection filters by remaining below single-transaction limits.",
    whereSeen: "Polygon Network & NPCI UPI Rails",
    whenDetected: new Date().toISOString(),
    whoInvolved: "Telegram Task Syndicate WC-4822",
    howConfident: "Bank UTR to blockchain timestamp alignment within 180s."
  }
];

export const apiStatuses: ApiStatus[] = [
  {
    id: "node-tron",
    name: "TronGrid Enterprise Gateway",
    blockchain: "TRON",
    status: "ONLINE",
    latencyMs: 38,
    lastBlock: 58921440,
    requestsPerMin: 1420,
    syncPercent: 100,
    lastUpdated: new Date().toISOString(),
    endpoint: "https://api.trongrid.io/walletsolidity"
  },
  {
    id: "node-eth",
    name: "Blockscout / Infura EVM Node Cluster",
    blockchain: "ETH",
    status: "ONLINE",
    latencyMs: 52,
    lastBlock: 19483120,
    requestsPerMin: 2180,
    syncPercent: 100,
    lastUpdated: new Date().toISOString(),
    endpoint: "https://eth.blockscout.com/api/v2"
  },
  {
    id: "node-polygon",
    name: "Polygon POS Validator Node",
    blockchain: "POLYGON",
    status: "ONLINE",
    latencyMs: 44,
    lastBlock: 61928910,
    requestsPerMin: 980,
    syncPercent: 100,
    lastUpdated: new Date().toISOString(),
    endpoint: "https://polygon-rpc.com"
  },
  {
    id: "node-btc",
    name: "Bitcoin Core Validator (Blockstream)",
    blockchain: "BTC",
    status: "ONLINE",
    latencyMs: 76,
    lastBlock: 859420,
    requestsPerMin: 410,
    syncPercent: 100,
    lastUpdated: new Date().toISOString(),
    endpoint: "https://blockstream.info/api"
  }
];

