# ChainTrace: Sovereign Blockchain Forensics Platform (Project Viva Report)

## 1. Project Introduction & Objectives
**ChainTrace** is a comprehensive, enterprise-grade Cyber Forensics and Intelligence platform designed for Law Enforcement Agencies (LEAs). Its primary objective is to trace illicit cryptocurrency transactions, manage cybercrime investigations, and generate statutory compliance reports (under Section 63 BSA and Section 79A IT Act).

## 2. Technical Stack & Architecture
The project follows a modern **Monolithic-BFF (Backend-For-Frontend)** architecture utilizing a dual-mode execution environment.

### Frontend (Client-Side)
- **Framework:** React 19 with TypeScript.
- **Build Tool:** Vite 8 (Ultra-fast HMR and bundling).
- **Styling:** Tailwind CSS v4 for utility-first responsive design, framer-motion for fluid animations.
- **State Management:** Zustand (lightweight, unopinionated state management for alerts, user sessions, and theme).
- **Routing:** React Router DOM v7 for Client-Side Routing (SPA).
- **Data Visualization:** Recharts (for analytics) and React Flow (for complex wallet transaction fund-flow graphs).

### Backend (Server-Side)
- **Framework:** Node.js with Express.js (v5.2).
- **Architecture:** API-driven RESTful backend.
- **Middleware Integration:** The backend is cleverly mounted directly onto the Vite development server using a custom plugin (cbfisApiPlugin in ite.config.ts). This eliminates Cross-Origin Resource Sharing (CORS) issues and allows both frontend and backend to run seamlessly on port 8443 during development.

### Database (Data Layer)
- **Primary Database:** Supabase (Cloud PostgreSQL).
- **Offline Resilience (Fallback):** If the cloud database is unreachable (e.g., network failure or missing API keys), the system automatically gracefully degrades to a **Local File Persistence Engine**, reading and writing to server/data/db.json using the Node.js File System (s) module. This guarantees the platform remains operational in secure, air-gapped environments.

---

## 3. Comprehensive Database Schema & SQL Queries

The platform utilizes PostgreSQL. Below is a detailed breakdown of the tables and the underlying SQL concepts used:

### A. Investigations Table (Case Management)
Stores primary case dockets and tracks their lifecycle.
\\\sql
CREATE TABLE investigations (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) UNIQUE NOT NULL, -- e.g., NCRP Complaint ID
    title VARCHAR(255) NOT NULL,
    suspect_wallet VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'ANALYZING', 'CLOSED')),
    funds_traced NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Query used to fetch active dashboard cases:
-- SELECT * FROM investigations WHERE status != 'CLOSED' ORDER BY created_at DESC;
\\\

### B. Timeline Events Table (Chain of Custody)
Maintains a chronological, immutable log of actions taken during an investigation to ensure court admissibility.
\\\sql
CREATE TABLE timeline_events (
    id VARCHAR(64) PRIMARY KEY,
    investigation_id VARCHAR(64) REFERENCES investigations(id) ON DELETE CASCADE,
    event_type VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- The 'ON DELETE CASCADE' ensures that if a case is deleted, its timeline is automatically purged to maintain referential integrity.
\\\

### C. Evidence Vault Table (Section 63 BSA Compliance)
Stores metadata and cryptographic hashes of digital exhibits.
\\\sql
CREATE TABLE evidence_vault (
    id VARCHAR(64) PRIMARY KEY,
    investigation_id VARCHAR(64) REFERENCES investigations(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL,
    hash VARCHAR(64) NOT NULL, -- Stores the SHA-256 Digest of the file
    verified BOOLEAN NOT NULL DEFAULT TRUE
);
\\\

---

## 4. Application Programming Interfaces (APIs)

### Internal REST APIs (Built in Express)
1. **Authentication API (/api/auth/login, /api/auth/register)**
   - **Why:** To securely authenticate law enforcement officers.
   - **What it does:** Accepts email/password, hashes the password using cryptographic SHA-256, and compares it with the database. It also triggers the dispatch of a 6-digit MFA (Multi-Factor Authentication) OTP.
2. **Investigations API (/api/investigations)**
   - **Why:** To manage the lifecycle of cybercrime cases.
   - **What it does:** Provides CRUD (Create, Read, Update, Delete) operations for cases, tracking traced funds and updating risk scores.
3. **Evidence API (/api/evidence)**
   - **Why:** To handle statutory evidence tracking.
   - **What it does:** Logs new evidence submissions and verifies cryptographic hashes to prevent tampering.

### External APIs
1. **Blockscout / Etherscan API**
   - **Why:** To fetch real-world blockchain data.
   - **What it does:** The backend queries this API to map out the inputs and outputs of a suspect's wallet, generating the data structure needed for the React Flow graph visualization.
2. **EmailJS (Simulated SMTP)**
   - **Why:** For secure communication.
   - **What it does:** Dispatches login OTPs and system alerts to the officer's registered email address.

---

## 5. System Workflow & Data Flow

1. **Access & Authentication:**
   - The user visits the frontend URL.
   - They enter their credentials. The frontend sends a POST request to /api/auth/login.
   - The Express backend validates the credentials against PostgreSQL. If valid, an OTP is dispatched.
   - Once the OTP is verified, the server responds with the user's profile, and the React frontend saves this context using Zustand state management.

2. **Case Intake (NCRP Integration):**
   - The officer navigates to the "Bulk Triage" page.
   - They can upload a CSV of NCRP (National Cyber Crime Reporting Portal) complaints.
   - The frontend parses this data and sends it to the backend to bulk-create investigations records.

3. **Forensic Tracing & Visualization:**
   - The officer clicks on an investigation.
   - The frontend requests wallet data. The backend queries blockchain nodes (or simulated mock data) to trace the funds.
   - The data is returned as Nodes and Edges, which the React Flow library renders into a highly interactive Fund Flow Graph.

4. **Reporting & Compliance:**
   - When the investigation concludes, the officer clicks "Generate Report".
   - The frontend compiles the timeline, graphs, and transaction hashes into a PDF-ready layout.
   - An immutable record is inserted into the evidence_vault with a SHA-256 seal to ensure legal admissibility in court.

---

## 6. Key Features for Viva Explanation
- **Dual-Mode Backend Resilience:** Explain how the system never crashes during a demo. If the cloud database drops, it instantly seamlessly shifts to reading/writing from a local .json file.
- **Vite Proxy Architecture:** Explain how you avoided CORS (Cross-Origin Resource Sharing) errors by proxying /api requests directly through the Vite dev server into Express.
- **Cryptographic Security:** Emphasize that passwords and evidence files are never stored in plain text; they are secured using SHA-256 hashing algorithms.
- **Statutory Compliance:** Mention that the workflow is specifically designed to adhere to Indian Law (Section 79A IT Act, Section 63 BSA), making it a realistic Gov-Tech product.
