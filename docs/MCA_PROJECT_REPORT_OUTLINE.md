# MCA Major Project Dissertation Report Outline

**Project Title:** An Explainable Hybrid Framework for Insider Threat Detection Using User Behaviour Analytics and Dynamic Risk Scoring  
**Degree:** Master of Computer Applications (MCA)  
**Specialization:** Cybersecurity and Software Engineering  

---

## Complete Report Structure & Chapter Breakdown

### Title Page
- Project Title, Student Details, Guide/Mentor Details, Department of Computer Applications, University Name, Month & Year.

### Certificate & Declaration
- Bonafide Certificate signed by Guide and Head of Department.
- Candidate Declaration of original work.

### Acknowledgements & Abstract
- Executive Abstract summarizing problem, hybrid framework, experimental F1-score (0.9167), and tamper-evident audit logging.

---

### Chapter 1: Introduction
- **1.1 Background:** The evolving insider threat landscape in enterprise web applications.
- **1.2 Motivation:** Why external perimeter security (firewalls, WAFs) fails against authenticated insiders.
- **1.3 Problem Statement:** Addressing alert fatigue, black-box ML opacity, and delayed detection.
- **1.4 Project Objectives:**
  - Build an end-to-end SOC web platform with React, Node.js, and PostgreSQL/Supabase.
  - Implement a hybrid threat engine combining deterministic rules and Isolation Forest anomaly scoring.
  - Formulate an explainable dynamic risk scoring model (0–100).
  - Implement dynamic user behavior baselining with safe update filtering.
  - Build append-only cryptographic hash chaining (SHA-256) for audit integrity.
- **1.5 Scope & Delimitations:** Focus on authorized test user activity, benchmark evaluation on synthetic enterprise logs and CERT r4.2 slice.

---

### Chapter 2: Literature Review & Theoretical Framework
- **2.1 Taxonomy of Insider Threats:** Data exfiltration, privilege escalation, unauthorized reconnaissance, sabotage.
- **2.2 Existing Detection Approaches:**
  - Signature and Rule-Based Detection: Strengths (low latency) and weaknesses (high false negatives).
  - Machine Learning & Anomaly Detection: Clustering, One-Class SVM, Isolation Forest.
  - User and Entity Behaviour Analytics (UEBA): Longitudinal baseline profiling.
- **2.3 Detailed Matrix of Published Papers:** Review of Homoliak et al. (2019), Gavai et al. (2015), Tuor et al. (2017), Glasser & Lindauer (2013), and Salem et al. (2011).
- **2.4 Identification of Research Gap:** The lack of transparent, explainable scoring formulas that integrate both rule constraints and dynamic behavioral deviations.

---

### Chapter 3: System Requirements & Architecture
- **3.1 Functional Requirements:** Authentication, RBAC, Activity monitoring, Rule configuration, Baseline calculation, Alerting, Incident management, Audit verification.
- **3.2 Non-Functional Requirements:** Security, Performance, Auditability, Usability, Modularity.
- **3.3 System Architecture:** Multi-tier architectural diagram (Presentation, API, Threat Engine, Tamper-Evident Storage).
- **3.4 Data Flow Diagrams (DFD):** Level-0, Level-1, and Level-2 process decomposition.
- **3.5 Database Design & Schema:** ER diagram, SQL DDL migrations, Row Level Security (RLS) policies.

---

### Chapter 4: Methodology & Engine Design
- **4.1 Dynamic Behavioral Baselining:**
  - Rolling statistical calculation ($\mu, \sigma$).
  - $Z$-Score formulation: $Z = \frac{x - \mu}{\sigma}$.
  - Baseline poisoning prevention (exclusion of flagged/malicious data points).
- **4.2 Behaviour-Based Anomaly Detection:**
  - Mathematical formulation of Isolation Forest: path length $h(x)$, harmonic average $c(n)$, anomaly score $s(x, n) = 2^{-E(h(x))/c(n)}$.
  - Boundary isolation extension.
- **4.3 Explainable Dynamic Risk Scoring Formulation:**
  - $\text{Score} = \min(100, \; 0.45 \cdot S_{rule} + 0.30 \cdot S_{ml} + 0.25 \cdot S_{base})$.
  - Factor weight decomposition and severity tiering (Low, Medium, High, Critical).
- **4.4 Tamper-Evident Audit Logging:**
  - SHA-256 hash chaining: $H_n = \text{SHA256}(H_{n-1} \mathbin{\Vert} \text{Payload} \mathbin{\Vert} \text{Salt})$.
  - Sequential continuity verification algorithm.

---

### Chapter 5: Implementation Details
- **5.1 Technology Stack Justification:** Node.js, Express, React 18, Vite, Tailwind CSS, Recharts, scikit-learn.
- **5.2 Backend API & Middleware:** Activity interceptor, JWT validation, role-based access control.
- **5.3 Frontend Security Operations Center (SOC) Implementation:** 13 pages, responsive cybersecurity dark mode.
- **5.4 Python ML Microservice:** Flask service integration and fallback logic.
- **5.5 Attack Scenario Simulator & CERT r4.2 Ingestion Pipeline.**

---

### Chapter 6: Experimental Results & Performance Evaluation
- **6.1 Experimental Setup:** Dataset generation, class balance (88% benign, 12% malicious), train/test split.
- **6.2 Evaluation Metrics:** Precision, Recall, F1-Score, False-Positive Rate, Detection Delay.
- **6.3 Comparative Model Results:**
  - Rule-Based: Precision 0.9429, Recall 0.6875, F1 0.7952, FPR 0.0152.
  - Isolation Forest: Precision 0.7857, Recall 0.9167, F1 0.8462, FPR 0.0947.
  - Proposed Hybrid Framework: Precision 0.9167, Recall 0.9167, F1 0.9167, FPR 0.0303.
- **6.4 Confusion Matrix Analysis:** Comparative heatmaps.
- **6.5 Automated Test Suite Execution:** 12 passed tests (100% success rate).

---

### Chapter 7: Security Analysis, Discussion & Threats to Validity
- **7.1 Containment Protocols:** Temporary account suspension, session revocation, and audit preservation.
- **7.2 Privacy & Ethical Considerations:** Privacy-compliant IP logging and role-isolated data views.
- **7.3 Limitations:** Limitations of standalone hash chaining against database write adversaries; synthetic dataset nuances.

---

### Chapter 8: Conclusion & Future Scope
- **8.1 Summary of Findings:** Validation of the hybrid approach in reducing false positives while maintaining high sensitivity.
- **8.2 Future Enhancements:** Integration of natural language processing for email semantics, federated learning, and hardware security module (HSM) anchoring.

---

### References (IEEE / ACM Format)
- Complete bibliography of peer-reviewed articles, books, and standards cited throughout the report.
