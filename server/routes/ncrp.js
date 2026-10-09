import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/ncrp/feed
router.get('/feed', async (req, res) => {
  try {
    const complaints = await db.getNcrpComplaints();
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch NCRP complaints feed', details: err.message });
  }
});

// POST /api/ncrp/dispatch
router.post('/dispatch', async (req, res) => {
  try {
    const body = req.body;
    const complaint = await db.addNcrpComplaint(body);

    await db.addAuditLog({
      user: 'NCRP-1930-GATEWAY',
      action: 'WATCHLIST_ADD',
      resource: complaint.ackNo,
      ip: req.ip || '10.0.0.1',
      details: `Citizen complaint received via 1930 portal: ₹${complaint.lossInr?.toLocaleString()} lost to ${complaint.suspectWallet || 'Unknown'}`,
    });

    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record NCRP complaint', details: err.message });
  }
});

// POST /api/ncrp/escalate/:id
router.post('/escalate/:id', async (req, res) => {
  try {
    const complaints = await db.getNcrpComplaints();
    const comp = complaints.find((c) => c.id === req.params.id || c.ackNo === req.params.id);
    if (!comp) return res.status(404).json({ error: 'NCRP Complaint not found' });

    // Create formal case docket
    const newCase = await db.createInvestigation({
      caseId: `FIR-${new Date().getFullYear()}-${comp.ackNo.replace(/[^0-9]/g, '').slice(-6)}`,
      title: `[NCRP-${comp.ackNo}] ${comp.crimeCategory} - Victim: ${comp.victimName}`,
      suspectWallet: comp.suspectWallet,
      blockchain: comp.blockchain || 'TRON',
      riskScore: 88,
      fundsTraced: comp.lossInr,
      currency: 'INR',
      investigator: req.body.officerName || 'Lead Cyber Officer',
      status: 'UNDER_INVESTIGATION',
      priority: 'CRITICAL',
      description: `Escalated from citizen complaint filed on 1930 Helpline. Victim: ${comp.victimName}, Amount: ₹${comp.lossInr?.toLocaleString()}. Reported suspect wallet: ${comp.suspectWallet}. Bank UTR: ${comp.bankUtr || 'N/A'}, UPI: ${comp.upiVpa || 'N/A'}.`,
      tags: ['1930-escalation', 'golden-hour', 'citizen-intake'],
    });

    res.json({
      message: 'Complaint escalated to formal case docket successfully',
      case: newCase,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to escalate complaint', details: err.message });
  }
});

export default router;
