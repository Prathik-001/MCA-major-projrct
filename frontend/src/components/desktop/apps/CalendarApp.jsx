import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export default function CalendarApp({ currentUser }) {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [newLocation, setNewLocation] = useState('Virtual Room 1');
  const [newColor, setNewColor] = useState('blue');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getCalendarEvents();
      setEvents(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Handle Create Event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartTime || !newEndTime) return;

    try {
      await ApiClient.createCalendarEvent({
        title: newTitle.trim(),
        description: newDesc.trim(),
        start_time: new Date(newStartTime).toISOString(),
        end_time: new Date(newEndTime).toISOString(),
        location: newLocation,
        color: newColor
      });

      setSuccessMsg('Calendar event scheduled.');
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      loadEvents();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async (id) => {
    try {
      await ApiClient.deleteCalendarEvent(id);
      setSuccessMsg('Event removed from calendar.');
      setSelectedEvent(null);
      loadEvents();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Open scheduler for a specific day
  const handleDayClick = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    setNewStartTime(`${year}-${pad(month + 1)}-${pad(day)}T09:00`);
    setNewEndTime(`${year}-${pad(month + 1)}-${pad(day)}T10:00`);
    setIsCreating(true);
  };

  const handleOpenNewEvent = () => {
    if (!newStartTime) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      setNewStartTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T09:00`);
      setNewEndTime(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T10:00`);
    }
    setIsCreating(true);
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex flex-col h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <span>{monthNames[month]} {year}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 hover:text-white text-slate-400 rounded"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 py-0.5 text-[11px] font-semibold text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 hover:text-white text-slate-400 rounded"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </span>
          )}
          <button
            onClick={handleOpenNewEvent}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 bg-[#0e111a] border-b border-slate-800 text-[11px] font-bold text-slate-500 text-center py-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-slate-800/40 p-px overflow-y-auto">
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-[#111420]/50 p-2 min-h-[90px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayDate = new Date(year, month, day);
          const isToday = new Date().toDateString() === dayDate.toDateString();

          const dayEvents = events.filter(e => {
            const eDate = new Date(e.start_time);
            return (
              eDate.getDate() === day &&
              eDate.getMonth() === month &&
              eDate.getFullYear() === year
            );
          });

          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              title={`Click to schedule an event on ${monthNames[month]} ${day}`}
              className={`bg-[#141721] p-2 min-h-[90px] flex flex-col transition-all cursor-pointer hover:bg-slate-800/50 hover:ring-1 hover:ring-blue-500/40 rounded-lg ${
                isToday ? 'bg-blue-950/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${isToday ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center' : 'text-slate-400'}`}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-24">
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded text-[10px] text-blue-300 font-medium truncate cursor-pointer transition-colors"
                  >
                    {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-400" />
                <span>{selectedEvent.title}</span>
              </h3>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4">{selectedEvent.description || 'No meeting agenda provided.'}</p>

            <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded-xl mb-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {new Date(selectedEvent.start_time).toLocaleString()} – {new Date(selectedEvent.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedEvent.location || 'Virtual Conference'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Schedule Workstation Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Event Title:</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Audit Review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Start Time:</label>
                  <input
                    type="datetime-local"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">End Time:</label>
                  <input
                    type="datetime-local"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Location / Room:</label>
                <input
                  type="text"
                  placeholder="Virtual Conference Room 2"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Agenda / Notes:</label>
                <textarea
                  rows={2}
                  placeholder="Topics to discuss..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
