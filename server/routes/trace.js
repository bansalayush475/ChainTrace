import { Router } from 'express';
import { queryAddress, detectChain } from '../services/blockchainService.js';

const router = Router();

/**
 * POST /api/trace
 * Unified wallet address tracer — uses live blockchain APIs for all chains.
 * Falls back gracefully if node is unreachable.
 */
router.post('/', async (req, res) => {
  const { address, chain } = req.body;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Valid wallet address is required' });
  }

  const cleanAddr = address.trim();
  const resolvedChain = (chain || detectChain(cleanAddr)).toUpperCase();

  try {
    const result = await queryAddress(cleanAddr, resolvedChain);
    res.json(result);
  } catch (err) {
    // Graceful fallback — return structure with isLive:false so UI can show degraded state
    console.warn(`[Trace] Live query failed for ${cleanAddr} on ${resolvedChain}: ${err.message}`);
    res.json({
      address: cleanAddr,
      blockchain: resolvedChain,
      token: resolvedChain === 'BTC' ? 'BTC' : resolvedChain === 'TRON' ? 'TRX' : resolvedChain === 'POLYGON' ? 'MATIC' : 'ETH',
      balance: 0,
      txCount: 0,
      isLive: false,
      degraded: true,
      error: err.message,
      provider: 'Node Unreachable — Sovereignty Resilience Mode',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/trace/:address
 * Convenience GET route for address tracing
 */
router.get('/:address', async (req, res) => {
  const cleanAddr = req.params.address.trim();
  const chain = (req.query.chain || detectChain(cleanAddr)).toUpperCase();

  try {
    const result = await queryAddress(cleanAddr, chain);
    res.json(result);
  } catch (err) {
    res.json({
      address: cleanAddr,
      blockchain: chain,
      balance: 0,
      txCount: 0,
      isLive: false,
      degraded: true,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
