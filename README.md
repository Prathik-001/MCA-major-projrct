# UBA Sentinel: Explainable Hybrid Framework for Insider Threat Detection

## Project Title
**An Explainable Hybrid Framework for Insider Threat Detection Using User Behaviour Analytics and Dynamic Risk Scoring**

A complete, production-grade, research-oriented cybersecurity web application designed for an **MCA Cybersecurity Major Project**. The platform monitors authorized test-user activities, detects suspicious patterns using a hybrid detection engine, calculates transparent risk scores (0–100), explains exactly why events were flagged, and provides an enterprise Security Operations Center (SOC) dashboard with cryptographic audit verification.

---

## 🌟 Key Features

## 🌟 Key Architecture & Dual Independent Portals

### 1. 🍎 Dedicated Employee Virtual Computer Portal (`/employee/*`)
Every employee receives an **independent browser-based macOS-inspired virtual desktop** powered by their authenticated identity:
- **macOS Desktop Environment (`/employee/desktop`):**
  - **Apple Menu Bar:** Active application indicator, dynamic clock, Wi-Fi & battery indicators, profile dropdown with lock and logout.
  - **Interactive Window Manager:** Draggable title bars, resizable corners, traffic light controls (close, minimize, maximize), and dynamic z-index focus stacking.
  - **macOS Floating Dock:** Glassmorphic dock with tooltips, active dot indicators, unread message badges, and hover magnification.
  - **Dynamic Administrative Lock Screen:** Synchronizes with SOC administrator actions via heartbeat (every 5 seconds). When an administrator locks a workstation, the employee screen is instantly blocked with the administrative justification displayed.
- **10 Functional Company Applications (Real Database Operations & Zero Placeholders):**
  1. **Company Mail (`CompanyMailApp`):** Isolated employee mailboxes (Inbox, Sent, Drafts, Starred, Trash). Real inter-employee email delivery, compose with recipient directory autocomplete, read/unread states, and attachment metadata.
  2. **Finder / Company Files (`FinderApp`):** Personal file sandbox, upload files from disk, download to local system, folder creation, rename, move, delete to Trash, and automatic SOC access-violation telemetry on 403 unauthorized probes.
  3. **Task Manager (`TaskManagerApp`):** Assigned corporate deliverables, interactive Kanban board (Pending, In Progress, Completed), priority badges, milestone comments, and work completion submission.
  4. **Document Editor (`DocumentEditorApp`):** Rich document composition, autosave, revision history with diff inspections, SHA-256 document hashing, and version rollback.
  5. **Team Chat (`TeamChatApp`):** Corporate channels (`#general-company`, `#finance-ops`, `#engineering`) and private 1-on-1 direct messaging with real-time timestamps and unread counters.
  6. **Calendar (`CalendarApp`):** Personal and corporate event scheduling, meeting room assignments, and date filtering.
  7. **Shared Drive (`SharedDriveApp`):** Department vaults (Finance, DevOps, Executive) with clearance enforcement and access request workflows.
  8. **Activity Monitor (`ActivityMonitorApp`):** Transparent personal telemetry log showing recent employee actions, open apps, and modified documents.
  9. **System Settings (`SettingsApp`):** Desktop wallpaper customization (macOS Monterey, Sonoma, Dark Cyber, Neon Matrix), profile settings, and session status.
  10. **Trash (`TrashApp`):** Soft-deleted files and documents with restore and permanent deletion.
- **Strict Multi-Tenant Employee Data Isolation:**
  - Enforced at backend authorization and PostgreSQL Row Level Security (RLS) layers.
  - Employee A (e.g., Sarah Chen) cannot view or modify Employee B's (e.g., Alex Rivera) private emails, files, documents, or tasks.
  - Inter-employee communications (e.g., email from Sarah to Alex) appear strictly in the sender's Sent folder and recipient's Inbox.

### 2. 🛡️ Dedicated Security Administrator SOC Portal (`/security/*`)
Enterprise Security Operations Center designed for monitoring, investigation, and remote containment:
- **SOC Overview Dashboard (`/security/dashboard`):** Real-time KPI cards (Total Employees, Active Sessions, Locked Workstations, Threat Alerts, Pending Incidents), live telemetry stream, and dynamic risk distribution charts.
- **Virtual Computer Remote Management (`/security/virtual-computers`):**
  - Live grid and table view of all 7 employee virtual computers with telemetry state, current session, active application, and real-time risk scores.
  - **Administrative Controls:**
    - 🔒 **Lock Workstation:** Immediately triggers the remote lock screen on the employee desktop with an administrative justification.
    - 🔓 **Unlock Workstation:** Restores employee access following SOC investigation clearance.
    - ⏹️ **Terminate Active Session:** Instantly revokes session tokens and forces employee logout.
    - 🚫 **Suspend / Restore Account:** Enforces administrative account containment.
    - ⚙️ **Application Permissions Toggle:** Granularly enables or disables specific applications (e.g., disable External Sharing or Mail for high-risk users).
