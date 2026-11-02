-- =====================================================================
-- EXPLAINABLE HYBRID FRAMEWORK FOR INSIDER THREAT DETECTION
-- DATABASE SCHEMA EXTENSION: EMPLOYEE VIRTUAL DESKTOP & COMPANY APPLICATIONS
-- Migration: 004_employee_virtual_desktop.sql
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. VIRTUAL COMPUTERS
CREATE TABLE IF NOT EXISTS virtual_computers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    computer_name VARCHAR(150) NOT NULL,
    os_version VARCHAR(100) DEFAULT 'macOS 15.1 Sonoma Virtual Edition',
    status VARCHAR(50) DEFAULT 'Online' CHECK (status IN ('Online', 'Offline', 'Starting', 'Locked', 'Suspended')),
    lock_reason TEXT,
    locked_by UUID REFERENCES profiles(id),
    locked_at TIMESTAMPTZ,
    current_session_id VARCHAR(100),
    current_application VARCHAR(100) DEFAULT 'Finder',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DESKTOP PREFERENCES
CREATE TABLE IF NOT EXISTS desktop_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    wallpaper VARCHAR(255) DEFAULT 'sonoma-dark',
    dock_position VARCHAR(20) DEFAULT 'bottom' CHECK (dock_position IN ('bottom', 'left', 'right')),
    dock_size VARCHAR(20) DEFAULT 'medium' CHECK (dock_size IN ('small', 'medium', 'large')),
    theme VARCHAR(20) DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'auto')),
    accent_color VARCHAR(50) DEFAULT 'blue',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATIONS & EMPLOYEE PERMISSIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    app_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_system_app BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_application_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    app_key VARCHAR(50) NOT NULL,
    is_allowed BOOLEAN DEFAULT TRUE,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, app_key)
);

-- 4. EMPLOYEE SESSIONS
CREATE TABLE IF NOT EXISTS employee_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    ip_address VARCHAR(50) NOT NULL,
    user_agent TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TERMINATED', 'EXPIRED')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    terminated_at TIMESTAMPTZ,
    terminated_by VARCHAR(100)
);

-- 5. FOLDERS & FILES
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    is_shared BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    storage_path TEXT,
    content_preview TEXT,
    classification VARCHAR(50) DEFAULT 'INTERNAL' CHECK (classification IN ('INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'TOP SECRET')),
    is_shared BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES employee_files(id) ON DELETE CASCADE,
    granted_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    granted_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(file_id, granted_to)
);

-- 6. DOCUMENTS & VERSIONS
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT DEFAULT '',
    version_count INTEGER DEFAULT 1,
    classification VARCHAR(50) DEFAULT 'INTERNAL' CHECK (classification IN ('INTERNAL', 'CONFIDENTIAL', 'RESTRICTED', 'TOP SECRET')),
    is_shared BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_num INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    saved_by UUID REFERENCES profiles(id),
    sha256_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TASKS & COMMENTS
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    priority VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    due_date TIMESTAMPTZ,
    completion_notes TEXT,
    completed_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COMPANY MAIL & ATTACHMENTS
CREATE TABLE IF NOT EXISTS employee_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    is_draft BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    has_attachments BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES employee_emails(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    folder VARCHAR(30) DEFAULT 'inbox' CHECK (folder IN ('inbox', 'trash', 'archive')),
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES employee_emails(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT DEFAULT 0,
    mime_type VARCHAR(100),
    storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TEAM CHAT & CONVERSATIONS
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255),
    is_group BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, employee_id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    sender_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CALENDAR EVENTS
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location VARCHAR(255) DEFAULT 'Virtual Room',
    is_shared BOOLEAN DEFAULT FALSE,
    attendees JSONB DEFAULT '[]'::jsonb,
    color VARCHAR(30) DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SHARED DRIVE & ACCESS REQUESTS
CREATE TABLE IF NOT EXISTS shared_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('FOLDER', 'VAULT', 'FILE', 'DATABASE')),
    department VARCHAR(100) NOT NULL,
    access_level VARCHAR(50) DEFAULT 'DEPARTMENT' CHECK (access_level IN ('PUBLIC', 'DEPARTMENT', 'RESTRICTED')),
    owner_id UUID REFERENCES profiles(id),
    description TEXT,
    file_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES shared_resources(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    employee_email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE virtual_computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE desktop_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Virtual Computers: Employees can read own, Admins can read & manage all
CREATE POLICY virtual_computers_employee_read ON virtual_computers
    FOR SELECT USING (auth.uid() = employee_id OR auth.role() = 'Administrator');

-- Files: Employees can only read own files unless shared
CREATE POLICY files_employee_isolation ON employee_files
    FOR ALL USING (auth.uid() = employee_id OR is_shared = TRUE OR auth.role() = 'Administrator');

-- Documents: Isolation
CREATE POLICY documents_employee_isolation ON documents
    FOR ALL USING (auth.uid() = employee_id OR is_shared = TRUE OR auth.role() = 'Administrator');

-- Tasks: Isolation
CREATE POLICY tasks_employee_isolation ON tasks
    FOR ALL USING (auth.uid() = assigned_to OR auth.uid() = created_by OR auth.role() IN ('Administrator', 'Manager'));

-- Emails: Sender and Recipient Isolation
CREATE POLICY emails_sender_isolation ON employee_emails
    FOR ALL USING (auth.uid() = sender_id OR auth.role() = 'Administrator');

CREATE POLICY emails_recipient_isolation ON email_recipients
    FOR ALL USING (auth.uid() = recipient_id OR auth.role() = 'Administrator');
