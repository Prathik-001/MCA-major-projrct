# UBA Sentinel REST API Documentation

Base URL: `http://localhost:5000/api`

All authenticated endpoints require an `Authorization: Bearer <JWT_TOKEN>` header.

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and returns a signed JSON Web Token (JWT).
- **Request Body:**
  ```json
  {
    "email": "admin@sentinel.local",
    "password": "Admin@12345"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "a1000000-0000-0000-0000-000000000001",
      "email": "admin@sentinel.local",
      "full_name": "Dr. Evelyn Cross (Chief Information Security Officer)",
      "role": "Administrator",
      "department": "Cybersecurity SOC"
    }
  }
  ```

### `GET /auth/me`
Returns current authenticated user details.

### `POST /auth/logout`
Records logout telemetry event and terminates active session.

---

## 2. Activity Telemetry Endpoints

### `GET /activity`
Retrieves activity events with filtering and pagination.
- **Query Parameters:**
  - `eventType` (string): `LOGIN`, `FILE_DOWNLOAD`, `RECORD_MODIFY`, `ACCESS_DENIED`, etc.
  - `isSuspicious` (boolean): `true` / `false`
  - `status` (string): `SUCCESS` / `FAILURE`
  - `search` (string): free-text search across user email, resource URI, event type
  - `limit` (integer): default `50`
  - `offset` (integer): default `0`
- **RBAC:** Employees are strictly limited to their own telemetry records.

### `POST /activity/record`
Ingests an activity event directly into the pipeline, runs hybrid risk evaluation, updates baselines, and chains into the audit log.
- **Request Body:**
  ```json
  {
    "userId": "a1000000-0000-0000-0000-000000000004",
    "eventType": "FILE_DOWNLOAD",
    "resourceId": "/confidential/financial_audit.xlsx",
    "action": "DOWNLOAD",
    "status": "SUCCESS",
    "ipAddress": "192.168.1.100"
  }
  ```

---

## 3. Alerts & Incident Management Endpoints

### `GET /alerts`
Lists security alerts filtered by severity, status, or user.

### `PATCH /alerts/:alertId/status`
Updates alert disposition (`New`, `Investigating`, `Resolved`, `False Positive`) with investigator notes.

### `GET /incidents`
Lists escalated incident case files.

### `GET /incidents/:incidentId`
Returns complete case file, attached user evidence telemetry, and investigator notes.

### `POST /incidents/:incidentId/notes`
Appends a timestamped investigation note to the incident case file.

### `PATCH /incidents/:incidentId/status`
Updates status, root cause findings, and containment actions (`Session Revoked`, `Account Suspended`, `None`).

---

## 4. User Directory & Containment Endpoints

### `GET /users`
Lists all monitored personnel with current risk scores and baseline statuses.

### `GET /users/:userId`
Returns detailed dossier, baseline statistics, and recent activity history.

### `POST /users/:userId/suspend`
Temporarily freezes user account and revokes active access tokens (Administrator only).

### `POST /users/:userId/revoke-sessions`
Revokes active authentication tokens for target user.

### `POST /users/:userId/reinstate`
Reinstates user back to Active operational status.

---

## 5. Baselines & Rules Endpoints

### `GET /baselines/:userId`
Returns established baseline ($\mu, \sigma$) and dynamic comparison against recent 24h activity.

### `POST /baselines/:userId/recalculate`
Recalculates baseline using only trusted, eligible activity (excluding flagged/malicious events).

### `PATCH /baselines/:userId/lock`
Locks baseline to prevent concept drift.

### `GET /rules`
Lists all configurable detection rules.

### `PATCH /rules/:ruleId`
Updates rule threshold, time window, severity rating, and risk weight.

---

## 6. Cryptographic Audit Chain Endpoints

### `GET /audit`
Returns paginated list of append-only audit records with previous and current hashes.

### `GET /audit/verify`
Performs one-click cryptographic verification of the SHA-256 chain from genesis to latest block.
- **Response (200 OK):**
  ```json
  {
    "isValid": true,
    "totalRecords": 24,
    "verifiedUpto": 24,
    "latestHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "message": "Cryptographic chain verification successful. All SHA-256 hashes and sequence links are authentic and untampered."
  }
  ```

### `POST /audit/simulate-tamper`
Simulates direct database record modification to demonstrate tamper detection capabilities.

---

## 7. Research & Simulation Endpoints

### `GET /research/literature`
Returns peer-reviewed literature review matrix with verified citations, findings, and reported limitations.

### `POST /research/evaluate`
Executes comparative experiment across Rule-Based, Isolation Forest Anomaly, and Proposed Hybrid models, returning Precision, Recall, F1, FPR, and Confusion Matrices.

### `POST /simulation/trigger`
Dispatches controlled synthetic attack scenarios (`SCENARIO_BRUTE_FORCE`, `SCENARIO_DATA_EXFILTRATION`, `SCENARIO_UNAUTHORIZED_PROBING`, `SCENARIO_OFF_HOURS_SURGE`, `SCENARIO_MASS_RECORD_MODIFICATION`, `SCENARIO_NORMAL_ACTIVITY`).

### `POST /simulation/cert-import`
Ingests representative benchmark slice from the Carnegie Mellon University SEI CERT Insider Threat Dataset r4.2.
