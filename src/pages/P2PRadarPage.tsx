import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Search,
  Building2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Lock,
  Landmark,
  FileCheck,
  CreditCard,
  UserX,
  Clock,
  Printer
} from 'lucide-react';
import { useStore } from '../store/useStore';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

interface P2POrder {
  orderId: string;
  exchange: 'Binance P2P' | 'Bybit P2P' | 'KuCoin P2P' | 'Bitget P2P';
  merchantAlias: string;
  merchantKycName: string;
  merchantKycId: string;
  orderVolumeUSDT: number;
  fiatINR: number;
  rateINR: number;
  escrowStatus: 'ESCROW_LOCKED' | 'RELEASED' | 'DISPUTED' | 'FROZEN_BY_LEA';
  releaseTimestamp: string;
  timeRemainingSec: number;
  linkedUpiVpa: string;
  linkedBankUtr: string;
  muleAccount: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch: string;
    holderName: string;
    atmCashoutLocation?: string;
  };
  buyerKyc: {
    name: string;
    mobile: string;
    ipAddress: string;
    panMasked: string;
  };
}

const DEMO_ESCROW_ORDER: P2POrder = {
  orderId: 'BINANCE-P2P-ORD-928410',
  exchange: 'Binance P2P',
  merchantAlias: 'SpeedyEscrow_IND (99.2% Completion)',
  merchantKycName: 'Rajesh Verma',
  merchantKycId: 'KYC-IN-9812409',
  orderVolumeUSDT: 9550,
  fiatINR: 850000,
  rateINR: 89.0,
  escrowStatus: 'ESCROW_LOCKED',
  releaseTimestamp: new Date(Date.now() + 23 * 60 * 1000).toISOString(),
  timeRemainingSec: 1380, // 23 mins
  linkedUpiVpa: 'mule.fastpay@oksbi',
  linkedBankUtr: 'RBI202409140892',
  muleAccount: {
    bankName: 'State Bank of India',
    accountNo: '30492810482',
    ifsc: 'SBIN0004128',
    branch: 'Connaught Place, New Delhi',
    holderName: 'Manoj Kumar Verma',
    atmCashoutLocation: 'Near Shivaji Stadium Metro, CP, New Delhi',
  },
  buyerKyc: {
    name: 'Amitabh Sen',
    mobile: '+91 98112-94821',
    ipAddress: '103.21.244.12 (South Delhi)',
    panMasked: 'ABCDE1234F',
  },
};

const DEMO_ESCROW_ORDER_2: P2POrder = {
  orderId: 'BYBIT-P2P-ORD-719302',
  exchange: 'Bybit P2P',
  merchantAlias: 'CryptoExpress_MH (98.7% Completion)',
  merchantKycName: 'Sunil R. Deshmukh',
  merchantKycId: 'KYC-IN-7491024',
  orderVolumeUSDT: 14000,
  fiatINR: 1250000,
  rateINR: 89.28,
  escrowStatus: 'ESCROW_LOCKED',
  releaseTimestamp: new Date(Date.now() + 41 * 60 * 1000).toISOString(),
  timeRemainingSec: 2460, // 41 mins
  linkedUpiVpa: 'cryptoofframp@ybl',
  linkedBankUtr: 'YESB202409180491',
  muleAccount: {
    bankName: 'Axis Bank Ltd',
    accountNo: '918020048192019',
    ifsc: 'UTIB0000264',
    branch: 'Bandra Kurla Complex, Mumbai',
    holderName: 'Sanjay Tukaram Jadhav',
    atmCashoutLocation: 'Kurla West ATM Cluster, Mumbai',
  },
  buyerKyc: {
    name: 'Rohan Malhotra',
    mobile: '+91 98201-74910',
    ipAddress: '49.36.112.44 (BKC, Mumbai)',
    panMasked: 'XYZPA5678G',
  },
};

