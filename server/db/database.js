import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { getSupabase, isSupabaseConfigured } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
const DATA_DIR = isServerless ? path.join('/tmp', 'cbfis_data') : path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Standard Cryptographic SHA-256 Hashing helper
 * Ensures all passwords in DB and Supabase are stored as strings of 64 hex characters
 */
export function hashPassword(str) {
  if (!str) return crypto.createHash('sha256').update('secure123').digest('hex');
  if (typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str)) return str.toLowerCase();
  return crypto.createHash('sha256').update(String(str)).digest('hex');
}

// Ensure data directory exists safely
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[DB Engine] Could not create DATA_DIR, using in-memory mode:', e.message);
}

// Officers are created via the registration endpoint only — no seed accounts
const DEFAULT_USERS = [];


// Initial database schema
const INITIAL_DB = {
  users: DEFAULT_USERS,
  investigations: [],
  timeline_events: [],
  evidence: [],
  wallets: [],
  transactions: [],
  ncrp_complaints: [],
  freeze_notices: [],
  audit_logs: [],
  meta: {
    initializedAt: new Date().toISOString(),
    version: '2.0.0',
    authority: 'Ministry of Home Affairs (I4C) Sovereign Cyber Node',
  },
};

/**
 * Load local database from file or initialize
 */
function readLocalDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!parsed.users) parsed.users = [];
      for (const defUser of DEFAULT_USERS) {
        if (!parsed.users.some((u) => u.email.toLowerCase() === defUser.email.toLowerCase())) {
          parsed.users.push(defUser);
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[DB Engine] Error reading db.json, re-initializing:', err.message);
  }
  writeLocalDb(INITIAL_DB);
  return INITIAL_DB;
}

/**
 * Atomic write to db.json to prevent corruption
 */
