import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/transactions
router.get('/', async (req, res) => {
  try {
    const { address, investigationId } = req.query;
    const transactions = await db.getTransactions({ address, investigationId });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transactions', details: err.message });
  }
});

// POST /api/transactions
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.hash || !body.fromAddress || !body.toAddress) {
      return res.status(400).json({ error: 'Transaction hash, fromAddress, and toAddress are required' });
    }
    const tx = await db.addTransaction(body);
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record transaction', details: err.message });
  }
});

export default router;
