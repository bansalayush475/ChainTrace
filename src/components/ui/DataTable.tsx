import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  emptyMessage?: string;
}

function getValue<T>(row: T, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  searchable = false,
  pagination = true,
  pageSize = 15,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [data]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row as Record<string, unknown>).some((v) =>
        String(v ?? '').toLowerCase().includes(q)
      )
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      const cmp = String(av ?? '') < String(bv ?? '') ? -1 : String(av ?? '') > String(bv ?? '') ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paginated = pagination ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;
  const pageCount = Math.ceil(sorted.length / pageSize);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {searchable && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ position: 'relative', maxWidth: '320px', width: '100%' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Filter records..."
              style={{
                width: '100%',
                padding: '6px 30px 6px 30px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {search && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {filtered.length} matching {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
          )}
        </div>
      )}

      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{
                    padding: '11px 14px',
                    textAlign: 'left',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '10.5px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {col.label}
                    {col.sortable && (
                      <span style={{ color: sortKey === String(col.key) ? 'var(--accent)' : 'var(--border)', fontSize: '10px' }}>
                        {sortKey === String(col.key)
                          ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          : <ChevronsUpDown size={12} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(56,189,248,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
                  }}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} style={{ padding: '11px 14px', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                      {col.render
                        ? col.render(getValue(row, String(col.key)), row)
                        : String(getValue(row, String(col.key)) ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '11.5px', fontFamily: 'JetBrains Mono, monospace' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length} records
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '5px',
                padding: '4px 8px', color: page === 0 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: page === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                opacity: page === 0 ? 0.5 : 1,
              }}
              title="Previous Page"
            >
              <ChevronLeft size={13} />
            </button>
            {Array.from({ length: Math.min(pageCount, 6) }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                style={{
                  background: page === i ? 'var(--accent)' : 'var(--bg-elevated)',
                  border: `1px solid ${page === i ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '5px', padding: '3px 9px', fontSize: '11.5px', fontWeight: page === i ? 700 : 500,
                  color: page === i ? '#fff' : 'var(--text-primary)', cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: page === i ? '0 0 8px rgba(56,189,248,0.4)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              style={{
                background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '5px',
                padding: '4px 8px', color: page >= pageCount - 1 ? 'var(--text-secondary)' : 'var(--text-primary)',
                cursor: page >= pageCount - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center',
                opacity: page >= pageCount - 1 ? 0.5 : 1,
              }}
              title="Next Page"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
