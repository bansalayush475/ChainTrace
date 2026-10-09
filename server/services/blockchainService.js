/**
 * ChainTrace — Sovereign Blockchain Intelligence Service
 * 
 * Unified multi-chain adapter providing live on-chain data for:
 *  - Ethereum (Infura JSON-RPC)
 *  - Polygon / MATIC (GetBlock JSON-RPC)
 *  - TRON (TronGrid REST — API key authenticated)
 *  - Bitcoin (Blockstream Esplora REST — public)
 * 
 * All methods return a normalised WalletIntelligence object for consistent
 * consumption by the trace route and frontend.
 */

const ETH_RPC_URL = process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/498a61937a534335a4564c27bdef205d';
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://shared.ap-southeast-1.getblock.io/94e0980e26da4832a0391fcadf9e8131/mainnet/';
const TRONGRID_API_KEY = process.env.TRONGRID_API_KEY || 'c6586d90-3773-4708-b334-3a3b3babc5e4';
const TRON_API_URL = process.env.TRON_API_URL || 'https://api.trongrid.io';
const BTC_API_URL = process.env.BTC_API_URL || 'https://blockstream.info/api';

// USDT TRC-20 contract address
const USDT_TRC20_CONTRACT = 'TR7NHqJEKQxGTCi8q8ZY4pL8otSzgjLj6t';

// USDT ERC-20 contract address (Ethereum)
const USDT_ERC20_CONTRACT = '0xdac17f958d2ee523a2206206994597c13d831ec7';

