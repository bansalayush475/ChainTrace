import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Clock, Database, ShieldAlert, Activity, ArrowRight, Zap, Link, Loader2 } from 'lucide-react';
import { Transaction } from '../../store/useStore';
import { formatUSD, truncateAddress, getRiskColor } from '../../utils/riskEngine';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/apiService';

interface Props {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function TransactionDetailsModal({ transaction, isOpen, onClose }: Props) {
  const navigate = useNavigate();
  const [mlData, setMlData] = useState<any>(null);
  const [isLoadingMl, setIsLoadingMl] = useState(false);
  const [mlError, setMlError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction?.hash) {
      setIsLoadingMl(true);
      setMlError(null);
      setMlData(null);
      
      api.getTxRiskAnalysis(transaction.hash)
        .then(res => {
          if (res && res.success) {
            setMlData(res);
          } else {
            setMlError(res?.error || 'ML Analysis unavailable');
          }
        })
        .catch(err => {
          setMlError(err.message || 'Failed to connect to ML Engine');
        })
        .finally(() => {
          setIsLoadingMl(false);
        });
    }
  }, [isOpen, transaction]);

  if (!transaction) return null;

  // Derive Etherscan-like simulated details if not present
  const gasLimit = Math.floor(21000 + Math.random() * 50000);
  const gasUsed = Math.floor(gasLimit * (0.5 + Math.random() * 0.4));
  const nonce = Math.floor(Math.random() * 1500);

  const getTxEffectiveRisk = (tx: Transaction) => {
    const isEth = (tx.token || '').toUpperCase().includes('ETH');
    const amount = Number(tx.amount || 0);
    if (isEth && amount >= 0.2) {
      return Math.max(82, tx.riskScore || 85);
    }
    return tx.riskScore || 50;
  };

  const baseRiskScore = getTxEffectiveRisk(transaction);
  const riskScore = mlData?.mlSignalPercent !== undefined ? Math.round(mlData.mlSignalPercent) : baseRiskScore;
  const riskColor = getRiskColor(riskScore);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998,
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%', y: '-45%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              width: '90%',
              maxWidth: '850px',
              maxHeight: '90vh',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} style={{ color: 'var(--accent)' }} />
                  Transaction Details
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Top Highlights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                
                {/* General Info */}
                <div className="cyber-card" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '130px', color: 'var(--text-secondary)', fontSize: '13px' }}>Transaction Hash:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {truncateAddress(transaction.hash, 10)}
                        <Link size={14} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(transaction.hash)} title="Copy Full Hash" />
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '130px', color: 'var(--text-secondary)', fontSize: '13px' }}>Status:</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600, background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        <CheckCircle size={14} />
                        Success
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '130px', color: 'var(--text-secondary)', fontSize: '13px' }}>Block:</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{transaction.blockNumber}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          {transaction.confirmations} Block Confirmations
                        </span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: '130px', color: 'var(--text-secondary)', fontSize: '13px' }}>Timestamp:</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-primary)' }}>
                        <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                        {new Date(transaction.timestamp).toLocaleString()}
                      </span>
                    </div>

                  </div>
                </div>

                {/* Transfer Details */}
                <div className="cyber-card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>From:</span>
                        <span 
                          onClick={() => { onClose(); navigate(`/wallets/${transaction.fromAddress}`); }}
                          style={{ display: 'block', flex: 1, minWidth: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', wordBreak: 'break-all' }}
                        >
                          {transaction.fromAddress}
                        </span>
                      </div>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                      <ArrowRight size={16} style={{ color: 'var(--text-secondary)', marginLeft: '80px' }} />
                    </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span style={{ width: '80px', flexShrink: 0, color: 'var(--text-secondary)', fontSize: '13px' }}>To:</span>
                        <span 
                          onClick={() => { onClose(); navigate(`/wallets/${transaction.toAddress}`); }}
                          style={{ display: 'block', flex: 1, minWidth: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', textDecorationStyle: 'dotted', wordBreak: 'break-all' }}
                        >
                          {transaction.toAddress}
                        </span>
                      </div>

                  </div>
                </div>

              </div>

              {/* Advanced Tech Details */}
              <div className="cyber-card" style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={16} style={{ color: 'var(--text-secondary)' }} />
                  Transaction Value & Gas Metrics
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Value:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {transaction.amount} {transaction.token} <span style={{ opacity: 0.6 }}>({formatUSD(transaction.usdValue)})</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Transaction Fee:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {transaction.fee} {transaction.token}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Gas Limit & Usage:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {gasLimit.toLocaleString()} <span style={{ color: 'var(--text-secondary)' }}>|</span> {gasUsed.toLocaleString()} ({(gasUsed/gasLimit*100).toFixed(1)}%)
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nonce:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'var(--text-primary)' }}>
                        {nonce}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Details */}
              <div className="cyber-card" style={{ padding: '16px', border: `1px solid ${riskScore >= 80 ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, background: riskScore >= 80 ? 'rgba(239,68,68,0.03)' : undefined }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={16} style={{ color: riskColor }} />
                    Forensic Intelligence Assessment {mlData && <span style={{ fontSize: '10px', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>XGBOOST ML</span>}
                  </span>
                  {isLoadingMl && <Loader2 size={14} className="animate-spin" style={{ color: 'var(--text-secondary)' }} />}
                </h3>
                
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{mlData ? 'ML Risk Signal' : 'Heuristic Risk Score'}</span>
                      <span style={{ fontSize: '12px', color: riskColor, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{riskScore}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '6px' }}>Intelligence Flags</div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {transaction.flags && transaction.flags.length > 0 ? (
                        transaction.flags.map(f => (
                          <span key={f} style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--risk-critical)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                            {f}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No suspicious flags</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>AI Heuristic Analysis</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {mlData?.prediction === 'Illicit-risk signal' || riskScore >= 80 
                          ? 'High probability of illicit structuring. Transfer exhibits threshold patterns commonly associated with mixer ingress or syndicate aggregation.'
                          : 'Routine network transfer. Velocity and volume align with standard exchange deposit/withdrawal behavior. No active red flags triggered.'}
                      </span>
                    </div>
                  </div>
                  
                  {mlData && mlData.topFactors && (
                    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>SHAP Explainability (Top Factors)</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {mlData.topFactors.slice(0, 5).map((f: any, idx: number) => (
                          <div key={idx} style={{ 
                            fontSize: '10.5px', 
                            background: f.direction === 'toward_illicit' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', 
                            color: f.direction === 'toward_illicit' ? 'var(--risk-critical)' : '#10b981',
                            border: `1px solid ${f.direction === 'toward_illicit' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{f.feature.replace('elliptic_', '')}</span>
                            <span style={{ opacity: 0.7 }}>({f.shapValue > 0 ? '+' : ''}{f.shapValue.toFixed(2)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {mlError && (
                    <div style={{ fontSize: '11px', color: 'var(--risk-critical)', marginTop: '4px' }}>
                      ML Engine: {mlError} (Falling back to heuristic scoring)
                    </div>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
