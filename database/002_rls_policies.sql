-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE / POSTGRESQL
-- (002_rls_policies.sql)
-- =====================================================================

-- Enable RLS on sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_chain_records ENABLE ROW LEVEL SECURITY;

-- Helper function to extract user role from auth.jwt()
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'role',
        current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'role',
        'Employee'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 1. Profiles Table Policies
-- Administrators: full access
CREATE POLICY admin_profiles_all ON profiles
    FOR ALL
    USING (current_user_role() = 'Administrator');

-- Managers: can view team members
CREATE POLICY manager_profiles_read ON profiles
    FOR SELECT
    USING (current_user_role() IN ('Administrator', 'Manager'));

-- Employees: can only view and update their own profile
CREATE POLICY employee_profiles_self ON profiles
    FOR ALL
    USING (id = auth.uid() OR current_user_role() IN ('Administrator', 'Manager'));

-- 2. Activity Events Table Policies
-- Administrators: can view and analyze all events
CREATE POLICY admin_activity_all ON activity_events
    FOR ALL
    USING (current_user_role() = 'Administrator');

-- Managers: can view department events
CREATE POLICY manager_activity_read ON activity_events
    FOR SELECT
    USING (current_user_role() IN ('Administrator', 'Manager'));

-- Employees: strictly restricted to their OWN activity records
CREATE POLICY employee_activity_self ON activity_events
    FOR SELECT
    USING (user_id = auth.uid());

-- 3. Security Alerts Table Policies
-- Employees cannot view security alerts or SOC incident data
CREATE POLICY staff_alerts_access ON security_alerts
    FOR SELECT
    USING (current_user_role() IN ('Administrator', 'Manager'));

CREATE POLICY admin_alerts_modify ON security_alerts
    FOR ALL
    USING (current_user_role() = 'Administrator');

-- 4. Audit Chain Records
-- Append-only for system; read-only for Administrator; blocked for normal Employees
CREATE POLICY admin_audit_read ON audit_chain_records
    FOR SELECT
    USING (current_user_role() = 'Administrator');
