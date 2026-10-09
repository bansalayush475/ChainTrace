import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

const router = Router();

const NODAL_DIRECTORY = [
  {
    entity: 'Binance Holdings Ltd (Global Compliance)',
    type: 'CRYPTO_EXCHANGE',
    nodalEmail: 'lawenforcement@binance.com',
    turnaroundTime: '< 45 minutes',
    jurisdiction: 'International (Subpoena §94 BNSS Accepted)',
    verifiedBadge: true,
  },
  {
    entity: 'Bybit Fintech FZE',
    type: 'CRYPTO_EXCHANGE',
    nodalEmail: 'subpoena@bybit.com',
    turnaroundTime: '< 60 minutes',
    jurisdiction: 'Dubai / International',
    verifiedBadge: true,
  },
  {
    entity: 'CoinDCX (Neblio Technologies Pvt Ltd)',
    type: 'FIU_REGISTERED_EXCHANGE',
    nodalEmail: 'compliance@coindcx.com',
    turnaroundTime: '< 20 minutes',
    jurisdiction: 'India (FIU-IND Reg. 2023)',
    verifiedBadge: true,
  },
  {
    entity: 'State Bank of India (Cyber Vigilance)',
    type: 'SCHEDULED_COMMERCIAL_BANK',
    nodalEmail: 'cybercell.ops@sbi.co.in',
    turnaroundTime: '< 15 minutes (Total Debit Freeze)',
    jurisdiction: 'India (RBI / NPCI Switch)',
    verifiedBadge: true,
  },
  {
    entity: 'NPCI UPI Fraud Response Bureau',
    type: 'NATIONAL_PAYMENT_SWITCH',
    nodalEmail: 'disputes.cyber@npci.org.in',
    turnaroundTime: '< 10 minutes (VPA Kill Switch)',
    jurisdiction: 'India (National Switch)',
    verifiedBadge: true,
  },
];

// GET /api/freeze/directory
router.get('/directory', (req, res) => {
  res.json(NODAL_DIRECTORY);
});

// GET /api/freeze
router.get('/', async (req, res) => {
  try {
    const notices = await db.getFreezeNotices();
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notices', details: err.message });
  }
});

