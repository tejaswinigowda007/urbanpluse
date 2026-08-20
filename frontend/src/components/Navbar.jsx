import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Shield, User, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ title = "Dashboard" }) => {
  const { user, isAuthority } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-20 backdrop-blur-md bg-white/95 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500">AI-Based Micro-Issue Trend and Escalation Predictor</p>
      </div>

      <div className="flex items-center gap-3">
        {/* ML Status Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>RandomForest ML Active</span>
        </div>

        {/* Notifications Shortcut */}
        <button
          onClick={() => navigate('/alerts')}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
          title="View Alerts"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Role Avatar Chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            {isAuthority ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">{user?.role || 'CITIZEN'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
