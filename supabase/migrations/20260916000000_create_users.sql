-- ==============================================================================
-- MIGRATION: 20260916000000_create_users.sql
-- Description: Creates the users table with dynamic LEA team & role mapping
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

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow LEA access on users'
    ) THEN
        CREATE POLICY "Allow LEA access on users" ON users FOR ALL USING (true);
    END IF;
END
$$;

-- Seed default LEA officers with SHA-256 cryptographic password hashes
INSERT INTO users (id, email, password_hash, name, team, role, role_type, clearance_level, badge_no, jurisdiction, avatar)
VALUES
    ('USR-001', 'arjun.sharma@cybercrime.gov.in', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Arjun Sharma', 'Special Cell Cyber Operations (Northern Command)', 'Lead Crypto Forensic Specialist', 'SENIOR', 'LEVEL-4 TOP SECRET', 'MHA-DEL-091', 'Delhi Police Cyber Crime PS (Special Cell)', 'AS'),
    ('USR-002', 'priya.patel@cybercrime.gov.in', '20249749412d73a3f5799f6f1dcf910e7b4aa3ce4de133b1f8a63c044792a4e9', 'Priya Patel', 'Maharashtra Cyber CID & Financial Tracing Unit', 'Junior Cyber Forensic Analyst', 'JUNIOR', 'LEVEL-2 CONFIDENTIAL', 'MH-MUM-402', 'Maharashtra Cyber CID (Mumbai HQ)', 'PP'),
    ('USR-003', 'rahul.verma@cybercrime.gov.in', '5b92db4dfb561dc69c949f34d36f5db0f8b30811be3a2949d85c5001279e9b1a', 'Rahul Verma', 'Darknet & Hawala Operations Desk', 'Senior Cryptocurrency Auditor', 'SENIOR', 'LEVEL-4 TOP SECRET', 'KA-BLR-189', 'Karnataka Cyber Crime PS (Bengaluru)', 'RV'),
    ('USR-004', 'karan.mehta@cybercrime.gov.in', '7ed76be808b72e0c6a6852d7e9dc304c609a9ebfd01bf84591fba0ab55b6cad2', 'Karan Mehta', 'VASP Interception & Subpoena Taskforce', 'Statutory Enforcement Specialist', 'SENIOR', 'LEVEL-3 RESTRICTED', 'GJ-AHM-209', 'Gujarat Cyber Crime Cell (Ahmedabad)', 'KM')
ON CONFLICT (email) DO NOTHING;
