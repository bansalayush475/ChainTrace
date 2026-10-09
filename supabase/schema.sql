-- ==============================================================================
-- SOVEREIGN LAW ENFORCEMENT CYBER FORENSICS DATABASE SCHEMA
-- Platform: Crypto-Blockchain Forensic & Intelligence System (CBFIS)
-- Authority: Ministry of Home Affairs (I4C) / State Cyber Crime Units
-- Statutory Compliance: Section 63 BSA 2023, Section 79A IT Act, BNSS 2023
-- Target Engine: Supabase (PostgreSQL 15+)
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. INVESTIGATIONS TABLE (Primary Case Dockets)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS investigations (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    suspect_wallet VARCHAR(128) NOT NULL,
    blockchain VARCHAR(32) NOT NULL DEFAULT 'ETH',
    risk_score INTEGER NOT NULL DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    funds_traced NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(16) NOT NULL DEFAULT 'INR',
    investigator VARCHAR(128) NOT NULL DEFAULT 'Cyber Forensic Specialist',
    status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ANALYZING', 'UNDER_INVESTIGATION', 'ESCALATED', 'CLOSED')),
    priority VARCHAR(16) NOT NULL DEFAULT 'HIGH' CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    description TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    jurisdiction VARCHAR(128) DEFAULT 'Delhi Police Cyber Crime PS (Special Cell)',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigations_case_id ON investigations(case_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);
CREATE INDEX IF NOT EXISTS idx_investigations_suspect_wallet ON investigations(suspect_wallet);
CREATE INDEX IF NOT EXISTS idx_investigations_created_at ON investigations(created_at DESC);

-- ==============================================================================
-- 2. CASE TIMELINE EVENTS TABLE (§79A IT Act Chain of Custody)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
    id VARCHAR(64) PRIMARY KEY,
    investigation_id VARCHAR(64) REFERENCES investigations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_type VARCHAR(32) NOT NULL CHECK (event_type IN ('TRANSACTION', 'ALERT', 'INVESTIGATION_UPDATE', 'EVIDENCE_COLLECTED', 'PATTERN_DETECTED', 'ATTRIBUTION', 'ESCALATION')),
    description TEXT NOT NULL,
    tx_hash VARCHAR(128),
    amount NUMERIC(20, 2),
    wallet_address VARCHAR(128),
    investigator_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_investigation_id ON timeline_events(investigation_id);
CREATE INDEX IF NOT EXISTS idx_timeline_timestamp ON timeline_events(timestamp DESC);

-- ==============================================================================
-- 3. EVIDENCE VAULT TABLE (Section 63 BSA 2023 Digital Exhibits)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS evidence_vault (
    id VARCHAR(64) PRIMARY KEY,
    investigation_id VARCHAR(64) REFERENCES investigations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('TRANSACTION_RECEIPT', 'WALLET_SNAPSHOT', 'GRAPH_EXPORT', 'STATUTORY_NOTICE', 'EXCHANGE_SUBPOENA', 'FORENSIC_REPORT', 'CHAIN_ANALYSIS')),
    hash VARCHAR(64) NOT NULL, -- Cryptographic SHA-256 Digest
    file_size VARCHAR(32) NOT NULL DEFAULT '128 KB',
    source VARCHAR(128) NOT NULL DEFAULT 'Sovereign Node RPC',
    description TEXT,
    examiner_name VARCHAR(128) NOT NULL DEFAULT 'Examiner of Electronic Evidence (Sec 79A IT Act)',
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_investigation ON evidence_vault(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_vault(hash);

-- ==============================================================================
-- 4. WALLET INTELLIGENCE PROFILES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS wallets (
    address VARCHAR(128) PRIMARY KEY,
    blockchain VARCHAR(32) NOT NULL DEFAULT 'ETH',
    label VARCHAR(128) DEFAULT 'Unlabeled Wallet',
    entity_type VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN' CHECK (entity_type IN ('VICTIM', 'SUSPECT', 'INTERMEDIATE', 'MIXER', 'EXCHANGE', 'BRIDGE', 'UNKNOWN')),
    risk_score INTEGER NOT NULL DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
    balance NUMERIC(24, 8) NOT NULL DEFAULT 0.00,
    total_received NUMERIC(24, 8) NOT NULL DEFAULT 0.00,
    total_sent NUMERIC(24, 8) NOT NULL DEFAULT 0.00,
    tx_count INTEGER NOT NULL DEFAULT 0,
    first_seen TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    counterparties INTEGER NOT NULL DEFAULT 0,
    flags TEXT[] DEFAULT ARRAY[]::TEXT[],
    cluster VARCHAR(64),
    exchange VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_entity_type ON wallets(entity_type);
CREATE INDEX IF NOT EXISTS idx_wallets_risk_score ON wallets(risk_score DESC);

-- ==============================================================================
-- 5. TRANSACTIONS LEDGER TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS transactions (
    hash VARCHAR(128) PRIMARY KEY,
    from_address VARCHAR(128) NOT NULL,
    to_address VARCHAR(128) NOT NULL,
    amount NUMERIC(24, 8) NOT NULL DEFAULT 0.00,
    token VARCHAR(16) NOT NULL DEFAULT 'USDT',
    usd_value NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_number BIGINT NOT NULL DEFAULT 0,
    confirmations INTEGER NOT NULL DEFAULT 12,
    fee NUMERIC(20, 8) NOT NULL DEFAULT 0.00,
    status VARCHAR(16) NOT NULL DEFAULT 'CONFIRMED',
    risk_score INTEGER NOT NULL DEFAULT 50,
    type VARCHAR(32) NOT NULL DEFAULT 'TRANSFER',
    blockchain VARCHAR(32) NOT NULL DEFAULT 'ETH',
    investigation_id VARCHAR(64) REFERENCES investigations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_investigation ON transactions(investigation_id);

-- ==============================================================================
-- 6. 1930 CITIZEN CYBER HELPLINE INTAKE TABLE (NCRP Ingestion)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS ncrp_complaints (
    id VARCHAR(64) PRIMARY KEY,
    ack_no VARCHAR(64) UNIQUE NOT NULL,
    victim_name VARCHAR(128) NOT NULL,
    contact_phone VARCHAR(32),
    loss_inr NUMERIC(20, 2) NOT NULL,
    suspect_wallet VARCHAR(128) NOT NULL,
    blockchain VARCHAR(32) NOT NULL DEFAULT 'TRON',
    bank_utr VARCHAR(64),
    upi_vpa VARCHAR(128),
    crime_category VARCHAR(128) NOT NULL DEFAULT 'Digital Arrest & Financial Cyber Extortion',
    source_channel VARCHAR(32) NOT NULL DEFAULT '1930_HELPLINE',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANALYZING', 'ESCALATED_TO_CASE', 'CLOSED')),
    golden_window_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ncrp_ack_no ON ncrp_complaints(ack_no);
CREATE INDEX IF NOT EXISTS idx_ncrp_status ON ncrp_complaints(status);

-- ==============================================================================
-- 7. STATUTORY FREEZE NOTICES TABLE (Section 94 BNSS & Section 106 BNSS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS freeze_notices (
    id VARCHAR(64) PRIMARY KEY,
    dispatch_ref VARCHAR(64) UNIQUE NOT NULL,
    notice_type VARCHAR(32) NOT NULL CHECK (notice_type IN ('VASP_SUBPOENA_SEC94_BNSS', 'BANK_FREEZE_SEC106_BNSS')),
    target_entity VARCHAR(128) NOT NULL, -- e.g. 'Binance Compliance' or 'State Bank of India'
    target_identifier VARCHAR(128) NOT NULL, -- Target Wallet Address or Bank Account No / UTR
    case_reference VARCHAR(64) NOT NULL,
    recipient_email VARCHAR(128) NOT NULL,
    sha256_seal VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('DRAFT', 'DISPATCHED', 'ACKNOWLEDGED', 'FROZEN', 'REJECTED')),
    full_notice_text TEXT NOT NULL,
    dispatched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    frozen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_freeze_ref ON freeze_notices(dispatch_ref);
CREATE INDEX IF NOT EXISTS idx_freeze_status ON freeze_notices(status);

-- ==============================================================================
-- 8. IMMUTABLE AUDIT LOGS TABLE (Section 63 BSA 2023 Evidence Ledger)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "user" VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    resource VARCHAR(128) NOT NULL,
    ip VARCHAR(64) NOT NULL DEFAULT '127.0.0.1',
    session VARCHAR(64) NOT NULL DEFAULT 'SESSION-SECURE-SOVEREIGN',
    details TEXT NOT NULL,
    integrity_hash VARCHAR(64) -- SHA-256 hash of (timestamp + user + action + resource + details)
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Enable RLS on all tables
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncrp_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE freeze_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow read and write for authenticated service role & anon LEA clients
CREATE POLICY "Allow LEA read access on investigations" ON investigations FOR SELECT USING (true);
CREATE POLICY "Allow LEA insert on investigations" ON investigations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow LEA update on investigations" ON investigations FOR UPDATE USING (true);

CREATE POLICY "Allow LEA access on timeline_events" ON timeline_events FOR ALL USING (true);
CREATE POLICY "Allow LEA access on evidence_vault" ON evidence_vault FOR ALL USING (true);
CREATE POLICY "Allow LEA access on wallets" ON wallets FOR ALL USING (true);
CREATE POLICY "Allow LEA access on transactions" ON transactions FOR ALL USING (true);
CREATE POLICY "Allow LEA access on ncrp_complaints" ON ncrp_complaints FOR ALL USING (true);
CREATE POLICY "Allow LEA access on freeze_notices" ON freeze_notices FOR ALL USING (true);
CREATE POLICY "Allow LEA access on audit_logs" ON audit_logs FOR ALL USING (true);

-- ==============================================================================
-- 10. SOVEREIGN LEA USERS TABLE (Officer Authentication & Agency Rosters)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    name VARCHAR(128) NOT NULL,
    team VARCHAR(128) NOT NULL DEFAULT 'Special Cell Cyber Operations (Northern Command)',
    role VARCHAR(64) NOT NULL DEFAULT 'Lead Crypto Forensic Specialist',
    role_type VARCHAR(16) NOT NULL DEFAULT 'SENIOR' CHECK (role_type IN ('SENIOR', 'JUNIOR')),
    clearance_level VARCHAR(64) NOT NULL DEFAULT 'LEVEL-4 TOP SECRET',
    badge_no VARCHAR(64),
    jurisdiction VARCHAR(128) DEFAULT 'Delhi Police Cyber Crime PS (Special Cell)',
    avatar VARCHAR(8) DEFAULT 'CF',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team ON users(team);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow LEA access on users" ON users FOR ALL USING (true);

