import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Wallet, ArrowLeftRight, Folder, Network, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { walletClusters } from '../../data/mockData';
import { truncateAddress } from '../../utils/riskEngine';

interface SearchResult {
  category: 'Wallets' | 'Transactions' | 'Cases' | 'Clusters';
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  href: string;
}

export default function SearchDialog() {
  const { searchOpen, setSearchOpen, investigations, wallets, transactions } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<'ALL' | 'Wallets' | 'Transactions' | 'Cases' | 'Clusters'>('ALL');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<SearchResult[]>([]);
  const selectedRef = useRef(0);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelectedCat('ALL');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!searchOpen) return;
      if (e.key === 'Escape') { setSearchOpen(false); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, resultsRef.current.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
        return;
      }
      if (e.key === 'Enter') {
        const r = resultsRef.current[selectedRef.current];
        if (r) { setSearchOpen(false); navigate(r.href); }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen, navigate]);

  const rawResults: SearchResult[] = query.length < 2 ? [] : [
    ...wallets
      .filter((w) => w.address.toLowerCase().includes(query.toLowerCase()) || w.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 4)
      .map((w) => ({
        category: 'Wallets' as const,
        icon: <Wallet size={14} />,
        label: truncateAddress(w.address, 10),
        sublabel: `${w.blockchain} · ${w.entityType} · Risk ${w.riskScore}/100`,
        href: `/wallets/${w.address}`,
      })),
    ...transactions
      .filter((t) => t.hash.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((t) => ({
        category: 'Transactions' as const,
        icon: <ArrowLeftRight size={14} />,
        label: truncateAddress(t.hash, 10),
        sublabel: `${t.amount} ${t.token} · ${t.type}`,
        href: `/transactions`,
      })),
    ...investigations
      .filter((inv) => inv.title.toLowerCase().includes(query.toLowerCase()) || inv.caseId.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((inv) => ({
        category: 'Cases' as const,
        icon: <Folder size={14} />,
        label: inv.caseId,
        sublabel: inv.title,
        href: `/investigations/${inv.id}`,
      })),
    ...walletClusters
      .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map((c) => ({
        category: 'Clusters' as const,
        icon: <Network size={14} />,
        label: c.id,
        sublabel: c.label,
        href: `/clusters`,
      })),
  ];

  const results = selectedCat === 'ALL'
    ? rawResults
    : rawResults.filter((r) => r.category === selectedCat);

  resultsRef.current = results;
  selectedRef.current = selected;

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(8, 11, 14, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '12vh',
          }}
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '12px',
              width: '560px',
              maxWidth: '92vw',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 25px rgba(56,189,248,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-elevated)',
            }}>
              <Search size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search by wallet address, transaction hash, case title..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <button
                onClick={() => setSearchOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  padding: '3px 6px',
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                ESC
              </button>
            </div>

            {/* Category Filter Pills */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-surface)',
            }}>
              {(['ALL', 'Wallets', 'Transactions', 'Cases', 'Clusters'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCat(cat); setSelected(0); }}
                  style={{
                    padding: '3px 9px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedCat === cat ? 'rgba(56,189,248,0.15)' : 'transparent',
                    color: selectedCat === cat ? 'var(--accent)' : 'var(--text-secondary)',
                    border: selectedCat === cat ? '1px solid rgba(56,189,248,0.35)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat === 'ALL' ? 'All Results' : cat}
                </button>
              ))}
            </div>

            {/* Results Area */}
            <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
              {query.length < 2 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  <p style={{ margin: 0 }}>Type at least 2 characters to trigger forensic query...</p>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', opacity: 0.7, fontFamily: 'JetBrains Mono, monospace' }}>
                    Tip: paste any 0x, bc1, or T-address directly
                  </p>
                </div>
              ) : results.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  No indexed matches found for &quot;{query}&quot;
                </div>
              ) : (
                <div>
                  {results.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 18px',
                        cursor: 'pointer',
                        background: i === selected ? 'rgba(56,189,248,0.08)' : 'transparent',
                        borderLeft: i === selected ? '3px solid var(--accent)' : '3px solid transparent',
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => { setSearchOpen(false); navigate(r.href); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          background: 'rgba(56,189,248,0.1)',
                          border: '1px solid rgba(56,189,248,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)',
                        }}>
                          {r.icon}
                        </div>
                        <div>
                          <div style={{
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: r.category === 'Wallets' || r.category === 'Transactions' ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
                          }}>
                            {r.label}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
                            {r.sublabel}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          color: 'var(--text-secondary)',
                          fontSize: '10px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {r.category}
                        </span>
                        <ArrowRight size={13} style={{ color: i === selected ? 'var(--accent)' : 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Shortcuts */}
            <div style={{
              padding: '10px 18px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-elevated)',
              fontSize: '11px',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px' }}>↑↓</kbd>
                  Navigate
                </span>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px' }}>↵</kbd>
                  Open
                </span>
                <span style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <kbd style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 5px', fontSize: '10px' }}>ESC</kbd>
                  Dismiss
                </span>
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--accent)' }}>
                CHAINTRACE SECURE SEARCH
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