const DEMO_ESCROW_ORDER_3: P2POrder = {
  orderId: 'KUCOIN-P2P-ORD-401928',
  exchange: 'KuCoin P2P',
  merchantAlias: 'FastSettlement_BLR (99.6% Completion)',
  merchantKycName: 'Kavitha N. Swamy',
  merchantKycId: 'KYC-IN-3104921',
  orderVolumeUSDT: 5000,
  fiatINR: 450000,
  rateINR: 90.0,
  escrowStatus: 'ESCROW_LOCKED',
  releaseTimestamp: new Date(Date.now() + 11 * 60 * 1000).toISOString(),
  timeRemainingSec: 660, // 11 mins
  linkedUpiVpa: 'settlement.instant@icici',
  linkedBankUtr: 'ICIC202409190182',
  muleAccount: {
    bankName: 'HDFC Bank',
    accountNo: '50100482910294',
    ifsc: 'HDFC0000140',
    branch: 'Indiranagar 100ft Road, Bengaluru',
    holderName: 'Venkatesh Murthy',
    atmCashoutLocation: 'Near CMH Hospital, Indiranagar, Bengaluru',
  },
  buyerKyc: {
    name: 'Prakash Rao',
    mobile: '+91 99012-38491',
    ipAddress: '157.48.21.90 (Bengaluru)',
    panMasked: 'BLRPR9012K',
  },
};

const mockP2POrders: P2POrder[] = [DEMO_ESCROW_ORDER, DEMO_ESCROW_ORDER_2, DEMO_ESCROW_ORDER_3];

