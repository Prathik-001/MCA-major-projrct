import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  FileText,
  Save,
  Plus,
  History,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  RotateCcw,
  Hash,
  Search,
  Bold,
  Italic,
  Code,
  List
} from 'lucide-react';

export default function DocumentEditorApp({ currentUser, openedDocId, openedFile }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [classification, setClassification] = useState('INTERNAL');
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastSavedHash, setLastSavedHash] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiClient.getDocuments();
      setDocuments(data || []);
      if (!openedFile && !openedDocId && data && data.length > 0 && !selectedDoc) {
        selectDocument(data[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (openedDocId) {
      selectDocument({ id: openedDocId });
    } else if (openedFile) {
      setSelectedDoc({ id: openedFile.id || 'file-' + Date.now(), title: openedFile.name, isFileRecord: true });
      setTitle(openedFile.name);
      setContent(openedFile.content || openedFile.content_preview || '');
      setClassification(openedFile.classification || 'INTERNAL');
      setVersions([]);
    }
  }, [openedDocId, openedFile]);

  const selectDocument = async (doc) => {
    try {
      const res = await ApiClient.getDocument(doc.id);
      setSelectedDoc(res.document);
      setTitle(res.document.title);
      setContent(res.document.content || '');
      setClassification(res.document.classification || 'INTERNAL');
      setVersions(res.versions || []);
      setLastSavedHash(res.versions?.[0]?.sha256_hash || '');
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Save
  const handleSave = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    setError('');
    try {
      const res = await ApiClient.saveDocument(selectedDoc.id, {
        title,
        content,
        classification
      });

      setSuccessMsg(`Saved version ${res.version}. SHA-256: ${res.sha256_hash.slice(0, 12)}...`);
      setLastSavedHash(res.sha256_hash);

      // Refresh version list
      const updated = await ApiClient.getDocument(selectedDoc.id);
      setVersions(updated.versions || []);
      setSelectedDoc(updated.document);

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Revert
  const handleRevert = async (versionNum) => {
    if (!confirm(`Revert document to version ${versionNum}? Current changes will be overwritten.`)) return;

    try {
      await ApiClient.revertDocumentVersion(selectedDoc.id, versionNum);
      setSuccessMsg(`Document reverted to version ${versionNum}.`);
      selectDocument(selectedDoc);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Create Document
  const handleCreateNew = async () => {
    const docTitle = prompt('Enter document title:', 'Untitled Document');
    if (!docTitle || !docTitle.trim()) return;

    try {
      const res = await ApiClient.createDocument({
        title: docTitle.trim(),
        content: `# ${docTitle.trim()}\n\nStart typing company notes here...`,
        classification: 'INTERNAL'
      });

      setSuccessMsg(`Document '${docTitle}' created.`);
      await loadDocuments();
      selectDocument(res.document);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await ApiClient.deleteDocument(selectedDoc.id);
      setSuccessMsg('Document moved to Trash.');
      setSelectedDoc(null);
      loadDocuments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredDocs = documents.filter(d => {
    if (!searchQuery) return true;
    return d.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Document List Sidebar */}
      <div className="w-64 bg-[#0e111a] border-r border-slate-800 flex flex-col p-3 shrink-0">
        <button
          onClick={handleCreateNew}
          className="w-full mb-3 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Document</span>
        </button>

        <div className="relative mb-3">
          <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">My Documents</div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredDocs.map(doc => {
            const isSelected = selectedDoc && selectedDoc.id === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => selectDocument(doc)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all ${
                  isSelected ? 'bg-blue-600/20 text-white border-l-2 border-blue-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold truncate">{doc.title}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>v{doc.version_count || 1}</span>
                  <span className={`px-1 py-0.2 rounded font-bold ${
                    doc.classification === 'TOP SECRET' ? 'bg-red-500/20 text-red-400' :
                    doc.classification === 'RESTRICTED' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {doc.classification || 'INTERNAL'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Editor Workspace */}
      <div className="flex-1 flex flex-col bg-[#141721] overflow-hidden">
        {selectedDoc ? (
          <>
            {/* Editor Toolbar */}
            <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:outline-none px-1 py-0.5 max-w-sm truncate"
                />
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="TOP SECRET">TOP SECRET</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {lastSavedHash && (
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 hidden sm:flex">
                    <Hash className="w-3 h-3 text-cyan-400" />
                    <span>SHA: {lastSavedHash.slice(0, 8)}...</span>
                  </span>
                )}
                <button
                  onClick={() => setShowVersions(!showVersions)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                    showVersions ? 'bg-blue-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Versions ({versions.length})</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
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

            {/* Editor Body + Versions Sidebar */}
            <div className="flex-1 flex overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing rich markdown or corporate analysis..."
                className="flex-1 p-6 bg-[#141721] text-xs font-mono text-slate-200 leading-relaxed resize-none focus:outline-none select-text whitespace-pre-wrap"
              />

              {showVersions && (
                <div className="w-64 border-l border-slate-800 bg-[#111420] flex flex-col p-3 overflow-y-auto">
                  <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>Version History</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">Cryptographically hashed snapshots.</p>

                  <div className="space-y-2">
                    {versions.map(v => (
                      <div key={v.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                        <div className="flex items-center justify-between font-semibold text-slate-200">
                          <span>Version {v.version_num}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-1 truncate" title={v.sha256_hash}>
                          {v.sha256_hash.slice(0, 16)}...
                        </div>
                        <button
                          onClick={() => handleRevert(v.version_num)}
                          className="mt-2 w-full py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-semibold flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Restore Version</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
            <FileText className="w-12 h-12 text-slate-700 stroke-1" />
            <p className="text-xs">Select or create a document to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
