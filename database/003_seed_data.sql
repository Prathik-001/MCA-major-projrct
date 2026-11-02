-- =====================================================================
-- SEED DATA FOR SYSTEM INITIALIZATION (003_seed_data.sql)
-- =====================================================================

-- Default Detection Rules
INSERT INTO detection_rules (id, rule_name, rule_code, description, threshold, time_window_minutes, severity, risk_weight, is_enabled)
VALUES
('d1000000-0000-0000-0000-000000000001', 'Brute Force Authentication', 'RULE_FAILED_LOGINS', 'Triggers when consecutive failed login attempts exceed threshold within a rolling window', 5, 10, 'High', 35, true),
('d1000000-0000-0000-0000-000000000002', 'Excessive File Downloads', 'RULE_EXCESSIVE_DOWNLOADS', 'Identifies bulk file downloads that drastically exceed normal user behavior patterns', 20, 15, 'Critical', 45, true),
('d1000000-0000-0000-0000-000000000003', 'Repeated Access Denied', 'RULE_UNAUTHORIZED_ACCESS', 'Detects systematic enumeration of sensitive or unauthorized endpoints', 4, 10, 'Medium', 25, true),
('d1000000-0000-0000-0000-000000000004', 'Off-Hours Sensitive Access', 'RULE_OFF_HOURS_ACTIVITY', 'Detects high volume access outside defined standard working hours (20:00 - 06:00)', 1, 60, 'Medium', 20, true),
('d1000000-0000-0000-0000-000000000005', 'Mass Record Modifications', 'RULE_RECORD_MODIFICATION_SPIKE', 'Flags high frequency record updates or deletion bursts indicative of sabotage', 25, 15, 'Critical', 40, true),
('d1000000-0000-0000-0000-000000000006', 'Sensitive Endpoint Reconnaissance', 'RULE_SENSITIVE_RESOURCE_BURST', 'Flags rapid probing across more than 8 unique confidential resources', 8, 5, 'High', 30, true)
ON CONFLICT (rule_code) DO NOTHING;