export default function P2PRadarPage() {
  const { user } = useStore();
  const [orders, setOrders] = useState<P2POrder[]>(mockP2POrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<P2POrder | null>(mockP2POrders[0] || null);
  const [freezeSimulated, setFreezeSimulated] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'MULE_CASCADE' | 'FREEZE_NOTICE' | 'TELEGRAM_OTC'>('DETAILS');

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.escrowStatus === 'ESCROW_LOCKED' && o.timeRemainingSec > 0) {
            return { ...o, timeRemainingSec: o.timeRemainingSec - 1 };
          }
          return o;
        })
      );
      setSelectedOrder((prev) => {
        if (prev && prev.escrowStatus === 'ESCROW_LOCKED' && prev.timeRemainingSec > 0) {
          return { ...prev, timeRemainingSec: prev.timeRemainingSec - 1 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLoadDemoEscrow = () => {
    setOrders([DEMO_ESCROW_ORDER]);
    setSelectedOrder(DEMO_ESCROW_ORDER);
  };

  const handleClearOrders = () => {
    setOrders([]);
    setSelectedOrder(null);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSimulateFreeze = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.orderId === orderId
          ? { ...ord, escrowStatus: 'FROZEN_BY_LEA', timeRemainingSec: 0 }
          : ord
      )
    );
    setSelectedOrder((prev) => (prev ? { ...prev, escrowStatus: 'FROZEN_BY_LEA', timeRemainingSec: 0 } : null));
    setFreezeSimulated(true);
    setTimeout(() => setFreezeSimulated(false), 4000);
  };

  const totalEscrowINR = orders
    .filter((o) => o.escrowStatus === 'ESCROW_LOCKED')
    .reduce((sum, o) => sum + o.fiatINR, 0);
  const activeInterceptions = orders.filter((o) => o.escrowStatus === 'ESCROW_LOCKED').length;

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderId.toLowerCase().includes(q) ||
      o.merchantAlias.toLowerCase().includes(q) ||
      o.linkedUpiVpa.toLowerCase().includes(q) ||
      o.linkedBankUtr.toLowerCase().includes(q) ||
      o.muleAccount.accountNo.includes(q) ||
      o.muleAccount.bankName.toLowerCase().includes(q)
    );
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* Header Banner */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'linear-gradient(135deg, rgba(30,58,138,0.06) 0%, rgba(56,189,248,0.04) 50%, var(--bg-surface) 100%)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: 'var(--risk-critical)',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: 'var(--risk-critical)' }} />
              P2P & ESCROW RISK RADAR
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              REVERSE UTR & UPI VPA CORRELATION ENGINE
            </span>
          </div>
          <h1 style={{ margin: '8px 0 4px', fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            P2P Off-Ramp &amp; UPI Mule Escrow Radar
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '760px', lineHeight: 1.45 }}>
            Identifies crypto-to-INR conversion on P2P exchange order books (Binance, Bybit, KuCoin). Intercepts active fiat escrow releases, maps linked Indian UPI VPAs &amp; Mule Bank Accounts, and enforces statutory <strong style={{ color: 'var(--text-primary)' }}>Section 102 CrPC / Section 106 BNSS</strong> emergency debit freeze notices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          {orders.length === 0 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLoadDemoEscrow}
              style={{
                background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={14} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
              <span>Scan Live Escrow Orders</span>
            </motion.button>
          ) : (
            <button
              onClick={handleClearOrders}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset to Blank Slate
            </button>
          )}

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Active Escrow Monitored
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--risk-critical)', fontFamily: 'JetBrains Mono, monospace' }}>
              ₹{totalEscrowINR.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--risk-low)', fontWeight: 600 }}>
              {activeInterceptions} Interceptions in Golden Window
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        variants={itemVariants}
        className="cyber-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: '0 1 460px', minWidth: '240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search by UTR, UPI VPA (@oksbi), P2P Order ID, Mule A/c..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              outline: 'none',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Clear Search
          </button>
        )}
      </motion.div>

      {/* Main 2-Column Layout */}
      <div className="p2p-main-grid">
        {/* Left Column: P2P Orders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)' }}>
              Flagged P2P Escrow Dispatches ({filteredOrders.length})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
              Live WebSocket Feed
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '44px 20px',
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
              }}
            >
              <Zap size={32} style={{ color: 'var(--accent)', margin: '0 auto 12px', opacity: 0.6 }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                No Flagged P2P Escrow Dispatches Active
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '360px', marginInline: 'auto', lineHeight: 1.5 }}>
                No active P2P fiat orders intercepted. Enter a 12-digit Indian Bank UTR or UPI VPA above to scan for flagged escrow dispatches.
              </p>
              <button
                onClick={handleLoadDemoEscrow}
                style={{
                  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}
              >
                <Zap size={13} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                <span>Scan Live Escrow Orders</span>
              </button>
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const isSelected = selectedOrder?.orderId === ord.orderId;
            const isLocked = ord.escrowStatus === 'ESCROW_LOCKED';
            const isFrozen = ord.escrowStatus === 'FROZEN_BY_LEA';

            return (
              <motion.div
                key={ord.orderId}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                onClick={() => setSelectedOrder(ord)}
                className="cyber-card-interactive"
                style={{
                  background: isSelected ? 'rgba(66,153,225,0.08)' : 'var(--bg-surface)',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  position: 'relative',
                  boxShadow: isSelected ? '0 0 16px rgba(66,153,225,0.2)' : undefined,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'rgba(66,153,225,0.12)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {ord.exchange}
                    </span>
                    <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ord.orderId}
                    </span>
                  </div>
                  <div>
                    {isLocked && (
                      <span
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.35)',
                          color: 'var(--risk-critical)',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}
                      >
                        <span className="radar-ping-ring" style={{ width: '6px', height: '6px', background: 'var(--risk-critical)' }} />
                        <Lock size={11} />
                        ESCROW LOCKED ({Math.floor(ord.timeRemainingSec / 60)}m {String(ord.timeRemainingSec % 60).padStart(2, '0')}s)
                      </span>
                    )}
                    {isFrozen && (
                      <span
                        style={{
                          background: 'rgba(16,185,129,0.1)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          color: 'var(--risk-low)',
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShieldCheck size={10} />
                        LEA FREEZE ACTIVE
                      </span>
                    )}
                    {ord.escrowStatus === 'RELEASED' && (
                      <span
                        style={{
                          background: 'rgba(113,128,150,0.1)',
                          color: 'var(--text-secondary)',
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        FIAT RELEASED
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Crypto Escrow</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                      {ord.orderVolumeUSDT.toLocaleString()} USDT
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Fiat INR Transferred</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', color: 'var(--risk-critical)' }}>
                      ₹{ord.fiatINR.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    UPI: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{ord.linkedUpiVpa}</span>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    UTR: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{ord.linkedBankUtr}</span>
                  </div>
                </div>
              </motion.div>
            );
          }))}
        </div>

        {/* Right Column: Order Detail & Deep Forensics */}
        {selectedOrder ? (
          <div
            style={{
              background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Sub-tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            {[
              { id: 'DETAILS', label: 'Order & Reverse Lookup' },
              { id: 'MULE_CASCADE', label: 'Mule Bank Cascade' },
              { id: 'FREEZE_NOTICE', label: 'Section 102 NPCI Notice' },
              { id: 'TELEGRAM_OTC', label: 'Telegram OTC Syndicate Link' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: activeTab === t.id ? 700 : 500,
                  cursor: 'pointer',
                  border: activeTab === t.id ? '1px solid var(--accent)' : '1px solid transparent',
                  background: activeTab === t.id ? 'rgba(66,153,225,0.12)' : 'transparent',
                  color: activeTab === t.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === 'DETAILS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Selected Investigation Record</div>
                  <h3 style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace' }}>
                    {selectedOrder.orderId}
                  </h3>
                </div>
                <div>
                  {selectedOrder.escrowStatus === 'ESCROW_LOCKED' && (
                    <button
                      onClick={() => handleSimulateFreeze(selectedOrder.orderId)}
                      style={{
                        background: 'var(--risk-critical)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(185,28,28,0.25)',
                      }}
                    >
                      <Lock size={14} />
                      HALT ESCROW RELEASE VIA VASP LEGAL API
                    </button>
                  )}
                  {selectedOrder.escrowStatus === 'FROZEN_BY_LEA' && (
                    <div style={{ color: '#38a169', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={16} />
                      ESCROW FLAGGED BY FORENSIC RISK ENGINE
                    </div>
                  )}
                </div>
              </div>

              {freezeSimulated && (
                <div style={{ padding: '10px 14px', background: 'rgba(56,161,105,0.15)', border: '1px solid #38a169', borderRadius: '6px', fontSize: '12.5px', color: '#38a169', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} />
                  <span>
                    Emergency Freeze Protocol Triggered: Binance P2P Escrow Order #{selectedOrder.orderId} locked. Crypto funds cannot be disbursed to counterparty wallet. Section 91 CrPC notice dispatched to legal@binance.com.
                  </span>
                </div>
              )}

              {/* KYC & Entity Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={14} />
                    P2P Merchant Profile (Seller of USDT)
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedOrder.merchantAlias}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    KYC Name: <strong style={{ color: 'var(--text-primary)' }}>{selectedOrder.merchantKycName}</strong>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    KYC ID: {selectedOrder.merchantKycId}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#d69e2e', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={14} />
                    INR Payer / Buyer Profile
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedOrder.buyerKyc.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Phone: <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{selectedOrder.buyerKyc.mobile}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    IP: {selectedOrder.buyerKyc.ipAddress} | PAN: {selectedOrder.buyerKyc.panMasked}
                  </div>
                </div>
              </div>

              {/* Banking & UPI Correlation */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={15} style={{ color: 'var(--accent)' }} />
                  Linked Indian Banking Node (§102 CrPC Target)
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Bank & Branch</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedOrder.muleAccount.bankName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selectedOrder.muleAccount.branch}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Account Number & IFSC</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
                      {selectedOrder.muleAccount.accountNo}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)' }}>
                      {selectedOrder.muleAccount.ifsc}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Account Holder Name</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedOrder.muleAccount.holderName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--risk-critical)', fontWeight: 600 }}>{selectedOrder.muleAccount.atmCashoutLocation}</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.linkedBankUtr, 'UTR')}
                    style={{
                      padding: '5px 10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Copy size={11} />
                    Copy Bank UTR: {selectedOrder.linkedBankUtr}
                  </button>
                  <button
                    onClick={() => copyToClipboard(selectedOrder.linkedUpiVpa, 'VPA')}
                    style={{
                      padding: '5px 10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'JetBrains Mono, monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Copy size={11} />
                    Copy UPI VPA: {selectedOrder.linkedUpiVpa}
                  </button>
                  {copiedText && (
                    <span style={{ fontSize: '11px', color: '#38a169', display: 'flex', alignItems: 'center' }}>
                      Copied {copiedText}!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MULE CASCADE */}
          {activeTab === 'MULE_CASCADE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'rgba(214,158,46,0.08)', border: '1px solid rgba(214,158,46,0.3)', borderRadius: '6px', fontSize: '12px', color: '#d69e2e' }}>
                <strong>Automated Fiat Layering Flow:</strong> Tracing the path of ₹43.21 Lakhs immediately after P2P release. High-risk disbursement detected across Tier-1 and Tier-2 mule accounts.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--risk-critical)', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>TIER 0: CRYPTO ESCROW</span>
                      <strong style={{ fontSize: '13px' }}>Binance P2P Escrow Account</strong>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                      48,500 USDT (₹43,21,350)
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    USDT released upon confirmation of UPI payment from Pooja Enterprises.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '2px', height: '16px', background: 'var(--border)' }} />
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--risk-critical)', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>TIER 1 MULE</span>
                      <strong style={{ fontSize: '13px' }}>SBI Surat Ring Road (A/c #30492810482)</strong>
                    </div>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: 'var(--risk-critical)' }}>
                      ₹43,21,350 received via UPI
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Holder: Vikas Ramesh Sharma (Burner SIM registered in Mewat, Haryana). Layered into 3 outbound IMPS transactions within 4 minutes.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ width: '2px', height: '16px', background: 'var(--border)' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--risk-high)', textTransform: 'uppercase' }}>Tier 2 Mule A (Canara Bank)</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>A/c #1029481920 (Surat)</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                      ₹25,00,000
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--risk-critical)', marginTop: '4px' }}>
                      Pending ATM Cashout in Surat Textile Market
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#d69e2e', textTransform: 'uppercase' }}>Tier 2 Mule B (Kotak Mahindra)</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>A/c #4928104820 (Jaipur)</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
                      ₹18,21,350
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#38a169', marginTop: '4px' }}>
                      Debit Freeze Enforced under §102 CrPC
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECTION 102 FREEZE NOTICE */}
          {activeTab === 'FREEZE_NOTICE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  STATUTORY EMERGENCY DEBIT FREEZE NOTICE (§102 CrPC / §106 BNSS)
                </span>
                <button
                  onClick={() => window.print()}
                  style={{
                    padding: '6px 12px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Printer size={13} />
                  Print / Save Notice
                </button>
              </div>

              <div
                style={{
                  background: '#090d16',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '24px 28px',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  fontSize: '12px',
                  lineHeight: '1.65',
                  color: '#e2e8f0',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                {/* ChainTrace Official Audit Letterhead */}
                <div style={{ textAlign: 'center', borderBottom: '2px solid rgba(255,255,255,0.15)', paddingBottom: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.04em' }}>
                    भारत सरकार · CHAINTRACE PLATFORM
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>
                    गृह मंत्रालय / BLOCKCHAIN FORENSICS & INTELLIGENCE
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--accent)', fontWeight: 600, marginTop: '2px' }}>
                    INDIAN CYBERCRIME COORDINATION CENTRE (I4C) · NATIONAL ESCROW INTERCEPT WING
                  </div>
                  <div style={{ marginTop: '10px', display: 'inline-block', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', padding: '4px 12px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#f87171', letterSpacing: '0.06em' }}>
                      STATUTORY SEIZURE & DEBIT FREEZE MANDATE · SECTION 106 BNSS (2023)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '10px', color: '#94a3b8', fontFamily: 'JetBrains Mono, monospace' }}>
                    <span>REF: CT/P2P-AUDIT/2024/DEL-0941</span>
                    <span>DATE: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                    <span>PRIORITY: URGENT / EXIGENT</span>
                  </div>
                </div>

                {/* Notice Body */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <strong style={{ color: '#60a5fa' }}>TO THE STATUTORY RECIPIENTS:</strong><br />
                    1. <strong>The Nodal Officer</strong>, National Payments Corporation of India (NPCI) UPI Switch Division.<br />
                    2. <strong>The Branch Manager & Compliance Nodal Head</strong>, {selectedOrder.muleAccount.bankName} ({selectedOrder.muleAccount.branch}).<br />
                    3. <strong>Global Law Enforcement Compliance Desk</strong>, {selectedOrder.exchange} Escrow Custody Unit.
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid #ef4444' }}>
                    <strong style={{ color: '#f87171' }}>SUBJECT:</strong> IMMEDIATE STATUTORY DEBIT FREEZE (TOTAL HOLD) OF MULE ACCOUNT, LINKED UPI VPA & INTERCEPTION OF CRYPTO P2P ESCROW DISPATCH #{selectedOrder.orderId}
                  </div>

                  <div>
                    <strong>1. STATUTORY COGNIZANCE & PREDICATE CRIME:</strong><br />
                    Whereas an investigation is actively underway regarding proceeds of organized transnational cyber fraud reported on the National Cybercrime Reporting Portal (Ack #2024-CT-CASE-884912), involving offences punishable under <strong>Sections 318, 319, 336 Bharatiya Nyaya Sanhita, 2023 (BNS)</strong> and <strong>Section 66D Information Technology Act, 2000</strong>.
                  </div>

                  <div>
                    <strong>2. FORENSIC IDENTIFICATION OF PROCEEDS:</strong><br />
                    Real-time transaction tracing has established that <strong>₹{selectedOrder.fiatINR.toLocaleString('en-IN')}</strong> ({selectedOrder.orderVolumeUSDT.toLocaleString()} USDT) represents direct crime proceeds channeled via P2P Escrow Order <code>#{selectedOrder.orderId}</code> on {selectedOrder.exchange} into the designated mule repository:
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '10px 14px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Account Holder:</span>
                      <strong style={{ color: '#f8fafc' }}>{selectedOrder.muleAccount.holderName}</strong>
                      <span style={{ color: '#94a3b8' }}>Account Number:</span>
                      <strong style={{ color: '#ef4444' }}>{selectedOrder.muleAccount.accountNo}</strong>
                      <span style={{ color: '#94a3b8' }}>Bank & IFSC:</span>
                      <span>{selectedOrder.muleAccount.bankName} ({selectedOrder.muleAccount.ifsc})</span>
                      <span style={{ color: '#94a3b8' }}>Linked UPI VPA:</span>
                      <strong style={{ color: '#38bdf8' }}>{selectedOrder.linkedUpiVpa}</strong>
                      <span style={{ color: '#94a3b8' }}>Bank UTR Trail:</span>
                      <strong style={{ color: '#f59e0b' }}>{selectedOrder.linkedBankUtr}</strong>
                    </div>
                  </div>

                  <div>
                    <strong>3. BINDING EXECUTIVE DIRECTIONS:</strong><br />
                    In exercise of statutory powers conferred under <strong>Section 106 of the Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)</strong> (corresponding to Section 102 CrPC, 1973), you are hereby commanded:
                    <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
                      <li><strong>Enforce Immediate Total Debit Freeze:</strong> Place a 100% debit stop on Account No. {selectedOrder.muleAccount.accountNo} across all net-banking, mobile banking, and ATM cashout channels.</li>
                      <li><strong>Block UPI VPA Routing:</strong> Instantly de-register and block payment routing to UPI VPA <code>{selectedOrder.linkedUpiVpa}</code> on the NPCI national switch.</li>
                      <li><strong>Custodial Requisition (§94 BNSS):</strong> Transmit certified Account Opening Form, e-KYC documents, IP login audits, and ATM CCTV footage within 24 hours.</li>
                    </ul>
                  </div>

                  <div style={{ color: '#f87171', fontSize: '11px', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '4px' }}>
                    <strong>STATUTORY WARNING:</strong> Non-compliance or unauthorized dissipation of funds following receipt of this statutory notice shall attract penal liability under Section 223 BNS (Disobedience to Public Servant Mandate) and Section 201 BNS (Causing Disappearance of Evidence).
                  </div>

                  {/* Officer Signature & Digital Authentication Seal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Investigating Officer Seal</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>{user?.name || 'Supervisory Cyber Forensic IO'}</div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Superintendent / Inspector of Police, Cyber Crime Wing</div>
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '9.5px', color: '#10b981' }}>
                      <div>[SHA-256 CERTIFIED ELECTRONIC RECORD]</div>
                      <div style={{ color: '#94a3b8' }}>HASH: 8f4e2b1c9d0a7f5e3a2b1c0d9e8f7a6b5c4d3e2f1</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TELEGRAM OTC */}
          {activeTab === 'TELEGRAM_OTC' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', color: 'var(--risk-critical)' }}>
                <strong style={{ color: 'var(--risk-critical)' }}>Underground Telegram OTC Intelligence:</strong> Intercepted advertisements matching merchant alias <strong style={{ color: 'var(--text-primary)' }}>&quot;{selectedOrder.merchantAlias}&quot;</strong> on dark web escrow channels.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Channel: <strong>@USDT_INR_CASH_DELHI_NCR</strong> (14,200 members)</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>2 hours ago</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid var(--risk-critical)' }}>
                    &quot;Need 50k USDT bulk sell. Instant INR RTGS/UPI payout from fresh corporate current accounts. No 1930 lien warranty. Contact @SuperFast_Crypto_NCR&quot;
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>Channel: <strong>@MULE_CURRENT_ACCOUNTS_INDIA</strong> (8,900 members)</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>Yesterday</span>
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: '4px', borderLeft: '3px solid #d69e2e' }}>
                    &quot;Fresh SBI and HDFC corporate current accounts available for rent. High transaction limit 50L/day. Net banking kit + ATM card provided. Delhi/Surat hand delivery.&quot;
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
              padding: '60px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '440px',
            }}
          >
            <Landmark size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px', opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              No P2P Escrow Order Selected
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', lineHeight: 1.5 }}>
              Select an order from the live dispatch feed or enter a transaction UTR or UPI VPA to inspect mule bank account cascades and generate Section 102/106 BNSS freeze notices.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
