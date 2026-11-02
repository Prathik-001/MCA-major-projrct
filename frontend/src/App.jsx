import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutProvider } from './context/LayoutContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Employee Portal Pages
import EmployeeLoginPage from './pages/employee/EmployeeLoginPage';
import EmployeeRegisterPage from './pages/employee/EmployeeRegisterPage';
import EmployeeDesktopPage from './pages/employee/EmployeeDesktopPage';
import EmployeeProfilePage from './pages/employee/EmployeeProfilePage';
import EmployeeActivityPage from './pages/employee/EmployeeActivityPage';
import EmployeeSettingsPage from './pages/employee/EmployeeSettingsPage';

// Security Portal Pages
import SecurityLoginPage from './pages/security/SecurityLoginPage';
import VirtualComputersPage from './pages/security/VirtualComputersPage';

// SOC Dashboard Pages
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import LiveActivityFeedPage from './pages/LiveActivityFeedPage';
import AlertsCenterPage from './pages/AlertsCenterPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import UserRiskProfilePage from './pages/UserRiskProfilePage';
import BaselineComparisonPage from './pages/BaselineComparisonPage';
import RuleConfigurationPage from './pages/RuleConfigurationPage';
import AuditLogVerificationPage from './pages/AuditLogVerificationPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import ResearchEvaluationPage from './pages/ResearchEvaluationPage';
import SettingsSimulationPage from './pages/SettingsSimulationPage';

// Legacy / Demo Pages
import LoginPage from './pages/LoginPage';
import EnterpriseWorkspacePage from './pages/EnterpriseWorkspacePage';
import CompanyLoginPage from './pages/CompanyLoginPage';
import CompanyWorkspacePage from './pages/CompanyWorkspacePage';

function ProtectedLayout({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Authenticating Secure Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/security/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // If employee visits an admin page, redirect to desktop
    return <Navigate to="/employee/desktop" replace />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}

function EmployeeProtected({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Mounting Workstation Session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/employee/login" replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-cyan-400 font-mono text-sm">
        Checking Workstation Authentication...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/employee/login" replace />;
  }

  if (user.role === 'Employee') {
    return <Navigate to="/employee/desktop" replace />;
  }

  return <Navigate to="/security/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root Intelligent Redirection */}
      <Route path="/" element={<RootRedirect />} />

      {/* =================================================================== */}
      {/* PART A: EMPLOYEE VIRTUAL COMPUTER PORTAL ROUTES                     */}
      {/* =================================================================== */}
      <Route
        path="/employee/login"
        element={user && user.role === 'Employee' ? <Navigate to="/employee/desktop" replace /> : <EmployeeLoginPage />}
      />
      <Route path="/employee/register" element={<EmployeeRegisterPage />} />
      <Route
        path="/employee/desktop"
        element={
          <EmployeeProtected>
            <EmployeeDesktopPage />
          </EmployeeProtected>
        }
      />
      <Route
        path="/employee/profile"
        element={
          <EmployeeProtected>
            <EmployeeProfilePage />
          </EmployeeProtected>
        }
      />
      <Route
        path="/employee/activity"
        element={
          <EmployeeProtected>
            <EmployeeActivityPage />
          </EmployeeProtected>
        }
      />
      <Route
        path="/employee/settings"
        element={
          <EmployeeProtected>
            <EmployeeSettingsPage />
          </EmployeeProtected>
        }
      />

      {/* =================================================================== */}
      {/* PART C: SECURITY ADMINISTRATOR PORTAL ROUTES                        */}
      {/* =================================================================== */}
      <Route
        path="/security/login"
        element={user && (user.role === 'Administrator' || user.role === 'Manager') ? <Navigate to="/security/dashboard" replace /> : <SecurityLoginPage />}
      />
      <Route
        path="/security/dashboard"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <DashboardOverviewPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/virtual-computers"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <VirtualComputersPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/activity-logs"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager', 'Employee']}>
            <LiveActivityFeedPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/threat-alerts"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <AlertsCenterPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/risk-analysis"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager', 'Employee']}>
            <UserRiskProfilePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/risk-analysis/:userId"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager', 'Employee']}>
            <UserRiskProfilePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/employees"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <UserManagementPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/incidents"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <IncidentDetailPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/audit-logs"
        element={
          <ProtectedLayout allowedRoles={['Administrator']}>
            <AuditLogVerificationPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/reports"
        element={
          <ProtectedLayout allowedRoles={['Administrator', 'Manager']}>
            <ReportsAnalyticsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/security/settings"
        element={
          <ProtectedLayout allowedRoles={['Administrator']}>
            <RuleConfigurationPage />
          </ProtectedLayout>
        }
      />

      {/* =================================================================== */}
      {/* BACKWARDS COMPATIBILITY ROUTE ALIASES                               */}
      {/* =================================================================== */}
      <Route path="/login" element={<Navigate to="/security/login" replace />} />
      <Route path="/activity" element={<Navigate to="/security/activity-logs" replace />} />
      <Route path="/alerts" element={<Navigate to="/security/threat-alerts" replace />} />
      <Route path="/incidents" element={<Navigate to="/security/incidents" replace />} />
      <Route path="/users" element={<Navigate to="/security/employees" replace />} />
      <Route path="/risk-profile" element={<Navigate to="/security/risk-analysis" replace />} />
      <Route path="/risk-profile/:userId" element={<ProtectedLayout allowedRoles={['Administrator', 'Manager', 'Employee']}><UserRiskProfilePage /></ProtectedLayout>} />
      <Route path="/baselines" element={<ProtectedLayout allowedRoles={['Administrator', 'Manager', 'Employee']}><BaselineComparisonPage /></ProtectedLayout>} />
      <Route path="/rules" element={<Navigate to="/security/settings" replace />} />
      <Route path="/audit" element={<Navigate to="/security/audit-logs" replace />} />
      <Route path="/reports" element={<Navigate to="/security/reports" replace />} />
      <Route path="/research" element={<ProtectedLayout allowedRoles={['Administrator', 'Manager']}><ResearchEvaluationPage /></ProtectedLayout>} />
      <Route path="/simulation" element={<ProtectedLayout allowedRoles={['Administrator']}><SettingsSimulationPage /></ProtectedLayout>} />
      <Route path="/settings" element={<Navigate to="/security/settings" replace />} />

      {/* Corporate Intranet Demo Aliases */}
      <Route path="/company/login" element={<CompanyLoginPage />} />
      <Route path="/company/workspace" element={<CompanyWorkspacePage />} />
      <Route path="/company" element={<Navigate to="/employee/desktop" replace />} />
      <Route path="/workspace" element={<Navigate to="/employee/desktop" replace />} />

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <AppRoutes />
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
