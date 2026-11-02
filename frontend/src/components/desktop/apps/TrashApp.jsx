import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  Trash2,
  FileText,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  File
} from 'lucide-react';

export default function TrashApp({ currentUser }) {
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadTrash = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getTrashFiles();
      setDeletedFiles(res.files || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  // Handle Restore
  const handleRestore = async (file) => {
    try {
      await ApiClient.restoreFile(file.id);
      setSuccessMsg(`Restored '${file.name}' to Finder.`);
      loadTrash();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Empty Trash
  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently delete all items in Trash?')) return;
    try {
      await ApiClient.emptyTrash();
      setSuccessMsg('Trash emptied.');
      loadTrash();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold text-white">Trash Bin</span>
          <span className="text-[10px] text-slate-500 font-mono">({deletedFiles.length} Items)</span>
        </div>

        <div className="flex items-center gap-2">
          {deletedFiles.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}
          <button
            onClick={loadTrash}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Deleted Items List */}
      <div className="flex-1 p-5 overflow-y-auto bg-[#0d1017]">
        {deletedFiles.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
            <Trash2 className="w-12 h-12 text-slate-700 stroke-1" />
            <span>Trash is empty</span>
          </div>
        ) : (
          <div className="space-y-2">
            {deletedFiles.map(file => (
              <div
                key={file.id}
                className="p-3 bg-[#161a27] border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{file.name}</div>
                    <div className="text-[10px] text-slate-500">
                      Size: {Math.round((file.file_size_bytes || 1024) / 1024)} KB
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRestore(file)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>Restore</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
