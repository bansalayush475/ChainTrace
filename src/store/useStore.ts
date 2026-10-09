import { create } from "zustand";
import {
  investigations as initialInvestigations,
  alerts as initialAlerts,
  wallets as initialWallets,
  evidence as initialEvidence,
  auditLogs as initialAuditLogs,
  watchlistItems as initialWatchlistItems,
  transactions as initialTransactions,
  timelineEvents as initialTimelineEvents,
  type Investigation,
  type Alert,
  type Wallet,
  type Evidence,
  type AuditLog,
  type WatchlistItem,
  type Transaction,
  type TimelineEvent,
} from "../data/mockData";
import { calculateRiskScore, getDefaultRiskFactors } from "../utils/riskEngine";
import {
  dbSaveInvestigation,
  dbDeleteInvestigation,
  dbSaveEvidence,
  dbSaveAuditLog,
  dbSaveTimelineEvent,
  dbSaveWallet,
  dbSaveTransaction,
  dbSeedInitialIfEmpty,
  dbClearAllData,
  dbPopulateDemoData,
  dbGetStats,
  dbExportBackupFile,
  type DatabaseStats,
} from "../services/databaseService";
import { api } from "../services/apiService";

export interface User {
  id?: string;
  name: string;
  role: string;
  roleType: "SENIOR" | "JUNIOR";
  email: string;
  avatar: string;
  clearanceLevel: string;
  team?: string;
  badgeNo?: string;
  jurisdiction?: string;
  phone?: string;
  designation?: string;
  serviceId?: string;
  supervisorEmail?: string;
  emergencyContact?: string;
  stationAddress?: string;
  passwordHash?: string;
}

export interface GeneratedReport {
  id: string;
  title: string;
  investigation: string;
  investigationId?: string;
  generatedAt: string;
  pages: number;
  status: "FINAL" | "DRAFT";
  sections?: string[];
  notes?: string;
}

export interface NewInvestigationInput {
  title: string;
  suspectWallet: string;
  blockchain: "ETH" | "BTC" | "TRON" | "POLYGON" | "BNB";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  fundsTraced?: number;
  currency?: string;
  tags?: string[];
}

const INITIAL_REPORTS: GeneratedReport[] = [
  {
    id: "REP-2024-0982",
    title: "Section 79A IT Act & Section 63 BSA Certified Electronic Evidence Dossier",
    investigation: "Digital Arrest & CBI Cyber Extortion Syndicate (Southeast Asia)",
    investigationId: "INV-2024-0982",
    generatedAt: "2024-09-19T07:15:00.000Z",
    pages: 14,
    status: "FINAL",
    sections: [
      "Executive Summary & Incident Metadata",
      "Victim Suspect Wallet Intelligence & Risk Score",
      "Multi-Hop Fund-Flow Graph Traversal",
      "Destination Exchange / VASP Attribution Analysis",
      "Wallet Clusters & Co-Spending Heuristics",
      "Fraud Pattern & Laundering Typology Match",
      "Explainable AI (XAI) Deterministic Decision Tree",
      "Investigation Timeline & Action Log",
      "Evidence Requisition Record",
      "Section 79A IT Act Electronic Evidence Certificate"
    ],
    notes: "Court-admissible electronic evidence certified under Section 63 of Bharatiya Sakshya Adhiniyam, 2023. Sealed with SHA-256 hash 0x7f81a9420b92da10482c1998ab81e912."
  },
  {
    id: "REP-2024-0401",
    title: "Tornado Cash Privacy Mixer De-Anonymization & Temporal Mathematical Proof",
    investigation: "Pig Butchering Investment Scam & Tornado Cash Laundering",
    investigationId: "INV-2024-0401",
    generatedAt: "2024-09-18T20:30:00.000Z",
    pages: 9,
    status: "FINAL",
    sections: [
      "Executive Summary & Incident Metadata",
      "Victim Suspect Wallet Intelligence & Risk Score",
      "Multi-Hop Fund-Flow Graph Traversal",
      "Destination Exchange / VASP Attribution Analysis",
      "Fraud Pattern & Laundering Typology Match",
      "Explainable AI (XAI) Deterministic Decision Tree",
      "Section 79A IT Act Electronic Evidence Certificate"
    ],
    notes: "Mathematical correlation proving 93.2% temporal confidence across FixedFloat bridge and Tornado Cash pool."
  }
];

