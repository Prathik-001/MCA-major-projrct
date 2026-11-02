import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  Edit3,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Shield,
  Copy,
  Check,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Clock,
  HardDrive
} from 'lucide-react';

export default function MacQuickLookModal({
  file,
  onClose,
  onOpenInEditor,
  onDownload,
  onDelete,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext
}) {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [spreadsheetSearch, setSpreadsheetSearch] = useState('');
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'metadata'

  if (!file) return null;

  // Determine file type category from name and properties
  const ext = (file.name || '').split('.').pop().toLowerCase();

  const fileCategory = useMemo(() => {
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'].includes(ext) || file.file_type === 'image') {
      return 'image';
    }
    if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext) || file.file_type === 'spreadsheet') {
      return 'spreadsheet';
    }
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'yaml', 'yml', 'sql', 'sh', 'html', 'css', 'gpg', 'env', 'xml'].includes(ext) || file.file_type === 'code') {
      return 'code';
    }
    if (ext === 'pdf' || file.file_type === 'pdf') {
      return 'pdf';
    }
    if (['txt', 'md', 'doc', 'docx', 'rtf', 'log'].includes(ext) || file.file_type === 'document') {
      return 'document';
    }
    return 'generic';
  }, [ext, file.file_type]);

  // Handle keyboard shortcuts inside Quick Look
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.code === 'Space') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigatePrev();
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigateNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigatePrev, onNavigateNext, hasPrev, hasNext]);

  // Content string
  const content = file.content || file.content_preview || file.description || 'No raw preview content stored.';

  // Format file size
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '1.2 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Copy content to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse CSV / spreadsheet lines into table structure
  const spreadsheetData = useMemo(() => {
    if (fileCategory !== 'spreadsheet') return null;

    // Try parsing comma, tab, or pipe delimited rows
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return {
        headers: ['Column A', 'Column B', 'Column C', 'Column D'],
        rows: [
          ['1001', 'Enterprise Q3 Revenue', '$14,250,000.00', 'Verified'],
          ['1002', 'Cloud Infrastructure Cost', '$2,180,450.00', 'Cleared'],
          ['1003', 'Operations & Compliance', '$840,200.00', 'Audited'],
          ['1004', 'Net Operating Surplus', '$11,229,350.00', 'Finalized']
        ]
      };
    }

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
    else if (firstLine.includes('|')) delimiter = '|';

    const rawRows = lines.map(line =>
      line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
    );

    const headers = rawRows[0] || ['A', 'B', 'C', 'D'];
    const rows = rawRows.slice(1);

    return { headers, rows: rows.length > 0 ? rows : [headers] };
  }, [content, fileCategory]);

  // Filter spreadsheet rows
  const filteredRows = useMemo(() => {
    if (!spreadsheetData) return [];
    if (!spreadsheetSearch.trim()) return spreadsheetData.rows;
    const q = spreadsheetSearch.toLowerCase();
    return spreadsheetData.rows.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(q))
    );
  }, [spreadsheetData, spreadsheetSearch]);

  // Classification styling
  const getClassificationBadge = (cls) => {
    const c = (cls || 'INTERNAL').toUpperCase();
    switch (c) {
      case 'TOP SECRET':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse shadow-sm shadow-rose-900/40">
            <Shield className="w-3 h-3 text-rose-400" />
            TOP SECRET
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-amber-400" />
            RESTRICTED
          </span>
        );
      case 'CONFIDENTIAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            CONFIDENTIAL
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            INTERNAL
          </span>
        );
    }
  };

  // Top icon
  const getFileIcon = () => {
    switch (fileCategory) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fadeIn font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl h-[82vh] bg-[#141824]/95 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-2xl ring-1 ring-white/10"
      >
        {/* =================================================================== */}
        {/* 1. macOS Quick Look Window Title Bar                                */}
        {/* =================================================================== */}
        <div className="px-4 py-3 bg-[#181d2c] border-b border-slate-800 flex items-center justify-between shrink-0">
          {/* Left: Window Controls + Title */}
          <div className="flex items-center gap-3">
            {/* macOS Traffic Lights */}
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 flex items-center justify-center transition-opacity shadow-sm"
                title="Close (Esc)"
              >
                <X className="w-2 h-2 text-black/70 opacity-0 hover:opacity-100" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="w-3 h-3 rounded-full bg-[#ffbd2e] flex items-center justify-center shadow-sm"
                title="Reset View"
              />
              <button
                onClick={() => setZoomLevel(prev => (prev === 100 ? 125 : 100))}
                className="w-3 h-3 rounded-full bg-[#27c93f] flex items-center justify-center shadow-sm"
                title="Zoom"
              />
            </div>

            {/* File Icon & Name */}
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-slate-800 border border-slate-700/60">
                {getFileIcon()}
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide block truncate max-w-[280px] sm:max-w-md">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {formatSize(file.file_size_bytes)} • {ext.toUpperCase()} File
                </span>
              </div>
            </div>

            {/* Classification */}
            <div className="hidden sm:block">
              {getClassificationBadge(file.classification)}
            </div>
          </div>

          {/* Right: Quick Look Action Controls */}
          <div className="flex items-center gap-2">
            {/* Prev / Next File Navigator */}
            {(hasPrev || hasNext) && (
              <div className="flex items-center bg-[#111420] border border-slate-700/60 rounded-lg p-0.5 mr-1">
                <button
                  disabled={!hasPrev}
                  onClick={onNavigatePrev}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Previous File (Left Arrow)"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={!hasNext}
                  onClick={onNavigateNext}
                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Next File (Right Arrow)"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Open in Document Editor Button */}
            {onOpenInEditor && (
              <button
                onClick={() => {
                  onOpenInEditor(file);
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Open in Document Editor"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open in Editor</span>
              </button>
            )}

            {/* Download Button */}
            {onDownload && (
              <button
                onClick={() => onDownload(file)}
                className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Download to PC Disk"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Copy Content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Delete Button */}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Move '${file.name}' to Trash?`)) {
                    onDelete(file);
                    onClose();
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                title="Move to Trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Close (X) */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. Interactive Quick Look Viewer Body                               */}
        {/* =================================================================== */}
        <div className="flex-1 overflow-auto bg-[#0d1017] flex flex-col min-h-0 relative">
          {/* A. SPREADSHEET VIEWER (XLSX, CSV) */}
          {fileCategory === 'spreadsheet' && spreadsheetData && (
            <div className="flex-1 flex flex-col min-h-0 p-4">
              {/* Spreadsheet Toolbar */}
              <div className="mb-3 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200">
                    {spreadsheetData.rows.length} rows
                  </span>
                  <span>•</span>
                  <span>{spreadsheetData.headers.length} columns</span>
                </div>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search spreadsheet cells..."
                    value={spreadsheetSearch}
                    onChange={(e) => setSpreadsheetSearch(e.target.value)}
                    className="w-full bg-[#181d2c] border border-slate-700/60 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
                  />
                </div>
              </div>

              {/* Table Container */}
              <div className="flex-1 overflow-auto border border-slate-800 rounded-xl bg-[#131722] shadow-inner">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#181d2c] text-slate-400 sticky top-0 z-10 border-b border-slate-800">
                      <th className="w-10 py-2.5 px-3 text-center text-[10px] font-mono text-slate-500 border-r border-slate-800">
                        #
                      </th>
                      {spreadsheetData.headers.map((hdr, idx) => (
                        <th
                          key={idx}
                          className="py-2.5 px-3 font-semibold text-slate-300 border-r border-slate-800/80 whitespace-nowrap"
                        >
                          {hdr}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-800/40 transition-colors font-mono text-[11px]"
                      >
                        <td className="py-2 px-3 text-center text-slate-500 border-r border-slate-800/80 select-none bg-slate-900/30">
                          {rIdx + 1}
                        </td>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2 px-3 text-slate-300 border-r border-slate-800/50 whitespace-nowrap"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B. CODE VIEWER (JS, PY, JSON, YAML, SQL, SH, GPG) */}
          {fileCategory === 'code' && (
            <div className="flex-1 flex overflow-auto p-4 font-mono text-xs">
              <div className="w-full bg-[#090c12] border border-slate-800 rounded-xl overflow-auto shadow-inner flex">
                {/* Line Numbers */}
                <div className="py-3 px-3 bg-slate-950/60 border-r border-slate-800/80 text-slate-600 select-none text-right shrink-0">
                  {content.split('\n').map((_, i) => (
                    <div key={i} className="leading-relaxed">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {/* Code Body */}
                <pre className="p-3 text-cyan-200/90 overflow-x-auto leading-relaxed flex-1 whitespace-pre">
                  {content}
                </pre>
              </div>
            </div>
          )}

          {/* C. IMAGE VIEWER (PNG, JPG, SVG, GIF, WEBP) */}
          {fileCategory === 'image' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#080a10] relative">
              {/* Zoom Controls */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg p-1 text-xs">
                <button
                  onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-slate-300 font-mono text-[11px]">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(prev => Math.min(250, prev + 25))}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Render Image or Mock Preview */}
              <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-4">
                {content.startsWith('data:image') || content.startsWith('http') ? (
                  <img
                    src={content}
                    alt={file.name}
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                    className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl transition-transform duration-150"
                  />
                ) : (
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})` }}
                    className="w-96 h-72 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-slate-700/80 flex flex-col items-center justify-center p-6 text-center shadow-2xl transition-transform duration-150"
                  >
                    <ImageIcon className="w-16 h-16 text-indigo-400 mb-3 animate-pulse" />
                    <h4 className="text-sm font-bold text-white mb-1">{file.name}</h4>
                    <p className="text-xs text-slate-400 mb-3">Photographic Media / Raster Asset</p>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      1920 × 1080 • 24-bit sRGB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* D. PDF DOCUMENT VIEWER */}
          {fileCategory === 'pdf' && (
            <div className="flex-1 flex flex-col items-center p-6 overflow-auto bg-[#0a0d14]">
              <div className="w-full max-w-2xl bg-[#161a27] border border-slate-700/80 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-rose-400" />
                      <span className="text-sm font-bold text-white uppercase tracking-wider">
                        Corporate Document Specimen
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">PDF Version 1.7</span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2">{file.name}</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">
                    Security Classification: <span className="font-semibold text-rose-300">{file.classification || 'INTERNAL'}</span>.
                    This document is bound by confidentiality safeguards and digital rights enforcement.
                  </p>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                    {content}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Page 1 of 1 • Official Sentinel Workstation Record</span>
                  <span>SHA-256: 8a4f91b...verified</span>
                </div>
              </div>
            </div>
          )}

          {/* E. DOCUMENT & GENERIC TEXT VIEWER */}
          {(fileCategory === 'document' || fileCategory === 'generic') && (
            <div className="flex-1 p-6 overflow-auto flex flex-col">
              <div className="w-full max-w-3xl mx-auto bg-[#141824] border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200">{file.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {content.length} characters • {content.split(/\s+/).filter(Boolean).length} words
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans flex-1">
                  {content}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 3. Footer Status Bar                                                */}
        {/* =================================================================== */}
        <div className="px-5 py-2.5 bg-[#121622] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>macOS Quick Look Engine</span>
            <span>•</span>
            <span className="font-mono text-slate-500">Press Spacebar or Esc to dismiss</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Double-click file anytime to launch native app
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

