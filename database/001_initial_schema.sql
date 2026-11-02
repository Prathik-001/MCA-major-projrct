-- =====================================================================
-- EXPLAINABLE HYBRID FRAMEWORK FOR INSIDER THREAT DETECTION
-- DATABASE SCHEMA: PostgreSQL / Supabase Migration (001_initial_schema.sql)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Administrator', 'Manager', 'Employee')),
    department VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. MONITORED USERS METADATA
CREATE TABLE IF NOT EXISTS monitored_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'Low' CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    current_risk_score NUMERIC(5,2) DEFAULT 0.00,
    baseline_status VARCHAR(50) DEFAULT 'Established' CHECK (baseline_status IN ('Established', 'Learning', 'Anomalous')),
    account_status VARCHAR(50) DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended', 'Flagged')),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ACTIVITY EVENTS (High-Throughput Audit Log)
CREATE TABLE IF NOT EXISTS activity_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resource_id VARCHAR(500) NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SUCCESS', 'FAILURE')),
    ip_address VARCHAR(50) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    risk_score NUMERIC(5,2) DEFAULT 0.00,
    detection_explanation JSONB DEFAULT '{}'::jsonb,
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_timestamp ON activity_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_events_is_suspicious ON activity_events(is_suspicious);

-- 4. DETECTION RULES
CREATE TABLE IF NOT EXISTS detection_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    threshold NUMERIC(10,2) NOT NULL,
    time_window_minutes INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    risk_weight INTEGER NOT NULL CHECK (risk_weight BETWEEN 1 AND 100),
    is_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DYNAMIC USER BASELINES
CREATE TABLE IF NOT EXISTS user_baselines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    work_hours_start INTEGER DEFAULT 9,
    work_hours_end INTEGER DEFAULT 18,
    avg_daily_downloads NUMERIC(10,2) DEFAULT 5.0,
    std_daily_downloads NUMERIC(10,2) DEFAULT 2.0,
    avg_daily_modifications NUMERIC(10,2) DEFAULT 12.0,
    std_daily_modifications NUMERIC(10,2) DEFAULT 4.0,
    avg_unique_resources_accessed NUMERIC(10,2) DEFAULT 8.0,
    std_unique_resources_accessed NUMERIC(10,2) DEFAULT 3.0,
    typical_ips JSONB DEFAULT '["192.168.1.100"]'::jsonb,
    sample_period_days INTEGER DEFAULT 30,
    is_baseline_locked BOOLEAN DEFAULT FALSE,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DYNAMIC RISK ASSESSMENTS
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    rule_risk_score NUMERIC(5,2) NOT NULL,
    anomaly_risk_score NUMERIC(5,2) NOT NULL,
    composite_risk_score NUMERIC(5,2) NOT NULL,
    contributing_factors JSONB DEFAULT '[]'::jsonb,
    assessed_by VARCHAR(50) DEFAULT 'SYSTEM_HYBRID'
);

-- 7. SECURITY ALERTS
CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    affected_resources JSONB DEFAULT '[]'::jsonb,
    detection_method VARCHAR(50) NOT NULL CHECK (detection_method IN ('RULE_BASED', 'ANOMALY_BASED', 'HYBRID')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    risk_score NUMERIC(5,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Investigating', 'Resolved', 'False Positive')),
    trigger_event_id UUID,
    contributing_factors JSONB DEFAULT '[]'::jsonb,
    mitigation_action TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);

-- 8. INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'Investigating', 'Resolved', 'False Positive')),
    lead_investigator VARCHAR(255),
    root_cause TEXT,
    containment_action VARCHAR(255) DEFAULT 'None',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 9. INVESTIGATION NOTES
CREATE TABLE IF NOT EXISTS investigation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CRYPTOGRAPHIC TAMPER-EVIDENT AUDIT CHAIN
CREATE TABLE IF NOT EXISTS audit_chain_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL NOT NULL UNIQUE,
    event_id UUID NOT NULL,
    event_payload JSONB NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    signature VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_audit_chain_sequence ON audit_chain_records(sequence_number ASC);

-- 11. MODEL RUNS & RESEARCH EVALUATIONS
CREATE TABLE IF NOT EXISTS model_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    run_type VARCHAR(50) NOT NULL,
    dataset_source VARCHAR(255) NOT NULL,
    parameters JSONB DEFAULT '{}'::jsonb,
    metrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_evaluation_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_run_id UUID REFERENCES model_runs(id) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL CHECK (method IN ('RULE_BASED', 'ANOMALY_BASED', 'HYBRID')),
    dataset VARCHAR(255) NOT NULL,
    sample_size INTEGER NOT NULL,
    true_positives INTEGER NOT NULL,
    false_positives INTEGER NOT NULL,
    true_negatives INTEGER NOT NULL,
    false_negatives INTEGER NOT NULL,
    precision_score NUMERIC(5,4) NOT NULL,
    recall_score NUMERIC(5,4) NOT NULL,
    f1_score NUMERIC(5,4) NOT NULL,
    false_positive_rate NUMERIC(5,4) NOT NULL,
    detection_delay_ms NUMERIC(10,2) DEFAULT 0.00,
    confusion_matrix JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