interface StoreState {
  isAuthenticated: boolean;
  user: User | null;
  currentInvestigationId: string | null;
  selectedWalletAddress: string | null;
  searchOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "night" | "day";

  // State collections
  investigations: Investigation[];
  alerts: Alert[];
  wallets: Wallet[];
  transactions: Transaction[];
  timelineEvents: TimelineEvent[];
  evidence: Evidence[];
  reports: GeneratedReport[];
  auditLogs: AuditLog[];
  watchlistItems: WatchlistItem[];
  watchlist: string[];
  investigationNotes: Record<string, string>;

  // General actions
  login: (userOrRole?: User | "SENIOR" | "JUNIOR" | boolean | string, customEmail?: string) => void;
  logout: () => void;
  setCurrentInvestigation: (id: string | null) => void;
  setSelectedWallet: (address: string | null) => void;
  setSearchOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  updateUser: (updates: Partial<User>) => void;

  // Investigation actions
  addInvestigation: (input: NewInvestigationInput) => Investigation;
  updateInvestigation: (id: string, updates: Partial<Investigation>) => void;
  updateInvestigationStatus: (id: string, status: Investigation["status"]) => void;
  saveInvestigationNotes: (id: string, notes: string) => void;
  deleteInvestigation: (id: string) => void;

  // Alert actions
  dismissAlert: (id: string) => void;
  addAlert: (alert: Omit<Alert, "id" | "dismissed" | "timestamp"> & { timestamp?: string }) => void;

  // Watchlist actions
  addToWatchlist: (target: string, targetType?: WatchlistItem["targetType"]) => void;
  removeFromWatchlist: (target: string) => void;
  toggleWatchlistAlerts: (id: string) => void;

  // Evidence actions
  addEvidence: (item: Omit<Evidence, "id" | "timestamp"> & { timestamp?: string }) => Evidence;

  // Report actions
  addReport: (report: Omit<GeneratedReport, "id" | "generatedAt">) => GeneratedReport;

  // Audit actions
  addAuditLog: (log: Omit<AuditLog, "id" | "timestamp" | "session"> & { session?: string }) => void;

  // Transaction & Timeline actions
  addTransaction: (tx: Omit<Transaction, "confirmations"> & { confirmations?: number; investigationId?: string }) => Transaction;
  addTimelineEvent: (event: Omit<TimelineEvent, "id"> & { id?: string }) => TimelineEvent;

  // Wallet actions
  ensureWalletExists: (address: string, blockchain?: string, customProps?: Partial<Wallet>) => Wallet;
  syncLiveWalletTransactions: (walletData: {
    address: string;
    blockchain: string;
    balance: number;
    token: string;
    usdBalance: number;
    totalReceived: number;
    totalSent: number;
    txCount: number;
    firstSeen: string;
    lastActivity: string;
    transactions: Array<{
      hash: string;
      from: string;
      to: string;
      amount: number;
      token: string;
      usdValue: number;
      timestamp: string;
      blockNumber?: number;
      type: string;
      riskScore: number;
    }>;
    counterparties: number;
    riskScore: number;
  }) => void;

  // Database actions
  isDbReady: boolean;
  dbStats: DatabaseStats | null;
  supabaseStatus: { configured: boolean; mode: string; url: string | null } | null;
  isBackendConnected: boolean;
  checkBackendHealth: () => Promise<void>;
  initDatabase: () => Promise<void>;
  exportDatabaseBackup: () => Promise<void>;
  clearAllDatabaseData: () => Promise<void>;
  restoreSampleDemoData: () => Promise<void>;
}

const getInitialSession = (): User | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('cbfis_active_session') : null;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialSession = getInitialSession();

