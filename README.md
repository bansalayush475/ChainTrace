# ChainTrace: Sovereign Blockchain Forensics Platform

**ChainTrace** is an enterprise-grade Cyber Forensics and Intelligence platform engineered specifically for Law Enforcement Agencies (LEAs). It enables investigators to track illicit cryptocurrency transactions across multiple blockchains, manage cybercrime case dockets, and generate statutory compliance evidence logs under the latest digital evidence laws.

## 🚀 Enterprise Features

1. **Multi-Chain Fund Tracing**
   - Seamless tracking of digital assets across ETH, TRON, and BTC.
   - Interactive, auto-generated Directed Acyclic Graph (DAG) visualizations mapping out the flow of funds through intermediate wallets, bridges, and mixing services.
2. **NCRP (1930) Complaint Intake & Triage**
   - Direct pipeline for importing bulk cyber fraud complaints.
   - 1-click escalation of citizen complaints into formalized active investigations.
3. **Statutory Evidence Vault**
   - Automated generation of Subpoenas and Bank Debit Freeze orders.
   - Cryptographic **SHA-256 evidence sealing** compliant with Section 63 of the Bharatiya Sakshya Adhiniyam (BSA) and Section 79A of the IT Act.
4. **P2P & UPI Fiat Radar**
   - Real-time mapping of cryptocurrency-to-fiat off-ramps (e.g., Binance P2P, WazirX) correlated with compromised bank UTRs.
5. **Secure Authentication & Audit Logging**
   - Role-Based Access Control (RBAC) with cryptographic password hashing.
   - Multi-Factor Authentication (MFA) OTP dispatch via Email.
   - Immutable audit logs tracking every read/write action by an officer.

---

## 🏛️ Technical Architecture

ChainTrace utilizes a robust, dual-mode **Backend-For-Frontend (BFF)** architecture to ensure high security, zero CORS issues, and offline resilience.

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Flow (Graphs), Recharts.
- **Backend:** Node.js, Express.js v5.
- **Database:** Supabase (Cloud PostgreSQL) with an automated fallback to a Local File Persistence Engine (JSON) for maximum uptime during network outages.

### Zero-Friction Middleware
The Express backend is seamlessly mounted directly into Vite's server middleware (cbfisApiPlugin). This intercepts /api/* requests on port 8443 without requiring secondary terminals or external network routing, making deployment entirely frictionless.

---

## ⚖️ Statutory Law Compliance Matrix

ChainTrace is built in strict alignment with India's criminal and evidentiary codes:

| Act & Section | Operational Enforcement in ChainTrace |
| :--- | :--- |
| **Section 63 BSA, 2023** | Mandatory Certificate of Electronic Evidence with cryptographic SHA-256 verification hash |
| **Section 94 BNSS, 2023** | Statutory Subpoenas issued to Virtual Asset Service Providers (VASPs) for KYC logs |
| **Section 106 BNSS, 2023** | Immediate Total Debit Freeze orders served upon commercial banks and NPCI switches |
| **Section 79A IT Act, 2000** | Cryptographically sealed tamper-evident audit logs |

---

## 🛠️ Quickstart Guide

### Prerequisites
- Node.js 20+ (Node 22 or 24 recommended)
- pnpm or 
pm

### Installation
\\\ash
# Clone the repository
git clone https://github.com/bansalayush475/ChainTrace.git
cd ChainTrace

# Install dependencies
pnpm install
# or: npm install
\\\

### Configuration (Supabase Cloud Database)
Copy the environment template:
\\\ash
cp .env.example .env
\\\
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and run the schema defined in \supabase/schema.sql\.
3. Set your project URL and Anon Key in \.env\:
\\\env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\\\
*(If left blank, ChainTrace operates smoothly in Local Sovereign Mode via \server/data/db.json\).*

### Running the Platform
\\\ash
# Start Vite development server (frontend + integrated Express API on port 8443)
pnpm dev
# or: npm run dev
\\\
Open **\http://localhost:8443\** in your browser.

---

## 📁 Project Structure

\\\	ext
ChainTrace/
├── .env.example                     # Environment configuration template
├── package.json                     # Project manifest and scripts
├── vite.config.ts                   # Vite configuration with API middleware
├── supabase/
│   └── schema.sql                   # Complete PostgreSQL schema
├── server/                          # Sovereign Express Backend
│   ├── app.js                       # Express app configuration
│   ├── index.js                     # Standalone HTTP server runner
│   ├── db/
│   │   ├── supabase.js              # Supabase server client
│   │   └── database.js              # Hybrid DB persistence engine
│   └── routes/                      # REST API Endpoints (Auth, Cases, Trace)
└── src/                             # React 19 Frontend
    ├── components/
    │   ├── graph/                   # Transaction graph components
    │   ├── layout/                  # Navigation bars
    │   └── ui/                      # Data tables, modals, buttons
    ├── pages/                       # Investigation consoles and dashboards
    ├── services/                    # API and Database clients
    └── store/                       # Zustand global state management
\\\

---

## 👨‍💻 Authors & Acknowledgments
- **Lead Developer**: Ayush Bansal (@bansalayush475)
- **Platform**: ChainTrace - Blockchain Forensics Platform
