# Comprehensive Automated Test Cases & Empirical Results

The system includes a 100% automated test suite (`backend/src/tests/run_tests.js`) verifying all critical project requirements.

To run tests:
```powershell
cd backend
npm test
```

---

## 1. Test Suite Specifications

| Test Suite | Target Feature | Acceptance Criteria | Execution Status |
| :--- | :--- | :--- | :--- |
| **Suite 1: Auth Lifecycle** | JWT Signing & Verification | Token decodes correctly with user ID, role, and expiry | **PASSED** (100%) |
| **Suite 1: Auth Lifecycle** | Password Security | Bcrypt hashes match plaintext passwords and reject forged inputs | **PASSED** (100%) |
| **Suite 2: Tamper-Evident Audit** | Hash Chain Initial Verification | Genesis block and existing ledger pass SHA-256 continuity | **PASSED** (100%) |
| **Suite 2: Tamper-Evident Audit** | Block Append & Linkage | New block increments sequence and stores valid previous/current hash | **PASSED** (100%) |
| **Suite 2: Tamper-Evident Audit** | Tamper Detection Utility | Direct alteration of block payload is flagged with exact sequence # | **PASSED** (100%) |
| **Suite 3: Dynamic Baselines** | Baseline Fetch & Auto-Init | Defaults are initialized ($\mu, \sigma$, work hours 09:00 - 18:00) | **PASSED** (100%) |
| **Suite 3: Dynamic Baselines** | Z-Score Deviation Scoring | Burst of 80 downloads flags $+5.0\sigma$ deviation & anomaly score $\ge 40$ | **PASSED** (100%) |
| **Suite 4: Rule Engine** | Excessive Downloads Rule | Exceeding 20 downloads in 15m triggers Critical rule alert | **PASSED** (100%) |
| **Suite 5: Anomaly Engine** | Isolation Forest Scoring | Outlier vector isolates quickly, producing score $\ge 0.60$ | **PASSED** (100%) |
| **Suite 6: Hybrid Risk Engine** | Dynamic Formula & Factors | Output score is bounded $[0, 100]$ with explainable factor breakdown | **PASSED** (100%) |
| **Suite 7: Research Evaluation** | Model Benchmarks & CM | Precision, Recall, F1, and Confusion Matrices calculate accurately | **PASSED** (100%) |
| **Suite 8: CERT Pipeline** | Schema Introspection | CERT r4.2 columns are mapped into standard telemetry schema | **PASSED** (100%) |

---

## 2. Test Execution Output

```
================================================================
🧪 UBA SENTINEL AUTOMATED COMPREHENSIVE TEST SUITE
================================================================

[Suite 1: Authentication & Token Lifecycle]
  ✅ PASS: JWT Signing and Verification
  ✅ PASS: Password Hashing and Matching

[Suite 2: Tamper-Evident Audit Logging & SHA-256 Hash Chaining]
  ✅ PASS: Initial Audit Chain Verification
  ✅ PASS: Audit Block Append and Sequence Continuity
  ✅ PASS: Simulated Tamper Detection Utility Flags Altered Record

[Suite 3: Dynamic User Behaviour Baselines & Z-Score Analytics]
  ✅ PASS: User Baseline Fetch and Default Initialization
  ✅ PASS: Baseline Deviation Detection on Massive Download Burst

[Suite 4: Rule-Based Detection Engine]
  ✅ PASS: Excessive Downloads Rule Detection

[Suite 5: Isolation Forest Anomaly Inference]
  ✅ PASS: Isolation Forest Scoring on Benign vs Outlier Point

[Suite 6: Explainable Hybrid Risk Scoring]
  ✅ PASS: Hybrid Risk Score Formula & Contributing Factors

[Suite 7: Experimental Research Evaluation Pipeline]
  ✅ PASS: Comparative Model Evaluation Metrics & Confusion Matrix

[Suite 8: CERT Insider Threat Test Dataset Schema Mapping]
  ✅ PASS: CERT r4.2 Schema Column Inspection and Normalization

================================================================
🏁 TEST RESULTS: 12 PASSED, 0 FAILED (100% SUCCESS)
================================================================
```
