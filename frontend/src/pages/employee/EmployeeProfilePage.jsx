import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ApiClient from '../../api/client';
import { User, ShieldCheck, Mail, Building2, Laptop, ArrowLeft } from 'lucide-react';

export default function EmployeeProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vm, setVm] = useState(null);

  useEffect(() => {
    ApiClient.getMyVirtualComputer()
      .then(res => setVm(res.virtual_computer))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/employee/desktop"
            className="flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to macOS Virtual Desktop</span>
          </Link>
          <span className="text-xs text-slate-500 font-mono">Employee Security Dossier</span>
        </div>

        <div className="bg-[#111422] border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg">
              {(user?.full_name || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.full_name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Workstation Access</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 text-xs">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px]">Department:</span>
              <div className="font-bold text-slate-200 mt-1">{user?.department}</div>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px]">Corporate Role:</span>
              <div className="font-bold text-slate-200 mt-1">{user?.role}</div>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px]">Dedicated Virtual Computer:</span>
              <div className="font-bold text-cyan-400 mt-1">{vm?.computer_name || "Employee's Virtual Mac"}</div>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80">
              <span className="text-slate-500 text-[11px]">Operating System:</span>
              <div className="font-bold text-slate-200 mt-1">macOS 15.1 Sonoma</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
