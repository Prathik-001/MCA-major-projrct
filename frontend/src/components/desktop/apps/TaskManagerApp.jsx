import React, { useState, useEffect, useMemo } from 'react';
import ApiClient from '../../../api/client';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  MessageSquare,
  User,
  Calendar,
  X,
  Send,
  Trash2,
  RefreshCw,
  ArrowRight,
  Search,
  Filter,
  LayoutGrid,
  List,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function TaskManagerApp({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [teamUsers, setTeamUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // View & Filter Controls
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'Urgent' | 'High' | 'Medium' | 'Low'

  // Selected task for details & comments modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // New Task Modal
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignee, setNewAssignee] = useState('');

  // Completion Notes Modal
  const [completingTask, setCompletingTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiClient.getTasks();
      const taskList = Array.isArray(data) ? data : [];
      setTasks(taskList);
      if (selectedTask) {
        const refreshed = taskList.find(t => t.id === selectedTask.id);
        if (refreshed) setSelectedTask(refreshed);
      }
    } catch (err) {
      setError(err.message || 'Failed to load workstation tasks.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await ApiClient.getUsers();
      if (res && res.users) {
        setTeamUsers(res.users);
      }
    } catch (err) {
      // If employee lacks permission to list all users, silently ignore
      setTeamUsers([]);
    }
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
  }, []);

  // Handle status update
  const handleUpdateStatus = async (taskId, newStatus, notes = '') => {
    try {
      await ApiClient.updateTaskStatus(taskId, newStatus, notes);
      setSuccessMsg(`Task moved to ${newStatus}.`);
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update task status.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Handle Create Task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await ApiClient.createTask({
        title: newTitle.trim(),
        description: newDesc.trim(),
        priority: newPriority,
        assigned_to: newAssignee || (currentUser ? currentUser.id : undefined),
        due_date: newDueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      });

      setSuccessMsg('New task created successfully.');
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
      setNewPriority('Medium');
      setNewDueDate('');
      setNewAssignee('');
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create task.');
      setTimeout(() => setError(''), 4000);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;

    setIsPostingComment(true);
    try {
      await ApiClient.addTaskComment(selectedTask.id, commentText.trim());
      setCommentText('');
      await loadTasks();
    } catch (err) {
      setError(err.message || 'Failed to post comment.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsPostingComment(false);
    }
  };

  // Handle Delete Task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await ApiClient.deleteTask(taskId);
      setSuccessMsg('Task removed from board.');
      setSelectedTask(null);
      loadTasks();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete task.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Urgent
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
            Low
          </span>
        );
    }
  };

  const getDueDateDisplay = (dueDateStr, isCompleted) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    const isPastDue = !isCompleted && due < now;

    const formatted = due.toLocaleDateString([], { month: 'short', day: 'numeric' });

    if (isPastDue) {
      return (
        <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 rounded flex items-center gap-1" title="Overdue">
          <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
          <span>{formatted}</span>
        </span>
      );
    }

    return (
      <span className="text-[10px] text-slate-400 flex items-center gap-1">
        <Clock className="w-3 h-3 text-slate-500" />
        <span>{formatted}</span>
      </span>
    );
  };

  const getAssigneeInitials = (name) => {
    if (!name || name === 'Unassigned') return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Filter tasks based on Search Query & Priority
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch = !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.assignee_name && t.assignee_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  const pendingTasks = filteredTasks.filter(t => t.status === 'Pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'In Progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0d1017] text-slate-200 select-none overflow-hidden font-sans">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-2.5 bg-[#141824] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left Title & Status Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-white tracking-wide block">Task Flow Manager</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="font-semibold text-slate-300">{tasks.length} total</span>
                <span>•</span>
                <span className="text-slate-400">{tasks.filter(t => t.status === 'Pending').length} pending</span>
                <span>•</span>
                <span className="text-blue-400">{tasks.filter(t => t.status === 'In Progress').length} in progress</span>
                <span>•</span>
                <span className="text-emerald-400">{tasks.filter(t => t.status === 'Completed').length} done</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="flex-1 max-w-xs relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, descriptions, or people..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1b2130] border border-slate-700/60 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Right Controls: Filter, View Switcher, Create Button, Refresh */}
        <div className="flex items-center gap-2">
          {/* Priority Filter */}
          <div className="flex items-center bg-[#1b2130] border border-slate-700/60 rounded-lg px-2 py-0.5">
            <Filter className="w-3 h-3 text-slate-400 mr-1.5" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-[11px] text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Kanban / List Toggle */}
          <div className="flex items-center bg-[#1b2130] border border-slate-700/60 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded text-xs transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded text-xs transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Create Task Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadTasks}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Refresh Board"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications / Alerts Banner */}
      {successMsg && (
        <div className="px-4 py-1.5 bg-emerald-950/80 border-b border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-1.5 bg-rose-950/80 border-b border-rose-600/40 text-rose-300 text-xs flex items-center justify-between animate-fadeIn shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">×</button>
        </div>
      )}

      {/* 2. Main Content Area */}
      {viewMode === 'kanban' ? (
        /* ================= KANBAN BOARD VIEW ================= */
        <div className="flex-1 p-4 flex gap-4 overflow-x-auto min-h-0 bg-[#0a0d14]">
          {/* Column 1: Pending */}
          <div className="flex-1 min-w-[280px] max-w-[420px] bg-[#121622]/90 border border-slate-800/80 rounded-2xl flex flex-col min-h-0 shadow-lg">
            {/* Column Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Pending</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 font-bold text-slate-300">
                  {pendingTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Add Pending Task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              {pendingTasks.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <Clock className="w-6 h-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-400">No pending tasks</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">Tasks ready to be worked on appear here.</span>
                </div>
              ) : (
                pendingTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 bg-[#191f2e] hover:bg-[#1d2537] border border-slate-800/90 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getPriorityBadge(task.priority)}
                      {getDueDateDisplay(task.due_date, false)}
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors leading-snug">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          title={`Assigned to: ${task.assignee_name || 'Unassigned'}`}
                        >
                          {getAssigneeInitials(task.assignee_name)}
                        </div>
                        <span className="text-slate-400 truncate max-w-[90px]">
                          {task.assignee_name || 'Unassigned'}
                        </span>
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{task.comments.length}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(task.id, 'In Progress');
                        }}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors"
                        title="Move to In Progress"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>Start</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex-1 min-w-[280px] max-w-[420px] bg-[#121622]/90 border border-slate-800/80 rounded-2xl flex flex-col min-h-0 shadow-lg">
            {/* Column Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">In Progress</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 font-bold text-blue-400">
                  {inProgressTasks.length}
                </span>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Add Task"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              {inProgressTasks.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <Play className="w-6 h-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-400">No active tasks</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">Start a pending task to monitor its execution.</span>
                </div>
              ) : (
                inProgressTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 bg-[#191f2e] hover:bg-[#1d2537] border border-blue-900/40 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      {getPriorityBadge(task.priority)}
                      {getDueDateDisplay(task.due_date, false)}
                    </div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          title={`Assigned to: ${task.assignee_name || 'Unassigned'}`}
                        >
                          {getAssigneeInitials(task.assignee_name)}
                        </div>
                        <span className="text-slate-400 truncate max-w-[90px]">
                          {task.assignee_name || 'Unassigned'}
                        </span>
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{task.comments.length}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateStatus(task.id, 'Pending');
                          }}
                          className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
                          title="Move back to Pending"
                        >
                          <Pause className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompletingTask(task);
                            setCompletionNotes('');
                          }}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-md text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          title="Submit Task Deliverable / Complete"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Complete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="flex-1 min-w-[280px] max-w-[420px] bg-[#121622]/90 border border-slate-800/80 rounded-2xl flex flex-col min-h-0 shadow-lg">
            {/* Column Header */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Completed</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 font-bold text-emerald-400">
                  {completedTasks.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-0">
              {completedTasks.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-slate-600 mb-2" />
                  <span className="text-xs font-medium text-slate-400">No completed tasks</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">Finished and verified deliverables will show here.</span>
                </div>
              ) : (
                completedTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="p-3.5 bg-[#171d2b] hover:bg-[#1b2233] border border-emerald-950/40 hover:border-emerald-700/50 rounded-xl cursor-pointer transition-all shadow-sm group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Done</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {task.completed_at ? new Date(task.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Verified'}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-300 line-through group-hover:text-slate-200 transition-colors leading-snug">
                      {task.title}
                    </h4>

                    {task.completion_notes && (
                      <p className="text-[11px] text-emerald-400/90 mt-2 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-lg italic">
                        "{task.completion_notes}"
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                          title={`Completed by: ${task.assignee_name || 'Unassigned'}`}
                        >
                          {getAssigneeInitials(task.assignee_name)}
                        </div>
                        <span className="text-slate-400 truncate max-w-[90px]">
                          {task.assignee_name || 'Unassigned'}
                        </span>
                        {task.comments && task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MessageSquare className="w-2.5 h-2.5" />
                            <span>{task.comments.length}</span>
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateStatus(task.id, 'In Progress');
                        }}
                        className="px-2 py-0.5 text-slate-400 hover:text-blue-300 hover:bg-slate-800 rounded text-[10px] font-medium flex items-center gap-1 transition-colors"
                        title="Reopen Task"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Reopen</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= TABLE LIST VIEW ================= */
        <div className="flex-1 p-4 overflow-y-auto bg-[#0a0d14]">
          <div className="bg-[#121622] border border-slate-800/90 rounded-2xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">Task Title & Details</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Priority</th>
                  <th className="py-3 px-3 font-semibold">Assignee</th>
                  <th className="py-3 px-3 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No tasks found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : task.status === 'In Progress'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            task.status === 'Completed'
                              ? 'bg-emerald-400'
                              : task.status === 'In Progress'
                              ? 'bg-blue-400 animate-pulse'
                              : 'bg-slate-400'
                          }`} />
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getPriorityBadge(task.priority)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white">
                            {getAssigneeInitials(task.assignee_name)}
                          </div>
                          <span className="text-slate-300">{task.assignee_name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getDueDateDisplay(task.due_date, task.status === 'Completed')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {task.status === 'Pending' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'In Progress')}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-semibold transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {task.status === 'In Progress' && (
                            <button
                              onClick={() => {
                                setCompletingTask(task);
                                setCompletionNotes('');
                              }}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded text-[10px] font-semibold transition-colors"
                            >
                              Complete
                            </button>
                          )}
                          {task.status === 'Completed' && (
                            <button
                              onClick={() => handleUpdateStatus(task.id, 'In Progress')}
                              className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded text-[10px] transition-colors"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                            title="View Details"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Task Details & Comments Modal */}
      {selectedTask && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161a27] border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92%] animate-fadeIn">
            {/* Header */}
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-white tracking-wide">Workstation Task Details</span>
                {getPriorityBadge(selectedTask.priority)}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1.5 leading-snug">{selectedTask.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  {selectedTask.description || 'No detailed instructions or acceptance criteria provided.'}
                </p>
              </div>

              {/* Status & Key Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Current Status:</span>
                  <div className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedTask.status === 'Completed'
                        ? 'bg-emerald-400'
                        : selectedTask.status === 'In Progress'
                        ? 'bg-blue-400 animate-pulse'
                        : 'bg-slate-400'
                    }`} />
                    <span>{selectedTask.status}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Due Date:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {new Date(selectedTask.due_date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Assigned Member:</span>
                  <div className="font-semibold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{selectedTask.assignee_name || 'Unassigned'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Creator / Origin:</span>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {selectedTask.creator_name || 'System'}
                  </div>
                </div>
              </div>

              {/* Completion Notes Banner */}
              {selectedTask.completion_notes && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-xs">
                  <span className="text-[11px] font-bold text-emerald-400 block mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Completion Notes / Deliverable Summary:
                  </span>
                  <p className="text-emerald-200 italic leading-relaxed">
                    "{selectedTask.completion_notes}"
                  </p>
                </div>
              )}

              {/* Quick Status Workflow Action Buttons */}
              <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Quick Status Change:</span>
                <div className="flex items-center gap-2">
                  {selectedTask.status !== 'Pending' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'Pending')}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                    >
                      Move to Pending
                    </button>
                  )}
                  {selectedTask.status !== 'In Progress' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTask.id, 'In Progress')}
                      className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-xs font-semibold"
                    >
                      In Progress
                    </button>
                  )}
                  {selectedTask.status !== 'Completed' && (
                    <button
                      onClick={() => {
                        setCompletingTask(selectedTask);
                        setCompletionNotes('');
                      }}
                      className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded text-xs font-semibold"
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>

              {/* Comments Feed Section */}
              <div className="pt-2">
                <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                  <span>Discussion & Activity ({selectedTask.comments?.length || 0})</span>
                </div>

                <div className="space-y-2 mb-3 max-h-44 overflow-y-auto pr-1">
                  {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic p-3 bg-slate-900/40 rounded-lg text-center">
                      No activity notes or comments yet. Post an update below.
                    </p>
                  ) : (
                    selectedTask.comments.map(c => (
                      <div key={c.id} className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-300">{c.author_name}</span>
                          <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an update or progress note..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={isPostingComment || !commentText.trim()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Completion Submission Modal */}
      {completingTask && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161a27] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5 animate-fadeIn">
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Submit Task Completion</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3 line-clamp-1">"{completingTask.title}"</p>

            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Deliverable Summary / Acceptance Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Completed audit and reconciled ledger balances with zero discrepancies."
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCompletingTask(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleUpdateStatus(completingTask.id, 'Completed', completionNotes);
                  setCompletingTask(null);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/50 transition-all hover:scale-[1.02]"
              >
                Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Create Task Modal */}
      {isCreating && (
        <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161a27] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                <span>Create New Workstation Task</span>
              </span>
              <button
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-3.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Task Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Audit Q4 Wire Transfers & Authorization Records"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Description / Acceptance Criteria</label>
                <textarea
                  rows={3}
                  placeholder="Detail the steps, resources required, and deliverables..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Assignee Selection */}
              {teamUsers.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Assign to Member</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Assign to Me ({currentUser ? currentUser.full_name : 'Current User'})</option>
                    {teamUsers.map(u => (
                      <option key={u.user_id || u.id} value={u.user_id || u.id}>
                        {u.full_name || u.email} ({u.department || 'Employee'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-900/40"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
