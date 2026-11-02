import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import MacMenuBar from './MacMenuBar';
import MacDock, { DOCK_ITEMS } from './MacDock';
import MacWindow from './MacWindow';
import MacLockScreen from './MacLockScreen';
import MacQuickLookModal from './MacQuickLookModal';
import { WALLPAPERS } from './apps/SettingsApp';

// Apps
import FinderApp from './apps/FinderApp';
import TaskManagerApp from './apps/TaskManagerApp';
import CompanyMailApp from './apps/CompanyMailApp';
import DocumentEditorApp from './apps/DocumentEditorApp';
import TeamChatApp from './apps/TeamChatApp';
import CalendarApp from './apps/CalendarApp';
import SharedDriveApp from './apps/SharedDriveApp';
import ActivityMonitorApp from './apps/ActivityMonitorApp';
import SettingsApp from './apps/SettingsApp';
import TrashApp from './apps/TrashApp';

import {
  Folder,
  CheckSquare,
  Mail,
  FileText,
  FileSpreadsheet,
  FileCode,
  MessageSquare,
  Calendar,
  HardDrive,
  Activity,
  Settings,
  Trash2,
  RefreshCw,
  Image,
  AlertOctagon,
  AlertTriangle,
  Upload,
  Plus,
  Eye,
  Download
} from 'lucide-react';

