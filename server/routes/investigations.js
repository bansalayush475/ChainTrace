import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/investigations
router.get('/', async (req, res) => {
  try {
    const { status, investigator } = req.query;
    const investigations = await db.getInvestigations({ status, investigator });
    res.json(investigations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve investigations', details: err.message });
  }
});

// POST /api/investigations
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.title && !body.suspectWallet) {
      return res.status(400).json({ error: 'Case title or suspect wallet address is required' });
    }

    const created = await db.createInvestigation(body);

    // Initial timeline event
    await db.addTimelineEvent({
      investigationId: created.id,
      eventType: 'INVESTIGATION_UPDATE',
      description: `Formal case docket opened: ${created.caseId} (${created.title}). Primary target: ${created.suspectWallet || 'N/A'}.`,
      walletAddress: created.suspectWallet,
      investigatorNote: created.description,
    });

    // Audit log entry
    await db.addAuditLog({
      user: created.investigator || 'Arjun Sharma',
      action: 'INVESTIGATION_CREATE',
      resource: created.caseId,
      ip: req.ip || '10.0.0.1',
      details: `Registered formal cybercase docket ${created.caseId} under jurisdiction ${created.jurisdiction}`,
    });

    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create investigation', details: err.message });
  }
});

// GET /api/investigations/:id
router.get('/:id', async (req, res) => {
  try {
    const inv = await db.getInvestigationById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });
    const timeline = await db.getTimelineEvents(inv.id);
    res.json({ ...inv, timeline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch investigation', details: err.message });
  }
});

// PATCH /api/investigations/:id
router.patch('/:id', async (req, res) => {
  try {
    const updated = await db.updateInvestigation(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Investigation not found' });

    if (req.body.status) {
      await db.addTimelineEvent({
        investigationId: updated.id,
        eventType: req.body.status === 'ESCALATED' ? 'ESCALATION' : 'INVESTIGATION_UPDATE',
        description: `Investigation status changed to ${req.body.status}. Reason: ${req.body.escalationReason || 'Investigator judicial update'}.`,
      });

      await db.addAuditLog({
        user: req.body.officerName || 'Lead Officer',
        action: 'INVESTIGATION_UPDATE',
        resource: updated.caseId,
        ip: req.ip || '10.0.0.1',
        details: `Updated investigation status to ${req.body.status}`,
      });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update investigation', details: err.message });
  }
});

// GET /api/investigations/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const events = await db.getTimelineEvents(req.params.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve timeline', details: err.message });
  }
});

// POST /api/investigations/:id/timeline
router.post('/:id/timeline', async (req, res) => {
  try {
    const event = await db.addTimelineEvent({
      ...req.body,
      investigationId: req.params.id,
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: 'Failed to append timeline event', details: err.message });
  }
});

export default router;
