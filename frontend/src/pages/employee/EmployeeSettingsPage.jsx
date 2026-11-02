import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SettingsApp from '../../components/desktop/apps/SettingsApp';
import { ArrowLeft } from 'lucide-react';

export default function EmployeeSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      <div className="p-3 bg-[#111422] border-b border-slate-800 flex items-center justify-between">
        <Link
          to="/employee/desktop"
          className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to macOS Desktop</span>
        </Link>
        <span className="text-xs text-slate-400">Workstation Preferences</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <SettingsApp currentUser={user} />
      </div>
    </div>
  );
}