export default function MacOSDesktop() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Desktop State
  const [wallpaper, setWallpaper] = useState('sonoma-dark');
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [disabledApps, setDisabledApps] = useState([]);
  const [activeAppKey, setActiveAppKey] = useState('Finder');
  const [contextMenu, setContextMenu] = useState(null);
  const [highestZ, setHighestZ] = useState(10);
  const [notificationBanner, setNotificationBanner] = useState(null);

  // Desktop Files & Universal Quick Look State
  const [desktopFiles, setDesktopFiles] = useState([]);
  const [selectedDesktopItem, setSelectedDesktopItem] = useState(null);
  const [quickLookFile, setQuickLookFile] = useState(null);
  const [openedEditorFile, setOpenedEditorFile] = useState(null);
  const [openedEditorDocId, setOpenedEditorDocId] = useState(null);
  const [isDraggingFileOver, setIsDraggingFileOver] = useState(false);
  const desktopFileInputRef = useRef(null);

  // Unread badge counters
  const [unreadMailCount, setUnreadMailCount] = useState(0);

  // Application Window States
  const [appWindows, setAppWindows] = useState({
    finder: {
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      title: 'Finder – My Documents',
      icon: Folder,
      initialPos: { x: 70, y: 55 },
      initialSize: { width: 840, height: 540 }
    },
    tasks: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 9,
      title: 'Task Manager',
      icon: CheckSquare,
      initialPos: { x: 100, y: 60 },
      initialSize: { width: 980, height: 620 }
    },
    mail: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 8,
      title: 'Company Mail',
      icon: Mail,
      initialPos: { x: 150, y: 65 },
      initialSize: { width: 920, height: 580 }
    },
    documents: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 7,
      title: 'Document Editor',
      icon: FileText,
      initialPos: { x: 180, y: 80 },
      initialSize: { width: 860, height: 550 }
    },
    chat: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 6,
      title: 'Team Chat',
      icon: MessageSquare,
      initialPos: { x: 200, y: 70 },
      initialSize: { width: 820, height: 540 }
    },
    calendar: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 5,
      title: 'Calendar',
      icon: Calendar,
      initialPos: { x: 140, y: 60 },
      initialSize: { width: 850, height: 550 }
    },
    'shared-drive': {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 4,
      title: 'Shared Corporate Drives',
      icon: HardDrive,
      initialPos: { x: 160, y: 75 },
      initialSize: { width: 860, height: 540 }
    },
    'activity-monitor': {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 3,
      title: 'Activity Monitor',
      icon: Activity,
      initialPos: { x: 100, y: 60 },
      initialSize: { width: 840, height: 520 }
    },
    settings: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 2,
      title: 'System Settings',
      icon: Settings,
      initialPos: { x: 190, y: 85 },
      initialSize: { width: 780, height: 500 }
    },
    trash: {
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
      title: 'Trash',
      icon: Trash2,
      initialPos: { x: 220, y: 90 },
      initialSize: { width: 700, height: 460 }
    }
  });

  // Initial Load of Virtual Computer State & Preferences
  const syncVirtualComputer = async () => {
    try {
      const res = await ApiClient.getMyVirtualComputer();
      if (res.preferences?.wallpaper) {
        setWallpaper(res.preferences.wallpaper);
      }
      setIsLocked(res.is_locked);
      setLockReason(res.lock_reason || '');
      setDisabledApps(res.disabled_apps || []);

      ApiClient.getInbox()
        .then(inbox => {
          const unread = inbox.filter(e => !e.is_read).length;
          setUnreadMailCount(unread);
        })
        .catch(() => {});
    } catch (err) {
      console.error('Failed to sync virtual computer state:', err);
    }
  };

  useEffect(() => {
    syncVirtualComputer();

    const timer = setInterval(() => {
      ApiClient.sendHeartbeat(activeAppKey).catch(() => {});
      syncVirtualComputer();
    }, 5000);

    return () => clearInterval(timer);
  }, [activeAppKey]);

  // Focus Window
  const focusWindow = (appKey) => {
    const nextZ = highestZ + 1;
    setHighestZ(nextZ);
    setAppWindows(prev => ({
      ...prev,
      [appKey]: {
        ...prev[appKey],
        isOpen: true,
        isMinimized: false,
        zIndex: nextZ
      }
    }));

    const found = DOCK_ITEMS.find(d => d.id === appKey);
    if (found) setActiveAppKey(found.name);
  };

  // Launch App
  const handleLaunchApp = (appKey) => {
    if (disabledApps.includes(appKey)) {
      setNotificationBanner(`Access Denied: '${appKey}' has been administratively disabled on your virtual computer.`);
      setTimeout(() => setNotificationBanner(null), 5000);
      return;
    }
    focusWindow(appKey);
  };

  // Close Window
  const handleCloseWindow = (appKey) => {
    setAppWindows(prev => ({
      ...prev,
      [appKey]: { ...prev[appKey], isOpen: false, isMinimized: false, isMaximized: false }
    }));
  };

  // Minimize Window
  const handleMinimizeWindow = (appKey) => {
    setAppWindows(prev => ({
      ...prev,
      [appKey]: { ...prev[appKey], isMinimized: true }
    }));
  };

  // Maximize Window
  const handleMaximizeWindow = (appKey) => {
    setAppWindows(prev => ({
      ...prev,
      [appKey]: { ...prev[appKey], isMaximized: !prev[appKey].isMaximized }
    }));
  };

  // Right-Click Context Menu
  const handleContextMenu = (e, targetItem = null) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, targetItem });
  };

  // Load All Desktop Files & Documents
  const loadDesktopFiles = async () => {
    try {
      const [filesRes, docsRes] = await Promise.allSettled([
        ApiClient.getFiles(null, 'all'),
        ApiClient.getDocuments()
      ]);

      const loadedFiles = filesRes.status === 'fulfilled' && filesRes.value?.files ? filesRes.value.files : [];
      const loadedDocs = docsRes.status === 'fulfilled' && Array.isArray(docsRes.value) ? docsRes.value : [];

      const docItems = loadedDocs.map(d => ({
        id: `doc-${d.id}`,
        docId: d.id,
        name: d.title.endsWith('.txt') || d.title.endsWith('.md') || d.title.endsWith('.docx') ? d.title : `${d.title}.md`,
        file_type: 'document',
        file_size_bytes: (d.content || '').length || 1024,
        classification: d.classification || 'INTERNAL',
        content: d.content || '',
        content_preview: d.content || '',
        isDocumentRecord: true
      }));

      const cleanFiles = loadedFiles.filter(f => !f.is_deleted);

      // Merge and avoid duplicate names
      const allDesktopItems = [
        ...cleanFiles,
        ...docItems.filter(d => !cleanFiles.some(f => f.name === d.name))
      ];

      setDesktopFiles(allDesktopItems);
    } catch (err) {
      console.error('Failed to load desktop files:', err);
    }
  };

  useEffect(() => {
    loadDesktopFiles();
  }, []);

  // Keyboard Navigation: Spacebar toggles Quick Look on selected desktop file
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.target.closest('input') && !e.target.closest('textarea')) {
        if (selectedDesktopItem && selectedDesktopItem.type === 'file') {
          e.preventDefault();
          setQuickLookFile(prev => prev ? null : selectedDesktopItem);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDesktopItem]);

  // Open ANY Desktop Item
  const handleOpenDesktopItem = (item) => {
    if (item.type === 'disk') {
      handleLaunchApp('finder');
    } else if (item.type === 'network') {
      handleLaunchApp('shared-drive');
    } else if (item.type === 'folder') {
      handleLaunchApp('finder');
    } else if (item.type === 'file') {
      // Open ANY file directly in Universal Quick Look / Native viewer
      setQuickLookFile(item);
    }
  };

  // Upload Files to Desktop
  const uploadFilesToDesktop = async (fileList) => {
    let lastUploadedItem = null;
    for (const file of fileList) {
      try {
        const ext = file.name.split('.').pop().toLowerCase();
        let fileType = 'document';
        if (['xlsx', 'xls', 'csv'].includes(ext)) fileType = 'spreadsheet';
        else if (['js', 'ts', 'py', 'json', 'yaml', 'yml', 'sql', 'html', 'css'].includes(ext)) fileType = 'code';
        else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) fileType = 'image';
        else if (ext === 'pdf') fileType = 'pdf';

        const content = await new Promise((resolve) => {
          const reader = new FileReader();
          if (fileType === 'image') {
            reader.onload = (ev) => resolve(ev.target.result || '');
            reader.readAsDataURL(file);
          } else {
            reader.onload = (ev) => resolve(ev.target.result || '');
            reader.readAsText(file);
          }
        });

        const res = await ApiClient.uploadFile({
          name: file.name,
          file_type: fileType,
          file_size_bytes: file.size,
          folder_id: null,
          content_preview: typeof content === 'string' ? content.slice(0, 500000) : 'File payload',
          classification: 'INTERNAL'
        });

        if (res && res.file) {
          lastUploadedItem = res.file;
        }

        setNotificationBanner(`Placed "${file.name}" on Desktop.`);
        setTimeout(() => setNotificationBanner(null), 3500);
      } catch (err) {
        console.error('File upload error:', err);
      }
    }

    await loadDesktopFiles();

    if (lastUploadedItem) {
      setQuickLookFile(lastUploadedItem);
    }
  };

  // Hidden File Input Trigger
  const handleDesktopFileInputChange = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    await uploadFilesToDesktop(selected);
    if (desktopFileInputRef.current) desktopFileInputRef.current.value = '';
  };

  // Create New Text Document on Desktop
  const handleCreateDesktopDocument = async () => {
    const title = prompt('Enter document name:', 'New Notes.txt');
    if (!title || !title.trim()) return;

    try {
      const res = await ApiClient.uploadFile({
        name: title.trim(),
        file_type: 'document',
        file_size_bytes: 120,
        folder_id: null,
        content_preview: `# ${title.trim()}\n\nCreated on macOS Virtual Desktop.\nSecurity clearance: Internal.\nWrite notes and instructions here...`,
        classification: 'INTERNAL'
      });

      setNotificationBanner(`Created "${title.trim()}" on Desktop.`);
      setTimeout(() => setNotificationBanner(null), 3500);
      await loadDesktopFiles();

      if (res && res.file) {
        setQuickLookFile(res.file);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  // Download Desktop File to Real PC
  const handleDownloadDesktopFile = async (file) => {
    try {
      let content = file.content || file.content_preview || '';
      let fileName = file.name;

      if (file.id && !file.isDocumentRecord) {
        try {
          const res = await ApiClient.downloadFile(file.id);
          if (res && res.content) content = res.content;
          if (res && res.file_name) fileName = res.file_name;
        } catch {
          // fallback
        }
      }

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setNotificationBanner(`Downloaded "${fileName}" to real PC.`);
      setTimeout(() => setNotificationBanner(null), 3500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Delete Desktop File (Move to Trash)
  const handleDeleteDesktopFile = async (file) => {
    try {
      if (file.isDocumentRecord && file.docId) {
        await ApiClient.deleteDocument(file.docId);
      } else if (file.id) {
        await ApiClient.deleteFile(file.id);
      }
      setNotificationBanner(`Moved "${file.name}" to Trash.`);
      setTimeout(() => setNotificationBanner(null), 3500);
      await loadDesktopFiles();
      setQuickLookFile(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Drag & Drop Handlers for Desktop Screen
  const handleDesktopDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(true);
  };

  const handleDesktopDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(false);
  };

  const handleDesktopDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFileOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    await uploadFilesToDesktop(droppedFiles);
  };

  // Quick Look Prev / Next
  const currentQuickLookIndex = quickLookFile
    ? desktopFiles.findIndex(f => f.id === quickLookFile.id)
    : -1;

  const handleQuickLookPrev = () => {
    if (currentQuickLookIndex > 0) {
      setQuickLookFile(desktopFiles[currentQuickLookIndex - 1]);
    }
  };

  const handleQuickLookNext = () => {
    if (currentQuickLookIndex >= 0 && currentQuickLookIndex < desktopFiles.length - 1) {
      setQuickLookFile(desktopFiles[currentQuickLookIndex + 1]);
    }
  };

  // Simulate Suspicious Activity to Test Automated Threat Auto-Lock
  const handleSimulateSuspiciousActivity = async () => {
    try {
      const res = await ApiClient.simulateSuspiciousActivity(
        'UNAUTHORIZED_VAULT_PROBE',
        'Attempted unauthorized extraction on restricted corporate files'
      );
      setNotificationBanner('Threat activity detected! Workstation auto-locked by SOC.');
      setIsLocked(true);
      setLockReason(res.lock_reason || 'Automated Threat Containment: Suspicious insider activity detected.');
      syncVirtualComputer();
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedDesktopItem(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/employee/login');
    } catch {
      navigate('/employee/login');
    }
  };

  // Resolved wallpaper style
  const activeWp = WALLPAPERS.find(w => w.id === wallpaper) || WALLPAPERS[0];

  // Desktop Screen Content
  const desktopInner = (
    <div
      onContextMenu={(e) => handleContextMenu(e, null)}
      onDragOver={handleDesktopDragOver}
      onDragLeave={handleDesktopDragLeave}
      onDrop={handleDesktopDrop}
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none font-sans"
      style={{ background: activeWp.cssBackground }}
    >
      {/* 1. Top macOS Menu Bar (Edge to Edge Fullscreen, NO Battery) */}
      <MacMenuBar
        activeAppName={activeAppKey}
        currentUser={user}
        onOpenApp={handleLaunchApp}
        onLockScreen={() => setIsLocked(true)}
        onLogout={handleLogout}
      />

      {/* 2. Authentic macOS Desktop Items (Top Right Corner with Multi-Column Auto-Wrap) */}
      <div className="absolute top-11 right-3 z-10 flex flex-wrap flex-col max-h-[calc(100vh-130px)] content-end gap-2.5 select-none pointer-events-auto">
        {/* System Volumes: Macintosh HD, Company Drive, Personal Files */}
        {[
          { id: 'finder-hd', name: 'Macintosh HD', type: 'disk' },
          { id: 'shared-drive-vol', name: 'Company Drive', type: 'network' },
          { id: 'personal-folder', name: 'Personal Files', type: 'folder' }
        ].map((item) => {
          const isSelected = selectedDesktopItem?.id === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDesktopItem(item);
              }}
              onDoubleClick={() => handleOpenDesktopItem(item)}
              onContextMenu={(e) => {
                e.stopPropagation();
                handleContextMenu(e, item);
              }}
              className="flex flex-col items-center p-1.5 rounded-xl cursor-pointer group w-24 text-center transition-all"
              title={`Double-click to open ${item.name}`}
            >
              {item.type === 'disk' ? (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 p-1 flex items-center justify-center shadow-lg border border-white/50 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-7 h-7 text-slate-800" />
                </div>
              ) : item.type === 'network' ? (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-blue-400 to-blue-600 p-1 flex items-center justify-center shadow-lg border border-blue-300/50 group-hover:scale-105 transition-transform">
                  <HardDrive className="w-7 h-7 text-white" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-sky-400 via-blue-500 to-blue-600 p-1 flex items-center justify-center shadow-lg border border-sky-300/50 group-hover:scale-105 transition-transform">
                  <Folder className="w-7 h-7 text-white" />
                </div>
              )}
              <span
                className={`text-[11px] font-medium mt-1.5 leading-tight px-1.5 py-0.5 rounded transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] group-hover:bg-blue-600/60'
                }`}
              >
                {item.name}
              </span>
            </div>
          );
        })}

        {/* Dynamic Desktop Files & Documents (Capable of opening ANY file) */}
        {desktopFiles.map((file) => {
          const isSelected = selectedDesktopItem?.id === file.id;
          const ext = (file.name || '').split('.').pop().toLowerCase();
          const isSpreadsheet = ['xlsx', 'xls', 'csv'].includes(ext) || file.file_type === 'spreadsheet';
          const isCode = ['js', 'ts', 'py', 'json', 'yaml', 'yml', 'sql', 'html', 'css', 'gpg'].includes(ext) || file.file_type === 'code';
          const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) || file.file_type === 'image';
          const isPdf = ext === 'pdf' || file.file_type === 'pdf';

          return (
            <div
              key={file.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDesktopItem({ ...file, type: 'file' });
              }}
              onDoubleClick={() => handleOpenDesktopItem({ ...file, type: 'file' })}
              onContextMenu={(e) => {
                e.stopPropagation();
                handleContextMenu(e, { ...file, type: 'file' });
              }}
              className="flex flex-col items-center p-1.5 rounded-xl cursor-pointer group w-24 text-center transition-all relative"
              title={`Double-click to open ${file.name}\nPress Spacebar for Quick Look`}
            >
              {/* File Icon */}
              {isSpreadsheet ? (
                <div className="w-11 h-12 rounded-lg bg-gradient-to-b from-emerald-500 to-emerald-700 p-1 flex flex-col justify-between items-center shadow-lg border border-emerald-400/50 group-hover:scale-105 transition-transform">
                  <div className="w-full flex justify-between items-center px-1 pt-0.5">
                    <span className="text-[8px] font-black tracking-tighter text-white">XLS</span>
                    <FileSpreadsheet className="w-3 h-3 text-emerald-200" />
                  </div>
                  <div className="w-7 h-4 bg-white/20 rounded grid grid-cols-2 gap-0.5 p-0.5 mb-1">
                    <div className="bg-white/40 rounded-sm" />
                    <div className="bg-white/40 rounded-sm" />
                    <div className="bg-white/40 rounded-sm" />
                    <div className="bg-white/40 rounded-sm" />
                  </div>
                </div>
              ) : isCode ? (
                <div className="w-11 h-12 rounded-lg bg-gradient-to-b from-slate-800 to-slate-950 p-1 flex flex-col justify-between items-center shadow-lg border border-cyan-500/50 group-hover:scale-105 transition-transform">
                  <div className="w-full flex justify-between items-center px-1 pt-0.5">
                    <span className="text-[8px] font-black text-cyan-400 font-mono">CODE</span>
                    <FileCode className="w-3 h-3 text-cyan-300" />
                  </div>
                  <span className="text-cyan-300 font-mono text-[10px] font-bold mb-1">&lt;/&gt;</span>
                </div>
              ) : isImage ? (
                <div className="w-11 h-12 rounded-lg bg-gradient-to-b from-purple-500 to-indigo-700 p-1 flex flex-col justify-between items-center shadow-lg border border-purple-400/50 group-hover:scale-105 transition-transform overflow-hidden">
                  <div className="w-full flex justify-between items-center px-1 pt-0.5">
                    <span className="text-[8px] font-black text-white">IMG</span>
                    <Image className="w-3 h-3 text-purple-200" />
                  </div>
                  <div className="w-7 h-5 bg-black/30 rounded flex items-center justify-center mb-1">
                    <Image className="w-4 h-4 text-purple-200" />
                  </div>
                </div>
              ) : isPdf ? (
                <div className="w-11 h-12 rounded-lg bg-gradient-to-b from-rose-500 to-rose-700 p-1 flex flex-col justify-between items-center shadow-lg border border-rose-400/50 group-hover:scale-105 transition-transform">
                  <div className="w-full flex justify-between items-center px-1 pt-0.5">
                    <span className="text-[8px] font-black text-white">PDF</span>
                    <FileText className="w-3 h-3 text-rose-200" />
                  </div>
                  <span className="text-[9px] font-bold text-white mb-1">PDF</span>
                </div>
              ) : (
                <div className="w-10 h-12 bg-white/95 rounded-md p-1 shadow-lg border border-slate-300 flex flex-col justify-between items-center group-hover:scale-105 transition-transform">
                  <div className="w-full flex justify-end">
                    <div className="w-2.5 h-2.5 bg-slate-300 rounded-bl-sm" />
                  </div>
                  <FileText className="w-5 h-5 text-slate-700" />
                  <div className="w-6 h-0.5 bg-slate-400/50 rounded mb-1" />
                </div>
              )}

              {/* Filename */}
              <span
                className={`text-[11px] font-medium mt-1.5 leading-tight px-1.5 py-0.5 rounded transition-colors break-words max-w-[96px] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] group-hover:bg-blue-600/60'
                }`}
              >
                {file.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. Floating Draggable Windows for All 10 Applications */}
      {/* Finder */}
      <MacWindow
        id="finder"
        title="Finder"
        icon={Folder}
        isOpen={appWindows.finder.isOpen}
        isMinimized={appWindows.finder.isMinimized}
        isMaximized={appWindows.finder.isMaximized}
        zIndex={appWindows.finder.zIndex}
        initialPosition={appWindows.finder.initialPos}
        initialSize={appWindows.finder.initialSize}
        onClose={() => handleCloseWindow('finder')}
        onMinimize={() => handleMinimizeWindow('finder')}
        onMaximize={() => handleMaximizeWindow('finder')}
        onFocus={() => focusWindow('finder')}
      >
        <FinderApp currentUser={user} />
      </MacWindow>

      {/* Task Manager */}
      <MacWindow
        id="tasks"
        title="Task Manager"
        icon={CheckSquare}
        isOpen={appWindows.tasks.isOpen}
        isMinimized={appWindows.tasks.isMinimized}
        isMaximized={appWindows.tasks.isMaximized}
        zIndex={appWindows.tasks.zIndex}
        initialPosition={appWindows.tasks.initialPos}
        initialSize={appWindows.tasks.initialSize}
        onClose={() => handleCloseWindow('tasks')}
        onMinimize={() => handleMinimizeWindow('tasks')}
        onMaximize={() => handleMaximizeWindow('tasks')}
        onFocus={() => focusWindow('tasks')}
      >
        <TaskManagerApp currentUser={user} />
      </MacWindow>

      {/* Company Mail */}
      <MacWindow
        id="mail"
        title="Company Mail"
        icon={Mail}
        isOpen={appWindows.mail.isOpen}
        isMinimized={appWindows.mail.isMinimized}
        isMaximized={appWindows.mail.isMaximized}
        zIndex={appWindows.mail.zIndex}
        initialPosition={appWindows.mail.initialPos}
        initialSize={appWindows.mail.initialSize}
        onClose={() => handleCloseWindow('mail')}
        onMinimize={() => handleMinimizeWindow('mail')}
        onMaximize={() => handleMaximizeWindow('mail')}
        onFocus={() => focusWindow('mail')}
      >
        <CompanyMailApp currentUser={user} />
      </MacWindow>

      {/* Document Editor */}
      <MacWindow
        id="documents"
        title="Documents"
        icon={FileText}
        isOpen={appWindows.documents.isOpen}
        isMinimized={appWindows.documents.isMinimized}
        isMaximized={appWindows.documents.isMaximized}
        zIndex={appWindows.documents.zIndex}
        initialPosition={appWindows.documents.initialPos}
        initialSize={appWindows.documents.initialSize}
        onClose={() => handleCloseWindow('documents')}
        onMinimize={() => handleMinimizeWindow('documents')}
        onMaximize={() => handleMaximizeWindow('documents')}
        onFocus={() => focusWindow('documents')}
      >
        <DocumentEditorApp
          currentUser={user}
          openedDocId={openedEditorDocId}
          openedFile={openedEditorFile}
        />
      </MacWindow>

      {/* Team Chat */}
      <MacWindow
        id="chat"
        title="Team Chat"
        icon={MessageSquare}
        isOpen={appWindows.chat.isOpen}
        isMinimized={appWindows.chat.isMinimized}
        isMaximized={appWindows.chat.isMaximized}
        zIndex={appWindows.chat.zIndex}
        initialPosition={appWindows.chat.initialPos}
        initialSize={appWindows.chat.initialSize}
        onClose={() => handleCloseWindow('chat')}
        onMinimize={() => handleMinimizeWindow('chat')}
        onMaximize={() => handleMaximizeWindow('chat')}
        onFocus={() => focusWindow('chat')}
      >
        <TeamChatApp currentUser={user} />
      </MacWindow>

      {/* Calendar */}
      <MacWindow
        id="calendar"
        title="Calendar"
        icon={Calendar}
        isOpen={appWindows.calendar.isOpen}
        isMinimized={appWindows.calendar.isMinimized}
        isMaximized={appWindows.calendar.isMaximized}
        zIndex={appWindows.calendar.zIndex}
        initialPosition={appWindows.calendar.initialPos}
        initialSize={appWindows.calendar.initialSize}
        onClose={() => handleCloseWindow('calendar')}
        onMinimize={() => handleMinimizeWindow('calendar')}
        onMaximize={() => handleMaximizeWindow('calendar')}
        onFocus={() => focusWindow('calendar')}
      >
        <CalendarApp currentUser={user} />
      </MacWindow>

      {/* Shared Drive */}
      <MacWindow
        id="shared-drive"
        title="Shared Corporate Drives"
        icon={HardDrive}
        isOpen={appWindows['shared-drive'].isOpen}
        isMinimized={appWindows['shared-drive'].isMinimized}
        isMaximized={appWindows['shared-drive'].isMaximized}
        zIndex={appWindows['shared-drive'].zIndex}
        initialPosition={appWindows['shared-drive'].initialPos}
        initialSize={appWindows['shared-drive'].initialSize}
        onClose={() => handleCloseWindow('shared-drive')}
        onMinimize={() => handleMinimizeWindow('shared-drive')}
        onMaximize={() => handleMaximizeWindow('shared-drive')}
        onFocus={() => focusWindow('shared-drive')}
      >
        <SharedDriveApp currentUser={user} />
      </MacWindow>

      {/* Activity Monitor */}
      <MacWindow
        id="activity-monitor"
        title="Activity Monitor"
        icon={Activity}
        isOpen={appWindows['activity-monitor'].isOpen}
        isMinimized={appWindows['activity-monitor'].isMinimized}
        isMaximized={appWindows['activity-monitor'].isMaximized}
        zIndex={appWindows['activity-monitor'].zIndex}
        initialPosition={appWindows['activity-monitor'].initialPos}
        initialSize={appWindows['activity-monitor'].initialSize}
        onClose={() => handleCloseWindow('activity-monitor')}
        onMinimize={() => handleMinimizeWindow('activity-monitor')}
        onMaximize={() => handleMaximizeWindow('activity-monitor')}
        onFocus={() => focusWindow('activity-monitor')}
      >
        <ActivityMonitorApp currentUser={user} />
      </MacWindow>

      {/* System Settings */}
      <MacWindow
        id="settings"
        title="System Settings"
        icon={Settings}
        isOpen={appWindows.settings.isOpen}
        isMinimized={appWindows.settings.isMinimized}
        isMaximized={appWindows.settings.isMaximized}
        zIndex={appWindows.settings.zIndex}
        initialPosition={appWindows.settings.initialPos}
        initialSize={appWindows.settings.initialSize}
        onClose={() => handleCloseWindow('settings')}
        onMinimize={() => handleMinimizeWindow('settings')}
        onMaximize={() => handleMaximizeWindow('settings')}
        onFocus={() => focusWindow('settings')}
      >
        <SettingsApp
          currentUser={user}
          currentWallpaper={wallpaper}
          onWallpaperChange={(newWp) => setWallpaper(newWp)}
        />
      </MacWindow>

      {/* Trash */}
      <MacWindow
        id="trash"
        title="Trash"
        icon={Trash2}
        isOpen={appWindows.trash.isOpen}
        isMinimized={appWindows.trash.isMinimized}
        isMaximized={appWindows.trash.isMaximized}
        zIndex={appWindows.trash.zIndex}
        initialPosition={appWindows.trash.initialPos}
        initialSize={appWindows.trash.initialSize}
        onClose={() => handleCloseWindow('trash')}
        onMinimize={() => handleMinimizeWindow('trash')}
        onMaximize={() => handleMaximizeWindow('trash')}
        onFocus={() => focusWindow('trash')}
      >
        <TrashApp currentUser={user} />
      </MacWindow>

      {/* 4. Bottom macOS Dock */}
      <MacDock
        runningApps={appWindows}
        unreadMail={unreadMailCount}
        onLaunchApp={handleLaunchApp}
      />

      {/* 5. Drag & Drop Upload Overlay */}
      {isDraggingFileOver && (
        <div className="absolute inset-0 z-40 bg-blue-950/40 backdrop-blur-md border-4 border-dashed border-blue-400/80 rounded-3xl m-3 flex flex-col items-center justify-center pointer-events-none animate-fadeIn">
          <div className="p-6 rounded-2xl bg-[#141824]/95 border border-blue-400/50 shadow-2xl flex flex-col items-center gap-3">
            <Upload className="w-12 h-12 text-blue-400 animate-bounce" />
            <span className="text-base font-bold text-white">Drop files to place on macOS Desktop</span>
            <span className="text-xs text-blue-300">Opens instantly with Universal Quick Look & Viewer</span>
          </div>
        </div>
      )}

      {/* Hidden File Input for uploading ANY file directly to Desktop */}
      <input
        type="file"
        ref={desktopFileInputRef}
        onChange={handleDesktopFileInputChange}
        multiple
        className="hidden"
      />

      {/* 6. Desktop Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-52 bg-[#181c2b]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl shadow-2xl py-1 text-xs text-slate-200 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.targetItem ? (
            /* Context menu for a specific clicked desktop item */
            <>
              <button
                onClick={() => {
                  handleOpenDesktopItem(contextMenu.targetItem);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-semibold"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick Look / Open</span>
              </button>

              {contextMenu.targetItem.type === 'file' && (
                <>
                  <button
                    onClick={() => {
                      setOpenedEditorFile(contextMenu.targetItem);
                      if (contextMenu.targetItem.isDocumentRecord && contextMenu.targetItem.docId) {
                        setOpenedEditorDocId(contextMenu.targetItem.docId);
                      } else {
                        setOpenedEditorDocId(null);
                      }
                      handleLaunchApp('documents');
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open in Document Editor</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadDesktopFile(contextMenu.targetItem);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download to PC</span>
                  </button>

                  <div className="my-1 border-t border-slate-800" />

                  <button
                    onClick={() => {
                      handleDeleteDesktopFile(contextMenu.targetItem);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white flex items-center gap-2 text-rose-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
                </>
              )}
            </>
          ) : (
            /* Context menu for empty desktop canvas */
            <>
              <button
                onClick={() => {
                  desktopFileInputRef.current?.click();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-semibold text-cyan-300"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Upload File to Desktop...</span>
              </button>

              <button
                onClick={() => {
                  handleCreateDesktopDocument();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>New Text Document...</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  handleLaunchApp('finder');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Folder className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Finder</span>
              </button>

              <button
                onClick={() => {
                  handleLaunchApp('settings');
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <Image className="w-3.5 h-3.5 text-amber-400" />
                <span>Change Wallpaper...</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  syncVirtualComputer();
                  loadDesktopFiles();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-blue-600 hover:text-white flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>Refresh Desktop</span>
              </button>

              <div className="my-1 border-t border-slate-800" />

              <button
                onClick={() => {
                  handleSimulateSuspiciousActivity();
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white flex items-center gap-2 text-rose-300 font-medium"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Simulate Suspicious Activity...</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 7. Security Notification Toast Banner */}
      {notificationBanner && (
        <div className="fixed top-12 right-5 z-50 p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl text-xs text-white flex items-center gap-3 animate-fadeIn">
          <AlertOctagon className="w-5 h-5 text-cyan-400 shrink-0" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* 8. Administrator Lock Screen */}
      {isLocked && (
        <MacLockScreen
          currentUser={user}
          lockReason={lockReason}
          onLogout={handleLogout}
          onUnlockSuccess={() => {
            setIsLocked(false);
            setLockReason('');
            syncVirtualComputer();
          }}
        />
      )}

      {/* 9. macOS Universal Quick Look & File Viewer (Opens ANY file) */}
      {quickLookFile && (
        <MacQuickLookModal
          file={quickLookFile}
          onClose={() => setQuickLookFile(null)}
          onOpenInEditor={(f) => {
            setOpenedEditorFile(f);
            if (f.isDocumentRecord && f.docId) {
              setOpenedEditorDocId(f.docId);
            } else {
              setOpenedEditorDocId(null);
            }
            handleLaunchApp('documents');
          }}
          onDownload={handleDownloadDesktopFile}
          onDelete={handleDeleteDesktopFile}
          onNavigatePrev={handleQuickLookPrev}
          onNavigateNext={handleQuickLookNext}
          hasPrev={currentQuickLookIndex > 0}
          hasNext={currentQuickLookIndex >= 0 && currentQuickLookIndex < desktopFiles.length - 1}
        />
      )}
    </div>
  );

  return desktopInner;
}
