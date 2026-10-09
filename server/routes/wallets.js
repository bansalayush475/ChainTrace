import { Router } from 'express';
import { db } from '../db/database.js';

const router = Router();

// GET /api/wallets
router.get('/', async (req, res) => {
  try {
    const { blockchain, entityType } = req.query;
    const wallets = await db.getWallets({ blockchain, entityType });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve wallets', details: err.message });
  }
});

// POST /api/wallets
router.post('/', async (req, res) => {
  try {
    const body = req.body;
    if (!body.address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }
    const wallet = await db.addWallet(body);
    res.status(201).json(wallet);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add wallet profile', details: err.message });
  }
});

export default router;
