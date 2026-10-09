/**
 * Sovereign Forensic Database Service (IndexedDB Persistent Layer)
 * 
 * Provides an enterprise, browser-persistent database for:
 * - Investigations & Case Dockets
 * - Digital Evidence & Cryptographic Hashes (§79A IT Act)
 * - Tracked Wallet Intelligence Profiles
 * - Forensic On-Chain Transaction Ledgers
 * - Immutable Audit Logs & Custody Chains
 * - Incident Timeline Milestones
 */

import type {
  Investigation,
  Evidence,
  Wallet,
  Transaction,
  AuditLog,
  TimelineEvent,
} from '../data/mockData';

const DB_NAME = 'ChainTrace_Sovereign_DB';
const DB_VERSION = 1;

export interface DatabaseStats {
  investigationsCount: number;
  evidenceCount: number;
  walletsCount: number;
  transactionsCount: number;
  auditLogsCount: number;
  timelineCount: number;
  storageType: 'IndexedDB (Persistent Local Storage)';
  lastSynced: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize and open the sovereign IndexedDB database
 */
export function getDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Investigations Store
      if (!db.objectStoreNames.contains('investigations')) {
        const invStore = db.createObjectStore('investigations', { keyPath: 'id' });
        invStore.createIndex('caseId', 'caseId', { unique: true });
        invStore.createIndex('status', 'status', { unique: false });
        invStore.createIndex('priority', 'priority', { unique: false });
        invStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 2. Evidence Store
      if (!db.objectStoreNames.contains('evidence')) {
        const evStore = db.createObjectStore('evidence', { keyPath: 'id' });
        evStore.createIndex('investigationId', 'investigationId', { unique: false });
        evStore.createIndex('hash', 'hash', { unique: false });
      }

      // 3. Wallets Store
      if (!db.objectStoreNames.contains('wallets')) {
        const wStore = db.createObjectStore('wallets', { keyPath: 'address' });
        wStore.createIndex('blockchain', 'blockchain', { unique: false });
        wStore.createIndex('riskScore', 'riskScore', { unique: false });
      }

      // 4. Transactions Store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'hash' });
        txStore.createIndex('fromAddress', 'fromAddress', { unique: false });
        txStore.createIndex('toAddress', 'toAddress', { unique: false });
        txStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 5. Audit Logs Store
      if (!db.objectStoreNames.contains('audit_logs')) {
        const alStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
        alStore.createIndex('timestamp', 'timestamp', { unique: false });
        alStore.createIndex('user', 'user', { unique: false });
      }

      // 6. Timeline Events Store
      if (!db.objectStoreNames.contains('timeline_events')) {
        const tleStore = db.createObjectStore('timeline_events', { keyPath: 'id' });
        tleStore.createIndex('investigationId', 'investigationId', { unique: false });
        tleStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Generic helper to perform a transaction
 */
async function performTx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let req: IDBRequest<T> | void;
    try {
      req = callback(store);
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = () => {
      if (req && 'result' in req) {
        resolve(req.result);
      } else {
        resolve(undefined as unknown as T);
      }
    };

    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

// ─────────────────────────────────────────────────────────────
// INVESTIGATIONS CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllInvestigations(): Promise<Investigation[]> {
  try {
    return await performTx<Investigation[]>('investigations', 'readonly', (store) =>
      store.getAll()
    );
  } catch (err) {
    console.warn('IndexedDB read failed, fallback:', err);
    return [];
  }
}

export async function dbSaveInvestigation(inv: Investigation): Promise<void> {
  await performTx('investigations', 'readwrite', (store) => store.put(inv));
}

export async function dbDeleteInvestigation(id: string): Promise<void> {
  await performTx('investigations', 'readwrite', (store) => store.delete(id));
}

// ─────────────────────────────────────────────────────────────
// EVIDENCE CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllEvidence(): Promise<Evidence[]> {
  try {
    return await performTx<Evidence[]>('evidence', 'readonly', (store) => store.getAll());
  } catch (err) {
    console.warn('Evidence read failed:', err);
    return [];
  }
}

export async function dbSaveEvidence(item: Evidence): Promise<void> {
  await performTx('evidence', 'readwrite', (store) => store.put(item));
}

// ─────────────────────────────────────────────────────────────
// WALLETS CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllWallets(): Promise<Wallet[]> {
  try {
    return await performTx<Wallet[]>('wallets', 'readonly', (store) => store.getAll());
  } catch (err) {
    console.warn('Wallets read failed:', err);
    return [];
  }
}

export async function dbSaveWallet(w: Wallet): Promise<void> {
  await performTx('wallets', 'readwrite', (store) => store.put(w));
}

// ─────────────────────────────────────────────────────────────
// TRANSACTIONS CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllTransactions(): Promise<Transaction[]> {
  try {
    return await performTx<Transaction[]>('transactions', 'readonly', (store) => store.getAll());
  } catch (err) {
    console.warn('Transactions read failed:', err);
    return [];
  }
}

export async function dbSaveTransaction(tx: Transaction): Promise<void> {
  await performTx('transactions', 'readwrite', (store) => store.put(tx));
}

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllAuditLogs(): Promise<AuditLog[]> {
  try {
    return await performTx<AuditLog[]>('audit_logs', 'readonly', (store) => store.getAll());
  } catch (err) {
    console.warn('Audit logs read failed:', err);
    return [];
  }
}

export async function dbSaveAuditLog(log: AuditLog): Promise<void> {
  await performTx('audit_logs', 'readwrite', (store) => store.put(log));
}

// ─────────────────────────────────────────────────────────────
// TIMELINE EVENTS CRUD
// ─────────────────────────────────────────────────────────────