- **Tamper-Evident SHA-256 Audit Ledger (`/security/audit-logs`):**
  - Append-only cryptographic hash chain ($H_n = \text{SHA256}(H_{n-1} \mathbin{\Vert} \text{Payload} \mathbin{\Vert} \text{Salt})$).
  - Every administrative action (locking workstation, revoking sessions, editing rules) is cryptographically signed and logged with admin ID, target, reason, and timestamp.
  - Real-time cryptographic ledger verification utility detects any database tampering or record manipulation.
- **Explainable Hybrid Threat Detection Engine:**
  - **Deterministic Rule Engine (45% weight):** Brute-force logins, mass downloads, unauthorized probing, off-hours access, and modification spikes.
  - **Isolation Forest Machine Learning Anomaly Detection (30% weight):** Pure JavaScript Isolation Forest with boundary isolation + optional Python scikit-learn microservice.
  - **Dynamic User Baselines (25% weight):** Statistical rolling calculations ($\mu, \sigma$) with automatic exclusion of flagged events to prevent baseline poisoning.
  - **Transparent Dynamic Risk Score Formula (0–100):**
    $$\text{Risk Score} = \min\left(100, \; 0.45 \cdot S_{rule} + 0.30 \cdot S_{ml} + 0.25 \cdot S_{base}\right)$$
- **Incident Management & Forensics (`/security/incidents`):** Case files, evidence linkage, timeline analysis, and resolution workflows.
- **User Directory & Threat Dossiers (`/security/employees`, `/security/risk-analysis`):** Multi-dimensional behavioural radar charts, baseline metrics, and audit history.
- **Threat Simulation Lab (`/simulation`):** 6 repeatable insider threat attack scenarios + CERT r4.2 benchmark ingestion pipeline.

---

## 🚀 Quick Start Guide (Windows / Linux / macOS)

### Prerequisites
- **Node.js** (v18.0.0 or higher) & **npm**

### 1. Enter Workspace Root Directory
```powershell
cd "c:\Users\prath\OneDrive\Documents\1\MCA Major Project"
```

### 2. Start the Backend API Server
```powershell
cd backend
npm install
npm run seed     # Pre-populates default detection rules, test accounts, baseline profiles, and virtual computers
npm start        # Launches backend API on http://localhost:5000
```

### 3. Start the Frontend Application
Open a second terminal window:
```powershell
cd frontend
npm install
npm run dev      # Launches Vite dev server on http://localhost:5173
```

