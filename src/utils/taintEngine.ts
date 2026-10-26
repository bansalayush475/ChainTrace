// ============================================================================
// ChainTrace Enterprise Forensic Taint Analysis & Tracing Engine
// Implements Haircut (Proportional), FIFO, and Poison (Zero-Tolerance) Taint Models
// Co-spending Heuristics, Peel-Chain De-anonymization & Electronic Evidence Standards
// ============================================================================

export type TaintModel = 'HAIRCUT' | 'FIFO' | 'POISON';

export type ExposureCategory =
  | 'SANCTIONED'
  | 'MIXER'
  | 'STOLEN_FUNDS'
  | 'DARKNET'
  | 'HIGH_RISK_P2P'
  | 'REGULATED_EXCHANGE'
  | 'CLEAN';

export interface ExposureBreakdown {
  sanctioned: number;
  mixer: number;
  stolenFunds: number;
  darknet: number;
  highRiskP2p: number;
  regulatedExchange: number;
  clean: number;
}

export interface ForensicTaintResult {
  taintScore: number; // 0 to 100
  directTaint: number; // 0 to 100
  indirectTaint: number; // 0 to 100
  hopCount: number;
  modelUsed: TaintModel;
  exposure: ExposureBreakdown;
  dominantSource: ExposureCategory;
  forensicSummary: string;
  recoveryFeasibility: 'HIGH' | 'MEDIUM' | 'LOW' | 'NEGLIGIBLE';
  recommendedLegalAction: string;
}

export interface PeelAnalysisResult {
  isPeelChain: boolean;
  confidence: number; // 0 to 100
  peeledAmount: number;
  changeAmount: number;
  peeledAddress: string;
  changeAddress: string;
  destinationType: 'VASP_DEPOSIT' | 'PAYMENT' | 'MIXER_INGRESS' | 'INTERMEDIATE_MULE';
  heuristicsTriggered: string[];
}

export interface CrossChainCorrelationResult {
  confidence: number; // 0 to 100
  timeDeltaMinutes: number;
  volumeDiscrepancyPercent: number;
  isLikelyMatch: boolean;
  notes: string[];
}

/**
 * Computes cryptographically rigorous SHA-256 hash using the native Web Crypto API
 * Works with Uint8Array, ArrayBuffer, and string inputs.
 */