export const useStore = create<StoreState>((set, get) => ({
  isAuthenticated: !!initialSession,
  user: initialSession,
  currentInvestigationId: null,
  selectedWalletAddress: null,
  searchOpen: false,
  sidebarCollapsed: false,
  theme: (localStorage.getItem("chaintrace-theme") as "night" | "day") ?? "night",

  isDbReady: false,
  dbStats: null,
  supabaseStatus: null,
  isBackendConnected: false,

  // Populate collections with dynamic presentation data
  investigations: initialInvestigations,
  alerts: initialAlerts,
  wallets: initialWallets,
  transactions: initialTransactions,
  timelineEvents: initialTimelineEvents,
  evidence: initialEvidence,
  reports: INITIAL_REPORTS,
  auditLogs: initialAuditLogs,
  watchlistItems: initialWatchlistItems,
  watchlist: initialWatchlistItems.map((w) => w.target),
  investigationNotes: {},

  login: (userOrRole: User | "SENIOR" | "JUNIOR" | boolean | string = "SENIOR", customEmail?: string) => {
    let activeUser: User;

    if (userOrRole && typeof userOrRole === "object") {
      const u = userOrRole as User;
      activeUser = {
        id: u.id || `USR-${Date.now()}`,
        name: u.name || "Authorized Officer",
        role: u.role || "Cyber Forensic Specialist",
        roleType: (u.roleType as "SENIOR" | "JUNIOR") || "SENIOR",
        email: u.email || "officer@cybercrime.gov.in",
        avatar: u.avatar || (u.name ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : "CF"),
        clearanceLevel: u.clearanceLevel || "LEVEL-4",
        team: u.team || "Special Cell Cyber Operations",
        badgeNo: u.badgeNo || "MHA-IND-001",
        jurisdiction: u.jurisdiction || "ChainTrace Platform",
      };
    } else {
      const emailStr = (typeof userOrRole === "string" ? userOrRole : customEmail || "").toLowerCase();
      const isJunior =
        userOrRole === "JUNIOR" ||
        emailStr.includes("junior") ||
        emailStr.includes("analyst") ||
        emailStr.includes("trainee");

      const resolvedEmail = (typeof userOrRole === "string" && userOrRole.includes("@") ? userOrRole : customEmail) || 
        (isJunior ? "junior.officer@cybercrime.gov.in" : "senior.officer@cybercrime.gov.in");

      // Extract username display if email provided
      const emailPrefix = resolvedEmail.split('@')[0];
      const fallbackName = emailPrefix
        .split(/[._-]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || (isJunior ? "Field Analyst" : "Supervisory Lead");

      if (isJunior) {
        activeUser = {
          name: fallbackName,
          role: "Forensic Analyst",
          roleType: "JUNIOR",
          email: resolvedEmail,
          avatar: fallbackName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "JA",
          clearanceLevel: "LEVEL-2",
          team: "State Cyber CID & Field Operations",
          badgeNo: "MHA-FLD-204",
          jurisdiction: "State Cyber Crime PS",
        };
      } else {
        activeUser = {
          name: fallbackName,
          role: "Lead Forensic Researcher",
          roleType: "SENIOR",
          email: resolvedEmail,
          avatar: fallbackName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || "SL",
          clearanceLevel: "LEVEL-4",
          team: "Special Cell Cyber Operations",
          badgeNo: "MHA-DEL-091",
          jurisdiction: "ChainTrace Platform",
        };
      }
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cbfis_active_session', JSON.stringify(activeUser));
      }
    } catch {}

    set({
      isAuthenticated: true,
      user: activeUser,
    });
    get().addAuditLog({
      user: activeUser.name,
      action: "LOGIN",
      resource: "SYSTEM",
      ip: "10.0.0.1",
      details: `${activeUser.name} (${activeUser.team || 'Forensic Cell'} · ${activeUser.role}) authenticated into ChainTrace Console via secure session`,
    });
  },

  logout: () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cbfis_active_session');
      }
    } catch {}
    set({ isAuthenticated: false, user: null });
  },

  setCurrentInvestigation: (id) => set({ currentInvestigationId: id }),
  setSelectedWallet: (address) => set({ selectedWalletAddress: address }),
  setSearchOpen: (open) => set({ searchOpen: open }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === "night" ? "day" : "night";
      localStorage.setItem("chaintrace-theme", next);
      document.documentElement.setAttribute("data-theme", next === "day" ? "day" : "");
      return { theme: next };
    }),

  updateUser: (updates) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...updates } : null;
      if (updated && typeof window !== 'undefined') {
        try {
          localStorage.setItem('cbfis_active_session', JSON.stringify(updated));
        } catch {}
      }
      return { user: updated };
    }),

  addInvestigation: (input) => {
    const state = get();
    const invCount = state.investigations.length;
    const id = `INV-${String(invCount + 1).padStart(3, "0")}`;
    const caseNumber = 890 + invCount + 1;
    const caseId = `CT-2024-${String(caseNumber).padStart(4, "0")}`;

    let baseScore = 75;
    if (input.priority === "CRITICAL") baseScore = 92;
    else if (input.priority === "HIGH") baseScore = 82;
    else if (input.priority === "MEDIUM") baseScore = 55;
    else if (input.priority === "LOW") baseScore = 32;

    const riskScore = calculateRiskScore(getDefaultRiskFactors(baseScore));
    const now = new Date().toISOString();
    const defaultWallet = input.suspectWallet.trim() || `0x${Math.random().toString(16).substring(2, 42)}`;
    const fundsTraced = typeof input.fundsTraced === "number" && input.fundsTraced >= 0
      ? input.fundsTraced
      : 0;
    const currency = input.currency || (input.blockchain === "BTC" ? "BTC" : "USDT");

    const newInv: Investigation = {
      id,
      caseId,
      title: input.title.trim(),
      suspectWallet: defaultWallet,
      blockchain: input.blockchain,
      riskScore,
      fundsTraced,
      currency,
      investigator: state.user?.name || "Officer",
      status: "NEW",
      priority: input.priority,
      createdAt: now,
      updatedAt: now,
      description: input.description.trim() || "New forensic investigation opened for suspect activity tracing.",
      tags: input.tags && input.tags.length > 0
        ? input.tags
        : [input.blockchain.toLowerCase(), input.priority.toLowerCase(), "case-analysis"],
    };

    // Ensure suspect wallet is registered with 0 automatic transactions for new case
    state.ensureWalletExists(defaultWallet, input.blockchain, {
      balance: 0,
      totalReceived: 0,
      totalSent: 0,
      txCount: 0,
      counterparties: 0,
      flags: ["CASE_SUSPECT_TARGET"],
      firstSeen: now,
      lastActivity: now,
    });

    // Create case timeline initial entry
    const initTimelineEvent: TimelineEvent = {
      id: `TLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      investigationId: id,
      timestamp: now,
      eventType: "INVESTIGATION_UPDATE",
      description: `Case ${caseId} (${newInv.title}) opened for suspect target ${defaultWallet} on ${newInv.blockchain}.`,
      walletAddress: defaultWallet,
      investigatorNote: newInv.description,
    };

    // Add audit log
    const auditEntry: AuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      user: state.user?.name || "Officer",
      action: "INVESTIGATION_CREATE",
      resource: caseId,
      ip: "192.168.1.100",
      session: `SES-${Date.now()}`,
      details: `Created investigation ${caseId}: "${newInv.title}" (${newInv.blockchain}) - Priority ${newInv.priority}`,
    };

    // Commit to IndexedDB persistent store
    dbSaveInvestigation(newInv).catch(console.warn);
    dbSaveTimelineEvent(initTimelineEvent).catch(console.warn);
    dbSaveAuditLog(auditEntry).catch(console.warn);
    dbGetStats().then((stats) => set({ dbStats: stats })).catch(() => {});

    // Commit to Backend & Supabase
    api.createInvestigation(newInv).catch((err) => console.warn('Backend sync failed:', err));

    set((s) => ({
      investigations: [newInv, ...s.investigations],
      timelineEvents: [initTimelineEvent, ...s.timelineEvents],
      auditLogs: [auditEntry, ...s.auditLogs],
    }));

    return newInv;
  },

  updateInvestigation: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.investigations.find((i) => i.id === id);
      if (!target) return state;

      const updatedInv = { ...target, ...updates, updatedAt: now };
      dbSaveInvestigation(updatedInv).catch(console.warn);

      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "INVESTIGATION_CREATE",
        resource: target.caseId,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Updated investigation ${target.caseId}: ${Object.keys(updates).join(", ")}`,
      };
      dbSaveAuditLog(auditEntry).catch(console.warn);

      return {
        investigations: state.investigations.map((i) => (i.id === id ? updatedInv : i)),
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });
  },

  updateInvestigationStatus: (id, status) => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.investigations.find((i) => i.id === id);
      if (!target) return state;

      const updatedInv = { ...target, status, updatedAt: now };
      dbSaveInvestigation(updatedInv).catch(console.warn);

      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "INVESTIGATION_CREATE",
        resource: target.caseId,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Changed status of ${target.caseId} from ${target.status} to ${status}`,
      };
      dbSaveAuditLog(auditEntry).catch(console.warn);

      return {
        investigations: state.investigations.map((i) => (i.id === id ? updatedInv : i)),
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });
  },

  saveInvestigationNotes: (id, notes) => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.investigations.find((i) => i.id === id);
      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "INVESTIGATION_CREATE",
        resource: target ? target.caseId : id,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Saved notes for investigation ${target ? target.caseId : id}`,
      };

      return {
        investigationNotes: { ...state.investigationNotes, [id]: notes },
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });
  },

  deleteInvestigation: (id) => {
    dbDeleteInvestigation(id).catch(console.warn);
    dbGetStats().then((stats) => set({ dbStats: stats })).catch(() => {});
    set((state) => ({
      investigations: state.investigations.filter((i) => i.id !== id),
    }));
  },

  dismissAlert: (id) => {
    const now = new Date().toISOString();
    set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "ALERT_DISMISS",
        resource: alert ? alert.walletAddress : id,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Dismissed security alert ${id}: ${alert ? alert.message.slice(0, 50) : ""}`,
      };
      return {
        alerts: state.alerts.map((a) => (a.id === id ? { ...a, dismissed: true } : a)),
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });
  },

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: `live-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dismissed: false,
      timestamp: alert.timestamp || new Date().toISOString(),
    };
    set((state) => ({
      alerts: [newAlert, ...state.alerts],
    }));
  },

  addToWatchlist: (target, targetType = "WALLET") => {
    const now = new Date().toISOString();
    set((state) => {
      if (state.watchlist.includes(target)) return state;

      const newItem: WatchlistItem = {
        id: `WL-${Date.now()}`,
        target,
        targetType,
        riskScore: 65,
        lastActivity: now,
        alertsEnabled: true,
        addedAt: now,
        addedBy: state.user?.name || "Officer",
      };

      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "WATCHLIST_ADD",
        resource: target,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Added ${target} (${targetType}) to monitoring watchlist`,
      };

      return {
        watchlist: [...state.watchlist, target],
        watchlistItems: [newItem, ...state.watchlistItems],
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });
  },

  removeFromWatchlist: (target) =>
    set((state) => ({
      watchlist: state.watchlist.filter((w) => w !== target),
      watchlistItems: state.watchlistItems.filter((w) => w.target !== target),
    })),

  toggleWatchlistAlerts: (id) =>
    set((state) => ({
      watchlistItems: state.watchlistItems.map((item) =>
        item.id === id ? { ...item, alertsEnabled: !item.alertsEnabled } : item
      ),
    })),

  addEvidence: (item) => {
    const now = new Date().toISOString();
    const newEvidence: Evidence = {
      ...item,
      id: `EVD-${Date.now().toString().slice(-4)}`,
      timestamp: item.timestamp || now,
      integrity: item.integrity || "VERIFIED",
    };

    set((state) => {
      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "EVIDENCE_EXPORT",
        resource: newEvidence.id,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Registered forensic evidence ${newEvidence.id} (${newEvidence.type})`,
      };
      return {
        evidence: [newEvidence, ...state.evidence],
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });

    return newEvidence;
  },

  addReport: (report) => {
    const now = new Date().toISOString();
    const newReport: GeneratedReport = {
      ...report,
      id: `RPT-${String(get().reports.length + 1).padStart(3, "0")}`,
      generatedAt: now,
    };

    set((state) => {
      const auditEntry: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: now,
        user: state.user?.name || "Officer",
        action: "REPORT_GENERATE",
        resource: newReport.id,
        ip: "192.168.1.100",
        session: `SES-${Date.now()}`,
        details: `Generated forensic evidence report ${newReport.id}: "${newReport.title}" (${newReport.pages} pages)`,
      };
      return {
        reports: [newReport, ...state.reports],
        auditLogs: [auditEntry, ...state.auditLogs],
      };
    });

    return newReport;
  },

  addAuditLog: (log) =>
    set((state) => ({
      auditLogs: [
        {
          ...log,
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          session: log.session || `SES-${Date.now()}`,
        },
        ...state.auditLogs,
      ],
    })),

  addTransaction: (tx) => {
    const newTx: Transaction = {
      ...tx,
      confirmations: tx.confirmations ?? 12,
    };
    const now = new Date().toISOString();
    const timelineEntry: TimelineEvent = {
      id: `TLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      investigationId: (tx as any).investigationId || "",
      timestamp: tx.timestamp || now,
      eventType: "TRANSACTION",
      description: `${tx.type} of ${tx.amount} ${tx.token} ($${tx.usdValue.toLocaleString()}) from ${tx.fromAddress.slice(0, 8)}... to ${tx.toAddress.slice(0, 8)}...`,
      txHash: tx.hash,
      amount: tx.usdValue,
      walletAddress: tx.fromAddress,
    };

    set((s) => {
      const updatedWallets = s.wallets.map((w) => {
        if (w.address.toLowerCase() === tx.fromAddress.toLowerCase()) {
          return {
            ...w,
            txCount: w.txCount + 1,
            totalSent: w.totalSent + tx.amount,
            lastActivity: tx.timestamp || now,
          };
        }
        if (w.address.toLowerCase() === tx.toAddress.toLowerCase()) {
          return {
            ...w,
            txCount: w.txCount + 1,
            balance: w.balance + tx.amount,
            totalReceived: w.totalReceived + tx.amount,
            lastActivity: tx.timestamp || now,
          };
        }
        return w;
      });

      return {
        transactions: [newTx, ...s.transactions],
        timelineEvents: [timelineEntry, ...s.timelineEvents],
        wallets: updatedWallets,
      };
    });

    get().addAuditLog({
      user: get().user?.name || "Officer",
      action: "EVIDENCE_EXPORT",
      resource: newTx.hash,
      ip: "192.168.1.100",
      details: `Recorded forensic transaction ${newTx.hash.slice(0, 10)}... for amount ${newTx.amount} ${newTx.token}`,
    });

    return newTx;
  },

  addTimelineEvent: (event) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: event.id || `TLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    set((s) => ({
      timelineEvents: [newEvent, ...s.timelineEvents],
    }));
    return newEvent;
  },

  ensureWalletExists: (address, blockchain = "ETH", customProps = {}) => {
    const state = get();
    const existing = state.wallets.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );
    if (existing) {
      if (Object.keys(customProps).length > 0) {
        const merged = { ...existing, ...customProps };
        set((s) => ({
          wallets: s.wallets.map((w) => (w.address.toLowerCase() === address.toLowerCase() ? merged : w)),
        }));
        return merged;
      }
      return existing;
    }

    const now = new Date().toISOString();
    const newWallet: Wallet = {
      address,
      blockchain,
      label: customProps.label || "Case Suspect Target",
      entityType: customProps.entityType || "SUSPECT",
      riskScore: customProps.riskScore ?? 75,
      balance: customProps.balance ?? 0,
      totalReceived: customProps.totalReceived ?? 0,
      totalSent: customProps.totalSent ?? 0,
      txCount: customProps.txCount ?? 0,
      firstSeen: now,
      lastActivity: now,
      counterparties: customProps.counterparties ?? 0,
      flags: customProps.flags ?? ["CASE_SUSPECT_TARGET"],
      ...customProps,
    };

    set((s) => ({
      wallets: [newWallet, ...s.wallets],
    }));

    return newWallet;
  },

  syncLiveWalletTransactions: (walletData) => {
    const state = get();
    const existingWallet = state.wallets.find(
      (w) => w.address.toLowerCase() === walletData.address.toLowerCase()
    );

    const updatedWallet: Wallet = {
      address: walletData.address,
      blockchain: walletData.blockchain as any,
      label: existingWallet?.label || "Live Target Wallet",
      entityType: existingWallet?.entityType || "SUSPECT",
      riskScore: walletData.riskScore,
      balance: walletData.balance,
      totalReceived: walletData.totalReceived,
      totalSent: walletData.totalSent,
      txCount: walletData.txCount,
      firstSeen: walletData.firstSeen,
      lastActivity: walletData.lastActivity,
      counterparties: walletData.counterparties,
      flags: existingWallet?.flags || ["LIVE_ONCHAIN_QUERY", "PEEL_TRAVERSED"],
    };

    const newTransactions: Transaction[] = walletData.transactions.map((t, idx) => {
      const isEth = (t.token || "").toUpperCase().includes("ETH");
      const isHighRisk = (isEth && t.amount >= 0.2) || t.amount >= 1000;
      const score = isHighRisk ? Math.max(84, t.riskScore) : Math.min(65, t.riskScore);
      return {
        hash: t.hash,
        fromAddress: t.from,
        toAddress: t.to,
        amount: t.amount,
        token: t.token,
        usdValue: t.usdValue || (isEth ? t.amount * 2650 : t.amount),
        timestamp: t.timestamp,
        blockNumber: t.blockNumber || 19800000 + idx,
        confirmations: 128,
        fee: 0.0015,
        type: (t.type === "DEPOSIT" ? "EXCHANGE_DEPOSIT" : t.type === "PEEL" ? "TRANSFER" : "TRANSFER") as any,
        riskScore: score,
        flags: isHighRisk ? [t.type, "HIGH_RISK_THRESHOLD", "ONCHAIN_VERIFIED"] : [t.type, "ONCHAIN_VERIFIED"],
      };
    });

    // Merge transactions without duplicates
    const existingHashes = new Set(state.transactions.map((t) => t.hash.toLowerCase()));
    const filteredNewTxs = newTransactions.filter((t) => !existingHashes.has(t.hash.toLowerCase()));

    // Create counterparties if not exist
    const newCounterparties: Wallet[] = [];
    const allKnownAddrs = new Set([
      ...state.wallets.map((w) => w.address.toLowerCase()),
      walletData.address.toLowerCase(),
    ]);

    walletData.transactions.forEach((tx) => {
      const counterpartAddr = tx.from.toLowerCase() === walletData.address.toLowerCase() ? tx.to : tx.from;
      if (counterpartAddr && counterpartAddr !== "UNKNOWN" && !allKnownAddrs.has(counterpartAddr.toLowerCase())) {
        allKnownAddrs.add(counterpartAddr.toLowerCase());
        newCounterparties.push({
          address: counterpartAddr,
          blockchain: walletData.blockchain as any,
          label: `Counterparty (${tx.token})`,
          entityType: "INTERMEDIATE",
          riskScore: Math.max(50, tx.riskScore - 10),
          balance: 0,
          totalReceived: tx.amount,
          totalSent: 0,
          txCount: 1,
          firstSeen: tx.timestamp,
          lastActivity: tx.timestamp,
          counterparties: 1,
          flags: ["COUNTERPARTY_NODE"],
        });
      }
    });

    // Persist updated wallet and transactions to IndexedDB
    dbSaveWallet(updatedWallet).catch(console.warn);
    filteredNewTxs.forEach((tx) => dbSaveTransaction(tx).catch(console.warn));

    set((s) => ({
      wallets: [
        updatedWallet,
        ...s.wallets.filter((w) => w.address.toLowerCase() !== walletData.address.toLowerCase()),
        ...newCounterparties,
      ],
      transactions: [...filteredNewTxs, ...s.transactions],
    }));
  },

  checkBackendHealth: async () => {
    try {
      const health = await api.getHealth();
      set({
        isBackendConnected: true,
        supabaseStatus: {
          configured: health.database.supabaseConnected,
          mode: health.database.engine,
          url: health.database.supabaseStatus.url,
        },
      });
    } catch {
      set({ isBackendConnected: false });
    }
  },

  initDatabase: async () => {
    try {
      // Connect and query backend health & Supabase status
      try {
        const health = await api.getHealth();
        set({
          isBackendConnected: true,
          supabaseStatus: {
            configured: health.database.supabaseConnected,
            mode: health.database.engine,
            url: health.database.supabaseStatus.url,
          },
        });

        // Fetch all primary forensic models from Supabase Cloud / Backend
        const [serverInvs, serverWallets, serverTxs, serverEvidence, serverAudit] = await Promise.all([
          api.getInvestigations().catch(() => []),
          api.getWallets().catch(() => []),
          api.getTransactions().catch(() => []),
          api.getEvidence().catch(() => []),
          api.getAuditLogs().catch(() => []),
        ]);

        set((s) => ({
          investigations: serverInvs && serverInvs.length > 0 ? serverInvs : s.investigations,
          wallets: serverWallets && serverWallets.length > 0 ? serverWallets : s.wallets,
          transactions: serverTxs && serverTxs.length > 0 ? serverTxs : s.transactions,
          evidence: serverEvidence && serverEvidence.length > 0 ? serverEvidence : s.evidence,
          auditLogs: serverAudit && serverAudit.length > 0 ? serverAudit : s.auditLogs,
        }));
      } catch {
        // Backend offline or local fallback
      }

      const hydrated = await dbSeedInitialIfEmpty({
        investigations: initialInvestigations,
        evidence: initialEvidence,
        wallets: initialWallets,
        transactions: initialTransactions,
        auditLogs: initialAuditLogs,
        timelineEvents: initialTimelineEvents,
      });

      const stats = await dbGetStats();

      set((s) => ({
        investigations: s.investigations.length > 0 ? s.investigations : hydrated.investigations,
        evidence: s.evidence.length > 0 ? s.evidence : hydrated.evidence,
        wallets: s.wallets.length > 0 ? s.wallets : hydrated.wallets,
        transactions: s.transactions.length > 0 ? s.transactions : hydrated.transactions,
        auditLogs: s.auditLogs.length > 0 ? s.auditLogs : hydrated.auditLogs,
        timelineEvents: s.timelineEvents.length > 0 ? s.timelineEvents : hydrated.timelineEvents,
        dbStats: stats,
        isDbReady: true,
      }));
    } catch (err) {
      console.warn("Database initialization fallback to memory:", err);
      set({ isDbReady: true });
    }
  },

  exportDatabaseBackup: async () => {
    await dbExportBackupFile();
  },

  clearAllDatabaseData: async () => {
    await dbClearAllData();
    const stats = await dbGetStats();
    set({
      investigations: [],
      evidence: [],
      wallets: [],
      transactions: [],
      timelineEvents: [],
      auditLogs: [],
      alerts: [],
      reports: [],
      watchlistItems: [],
      watchlist: [],
      investigationNotes: {},
      dbStats: stats,
    });
  },

  restoreSampleDemoData: async () => {
    await dbPopulateDemoData({
      investigations: initialInvestigations,
      evidence: initialEvidence,
      wallets: initialWallets,
      transactions: initialTransactions,
      auditLogs: initialAuditLogs,
      timelineEvents: initialTimelineEvents,
    });
    const stats = await dbGetStats();
    set({
      investigations: initialInvestigations,
      evidence: initialEvidence,
      wallets: initialWallets,
      transactions: initialTransactions,
      timelineEvents: initialTimelineEvents,
      auditLogs: initialAuditLogs,
      alerts: initialAlerts,
      reports: INITIAL_REPORTS,
      watchlistItems: initialWatchlistItems,
      watchlist: initialWatchlistItems.map((w) => w.target),
      dbStats: stats,
    });
  },
}));
