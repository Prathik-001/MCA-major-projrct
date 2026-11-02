const db = require('./db');
const crypto = require('crypto');

async function seedVirtualDesktopData() {
  console.log('💻 Checking and Seeding Virtual Desktop & Applications Data...');

  // Check if virtual computers are already seeded
  const existingVms = await db.find('virtual_computers');
  if (existingVms && existingVms.length > 0) {
    console.log(`Virtual computers already seeded (${existingVms.length} entries). Skipping.`);
    return;
  }

  // 1. Seed Registered System Applications
  const appsToSeed = [
    { app_key: 'finder', name: 'Finder', icon: 'Folder', category: 'System', is_system_app: true },
    { app_key: 'tasks', name: 'Task Manager', icon: 'CheckSquare', category: 'Productivity', is_system_app: true },
    { app_key: 'mail', name: 'Company Mail', icon: 'Mail', category: 'Communication', is_system_app: true },
    { app_key: 'documents', name: 'Documents', icon: 'FileText', category: 'Productivity', is_system_app: true },
    { app_key: 'chat', name: 'Team Chat', icon: 'MessageSquare', category: 'Communication', is_system_app: true },
    { app_key: 'calendar', name: 'Calendar', icon: 'Calendar', category: 'Productivity', is_system_app: true },
    { app_key: 'shared-drive', name: 'Shared Drive', icon: 'HardDrive', category: 'Storage', is_system_app: true },
    { app_key: 'activity-monitor', name: 'Activity Monitor', icon: 'Activity', category: 'Utilities', is_system_app: true },
    { app_key: 'settings', name: 'Settings', icon: 'Settings', category: 'System', is_system_app: true },
    { app_key: 'trash', name: 'Trash', icon: 'Trash2', category: 'System', is_system_app: true }
  ];

  for (const app of appsToSeed) {
    await db.insert('applications', app);
  }

  // Retrieve user profiles
  const profiles = await db.find('profiles');
  const userByEmail = {};
  for (const p of profiles) {
    userByEmail[p.email] = p;
  }

  const sarah = userByEmail['sarah.chen@sentinel.local'];
  const alex = userByEmail['alex.rivera@sentinel.local'];
  const jordan = userByEmail['employee@sentinel.local'] || userByEmail['jordan.hayes@sentinel.local'];
  const david = userByEmail['david.miller@sentinel.local'];
  const emma = userByEmail['emma.watson@sentinel.local'];
  const admin = userByEmail['admin@sentinel.local'];
  const manager = userByEmail['manager@sentinel.local'];

  // 2. Seed Virtual Computers & Preferences for All Profiles
  const vms = [
    {
      user: sarah,
      computer_name: "Sarah's Mac Studio (Finance-M3)",
      status: 'Online',
      wallpaper: 'sonoma-dark',
      current_application: 'Company Mail'
    },
    {
      user: alex,
      computer_name: "Alex's MacBook Pro (DevOps-M3-Max)",
      status: 'Online',
      wallpaper: 'ventura-dark',
      current_application: 'Finder'
    },
    {
      user: jordan,
      computer_name: "Jordan's Mac Pro (StaffDev-M2)",
      status: 'Online',
      wallpaper: 'monterey-dark',
      current_application: 'Documents'
    },
    {
      user: david,
      computer_name: "David's iMac (DataResearch-M3)",
      status: 'Offline',
      wallpaper: 'sonoma-dark',
      current_application: 'Finder'
    },
    {
      user: emma,
      computer_name: "Emma's MacBook Air (HR-M2)",
      status: 'Offline',
      wallpaper: 'cyber-dark',
      current_application: 'Task Manager'
    },
    {
      user: admin,
      computer_name: "CISO Workstation (CyberSec-M3-Ultra)",
      status: 'Online',
      wallpaper: 'cyber-dark',
      current_application: 'Activity Monitor'
    },
    {
      user: manager,
      computer_name: "SecOps Director Mac (Manager-M3)",
      status: 'Online',
      wallpaper: 'monterey-dark',
      current_application: 'Task Manager'
    }
  ];

  for (const vm of vms) {
    if (!vm.user) continue;
    await db.insert('virtual_computers', {
      employee_id: vm.user.id,
      computer_name: vm.computer_name,
      os_version: 'macOS 15.1 Sonoma Virtual Workstation',
      status: vm.status,
      lock_reason: null,
      locked_by: null,
      locked_at: null,
      current_session_id: 'sess_' + crypto.randomBytes(6).toString('hex'),
      current_application: vm.current_application,
      last_activity_at: new Date().toISOString()
    });

    await db.insert('desktop_preferences', {
      employee_id: vm.user.id,
      wallpaper: vm.wallpaper,
      dock_position: 'bottom',
      dock_size: 'medium',
      theme: 'dark',
      accent_color: 'blue',
      notifications_enabled: true
    });

    // Default: all 10 apps are enabled
    for (const app of appsToSeed) {
      await db.insert('employee_application_permissions', {
        employee_id: vm.user.id,
        app_key: app.app_key,
        is_allowed: true,
        updated_by: admin ? admin.id : null,
        updated_at: new Date().toISOString()
      });
    }

    // Active session
    await db.insert('employee_sessions', {
      session_id: 'sess_' + crypto.randomBytes(6).toString('hex'),
      employee_id: vm.user.id,
      ip_address: vm.user.department === 'Finance' ? '10.0.4.199' : '192.168.1.104',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      status: vm.status === 'Online' ? 'ACTIVE' : 'TERMINATED',
      started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      last_heartbeat: new Date().toISOString()
    });
  }

  // 3. Seed Isolated Folders & Files
  // Sarah's Personal Files
  if (sarah) {
    const fldFinance = await db.insert('folders', {
      employee_id: sarah.id,
      name: 'Q3 Financial Disclosures',
      is_shared: false
    });

    await db.insert('employee_files', {
      employee_id: sarah.id,
      folder_id: fldFinance.id,
      name: 'Q3_Consolidated_Financial_Model_v4.xlsx',
      file_type: 'spreadsheet',
      file_size_bytes: 1420000,
      classification: 'RESTRICTED',
      content_preview: '# CONFIDENTIAL FINANCIAL MODEL - Q3\nNet Operating Income: $42,500,000\nEBITDA Margin: 34.2%\nCash Equivalents: $184,200,000\nRestricted Reserves: $25,000,000',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: sarah.id,
      folder_id: fldFinance.id,
      name: 'Executive_Payroll_Summary_October.xlsx',
      file_type: 'spreadsheet',
      file_size_bytes: 840000,
      classification: 'CONFIDENTIAL',
      content_preview: '# EXECUTIVE PAYROLL SUMMARY - OCT 2026\nC-Suite Base Sum: $3,200,000\nRetention Bonus Allocations: $850,000\nWithholding Tax: $1,150,000',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: sarah.id,
      folder_id: null,
      name: 'Merger_Term_Sheet_Final_Draft.pdf',
      file_type: 'document',
      file_size_bytes: 3200000,
      classification: 'TOP SECRET',
      content_preview: '# PROJECT TITAN HORIZON: M&A TERM SHEET\nValuation: $240,000,000\nEquity Purchase: 75%\nEarnout: $40,000,000\nClearance Required: Level 5',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: sarah.id,
      folder_id: null,
      name: 'Old_Audit_Scrap_Q2.tmp',
      file_type: 'document',
      file_size_bytes: 45000,
      classification: 'INTERNAL',
      content_preview: 'Deprecated draft scrap calculation notes.',
      is_shared: false,
      is_deleted: true // in Trash!
    });
  }

  // Alex's Personal Files
  if (alex) {
    const fldDevops = await db.insert('folders', {
      employee_id: alex.id,
      name: 'Cloud Infrastructure Manifests',
      is_shared: false
    });

    await db.insert('employee_files', {
      employee_id: alex.id,
      folder_id: fldDevops.id,
      name: 'production_eks_cluster_values.yaml',
      file_type: 'code',
      file_size_bytes: 24500,
      classification: 'RESTRICTED',
      content_preview: 'apiVersion: eksctl.io/v1alpha5\nkind: ClusterConfig\nmetadata:\n  name: sentinel-prod-us-east-1\n  region: us-east-1\nnodeGroups:\n  - name: workers-spot\n    instanceType: m6i.2xlarge\n    minSize: 6\n    maxSize: 32',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: alex.id,
      folder_id: fldDevops.id,
      name: 'vault_hsm_unseal_keys.gpg',
      file_type: 'code',
      file_size_bytes: 12200,
      classification: 'TOP SECRET',
      content_preview: '-----BEGIN PGP MESSAGE-----\nVersion: Keybase OpenPGP v2.1.13\nComment: HSM Key Threshold 3-of-5\nwcBMA6z5w+y8d...encrypted secret payload\n-----END PGP MESSAGE-----',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: alex.id,
      folder_id: null,
      name: 'incident_dr_playbook.md',
      file_type: 'document',
      file_size_bytes: 65400,
      classification: 'INTERNAL',
      content_preview: '# CLOUD DISASTER RECOVERY & SRE FAILOVER RUNBOOK\n1. Confirm DNS health probes on Cloudflare.\n2. In event of us-east-1 partition, failover route53 latency routing to us-west-2.\n3. Verify Aurora Global Database replica promotion.',
      is_shared: false,
      is_deleted: false
    });
  }

  // Jordan's Personal Files
  if (jordan) {
    await db.insert('employee_files', {
      employee_id: jordan.id,
      folder_id: null,
      name: 'react_design_tokens.json',
      file_type: 'code',
      file_size_bytes: 18200,
      classification: 'INTERNAL',
      content_preview: '{\n  "colors": {\n    "cyberDark": "#090d16",\n    "cyanAccent": "#06b6d4",\n    "appleGlass": "rgba(255, 255, 255, 0.12)"\n  },\n  "borderRadius": "12px"\n}',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('employee_files', {
      employee_id: jordan.id,
      folder_id: null,
      name: 'frontend_api_swagger.yaml',
      file_type: 'code',
      file_size_bytes: 45000,
      classification: 'INTERNAL',
      content_preview: 'openapi: 3.0.0\ninfo:\n  title: Employee Virtual Desktop API\n  version: 2.0.0',
      is_shared: false,
      is_deleted: false
    });
  }

  // 4. Seed Isolated Documents with Version History
  if (sarah) {
    const doc1 = await db.insert('documents', {
      employee_id: sarah.id,
      title: '2026 Q3 Earnings Analysis & Dividend Forecast',
      content: `# Q3 EARNINGS & DIVIDEND FORECAST REPORT
Prepared by: Sarah Chen (Senior Financial Analyst)
Department: Finance & Treasury

## Executive Summary
Net revenue for Q3 demonstrated an annualized expansion of 18.4%, outpacing consensus estimates. Operating expenses remained well managed at $28.4M.

## Dividend Recommendation
The Treasury committee recommends a quarterly distribution of $0.48 per ordinary share, payable to shareholders of record on November 15, 2026.

## Confidentiality Note
This document contains material non-public information. Unauthorized transmission is strictly prohibited.`,
      version_count: 2,
      classification: 'RESTRICTED',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('document_versions', {
      document_id: doc1.id,
      version_num: 1,
      title: '2026 Q3 Earnings Analysis (Initial Draft)',
      content: `# Q3 EARNINGS REPORT (DRAFT 1)\nInitial forecast revenue: $39M. Preliminary dividend: $0.42.`,
      saved_by: sarah.id,
      sha256_hash: crypto.createHash('sha256').update('doc_v1_sarah').digest('hex')
    });

    await db.insert('document_versions', {
      document_id: doc1.id,
      version_num: 2,
      title: '2026 Q3 Earnings Analysis & Dividend Forecast',
      content: doc1.content,
      saved_by: sarah.id,
      sha256_hash: crypto.createHash('sha256').update(doc1.content).digest('hex')
    });
  }

  if (alex) {
    const doc2 = await db.insert('documents', {
      employee_id: alex.id,
      title: 'Zero-Trust Network Access (ZTNA) Architecture Plan',
      content: `# ZERO-TRUST NETWORK ACCESS (ZTNA) SPECIFICATION
Author: Alex Rivera (DevOps & Cloud Lead)
Status: In Implementation Review

## Objectives
1. Eliminate legacy corporate VPN perimeter in favor of identity-aware micro-tunnels.
2. Enforce continuous device posture evaluation via Mutual TLS (mTLS) with TPM 2.0 cryptographic attestation.
3. Integrate real-time behavioral telemetry with UBA Sentinel to dynamically revoke tokens if risk score exceeds 60.

## Implementation Milestones
- Phase 1: Deploy Envoy proxy sidecars on Kubernetes ingress (Completed)
- Phase 2: Enforce short-lived SPIFFE/SPIRE X.509 certificates (In Progress)
- Phase 3: Dynamic risk scoring integration with Sentinel SOC (Current)`,
      version_count: 1,
      classification: 'RESTRICTED',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('document_versions', {
      document_id: doc2.id,
      version_num: 1,
      title: 'Zero-Trust Network Access (ZTNA) Architecture Plan',
      content: doc2.content,
      saved_by: alex.id,
      sha256_hash: crypto.createHash('sha256').update(doc2.content).digest('hex')
    });
  }

  if (jordan) {
    const doc3 = await db.insert('documents', {
      employee_id: jordan.id,
      title: 'macOS Virtual Desktop Window Manager Architecture',
      content: `# MACOS VIRTUAL DESKTOP ARCHITECTURE
Author: Jordan Hayes (Staff Software Engineer)

## Overview
A high-performance simulated desktop environment providing independent, persistent workspaces for each authenticated enterprise employee.

## Core Component Modules:
- WindowManager: Drag, resize, focus stacking, minimize, maximize.
- DockBar: Glassmorphism container with magnification and running indicators.
- MenuBar: Apple menu, dynamic active application menus, live system telemetry.
- Applications: Sandboxed React component windows connecting to isolated REST endpoints.`,
      version_count: 1,
      classification: 'INTERNAL',
      is_shared: false,
      is_deleted: false
    });

    await db.insert('document_versions', {
      document_id: doc3.id,
      version_num: 1,
      title: 'macOS Virtual Desktop Window Manager Architecture',
      content: doc3.content,
      saved_by: jordan.id,
      sha256_hash: crypto.createHash('sha256').update(doc3.content).digest('hex')
    });
  }

  // 5. Seed Isolated Tasks
  if (sarah) {
    const t1 = await db.insert('tasks', {
      assigned_to: sarah.id,
      created_by: manager ? manager.id : sarah.id,
      title: 'Audit Q3 Financial Reserves & Escrow Reconciliation',
      description: 'Perform complete line-by-line verification between the banking clearing house records and internal GL balance sheets.',
      priority: 'Urgent',
      status: 'In Progress',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });

    await db.insert('task_comments', {
      task_id: t1.id,
      author_id: sarah.id,
      author_name: 'Sarah Chen',
      comment: 'Initial discrepancies of $14.2K resolved with Global Trust bank. Final verification underway.'
    });

    await db.insert('tasks', {
      assigned_to: sarah.id,
      created_by: manager ? manager.id : sarah.id,
      title: 'Review M&A Term Sheet Closing Deliverables',
      description: 'Cross-check legal provisions in Titan Horizon merger agreement prior to Board meeting.',
      priority: 'High',
      status: 'Pending',
      due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });

    await db.insert('tasks', {
      assigned_to: sarah.id,
      created_by: sarah.id,
      title: 'Submit Monthly Financial Department Expense Vouchers',
      description: 'Collate team travel receipts and software subscriptions.',
      priority: 'Low',
      status: 'Completed',
      completion_notes: 'Submitted to HR and Finance ledger on Oct 24.',
      completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });
  }

  if (alex) {
    await db.insert('tasks', {
      assigned_to: alex.id,
      created_by: manager ? manager.id : alex.id,
      title: 'Rotate Production TLS & Wildcard Certificates',
      description: 'Issue new Let’s Encrypt automated ACME certificates for *.sentinel.local and update ingress secrets.',
      priority: 'Urgent',
      status: 'In Progress',
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });

    await db.insert('tasks', {
      assigned_to: alex.id,
      created_by: alex.id,
      title: 'Patch Critical OpenSSL Vulnerability on Node Pool',
      description: 'Apply security advisory CVE-2026-3819 kernel upgrades across all worker nodes.',
      priority: 'High',
      status: 'Pending',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });
  }

  if (jordan) {
    await db.insert('tasks', {
      assigned_to: jordan.id,
      created_by: manager ? manager.id : jordan.id,
      title: 'Refactor macOS Window Manager for Drag Optimization',
      description: 'Use requestAnimationFrame and boundary checks to ensure zero-lag window dragging.',
      priority: 'High',
      status: 'In Progress',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });
  }

  // 6. Seed Realistic Company Mail (Strict Mailbox Isolation)
  // Email 1: From CFO to Sarah Chen
  if (sarah) {
    const email1 = await db.insert('employee_emails', {
      sender_id: manager ? manager.id : sarah.id,
      sender_email: 'cfo@sentinel.local',
      sender_name: 'Arthur Sterling (Chief Financial Officer)',
      subject: 'URGENT: Pre-Closing Financial Disclosure for Titan Horizon ($240M)',
      body: `Sarah,

Please ensure the attached M&A valuation figures and escrow schedules are verified before our executive committee meeting at 3 PM tomorrow.

We must confirm that the $20M IP patent holdback clause matches the exact schedule signed by outside legal counsel. Treat this information under strictest Level 5 confidentiality.

Best regards,
Arthur Sterling
Chief Financial Officer | Apex Sentinel Corp`,
      is_draft: false,
      is_starred: true,
      is_deleted: false,
      has_attachments: true,
      sent_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    });

    await db.insert('email_recipients', {
      email_id: email1.id,
      recipient_id: sarah.id,
      recipient_email: sarah.email,
      recipient_name: sarah.full_name,
      folder: 'inbox',
      is_read: false,
      is_starred: true,
      is_deleted: false
    });

    await db.insert('email_attachments', {
      email_id: email1.id,
      file_name: 'Titan_Horizon_Escrow_Schedule_Executed.pdf',
      file_size_bytes: 2150000,
      mime_type: 'application/pdf',
      storage_path: '/attachments/titan_escrow.pdf'
    });

    // Email 2: Sarah sends to Alex Rivera
    if (alex) {
      const email2 = await db.insert('employee_emails', {
        sender_id: sarah.id,
        sender_email: sarah.email,
        sender_name: sarah.full_name,
        subject: 'Inquiry: Dedicated SFTP Access for Foreign Banking Audits',
        body: `Hi Alex,

Our European banking partners require an encrypted SFTP gateway to deposit the escrow confirmation tokens. Could you confirm if our SRE team has whitelisted the Frankfurt IP blocks (194.25.0.0/16)?

Thanks,
Sarah Chen
Senior Financial Analyst`,
        is_draft: false,
        is_starred: false,
        is_deleted: false,
        has_attachments: false,
        sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      });

      // Appears in Alex's inbox
      await db.insert('email_recipients', {
        email_id: email2.id,
        recipient_id: alex.id,
        recipient_email: alex.email,
        recipient_name: alex.full_name,
        folder: 'inbox',
        is_read: true,
        is_starred: false,
        is_deleted: false
      });

      // Appears in Sarah's sent folder
      await db.insert('email_recipients', {
        email_id: email2.id,
        recipient_id: sarah.id,
        recipient_email: sarah.email,
        recipient_name: sarah.full_name,
        folder: 'sent',
        is_read: true,
        is_starred: false,
        is_deleted: false
      });
    }

    // Email 3: Draft by Sarah
    await db.insert('employee_emails', {
      sender_id: sarah.id,
      sender_email: sarah.email,
      sender_name: sarah.full_name,
      subject: 'DRAFT: Q3 Board Financial Presentation Slide Notes',
      body: `Key talking points for the Board:
1. Operational revenue up 18.4%.
2. Treasury reserves strong at $184M.
3. Next steps on debt refinancing...`,
      is_draft: true,
      is_starred: false,
      is_deleted: false,
      has_attachments: false,
      sent_at: null
    });
  }

  // Alex's emails
  if (alex) {
    const emailAlexAlert = await db.insert('employee_emails', {
      sender_id: admin ? admin.id : alex.id,
      sender_email: 'alerts@pagerduty.sentinel.local',
      sender_name: 'Sentinel Infrastructure Alerting Bot',
      subject: '[P1 ALERT - RESOLVED] Aurora DB Read Replica Latency Spike in us-east-1',
      body: `ALERT INCIDENT #PD-90812
Service: Aurora Multi-AZ Cluster
Severity: High
Status: Resolved

Incident Summary:
Latency reached 240ms on replica-03 due to intensive analytical batch queries. Read traffic automatically shed to secondary replica pool. All metrics within standard SLA limits.`,
      is_draft: false,
      is_starred: false,
      is_deleted: false,
      has_attachments: false,
      sent_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    });

    await db.insert('email_recipients', {
      email_id: emailAlexAlert.id,
      recipient_id: alex.id,
      recipient_email: alex.email,
      recipient_name: alex.full_name,
      folder: 'inbox',
      is_read: true,
      is_starred: false,
      is_deleted: false
    });
  }

  // 7. Seed Team Chat & Real Conversations
  // Group Conversation: #general-announcements
  const convGeneral = await db.insert('chat_conversations', {
    name: '#general-company',
    is_group: true,
    created_by: admin ? admin.id : null
  });

  for (const p of profiles) {
    await db.insert('conversation_members', {
      conversation_id: convGeneral.id,
      employee_id: p.id
    });
  }

  await db.insert('chat_messages', {
    conversation_id: convGeneral.id,
    sender_id: admin ? admin.id : 'a1000000-0000-0000-0000-000000000001',
    sender_name: 'Dr. Evelyn Cross (CISO)',
    message: 'Welcome everyone to the new Sentinel Virtual Desktop Workstations. Please be reminded that all work must be performed inside your authorized virtual computer.',
    attachments: [],
    is_read: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  });

  await db.insert('chat_messages', {
    conversation_id: convGeneral.id,
    sender_id: manager ? manager.id : 'a1000000-0000-0000-0000-000000000002',
    sender_name: 'Marcus Vance',
    message: 'Department managers, please remind your teams to complete quarterly task deliverables by end of week.',
    attachments: [],
    is_read: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  });

  // Direct 1-on-1 Conversation between Sarah and Alex
  if (sarah && alex) {
    const convSarahAlex = await db.insert('chat_conversations', {
      name: 'Sarah Chen & Alex Rivera',
      is_group: false,
      created_by: sarah.id
    });

    await db.insert('conversation_members', { conversation_id: convSarahAlex.id, employee_id: sarah.id });
    await db.insert('conversation_members', { conversation_id: convSarahAlex.id, employee_id: alex.id });

    await db.insert('chat_messages', {
      conversation_id: convSarahAlex.id,
      sender_id: sarah.id,
      sender_name: 'Sarah Chen',
      message: 'Hey Alex, do we have the updated VPN certificates ready for the audit portal?',
      attachments: [],
      is_read: true,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    });

    await db.insert('chat_messages', {
      conversation_id: convSarahAlex.id,
      sender_id: alex.id,
      sender_name: 'Alex Rivera',
      message: 'Yes Sarah, I just rolled out the new Let’s Encrypt automated rotation. The tunnel should be active now.',
      attachments: [],
      is_read: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    });
  }

  // 8. Seed Calendar Events
  if (sarah) {
    await db.insert('calendar_events', {
      employee_id: sarah.id,
      title: 'Board of Directors Audit Review',
      description: 'Formal review of Q3 balance sheet and M&A escrow terms with CISO and CFO.',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 25.5 * 60 * 60 * 1000).toISOString(),
      location: 'Executive Boardroom A / Virtual Room 1',
      is_shared: true,
      attendees: ['sarah.chen@sentinel.local', 'cfo@sentinel.local', 'admin@sentinel.local'],
      color: 'amber'
    });

    await db.insert('calendar_events', {
      employee_id: sarah.id,
      title: 'Finance Weekly Budget Sync',
      description: 'Weekly team checkpoint on departmental disbursements and wire tracking.',
      start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
      location: 'Virtual Room 3',
      is_shared: false,
      attendees: ['sarah.chen@sentinel.local'],
      color: 'blue'
    });
  }

  if (alex) {
    await db.insert('calendar_events', {
      employee_id: alex.id,
      title: 'Cloud Infrastructure Sprint Retrospective',
      description: 'Review SRE metrics, latency alerts, and Kubernetes cluster upgrade status.',
      start_time: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(),
      location: 'DevOps War Room / Virtual Room 2',
      is_shared: true,
      attendees: ['alex.rivera@sentinel.local', 'manager@sentinel.local'],
      color: 'cyan'
    });
  }

  // 9. Seed Shared Drive Resources
  const sharedRes = [
    {
      name: 'Corporate M&A Vault (Project Titan)',
      resource_type: 'VAULT',
      department: 'Finance',
      access_level: 'RESTRICTED',
      owner_id: sarah ? sarah.id : null,
      description: 'Confidential valuation models, board terms, and escrow contracts for the $240M acquisition.',
      file_count: 14
    },
    {
      name: 'Cloud Infrastructure HSM Master Keys',
      resource_type: 'VAULT',
      department: 'Infrastructure',
      access_level: 'RESTRICTED',
      owner_id: alex ? alex.id : null,
      description: 'Production zero-knowledge unseal keys and Cloudflare edge certificates.',
      file_count: 8
    },
    {
      name: 'Engineering Design Schematics & Architecture',
      resource_type: 'FOLDER',
      department: 'Engineering',
      access_level: 'DEPARTMENT',
      owner_id: jordan ? jordan.id : null,
      description: 'Full microservices blueprints, dataflow diagrams, and UI component standards.',
      file_count: 22
    },
    {
      name: 'Apex Sentinel Employee Handbook & Benefits',
      resource_type: 'FOLDER',
      department: 'Human Resources',
      access_level: 'PUBLIC',
      owner_id: emma ? emma.id : null,
      description: 'Company-wide standard operating procedures, medical benefits, and code of conduct.',
      file_count: 6
    }
  ];

  for (const sr of sharedRes) {
    await db.insert('shared_resources', sr);
  }

  console.log('✅ Virtual Desktop, Mail, Finder, Tasks, Docs, Chat, and Calendar Seeded Successfully!');
}

module.exports = seedVirtualDesktopData;
