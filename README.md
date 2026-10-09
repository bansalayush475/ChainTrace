# 🏛️ ChainTrace: Crypto-Blockchain Forensic & Intelligence Platform
### Sovereign Cybercrime Defense, Fund-Flow Tracing & Statutory Subpoena Interception Platform
**Designed for Indian Law Enforcement Agencies (LEAs), MHA (I4C), State Cyber Crime Cells, and Judicial Evidence Submission**

[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)
[![Express](https://img.shields.io/badge/Backend-Express%205.2-lightgrey.svg?style=flat&logo=express)](https://expressjs.com/)
[![Statutory Compliance](https://img.shields.io/badge/Statutory%20Compliance-BSA%202023%20%7C%20BNSS%202023%20%7C%20IT%20Act-gold.svg)](#-statutory-law-compliance-matrix)

---

## 📌 Executive Summary

The **ChainTrace Platform (Crypto-Blockchain Forensic & Intelligence System)** is a mission-critical, sovereign cybercrime investigation platform architected to solve India's **₹1,200+ Crore quarterly cyber fraud drainage**.

Built specifically for high-stakes evaluation and live field operations, ChainTrace bridges the critical gap between citizen complaints on the **1930 National Cybercrime Reporting Portal (NCRP / I4C)** and overseas cryptocurrency off-ramps (e.g., Binance, Bybit, Huobi, CoinDCX). It enables cyber forensic officers to intercept siphoned assets within the critical **`< 3-hour` Golden Hour window** before illicit funds can be converted or de-linked through peeling chains, mixers, or P2P mule networks.

---

## ⚡ Core Forensic Pillars

```
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│  1930 Helpline  │ ──> │   Automated On-Chain  │ ──> │  Statutory Emergency   │
│ Citizen Intake  │     │   Multi-Hop Peeling   │     │  Subpoena (§94 BNSS)   │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
         │                                                         │
         ▼                                                         ▼
┌─────────────────┐                                   ┌────────────────────────┐
│ P2P Mule Escrow │                                   │  Court Electronic      │
│  Debit Freeze   │                                   │  Evidence (§63 BSA)    │
│  (§106 BNSS)    │                                   │  Admissibility Dossier │
└─────────────────┘                                   └────────────────────────┘
```

1. **🚨 Automated 1930 NCRP Intake & Victim Trace**:
   - Zero-entry clean slate default with instant stage demonstration presets for *Southeast Asia Digital Arrest Syndicates (₹48.5L TRC-20 USDT)* and *Telegram Task Scams (₹14.2L Bybit)*.
   - Deterministic peeling chain traversal with automated change-address stripping and destination VASP sub-account attribution (Deposit UID identification).

2. **⚡ P2P Escrow & UPI Mule Radar**:
   - Real-time interception of Indian banking UTRs, UPI VPAs (`@oksbi`, `@okhdfcbank`), and P2P order numbers.
   - **Ticking 23-minute Golden Window countdown timer** for escrowed trades.
   - Automatic generation of Section 106 BNSS (102 CrPC) Total Debit Freeze notices for bank branches.

3. **🕸️ Interactive Fund Flow Graph & Auditorium Projection Mode**:
   - High-resolution ReactFlow topological transaction visualizer with zoom/pan and cluster bundling.
   - **Auditorium Projection Mode**: Fullscreen display designed for stage projectors, command centers, and judicial presentations with keyboard shortcuts (`[ESC]`) and interactive node drawers.
   - Export forensic topology exhibit (`EXH-GPH-01`) stamped with SHA-256 evidence digests.

4. **📜 Statutory Court Evidence Dossier Generator**:
   - Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 certificate and Section 79A IT Act Examiner of Electronic Evidence endorsement.
   - Official Government of India & Ministry of Home Affairs (I4C) masthead with Ashok Stambh emblem formatting and `@media print` layout.

5. **⚡ Executive Briefing / Pitch Mode HUD**:
   - Accessible from any screen via the topbar, featuring a 4-tab national pitch deck covering the problem statement, 5-stage technical pipeline, statutory legal mapping, and sovereign architectural advantages.

---

## 🏛️ Sovereign Backend & Supabase Database Architecture

CBFIS features a production-ready, multi-tier architecture with **Supabase (PostgreSQL)** and a dual-mode Express API:

### Architecture Highlights
- **Zero-Friction Dual-Mode Execution**:
  - The Express backend is mounted directly into Vite's Connect server middleware (`cbfisApiPlugin`), intercepting `/api/*` on port **`8443`** without requiring secondary terminals or external tunnels.
  - Also includes a standalone HTTP runner (`server/index.js` via `npm run server`) on port `5001` for Docker / Kubernetes production deployments.
- **Supabase Cloud Database Integration**:
  - Full PostgreSQL schema defined in [`supabase/schema.sql`](./supabase/schema.sql) covering 8 core forensic tables: `investigations`, `timeline_events`, `evidence_vault`, `wallets`, `transactions`, `ncrp_complaints`, `freeze_notices`, `audit_logs`.
  - Row Level Security (RLS) policies and performance indexes enabled.
- **Hybrid Fail-Safe Engine**:
  - **Cloud Mode**: Writes and streams directly to Supabase Cloud when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
  - **Local Sovereign Mode**: Seamlessly falls back to an atomic file database engine (`server/data/db.json`), ensuring stage demonstrations run reliably even without internet connectivity.

### Core Backend API Endpoints

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Node health status, Supabase cloud connection, active LEA jurisdiction |
| `/api/investigations` | `GET` / `POST` | Formal case docket CRUD, risk scores, auto Case ID generation |
| `/api/investigations/:id/timeline` | `GET` / `POST` | §79A IT Act chronological case milestone evidence trail |
| `/api/ncrp/feed` | `GET` | Real-time 1930 Cyber Helpline citizen fraud intake stream |
| `/api/ncrp/dispatch` | `POST` | Ingest live citizen complaint payload |
| `/api/ncrp/escalate/:id` | `POST` | 1-click promotion of citizen complaint into an active FIR docket |
| `/api/trace` | `POST` | Server-side multi-chain RPC proxy for TRON, BTC, and EVM (bypasses browser CORS) |
| `/api/freeze/directory` | `GET` | Verified directory of LEA compliance nodal officers (Binance, Bybit, CoinDCX, SBI, NPCI) |
| `/api/freeze/vasp` | `POST` | Generate §94 BNSS VASP Subpoena with SHA-256 seal |
| `/api/freeze/bank` | `POST` | Generate §106 BNSS Bank Debit Freeze notice with UTR trail |
| `/api/audit` | `GET` / `POST` | §63 BSA 2023 tamper-evident electronic evidence log |
| `/api/audit/reset-database` | `POST` | 1-click wipe to clean sovereign slate |

---

## ⚖️ Statutory Law Compliance Matrix

CBFIS is built in strict alignment with India's newly enacted criminal and evidentiary codes:

| Act & Section | Earlier Code | Operational Enforcement in CBFIS |
| :--- | :--- | :--- |
| **Section 63 BSA, 2023** | Section 65B Indian Evidence Act | Mandatory Certificate of Electronic Evidence with cryptographic SHA-256 verification hash |
| **Section 94 BNSS, 2023** | Section 91 CrPC, 1973 | Statutory Subpoena issued to Virtual Asset Service Providers (VASPs) for account freeze & KYC logs |
| **Section 106 BNSS, 2023** | Section 102 CrPC, 1973 | Immediate Total Debit Freeze orders served upon scheduled commercial banks and NPCI switches |
| **Section 79A IT Act, 2000** | — | Central Government notification of Examiners of Electronic Evidence and tamper-evident audit logs |
| **Section 316 / 318 BNS, 2023** | Section 420 / 406 IPC | Substantive cyber fraud and criminal breach of trust tracking in FIR case dockets |

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js 20+ (Node 22 or 24 recommended)
- `pnpm` or `npm`

### Installation
```bash
# Clone the repository
git clone https://github.com/bansalayush475/SIH26183.git
cd SIH26183

# Install dependencies
pnpm install
# or: npm install
```

### Configuration (Optional: Supabase Cloud Database)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
To connect Supabase Cloud:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard, paste, and run [`supabase/schema.sql`](./supabase/schema.sql).
3. Set your project URL and Anon Key in `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(If left blank, CBFIS operates smoothly in Local Sovereign Mode via `server/data/db.json`).*

### Running the Application
```bash
# Start Vite development server (frontend + integrated Express API on port 8443)
pnpm dev
# or: npm run dev
```
Open **`http://localhost:8443`** in your browser.

```bash
# Run standalone backend server (port 5001)
pnpm server
# or: npm run server
```

```bash
# Build for production
pnpm build
# or: npm run build
```

---

## 📂 Project Structure

```
SIH26183/
├── .env.example                     # Environment configuration template
├── package.json                     # Project manifest and scripts
├── vite.config.ts                   # Vite configuration with cbfisApiPlugin middleware
├── supabase/
│   └── schema.sql                   # Complete Supabase PostgreSQL schema with RLS
├── server/                          # Sovereign LEA Express Backend
│   ├── app.js                       # Express app configuration & middleware
│   ├── index.js                     # Standalone HTTP server runner
│   ├── db/
│   │   ├── supabase.js              # Supabase server client
│   │   └── database.js              # Hybrid Supabase / Atomic JSON persistence engine
│   └── routes/
│       ├── health.js                # System status & node telemetry
│       ├── investigations.js        # Case dockets CRUD
│       ├── ncrp.js                  # 1930 Helpline intake & escalation
│       ├── trace.js                 # Multi-chain RPC proxy (TRON/BTC/ETH)
│       ├── freeze.js                # §94 BNSS & §106 BNSS notice generator
│       └── audit.js                 # §63 BSA 2023 tamper-evident audit ledger
├── src/                             # React 19 Frontend
│   ├── App.tsx                      # App router & database initialization
│   ├── components/
│   │   ├── graph/                   # Transaction graph & auditorium projection mode
│   │   ├── layout/                  # Sovereign Topbar & Sidebar
│   │   └── ui/                      # Modals, Executive Briefing, Data Tables
│   ├── pages/                       # 20+ specialized cybercrime forensic consoles
│   ├── services/
│   │   ├── apiService.ts            # Centralized backend REST API client
│   │   ├── blockchainService.ts     # Public RPC fallback indexer
│   │   ├── databaseService.ts       # Client-side IndexedDB persistence
│   │   ├── supabaseClient.ts        # Frontend Supabase SDK
│   │   └── vaspAttributionService.ts# Explainable AI (XAI) attribution engine
│   └── store/
│       └── useStore.ts              # Global Zustand state & backend synchronization
```

---

## 👥 Authors & Acknowledgments

- **Lead Developer**: Ayush Bansal ([@bansalayush475](https://github.com/bansalayush475))
- **Platform**: Crypto-Blockchain Forensic & Intelligence System (CBFIS)
- **Initiative**: Smart India Hackathon / Sovereign Cybercrime Defense Framework
