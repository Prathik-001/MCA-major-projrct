import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  Settings,
  User,
  Image,
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Laptop,
  Check
} from 'lucide-react';

export const WALLPAPERS = [
  {
    id: 'sonoma-dark',
    name: 'macOS Sonoma Horizon',
    previewGradient: 'from-amber-600 via-rose-700 to-indigo-950',
    cssBackground: 'radial-gradient(ellipse 90% 70% at 50% 105%, #fb923c 0%, #e11d48 28%, #7c3aed 55%, #1e1b4b 78%, #090d16 100%)'
  },
  {
    id: 'sequoia-dark',
    name: 'macOS Sequoia Aurora',
    previewGradient: 'from-emerald-700 via-sky-800 to-slate-950',
    cssBackground: 'radial-gradient(circle at 20% 25%, #059669 0%, transparent 40%), radial-gradient(circle at 80% 25%, #0284c7 0%, transparent 45%), radial-gradient(ellipse at 50% 95%, #047857 0%, #064e3b 35%, #020617 80%)'
  },
  {
    id: 'ventura-dark',
    name: 'macOS Ventura Flowing Bloom',
    previewGradient: 'from-orange-600 via-red-800 to-slate-950',
    cssBackground: 'radial-gradient(circle at 75% 20%, #f97316 0%, transparent 45%), radial-gradient(circle at 20% 80%, #be123c 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, #7c2d12 0%, #1e1b4b 60%, #030712 100%)'
  },
  {
    id: 'monterey-dark',
    name: 'macOS Monterey Ocean Waves',
    previewGradient: 'from-purple-700 via-blue-800 to-slate-950',
    cssBackground: 'radial-gradient(circle at 25% 75%, #7c3aed 0%, transparent 50%), radial-gradient(circle at 80% 25%, #0284c7 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, #2e1065 0%, #0f172a 70%, #020617 100%)'
  },
  {
    id: 'cyber-dark',
    name: 'Sentinel Security Dark Mesh',
    previewGradient: 'from-cyan-800 via-slate-900 to-blue-950',
    cssBackground: 'radial-gradient(circle at 50% 50%, #0e7490 0%, #082f49 40%, #020617 80%)'
  }
];

export default function SettingsApp({ currentUser, currentWallpaper, onWallpaperChange }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const [selectedWallpaper, setSelectedWallpaper] = useState(currentWallpaper || 'sonoma-dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Wallpaper Change
  const handleSelectWallpaper = async (wpId) => {
    setSelectedWallpaper(wpId);
    if (onWallpaperChange) onWallpaperChange(wpId);

    setSaving(true);
    try {
      await ApiClient.updateMyPreferences({ wallpaper: wpId });
      setSuccessMsg('Desktop wallpaper updated and persisted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update wallpaper:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-52 bg-[#0e111a] border-r border-slate-800 flex flex-col p-3 shrink-0">
        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">Preferences</div>
        <nav className="space-y-1">
          {[
            { id: 'appearance', label: 'Appearance & Wallpaper', icon: Image },
            { id: 'profile', label: 'User Profile & ID', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Session & Security', icon: Shield }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#141721]">
        {successMsg && (
          <div className="mb-4 p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Appearance / Wallpaper Tab */}
        {activeTab === 'appearance' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Desktop Appearance & Wallpaper</h3>
            <p className="text-xs text-slate-400 mb-5">Customize your simulated macOS desktop environment.</p>

            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map(wp => {
                const isSelected = selectedWallpaper === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => handleSelectWallpaper(wp.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                    }`}
                  >
                    <div
                      className="w-full h-24 rounded-xl mb-2.5 shadow-inner relative overflow-hidden"
                      style={{ background: wp.cssBackground }}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-2" />
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{wp.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. User Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Employee Workstation Identity</h3>
            <p className="text-xs text-slate-400 mb-5">Enterprise Single Sign-On (SSO) credentials.</p>

            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 max-w-lg">
              <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-lg text-white shadow-lg">
                  {(currentUser?.full_name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{currentUser?.full_name}</h4>
                  <p className="text-xs text-slate-400">{currentUser?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Department:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{currentUser?.department}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px]">Assigned Role:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">{currentUser?.role}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Notifications Tab */}
        {activeTab === 'notifications' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Desktop Notification Banners</h3>
            <p className="text-xs text-slate-400 mb-5">Manage toast notifications for incoming mail and tasks.</p>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-lg flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white">Enable Workstation Alerts</div>
                <div className="text-[11px] text-slate-500">Show glassmorphic banners when new company emails arrive</div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  notificationsEnabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* 4. Security Tab */}
        {activeTab === 'security' && (
          <div>
            <h3 className="text-sm font-bold text-white mb-1">Active Workstation Session</h3>
            <p className="text-xs text-slate-400 mb-5">Hardware attestation & cryptographically verified token.</p>

            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl max-w-lg space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Operating System:</span>
                <span className="font-mono text-slate-200">macOS 15.1 Sonoma (Virtual Edition)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Network Telemetry IP:</span>
                <span className="font-mono text-emerald-400">10.0.4.199 (Internal Secured VLAN)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Token Status:</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">
                  AUTHENTICATED (JWT 24h)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