/** Helper: fetch with timeout */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/** JSON-RPC helper for EVM chains (Ethereum, Polygon) */
async function evmRpcCall(rpcUrl, method, params = []) {
  const res = await fetchWithTimeout(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

/** Hex to decimal conversion for EVM balances */
function hexToDecimal(hex) {
  if (!hex || hex === '0x') return 0;
  return parseInt(hex, 16);
}

/** Wei to ETH */
function weiToEth(wei) {
  return wei / 1e18;
}

// ──────────────────────────────────────────────────────────────────────────────
// ETHEREUM
// ──────────────────────────────────────────────────────────────────────────────

export async function queryEthereum(address) {
  const balanceHex = await evmRpcCall(ETH_RPC_URL, 'eth_getBalance', [address, 'latest']);
  const txCountHex = await evmRpcCall(ETH_RPC_URL, 'eth_getTransactionCount', [address, 'latest']);
  const blockHex = await evmRpcCall(ETH_RPC_URL, 'eth_blockNumber', []);

  const balanceWei = hexToDecimal(balanceHex);
  const ethBalance = weiToEth(balanceWei);
  const txCount = hexToDecimal(txCountHex);
  const blockNumber = hexToDecimal(blockHex);

  return {
    address,
    blockchain: 'ETH',
    token: 'ETH',
    balance: ethBalance,
    balanceRaw: balanceWei,
    txCount,
    lastBlock: blockNumber,
    isLive: true,
    provider: 'Infura Ethereum Mainnet',
    providerUrl: ETH_RPC_URL.replace(/\/[^/]+$/, '/***'),
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// POLYGON / MATIC
// ──────────────────────────────────────────────────────────────────────────────

export async function queryPolygon(address) {
  const balanceHex = await evmRpcCall(POLYGON_RPC_URL, 'eth_getBalance', [address, 'latest']);
  const txCountHex = await evmRpcCall(POLYGON_RPC_URL, 'eth_getTransactionCount', [address, 'latest']);
  const blockHex = await evmRpcCall(POLYGON_RPC_URL, 'eth_blockNumber', []);

  const balanceWei = hexToDecimal(balanceHex);
  const maticBalance = weiToEth(balanceWei);
  const txCount = hexToDecimal(txCountHex);
  const blockNumber = hexToDecimal(blockHex);

  return {
    address,
    blockchain: 'POLYGON',
    token: 'MATIC',
    balance: maticBalance,
    balanceRaw: balanceWei,
    txCount,
    lastBlock: blockNumber,
    isLive: true,
    provider: 'GetBlock Polygon Mainnet',
    providerUrl: 'shared.ap-southeast-1.getblock.io/***',
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TRON
// ──────────────────────────────────────────────────────────────────────────────

export async function queryTron(address) {
  const headers = {
    'TRON-PRO-API-KEY': TRONGRID_API_KEY,
    'Content-Type': 'application/json',
  };

  // Get account info
  const accountRes = await fetchWithTimeout(
    `${TRON_API_URL}/v1/accounts/${address}`,
    { headers }
  );
  if (!accountRes.ok) throw new Error(`TronGrid HTTP ${accountRes.status}`);
  const accountData = await accountRes.json();
  const account = accountData.data?.[0];

  const balanceTrx = (account?.balance || 0) / 1e6;

  // TRC-20 USDT balance
  let usdtBalance = 0;
  const trc20 = account?.trc20 || [];
  for (const item of trc20) {
    const key = Object.keys(item)[0];
    if (key === USDT_TRC20_CONTRACT) {
      usdtBalance = Number(item[key]) / 1e6;
    }
  }

  // Get recent tx count via transactions endpoint
  let txCount = 0;
  try {
    const txRes = await fetchWithTimeout(
      `${TRON_API_URL}/v1/accounts/${address}/transactions?limit=1&only_confirmed=true`,
      { headers }
    );
    if (txRes.ok) {
      const txData = await txRes.json();
      txCount = txData?.meta?.total || 0;
    }
  } catch (_) { /* non-critical */ }

  // Get latest block number
  let lastBlock = 0;
  try {
    const blockRes = await fetchWithTimeout(`${TRON_API_URL}/walletsolidity/getnowblock`, { headers });
    if (blockRes.ok) {
      const blockData = await blockRes.json();
      lastBlock = blockData?.block_header?.raw_data?.number || 0;
    }
  } catch (_) { /* non-critical */ }

  return {
    address,
    blockchain: 'TRON',
    token: usdtBalance > 0 ? 'USDT (TRC-20)' : 'TRX',
    balance: usdtBalance > 0 ? usdtBalance : balanceTrx,
    balanceTrx,
    usdtBalance,
    txCount,
    lastBlock,
    isLive: true,
    provider: 'TronGrid (Authenticated)',
    providerUrl: TRON_API_URL,
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// BITCOIN
// ──────────────────────────────────────────────────────────────────────────────

export async function queryBitcoin(address) {
  const addrRes = await fetchWithTimeout(`${BTC_API_URL}/address/${address}`);
  if (!addrRes.ok) throw new Error(`Blockstream HTTP ${addrRes.status}`);
  const data = await addrRes.json();

  const chainStats = data.chain_stats || {};
  const mempoolStats = data.mempool_stats || {};

  const fundedSat = (chainStats.funded_txo_sum || 0);
  const spentSat = (chainStats.spent_txo_sum || 0);
  const balanceSat = Math.max(0, fundedSat - spentSat);
  const balanceBtc = balanceSat / 1e8;
  const txCount = (chainStats.tx_count || 0) + (mempoolStats.tx_count || 0);

  // Get current block height
  let lastBlock = 0;
  try {
    const tipRes = await fetchWithTimeout(`${BTC_API_URL}/blocks/tip/height`);
    if (tipRes.ok) lastBlock = parseInt(await tipRes.text(), 10);
  } catch (_) { /* non-critical */ }

  return {
    address,
    blockchain: 'BTC',
    token: 'BTC',
    balance: balanceBtc,
    balanceSat,
    fundedSat,
    spentSat,
    txCount,
    lastBlock,
    mempoolTxCount: mempoolStats.tx_count || 0,
    isLive: true,
    provider: 'Blockstream Esplora (Public)',
    providerUrl: BTC_API_URL,
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// TRANSACTION LOOKUP
// ──────────────────────────────────────────────────────────────────────────────

export async function queryTransaction(txHash, chain) {
  if (chain === 'BTC') {
    const res = await fetchWithTimeout(`${BTC_API_URL}/tx/${txHash}`);
    if (!res.ok) throw new Error(`Blockstream tx HTTP ${res.status}`);
    return await res.json();
  }

  if (chain === 'TRON') {
    const headers = { 'TRON-PRO-API-KEY': TRONGRID_API_KEY };
    const res = await fetchWithTimeout(
      `${TRON_API_URL}/v1/transactions/${txHash}`,
      { headers }
    );
    if (!res.ok) throw new Error(`TronGrid tx HTTP ${res.status}`);
    return await res.json();
  }

  // EVM (ETH or POLYGON)
  const rpcUrl = chain === 'POLYGON' ? POLYGON_RPC_URL : ETH_RPC_URL;
  const tx = await evmRpcCall(rpcUrl, 'eth_getTransactionByHash', [txHash]);
  const receipt = await evmRpcCall(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
  return { transaction: tx, receipt };
}

// ──────────────────────────────────────────────────────────────────────────────
// NODE STATUS (for API Status dashboard)
// ──────────────────────────────────────────────────────────────────────────────

export async function getNodeStatus() {
  const results = {};

  // Ethereum
  try {
    const t0 = Date.now();
    const blockHex = await evmRpcCall(ETH_RPC_URL, 'eth_blockNumber', []);
    const latency = Date.now() - t0;
    results.ETH = {
      chain: 'Ethereum Mainnet',
      provider: 'Infura',
      status: 'ONLINE',
      lastBlock: hexToDecimal(blockHex),
      latencyMs: latency,
      endpoint: ETH_RPC_URL.replace(/\/[^/]+$/, '/***'),
    };
  } catch (err) {
    results.ETH = { chain: 'Ethereum Mainnet', provider: 'Infura', status: 'OFFLINE', latencyMs: 0, lastBlock: 0, error: err.message };
  }

  // Polygon
  try {
    const t0 = Date.now();
    const blockHex = await evmRpcCall(POLYGON_RPC_URL, 'eth_blockNumber', []);
    const latency = Date.now() - t0;
    results.POLYGON = {
      chain: 'Polygon Mainnet',
      provider: 'GetBlock',
      status: 'ONLINE',
      lastBlock: hexToDecimal(blockHex),
      latencyMs: latency,
      endpoint: 'getblock.io/***',
    };
  } catch (err) {
    results.POLYGON = { chain: 'Polygon Mainnet', provider: 'GetBlock', status: 'OFFLINE', latencyMs: 0, lastBlock: 0, error: err.message };
  }

  // TRON
  try {
    const t0 = Date.now();
    const res = await fetchWithTimeout(`${TRON_API_URL}/walletsolidity/getnowblock`, {
      headers: { 'TRON-PRO-API-KEY': TRONGRID_API_KEY },
    });
    const latency = Date.now() - t0;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    results.TRON = {
      chain: 'TRON Mainnet',
      provider: 'TronGrid',
      status: 'ONLINE',
      lastBlock: data?.block_header?.raw_data?.number || 0,
      latencyMs: latency,
      endpoint: TRON_API_URL,
    };
  } catch (err) {
    results.TRON = { chain: 'TRON Mainnet', provider: 'TronGrid', status: 'OFFLINE', latencyMs: 0, lastBlock: 0, error: err.message };
  }

  // Bitcoin
  try {
    const t0 = Date.now();
    const tipRes = await fetchWithTimeout(`${BTC_API_URL}/blocks/tip/height`);
    const latency = Date.now() - t0;
    if (!tipRes.ok) throw new Error(`HTTP ${tipRes.status}`);
    const height = parseInt(await tipRes.text(), 10);
    results.BTC = {
      chain: 'Bitcoin Mainnet',
      provider: 'Blockstream Esplora',
      status: 'ONLINE',
      lastBlock: height,
      latencyMs: latency,
      endpoint: BTC_API_URL,
    };
  } catch (err) {
    results.BTC = { chain: 'Bitcoin Mainnet', provider: 'Blockstream', status: 'OFFLINE', latencyMs: 0, lastBlock: 0, error: err.message };
  }

  return results;
}

// ──────────────────────────────────────────────────────────────────────────────
// AUTO-DETECT CHAIN + UNIFIED QUERY
// ──────────────────────────────────────────────────────────────────────────────

export function detectChain(address) {
  const a = address.trim();
  if (a.startsWith('T') && a.length === 34) return 'TRON';
  if (a.startsWith('bc1') || /^[13][a-zA-HJ-NP-Z1-9]{25,34}$/.test(a)) return 'BTC';
  if (a.startsWith('0x') && a.length === 42) return 'ETH';
  return 'ETH'; // default fallback
}

export async function queryAddress(address, chain) {
  const resolvedChain = chain || detectChain(address);

  switch (resolvedChain.toUpperCase()) {
    case 'ETH':      return queryEthereum(address);
    case 'POLYGON':
    case 'MATIC':    return queryPolygon(address);
    case 'TRON':     return queryTron(address);
    case 'BTC':      return queryBitcoin(address);
    default:         return queryEthereum(address);
  }
}
