import React, { useState } from 'react';
import { MacAppIcon } from './MacIcons';

export const DOCK_ITEMS = [
  { id: 'finder', name: 'Finder', category: 'app' },
  { id: 'mail', name: 'Mail', category: 'app' },
  { id: 'chat', name: 'Messages', category: 'app' },
  { id: 'calendar', name: 'Calendar', category: 'app' },
  { id: 'tasks', name: 'Reminders', category: 'app' },
  { id: 'documents', name: 'Notes & Docs', category: 'app' },
  { id: 'shared-drive', name: 'Shared Drives', category: 'app' },
  { id: 'activity-monitor', name: 'Activity Monitor', category: 'app' },
  { id: 'settings', name: 'System Settings', category: 'app' },
  { id: 'trash', name: 'Trash', category: 'util' }
];

export default function MacDock({
  runningApps = {},
  unreadMail = 0,
  unreadChat = 0,
  onLaunchApp
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [bouncingApp, setBouncingApp] = useState(null);

  const handleAppClick = (appId) => {
    setBouncingApp(appId);
    setTimeout(() => setBouncingApp(null), 900);
    if (onLaunchApp) onLaunchApp(appId);
  };

  // Group apps: main apps before divider, trash after divider
  const mainApps = DOCK_ITEMS.filter(d => d.category === 'app');
  const utilApps = DOCK_ITEMS.filter(d => d.category === 'util');

  const renderDockItem = (item, idx, totalOffset = 0) => {
    const isRunning = !!runningApps[item.id]?.isOpen;
    const globalIdx = idx + totalOffset;
    const isHovered = hoveredIndex === globalIdx;
    const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - globalIdx) === 1;
    const isBouncing = bouncingApp === item.id;

    let badge = 0;
    if (item.id === 'mail') badge = unreadMail;
    if (item.id === 'chat') badge = unreadChat;

    return (
      <div
        key={item.id}
        className="relative flex flex-col items-center select-none"
        onMouseEnter={() => setHoveredIndex(globalIdx)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute -top-10 px-2.5 py-1 rounded-md bg-[#181c2b]/90 backdrop-blur-xl border border-white/20 text-[11px] font-medium text-white shadow-xl pointer-events-none whitespace-nowrap animate-fadeIn z-50">
            {item.name}
          </div>
        )}

        {/* Icon with macOS hover scale & bounce */}
        <button
          onClick={() => handleAppClick(item.id)}
          className={`transition-all duration-150 ease-out flex flex-col items-center focus:outline-none ${
            isBouncing ? 'animate-bounce' : ''
          } ${
            isHovered ? 'scale-125 -translate-y-2' : isNeighbor ? 'scale-110 -translate-y-1' : 'hover:-translate-y-0.5'
          }`}
          style={{ width: '48px', height: '48px' }}
        >
          <MacAppIcon id={item.id} size={48} />

          {/* Red Notification Badge */}
          {badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center shadow-md border border-white/80">
              {badge}
            </span>
          )}
        </button>

        {/* Running App Glowing Dot */}
        <div className="h-1.5 flex items-center justify-center mt-1">
          {isRunning ? (
            <span className="w-1 h-1 rounded-full bg-white/90 shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
          ) : (
            <span className="w-1 h-1 opacity-0" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="px-2.5 pt-1.5 pb-1 rounded-2xl backdrop-blur-3xl bg-white/10 dark:bg-black/40 border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-end gap-1.5">
        {/* Main Pinned Apps */}
        {mainApps.map((item, idx) => renderDockItem(item, idx, 0))}

        {/* macOS Dock Vertical Glass Separator */}
        <div className="w-[1px] h-9 mx-1 bg-white/25 rounded-full self-center" />

        {/* Utility Apps / Trash */}
        {utilApps.map((item, idx) => renderDockItem(item, idx, mainApps.length))}
      </div>
    </div>
  );
}
