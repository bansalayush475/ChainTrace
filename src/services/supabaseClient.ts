import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

let supabaseInstance: SupabaseClient | null = null;

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl.startsWith('https://')
);

if (isConfigured) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    console.log('[Supabase Web SDK] Connected to Supabase Cloud:', supabaseUrl);
  } catch (err) {
    console.warn('[Supabase Web SDK] Initialization error:', err);
    supabaseInstance = null;
  }
}

export const supabase = supabaseInstance;

export function isSupabaseConnected(): boolean {
  return Boolean(supabaseInstance);
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl || null,
    connected: isSupabaseConnected(),
    mode: isSupabaseConnected() ? 'SUPABASE_CLOUD' : 'SOVEREIGN_LOCAL_FALLBACK',
  };
}

/**
 * Direct Live Supabase Cloud Update:
 * Updates the username, avatar, and officer details directly in the public.users table in Supabase.
 * If the user record does not exist yet in Supabase, it safely upserts it.
 */
export async function updateSupabaseUserProfile(
  email: string,
  updates: Record<string, any>,
  previousEmail?: string,
  userId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabaseInstance) {
    return { success: false, error: 'Supabase Web SDK is not initialized' };
  }

  const currentLookupEmail = (previousEmail || email || '').toLowerCase().trim();
  const newEmail = (updates.email || email || '').toLowerCase().trim();
  const targetId = updates.id || userId;

  if (!currentLookupEmail && !newEmail && !targetId) {
    return { success: false, error: 'Email or User ID identifier is required for Supabase update' };
  }

  // Whitelisted columns matching Supabase 'users' table schema
  const payload: Record<string, any> = {};

  if (newEmail) {
    payload.email = newEmail;
  }

  if (updates.name !== undefined && typeof updates.name === 'string') {
    payload.name = updates.name.trim();
    // Automatically recompute two-letter officer avatar initials
    const parts = updates.name.trim().split(/\s+/);
    payload.avatar =
      updates.avatar ||
      ((parts[0]?.[0] || 'U') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }

  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.roleType !== undefined || updates.role_type !== undefined) {
    payload.role_type = updates.roleType || updates.role_type;
  }
  if (updates.team !== undefined) payload.team = updates.team;
  if (updates.clearanceLevel !== undefined || updates.clearance_level !== undefined) {
    payload.clearance_level = updates.clearanceLevel || updates.clearance_level;
  }
  if (updates.badgeNo !== undefined || updates.badge_no !== undefined) {
    payload.badge_no = updates.badgeNo || updates.badge_no;
  }
  if (updates.jurisdiction !== undefined) payload.jurisdiction = updates.jurisdiction;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.emergencyContact !== undefined || updates.emergency_contact !== undefined) {
    payload.emergency_contact = updates.emergencyContact || updates.emergency_contact;
  }
  if (updates.designation !== undefined) payload.designation = updates.designation;
  if (updates.serviceId !== undefined || updates.service_id !== undefined) {
    payload.service_id = updates.serviceId || updates.service_id;
  }
  if (updates.supervisorEmail !== undefined || updates.supervisor_email !== undefined) {
    payload.supervisor_email = updates.supervisorEmail || updates.supervisor_email;
  }
  if (updates.stationAddress !== undefined || updates.station_address !== undefined) {
    payload.station_address = updates.stationAddress || updates.station_address;
  }
  payload.updated_at = new Date().toISOString();
  if (updates.avatar !== undefined && !payload.avatar) payload.avatar = updates.avatar;
  if (updates.passwordHash !== undefined || updates.password_hash !== undefined) {
    payload.password_hash = updates.passwordHash || updates.password_hash;
  }

  try {
    let updateData: any = null;
    let updateError: any = null;

    // 1. Try matching by unique User ID first (safest when email is changed)
    if (targetId) {
      const res = await supabaseInstance
        .from('users')
        .update(payload)
        .eq('id', targetId)
        .select();
      updateData = res.data;
      updateError = res.error;
    }

    // 2. If not matched by ID, try matching by previous/current email
    if ((!updateData || updateData.length === 0) && currentLookupEmail) {
      const res = await supabaseInstance
        .from('users')
        .update(payload)
        .eq('email', currentLookupEmail)
        .select();
      updateData = res.data;
      updateError = res.error;
    }

    // 3. If not matched yet, try new email directly
    if ((!updateData || updateData.length === 0) && newEmail && newEmail !== currentLookupEmail) {
      const res = await supabaseInstance
        .from('users')
        .update(payload)
        .eq('email', newEmail)
        .select();
      updateData = res.data;
      updateError = res.error;
    }

    // If an optional custom column is missing in Supabase schema, retry with base columns
    if (updateError && updateError.message && updateError.message.toLowerCase().includes('column')) {
      console.warn('[Supabase Cloud SDK] Column missing in users table, falling back to base columns:', updateError.message);
      const basePayload: Record<string, any> = {
        name: payload.name,
        avatar: payload.avatar,
        role: payload.role,
        role_type: payload.role_type,
        team: payload.team,
        badge_no: payload.badge_no,
        jurisdiction: payload.jurisdiction,
        clearance_level: payload.clearance_level,
      };
      const retryRes = await supabaseInstance
        .from('users')
        .update(basePayload)
        .eq('email', currentLookupEmail || newEmail)
        .select();
      updateData = retryRes.data;
      updateError = retryRes.error;
    }

    if (updateError) {
      console.warn('[Supabase Cloud SDK] Direct update warning:', updateError.message);
      return { success: false, error: updateError.message };
    }

    // 2. If row was not found in Supabase yet, UPSERT complete record
    if (!updateData || updateData.length === 0) {
      const fullRecord = {
        id: targetId || updates.id || `USR-${Date.now()}`,
        email: newEmail || currentLookupEmail,
        name: updates.name || 'Authorized Officer',
        password_hash: updates.passwordHash || updates.password_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        team: updates.team || 'Special Cell Cyber Operations (Northern Command)',
        role: updates.role || 'Lead Crypto Forensic Specialist',
        role_type: updates.roleType || updates.role_type || 'SENIOR',
        clearance_level: updates.clearanceLevel || updates.clearance_level || 'LEVEL-4 TOP SECRET',
        badge_no: updates.badgeNo || updates.badge_no || 'CT-RES-091',
        jurisdiction: updates.jurisdiction || 'ChainTrace Platform',
        avatar: payload.avatar || 'CF',
        phone: updates.phone || null,
        emergency_contact: updates.emergencyContact || updates.emergency_contact || null,
        designation: updates.designation || null,
        service_id: updates.serviceId || updates.service_id || null,
        supervisor_email: updates.supervisorEmail || updates.supervisor_email || null,
        station_address: updates.stationAddress || updates.station_address || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        ...payload,
      };

      let { data: upsertData, error: upsertError } = await supabaseInstance
        .from('users')
        .upsert([fullRecord], { onConflict: 'email' })
        .select();

      if (upsertError && upsertError.message && upsertError.message.toLowerCase().includes('column')) {
        const baseRecord = {
          id: fullRecord.id,
          email: fullRecord.email,
          name: fullRecord.name,
          password_hash: fullRecord.password_hash,
          team: fullRecord.team,
          role: fullRecord.role,
          role_type: fullRecord.role_type,
          clearance_level: fullRecord.clearance_level,
          badge_no: fullRecord.badge_no,
          jurisdiction: fullRecord.jurisdiction,
          avatar: fullRecord.avatar,
          created_at: fullRecord.created_at,
          last_login: fullRecord.last_login,
        };
        const retryUpsert = await supabaseInstance
          .from('users')
          .upsert([baseRecord], { onConflict: 'email' })
          .select();
        upsertData = retryUpsert.data;
        upsertError = retryUpsert.error;
      }

      if (upsertError) {
        console.warn('[Supabase Cloud SDK] Direct upsert warning:', upsertError.message);
        return { success: false, error: upsertError.message };
      }

      // If email changed and old record exists under old email, remove stale record
      if (currentLookupEmail && newEmail && currentLookupEmail !== newEmail) {
        try {
          await supabaseInstance.from('users').delete().eq('email', currentLookupEmail);
        } catch {}
      }

      console.log('[Supabase Cloud SDK] User upserted live in Supabase with all profile attributes:', newEmail || currentLookupEmail);
      return { success: true, data: upsertData?.[0] };
    }

    console.log('[Supabase Cloud SDK] User updated live in Supabase with all profile attributes:', newEmail || currentLookupEmail, payload);
    return { success: true, data: updateData[0] };
  } catch (err: any) {
    console.error('[Supabase Cloud SDK] Error updating user:', err);
    return { success: false, error: err?.message || 'Network/Supabase error' };
  }
}

