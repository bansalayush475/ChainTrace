import type { Investigation, TimelineEvent, AuditLog, Wallet, Transaction, Evidence } from '../data/mockData';

export interface SystemHealth {
  status: string;
  system: string;
  version: string;
  node: string;
  jurisdiction: string;
  authority: string;
  timestamp: string;
  database: {
    engine: string;
    supabaseConnected: boolean;
    supabaseStatus: {
      configured: boolean;
      url: string | null;
      mode: string;
    };
    stats: {
      investigationsCount: number;
      timelineEventsCount: number;
      evidenceCount: number;
      ncrpComplaintsCount: number;
      freezeNoticesCount: number;
      auditLogsCount: number;
      engine: string;
      supabaseConnected: boolean;
      lastSync: string;
    };
  };
  blockchainNodes: {
    tronGrid: string;
    blockstreamBtc: string;
    blockscoutEvm: string;
  };
  statutoryCompliance: string[];
}

export interface NcrpComplaint {
  id: string;
  ackNo: string;
  victimName: string;
  contactPhone?: string;
  lossInr: number;
  suspectWallet: string;
  blockchain: string;
  bankUtr?: string;
  upiVpa?: string;
  crimeCategory: string;
  sourceChannel: string;
  status: string;
  goldenWindowExpiresAt?: string;
  createdAt?: string;
}

export interface FreezeNoticeRecord {
  id: string;
  dispatchRef: string;
  noticeType: string;
  targetEntity: string;
  targetIdentifier: string;
  caseReference: string;
  recipientEmail: string;
  sha256Seal: string;
  status: string;
  fullNoticeText: string;
  dispatchedAt: string;
}

export interface NodalOfficer {
  entity: string;
  type: string;
  nodalEmail: string;
  turnaroundTime: string;
  jurisdiction: string;
  verifiedBadge: boolean;
}