// POST /api/freeze/vasp
router.post('/vasp', async (req, res) => {
  try {
    const { caseId, ackNo, targetAddress, exchangeName, recipientEmail, amount, officerName } = req.body;
    const now = new Date();
    const dispatchRef = `MHA/I4C/SEC94/${now.getFullYear()}/DL-${Math.floor(1000 + Math.random() * 9000)}`;

    const noticeContent = `
================================================================================
STATUTORY SUBPOENA & EMERGENCY PRESERVATION DIRECTIVE
UNDER SECTION 94 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(FORMERLY SECTION 91 OF CODE OF CRIMINAL PROCEDURE, 1973)
================================================================================
TO: Compliance Officer / Nodal Lead, ${exchangeName || 'Virtual Asset Service Provider'}
EMAIL: ${recipientEmail || 'compliance@exchange.com'}
DISPATCH REF: ${dispatchRef}
DATE: ${now.toUTCString()}
JURISDICTION: Special Cyber Crime Investigation Cell, New Delhi

SUBJECT: MANDATORY URGENT FREEZE ORDER & USER IDENTIFICATION FOR FRAUDULENT
CRYPTO PROCEEDS TRACED UNDER FIR NO. ${caseId || 'PENDING'} (NCRP ACK: ${ackNo || 'N/A'})

1. STATUTORY AUTHORITY:
In exercise of powers conferred under Section 94 BNSS (2023), you are hereby
directed to produce all electronic documents, ledger books, deposit logs, and
KYC records in respect of the target cryptocurrency address detailed below.

2. TARGET IDENTIFIER:
- Cryptocurrency Address: ${targetAddress || 'N/A'}
- Asset Volume: ${amount || 'Disputed Siphoned Proceeds'}
- Traced Destination Exchange: ${exchangeName || 'Destination Gateway'}

3. MANDATORY PRESERVATION MANDATE:
You are directed to immediately place an administrative hold / debit freeze on
the target wallet and associated accounts, preventing dissipation within the
CRITICAL GOLDEN HOUR window.
================================================================================
`.trim();

    // Compute SHA-256 integrity seal
    const sha256Seal = crypto.createHash('sha256').update(noticeContent).digest('hex');

    const notice = await db.addFreezeNotice({
      dispatchRef,
      noticeType: 'VASP_SUBPOENA_SEC94_BNSS',
      targetEntity: exchangeName || 'Cryptocurrency VASP',
      targetIdentifier: targetAddress,
      caseReference: caseId || ackNo || 'CRIMINAL-INVESTIGATION',
      recipientEmail: recipientEmail || 'compliance@exchange.com',
      sha256Seal,
      fullNoticeText: noticeContent,
      status: 'DISPATCHED',
    });

    await db.addAuditLog({
      user: officerName || 'Forensic Lead',
      action: 'REPORT_GENERATE',
      resource: dispatchRef,
      ip: req.ip || '10.0.0.1',
      details: `Generated Section 94 BNSS VASP Subpoena for ${exchangeName} (${targetAddress}). SHA-256 seal: ${sha256Seal.slice(0, 16)}...`,
    });

    res.status(201).json({
      success: true,
      notice,
      sha256Seal,
      dispatchRef,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate VASP freeze notice', details: err.message });
  }
});

// POST /api/freeze/bank
router.post('/bank', async (req, res) => {
  try {
    const { bankName, accountNumber, ifsc, utr, upiVpa, amountInr, officerName } = req.body;
    const now = new Date();
    const dispatchRef = `MHA/I4C/SEC106/${now.getFullYear()}/MULE-${Math.floor(1000 + Math.random() * 9000)}`;

    const noticeContent = `
================================================================================
ORDER FOR SEIZURE & TOTAL DEBIT FREEZE OF SUSPECT MULE ACCOUNT
UNDER SECTION 106 OF BHARATIYA NAGARIK SURAKSHA SANHITA (BNSS), 2023
(FORMERLY SECTION 102 OF CODE OF CRIMINAL PROCEDURE, 1973)
================================================================================
TO: The Branch Manager / Nodal Vigilance Officer, ${bankName || 'State Bank of India'}
DISPATCH REF: ${dispatchRef}
DATE: ${now.toUTCString()}

SUBJECT: IMMEDIATE TOTAL DEBIT FREEZE ON ACCOUNT NO. ${accountNumber || 'CONFIDENTIAL'}
LINKED TO CYBER FINANCIAL CRIME (NPCI UTR: ${utr || 'N/A'}, UPI: ${upiVpa || 'N/A'})

1. In exercise of powers conferred under Section 106 BNSS 2023, you are hereby
commanded to effectuate an IMMEDIATE TOTAL DEBIT FREEZE on the suspect bank account:
- Target Account No: ${accountNumber || 'N/A'}
- IFSC Code: ${ifsc || 'N/A'}
- Disputed Siphoned Amount: ₹${Number(amountInr || 0).toLocaleString()}
- Associated UPI VPA: ${upiVpa || 'N/A'}

2. Failure to execute this freeze within the Golden Window shall attract penal
proceedings under Section 223 of Bharatiya Nyaya Sanhita (BNS), 2023.
================================================================================
`.trim();

    const sha256Seal = crypto.createHash('sha256').update(noticeContent).digest('hex');

    const notice = await db.addFreezeNotice({
      dispatchRef,
      noticeType: 'BANK_FREEZE_SEC106_BNSS',
      targetEntity: bankName || 'Mule Bank Branch',
      targetIdentifier: `${accountNumber || ''} (UTR: ${utr || 'N/A'})`,
      caseReference: `MULE-${utr || 'NCRP-1930'}`,
      recipientEmail: 'cybercell.ops@bank.co.in',
      sha256Seal,
      fullNoticeText: noticeContent,
      status: 'DISPATCHED',
    });

    res.status(201).json({
      success: true,
      notice,
      sha256Seal,
      dispatchRef,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate Bank freeze order', details: err.message });
  }
});

export default router;