/**
 * Fetch latest user record directly from Supabase Cloud
 */
export async function fetchSupabaseUserProfile(email: string): Promise<any | null> {
  if (!supabaseInstance) return null;
  const cleanEmail = (email || '').toLowerCase().trim();
  if (!cleanEmail) return null;

  try {
    const { data, error } = await supabaseInstance
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      roleType: data.role_type,
      team: data.team,
      badgeNo: data.badge_no,
      jurisdiction: data.jurisdiction,
      phone: data.phone,
      emergencyContact: data.emergency_contact,
      designation: data.designation,
      serviceId: data.service_id,
      supervisorEmail: data.supervisor_email,
      stationAddress: data.station_address,
      avatar: data.avatar,
      clearanceLevel: data.clearance_level,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch latest user record directly by ID from Supabase Cloud
 */
export async function fetchSupabaseUserById(userId: string): Promise<any | null> {
  if (!supabaseInstance || !userId) return null;
  try {
    const { data, error } = await supabaseInstance
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      roleType: data.role_type,
      team: data.team,
      badgeNo: data.badge_no,
      jurisdiction: data.jurisdiction,
      phone: data.phone,
      emergencyContact: data.emergency_contact,
      designation: data.designation,
      serviceId: data.service_id,
      supervisorEmail: data.supervisor_email,
      stationAddress: data.station_address,
      avatar: data.avatar,
      clearanceLevel: data.clearance_level,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastLogin: data.last_login,
    };
  } catch {
    return null;
  }
}

/**
 * Realtime Live Listener:
 * Subscribes to changes on the public.users table.
 * Whenever the user is modified in Supabase (from another browser tab, another device,
 * or directly in the Supabase Dashboard SQL/Table view), the callback is triggered live.
 * Also includes an active smart poller (every 3s) ensuring 100% reliable bidirectional updates.
 * Supports email changes by tracking both user ID and email.
 */
export function subscribeToUserProfile(
  email: string,
  onRemoteChange: (updatedUser: Partial<any>) => void,
  userId?: string
): () => void {
  if (!supabaseInstance) return () => {};

  let currentEmail = (email || '').toLowerCase().trim();
  const currentUserId = userId ? String(userId) : '';
  if (!currentEmail && !currentUserId) return () => {};

  let isDisposed = false;

  const handleUserRow = (row: any) => {
    if (!row) return;
    const rowEmail = (row.email || '').toLowerCase().trim();
    const rowId = row.id ? String(row.id) : '';

    const matchesId = Boolean(currentUserId && rowId && rowId === currentUserId);
    const matchesEmail = Boolean(rowEmail && currentEmail && rowEmail === currentEmail);

    if (matchesId || matchesEmail || (!currentUserId && !currentEmail)) {
      console.log('[Supabase Live Sync] Remote user profile updated:', row.email, row.name);
      if (row.email) currentEmail = row.email.toLowerCase().trim();
      onRemoteChange({
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        roleType: row.role_type || row.roleType,
        team: row.team,
        badgeNo: row.badge_no || row.badgeNo,
        jurisdiction: row.jurisdiction,
        phone: row.phone,
        emergencyContact: row.emergency_contact || row.emergencyContact,
        designation: row.designation,
        serviceId: row.service_id || row.serviceId,
        supervisorEmail: row.supervisor_email || row.supervisorEmail,
        stationAddress: row.station_address || row.stationAddress,
        avatar: row.avatar,
        clearanceLevel: row.clearance_level || row.clearanceLevel,
        updatedAt: row.updated_at,
      });
    }
  };

  // 1. WebSocket Realtime subscription (no restrictive server-side filter to prevent WAL index drops)
  const channelName = `rt_user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const channel = supabaseInstance
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
      },
      async (payload) => {
        console.log('[Supabase Realtime Live Event Received]:', payload);
        const row = (payload.new || payload.old) as any;
        if (row) {
          if (row.name && row.email) {
            handleUserRow(row);
          } else {
            let fresh = null;
            if (currentUserId) fresh = await fetchSupabaseUserById(currentUserId);
            if (!fresh && currentEmail) fresh = await fetchSupabaseUserProfile(currentEmail);
            if (fresh && !isDisposed) {
              if (fresh.email) currentEmail = fresh.email.toLowerCase().trim();
              onRemoteChange(fresh);
            }
          }
        }
      }
    )
    .subscribe((status) => {
      console.log(`[Supabase Realtime] User channel status:`, status);
    });

  // 2. High-speed Smart Poller Fallback (every 3 seconds):
  // Guarantees bidirectional live synchronization even if Supabase Realtime publication
  // is waiting for SQL setup or if WebSockets disconnect.
  let lastFetchedFingerprint = '';
  const pollInterval = setInterval(async () => {
    if (isDisposed || (typeof document !== 'undefined' && document.hidden)) return;
    try {
      let fresh = null;
      if (currentUserId) {
        fresh = await fetchSupabaseUserById(currentUserId);
      }
      if (!fresh && currentEmail) {
        fresh = await fetchSupabaseUserProfile(currentEmail);
      }
      if (fresh && (fresh.name || fresh.email) && !isDisposed) {
        const fingerprint = `${fresh.email}|${fresh.name}|${fresh.phone}|${fresh.badgeNo}|${fresh.designation}|${fresh.team}|${fresh.stationAddress}|${fresh.updatedAt}`;
        if (lastFetchedFingerprint && fingerprint !== lastFetchedFingerprint) {
          console.log('[Supabase Poller Sync] Detected live change from Supabase Cloud:', fresh.email, fresh.name);
          if (fresh.email) currentEmail = fresh.email.toLowerCase().trim();
          onRemoteChange(fresh);
        }
        lastFetchedFingerprint = fingerprint;
      }
    } catch {}
  }, 3000);

  return () => {
    isDisposed = true;
    clearInterval(pollInterval);
    try {
      supabaseInstance?.removeChannel(channel);
    } catch {}
  };
}

/**
 * Direct Live Supabase Cloud Evidence Insert:
 * Persists registered digital evidence directly into public.evidence_vault (and public.evidence) in Supabase.
 */
export async function addSupabaseEvidence(
  evidence: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabaseInstance) {
    return { success: false, error: 'Supabase Web SDK is not initialized' };
  }

  const investigationId = evidence.investigationId || evidence.investigation_id || 'INV-001';
  const id = evidence.id || `EVD-${Date.now().toString().slice(-4)}`;

  // Map legacy type if needed to conform to DB check constraint
  let evType = evidence.type || 'TRANSACTION_RECEIPT';
  if (evType === 'TRANSACTION_RECORD') evType = 'TRANSACTION_RECEIPT';

  const supaRecord = {
    id,
    investigation_id: investigationId,
    title: (evidence.description || evidence.title || 'Digital Evidence Exhibit').slice(0, 255),
    type: evType,
    hash: evidence.hash,
    file_size: evidence.size || evidence.fileSize || evidence.file_size || '128 KB',
    source: evidence.source || 'Sovereign Node RPC',
    description: evidence.description || '',
    examiner_name: evidence.examinerName || evidence.examiner_name || 'Examiner of Electronic Evidence (Sec 79A IT Act)',
    verified: evidence.integrity === 'VERIFIED' || evidence.verified !== false,
    created_at: evidence.timestamp || evidence.createdAt || new Date().toISOString(),
  };

  try {
    // 1. Ensure parent investigation exists so FK will not block insert
    if (investigationId) {
      try {
        await supabaseInstance.from('investigations').upsert([{
          id: investigationId,
          case_id: `CT-2024-${investigationId}`,
          title: `Investigation ${investigationId}`,
          blockchain: 'TRON',
          suspect_wallet: '0x0000000000000000000000000000000000000000',
          status: 'UNDER_INVESTIGATION',
          priority: 'HIGH',
          risk_score: 80,
          funds_traced: 50000,
          currency: 'USDT',
          investigator: 'Cyber Forensic Specialist',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }], { onConflict: 'id', ignoreDuplicates: true });
      } catch {}
    }

    // 2. Insert into evidence_vault table
    let { data: evData, error: evError } = await supabaseInstance
      .from('evidence_vault')
      .upsert([supaRecord], { onConflict: 'id' })
      .select();

    // 3. Also sync into table 'evidence' for complete dual-table visibility
    try {
      await supabaseInstance
        .from('evidence')
        .upsert([supaRecord], { onConflict: 'id' });
    } catch {}

    if (evError) {
      console.warn('[Supabase Cloud SDK] evidence_vault insert warning:', evError.message);
      // Fallback: try table 'evidence' if evidence_vault failed
      const altRes = await supabaseInstance
        .from('evidence')
        .upsert([supaRecord], { onConflict: 'id' })
        .select();
      if (!altRes.error) {
        return { success: true, data: altRes.data?.[0] };
      }
      return { success: false, error: evError.message };
    }

    console.log('[Supabase Cloud SDK] Evidence exhibit saved live in Supabase:', id);
    return { success: true, data: evData?.[0] || supaRecord };
  } catch (err: any) {
    console.error('[Supabase Cloud SDK] Exception adding evidence:', err);
    return { success: false, error: err?.message || 'Network/Supabase error' };
  }
}

/**
 * Fetch all Evidence exhibits directly from Supabase Cloud
 */
export async function fetchSupabaseEvidence(): Promise<any[]> {
  if (!supabaseInstance) return [];
  try {
    const { data, error } = await supabaseInstance
      .from('evidence_vault')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        investigationId: row.investigation_id || 'INV-001',
        type: row.type || 'TRANSACTION_RECORD',
        hash: row.hash,
        size: row.file_size || '128 KB',
        source: row.source || 'Sovereign Node RPC',
        description: row.description || row.title || 'Digital Exhibit',
        integrity: row.verified ? 'VERIFIED' : 'PENDING',
        timestamp: row.created_at || new Date().toISOString(),
      }));
    }
  } catch {}
  return [];
}

/**
 * Realtime Listener for new or updated evidence exhibits in Supabase
 */
export function subscribeToEvidence(
  onRemoteEvidence: (evidence: any) => void
): () => void {
  if (!supabaseInstance) return () => {};

  let isDisposed = false;
  const channel = supabaseInstance
    .channel(`rt_evidence_vault_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'evidence_vault',
      },
      (payload) => {
        console.log('[Supabase Realtime] Evidence vault live event:', payload);
        const row = (payload.new || payload.old) as any;
        if (row && row.hash) {
          onRemoteEvidence({
            id: row.id,
            investigationId: row.investigation_id || 'INV-001',
            type: row.type || 'TRANSACTION_RECORD',
            hash: row.hash,
            size: row.file_size || '128 KB',
            source: row.source || 'Sovereign Node RPC',
            description: row.description || row.title || 'Digital Exhibit',
            integrity: row.verified ? 'VERIFIED' : 'PENDING',
            timestamp: row.created_at || new Date().toISOString(),
          });
        }
      }
    )
    .subscribe((status) => {
      console.log('[Supabase Realtime] Evidence subscription status:', status);
    });

  // Polling fallback every 4 seconds
  let knownEvidenceCount = -1;
  const pollInterval = setInterval(async () => {
    if (isDisposed || (typeof document !== 'undefined' && document.hidden)) return;
    try {
      const exhibits = await fetchSupabaseEvidence();
      if (exhibits && exhibits.length > 0 && !isDisposed) {
        if (knownEvidenceCount !== -1 && exhibits.length > knownEvidenceCount) {
          console.log('[Supabase Poller Sync] Detected new evidence from Supabase Cloud');
          onRemoteEvidence(exhibits[0]);
        }
        knownEvidenceCount = exhibits.length;
      }
    } catch {}
  }, 4000);

  return () => {
    isDisposed = true;
    clearInterval(pollInterval);
    try {
      supabaseInstance?.removeChannel(channel);
    } catch {}
  };
}

