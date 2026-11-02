# System Architecture & Technical Specifications

## Project Title
**An Explainable Hybrid Framework for Insider Threat Detection Using User Behaviour Analytics and Dynamic Risk Scoring**

---

### 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer
        A1[React 18 + Vite SOC Dashboard]
        A2[Tailwind CSS Cyber-Dark UI]
        A3[Recharts Dynamic Visualizers]
    end

    subgraph Backend API Layer
        B1[Express HTTP Server]
        B2[JWT Authentication Middleware]
        B3[Role-Based Authorization RBAC]
        B4[Activity Interceptor Middleware]
    end

    subgraph Threat Detection Engine
        C1[Rule-Based Deterministic Evaluator]
        C2[Dynamic User Baseline Engine UBA]
        C3[Isolation Forest ML Engine]
        C4[Dynamic Risk Scoring Formula 0-100]
        C5[Explainable Factor Decomposer]
    end

    subgraph Data & Tamper-Evident Storage
        D1[(PostgreSQL / Supabase)]
        D2[(Zero-Config Local JSON Engine)]
        D3[SHA-256 Cryptographic Hash Chainer]
    end

    subgraph External Machine Learning Service
        E1[Python Flask / scikit-learn Microservice]
        E2[CERT r4.2 Benchmark Ingestion Pipeline]
    end

    A1 -->|REST API / Bearer Token| B1
    B1 --> B2 --> B3 --> B4
    B4 --> C1 & C2 & C3
    C3 -.->|Optional REST Proxy| E1
    C1 & C2 & C3 --> C4 --> C5
    C4 -->|Auto Alert / Incident Trigger| D1
    B4 -->|Immutable Audit Chain| D3
    D3 --> D1 & D2
    E2 -->|Mapped Telemetry Stream| B4
```

---

### 2. Multi-Tier Layer Descriptions

#### Tier 1: Presentation (Security Operations Center UI)
- Built with **React 18**, **Vite**, **Tailwind CSS**, and **Lucide React**.
- Implements a modern SOC dark theme (`#090d16` canvas, cyan/emerald accents, glowing borders).
- Consists of 13 modular views satisfying all administrative, managerial, and employee requirements:
  1. Login & Authentication (`/login`)
  2. SOC Overview Dashboard (`/`)
  3. Live Activity Stream (`/activity`)
  4. Security Alerts & Triage Center (`/alerts`)
  5. Incident Case Files (`/incidents`)
  6. Monitored User Directory (`/users`)
  7. User Behavioral Threat Dossier (`/risk-profile`)
  8. Behavioral Baseline Comparison (`/baselines`)
  9. Detection Rule Lab (`/rules`)
  10. Tamper-Evident Audit Verification (`/audit`)
  11. Reports & MITRE ATT&CK Matrix (`/reports`)
  12. Research Evaluation & Model Performance (`/research`)
  13. Threat Simulations & CERT Import (`/simulation`)

#### Tier 2: Application Programming Interface (Node.js & Express)
- Handles user authentication, token issuance (JWT), role-based authorization (Administrator, Manager, Employee), and request interception.
- Restricts Employees from accessing administrative endpoints or other personnel records on the server.

#### Tier 3: Hybrid Threat Detection Engine
Combines three complementary detection paradigms:
1. **Rule-Based Engine ($S_{rule} \in [0, 100]$):** Evaluates rapid brute-force logins, mass downloads, unauthorized probing, off-hours access, and modification spikes.
2. **Behavior-Based Anomaly Engine ($S_{ml} \in [0, 100]$):** Pure JavaScript Isolation Forest with boundary isolation + optional Python scikit-learn microservice.
3. **Dynamic User Baseline Engine ($S_{base} \in [0, 100]$):** Computes rolling mean and standard deviation ($\mu, \sigma$) across daily downloads, modifications, unique resources, and operational hours. Calculates Z-score deviations ($Z = \frac{x - \mu}{\sigma}$).

**Explainable Dynamic Risk Score Formula:**
$$\text{Risk Score} = \min\left(100, \; 0.45 \cdot S_{rule} + 0.30 \cdot S_{ml} + 0.25 \cdot S_{base}\right)$$

#### Tier 4: Tamper-Evident Audit Logging (SHA-256 Hash Chaining)
- Every significant operational event and threat detection is cryptographically chained into an append-only ledger:
  $$H_n = \text{SHA256}\left(H_{n-1} \mathbin{\Vert} \text{Payload} \mathbin{\Vert} \text{Salt}\right)$$
- An automated one-click integrity verification utility traverses the chain sequentially ($n = 1 \dots N$), verifying sequence continuity, link validity, and payload hash matching.
