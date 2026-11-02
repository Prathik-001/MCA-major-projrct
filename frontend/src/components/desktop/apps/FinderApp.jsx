import React, { useState, useEffect, useRef } from 'react';
import ApiClient from '../../../api/client';
import {
  Folder,
  FileText,
  Upload,
  Download,
  Trash2,
  FolderPlus,
  RefreshCw,
  Search,
  Grid,
  List,
  Eye,
  FileCode,
  FileSpreadsheet,
  File,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Clock,
  HardDrive,
  RotateCcw
} from 'lucide-react';

export default function FinderApp({ currentUser }) {
  const [activeNav, setActiveNav] = useState('personal');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Hidden file input for real PC uploads
  const fileInputRef = useRef(null);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeNav === 'trash') {
        const res = await ApiClient.getTrashFiles();
        setFiles(res.files || []);
        setFolders([]);
      } else {
        const res = await ApiClient.getFiles(currentFolderId, activeNav);
        setFolders(res.folders || []);
        setFiles(res.files || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentFolderId, activeNav]);

  // Handle New Folder
  const handleCreateFolder = async () => {
    const name = prompt('Enter new folder name:', 'New Project Folder');
    if (!name || !name.trim()) return;

    try {
      await ApiClient.createFolder(name.trim(), currentFolderId);
      setSuccessMsg(`Folder '${name}' created.`);
      loadFiles();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Real File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Read content for text/code/document preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result || '';
        let fileType = 'document';
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) fileType = 'spreadsheet';
        else if (file.name.endsWith('.js') || file.name.endsWith('.json') || file.name.endsWith('.py')) fileType = 'code';

        await ApiClient.uploadFile({
          name: file.name,
          file_type: fileType,
          file_size_bytes: file.size,
          folder_id: currentFolderId,
          content_preview: typeof content === 'string' ? content.slice(0, 10000) : 'Binary workstation file uploaded.',
          classification: 'INTERNAL'
        });

        setSuccessMsg(`File '${file.name}' successfully uploaded to your virtual computer.`);
        loadFiles();
        setTimeout(() => setSuccessMsg(''), 3000);
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Real File Download
  const handleDownload = async (file) => {
    if (!file) return;
    try {
      const res = await ApiClient.downloadFile(file.id);
      // Trigger real browser download to user's physical machine
      const blob = new Blob([res.content || 'File payload'], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = res.file_name || file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMsg(`Downloaded '${file.name}' to workstation disk. Telemetry logged.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Delete
  const handleDelete = async (file) => {
    if (!file) return;
    try {
      await ApiClient.deleteFile(file.id);
      setSuccessMsg(activeNav === 'trash' ? `Permanently deleted '${file.name}'.` : `Moved '${file.name}' to Trash.`);
      loadFiles();
      setSelectedItem(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Restore from Trash
  const handleRestore = async (file) => {
    if (!file) return;
    try {
      await ApiClient.restoreFile(file.id);
      setSuccessMsg(`Restored '${file.name}' to My Documents.`);
      loadFiles();
      setSelectedItem(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Rename
  const handleRename = async (file) => {
    if (!file) return;
    const newName = prompt('Enter new file name:', file.name);
    if (!newName || !newName.trim() || newName.trim() === file.name) return;

    try {
      await ApiClient.renameFile(file.id, newName.trim());
      setSuccessMsg(`Renamed to '${newName.trim()}'.`);
      loadFiles();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Helper for icons
  const getFileIcon = (file) => {
    if (file.file_type === 'spreadsheet' || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      return <FileSpreadsheet className="w-8 h-8 text-emerald-400" />;
    }
    if (file.file_type === 'code' || file.name.endsWith('.js') || file.name.endsWith('.json')) {
      return <FileCode className="w-8 h-8 text-amber-400" />;
    }
    return <FileText className="w-8 h-8 text-blue-400" />;
  };

  // Filtered files
  const filteredFiles = files.filter(f => {
    if (!searchQuery) return true;
    return f.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Finder Sidebar */}
      <div className="w-48 bg-[#0c0f17]/90 backdrop-blur-xl border-r border-slate-800 flex flex-col p-3 shrink-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5 font-mono">Favorites</div>
        <nav className="space-y-0.5">
          {[
            { id: 'personal', label: 'Documents', icon: Folder, color: 'text-blue-400' },
            { id: 'desktop', label: 'Desktop', icon: Folder, color: 'text-sky-400' },
            { id: 'downloads', label: 'Downloads', icon: Folder, color: 'text-cyan-400' },
            { id: 'recents', label: 'Recents', icon: Clock, color: 'text-indigo-400' },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveNav(item.id === 'recents' || item.id === 'downloads' || item.id === 'desktop' ? 'personal' : item.id); setCurrentFolderId(null); setSelectedItem(null); }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mt-4 mb-1.5 font-mono">Locations</div>
        <nav className="space-y-0.5">
          <button
            onClick={() => { setActiveNav('personal'); setCurrentFolderId(null); setSelectedItem(null); }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeNav === 'personal' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className={`w-3.5 h-3.5 ${activeNav === 'personal' ? 'text-white' : 'text-slate-400'}`} />
            <span>Macintosh HD</span>
          </button>
          <button
            onClick={() => { setActiveNav('shared'); setCurrentFolderId(null); setSelectedItem(null); }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeNav === 'shared' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HardDrive className={`w-3.5 h-3.5 ${activeNav === 'shared' ? 'text-white' : 'text-blue-400'}`} />
            <span>Shared Drive</span>
          </button>
          <button
            onClick={() => { setActiveNav('trash'); setCurrentFolderId(null); setSelectedItem(null); }}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeNav === 'trash' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trash2 className={`w-3.5 h-3.5 ${activeNav === 'trash' ? 'text-white' : 'text-slate-400'}`} />
            <span>Trash</span>
          </button>
        </nav>

        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mt-4 mb-1.5 font-mono">Tags</div>
        <div className="px-2 py-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 cursor-pointer hover:scale-110 transition-transform" title="Red Tag" />
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 cursor-pointer hover:scale-110 transition-transform" title="Orange Tag" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 cursor-pointer hover:scale-110 transition-transform" title="Yellow Tag" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 cursor-pointer hover:scale-110 transition-transform" title="Green Tag" />
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform" title="Blue Tag" />
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 cursor-pointer hover:scale-110 transition-transform" title="Purple Tag" />
        </div>

        <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] text-slate-500 px-2 flex items-center justify-between font-mono">
          <span>APFS Volume</span>
          <span className="text-emerald-400 font-bold">Encrypted</span>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Finder Action Toolbar */}
        <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {activeNav !== 'trash' && (
              <>
                <button
                  onClick={handleCreateFolder}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New Folder</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}

            {selectedItem && (
              activeNav === 'trash' ? (
                <>
                  <button
                    onClick={() => handleRestore(selectedItem)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem)}
                    className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDownload(selectedItem)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => handleRename(selectedItem)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem)}
                    className="px-2 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg text-xs"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )
            )}

            {activeNav === 'trash' && (
              <button
                onClick={async () => {
                  if (confirm('Permanently empty all items in Trash?')) {
                    await ApiClient.emptyTrash();
                    loadFiles();
                  }
                }}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
            <button
              onClick={loadFiles}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="p-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Breadcrumb path */}
        {currentFolderId && (
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => setCurrentFolderId(null)} className="hover:text-blue-400">My Documents</button>
            <span>/</span>
            <span className="text-slate-200 font-medium">Subfolder</span>
          </div>
        )}

        {/* Main Grid / List */}
        <div className="flex-1 p-5 overflow-y-auto">
          {folders.length === 0 && filteredFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
              <Folder className="w-12 h-12 text-slate-700 stroke-1" />
              <span>{loading ? 'Reading virtual filesystem...' : 'Folder is empty'}</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Folders */}
              {folders.map(fld => (
                <div
                  key={fld.id}
                  onDoubleClick={() => setCurrentFolderId(fld.id)}
                  onClick={() => setSelectedItem(null)}
                  className="flex flex-col items-center p-3 rounded-xl hover:bg-slate-800/60 cursor-pointer transition-colors group text-center"
                >
                  <Folder className="w-12 h-12 text-blue-500 group-hover:scale-105 transition-transform" />
                  <span className="text-xs text-slate-200 font-medium mt-2 truncate w-full">{fld.name}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Folder</span>
                </div>
              ))}

              {/* Files */}
              {filteredFiles.map(file => {
                const isSelected = selectedItem && selectedItem.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedItem(file)}
                    onDoubleClick={() => setPreviewFile(file)}
                    className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all text-center relative ${
                      isSelected ? 'bg-blue-600/20 ring-1 ring-blue-500' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {getFileIcon(file)}
                    <span className="text-xs text-slate-200 font-medium mt-2 truncate w-full" title={file.name}>
                      {file.name}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {Math.round((file.file_size_bytes || 1024) / 1024)} KB
                      </span>
                      {file.classification && file.classification !== 'INTERNAL' && (
                        <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          file.classification === 'TOP SECRET' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {file.classification}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="w-full divide-y divide-slate-800 text-xs">
              <div className="grid grid-cols-12 pb-2 text-[11px] font-semibold text-slate-500 px-3">
                <span className="col-span-6">Name</span>
                <span className="col-span-2">Size</span>
                <span className="col-span-2">Classification</span>
                <span className="col-span-2 text-right">Actions</span>
              </div>
              {folders.map(fld => (
                <div
                  key={fld.id}
                  onDoubleClick={() => setCurrentFolderId(fld.id)}
                  className="grid grid-cols-12 py-2.5 px-3 hover:bg-slate-800/40 cursor-pointer items-center"
                >
                  <div className="col-span-6 flex items-center gap-2">
                    <Folder className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-slate-200">{fld.name}</span>
                  </div>
                  <span className="col-span-2 text-slate-500">--</span>
                  <span className="col-span-2 text-slate-500">Folder</span>
                  <span className="col-span-2 text-right text-slate-500">Open</span>
                </div>
              ))}
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  onClick={() => setSelectedItem(file)}
                  onDoubleClick={() => setPreviewFile(file)}
                  className="grid grid-cols-12 py-2.5 px-3 hover:bg-slate-800/40 cursor-pointer items-center"
                >
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    {getFileIcon(file)}
                    <span className="font-medium text-slate-200 truncate">{file.name}</span>
                  </div>
                  <span className="col-span-2 text-slate-500 font-mono">
                    {Math.round((file.file_size_bytes || 1024) / 1024)} KB
                  </span>
                  <span className="col-span-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      file.classification === 'TOP SECRET' ? 'bg-red-500/20 text-red-400' :
                      file.classification === 'RESTRICTED' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {file.classification || 'INTERNAL'}
                    </span>
                  </span>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      className="p-1 hover:text-blue-400 text-slate-400"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                      className="p-1 hover:text-cyan-400 text-slate-400"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* macOS Bottom Path & Status Bar */}
        <div className="h-6 bg-[#0c0f17] border-t border-slate-800/80 px-3 flex items-center justify-between text-[10px] text-slate-400 font-mono select-none">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Macintosh HD</span>
            <span>&rsaquo;</span>
            <span>Users</span>
            <span>&rsaquo;</span>
            <span className="text-slate-300">{currentUser?.full_name?.split(' ')[0] || 'User'}</span>
            <span>&rsaquo;</span>
            <span className="text-white font-semibold">{activeNav === 'personal' ? 'Documents' : activeNav === 'shared' ? 'Shared Drives' : 'Trash'}</span>
          </div>
          <span>{folders.length + filteredFiles.length} items, 412.8 GB available</span>
        </div>
      </div>

      {/* 3. File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white truncate max-w-md">{previewFile.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase">
                  {previewFile.classification || 'INTERNAL'}
                </span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-300 whitespace-pre-wrap select-text leading-relaxed bg-[#111420]">
              {previewFile.content_preview || 'No text preview available for this file format.'}
            </div>

            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Size: {Math.round((previewFile.file_size_bytes || 1024) / 1024)} KB
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewFile(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={() => { handleDownload(previewFile); setPreviewFile(null); }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download to PC</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