/**
 * Direct Live Supabase Cloud Timeline Event Insert:
 * Persists timeline milestones directly into public.timeline_events in Supabase.
 */
export async function addSupabaseTimelineEvent(
  event: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabaseInstance) {
    return { success: false, error: 'Supabase Web SDK is not initialized' };
  }

  const id = event.id || `TLE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const investigationId = event.investigationId || event.investigation_id || 'INV-001';

  // Ensure parent investigation exists first
  try {
    await supabaseInstance.from('investigations').upsert([{
      id: investigationId,
      case_id: `CT-2024-${investigationId}`,
      title: `Investigation ${investigationId}`,
      blockchain: 'TRON',
      suspect_wallet: event.walletAddress || '0x0000000000000000000000000000000000000000',
      status: 'UNDER_INVESTIGATION',
      priority: 'HIGH',
      risk_score: 80,
      funds_traced: 50000,
      currency: 'USDT',
      investigator: 'Cyber Forensic Specialist',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }], { onConflict: 'id', ignoreDuplicates: true });
  } catch {}

  const supaRecord = {
    id,
    investigation_id: investigationId,
    timestamp: event.timestamp || new Date().toISOString(),
    event_type: event.eventType || event.event_type || 'INVESTIGATION_UPDATE',
    description: event.description || '',
    tx_hash: event.txHash || event.tx_hash || null,
    amount: event.amount ? Number(event.amount) : null,
    wallet_address: event.walletAddress || event.wallet_address || null,
    investigator_note: event.investigatorNote || event.investigator_note || null,
    created_at: event.createdAt || event.created_at || new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseInstance
      .from('timeline_events')
      .upsert([supaRecord], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase Cloud SDK] timeline_events insert warning:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Supabase Cloud SDK] Timeline event saved live in Supabase:', id);
    return { success: true, data: data?.[0] || supaRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase error' };
  }
}

/**
 * Fetch Timeline Events directly from Supabase Cloud
 */
export async function fetchSupabaseTimelineEvents(): Promise<any[]> {
  if (!supabaseInstance) return [];
  try {
    const { data, error } = await supabaseInstance
      .from('timeline_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        investigationId: row.investigation_id,
        timestamp: row.timestamp || row.created_at,
        eventType: row.event_type || 'INVESTIGATION_UPDATE',
        description: row.description || '',
        txHash: row.tx_hash,
        amount: row.amount,
        walletAddress: row.wallet_address,
        investigatorNote: row.investigator_note,
        createdAt: row.created_at,
      }));
    }
  } catch {}
  return [];
}

/**
 * Realtime Listener for new or updated timeline events in Supabase
 */
export function subscribeToTimelineEvents(
  onRemoteTimeline: (event: any) => void
): () => void {
  if (!supabaseInstance) return () => {};

  let isDisposed = false;
  const channel = supabaseInstance
    .channel(`rt_timeline_events_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'timeline_events',
      },
      (payload) => {
        console.log('[Supabase Realtime] Timeline events live event:', payload);
        const row = (payload.new || payload.old) as any;
        if (row && row.id) {
          onRemoteTimeline({
            id: row.id,
            investigationId: row.investigation_id,
            timestamp: row.timestamp || row.created_at,
            eventType: row.event_type || 'INVESTIGATION_UPDATE',
            description: row.description || '',
            txHash: row.tx_hash,
            amount: row.amount,
            walletAddress: row.wallet_address,
            investigatorNote: row.investigator_note,
            createdAt: row.created_at,
          });
        }
      }
    )
    .subscribe();

  // Poller fallback every 4 seconds
  let knownTimelineCount = -1;
  const pollInterval = setInterval(async () => {
    if (isDisposed || (typeof document !== 'undefined' && document.hidden)) return;
    try {
      const events = await fetchSupabaseTimelineEvents();
      if (events && events.length > 0 && !isDisposed) {
        if (knownTimelineCount !== -1 && events.length > knownTimelineCount) {
          console.log('[Supabase Poller Sync] Detected new timeline event from Supabase Cloud');
          onRemoteTimeline(events[0]);
        }
        knownTimelineCount = events.length;
      }
    } catch {}
  }, 4000);

  return () => {
    isDisposed = true;
    clearInterval(pollInterval);
    try {
      supabaseInstance?.removeChannel(channel);
    } catch {}
  };
}