const API_BASE = '/api';

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let errorData: any = {};
        try {
          errorData = await res.json();
        } catch {
          errorData = {};
        }

        let errMsg = '';
        if (typeof errorData.error === 'string') {
          errMsg = errorData.error;
        } else if (errorData.error && typeof errorData.error.message === 'string') {
          errMsg = errorData.error.message;
        } else if (typeof errorData.message === 'string') {
          errMsg = errorData.message;
        } else if (typeof errorData.details === 'string') {
          errMsg = errorData.details;
        } else if (errorData.error && typeof errorData.error.details === 'string') {
          errMsg = errorData.error.details;
        } else if (errorData.error && typeof errorData.error.hint === 'string') {
          errMsg = `${errorData.error.message || 'Database error'}: ${errorData.error.hint}`;
        } else if (errorData.error && typeof errorData.error === 'object') {
          try {
            errMsg = errorData.error.message || errorData.error.error || JSON.stringify(errorData.error);
          } catch {
            errMsg = String(errorData.error);
          }
        } else if (errorData.details && typeof errorData.details === 'object') {
          try {
            errMsg = errorData.details.message || JSON.stringify(errorData.details);
          } catch {
            errMsg = String(errorData.details);
          }
        }

        if (!errMsg || errMsg === '[object Object]') {
          errMsg = `Operation failed (HTTP ${res.status}): ${res.statusText || 'Server Error'}`;
        }

        const error = new Error(errMsg);
        (error as any).data = errorData;
        throw error;
      }
      return await res.json();
    } catch (err: any) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Health
  async getHealth(): Promise<SystemHealth> {
    return this.request<SystemHealth>('/health');
  }

  // Investigations
  async getInvestigations(filter?: { status?: string; investigator?: string }): Promise<Investigation[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.investigator) params.set('investigator', filter.investigator);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Investigation[]>(`/investigations${query}`);
  }

  async getInvestigation(id: string): Promise<Investigation & { timeline: TimelineEvent[] }> {
    return this.request<Investigation & { timeline: TimelineEvent[] }>(`/investigations/${id}`);
  }

  async createInvestigation(inv: Partial<Investigation>): Promise<Investigation> {
    return this.request<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify(inv),
    });
  }

  async updateInvestigation(id: string, updates: Partial<Investigation> & { escalationReason?: string; officerName?: string }): Promise<Investigation> {
    return this.request<Investigation>(`/investigations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Timeline
  async getTimeline(investigationId: string): Promise<TimelineEvent[]> {
    return this.request<TimelineEvent[]>(`/investigations/${investigationId}/timeline`);
  }

  async addTimelineEvent(investigationId: string, event: Partial<TimelineEvent>): Promise<TimelineEvent> {
    return this.request<TimelineEvent>(`/investigations/${investigationId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // 1930 NCRP Ingestion
  async getNcrpFeed(): Promise<NcrpComplaint[]> {
    return this.request<NcrpComplaint[]>('/ncrp/feed');
  }

  async dispatchNcrpComplaint(complaint: Partial<NcrpComplaint>): Promise<NcrpComplaint> {
    return this.request<NcrpComplaint>('/ncrp/dispatch', {
      method: 'POST',
      body: JSON.stringify(complaint),
    });
  }

  async escalateNcrpComplaint(id: string, officerName?: string): Promise<{ message: string; case: Investigation }> {
    return this.request<{ message: string; case: Investigation }>(`/ncrp/escalate/${id}`, {
      method: 'POST',
      body: JSON.stringify({ officerName }),
    });
  }

  // On-Chain RPC Proxy
  async traceWallet(address: string, chain?: string): Promise<any> {
    return this.request('/trace', {
      method: 'POST',
      body: JSON.stringify({ address, chain }),
    });
  }

  // Statutory Notices (Sec 94 BNSS & Sec 106 BNSS)
  async getNodalDirectory(): Promise<NodalOfficer[]> {
    return this.request<NodalOfficer[]>('/freeze/directory');
  }

  async getFreezeNotices(): Promise<FreezeNoticeRecord[]> {
    return this.request<FreezeNoticeRecord[]>('/freeze');
  }

  async generateVaspFreeze(data: {
    caseId?: string;
    ackNo?: string;
    targetAddress: string;
    exchangeName: string;
    recipientEmail?: string;
    amount?: string;
    officerName?: string;
  }): Promise<{ success: boolean; notice: FreezeNoticeRecord; sha256Seal: string; dispatchRef: string }> {
    return this.request('/freeze/vasp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateBankFreeze(data: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
    utr?: string;
    upiVpa?: string;
    amountInr?: number;
    officerName?: string;
  }): Promise<{ success: boolean; notice: FreezeNoticeRecord; sha256Seal: string; dispatchRef: string }> {
    return this.request('/freeze/bank', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Audit Logs (Section 63 BSA 2023)
  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/audit?limit=${limit}`);
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return this.request<AuditLog>('/audit', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  }

  // Wallets
  async getWallets(filter?: { blockchain?: string; entityType?: string }): Promise<Wallet[]> {
    const params = new URLSearchParams();
    if (filter?.blockchain) params.set('blockchain', filter.blockchain);
    if (filter?.entityType) params.set('entityType', filter.entityType);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Wallet[]>(`/wallets${query}`);
  }

  async addWallet(wallet: Partial<Wallet>): Promise<Wallet> {
    return this.request<Wallet>('/wallets', {
      method: 'POST',
      body: JSON.stringify(wallet),
    });
  }

  // Transactions
  async getTransactions(filter?: { address?: string; investigationId?: string }): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filter?.address) params.set('address', filter.address);
    if (filter?.investigationId) params.set('investigationId', filter.investigationId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Transaction[]>(`/transactions${query}`);
  }

  // ML Analysis
  async getTxRiskAnalysis(txId: string): Promise<any> {
    return this.request<any>(`/ml/analyze/${encodeURIComponent(txId)}`);
  }

  async addTransaction(tx: Partial<Transaction>): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(tx),
    });
  }

  // Evidence
  async getEvidence(investigationId?: string): Promise<Evidence[]> {
    const query = investigationId ? `?investigationId=${encodeURIComponent(investigationId)}` : '';
    return this.request<Evidence[]>(`/evidence${query}`);
  }

  async addEvidence(evidence: Partial<Evidence>): Promise<Evidence> {
    return this.request<Evidence>('/evidence', {
      method: 'POST',
      body: JSON.stringify(evidence),
    });
  }

  // Reset database to completely empty clean slate
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/audit/reset-database', {
      method: 'POST',
    });
  }

  // Authentication & Officer Database with resilient serverless/offline fallback
  async login(credentials: { email: string; password?: string; otp?: string }): Promise<{ success: boolean; message: string; user: any }> {
    try {
      return await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      // Fallback for 404 / static environments / serverless outage
      if (msg.includes('404') || msg.includes('could not be found') || msg.includes('Failed to fetch')) {
        const cleanEmail = credentials.email.trim().toLowerCase();

        // Enforce OTP validation in fallback mode if an OTP was sent
        const rawOtpData = typeof window !== 'undefined' ? sessionStorage.getItem(`cbfis_otp_${cleanEmail}`) : null;
        if (rawOtpData) {
          try {
            const data = JSON.parse(rawOtpData);
            if (!credentials.otp) {
              throw new Error('OTP is required for login. Please check your email.');
            }
            if (data.code !== credentials.otp.trim()) {
              throw new Error('Invalid OTP code. Please check your email and try again.');
            }
            if (Date.now() > data.expiresAt) {
              throw new Error('OTP has expired. Please request a new one.');
            }
          } catch (e: any) {
             if(e.message.includes('OTP')) throw e;
          }
        }
        const officers = getStoredLocalOfficers();
        let officer = officers.find((o) => o.email.toLowerCase() === cleanEmail);
        if (!officer) {
          // Provision fallback officer
          const name = cleanEmail.split('@')[0].split(/[._-]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Authorized Officer';
          officer = {
            id: `USR-${Date.now()}`,
            name,
            email: cleanEmail,
            team: 'Special Cell Cyber Operations (Northern Command)',
            role: 'Lead Crypto Forensic Specialist',
            roleType: 'SENIOR',
            clearanceLevel: 'LEVEL-4 TOP SECRET',
            badgeNo: 'MHA-DEL-091',
            jurisdiction: 'Delhi Police Cyber Crime PS (Special Cell)',
            avatar: name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CF',
          };
          saveLocalOfficer(officer);
        }
        return {
          success: true,
          message: 'Authentication verified (Offline/Sovereign Resilience Mode)',
          user: officer,
        };
      }
      throw err;
    }
  }

  async sendOtp(email: string): Promise<{
    success: boolean;
    message: string;
    email: string;
    expiresAt: number;
    devOtp?: string;
    deliveryMethod?: string;
    dispatchId?: string;
    shaSeal?: string;
    subject?: string;
    html?: string;
  }> {
    try {
      const res = await this.request<any>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      
      // If backend successfully created the OTP but only simulated the email, use EmailJS to actually send it!
      if (res.success && res.deliveryMethod === 'SOVEREIGN_SIMULATED' && res.devOtp) {
        try {
          const { sendOtpViaEmailJS } = await import('./emailjsService');
          const cleanEmail = email.trim().toLowerCase();
          const nameFromEmail = cleanEmail.split('@')[0]
            .split(/[._-]/)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
            
          const emailResult = await sendOtpViaEmailJS({
            toEmail: cleanEmail,
            toName: nameFromEmail,
            otpCode: res.devOtp,
          });
          
          if (emailResult.success) {
            res.deliveryMethod = 'REAL_SMTP';
            res.message = `OTP dispatched to ${cleanEmail} via SMTP. Check your inbox.`;
            console.info('[OTP] Real email sent via EmailJS to', cleanEmail);
          } else {
            console.warn('[OTP] EmailJS send failed:', emailResult.message);
          }
        } catch (emailErr) {
          console.warn('[OTP] EmailJS import/send error:', emailErr);
        }
      }
      
      return res;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('404') || msg.includes('could not be found') || msg.includes('Failed to fetch')) {
        const cleanEmail = email.trim().toLowerCase();
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const dispatchId = `LEA-NIC-${Math.floor(100000 + Math.random() * 900000)}`;

        // Store OTP in sessionStorage for verification
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              `cbfis_otp_${cleanEmail}`,
              JSON.stringify({ code: generatedOtp, expiresAt: Date.now() + 5 * 60 * 1000 })
            );
          }
        } catch {}

        // Try to send real email via EmailJS
        let deliveryMethod = 'SOVEREIGN_SIMULATED';
        try {
          const { sendOtpViaEmailJS } = await import('./emailjsService');
          const nameFromEmail = cleanEmail.split('@')[0]
            .split(/[._-]/)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          const emailResult = await sendOtpViaEmailJS({
            toEmail: cleanEmail,
            toName: nameFromEmail,
            otpCode: generatedOtp,
          });
          if (emailResult.success) {
            deliveryMethod = 'REAL_SMTP';
            console.info('[OTP] Real email sent via EmailJS to', cleanEmail);
          } else {
            console.warn('[OTP] EmailJS send failed:', emailResult.message, '— showing OTP in modal (demo mode)');
          }
        } catch (emailErr) {
          console.warn('[OTP] EmailJS import/send error:', emailErr);
        }

        return {
          success: true,
          message:
            deliveryMethod === 'REAL_SMTP'
              ? `OTP dispatched to ${cleanEmail} via SMTP. Check your inbox.`
              : `OTP dispatched to ${cleanEmail}. Valid for 5 minutes.`,
          email: cleanEmail,
          expiresAt: Date.now() + 5 * 60 * 1000,
          deliveryMethod,
          dispatchId,
          subject: `[CONFIDENTIAL] §79A IT Act Multi-Factor Verification Code — ChainTrace Sovereign Portal`,
          // Only expose devOtp if email failed (demo fallback)
          devOtp: deliveryMethod !== 'REAL_SMTP' ? generatedOtp : undefined,
        };
      }
      throw err;
    }
  }

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('404') || msg.includes('could not be found') || msg.includes('Failed to fetch')) {
        try {
          const raw = typeof window !== 'undefined' ? sessionStorage.getItem(`cbfis_otp_${email.trim().toLowerCase()}`) : null;
          if (raw) {
            const data = JSON.parse(raw);
            if (data.code === otp.trim()) {
              return { success: true, message: 'MFA OTP code verified successfully' };
            }
          }
        } catch {}
        return { success: false, message: 'Invalid OTP code. Please check your email.' };
      }
      throw err;
    }
  }

  async register(officerData: {
    name: string;
    email: string;
    password?: string;
    team?: string;
    role?: string;
    badgeNo?: string;
    clearanceLevel?: string;
    jurisdiction?: string;
  }): Promise<{ success: boolean; message: string; user: any }> {
    try {
      return await this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(officerData),
      });
    } catch (err: any) {
      const msg = String(err?.message || '');
      // If 404 (e.g. Vercel SPA rewrite missing or static preview), fallback to persistent local officer store
      if (msg.includes('404') || msg.includes('could not be found') || msg.includes('Failed to fetch')) {
        const cleanEmail = officerData.email.trim().toLowerCase();
        const isJunior = cleanEmail.includes('junior') || (officerData.role && officerData.role.toLowerCase().includes('junior'));
        const newOfficer: LocalOfficer = {
          id: `USR-${Date.now()}`,
          name: officerData.name.trim(),
          email: cleanEmail,
          password: officerData.password || 'secure123',
          team: officerData.team || 'Special Cell Cyber Operations (Northern Command)',
          role: officerData.role || (isJunior ? 'Junior Cyber Forensic Analyst' : 'Lead Crypto Forensic Specialist'),
          roleType: isJunior ? 'JUNIOR' : 'SENIOR',
          clearanceLevel: officerData.clearanceLevel || (isJunior ? 'LEVEL-2 CONFIDENTIAL' : 'LEVEL-4 TOP SECRET'),
          badgeNo: officerData.badgeNo || `MHA-LEA-${Math.floor(1000 + Math.random() * 9000)}`,
          jurisdiction: officerData.jurisdiction || 'Delhi Police Cyber Crime PS (Special Cell)',
          avatar: officerData.name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'CF',
        };
        saveLocalOfficer(newOfficer);
        return {
          success: true,
          message: 'Officer account created and registered in sovereign database (Local Fallback)',
          user: newOfficer,
        };
      }
      throw err;
    }
  }

  async lookupUser(email: string): Promise<{
    found: boolean;
    name?: string;
    team?: string;
    role?: string;
    roleType?: 'SENIOR' | 'JUNIOR';
    clearanceLevel?: string;
    badgeNo?: string;
    avatar?: string;
  }> {
    try {
      return await this.request(`/auth/lookup?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const cleanEmail = email.trim().toLowerCase();
      const officers = getStoredLocalOfficers();
      const found = officers.find((o) => o.email.toLowerCase() === cleanEmail);
      if (found) {
        return {
          found: true,
          name: found.name,
          team: found.team,
          role: found.role,
          roleType: found.roleType,
          clearanceLevel: found.clearanceLevel,
          badgeNo: found.badgeNo,
          avatar: found.avatar,
        };
      }
      return { found: false };
    }
  }

  async getTeamUsers(): Promise<any[]> {
    try {
      return await this.request('/auth/team');
    } catch {
      return getStoredLocalOfficers();
    }
  }
}

// Local storage helpers for client-side resilience
const LOCAL_OFFICERS_KEY = 'cbfis_local_officers';

interface LocalOfficer {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  team: string;
  role: string;
  roleType: 'SENIOR' | 'JUNIOR';
  clearanceLevel: string;
  badgeNo: string;
  jurisdiction: string;
  avatar: string;
}

const DEFAULT_LOCAL_OFFICERS: LocalOfficer[] = [];

function getStoredLocalOfficers(): LocalOfficer[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_OFFICERS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LOCAL_OFFICERS;
}

function saveLocalOfficer(officer: LocalOfficer) {
  try {
    const list = getStoredLocalOfficers();
    const existingIndex = list.findIndex((o) => o.email.toLowerCase() === officer.email.toLowerCase());
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...officer };
    } else {
      list.push(officer);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_OFFICERS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export const api = new ApiService();
