import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/evidence
router.get('/', async (req, res) => {
  try {
    const { investigationId } = req.query;
    const evidence = await db.getEvidence(investigationId);
    res.json(evidence);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve evidence records', details: err.message });
  }
});

// POST /api/evidence
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.hash) {
      return res.status(400).json({ error: 'Cryptographic hash digest is required for digital evidence' });
    }
    const ev = await db.addEvidence(body);
    res.status(201).json(ev);
  } catch (err) {
    res.status(500).json({ error: 'Failed to register evidence exhibit', details: err.message });
  }
});

export default router;