function writeLocalDb(data) {
  try {
    const tempFile = `${DB_FILE}.${Date.now()}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('[DB Engine] Failed to persist data atomically:', err.message);
  }
}

// Initialize on load
let memoryDb = readLocalDb();

// Automatically upgrade any legacy plaintext user passwords to SHA-256 hashes
if (Array.isArray(memoryDb?.users)) {
  let changed = false;
  for (const u of memoryDb.users) {
    const h1 = hashPassword(u.passwordHash || u.password_hash || u.password);
    const h2 = hashPassword(u.password_hash || u.passwordHash || u.password);
    if (u.passwordHash !== h1 || u.password_hash !== h2) {
      u.passwordHash = h1;
      u.password_hash = h2;
      changed = true;
    }
  }
  if (changed) writeLocalDb(memoryDb);
}

// --- Supabase Relational Schema Adapters ---
function toSupabaseInvestigation(inv) {
  return {
    id: inv.id,
    case_id: inv.caseId || inv.case_id,
    title: inv.title || 'Untitled Case',
    suspect_wallet: inv.suspectWallet || inv.suspect_wallet || '',
    blockchain: inv.blockchain || 'ETH',
    risk_score: Number(inv.riskScore ?? inv.risk_score ?? 50),
    funds_traced: Number(inv.fundsTraced ?? inv.funds_traced ?? 0),
    currency: inv.currency || 'INR',
    investigator: inv.investigator || 'Arjun Sharma',
    status: inv.status || 'UNDER_INVESTIGATION',
    priority: inv.priority || 'HIGH',
    description: inv.description || '',
    tags: Array.isArray(inv.tags) ? inv.tags : [],
    jurisdiction: inv.jurisdiction || 'Delhi Police Cyber Crime PS (Special Cell)',
    created_at: inv.createdAt || inv.created_at || new Date().toISOString(),
    updated_at: inv.updatedAt || inv.updated_at || new Date().toISOString(),
  };
}

function fromSupabaseInvestigation(row) {
  if (!row) return null;
  return {
    ...row,
    caseId: row.case_id || row.caseId,
    suspectWallet: row.suspect_wallet || row.suspectWallet,
    riskScore: row.risk_score !== undefined ? row.risk_score : row.riskScore,
    fundsTraced: row.funds_traced !== undefined ? row.funds_traced : row.fundsTraced,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

function toSupabaseUser(u) {
  const pwdHash = hashPassword(u.passwordHash || u.password_hash || u.password || 'secure123');
  return {
    id: u.id,
    email: (u.email || '').toLowerCase().trim(),
    password_hash: pwdHash,
    name: u.name || 'Forensic Officer',
    team: u.team || 'Cyber Forensic Special Cell',
    role: u.role || 'Junior Cyber Analyst',
    role_type: u.roleType || u.role_type || 'SENIOR',
    clearance_level: u.clearanceLevel || u.clearance_level || 'LEVEL-4 TOP SECRET',
    badge_no: u.badgeNo || u.badge_no || null,
    jurisdiction: u.jurisdiction || 'Delhi Police Cyber Crime PS (Special Cell)',
    avatar: u.avatar || (u.name ? u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CF'),
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    last_login: u.lastLogin || u.last_login || new Date().toISOString(),
  };
}

function fromSupabaseUser(row) {
  if (!row) return null;
  return {
    ...row,
    passwordHash: row.password_hash || row.passwordHash,
    roleType: row.role_type || row.roleType || 'SENIOR',
    clearanceLevel: row.clearance_level || row.clearanceLevel,
    badgeNo: row.badge_no || row.badgeNo,
    createdAt: row.created_at || row.createdAt,
    lastLogin: row.last_login || row.lastLogin,
  };
}

function toSupabaseTimeline(e) {
  return {
    id: e.id,
    investigation_id: e.investigationId || e.investigation_id,
    timestamp: e.timestamp || new Date().toISOString(),
    event_type: e.eventType || e.event_type || 'INVESTIGATION_UPDATE',
    description: e.description || '',
    tx_hash: e.txHash || e.tx_hash || null,
    amount: e.amount ? Number(e.amount) : null,
    wallet_address: e.walletAddress || e.wallet_address || null,
    investigator_note: e.investigatorNote || e.investigator_note || null,
    created_at: e.createdAt || e.created_at || new Date().toISOString(),
  };
}

function fromSupabaseTimeline(row) {
  if (!row) return null;
  return {
    ...row,
    investigationId: row.investigation_id || row.investigationId,
    eventType: row.event_type || row.eventType,
    txHash: row.tx_hash || row.txHash,
    walletAddress: row.wallet_address || row.walletAddress,
    investigatorNote: row.investigator_note || row.investigatorNote,
    createdAt: row.created_at || row.createdAt,
  };
}

function toSupabaseNcrp(c) {
  return {
    id: c.id,
    ack_no: c.ackNo || c.ack_no,
    victim_name: c.victimName || c.victim_name,
    contact_phone: c.contactPhone || c.contact_phone || null,
    loss_inr: Number(c.lossInr ?? c.loss_inr ?? 0),
    suspect_wallet: c.suspectWallet || c.suspect_wallet || '',
    blockchain: c.blockchain || 'TRON',
    bank_utr: c.bankUtr || c.bank_utr || null,
    upi_vpa: c.upiVpa || c.upi_vpa || null,
    crime_category: c.crimeCategory || c.crime_category || 'Digital Arrest & Financial Cyber Extortion',
    source_channel: c.sourceChannel || c.source_channel || '1930_HELPLINE',
    status: c.status || 'PENDING',
    golden_window_expires_at: c.goldenWindowExpiresAt || c.golden_window_expires_at || null,
    created_at: c.createdAt || c.created_at || new Date().toISOString(),
  };
}

function fromSupabaseNcrp(row) {
  if (!row) return null;
  return {
    ...row,
    ackNo: row.ack_no || row.ackNo,
    victimName: row.victim_name || row.victimName,
    contactPhone: row.contact_phone || row.contactPhone,
    lossInr: row.loss_inr !== undefined ? row.loss_inr : row.lossInr,
    suspectWallet: row.suspect_wallet || row.suspectWallet,
    bankUtr: row.bank_utr || row.bankUtr,
    upiVpa: row.upi_vpa || row.upiVpa,
    crimeCategory: row.crime_category || row.crimeCategory,
    sourceChannel: row.source_channel || row.sourceChannel,
    goldenWindowExpiresAt: row.golden_window_expires_at || row.goldenWindowExpiresAt,
    createdAt: row.created_at || row.createdAt,
  };
}

function toSupabaseFreeze(n) {
  return {
    id: n.id,
    dispatch_ref: n.dispatchRef || n.dispatch_ref,
    notice_type: n.noticeType || n.notice_type || 'VASP_SUBPOENA_SEC94_BNSS',
    target_entity: n.targetEntity || n.target_entity,
    target_identifier: n.targetIdentifier || n.target_identifier,
    case_reference: n.caseReference || n.case_reference,
    recipient_email: n.recipientEmail || n.recipient_email,
    sha256_seal: n.sha256Seal || n.sha256_seal,
    status: n.status || 'DISPATCHED',
    full_notice_text: n.fullNoticeText || n.full_notice_text,
    dispatched_at: n.dispatchedAt || n.dispatched_at || new Date().toISOString(),
    acknowledged_at: n.acknowledgedAt || n.acknowledged_at || null,
    frozen_at: n.frozenAt || n.frozen_at || null,
  };
}

function fromSupabaseFreeze(row) {
  if (!row) return null;
  return {
    ...row,
    dispatchRef: row.dispatch_ref || row.dispatchRef,
    noticeType: row.notice_type || row.noticeType,
    targetEntity: row.target_entity || row.targetEntity,
    targetIdentifier: row.target_identifier || row.targetIdentifier,
    caseReference: row.case_reference || row.caseReference,
    recipientEmail: row.recipient_email || row.recipientEmail,
    sha256Seal: row.sha256_seal || row.sha256Seal,
    fullNoticeText: row.full_notice_text || row.fullNoticeText,
    dispatchedAt: row.dispatched_at || row.dispatchedAt,
    acknowledgedAt: row.acknowledged_at || row.acknowledgedAt,
    frozenAt: row.frozen_at || row.frozenAt,
  };
}

function toSupabaseAudit(l) {
  return {
    id: l.id,
    timestamp: l.timestamp || new Date().toISOString(),
    "user": l.user || 'Forensic Officer',
    action: l.action || 'INVESTIGATION_UPDATE',
    resource: l.resource || 'SYSTEM',
    ip: l.ip || '127.0.0.1',
    session: l.session || 'SESSION-SOVEREIGN-MHA',
    details: l.details || '',
    integrity_hash: l.integrityHash || l.integrity_hash || null,
  };
}

function fromSupabaseAudit(row) {
  if (!row) return null;
  return {
    ...row,
    integrityHash: row.integrity_hash || row.integrityHash,
  };
}

function toSupabaseWallet(w) {
  return {
    address: w.address,
    blockchain: w.blockchain || 'ETH',
    label: w.label || 'Unlabeled Wallet',
    entity_type: w.entityType || w.entity_type || 'UNKNOWN',
    risk_score: Number(w.riskScore ?? w.risk_score ?? 50),
    balance: Number(w.balance ?? 0),
    total_received: Number(w.totalReceived ?? w.total_received ?? 0),
    total_sent: Number(w.totalSent ?? w.total_sent ?? 0),
    tx_count: Number(w.txCount ?? w.tx_count ?? 0),
    first_seen: w.firstSeen || w.first_seen || new Date().toISOString(),
    last_activity: w.lastActivity || w.last_activity || new Date().toISOString(),
    counterparties: Number(w.counterparties ?? 0),
    flags: Array.isArray(w.flags) ? w.flags : [],
    cluster: w.cluster || null,
    exchange: w.exchange || null,
    created_at: w.createdAt || w.created_at || new Date().toISOString(),
    updated_at: w.updatedAt || w.updated_at || new Date().toISOString(),
  };
}

function fromSupabaseWallet(row) {
  if (!row) return null;
  return {
    ...row,
    entityType: row.entity_type || row.entityType,
    riskScore: row.risk_score !== undefined ? row.risk_score : row.riskScore,
    totalReceived: row.total_received !== undefined ? row.total_received : row.totalReceived,
    totalSent: row.total_sent !== undefined ? row.total_sent : row.totalSent,
    txCount: row.tx_count !== undefined ? row.tx_count : row.txCount,
    firstSeen: row.first_seen || row.firstSeen,
    lastActivity: row.last_activity || row.lastActivity,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

function toSupabaseTransaction(t) {
  return {
    hash: t.hash,
    from_address: t.fromAddress || t.from_address,
    to_address: t.toAddress || t.to_address,
    amount: Number(t.amount ?? 0),
    token: t.token || 'USDT',
    usd_value: Number(t.usdValue ?? t.usd_value ?? 0),
    timestamp: t.timestamp || new Date().toISOString(),
    block_number: Number(t.blockNumber ?? t.block_number ?? 0),
    confirmations: Number(t.confirmations ?? 12),
    fee: Number(t.fee ?? 0),
    status: t.status || 'CONFIRMED',
    risk_score: Number(t.riskScore ?? t.risk_score ?? 50),
    type: t.type || 'TRANSFER',
    blockchain: t.blockchain || 'ETH',
    investigation_id: t.investigationId || t.investigation_id || null,
    created_at: t.createdAt || t.created_at || new Date().toISOString(),
  };
}

function fromSupabaseTransaction(row) {
  if (!row) return null;
  return {
    ...row,
    fromAddress: row.from_address || row.fromAddress,
    toAddress: row.to_address || row.toAddress,
    usdValue: row.usd_value !== undefined ? row.usd_value : row.usdValue,
    blockNumber: row.block_number !== undefined ? row.block_number : row.blockNumber,
    riskScore: row.risk_score !== undefined ? row.risk_score : row.riskScore,
    investigationId: row.investigation_id || row.investigationId,
    createdAt: row.created_at || row.createdAt,
  };
}

function toSupabaseEvidence(ev) {
  return {
    id: ev.id,
    investigation_id: ev.investigationId || ev.investigation_id,
    title: ev.title || ev.description || 'Forensic Exhibit',
    type: ev.type || 'FORENSIC_REPORT',
    hash: ev.hash,
    file_size: ev.fileSize || ev.file_size || ev.size || '128 KB',
    source: ev.source || 'Sovereign Node RPC',
    description: ev.description || '',
    examiner_name: ev.examinerName || ev.examiner_name || 'Examiner of Electronic Evidence (Sec 79A IT Act)',
    verified: ev.verified ?? (ev.integrity === 'VERIFIED' || true),
    created_at: ev.createdAt || ev.created_at || ev.timestamp || new Date().toISOString(),
  };
}

function fromSupabaseEvidence(row) {
  if (!row) return null;
  return {
    ...row,
    investigationId: row.investigation_id || row.investigationId,
    fileSize: row.file_size || row.fileSize,
    size: row.file_size || row.size,
    examinerName: row.examiner_name || row.examinerName,
    integrity: row.verified ? 'VERIFIED' : 'PENDING',
    createdAt: row.created_at || row.createdAt,
  };
}

export const db = {
  // ==========================================
  // USERS & TEAMS
  // ==========================================
  async getUsers() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseUser);
        }
      } catch (err) {
        console.warn('[Supabase Warning] users query fallback:', err.message);
      }
    }
    return memoryDb.users || [];
  },

  async getUserByEmail(email) {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('email', cleanEmail).maybeSingle();
        if (!error && data) {
          return fromSupabaseUser(data);
        }
      } catch (err) {
        console.warn('[Supabase Warning] getUserByEmail fallback:', err.message);
      }
    }
    return (memoryDb.users || []).find((u) => u.email.toLowerCase() === cleanEmail) || DEFAULT_USERS.find((u) => u.email.toLowerCase() === cleanEmail) || null;
  },

  async createUser(user) {
    const now = new Date().toISOString();
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const id = user.id || `USR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const avatar = user.avatar || (user.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'CF');

    const hashedPassword = hashPassword(user.password || user.passwordHash || user.password_hash || 'secure123');

    const record = {
      id,
      email: cleanEmail,
      passwordHash: hashedPassword,
      password_hash: hashedPassword,
      name: user.name || 'Forensic Officer',
      team: user.team || 'Cyber Forensic Special Cell',
      role: user.role || 'Junior Cyber Analyst',
      roleType: user.roleType || user.role_type || (cleanEmail.includes('junior') ? 'JUNIOR' : 'SENIOR'),
      role_type: user.roleType || user.role_type || (cleanEmail.includes('junior') ? 'JUNIOR' : 'SENIOR'),
      clearanceLevel: user.clearanceLevel || user.clearance_level || (cleanEmail.includes('junior') ? 'LEVEL-2 CONFIDENTIAL' : 'LEVEL-4 TOP SECRET'),
      clearance_level: user.clearanceLevel || user.clearance_level || (cleanEmail.includes('junior') ? 'LEVEL-2 CONFIDENTIAL' : 'LEVEL-4 TOP SECRET'),
      badgeNo: user.badgeNo || user.badge_no || `IND-${Math.floor(1000 + Math.random() * 9000)}`,
      badge_no: user.badgeNo || user.badge_no || `IND-${Math.floor(1000 + Math.random() * 9000)}`,
      jurisdiction: user.jurisdiction || 'Delhi Police Cyber Crime PS (Special Cell)',
      avatar,
      createdAt: now,
      created_at: now,
      lastLogin: now,
      last_login: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseUser(record);
        const { error } = await supabase.from('users').upsert([supaRecord], { onConflict: 'email' });
        if (error) console.warn('[Supabase Warning] createUser fallback to local:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] createUser:', err.message);
      }
    }

    if (!memoryDb.users) memoryDb.users = [];
    const existingIdx = memoryDb.users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (existingIdx !== -1) {
      memoryDb.users[existingIdx] = { ...memoryDb.users[existingIdx], ...record };
    } else {
      memoryDb.users.push(record);
    }
    writeLocalDb(memoryDb);
    return record;
  },

  async updateUserLogin(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const now = new Date().toISOString();
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('users').update({ last_login: now }).eq('email', cleanEmail);
      } catch (err) {
        console.warn('[Supabase Warning] updateUserLogin:', err.message);
      }
    }

    if (memoryDb.users) {
      const u = memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (u) {
        u.lastLogin = now;
        u.last_login = now;
        writeLocalDb(memoryDb);
      }
    }
  },

  async updateUserPassword(email, newPassword) {
    const cleanEmail = (email || '').toLowerCase().trim();
    const hash = hashPassword(newPassword);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('users').update({ password_hash: hash }).eq('email', cleanEmail);
      } catch (err) {
        console.warn('[Supabase Warning] updateUserPassword:', err.message);
      }
    }

    if (memoryDb.users) {
      const u = memoryDb.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (u) {
        u.passwordHash = hash;
        u.password_hash = hash;
        writeLocalDb(memoryDb);
      }
    }
    return hash;
  },

  // ==========================================
  // INVESTIGATIONS
  // ==========================================
  async getInvestigations(filter = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase.from('investigations').select('*').order('created_at', { ascending: false });
        if (filter.status) query = query.eq('status', filter.status);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseInvestigation);
        }
      } catch (err) {
        console.warn('[Supabase Warning] investigations query fallback:', err.message);
      }
    }

    let items = memoryDb.investigations || [];
    if (filter.status) {
      items = items.filter((inv) => inv.status === filter.status);
    }
    if (filter.investigator) {
      items = items.filter((inv) => inv.investigator.toLowerCase().includes(filter.investigator.toLowerCase()));
    }
    return items;
  },

  async getInvestigationById(id) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('investigations').select('*').or(`id.eq.${id},case_id.eq.${id}`).maybeSingle();
        if (!error && data) return fromSupabaseInvestigation(data);
      } catch (err) {
        console.warn('[Supabase Warning] getInvestigationById fallback:', err.message);
      }
    }
    return (memoryDb.investigations || []).find((inv) => inv.id === id || inv.caseId === id || inv.case_id === id) || null;
  },

  async createInvestigation(inv) {
    const now = new Date().toISOString();
    const newRecord = {
      id: inv.id || `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      caseId: inv.caseId || inv.case_id || `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      case_id: inv.caseId || inv.case_id || `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: inv.title || 'Untitled Case',
      suspectWallet: inv.suspectWallet || inv.suspect_wallet || '',
      suspect_wallet: inv.suspectWallet || inv.suspect_wallet || '',
      blockchain: inv.blockchain || 'ETH',
      riskScore: Number(inv.riskScore ?? inv.risk_score ?? 75),
      risk_score: Number(inv.riskScore ?? inv.risk_score ?? 75),
      fundsTraced: Number(inv.fundsTraced ?? inv.funds_traced ?? 0),
      funds_traced: Number(inv.fundsTraced ?? inv.funds_traced ?? 0),
      currency: inv.currency || 'INR',
      investigator: inv.investigator || 'Arjun Sharma',
      status: inv.status || 'UNDER_INVESTIGATION',
      priority: inv.priority || 'HIGH',
      description: inv.description || '',
      tags: inv.tags || [],
      jurisdiction: inv.jurisdiction || 'Delhi Police Cyber Crime PS (Special Cell)',
      createdAt: inv.createdAt || inv.created_at || now,
      created_at: inv.createdAt || inv.created_at || now,
      updatedAt: now,
      updated_at: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseInvestigation(newRecord);
        const { error } = await supabase.from('investigations').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] createInvestigation fallback to local:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] createInvestigation:', err.message);
      }
    }

    memoryDb.investigations.unshift(newRecord);
    writeLocalDb(memoryDb);
    return newRecord;
  },

  async updateInvestigation(id, updates) {
    const now = new Date().toISOString();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaUpdates = {};
        if (updates.title !== undefined) supaUpdates.title = updates.title;
        if (updates.status !== undefined) supaUpdates.status = updates.status;
        if (updates.priority !== undefined) supaUpdates.priority = updates.priority;
        if (updates.description !== undefined) supaUpdates.description = updates.description;
        if (updates.investigator !== undefined) supaUpdates.investigator = updates.investigator;
        if (updates.riskScore !== undefined || updates.risk_score !== undefined) {
          supaUpdates.risk_score = updates.riskScore !== undefined ? updates.riskScore : updates.risk_score;
        }
        if (updates.fundsTraced !== undefined || updates.funds_traced !== undefined) {
          supaUpdates.funds_traced = updates.fundsTraced !== undefined ? updates.fundsTraced : updates.funds_traced;
        }
        supaUpdates.updated_at = now;
        await supabase.from('investigations').update(supaUpdates).or(`id.eq.${id},case_id.eq.${id}`);
      } catch (err) {
        console.warn('[Supabase Warning] updateInvestigation:', err.message);
      }
    }

    const idx = (memoryDb.investigations || []).findIndex((inv) => inv.id === id || inv.caseId === id || inv.case_id === id);
    if (idx !== -1) {
      memoryDb.investigations[idx] = {
        ...memoryDb.investigations[idx],
        ...updates,
        updatedAt: now,
        updated_at: now,
      };
      writeLocalDb(memoryDb);
      return memoryDb.investigations[idx];
    }
    return null;
  },

  // ==========================================
  // TIMELINE EVENTS
  // ==========================================
  async getTimelineEvents(investigationId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('investigation_id', investigationId)
          .order('timestamp', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseTimeline);
        }
      } catch (err) {
        console.warn('[Supabase Warning] timeline query fallback:', err.message);
      }
    }
    return (memoryDb.timeline_events || []).filter((e) => e.investigationId === investigationId || e.investigation_id === investigationId);
  },

  async addTimelineEvent(event) {
    const record = {
      id: event.id || `TLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      investigationId: event.investigationId || event.investigation_id,
      investigation_id: event.investigationId || event.investigation_id,
      timestamp: event.timestamp || new Date().toISOString(),
      eventType: event.eventType || event.event_type || 'INVESTIGATION_UPDATE',
      event_type: event.eventType || event.event_type || 'INVESTIGATION_UPDATE',
      description: event.description || '',
      txHash: event.txHash || event.tx_hash,
      tx_hash: event.txHash || event.tx_hash,
      amount: event.amount,
      walletAddress: event.walletAddress || event.wallet_address,
      wallet_address: event.walletAddress || event.wallet_address,
      investigatorNote: event.investigatorNote || event.investigator_note,
      investigator_note: event.investigatorNote || event.investigator_note,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseTimeline(record);
        const { error } = await supabase.from('timeline_events').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] addTimelineEvent fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addTimelineEvent:', err.message);
      }
    }
    memoryDb.timeline_events.push(record);
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // NCRP 1930 HELPLINE COMPLAINTS
  // ==========================================
  async getNcrpComplaints() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('ncrp_complaints').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseNcrp);
        }
      } catch (err) {
        console.warn('[Supabase Warning] ncrp query fallback:', err.message);
      }
    }
    return memoryDb.ncrp_complaints || [];
  },

  async addNcrpComplaint(complaint) {
    const record = {
      id: complaint.id || `NCRP-${Date.now()}`,
      ackNo: complaint.ackNo || complaint.ack_no || `2024/NCRP/${Math.floor(100000 + Math.random() * 900000)}`,
      ack_no: complaint.ackNo || complaint.ack_no || `2024/NCRP/${Math.floor(100000 + Math.random() * 900000)}`,
      victimName: complaint.victimName || complaint.victim_name || 'Complainant',
      victim_name: complaint.victimName || complaint.victim_name || 'Complainant',
      contactPhone: complaint.contactPhone || complaint.contact_phone || '+91 98765 43210',
      lossInr: Number(complaint.lossInr || complaint.loss_inr || 0),
      loss_inr: Number(complaint.lossInr || complaint.loss_inr || 0),
      suspectWallet: complaint.suspectWallet || complaint.suspect_wallet || '',
      suspect_wallet: complaint.suspectWallet || complaint.suspect_wallet || '',
      blockchain: complaint.blockchain || 'TRON',
      bankUtr: complaint.bankUtr || complaint.bank_utr,
      bank_utr: complaint.bankUtr || complaint.bank_utr,
      upiVpa: complaint.upiVpa || complaint.upi_vpa,
      upi_vpa: complaint.upiVpa || complaint.upi_vpa,
      crimeCategory: complaint.crimeCategory || complaint.crime_category || 'Digital Arrest & Financial Cyber Extortion',
      crime_category: complaint.crimeCategory || complaint.crime_category || 'Digital Arrest & Financial Cyber Extortion',
      sourceChannel: '1930_HELPLINE',
      source_channel: '1930_HELPLINE',
      status: complaint.status || 'PENDING',
      goldenWindowExpiresAt: complaint.goldenWindowExpiresAt || new Date(Date.now() + 180 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseNcrp(record);
        const { error } = await supabase.from('ncrp_complaints').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] addNcrpComplaint fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addNcrpComplaint:', err.message);
      }
    }
    memoryDb.ncrp_complaints.unshift(record);
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // FREEZE NOTICES (Sec 94 BNSS & Sec 106 BNSS)
  // ==========================================
  async getFreezeNotices() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('freeze_notices').select('*').order('dispatched_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseFreeze);
        }
      } catch (err) {
        console.warn('[Supabase Warning] freeze query fallback:', err.message);
      }
    }
    return memoryDb.freeze_notices || [];
  },

  async addFreezeNotice(notice) {
    const record = {
      id: notice.id || `FRZ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dispatchRef: notice.dispatchRef || notice.dispatch_ref || `MHA/I4C/SEC94/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      dispatch_ref: notice.dispatchRef || notice.dispatch_ref || `MHA/I4C/SEC94/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      noticeType: notice.noticeType || notice.notice_type || 'VASP_SUBPOENA_SEC94_BNSS',
      notice_type: notice.noticeType || notice.notice_type || 'VASP_SUBPOENA_SEC94_BNSS',
      targetEntity: notice.targetEntity || notice.target_entity,
      target_entity: notice.targetEntity || notice.target_entity,
      targetIdentifier: notice.targetIdentifier || notice.target_identifier,
      target_identifier: notice.targetIdentifier || notice.target_identifier,
      caseReference: notice.caseReference || notice.case_reference,
      case_reference: notice.caseReference || notice.case_reference,
      recipientEmail: notice.recipientEmail || notice.recipient_email,
      recipient_email: notice.recipientEmail || notice.recipient_email,
      sha256Seal: notice.sha256Seal || notice.sha256_seal,
      sha256_seal: notice.sha256Seal || notice.sha256_seal,
      status: notice.status || 'DISPATCHED',
      fullNoticeText: notice.fullNoticeText || notice.full_notice_text,
      full_notice_text: notice.fullNoticeText || notice.full_notice_text,
      dispatchedAt: new Date().toISOString(),
      dispatched_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseFreeze(record);
        const { error } = await supabase.from('freeze_notices').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] addFreezeNotice fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addFreezeNotice:', err.message);
      }
    }
    memoryDb.freeze_notices.unshift(record);
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // AUDIT LOGS (Section 63 BSA 2023)
  // ==========================================
  async getAuditLogs(limit = 100) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(limit);
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseAudit);
        }
      } catch (err) {
        console.warn('[Supabase Warning] audit query fallback:', err.message);
      }
    }
    return (memoryDb.audit_logs || []).slice(0, limit);
  },

  async addAuditLog(log) {
    const record = {
      id: log.id || `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      user: log.user || 'Forensic Officer',
      action: log.action || 'INVESTIGATION_UPDATE',
      resource: log.resource || 'SYSTEM',
      ip: log.ip || '10.0.0.1',
      session: log.session || 'SESSION-SOVEREIGN-MHA',
      details: log.details || '',
      integrityHash: log.integrityHash || log.integrity_hash || null,
      integrity_hash: log.integrityHash || log.integrity_hash || null,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseAudit(record);
        const { error } = await supabase.from('audit_logs').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] addAuditLog fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addAuditLog:', err.message);
      }
    }
    memoryDb.audit_logs.unshift(record);
    if (memoryDb.audit_logs.length > 500) {
      memoryDb.audit_logs = memoryDb.audit_logs.slice(0, 500);
    }
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // WALLETS
  // ==========================================
  async getWallets(filter = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase.from('wallets').select('*').order('risk_score', { ascending: false });
        if (filter.blockchain) query = query.eq('blockchain', filter.blockchain);
        if (filter.entityType) query = query.eq('entity_type', filter.entityType);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseWallet);
        }
      } catch (err) {
        console.warn('[Supabase Warning] wallets query fallback:', err.message);
      }
    }
    return memoryDb.wallets || [];
  },

  async addWallet(wallet) {
    const record = {
      address: wallet.address,
      blockchain: wallet.blockchain || 'ETH',
      label: wallet.label || 'Unlabeled Wallet',
      entityType: wallet.entityType || wallet.entity_type || 'UNKNOWN',
      entity_type: wallet.entityType || wallet.entity_type || 'UNKNOWN',
      riskScore: Number(wallet.riskScore ?? wallet.risk_score ?? 50),
      risk_score: Number(wallet.riskScore ?? wallet.risk_score ?? 50),
      balance: Number(wallet.balance ?? 0),
      totalReceived: Number(wallet.totalReceived ?? wallet.total_received ?? 0),
      total_received: Number(wallet.totalReceived ?? wallet.total_received ?? 0),
      totalSent: Number(wallet.totalSent ?? wallet.total_sent ?? 0),
      total_sent: Number(wallet.totalSent ?? wallet.total_sent ?? 0),
      txCount: Number(wallet.txCount ?? wallet.tx_count ?? 0),
      tx_count: Number(wallet.txCount ?? wallet.tx_count ?? 0),
      firstSeen: wallet.firstSeen || wallet.first_seen || new Date().toISOString(),
      first_seen: wallet.firstSeen || wallet.first_seen || new Date().toISOString(),
      lastActivity: wallet.lastActivity || wallet.last_activity || new Date().toISOString(),
      last_activity: wallet.lastActivity || wallet.last_activity || new Date().toISOString(),
      counterparties: Number(wallet.counterparties ?? 0),
      flags: Array.isArray(wallet.flags) ? wallet.flags : [],
      cluster: wallet.cluster || null,
      exchange: wallet.exchange || null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseWallet(record);
        const { error } = await supabase.from('wallets').upsert([supaRecord], { onConflict: 'address' });
        if (error) console.warn('[Supabase Warning] addWallet fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addWallet:', err.message);
      }
    }

    if (!memoryDb.wallets) memoryDb.wallets = [];
    const idx = memoryDb.wallets.findIndex((w) => w.address.toLowerCase() === record.address.toLowerCase());
    if (idx !== -1) {
      memoryDb.wallets[idx] = { ...memoryDb.wallets[idx], ...record };
    } else {
      memoryDb.wallets.unshift(record);
    }
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // TRANSACTIONS
  // ==========================================
  async getTransactions(filter = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase.from('transactions').select('*').order('timestamp', { ascending: false });
        if (filter.address) {
          query = query.or(`from_address.eq.${filter.address},to_address.eq.${filter.address}`);
        }
        if (filter.investigationId) {
          query = query.eq('investigation_id', filter.investigationId);
        }
        const { data, error } = await query.limit(100);
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseTransaction);
        }
      } catch (err) {
        console.warn('[Supabase Warning] transactions query fallback:', err.message);
      }
    }
    return memoryDb.transactions || [];
  },

  async addTransaction(tx) {
    const record = {
      hash: tx.hash,
      fromAddress: tx.fromAddress || tx.from_address,
      from_address: tx.fromAddress || tx.from_address,
      toAddress: tx.toAddress || tx.to_address,
      to_address: tx.toAddress || tx.to_address,
      amount: Number(tx.amount ?? 0),
      token: tx.token || 'USDT',
      usdValue: Number(tx.usdValue ?? tx.usd_value ?? 0),
      usd_value: Number(tx.usdValue ?? tx.usd_value ?? 0),
      timestamp: tx.timestamp || new Date().toISOString(),
      blockNumber: Number(tx.blockNumber ?? tx.block_number ?? 0),
      block_number: Number(tx.blockNumber ?? tx.block_number ?? 0),
      confirmations: Number(tx.confirmations ?? 12),
      fee: Number(tx.fee ?? 0),
      status: tx.status || 'CONFIRMED',
      riskScore: Number(tx.riskScore ?? tx.risk_score ?? 50),
      risk_score: Number(tx.riskScore ?? tx.risk_score ?? 50),
      type: tx.type || 'TRANSFER',
      blockchain: tx.blockchain || 'ETH',
      investigationId: tx.investigationId || tx.investigation_id || null,
      investigation_id: tx.investigationId || tx.investigation_id || null,
      createdAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseTransaction(record);
        const { error } = await supabase.from('transactions').upsert([supaRecord], { onConflict: 'hash' });
        if (error) console.warn('[Supabase Warning] addTransaction fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addTransaction:', err.message);
      }
    }

    if (!memoryDb.transactions) memoryDb.transactions = [];
    const idx = memoryDb.transactions.findIndex((t) => t.hash === record.hash);
    if (idx !== -1) {
      memoryDb.transactions[idx] = { ...memoryDb.transactions[idx], ...record };
    } else {
      memoryDb.transactions.unshift(record);
    }
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // EVIDENCE VAULT (§79A IT Act & Sec 63 BSA)
  // ==========================================
  async getEvidence(investigationId) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase.from('evidence_vault').select('*').order('created_at', { ascending: false });
        if (investigationId) {
          query = query.eq('investigation_id', investigationId);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map(fromSupabaseEvidence);
        }
      } catch (err) {
        console.warn('[Supabase Warning] evidence query fallback:', err.message);
      }
    }
    return (memoryDb.evidence || []).filter((e) => !investigationId || e.investigationId === investigationId || e.investigation_id === investigationId);
  },

  async addEvidence(ev) {
    const record = {
      id: ev.id || `EV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      investigationId: ev.investigationId || ev.investigation_id,
      investigation_id: ev.investigationId || ev.investigation_id,
      title: ev.title || ev.description || 'Electronic Forensic Exhibit',
      type: ev.type || 'FORENSIC_REPORT',
      hash: ev.hash,
      fileSize: ev.fileSize || ev.file_size || ev.size || '128 KB',
      file_size: ev.fileSize || ev.file_size || ev.size || '128 KB',
      size: ev.fileSize || ev.file_size || ev.size || '128 KB',
      source: ev.source || 'Sovereign Node RPC',
      description: ev.description || '',
      examinerName: ev.examinerName || ev.examiner_name || 'Examiner of Electronic Evidence (Sec 79A IT Act)',
      examiner_name: ev.examinerName || ev.examiner_name || 'Examiner of Electronic Evidence (Sec 79A IT Act)',
      verified: ev.verified ?? (ev.integrity === 'VERIFIED' || true),
      integrity: ev.verified ?? true ? 'VERIFIED' : 'PENDING',
      createdAt: ev.createdAt || ev.created_at || ev.timestamp || new Date().toISOString(),
      created_at: ev.createdAt || ev.created_at || ev.timestamp || new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const supaRecord = toSupabaseEvidence(record);
        const { error } = await supabase.from('evidence_vault').insert([supaRecord]);
        if (error) console.warn('[Supabase Warning] addEvidence fallback:', error.message);
      } catch (err) {
        console.warn('[Supabase Exception] addEvidence:', err.message);
      }
    }

    if (!memoryDb.evidence) memoryDb.evidence = [];
    memoryDb.evidence.unshift(record);
    writeLocalDb(memoryDb);
    return record;
  },

  // ==========================================
  // DATABASE STATS
  // ==========================================
  async getStats() {
    const supabaseConfigured = isSupabaseConfigured();
    let supabaseReachable = false;
    let counts = {
      investigations: (memoryDb.investigations || []).length,
      timelineEvents: (memoryDb.timeline_events || []).length,
      evidence: (memoryDb.evidence || []).length,
      wallets: (memoryDb.wallets || []).length,
      transactions: (memoryDb.transactions || []).length,
      ncrpComplaints: (memoryDb.ncrp_complaints || []).length,
      freezeNotices: (memoryDb.freeze_notices || []).length,
      auditLogs: (memoryDb.audit_logs || []).length,
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const [invRes, ncrpRes, frzRes, audRes, walRes, txRes, evRes, tleRes] = await Promise.all([
          supabase.from('investigations').select('id', { count: 'exact', head: true }),
          supabase.from('ncrp_complaints').select('id', { count: 'exact', head: true }),
          supabase.from('freeze_notices').select('id', { count: 'exact', head: true }),
          supabase.from('audit_logs').select('id', { count: 'exact', head: true }),
          supabase.from('wallets').select('address', { count: 'exact', head: true }),
          supabase.from('transactions').select('hash', { count: 'exact', head: true }),
          supabase.from('evidence_vault').select('id', { count: 'exact', head: true }),
          supabase.from('timeline_events').select('id', { count: 'exact', head: true }),
        ]);

        if (!invRes.error) {
          supabaseReachable = true;
          counts.investigations = invRes.count ?? counts.investigations;
          counts.ncrpComplaints = ncrpRes.count ?? counts.ncrpComplaints;
          counts.freezeNotices = frzRes.count ?? counts.freezeNotices;
          counts.auditLogs = audRes.count ?? counts.auditLogs;
          counts.wallets = walRes.count ?? counts.wallets;
          counts.transactions = txRes.count ?? counts.transactions;
          counts.evidence = evRes.count ?? counts.evidence;
          counts.timelineEvents = tleRes.count ?? counts.timelineEvents;
        }
      } catch {
        supabaseReachable = false;
      }
    }

    return {
      investigationsCount: counts.investigations,
      timelineEventsCount: counts.timelineEvents,
      evidenceCount: counts.evidence,
      walletsCount: counts.wallets,
      transactionsCount: counts.transactions,
      ncrpComplaintsCount: counts.ncrpComplaints,
      freezeNoticesCount: counts.freezeNotices,
      auditLogsCount: counts.auditLogs,
      engine: supabaseConfigured ? 'Supabase (Cloud PostgreSQL)' : 'Sovereign Atomic JSON (Local Persistent)',
      supabaseConnected: supabaseConfigured,
      supabaseReachable,
      lastSync: new Date().toISOString(),
    };
  },

  // Reset database to completely clean state
  async resetToEmpty() {
    memoryDb = { ...INITIAL_DB, meta: { ...INITIAL_DB.meta, clearedAt: new Date().toISOString() } };
    writeLocalDb(memoryDb);
    return { success: true, message: 'Database reset to clean sovereign slate' };
  },
};
