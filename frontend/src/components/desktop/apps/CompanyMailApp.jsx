import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  Mail,
  Inbox,
  Send,
  FileText,
  Star,
  Trash2,
  Edit3,
  RefreshCw,
  Search,
  Paperclip,
  Reply,
  Forward,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  Clock,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';

export default function CompanyMailApp({ currentUser }) {
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Compose Modal State
  const [isComposing, setIsComposing] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState([]);
  const [sending, setSending] = useState(false);

  // Fetch emails for folder
  const loadFolder = async (folder) => {
    setLoading(true);
    setError('');
    try {
      let data = [];
      if (folder === 'inbox') data = await ApiClient.getInbox();
      else if (folder === 'sent') data = await ApiClient.getSentMail();
      else if (folder === 'drafts') data = await ApiClient.getDrafts();
      else if (folder === 'starred') data = await ApiClient.getStarredMail();
      else if (folder === 'trash') data = await ApiClient.getTrashMail();

      setEmails(data || []);
      if (data && data.length > 0 && !selectedEmail) {
        setSelectedEmail(data[0]);
      } else if (!data || data.length === 0) {
        setSelectedEmail(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts for autocompletion
  useEffect(() => {
    ApiClient.getMailContacts()
      .then(res => setContacts(res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadFolder(activeFolder);
  }, [activeFolder]);

  // Handle Mark Read
  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    if (!email.is_read && activeFolder === 'inbox') {
      try {
        await ApiClient.toggleMailRead(email.id, true);
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  // Handle Star
  const handleToggleStar = async (e, email) => {
    e.stopPropagation();
    try {
      const res = await ApiClient.toggleMailStar(email.id);
      setEmails(prev => prev.map(item => item.id === email.id ? { ...item, is_starred: res.is_starred } : item));
      if (selectedEmail && selectedEmail.id === email.id) {
        setSelectedEmail(prev => ({ ...prev, is_starred: res.is_starred }));
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  // Handle Delete
  const handleDeleteEmail = async (email) => {
    try {
      await ApiClient.deleteMail(email.id);
      setEmails(prev => prev.filter(e => e.id !== email.id));
      if (selectedEmail && selectedEmail.id === email.id) {
        setSelectedEmail(null);
      }
      setSuccessMsg('Email moved to Trash.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!composeTo || !composeSubject) {
      setError('Please provide recipient and subject.');
      return;
    }

    setSending(true);
    setError('');
    try {
      await ApiClient.sendMail({
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
        attachments: composeAttachments
      });

      setSuccessMsg(`Email successfully dispatched to ${composeTo}!`);
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setComposeAttachments([]);

      if (activeFolder === 'sent') loadFolder('sent');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Handle Reply
  const handleReply = () => {
    if (!selectedEmail) return;
    setComposeTo(selectedEmail.sender_email);
    setComposeSubject(`Re: ${selectedEmail.subject}`);
    setComposeBody(`\n\n--- On ${new Date(selectedEmail.sent_at).toLocaleString()}, ${selectedEmail.sender_name} wrote:\n> ${selectedEmail.body.replace(/\n/g, '\n> ')}`);
    setIsComposing(true);
  };

  // Handle Save Draft
  const handleSaveDraft = async () => {
    try {
      await ApiClient.saveDraft({
        to: composeTo,
        subject: composeSubject || 'Untitled Draft',
        body: composeBody
      });
      setSuccessMsg('Draft saved successfully.');
      setIsComposing(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      if (activeFolder === 'drafts') loadFolder('drafts');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Restore Email from Trash
  const handleRestoreMail = async (email) => {
    try {
      await ApiClient.restoreMail(email.id);
      setEmails(prev => prev.filter(e => e.id !== email.id));
      setSelectedEmail(null);
      setSuccessMsg('Email restored to Inbox.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtered emails by search
  const filteredEmails = emails.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (e.subject && e.subject.toLowerCase().includes(q)) ||
      (e.sender_name && e.sender_name.toLowerCase().includes(q)) ||
      (e.sender_email && e.sender_email.toLowerCase().includes(q)) ||
      (e.body && e.body.toLowerCase().includes(q))
    );
  });

  const unreadCount = activeFolder === 'inbox' ? emails.filter(e => !e.is_read).length : 0;

  return (
    <div className="flex h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Left Mailbox Sidebar */}
      <div className="w-56 bg-[#0e111a] border-r border-slate-800 flex flex-col p-3 shrink-0">
        <button
          onClick={() => { setIsComposing(true); setError(''); }}
          className="w-full mb-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all active:scale-95"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Compose Email</span>
        </button>

        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">Mailboxes</div>
        <nav className="space-y-1">
          {[
            { id: 'inbox', label: 'Inbox', icon: Inbox, badge: unreadCount },
            { id: 'sent', label: 'Sent', icon: Send },
            { id: 'drafts', label: 'Drafts', icon: FileText },
            { id: 'starred', label: 'Starred', icon: Star },
            { id: 'trash', label: 'Trash', icon: Trash2 }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeFolder === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveFolder(item.id); setSelectedEmail(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-800 text-[11px] text-slate-500 px-2 flex items-center justify-between">
          <span>Enterprise Mail Server</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </div>
      </div>

      {/* 2. Middle Email List */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-[#111420] shrink-0">
        {/* Search Header */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeFolder}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => loadFolder(activeFolder)}
            title="Refresh folder"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        {/* Status / Alert notifications */}
        {successMsg && (
          <div className="p-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {filteredEmails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {loading ? 'Checking for new communications...' : `No messages in ${activeFolder}`}
            </div>
          ) : (
            filteredEmails.map(email => {
              const isSelected = selectedEmail && selectedEmail.id === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`p-3 cursor-pointer transition-colors relative ${
                    isSelected ? 'bg-blue-600/15 border-l-2 border-blue-500' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {!email.is_read && activeFolder === 'inbox' && (
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      )}
                      <span className={`text-xs truncate max-w-[150px] ${!email.is_read ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                        {activeFolder === 'sent' ? (email.recipients?.[0]?.name || email.recipient_name || 'Recipient') : (email.sender_name || email.sender_email)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>{email.sent_at ? new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      <button
                        onClick={(e) => handleToggleStar(e, email)}
                        className="text-slate-500 hover:text-amber-400"
                      >
                        <Star className={`w-3 h-3 ${email.is_starred ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className={`text-xs truncate ${!email.is_read ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                    {email.subject || '(No Subject)'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5 line-clamp-1">
                    {email.body ? email.body.slice(0, 80) : ''}
                  </div>
                  {email.has_attachments && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400">
                      <Paperclip className="w-2.5 h-2.5" />
                      <span>Attachment</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Right Email Content Viewer */}
      <div className="flex-1 flex flex-col bg-[#141721] overflow-hidden">
        {selectedEmail ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Action Bar */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2">
                {activeFolder === 'trash' ? (
                  <button
                    onClick={() => handleRestoreMail(selectedEmail)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore to Inbox</span>
                  </button>
                ) : activeFolder === 'drafts' ? (
                  <button
                    onClick={() => {
                      setComposeTo(selectedEmail.recipient_email || '');
                      setComposeSubject(selectedEmail.subject || '');
                      setComposeBody(selectedEmail.body || '');
                      setIsComposing(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Resume Draft & Send</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleReply}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => {
                        setComposeSubject(`Fwd: ${selectedEmail.subject}`);
                        setComposeBody(`\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender_name} <${selectedEmail.sender_email}>\nDate: ${new Date(selectedEmail.sent_at).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`);
                        setIsComposing(true);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                    >
                      <Forward className="w-3.5 h-3.5" />
                      <span>Forward</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteEmail(selectedEmail)}
                  title={activeFolder === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-900/40 text-rose-400 rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{activeFolder === 'trash' ? 'Delete Permanently' : 'Delete'}</span>
                </button>
              </div>
            </div>

            {/* Email Header */}
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/20">
              <h2 className="text-base font-bold text-white mb-3">
                {selectedEmail.subject || '(No Subject)'}
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-md">
                    {(selectedEmail.sender_name || 'U').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>{selectedEmail.sender_name || selectedEmail.sender_email}</span>
                      <span className="text-[10px] text-slate-500 font-mono">&lt;{selectedEmail.sender_email}&gt;</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      To: {activeFolder === 'sent' ? (selectedEmail.recipients?.map(r => r.email).join(', ') || 'Recipient') : currentUser?.email}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(selectedEmail.sent_at || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Attachments list if any */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((att, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs flex items-center gap-2 text-cyan-300"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-mono text-[11px]">{att.file_name}</span>
                      <span className="text-[10px] text-slate-500">({Math.round(att.file_size_bytes / 1024)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Body */}
            <div className="flex-1 p-6 overflow-y-auto font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {selectedEmail.body}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-3">
            <Mail className="w-12 h-12 text-slate-700 stroke-1" />
            <p className="text-xs">Select an email to view or click Compose to send a new message.</p>
          </div>
        )}
      </div>

      {/* 4. Compose Modal */}
      {isComposing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>New Message</span>
              </div>
              <button
                onClick={() => setIsComposing(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col">
              <div className="p-4 space-y-3">
                {/* To Recipient */}
                <div className="flex items-center border-b border-slate-800 pb-2">
                  <label className="w-16 text-xs text-slate-400 font-medium">To:</label>
                  <div className="flex-1 relative">
                    <input
                      type="email"
                      list="contacts-list"
                      placeholder="employee@sentinel.local"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      required
                      className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                    />
                    <datalist id="contacts-list">
                      {contacts.map(c => (
                        <option key={c.id} value={c.email}>
                          {c.name} ({c.department})
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Subject */}
                <div className="flex items-center border-b border-slate-800 pb-2">
                  <label className="w-16 text-xs text-slate-400 font-medium">Subject:</label>
                  <input
                    type="text"
                    placeholder="Enter email subject..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    required
                    className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Body */}
                <div>
                  <textarea
                    rows={10}
                    placeholder="Write your internal company email message here..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sampleName = prompt('Enter attachment filename:', 'Audit_Reconciliation_Q3.pdf');
                      if (sampleName) {
                        setComposeAttachments(prev => [...prev, { name: sampleName, size: 450000, type: 'application/pdf' }]);
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Attach Asset</span>
                  </button>
                  {composeAttachments.length > 0 && (
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {composeAttachments.length} attached
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{sending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