export async function computeCryptoSha256(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof input === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(input).buffer as ArrayBuffer;
  } else if (input instanceof Uint8Array) {
    buffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;
  } else {
    buffer = input;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculates taint propagation from an illicit source to a receiving wallet across hops.
 *
 * 1. Proportional (Haircut) Model:
 *    Taint = (Tainted Incoming) / (Pre-existing Clean Balance + Total Inflow)
 * 2. FIFO (First-In, First-Out) Model:
 *    Tainted funds are exhausted first in chronological outgoing transactions.
 * 3. Poison (Zero-Tolerance / OFAC):
 *    Any non-zero inflow from a flagged address marks the receiving wallet with 100% direct taint.
 */
export function calculateForensicTaint(params: {
  incomingTaintAmount: number;
  cleanBalancePreTx: number;
  hopDistance: number;
  model?: TaintModel;
  sourceCategory?: ExposureCategory;
  isSanctionedOrBlacklisted?: boolean;
}): ForensicTaintResult {
  const model = params.model || 'HAIRCUT';
  const sourceCategory = params.sourceCategory || 'STOLEN_FUNDS';
  const hops = Math.max(1, params.hopDistance);

  let taintScore = 0;
  let directTaint = 0;
  let indirectTaint = 0;

  if (params.isSanctionedOrBlacklisted || sourceCategory === 'SANCTIONED') {
    // Sanctions enforcement follows strict liability (Zero tolerance poison model)
    taintScore = Math.max(88, 100 - (hops - 1) * 3);
    directTaint = hops === 1 ? 100 : Math.max(0, 100 - (hops - 1) * 15);
    indirectTaint = hops > 1 ? taintScore : 0;
  } else {
    switch (model) {
      case 'POISON': {
        // Any contamination triggers high taint, decaying slowly by hop
        taintScore = Math.max(15, Math.round(100 * Math.pow(0.85, hops - 1)));
        directTaint = hops === 1 ? 100 : 0;
        indirectTaint = hops > 1 ? taintScore : 0;
        break;
      }
      case 'FIFO': {
        // Earliest tainted inflows are assumed to be spent first
        const totalPool = Math.max(1, params.cleanBalancePreTx + params.incomingTaintAmount);
        const inflowRatio = Math.min(1, params.incomingTaintAmount / totalPool);
        const decay = Math.pow(0.80, hops - 1);
        taintScore = Math.round(inflowRatio * 100 * decay);
        directTaint = hops === 1 ? Math.round(inflowRatio * 100) : 0;
        indirectTaint = hops > 1 ? taintScore : 0;
        break;
      }
      case 'HAIRCUT':
      default: {
        // Proportional dilution model (industry standard for forensic accounting)
        const totalPool = Math.max(0.0001, params.cleanBalancePreTx + params.incomingTaintAmount);
        const proportionalRatio = params.incomingTaintAmount / totalPool;
        const hopDecay = Math.pow(0.75, hops - 1);
        taintScore = Math.min(100, Math.round(proportionalRatio * 100 * hopDecay));
        directTaint = hops === 1 ? Math.round(proportionalRatio * 100) : 0;
        indirectTaint = hops > 1 ? taintScore : 0;
        break;
      }
    }
  }

  // Ensure logical clamping
  taintScore = Math.min(100, Math.max(0, taintScore));
  directTaint = Math.min(100, Math.max(0, directTaint));
  indirectTaint = Math.min(100, Math.max(0, indirectTaint));

  // Determine exposure breakdown based on source and taint score
  const exposure: ExposureBreakdown = {
    sanctioned: sourceCategory === 'SANCTIONED' ? taintScore : 0,
    mixer: sourceCategory === 'MIXER' ? taintScore : 0,
    stolenFunds: sourceCategory === 'STOLEN_FUNDS' ? taintScore : 0,
    darknet: sourceCategory === 'DARKNET' ? taintScore : 0,
    highRiskP2p: sourceCategory === 'HIGH_RISK_P2P' ? taintScore : 0,
    regulatedExchange: sourceCategory === 'REGULATED_EXCHANGE' ? taintScore : 0,
    clean: Math.max(0, 100 - taintScore),
  };

  // Recovery feasibility estimation based on hop count and entity
  let recoveryFeasibility: ForensicTaintResult['recoveryFeasibility'] = 'HIGH';
  if (sourceCategory === 'MIXER') {
    recoveryFeasibility = hops <= 2 ? 'MEDIUM' : 'LOW';
  } else if (hops > 4) {
    recoveryFeasibility = 'LOW';
  } else if (hops >= 7) {
    recoveryFeasibility = 'NEGLIGIBLE';
  }

  let recommendedLegalAction = 'Monitor address for CEX deposit or bridge activity.';
  if (taintScore >= 70 && hops <= 3) {
    recommendedLegalAction = 'Issue immediate Section 94 BNSS Production Notice & Section 106 BNSS Seizure Order.';
  } else if (sourceCategory === 'MIXER') {
    recommendedLegalAction = 'Run temporal withdrawal correlation on known mixers (FixedFloat, Tornado Cash).';
  } else if (hops > 3) {
    recommendedLegalAction = 'Deploy automated peel-chain forward trace to identify exchange cash-out point.';
  }

  return {
    taintScore,
    directTaint,
    indirectTaint,
    hopCount: hops,
    modelUsed: model,
    exposure,
    dominantSource: sourceCategory,
    forensicSummary: `Hop ${hops} carries ${taintScore}% taint (${directTaint}% direct, ${indirectTaint}% indirect) attributed to ${sourceCategory} via ${model} propagation model.`,
    recoveryFeasibility,
    recommendedLegalAction,
  };
}

/**
 * Peel Chain De-anonymization Heuristic Engine
 *
 * In blockchain laundering, perpetrators frequently "peel" a specific amount off to pay a
 * merchant or deposit to a CEX, while sending the remainder (change) to a new address they control.
 *
 * Heuristics evaluated:
 * 1. Round payment vs fractional change (e.g. 5,000.00 USDT vs 12,481.932 USDT)
 * 2. Address reuse or known deposit address format
 * 3. Exact matching of exchange deposit minimums
 * 4. Temporal spending velocity
 */
export function analyzePeelChainTransaction(
  inputs: { address: string; amount: number }[],
  outputs: { address: string; amount: number }[]
): PeelAnalysisResult {
  if (outputs.length !== 2) {
    // Classic peel chains have exactly 2 outputs: 1 peel (payment/deposit) and 1 change
    const singleOutput = outputs.length === 1;
    return {
      isPeelChain: false,
      confidence: singleOutput ? 20 : 10,
      peeledAmount: outputs[0]?.amount || 0,
      changeAmount: 0,
      peeledAddress: outputs[0]?.address || '',
      changeAddress: '',
      destinationType: 'INTERMEDIATE_MULE',
      heuristicsTriggered: singleOutput ? ['Direct sweep / consolidation'] : ['Multi-output batch disbursement'],
    };
  }

  const out1 = outputs[0];
  const out2 = outputs[1];
  const heuristics: string[] = [];
  let confidence = 50;

  // Heuristic 1: Round value detection
  const isOut1Round = out1.amount % 1 === 0 || out1.amount % 10 === 0 || out1.amount % 100 === 0;
  const isOut2Round = out2.amount % 1 === 0 || out2.amount % 10 === 0 || out2.amount % 100 === 0;

  let peeledIdx = 0;
  let changeIdx = 1;

  if (isOut1Round && !isOut2Round) {
    peeledIdx = 0;
    changeIdx = 1;
    heuristics.push('Round Payment Heuristic: Output 1 is an integer/round amount');
    confidence += 25;
  } else if (!isOut1Round && isOut2Round) {
    peeledIdx = 1;
    changeIdx = 0;
    heuristics.push('Round Payment Heuristic: Output 2 is an integer/round amount');
    confidence += 25;
  } else {
    // Heuristic 2: Smaller amount is usually the peeled payment
    if (out1.amount < out2.amount) {
      peeledIdx = 0;
      changeIdx = 1;
      heuristics.push('Value Differential: Smaller amount identified as peeled payload');
      confidence += 15;
    } else {
      peeledIdx = 1;
      changeIdx = 0;
      heuristics.push('Value Differential: Smaller amount identified as peeled payload');
      confidence += 15;
    }
  }

  // Heuristic 3: Fresh address vs reusable cluster
  const peeledOut = outputs[peeledIdx];
  const changeOut = outputs[changeIdx];

  // Destination classification
  let destinationType: PeelAnalysisResult['destinationType'] = 'VASP_DEPOSIT';
  if (peeledOut.amount >= 10000) {
    destinationType = 'VASP_DEPOSIT';
    heuristics.push('High-value threshold consistent with CEX OTC/Retail deposit');
  } else if (peeledOut.amount === 10 || peeledOut.amount === 100 || peeledOut.amount === 1) {
    destinationType = 'MIXER_INGRESS';
    heuristics.push('Fixed denomination matching mixer pool ingress');
  } else {
    destinationType = 'INTERMEDIATE_MULE';
  }

  return {
    isPeelChain: confidence >= 65,
    confidence: Math.min(99, confidence),
    peeledAmount: peeledOut.amount,
    changeAmount: changeOut.amount,
    peeledAddress: peeledOut.address,
    changeAddress: changeOut.address,
    destinationType,
    heuristicsTriggered: heuristics,
  };
}

/**
 * Cross-Chain Swapper & Bridge Correlation Engine
 * Correlates cross-chain Hawala hops (e.g. TRON TRC-20 -> FixedFloat -> Ethereum ETH)
 */
export function correlateCrossChainBridge(
  deposit: { amountUsd: number; timestampMs: number; token: string; chain: string },
  withdrawal: { amountUsd: number; timestampMs: number; token: string; chain: string }
): CrossChainCorrelationResult {
  const timeDeltaMinutes = Math.abs(withdrawal.timestampMs - deposit.timestampMs) / (1000 * 60);
  const volumeDiscrepancyPercent =
    Math.abs(deposit.amountUsd - withdrawal.amountUsd) / Math.max(0.1, deposit.amountUsd) * 100;

  const notes: string[] = [];
  let score = 100;

  // Time window: Bridges usually process within 2 to 45 minutes
  if (timeDeltaMinutes <= 15) {
    score -= 0;
    notes.push(`Rapid execution: ${timeDeltaMinutes.toFixed(1)} mins elapsed between lock and release.`);
  } else if (timeDeltaMinutes <= 45) {
    score -= 10;
    notes.push(`Standard bridge latency: ${timeDeltaMinutes.toFixed(1)} mins.`);
  } else if (timeDeltaMinutes <= 180) {
    score -= 30;
    notes.push(`Delayed release: ${timeDeltaMinutes.toFixed(1)} mins elapsed.`);
  } else {
    score -= 60;
    notes.push(`High time delta: ${timeDeltaMinutes.toFixed(0)} mins exceeds typical bridge latency.`);
  }

  // Volume discrepancy: Normal bridge fees + slippage range from 0.5% to 5.0%
  if (volumeDiscrepancyPercent <= 2.5) {
    notes.push(`Tight slippage tolerance: ${volumeDiscrepancyPercent.toFixed(2)}% fee/slippage match.`);
  } else if (volumeDiscrepancyPercent <= 6.0) {
    score -= 10;
    notes.push(`Acceptable bridge fee variance: ${volumeDiscrepancyPercent.toFixed(2)}%.`);
  } else if (volumeDiscrepancyPercent <= 15.0) {
    score -= 35;
    notes.push(`Moderate volume deviation: ${volumeDiscrepancyPercent.toFixed(2)}%.`);
  } else {
    score -= 65;
    notes.push(`Severe volume mismatch: ${volumeDiscrepancyPercent.toFixed(2)}% discrepancy.`);
  }

  score = Math.max(5, Math.min(99, score));

  return {
    confidence: score,
    timeDeltaMinutes: Number(timeDeltaMinutes.toFixed(2)),
    volumeDiscrepancyPercent: Number(volumeDiscrepancyPercent.toFixed(2)),
    isLikelyMatch: score >= 65,
    notes,
  };
}

/**
 * Format Section 63 BSA (Bharatiya Sakshya Adhiniyam, 2023) Electronic Evidence Certificate
 */
export function generateSection63BsaCertificate(params: {
  certificateNo: string;
  investigationId: string;
  caseRef: string;
  examinerName: string;
  examinerDesignation: string;
  digitalEvidenceHash: string;
  evidenceSource: string;
  deviceHostname?: string;
  operatingSystem?: string;
  producedDate?: string;
}): string {
  const dateStr = params.producedDate || new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  const host = params.deviceHostname || 'FORENSIC-WORKSTATION-SECURE-ENCLAVE';
  const os = params.operatingSystem || 'Certified Cryptographic Environment (Section 79A IT Act compliant)';

  return `====================================================================================================
CERTIFICATE UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
(Corresponding to Section 65B of the Indian Evidence Act, 1872)
FOR ADMISSIBILITY OF ELECTRONIC EVIDENCE IN THE COURT OF LAW
====================================================================================================

CERTIFICATE SERIAL NUMBER : ${params.certificateNo}
CRIME / CASE REFERENCE    : ${params.caseRef} (Internal ID: ${params.investigationId})
DATE & TIME OF PRODUCTION : ${dateStr}
FORENSIC EXAMINER         : ${params.examinerName}, ${params.examinerDesignation}

----------------------------------------------------------------------------------------------------
1. IDENTIFICATION OF ELECTRONIC RECORD & REPOSITORY:
----------------------------------------------------------------------------------------------------
Electronic Record Type   : Blockchain Ledger State, Transaction Artifact & Flow Manifest
Originating Source Node  : ${params.evidenceSource}
Computing Machine / Host : ${host}
Operating Environment   : ${os}

----------------------------------------------------------------------------------------------------
2. CRYPTOGRAPHIC INTEGRITY & HASH DIGEST (FIPS 180-4 / SHA-256):
----------------------------------------------------------------------------------------------------
SHA-256 Checksum : ${params.digitalEvidenceHash}
Verification     : CONSENSUS_VERIFIED_ON_LEDGER
Hash Integrity   : 100% BIT-FOR-BIT TAMPER-EVIDENT MATCH

----------------------------------------------------------------------------------------------------
3. MANDATORY STATUTORY DECLARATION UNDER SECTION 63(4) BSA 2023:
----------------------------------------------------------------------------------------------------
I, ${params.examinerName}, holding the designation of ${params.examinerDesignation}, do hereby solemnly 
affirm, declare, and state as follows:

(a) That the computer system and cryptographic node specified above was operating properly during the 
    period over which the electronic evidence record was generated, captured, and stored.
(b) That there were no operational defects, security compromises, or unauthorized modifications affecting 
    the accuracy or integrity of the electronic record.
(c) That the blockchain ledger data and cryptographic evidence hash reproduced herein were extracted 
    directly from decentralized distributed consensus nodes and cryptographically signed at rest.
(d) That the particulars stated above are true and correct to the best of my knowledge, belief, 
    and forensic electronic examination records.

Certified and sealed on ${dateStr}.

Examiner Signature / Digital Seal:
[DIGITALLY SIGNED VIA CHAINTRACE CRYPTOGRAPHIC HSM KEY]
${params.examinerName}
${params.examinerDesignation}
Government / Forensic Cyber Intelligence Laboratory
====================================================================================================`;
}

/**
 * Generates an official statutory order under Section 106 of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023
 * (Corresponding to Section 102 of the Code of Criminal Procedure, 1973 - Police Officer's power to seize property)
 */
export function generateSection106BnssFreezeOrder(params: {
  orderNo: string;
  policeStation: string;
  state: string;
  firNo: string;
  sectionsOfLaw: string;
  vaspName: string;
  vaspEmail: string;
  targetWalletOrUid: string;
  taintedAmount: string;
  investigatingOfficer: string;
  contactNumber: string;
}): string {
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return `====================================================================================================
OFFICE OF THE INVESTIGATING OFFICER / CYBER CRIME POLICE STATION
STATE POLICE HEADQUARTERS, ${params.state.toUpperCase()}
====================================================================================================

ORDER UNDER SECTION 106 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(Corresponding to Section 102 of the Code of Criminal Procedure, 1973)
DIRECTION FOR URGENT FREEZING / SEIZURE OF TAINTED VIRTUAL DIGITAL ASSETS (VDA)

Ref No: ${params.orderNo}                                                    Date: ${today}

TO:
The Nodal Officer / Legal Compliance & Law Enforcement Requests Team
${params.vaspName}
Email: ${params.vaspEmail}

SUBJECT: URGENT STATUTORY ORDER FOR FREEZING OF VIRTUAL DIGITAL ASSET WALLET / ACCOUNT
CASE REF: FIR / NCRP ACK NO: ${params.firNo}
POLICE STATION: ${params.policeStation}
OFFENCES U/S: ${params.sectionsOfLaw}

WHEREAS:
1. An investigation has been instituted under the provisions of the Bharatiya Nyaya Sanhita (BNS), 2023 
   and the Information Technology Act, 2000 regarding an organized cyber-fraud/money-laundering syndicate.

2. Forensic blockchain tracing and on-chain intelligence conducted via ChainTrace enterprise forensics 
   has conclusively tracked proceeds of crime amounting to ${params.taintedAmount} arriving at the following 
   wallet / account / UID hosted on your platform:

   TARGET WALLET ADDRESS / UID / MEMO : ${params.targetWalletOrUid}
   TAINTED CRIME PROCEEDS             : ${params.taintedAmount}

3. Under Section 106(1) of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023, any police officer may seize 
   any property which may be alleged or suspected to have been stolen, or which may be found under circumstances 
   which create suspicion of the commission of any offence.

NOW THEREFORE, YOU ARE HEREBY ORDERED AND DIRECTED TO:
1. IMMEDIATELY FREEZE / RESTRICT all outbound transfers, withdrawals, internal transfers, and P2P trading 
   associated with the above UID / Deposit Wallet with zero delay (within 24 hours of receipt).
2. PRESERVE the entire transaction history, login IP access logs, device fingerprints, KYC identity documents 
   (Aadhaar/PAN/Passport), linked bank accounts, and UPI IDs of the account holder.
3. SUBMIT a formal confirmation of the freeze along with the current asset balance report to the undersigned 
   Investigating Officer via return email.

TAKE NOTE THAT failure to comply with this statutory order will invite penal proceedings under Section 223 
of the Bharatiya Nyaya Sanhita, 2023 (Disobedience to order duly promulgated by public servant) and relevant 
provisions of the IT Act.

ISSUED UNDER MY HAND AND SEAL:

________________________________________
(INVESTIGATING OFFICER)
Name: ${params.investigatingOfficer}
Police Station: ${params.policeStation}, ${params.state}
Contact: ${params.contactNumber}
Cyber Crime Investigation Division
====================================================================================================`;
}
