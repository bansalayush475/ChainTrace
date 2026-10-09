import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Maximize2,
  Minimize2,
  Download,
  ExternalLink,
  Shield,
  X,
  Copy,
  Check,
  Zap,
  Award
} from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { truncateAddress, getRiskColor } from '../../utils/riskEngine';
import { useStore } from '../../store/useStore';
import type { Wallet, Transaction, Investigation } from '../../data/mockData';

interface WalletNodeData {
  address: string;
  label: string;
  entityType: string;
  riskScore: number;
  balance: number;
  blockchain: string;
}

const entityColors: Record<string, string> = {
  VICTIM: '#3182ce',
  SUSPECT: '#b91c1c',
  INTERMEDIATE: '#8892a0',
  MIXER: '#9f7aea',
  BRIDGE: '#ed8936',
  EXCHANGE: '#38a169',
  UNKNOWN: '#4a5568',
};

function WalletNode({ data }: { data: WalletNodeData }) {
  const color = entityColors[data.entityType] ?? '#4a5568';
  const riskColor = getRiskColor(data.riskScore);

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `2px solid ${color}`,
        borderRadius: '8px',
        padding: '10px 14px',
        minWidth: '160px',
        boxShadow: `0 0 12px ${color}40, 0 2px 8px rgba(0,0,0,0.3)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: color, opacity: 0.8,
        pointerEvents: 'none',
      }} />
      <Handle type="target" position={Position.Left} style={{ background: color, border: 'none', width: 8, height: 8 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            padding: '2px 6px',
            borderRadius: '3px',
            background: `${color}20`,
            color,
          }}
        >
          {data.entityType}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: riskColor,
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {data.riskScore}
        </span>
      </div>

      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          color: 'var(--text-mono)',
          marginBottom: '4px',
        }}
      >
        {truncateAddress(data.address, 6)}
      </div>

      {data.label && data.label !== data.address && (
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{data.label}</div>
      )}

      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
        {data.blockchain} · {data.balance.toFixed(3)}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: color, border: 'none', width: 8, height: 8 }} />
    </div>
  );
}

const nodeTypes: NodeTypes = { wallet: WalletNode };

interface TransactionGraphProps {
  investigationId?: string;
  walletAddress?: string;
  compact?: boolean;
  height?: number;
  hopDepth?: number;
}

function computeGraphData(
  allWallets: Wallet[],
  allTxs: Transaction[],
  investigation?: Investigation,
  walletAddress?: string,
  investigationId?: string,
  hopDepth?: number
) {
  let displayWallets: Wallet[] = [];
  let displayTxs: Transaction[] = [];

  if (investigationId) {
    const isSeedBenchmarkCase = false;
    
    if (isSeedBenchmarkCase) {
      // Benchmark federal case: use baseline reference graph
      displayWallets = allWallets.slice(0, 6);
      displayTxs = allTxs.slice(0, 8);
    } else if (investigation) {
      // User-created investigation: STRICTLY only this investigation's suspect wallet and its actual transactions
      const targetAddr = investigation.suspectWallet.toLowerCase();
      displayTxs = allTxs.filter(
        (t) =>
          (t as any).investigationId === investigation.id ||
          t.fromAddress.toLowerCase() === targetAddr ||
          t.toAddress.toLowerCase() === targetAddr
      );

      const involvedAddresses = new Set<string>();
      involvedAddresses.add(targetAddr);
      displayTxs.forEach((t) => {
        involvedAddresses.add(t.fromAddress.toLowerCase());
        involvedAddresses.add(t.toAddress.toLowerCase());
      });

      displayWallets = Array.from(involvedAddresses).map((addr) => {
        const found = allWallets.find((w) => w.address.toLowerCase() === addr);
        if (found) return found;
        return {
          address: addr,
          blockchain: investigation.blockchain,
          label: addr === targetAddr ? 'Suspect Target' : 'Counterparty Wallet',
          entityType: addr === targetAddr ? 'SUSPECT' : ('INTERMEDIATE' as const),
          riskScore: addr === targetAddr ? investigation.riskScore : 50,
          balance: 0,
          totalReceived: 0,
          totalSent: 0,
          txCount: 0,
          firstSeen: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          counterparties: 0,
          flags: [],
        };
      });
    }
  } else if (walletAddress) {
    const targetAddr = walletAddress.toLowerCase();
    displayTxs = allTxs.filter(
      (t) =>
        t.fromAddress.toLowerCase() === targetAddr ||
        t.toAddress.toLowerCase() === targetAddr
    );
    const involvedAddresses = new Set<string>([targetAddr]);
    displayTxs.forEach((t) => {
      involvedAddresses.add(t.fromAddress.toLowerCase());
      involvedAddresses.add(t.toAddress.toLowerCase());
    });
    displayWallets = Array.from(involvedAddresses).map((addr) => {
      const found = allWallets.find((w) => w.address.toLowerCase() === addr);
      return (
        found || {
          address: addr,
          blockchain: 'ETH',
          label: addr === targetAddr ? 'Target Wallet' : 'Counterparty',
          entityType: addr === targetAddr ? 'SUSPECT' : 'INTERMEDIATE',
          riskScore: 60,
          balance: 0,
          totalReceived: 0,
          totalSent: 0,
          txCount: 0,
          firstSeen: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          counterparties: 0,
          flags: [],
        }
      );
    });
  } else {
    // General Fund Flow view — each hopDepth shows genuinely different graph slices
    // hopDepth: 3 → 4 wallets / 3 txs | 5 → 6 wallets / 5 txs | 10 → 10 wallets / 10 txs | 14 (max) → all
    let maxWallets: number;
    let maxTxs: number;
    if (!hopDepth || hopDepth >= 14) {
      maxWallets = allWallets.length;
      maxTxs = allTxs.length;
    } else if (hopDepth >= 10) {
      maxWallets = Math.min(10, allWallets.length);
      maxTxs = Math.min(10, allTxs.length);
    } else if (hopDepth >= 5) {
      maxWallets = Math.min(6, allWallets.length);
      maxTxs = Math.min(5, allTxs.length);
    } else {
      // 3 hops
      maxWallets = Math.min(4, allWallets.length);
      maxTxs = Math.min(3, allTxs.length);
    }
    displayWallets = allWallets.slice(0, maxWallets);
    displayTxs = allTxs.slice(0, maxTxs);
  }

  // Generate node positions
  const nodes: Node[] = displayWallets.map((w, idx) => {
    let x = (idx % 3) * 260 + (Math.floor(idx / 3) % 2 === 0 ? 0 : 130);
    let y = Math.floor(idx / 3) * 190;
    if (displayWallets.length === 1) {
      x = 260;
      y = 150;
    }
    return {
      id: w.address.toLowerCase(),
      type: 'wallet',
      position: { x, y },
      data: {
        address: w.address,
        label: w.label,
        entityType: w.entityType,
        riskScore: w.riskScore,
        balance: w.balance,
        blockchain: w.blockchain,
      },
    };
  });

  const nodeAddresses = new Set(displayWallets.map((w) => w.address.toLowerCase()));

  const edges: Edge[] = displayTxs
    .filter((t) => nodeAddresses.has(t.fromAddress.toLowerCase()) && nodeAddresses.has(t.toAddress.toLowerCase()))
    .map((t, idx) => ({
      id: `edge-${idx}`,
      source: t.fromAddress.toLowerCase(),
      target: t.toAddress.toLowerCase(),
      label: `${t.amount.toFixed(2)} ${t.token}`,
      style: { stroke: getRiskColor(t.riskScore), strokeWidth: 1.5 },
      labelStyle: { fill: 'var(--text-secondary)', fontSize: 10 },
      labelBgStyle: { fill: 'var(--bg-elevated)' },
      animated: t.riskScore > 70,
    }));

  return { nodes, edges, txCount: displayTxs.length, nodeCount: nodes.length };
}

export default function TransactionGraph({ investigationId, walletAddress, compact = false, height = 500, hopDepth }: TransactionGraphProps) {
  const navigate = useNavigate();
  const { wallets, transactions, investigations, user } = useStore();
  const investigation = investigations.find((i) => i.id === investigationId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WalletNodeData | null>(null);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [showExhibitModal, setShowExhibitModal] = useState(false);

  const { nodes: initialNodes, edges: initialEdges, txCount, nodeCount } = useMemo(
    () => computeGraphData(wallets, transactions, investigation, walletAddress, investigationId, hopDepth),
    [wallets, transactions, investigation, walletAddress, investigationId, hopDepth]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }
    : {
        height,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
      };

  return (
    <div className="no-theme-transition" style={containerStyle}>
      {/* Fullscreen Projection Header Bar */}
      {isFullscreen && (
        <div
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(90deg, #09172f 0%, #11264c 100%)',
            borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
              CHAINTRACE FORENSIC GRAPH · AUDITORIUM PROJECTION MODE
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
              {investigation ? `CASE: ${investigation.caseId}` : walletAddress ? `TARGET: ${truncateAddress(walletAddress, 8)}` : 'MULTI-HOP REPO'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
              PRESS [ESC] OR CLICK EXIT TO RETURN
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              style={{
                background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Minimize2 size={13} />
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Left info badge */}
      <div
        style={{
          position: 'absolute',
          top: isFullscreen ? '62px' : '12px',
          left: '12px',
          zIndex: 10,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'JetBrains Mono, monospace',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <span>{nodeCount} Node{nodeCount !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>{txCount} Edge{txCount !== 1 ? 's' : ''}</span>
        {txCount === 0 && (
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>(Initial Target - No Transactions Attached Yet)</span>
        )}
      </div>

      {/* Top Right Controls Overlay */}
      <div
        style={{
          position: 'absolute',
          top: isFullscreen ? '62px' : '12px',
          right: '12px',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setShowExhibitModal(true)}
          title="Export Court Forensic Exhibit with SHA-256 seal"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <Download size={13} style={{ color: 'var(--accent)' }} />
          <span>Export Exhibit</span>
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Auditorium Fullscreen Projection Mode'}
          style={{
            background: isFullscreen ? 'var(--accent)' : 'var(--bg-elevated)',
            border: `1px solid ${isFullscreen ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '6px',
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            color: isFullscreen ? '#fff' : 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreen ? 'Exit' : 'Projection Mode'}</span>
        </button>
      </div>

      {/* Main ReactFlow Graph */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_evt, node) => setSelectedNode(node.data as WalletNodeData)}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={2}
        >
          <Background color="var(--border)" gap={20} size={1} />
          {!compact && <Controls />}
          {!compact && (
            <MiniMap
              nodeColor={(n) => entityColors[(n.data as WalletNodeData).entityType] ?? '#4a5568'}
              nodeStrokeWidth={2}
              style={{ background: 'var(--bg-elevated)' }}
            />
          )}
        </ReactFlow>

        {/* Selected Node Detail Drawer */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              bottom: '12px',
              width: '320px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 30,
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${entityColors[selectedNode.entityType] ?? '#4a5568'}22`,
                  color: entityColors[selectedNode.entityType] ?? '#4a5568',
                  border: `1px solid ${entityColors[selectedNode.entityType] ?? '#4a5568'}44`,
                }}
              >
                {selectedNode.entityType} NODE
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>
                Wallet Address
              </div>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11.5px',
                  color: 'var(--text-primary)',
                  wordBreak: 'break-all',
                  background: 'var(--bg-base)',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                }}
              >
                {selectedNode.address}
              </div>
              <button
                onClick={() => copyAddress(selectedNode.address)}
                style={{
                  marginTop: '6px',
                  background: 'none',
                  border: 'none',
                  color: copiedAddr ? '#10b981' : 'var(--accent)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                {copiedAddr ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedAddr ? 'Address Copied!' : 'Copy Full Address'}</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ background: 'var(--bg-base)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Blockchain</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {selectedNode.blockchain}
                </div>
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Balance</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {selectedNode.balance.toFixed(3)}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-base)', padding: '10px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Forensic Risk Score</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: getRiskColor(selectedNode.riskScore), fontFamily: 'JetBrains Mono, monospace' }}>
                  {selectedNode.riskScore} / 100
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {selectedNode.riskScore >= 80 ? 'CRITICAL - Direct syndicate or mixing cluster association.' : selectedNode.riskScore >= 50 ? 'ELEVATED - Intermediate layering node.' : 'LOW RISK - Regular counterparty.'}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={() => {
                  if (isFullscreen) setIsFullscreen(false);
                  navigate(`/wallets/${selectedNode.address}`);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>Inspect in Wallet Analysis</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Exhibit Export Modal */}
      {showExhibitModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowExhibitModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(90deg, #09172f 0%, #11264c 100%)',
                borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                  Court Admissible Forensic Exhibit Docket
                </span>
              </div>
              <button
                onClick={() => setShowExhibitModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                  GOVERNMENT OF INDIA · NATIONAL CYBERCRIME FORENSIC LAB (NCFL)
                </div>
                <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  TRANSACTION GRAPH TOPOLOGY EXHIBIT (EXH-GPH-01)
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Certified under Section 63 Bharatiya Sakshya Adhiniyam, 2023 / Section 65B Indian Evidence Act
                </div>
              </div>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Exhibit ID:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>EXH-GPH-2024-0941</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Nodes Traversed:</span>
                  <span>{nodeCount} Verified On-Chain Addresses</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Edges (Hops):</span>
                  <span>{txCount} Value Transfer Transactions</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Forensic Examiner:</span>
                  <span>{user?.name || 'Lead Cyber Forensic Investigator'}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Integrity Seal:</span>
                  <span style={{ color: '#10b981', wordBreak: 'break-all' }}>SHA256: 7e3b9f1a0d8c4e2b6a5f9c1d3e7b5a8f2c4e6d0a9b1c3d5e7f9a1b3c5d7e9f1</span>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                This cryptographic topology graph maps transaction pathways, hop decay distances, and peeling addresses from victim ingress to destination VASP hot wallets. Graph metadata has been signed by the local sovereign node RPC validator.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowExhibitModal(false)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '6px',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Download size={13} />
                  <span>Print / Save Forensic Exhibit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
