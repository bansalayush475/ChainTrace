/**
 * ChainTrace — Frontend Blockchain API Service
 *
 * Calls the backend /api/blockchain/* routes which proxy to:
 *  - Ethereum (Infura)
 *  - Polygon (GetBlock)
 *  - TRON (TronGrid)
 *  - Bitcoin (Blockstream Esplora)
 */

const API_BASE = '/api/blockchain';

export type ChainType = 'ETH' | 'BTC' | 'TRON' | 'POLYGON';

export interface WalletIntelligence {
  success: boolean;
  address: string;
  blockchain: ChainType;
  token: string;
  balance: number;
  balanceRaw?: number;
  balanceTrx?: number;
  usdtBalance?: number;
  balanceSat?: number;
  txCount: number;
  lastBlock?: number;
  mempoolTxCount?: number;
  isLive: boolean;
  degraded?: boolean;
  error?: string;
  provider: string;
  providerUrl?: string;
  timestamp: string;
}

export interface NodeStatus {
  chain: string;
  provider: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastBlock: number;
  latencyMs: number;
  endpoint?: string;
  error?: string;
}

export interface BlockchainStatus {
  success: boolean;
  timestamp: string;
  nodes: {
    ETH: NodeStatus;
    POLYGON: NodeStatus;
    TRON: NodeStatus;
    BTC: NodeStatus;
  };
}

export interface BtcFeeEstimates {
  success: boolean;
  chain: 'BTC';
  fees: Record<string, number>;
  timestamp: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

class BlockchainApiService {
  /**
   * Query a wallet address for live balance, tx count, etc.
   * Chain is auto-detected if not provided.
   */
  async queryAddress(address: string, chain?: ChainType): Promise<WalletIntelligence> {
    const params = chain ? `?chain=${chain}` : '';
    try {
      return await apiFetch<WalletIntelligence>(`/address/${encodeURIComponent(address)}${params}`);
    } catch (err: any) {
      // Graceful offline fallback
      return {
        success: false,
        address,
        blockchain: chain || 'ETH',
        token: chain === 'BTC' ? 'BTC' : chain === 'TRON' ? 'TRX' : chain === 'POLYGON' ? 'MATIC' : 'ETH',
        balance: 0,
        txCount: 0,
        isLive: false,
        degraded: true,
        error: err.message,
        provider: 'Offline / Unreachable',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch live status of all 4 blockchain nodes.
   */
  async getNodeStatus(): Promise<BlockchainStatus> {
    return apiFetch<BlockchainStatus>('/status');
  }

  /**
   * Look up a specific transaction hash on a given chain.
   */
  async getTransaction(hash: string, chain: ChainType): Promise<any> {
    return apiFetch(`/tx/${encodeURIComponent(hash)}?chain=${chain}`);
  }

  /**
   * Bitcoin mempool fee estimates (sat/vB by confirmation target).
   */
  async getBtcFees(): Promise<BtcFeeEstimates> {
    return apiFetch<BtcFeeEstimates>('/fees');
  }

  /**
   * Auto-detect which chain an address belongs to (BTC / ETH / TRON / POLYGON).
   */
  async detectChain(address: string): Promise<{ address: string; detectedChain: ChainType }> {
    return apiFetch(`/detect/${encodeURIComponent(address)}`);
  }

  /**
   * Format a balance for display with appropriate decimal places and token symbol.
   */
  formatBalance(intel: WalletIntelligence): string {
    if (!intel.isLive) return 'N/A';
    const { balance, token, blockchain } = intel;
    if (blockchain === 'BTC') return `${balance.toFixed(8)} BTC`;
    if (blockchain === 'TRON') {
      if (intel.usdtBalance && intel.usdtBalance > 0) {
        return `${intel.usdtBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })} USDT`;
      }
      return `${balance.toLocaleString('en-IN', { maximumFractionDigits: 6 })} TRX`;
    }
    return `${balance.toLocaleString('en-IN', { maximumFractionDigits: 4 })} ${token}`;
  }

  /**
   * Convert ETH balance to approximate INR (rough estimate for display).
   * Uses a static reference rate — for forensic estimate only.
   */
  estimateInr(intel: WalletIntelligence, ethPriceInr = 280000, btcPriceInr = 6500000, maticPriceInr = 90, trxPriceInr = 11): number {
    const { balance, blockchain } = intel;
    switch (blockchain) {
      case 'ETH':     return balance * ethPriceInr;
      case 'BTC':     return balance * btcPriceInr;
      case 'POLYGON': return balance * maticPriceInr;
      case 'TRON':    return (intel.usdtBalance || 0) > 0 ? (intel.usdtBalance || 0) * 84 : balance * trxPriceInr;
      default:        return 0;
    }
  }
}

export const blockchainApi = new BlockchainApiService();
export default blockchainApi;