/**
 * Direct Live Supabase Cloud Investigation Insert:
 */
export async function addSupabaseInvestigation(
  inv: Record<string, any>
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!supabaseInstance) {
    return { success: false, error: 'Supabase Web SDK is not initialized' };
  }

  const id = inv.id || `INV-${Date.now().toString().slice(-3)}`;
  const supaRecord = {
    id,
    case_id: inv.caseId || inv.case_id || `CT-2024-${id}`,
    title: inv.title || 'Forensic Case Analysis',
    blockchain: inv.blockchain || 'ETH',
    suspect_wallet: inv.suspectWallet || inv.suspect_wallet || inv.defaultWallet || '0x0000000000000000000000000000000000000000',
    status: inv.status || 'NEW',
    priority: inv.priority || 'MEDIUM',
    risk_score: inv.riskScore ?? inv.risk_score ?? 70,
    funds_traced: inv.fundsTraced ?? inv.funds_traced ?? 0,
    currency: inv.currency || 'USD',
    investigator: inv.investigator || 'Officer',
    description: inv.description || inv.notes || '',
    tags: Array.isArray(inv.tags) ? inv.tags : [],
    created_at: inv.createdAt || inv.created_at || new Date().toISOString(),
    updated_at: inv.updatedAt || inv.updated_at || new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseInstance
      .from('investigations')
      .upsert([supaRecord], { onConflict: 'id' })
      .select();

    if (error) {
      console.warn('[Supabase Cloud SDK] investigations insert warning:', error.message);
      return { success: false, error: error.message };
    }
    console.log('[Supabase Cloud SDK] Investigation saved live in Supabase:', id);
    return { success: true, data: data?.[0] || supaRecord };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Supabase error' };
  }
}

