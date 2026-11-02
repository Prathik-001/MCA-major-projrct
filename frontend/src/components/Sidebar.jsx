import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import SystemMaintenanceModal from './SystemMaintenanceModal';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Users,
  UserCheck,
  BarChart3,
  Sliders,
  FileLock2,
  FileText,
  BrainCircuit,
  Flame,
  Search,
  Laptop,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
  Monitor
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'Employee';
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileSidebarOpen,
    closeMobileSidebar
  } = useLayout();

  const [filterQuery, setFilterQuery] = useState('');
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  // Grouped Navigation Structure with friendly labels
  const navSections = [
    {
      title: 'Virtual Fleet',
      items: [
        { name: 'Virtual Computers', path: '/security/virtual-computers', icon: Laptop, roles: ['Administrator', 'Manager'], badge: 'Fleet' },
        { name: 'macOS Desktop', path: '/employee/desktop', icon: Monitor, roles: ['Administrator', 'Manager', 'Employee'], badge: 'Virtual' }
      ]
    },
    {
      title: 'Threat Operations',
      items: [
        { name: 'SOC Overview', path: '/security/dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Manager'] },
        { name: 'Threat Alerts', path: '/security/threat-alerts', icon: AlertTriangle, roles: ['Administrator', 'Manager'], badge: 'Live' },
        { name: 'Incidents & Triage', path: '/security/incidents', icon: ShieldAlert, roles: ['Administrator', 'Manager'] },
        { name: 'Live Activity Stream', path: '/security/activity-logs', icon: Activity, roles: ['Administrator', 'Manager', 'Employee'] }
      ]
    },
    {
      title: 'Identity & Access',
      items: [
        { name: 'User Directory', path: '/security/employees', icon: Users, roles: ['Administrator', 'Manager'] },
        { name: 'Risk Dossiers', path: '/security/risk-analysis', icon: UserCheck, roles: ['Administrator', 'Manager', 'Employee'] },
        { name: 'Behavioral Baselines', path: '/baselines', icon: BarChart3, roles: ['Administrator', 'Manager', 'Employee'] }
      ]
    },
    {
      title: 'Admin & Maintenance',
      items: [
        { name: 'Detection Rule Lab', path: '/security/settings', icon: Sliders, roles: ['Administrator'] },
        { name: 'Audit Ledger', path: '/security/audit-logs', icon: FileLock2, roles: ['Administrator'], badge: 'SHA-256' },
        { name: 'MITRE Reports', path: '/security/reports', icon: FileText, roles: ['Administrator', 'Manager'] },
        { name: 'Threat Simulations', path: '/simulation', icon: Flame, roles: ['Administrator'] },
        { name: 'ML & Research', path: '/research', icon: BrainCircuit, roles: ['Administrator', 'Manager'] }
      ]
    }
  ];

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Mobile Header / Close Button */}
      {isMobile && (
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
              UBA
            </div>
            <span className="font-bold text-xs text-white">Navigation Menu</span>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar (Only when expanded or mobile) */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/30">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search navigation..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {navSections.map(section => {
          const accessibleItems = section.items.filter(item => {
            if (!item.roles.includes(role)) return false;
            if (filterQuery) {
              return item.name.toLowerCase().includes(filterQuery.toLowerCase());
            }
            return true;
          });

          if (accessibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {(!sidebarCollapsed || isMobile) && (
                <div className="px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>{section.title}</span>
                  <span className="text-[9px] text-slate-600 font-mono">({accessibleItems.length})</span>
                </div>
              )}

              <div className="space-y-0.5">
                {accessibleItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <div key={item.path} className="relative group">
                      <NavLink
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => { if (isMobile) closeMobileSidebar(); }}
                        className={({ isActive }) => `
                          flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-3'} py-2 rounded-xl text-xs font-medium transition-all
                          ${isActive
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm shadow-cyan-950/40'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                          {(!sidebarCollapsed || isMobile) && (
                            <span className="truncate">{item.name}</span>
                          )}
                        </div>

                        {(!sidebarCollapsed || isMobile) && item.badge && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                            item.badge === 'Live' ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' :
                            item.badge === 'Fleet' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                            item.badge === 'SHA-256' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Floating Tooltip in Collapsed Mode */}
                      {sidebarCollapsed && !isMobile && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1.5 bg-[#141827] border border-slate-700 rounded-lg text-xs font-medium text-white shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Maintenance Hub Button & Sidebar Collapse Footer */}
      <div className="p-2.5 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        {role === 'Administrator' && (
          <button
            onClick={() => setMaintenanceOpen(true)}
            title="System Maintenance Hub (Diagnostics & 1-Click Actions)"
            className={`w-full ${sidebarCollapsed && !isMobile ? 'p-2 justify-center' : 'p-2.5'} bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 rounded-xl text-left flex items-center justify-between transition-all group`}
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:rotate-45 transition-transform">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              {(!sidebarCollapsed || isMobile) && (
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>Maintenance Hub</span>
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">1-Click Admin Tools</div>
                </div>
              )}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <span className="text-[10px] text-slate-500 group-hover:text-white font-mono">&rarr;</span>
            )}
          </button>
        )}

        {/* Desktop Sidebar Collapse Toggle Button */}
        {!isMobile && (
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
            className="w-full py-1.5 px-2 bg-slate-900/60 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 text-xs transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Collapse</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-800 bg-[#090d16] shrink-0 min-h-[calc(100vh-4rem)] select-none font-sans transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderNavContent(false)}
      </aside>

      {/* Mobile Slide-Out Drawer with Backdrop */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Container */}
          <aside className="relative w-72 max-w-[80vw] bg-[#090d16] border-r border-slate-800 flex flex-col h-full shadow-2xl z-10">
            {renderNavContent(true)}
          </aside>
        </div>
      )}

      {/* System Maintenance Hub Modal */}
      <SystemMaintenanceModal
        isOpen={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
      />
    </>
  );
}