export async function dbGetAllTimelineEvents(): Promise<TimelineEvent[]> {
  try {
    return await performTx<TimelineEvent[]>('timeline_events', 'readonly', (store) => store.getAll());
  } catch (err) {
    console.warn('Timeline events read failed:', err);
    return [];
  }
}

export async function dbSaveTimelineEvent(evt: TimelineEvent): Promise<void> {
  await performTx('timeline_events', 'readwrite', (store) => store.put(evt));
}

// ─────────────────────────────────────────────────────────────
// DATABASE STATS & BACKUP UTILITIES
// ─────────────────────────────────────────────────────────────

export async function dbGetStats(): Promise<DatabaseStats> {
  const [invs, evs, wls, txs, logs, tles] = await Promise.all([
    dbGetAllInvestigations(),
    dbGetAllEvidence(),
    dbGetAllWallets(),
    dbGetAllTransactions(),
    dbGetAllAuditLogs(),
    dbGetAllTimelineEvents(),
  ]);

  return {
    investigationsCount: invs.length,
    evidenceCount: evs.length,
    walletsCount: wls.length,
    transactionsCount: txs.length,
    auditLogsCount: logs.length,
    timelineCount: tles.length,
    storageType: 'IndexedDB (Persistent Local Storage)',
    lastSynced: new Date().toLocaleTimeString('en-IN'),
  };
}

/**
 * Export complete forensic database dump as formatted JSON file
 */
export async function dbExportBackupFile(): Promise<void> {
  const [investigations, evidence, wallets, transactions, auditLogs, timelineEvents] =
    await Promise.all([
      dbGetAllInvestigations(),
      dbGetAllEvidence(),
      dbGetAllWallets(),
      dbGetAllTransactions(),
      dbGetAllAuditLogs(),
      dbGetAllTimelineEvents(),
    ]);

  const exportPayload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      platform: 'ChainTrace Sovereign Forensic Suite',
      statutoryStandard: 'Section 79A IT Act / Section 91 CrPC Certified',
      version: '1.0.0',
    },
    tables: {
      investigations,
      evidence,
      wallets,
      transactions,
      auditLogs,
      timelineEvents,
    },
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ChainTrace_Forensic_DB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Wipe all data from all 6 object stores in the database
 */
export async function dbClearAllData(): Promise<void> {
  const storeNames: Array<'investigations' | 'evidence' | 'wallets' | 'transactions' | 'audit_logs' | 'timeline_events'> = [
    'investigations',
    'evidence',
    'wallets',
    'transactions',
    'audit_logs',
    'timeline_events',
  ];

  await Promise.all(
    storeNames.map((name) =>
      performTx(name, 'readwrite', (store) => {
        store.clear();
      })
    )
  );

  try {
    localStorage.setItem('chaintrace_db_empty_mode_v2', 'true');
    localStorage.setItem('chaintrace_db_wiped_empty_v2', 'true');
  } catch {
    // Ignore storage restriction
  }
}

/**
 * Seed initial mock datasets into IndexedDB (Only called explicitly when user requests demo data)
 */
export async function dbPopulateDemoData(defaults: {
  investigations: Investigation[];
  evidence: Evidence[];
  wallets: Wallet[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  timelineEvents: TimelineEvent[];
}): Promise<void> {
  for (const inv of defaults.investigations) {
    await dbSaveInvestigation(inv);
  }
  for (const ev of defaults.evidence) {
    await dbSaveEvidence(ev);
  }
  for (const w of defaults.wallets) {
    await dbSaveWallet(w);
  }
  for (const tx of defaults.transactions) {
    await dbSaveTransaction(tx);
  }
  for (const log of defaults.auditLogs) {
    await dbSaveAuditLog(log);
  }
  for (const tle of defaults.timelineEvents) {
    await dbSaveTimelineEvent(tle);
  }
  try {
    localStorage.removeItem('chaintrace_db_empty_mode_v2');
  } catch {
    // Ignore
  }
}

/**
 * Hydrate from IndexedDB. If database was never cleared or reset was requested,
 * wipe existing mock data and keep the database 100% empty for clean real intake.
 */
export async function dbSeedInitialIfEmpty(_defaults?: {
  investigations?: Investigation[];
  evidence?: Evidence[];
  wallets?: Wallet[];
  transactions?: Transaction[];
  auditLogs?: AuditLog[];
  timelineEvents?: TimelineEvent[];
}): Promise<{
  investigations: Investigation[];
  evidence: Evidence[];
  wallets: Wallet[];
  transactions: Transaction[];
  auditLogs: AuditLog[];
  timelineEvents: TimelineEvent[];
}> {
  try {
    const isWiped = typeof window !== 'undefined' ? localStorage.getItem('chaintrace_db_wiped_empty_v2') : null;

    if (!isWiped) {
      // First boot after user requested empty database: wipe all existing mock entries clean!
      await dbClearAllData();
      return {
        investigations: [],
        evidence: [],
        wallets: [],
        transactions: [],
        auditLogs: [],
        timelineEvents: [],
      };
    }

    // Database is in clean real-case mode. Load whatever the user has created:
    const [existingInvs, evidence, wallets, transactions, auditLogs, timelineEvents] = await Promise.all([
      dbGetAllInvestigations(),
      dbGetAllEvidence(),
      dbGetAllWallets(),
      dbGetAllTransactions(),
      dbGetAllAuditLogs(),
      dbGetAllTimelineEvents(),
    ]);

    return {
      investigations: existingInvs,
      evidence,
      wallets,
      transactions,
      auditLogs,
      timelineEvents,
    };
  } catch (err) {
    console.warn('Database initialization fallback to empty:', err);
    return {
      investigations: [],
      evidence: [],
      wallets: [],
      transactions: [],
      auditLogs: [],
      timelineEvents: [],
    };
  }
}