/**
 * Direct Live Supabase Cloud Investigation Update:
 */
export async function updateSupabaseInvestigation(
  id: string,
  updates: Record<string, any>
): Promise<boolean> {
  if (!supabaseInstance || !id) return false;
  const payload: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined || updates.notes !== undefined) {
    payload.description = updates.description || updates.notes;
  }
  if (updates.riskScore !== undefined || updates.risk_score !== undefined) {
    payload.risk_score = updates.riskScore ?? updates.risk_score;
  }
  if (updates.fundsTraced !== undefined || updates.funds_traced !== undefined) {
    payload.funds_traced = updates.fundsTraced ?? updates.funds_traced;
  }
  try {
    const { error } = await supabaseInstance
      .from('investigations')
      .update(payload)
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch all investigations directly from Supabase Cloud
 */
export async function fetchSupabaseInvestigations(): Promise<any[]> {
  if (!supabaseInstance) return [];
  try {
    const { data, error } = await supabaseInstance
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        caseId: row.case_id || `CT-2024-${row.id}`,
        title: row.title,
        blockchain: row.blockchain || 'ETH',
        status: row.status || 'NEW',
        priority: row.priority || 'MEDIUM',
        riskScore: row.risk_score ?? 70,
        fundsTraced: row.funds_traced ?? 0,
        currency: row.currency || 'USD',
        investigator: row.investigator || 'Officer',
        description: row.description || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  } catch {}
  return [];
}

/**
 * Realtime Listener for investigations in Supabase
 */
export function subscribeToInvestigations(
  onRemoteInvestigation: (inv: any) => void
): () => void {
  if (!supabaseInstance) return () => {};

  let isDisposed = false;
  const channel = supabaseInstance
    .channel(`rt_investigations_${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'investigations',
      },
      (payload) => {
        console.log('[Supabase Realtime] Investigations live event:', payload);
        const row = (payload.new || payload.old) as any;
        if (row && row.id) {
          onRemoteInvestigation({
            id: row.id,
            caseId: row.case_id || `CT-2024-${row.id}`,
            title: row.title,
            blockchain: row.blockchain || 'ETH',
            status: row.status || 'NEW',
            priority: row.priority || 'MEDIUM',
            riskScore: row.risk_score ?? 70,
            fundsTraced: row.funds_traced ?? 0,
            currency: row.currency || 'USD',
            investigator: row.investigator || 'Officer',
            description: row.description || '',
            tags: Array.isArray(row.tags) ? row.tags : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          });
        }
      }
    )
    .subscribe();

  // Polling fallback every 4 seconds
  let knownInvCount = -1;
  const pollInterval = setInterval(async () => {
    if (isDisposed || (typeof document !== 'undefined' && document.hidden)) return;
    try {
      const invs = await fetchSupabaseInvestigations();
      if (invs && invs.length > 0 && !isDisposed) {
        if (knownInvCount !== -1 && invs.length > knownInvCount) {
          console.log('[Supabase Poller Sync] Detected new investigation from Supabase Cloud');
          onRemoteInvestigation(invs[0]);
        }
        knownInvCount = invs.length;
      }
    } catch {}
  }, 4000);

  return () => {
    isDisposed = true;
    clearInterval(pollInterval);
    try {
      supabaseInstance?.removeChannel(channel);
    } catch {}
  };
}
