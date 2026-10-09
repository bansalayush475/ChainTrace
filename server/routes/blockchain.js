import { Router } from 'express';
import {
  queryAddress,
  queryTransaction,
  getNodeStatus,
  detectChain,
} from '../services/blockchainService.js';

const router = Router();

/**
 * GET /api/blockchain/status
 * Live status of all 4 blockchain nodes (block height, latency, online/offline)
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getNodeStatus();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      nodes: status,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch node status', details: err.message });
  }
});

/**
 * GET /api/blockchain/address/:address?chain=ETH|BTC|TRON|POLYGON
 * Full wallet intelligence: balance, tx count, last block, provider
 */
router.get('/address/:address', async (req, res) => {
  const { address } = req.params;
  const chain = req.query.chain || null;

  if (!address || address.length < 10) {
    return res.status(400).json({ error: 'Valid blockchain address is required' });
  }

  const resolvedChain = chain || detectChain(address);

  try {
    const data = await queryAddress(address.trim(), resolvedChain);
    res.json({ success: true, ...data });
  } catch (err) {
    // Return graceful degradation — don't fail the investigation
    res.status(200).json({
      success: false,
      address: address.trim(),
      blockchain: resolvedChain,
      token: resolvedChain === 'BTC' ? 'BTC' : resolvedChain === 'TRON' ? 'TRX' : 'ETH',
      balance: 0,
      txCount: 0,
      isLive: false,
      error: err.message,
      provider: 'Unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/blockchain/address (same but body-based for convenience)
 */
router.post('/address', async (req, res) => {
  const { address, chain } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'address is required' });
  }

  const resolvedChain = chain || detectChain(address);

  try {
    const data = await queryAddress(address.trim(), resolvedChain);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(200).json({
      success: false,
      address: address.trim(),
      blockchain: resolvedChain,
      balance: 0,
      txCount: 0,
      isLive: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/blockchain/tx/:hash?chain=BTC|ETH|TRON|POLYGON
 * Look up a specific transaction hash across chains
 */
router.get('/tx/:hash', async (req, res) => {
  const { hash } = req.params;
  const chain = req.query.chain || 'ETH';

  if (!hash) {
    return res.status(400).json({ error: 'Transaction hash is required' });
  }

  try {
    const data = await queryTransaction(hash.trim(), chain.toUpperCase());
    res.json({ success: true, chain: chain.toUpperCase(), hash, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transaction', details: err.message });
  }
});

/**
 * GET /api/blockchain/fees
 * Bitcoin mempool fee estimates from Blockstream
 */
router.get('/fees', async (req, res) => {
  try {
    const btcApiUrl = process.env.BTC_API_URL || 'https://blockstream.info/api';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const feeRes = await fetch(`${btcApiUrl}/fee-estimates`, { signal: controller.signal });
    clearTimeout(timer);
    if (!feeRes.ok) throw new Error(`HTTP ${feeRes.status}`);
    const fees = await feeRes.json();
    res.json({ success: true, chain: 'BTC', fees, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch fee estimates', details: err.message });
  }
});

/**
 * GET /api/blockchain/detect/:address
 * Auto-detect which chain an address belongs to
 */
router.get('/detect/:address', (req, res) => {
  const { address } = req.params;
  const chain = detectChain(address);
  res.json({ address, detectedChain: chain });
});

export default router;