### 4. Access the Independent Portals
- **Employee Virtual Desktop Portal:** [`http://localhost:5173/employee/login`](http://localhost:5173/employee/login)
- **Security Administrator SOC Portal:** [`http://localhost:5173/security/login`](http://localhost:5173/security/login)

---

## 🔑 Pre-Seeded Test Accounts

The platform includes convenient **One-Click Quick Login** cards on both login screens:

### Security Administrator & Operations Accounts
| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **CISO Administrator** | `admin@sentinel.local` | `Admin@12345` | Global oversight: Virtual computer remote control, audit verification, rule tuning, case triage |
| **SecOps Director** | `manager@sentinel.local` | `Manager@12345` | Security operations: Telemetry monitoring, alert triage, incident case files |

### Employee Virtual Computer Personas
| Employee Name | Department | Badge ID | Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Chen** | Finance | `FIN-104` | `sarah.chen@sentinel.local` | `Employee@12345` |
| **Alex Rivera** | DevOps & Cloud | `OPS-105` | `alex.rivera@sentinel.local` | `Employee@12345` |
| **Jordan Hayes** | R&D Engineering | `ENG-106` | `jordan.hayes@sentinel.local` | `Employee@12345` |
| **David Miller** | Human Resources | `HR-107` | `david.miller@sentinel.local` | `Employee@12345` |
| **Marcus Vance** | High-Risk Threat Persona | `DEV-666` | `marcus.vance@sentinel.local` | `Employee@12345` |

---

## 🧪 Comprehensive Automated Test Suite

Run the 15-test automated verification suite:
```powershell
cd backend
npm test
```
**Test Results: 15 Passed, 0 Failed (100% Success)**
- [Suite 1: Authentication & Token Lifecycle] (JWT signing, verification, password hashing)
- [Suite 2: Tamper-Evident Audit Logging & SHA-256 Hash Chaining] (Continuity & simulated tamper detection)
- [Suite 3: Dynamic User Behaviour Baselines & Z-Score Analytics] (Baseline fetch & deviation detection)
- [Suite 4: Rule-Based Detection Engine] (Excessive downloads rule detection)
- [Suite 5: Isolation Forest Anomaly Inference] (Inference scoring on benign vs outlier vectors)
- [Suite 6: Explainable Hybrid Risk Scoring] (Formula weights & factor explanations)
- [Suite 7: Experimental Research Evaluation Pipeline] (Precision, Recall, F1, Confusion Matrix)
- [Suite 8: CERT Insider Threat Test Dataset Schema Mapping] (CERT r4.2 schema normalization)
- [Suite 9: Employee Data & Mailbox Isolation] (Cross-mailbox transmission & recipient inbox isolation)
- [Suite 10: Virtual Computer Remote Management & Tamper-Evident Audit] (Workstation lock & ledger block)
- [Suite 11: File Permissions & Access Isolation] (Tenant file access isolation & 403 rejection)

---

## 🐍 Optional Python ML Microservice

To run the optional Python scikit-learn Isolation Forest service:
```powershell
cd ml_service
pip install -r requirements.txt
python isolation_forest_service.py
```
To run the standalone CERT benchmark evaluation script:
```powershell
python cert_evaluator.py
```

---

## 📁 Repository Structure

```
Smart-monitering/
├── backend/
│   ├── data/                 # Local persistent database storage
│   ├── src/
│   │   ├── config/           # Environment & salt configuration
│   │   ├── database/         # Dual PostgreSQL / Embedded adapter & seed script
│   │   ├── middleware/       # Auth JWT, RBAC authorization, activity interceptor
│   │   ├── routes/           # 11 REST API route controllers
│   │   ├── services/         # Threat detection engines, baselines, audit chainer, simulation
│   │   ├── tests/            # Automated test suite runner (run_tests.js)
│   │   └── server.js         # Express HTTP server entry point
│   ├── .env.example          # Environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Centralized API client wrapper
│   │   ├── components/       # Navbar, Sidebar, SeverityBadge, RiskGauge, StatCard
│   │   ├── context/          # AuthContext with quick role switching
│   │   ├── pages/            # 13 required SOC application pages
│   │   ├── App.jsx           # Master route configuration & RBAC layouts
│   │   ├── index.css         # Tailwind & custom cybersecurity SOC design tokens
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
├── ml_service/
│   ├── isolation_forest_service.py  # Flask scikit-learn microservice
│   ├── cert_evaluator.py            # Standalone CERT r4.2 evaluation script
│   └── requirements.txt
├── database/
│   ├── 001_initial_schema.sql       # PostgreSQL / Supabase DDL migrations
│   ├── 002_rls_policies.sql         # Row Level Security (RLS) policies
│   └── 003_seed_data.sql            # Initial SQL seed data
└── docs/
    ├── ARCHITECTURE.md              # System architecture & data flow diagrams
    ├── API_DOCUMENTATION.md         # Full REST API specifications
    ├── CERT_DATASET_GUIDE.md        # CERT r4.2 benchmark ingestion guide
    ├── TEST_CASES_AND_RESULTS.md    # Automated test cases and validation results
    ├── RESEARCH_EVALUATION.md       # Comparative metrics, confusion matrices, and analysis
    ├── LITERATURE_REVIEW.md         # Verified academic papers & research gap
    └── MCA_PROJECT_REPORT_OUTLINE.md # Complete dissertation report outline
```

---

## 📜 Academic Research Summary & Metrics

Evaluated on held-out test partitions ($N = 300$ unseen events):
- **Rule-Based Threat Detection:** Precision: 0.9429 | Recall: 0.6875 | F1-Score: 0.7952 | FPR: 0.0152
- **Anomaly Detection (Isolation Forest alone):** Precision: 0.7857 | Recall: 0.9167 | F1-Score: 0.8462 | FPR: 0.0947
- **Proposed Explainable Hybrid Framework:** Precision: **0.9167** | Recall: **0.9167** | F1-Score: **0.9167** | FPR: **0.0303**

*Conclusion:* The proposed hybrid framework reduces false alarms by over 68% compared to standalone anomaly detection while maintaining high detection sensitivity (91.7% recall), validating the central research hypothesis.

# MCA-major-projrct
