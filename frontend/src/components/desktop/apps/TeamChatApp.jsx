import React, { useState, useEffect, useRef } from 'react';
import ApiClient from '../../../api/client';
import {
  MessageSquare,
  Send,
  Users,
  User,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Hash,
  Paperclip,
  Clock
} from 'lucide-react';

export default function TeamChatApp({ currentUser }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const data = await ApiClient.getChatConversations();
      setConversations(data || []);
      if (data && data.length > 0 && !selectedConv) {
        setSelectedConv(data[0]);
      }
    } catch (err) {
      console.error('Failed to load chat conversations:', err);
    }
  };

  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const msgs = await ApiClient.getChatMessages(convId);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
    ApiClient.getMailContacts().then(res => setContacts(res || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
      // Auto-poll messages every 4 seconds for realtime chat experience
      const timer = setInterval(() => {
        loadMessages(selectedConv.id);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConv) return;

    setSending(true);
    try {
      const res = await ApiClient.sendChatMessage(selectedConv.id, messageInput.trim());
      setMessageInput('');
      setMessages(prev => [...prev, res.message]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  // Start direct chat with contact
  const handleStartDirectChat = async (employeeId) => {
    try {
      const res = await ApiClient.startDirectChat(employeeId);
      setShowNewChatModal(false);
      await loadConversations();
      setSelectedConv(res.conversation);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Left Chat List */}
      <div className="w-64 bg-[#0e111a] border-r border-slate-800 flex flex-col p-3 shrink-0">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Direct Message</span>
        </button>

        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 mb-2">Channels & Chats</div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {conversations.map(conv => {
            const isSelected = selectedConv && selectedConv.id === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center gap-2.5 ${
                  isSelected ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  conv.is_group ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {conv.is_group ? <Hash className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 truncate">
                  <div className="font-semibold truncate text-xs">{conv.name}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {conv.last_message ? `${conv.last_message.sender_name.split(' ')[0]}: ${conv.last_message.message}` : 'No messages yet'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Chat Conversation */}
      <div className="flex-1 flex flex-col bg-[#141721] overflow-hidden">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  selectedConv.is_group ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'
                }`}>
                  {selectedConv.is_group ? <Hash className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedConv.name}</h3>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Encrypted Intra-Workstation Channel</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => loadMessages(selectedConv.id)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <MessageSquare className="w-10 h-10 text-slate-700 stroke-1 mb-2" />
                  <span>No message history in this conversation. Start communicating!</span>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-500 font-semibold mb-1 px-1">
                        {isMe ? 'You' : msg.sender_name}
                      </div>
                      <div
                        className={`max-w-md px-3.5 py-2 rounded-2xl text-xs leading-relaxed select-text shadow-sm ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#111420] border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Message ${selectedConv.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={sending || !messageInput.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl shadow-md transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-2">
            <MessageSquare className="w-12 h-12 text-slate-700 stroke-1" />
            <p className="text-xs">Select a channel or direct message to chat.</p>
          </div>
        )}
      </div>

      {/* Start Direct Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-5">
            <h3 className="text-xs font-bold text-white mb-3">Select Coworker to Chat</h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {contacts
                .filter(c => c.id !== currentUser?.id)
                .map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleStartDirectChat(c.id)}
                    className="w-full text-left p-2.5 hover:bg-slate-800/80 rounded-xl text-xs flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 group-hover:text-blue-400">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.department}</div>
                    </div>
                    <span className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 font-semibold">Start</span>
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="mt-4 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
