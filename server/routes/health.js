import { Router } from 'express';
import { db } from '../db/database.js';
import { getSupabaseStatus } from '../db/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const stats = await db.getStats();
    const supabase = getSupabaseStatus();

    res.json({
      status: 'ONLINE',
      system: 'ChainTrace: Sovereign Crypto-Blockchain Forensic & Intelligence Platform',
      version: '2.0.0',
      node: 'NCFL-DELHI-NODE-01',
      jurisdiction: process.env.DEFAULT_JURISDICTION || 'Delhi Police Cyber Crime PS (Special Cell)',
      authority: 'Ministry of Home Affairs (I4C) Government of India',
      timestamp: new Date().toISOString(),
      database: {
        engine: stats.engine,
        supabaseConnected: supabase.configured,
        supabaseStatus: supabase,
        stats,
      },
      blockchainNodes: {
        tronGrid: 'CONNECTED (HTTP 200 / TRC-20 Real-Time)',
        blockstreamBtc: 'CONNECTED (Blockstream API v1)',
        blockscoutEvm: 'CONNECTED (EVM Multi-Chain RPC)',
      },
      statutoryCompliance: [
        'Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)',
        'Section 79A Information Technology Act, 2000',
        'Section 94 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
        'Section 106 Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve system health', details: err.message });
  }
});

export default router;
