import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Search,
  SlidersHorizontal,
  User,
  LogOut,
  Lock,
  Settings as SettingsIcon,
  Info,
  ShieldCheck,
  Volume2,
  Sun,
  Bluetooth,
  Moon,
  Laptop,
  Folder,
  FileText,
  Mail,
  CheckSquare,
  HardDrive,
  Play,
  Pause,
  SkipForward,
  Music
} from 'lucide-react';

export default function MacMenuBar({
  activeAppName = 'Finder',
  currentUser,
  onOpenApp,
  onLockScreen,
  onLogout
}) {
  const [timeStr, setTimeStr] = useState('');
  const [appleMenuOpen, setAppleMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [openMenu, setOpenMenu] = useState(null); // 'file'|'edit'|'view'|'go'|'window'|'help'|'wifi'

  // Control Center Controls
  const [brightness, setBrightness] = useState(88);
  const [volume, setVolume] = useState(72);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  const menuRef = useRef(null);
  const spotlightInputRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('header') && !e.target.closest('.mac-popover') && !e.target.closest('.spotlight-modal')) {
        setOpenMenu(null);
        setAppleMenuOpen(false);
        setProfileMenuOpen(false);
        setControlCenterOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Keyboard shortcut: Cmd + Space or Ctrl + Space for Spotlight
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        setSpotlightOpen(prev => {
          const next = !prev;
          if (next) setTimeout(() => spotlightInputRef.current?.focus(), 50);
          return next;
        });
      }
      if (e.key === 'Escape') {
        setSpotlightOpen(false);
        setControlCenterOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clock format: "Thu Oct 30  5:20 PM"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      };
      const formatted = now.toLocaleString('en-US', options).replace(/,/g, '');
      setTimeStr(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Spotlight search items
  const searchableItems = [
    { name: 'Finder', type: 'Application', id: 'finder', icon: Folder },
    { name: 'Company Mail', type: 'Application', id: 'mail', icon: Mail },
    { name: 'Documents & Notes', type: 'Application', id: 'documents', icon: FileText },
    { name: 'Reminders & Tasks', type: 'Application', id: 'tasks', icon: CheckSquare },
    { name: 'Shared Corporate Drives', type: 'Application', id: 'shared-drive', icon: HardDrive },
    { name: 'System Settings', type: 'Preference Pane', id: 'settings', icon: SettingsIcon },
    { name: 'Q4 Financial Ledger.xlsx', type: 'Spreadsheet', id: 'finder', icon: FileText },
    { name: 'Employee Code of Conduct.pdf', type: 'PDF Document', id: 'documents', icon: FileText },
    { name: 'Sentinel Threat Matrix.docx', type: 'Document', id: 'documents', icon: FileText }
  ];

  const filteredSpotlight = spotlightQuery.trim()
    ? searchableItems.filter(item => item.name.toLowerCase().includes(spotlightQuery.toLowerCase()))
    : searchableItems.slice(0, 5);

  return (
    <>
      <header
        ref={menuRef}
        className="h-8 w-full bg-[#101322]/80 backdrop-blur-3xl border-b border-white/10 text-slate-200 text-xs px-3.5 flex items-center justify-between select-none z-40 fixed top-0 left-0 shadow-md font-sans"
      >
        {/* Left: Apple Menu & App Menus */}
        <div className="flex items-center gap-3">
          {/* Apple Logo Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setAppleMenuOpen(!appleMenuOpen);
                setOpenMenu(null);
                setControlCenterOpen(false);
              }}
              className="text-white hover:text-cyan-400 font-bold text-sm px-1.5 py-0.5 rounded transition-colors"
            >
              
            </button>

            {appleMenuOpen && (
              <div
                className="mac-popover absolute top-8 left-0 w-60 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                onClick={() => setAppleMenuOpen(false)}
              >
                <button
                  onClick={() => setAboutModalOpen(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>About This Mac</span>
                </button>
                <div className="my-1 border-t border-slate-700/80" />
                <button
                  onClick={() => onOpenApp('settings')}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>System Settings...</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">⌘,</span>
                </button>
                <div className="my-1 border-t border-slate-700/80" />
                <button
                  onClick={onLockScreen}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between text-amber-300"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Workstation Screen</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">⌃⌘Q</span>
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white flex items-center justify-between text-rose-300"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out {currentUser?.full_name?.split(' ')[0]}...</span>
                  </span>
                  <span className="text-[10px] text-rose-200 font-mono">⇧⌘Q</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Application Name */}
          <span className="font-bold text-white tracking-tight">{activeAppName}</span>

          {/* Menus with functional dropdowns */}
          <div className="hidden sm:flex items-center gap-0.5 text-slate-300 font-normal">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'file' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                File
              </button>
              {openMenu === 'file' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-52 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <button onClick={() => onOpenApp('finder')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>New Finder Window</span>
                    <span className="text-[10px] text-slate-400">⌘N</span>
                  </button>
                  <button onClick={() => onOpenApp('documents')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>New Document</span>
                    <span className="text-[10px] text-slate-400">⌘T</span>
                  </button>
                  <button onClick={() => onOpenApp('mail')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>New Mail Message</span>
                    <span className="text-[10px] text-slate-400">⌘M</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'edit' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                Edit
              </button>
              {openMenu === 'edit' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-44 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <button onClick={() => document.execCommand?.('undo')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Undo</span>
                    <span className="text-[10px] text-slate-400">⌘Z</span>
                  </button>
                  <button onClick={() => document.execCommand?.('redo')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Redo</span>
                    <span className="text-[10px] text-slate-400">⇧⌘Z</span>
                  </button>
                  <div className="my-1 border-t border-slate-700/80" />
                  <button onClick={() => document.execCommand?.('cut')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Cut</span>
                    <span className="text-[10px] text-slate-400">⌘X</span>
                  </button>
                  <button onClick={() => document.execCommand?.('copy')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Copy</span>
                    <span className="text-[10px] text-slate-400">⌘C</span>
                  </button>
                  <button onClick={() => document.execCommand?.('paste')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Paste</span>
                    <span className="text-[10px] text-slate-400">⌘V</span>
                  </button>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'view' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                View
              </button>
              {openMenu === 'view' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-56 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <button onClick={() => onOpenApp('settings')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2">
                    <span>Change Desktop Wallpaper...</span>
                  </button>
                  <button onClick={() => onOpenApp('activity-monitor')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2">
                    <span>Activity Telemetry Stream</span>
                  </button>
                </div>
              )}
            </div>

            {/* Go Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'go' ? null : 'go')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'go' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                Go
              </button>
              {openMenu === 'go' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-52 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <button onClick={() => onOpenApp('finder')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Applications</span>
                    <span className="text-[10px] text-slate-400">⇧⌘A</span>
                  </button>
                  <button onClick={() => onOpenApp('documents')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Documents</span>
                    <span className="text-[10px] text-slate-400">⇧⌘O</span>
                  </button>
                  <button onClick={() => onOpenApp('shared-drive')} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center justify-between">
                    <span>Shared Drives</span>
                    <span className="text-[10px] text-slate-400">⇧⌘K</span>
                  </button>
                </div>
              )}
            </div>

            {/* Window Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'window' ? null : 'window')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'window' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                Window
              </button>
              {openMenu === 'window' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-56 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 font-mono">Open Application</div>
                  {[
                    { id: 'finder', name: 'Finder' },
                    { id: 'mail', name: 'Company Mail' },
                    { id: 'documents', name: 'Notes & Documents' },
                    { id: 'tasks', name: 'Reminders & Tasks' },
                    { id: 'chat', name: 'Messages' },
                    { id: 'shared-drive', name: 'Shared Drives' },
                    { id: 'activity-monitor', name: 'Activity Monitor' },
                    { id: 'settings', name: 'System Settings' }
                  ].map(app => (
                    <button
                      key={app.id}
                      onClick={() => onOpenApp(app.id)}
                      className="w-full text-left px-3 py-1 hover:bg-blue-600 hover:text-white flex items-center justify-between"
                    >
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === 'help' ? null : 'help')}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${openMenu === 'help' ? 'bg-blue-600 text-white' : 'hover:text-white'}`}
              >
                Help
              </button>
              {openMenu === 'help' && (
                <div
                  className="mac-popover absolute top-8 left-0 w-60 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl py-1 z-50 text-xs text-slate-200 animate-fadeIn"
                  onClick={() => setOpenMenu(null)}
                >
                  <button onClick={() => setAboutModalOpen(true)} className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white">
                    <span>Virtual MacBook User Guide</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center: Liquid Retina Camera Notch */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-2xl items-center justify-center gap-2 shadow-sm pointer-events-none z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399] animate-pulse" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#0d1117] ring-1 ring-slate-800 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-blue-950" />
          </div>
          <span className="w-1 h-1 rounded-full bg-slate-900" />
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3 text-slate-300 text-xs">
          {/* Wi-Fi Icon */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'wifi' ? null : 'wifi')}
              className="p-1 rounded text-slate-300 hover:text-white"
              title="Wi-Fi"
            >
              <Wifi className="w-3.5 h-3.5 text-slate-200" />
            </button>
            {openMenu === 'wifi' && (
              <div
                className="mac-popover absolute top-8 right-0 w-64 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl p-3 z-50 text-xs text-slate-200 animate-fadeIn"
                onClick={() => setOpenMenu(null)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
                  <span className="font-semibold text-white">Wi-Fi</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Connected</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between text-white">
                    <span>Sentinel-Enterprise-5G</span>
                    <span className="text-emerald-400">✓</span>
                  </div>
                  <div>IP Address: 192.168.1.104</div>
                  <div>Security: WPA3-Enterprise</div>
                </div>
              </div>
            )}
          </div>

          {/* Spotlight Search Icon */}
          <button
            onClick={() => {
              setSpotlightOpen(true);
              setTimeout(() => spotlightInputRef.current?.focus(), 50);
            }}
            className="p-1 rounded text-slate-300 hover:text-white"
            title="Spotlight Search (⌘ Space)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Control Center Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setControlCenterOpen(!controlCenterOpen);
                setOpenMenu(null);
                setProfileMenuOpen(false);
              }}
              className={`p-1 rounded transition-colors ${controlCenterOpen ? 'text-blue-400' : 'text-slate-300 hover:text-white'}`}
              title="Control Center"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Control Center Flyout */}
            {controlCenterOpen && (
              <div
                className="mac-popover absolute top-9 right-0 w-80 bg-[#161a29]/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-2xl p-3.5 z-50 text-xs text-slate-200 space-y-3 animate-fadeIn select-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 2x2 Network Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setWifiEnabled(!wifiEnabled)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${wifiEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white leading-tight">Wi-Fi</div>
                      <div className="text-[10px] text-slate-400">{wifiEnabled ? 'Sentinel-5G' : 'Off'}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-2xl flex items-center gap-2.5 cursor-pointer transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${bluetoothEnabled ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Bluetooth className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white leading-tight">Bluetooth</div>
                      <div className="text-[10px] text-slate-400">{bluetoothEnabled ? 'On' : 'Off'}</div>
                    </div>
                  </div>
                </div>

                {/* Focus / Do Not Disturb */}
                <div
                  onClick={() => setDoNotDisturb(!doNotDisturb)}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-750 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${doNotDisturb ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white leading-tight">Focus</div>
                      <div className="text-[10px] text-slate-400">{doNotDisturb ? 'Do Not Disturb On' : 'Off'}</div>
                    </div>
                  </div>
                </div>

                {/* Display Brightness */}
                <div className="p-3 bg-slate-800/80 border border-white/10 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Display</span>
                    </span>
                    <span className="font-mono text-slate-400">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Sound Volume */}
                <div className="p-3 bg-slate-800/80 border border-white/10 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sound</span>
                    </span>
                    <span className="font-mono text-slate-400">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Now Playing Widget */}
                <div className="p-2.5 bg-slate-800/80 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-[11px]">Corporate Ambient Audio</div>
                      <div className="text-[10px] text-slate-400">Sentinel Soundscapes</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                  >
                    {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Sentinel Security Core */}
                <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-emerald-300 text-[11px]">Sentinel Core: Active</div>
                      <div className="text-[10px] text-slate-400 font-mono">Audit Chain Verified</div>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono">
                    SECURE
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Clock */}
          <span className="font-normal text-white px-1 tracking-tight cursor-default">
            {timeStr || 'Thu Oct 30  5:20 PM'}
          </span>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setControlCenterOpen(false);
                setAppleMenuOpen(false);
              }}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full bg-slate-800/90 hover:bg-slate-750 transition-colors border border-white/10"
            >
              <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center font-bold text-[9px]">
                {(currentUser?.full_name || 'U').slice(0, 1)}
              </div>
              <span className="text-[11px] font-medium text-slate-200 hidden md:inline truncate max-w-[100px]">
                {currentUser?.full_name?.split(' ')[0]}
              </span>
            </button>

            {profileMenuOpen && (
              <div
                className="mac-popover absolute top-9 right-0 w-64 bg-[#161a29]/95 backdrop-blur-3xl border border-white/15 rounded-2xl shadow-2xl p-4 z-50 text-xs text-slate-200 animate-fadeIn"
                onClick={() => setProfileMenuOpen(false)}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                    {(currentUser?.full_name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white truncate">{currentUser?.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.email}</div>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-medium text-slate-200">{currentUser?.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Workstation ID:</span>
                    <span className="font-mono text-cyan-400">MBP-M3-VIRTUAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Classification:</span>
                    <span className="font-bold text-emerald-400">AUTHENTICATED</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700/80 flex gap-2">
                  <button
                    onClick={() => onOpenApp('settings')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-center font-medium"
                  >
                    Settings
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-center font-medium"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Spotlight Search Modal (⌘ Space) */}
      {spotlightOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-center pt-24 px-4 spotlight-modal"
          onClick={() => setSpotlightOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#161a29]/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden self-start animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 flex items-center gap-3 border-b border-white/10">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={spotlightInputRef}
                type="text"
                placeholder="Spotlight Search"
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                className="w-full bg-transparent text-white text-base placeholder-slate-500 focus:outline-none"
              />
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-800">ESC</span>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto space-y-0.5">
              {filteredSpotlight.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs">
                  No results found for "{spotlightQuery}"
                </div>
              ) : (
                filteredSpotlight.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onOpenApp(item.id);
                        setSpotlightOpen(false);
                        setSpotlightQuery('');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-blue-600 hover:text-white flex items-center justify-between text-xs transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400 group-hover:text-white">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 group-hover:text-blue-200 font-mono">
                        {item.type}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* About This Mac Modal */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#181c2b] border border-white/20 w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center select-none">
            <div className="text-5xl text-white font-bold mb-3 drop-shadow-md"></div>
            <h3 className="text-lg font-bold text-white">macOS Sonoma</h3>
            <p className="text-xs text-slate-400 mb-4">Version 14.5 (MacBook Pro Workstation Edition)</p>

            <div className="bg-slate-900/80 p-4 rounded-2xl text-xs space-y-2 text-left mb-5 text-slate-300 font-mono border border-white/5">
              <div className="flex justify-between"><span className="text-slate-500">Model:</span> <span>MacBook Pro 16-inch</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Chip:</span> <span>Apple M3 Max (16-core CPU)</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Memory:</span> <span>64 GB Unified Memory</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Startup Disk:</span> <span>Macintosh HD (APFS)</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Security Agent:</span> <span className="text-emerald-400 font-bold">UBA Sentinel v2.4</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Subject:</span> <span className="text-cyan-400">{currentUser?.email}</span></div>
            </div>

            <button
              onClick={() => setAboutModalOpen(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-900/50 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}
