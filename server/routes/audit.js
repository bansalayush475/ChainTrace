import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

const router = Router();

// GET /api/audit
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const logs = await db.getAuditLogs(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs', details: err.message });
  }
});

// POST /api/audit
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    const now = new Date().toISOString();
    const rawPayload = `${now}|${body.user || 'Officer'}|${body.action || 'ACTION'}|${body.resource || 'RESOURCE'}|${body.details || ''}`;
    const integrityHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

    const log = await db.addAuditLog({
      timestamp: now,
      user: body.user || 'Forensic Officer',
      action: body.action || 'INVESTIGATION_UPDATE',
      resource: body.resource || 'SYSTEM',
      ip: req.ip || body.ip || '10.0.0.1',
      session: body.session || 'SESSION-SOVEREIGN-MHA',
      details: body.details || '',
      integrityHash,
    });

    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record audit log', details: err.message });
  }
});

// POST /api/audit/reset-database
router.post('/reset-database', async (req, res) => {
  try {
    const result = await db.resetToEmpty();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset database', details: err.message });
  }
});

export default router;
