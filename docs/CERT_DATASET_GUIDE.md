# CERT Insider Threat Dataset Ingestion & Preprocessing Guide

## Overview
The Carnegie Mellon University Software Engineering Institute (SEI) **CERT Insider Threat Test Dataset** is the widely accepted benchmark corpus for evaluating insider threat detection systems.

The dataset includes multiple release iterations (r4.2, r5.2, r6.2) containing multi-modal synthetic log streams:
- `logon.csv`: Authentication, session start, and session termination events.
- `file.csv`: File open, copy, download, and delete operations.
- `http.csv`: Web browsing and cloud service access.
- `device.csv`: Removable USB media insertions and file transfers.
- `email.csv`: Internal and external electronic mail communication.

---

## 1. Schema Introspection & Column Normalization

Because different CERT versions exhibit variations in column naming, our ingestion service (`CertImportService.js`) dynamically inspects and maps incoming headers:

| Canonical Target Field | CERT r4.2 / r5.2 Source Field | Type & Transformation |
| :--- | :--- | :--- |
| `timestamp` | `date` / `timestamp` / `time` | ISO-8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`) |
| `user_email` | `user` / `User` / `username` | `${user.toLowerCase()}@cert-test.local` |
| `event_type` | `activity` / `action` | Mapped to `LOGIN`, `LOGOUT`, `FILE_DOWNLOAD`, `PAGE_ACCESS`, `ACCESS_DENIED` |
| `resource_id` | `filename` / `url` / `file` | Target file or endpoint URI |
| `ip_address` | `pc` / `workstation` | Workstation ID normalized to IP subnet (`10.0.X.Y`) |
| `action` | `activity` | `AUTH`, `READ`, `DOWNLOAD`, `DEVICE_TRANSFER`, `TERMINATE` |
| `status` | Computed from action | `SUCCESS` or `FAILURE` |

---

## 2. Prepackaged Representative CERT r4.2 Slice

To allow immediate, reproducible evaluation without requiring users to download multi-gigabyte raw CERT archives, the platform includes a prepackaged benchmark slice representing **CERT r4.2 Scenario 1** (User ACM2278):

### Threat Scenario Progression:
1. **08:14 UTC**: Routine morning logon on primary workstation (`PC-5832`).
2. **08:35 UTC**: Benign internal documentation access (`internal_org_chart.pdf`).
3. **17:02 UTC**: Standard end-of-shift logoff.
4. **23:45 UTC (Anomalous Phase)**: Off-hours logon outside normal shift.
5. **23:47 UTC**: Unauthorized removable USB device connected (`SanDisk_Cruzer_USB`).
6. **23:50 - 23:52 UTC**: Rapid sequential exfiltration of confidential M&A and executive compensation files.
7. **23:55 UTC**: USB device detached; session logged off.

### Ingestion Execution:
In the UI, navigate to **Threat Simulations & CERT Pipeline (`/simulation`)** and click **Import CERT r4.2 Slice**. The pipeline parses the records, runs the hybrid threat scoring engine, triggers High/Critical severity alerts, and updates the user's risk dossier in real time.
