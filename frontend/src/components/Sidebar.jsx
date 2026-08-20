import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { alertsApi } from '../services/api';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Radio,
  MapPin,
  TrendingUp,
  BrainCircuit,
  Bell,
  SlidersHorizontal,
  BarChart3,
  LogOut,
  Shield,
  User,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout, isAuthority } = useAuth();
  const navigate = useNavigate();
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        const res = await alertsApi.getAll({ is_read: false, limit: 100 });
        setUnreadAlerts(res.data.length);
      } catch (err) {
        // silent fallback
      }
    };
    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const citizenNav = [
    { name: 'Dashboard', path: '/citizen-dashboard', icon: LayoutDashboard },
    { name: 'Report Issue', path: '/report-issue', icon: PlusCircle, highlight: true },
    { name: 'My Reports', path: '/my-reports', icon: FileText },
    { name: 'Live Feed', path: '/live-feed', icon: Radio },
    { name: 'Live Map', path: '/live-map', icon: MapPin },
    { name: 'Trend Intelligence', path: '/trends', icon: TrendingUp },
    { name: 'AI Predictions', path: '/ai-risk-analysis', icon: BrainCircuit },
    { name: 'Alerts', path: '/alerts', icon: Bell, badge: unreadAlerts },
  ];

  const authorityNav = [
    { name: 'City Dashboard', path: '/authority-dashboard', icon: LayoutDashboard },
    { name: 'Live Map', path: '/live-map', icon: MapPin },
    { name: 'Issue Management', path: '/issue-management', icon: SlidersHorizontal, highlight: true },
    { name: 'Trend Intelligence', path: '/trends', icon: TrendingUp },
    { name: 'AI Risk Analysis', path: '/ai-risk-analysis', icon: BrainCircuit },
    { name: 'ML Performance', path: '/ml-performance', icon: BarChart3 },
    { name: 'Critical Alerts', path: '/alerts', icon: Bell, badge: unreadAlerts },
    { name: 'Live Feed', path: '/live-feed', icon: Radio },
  ];

  const navItems = isAuthority ? authorityNav : citizenNav;

  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col h-screen sticky top-0 border-r border-navy-800 shrink-0 select-none z-30">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 font-extrabold text-xl">
            UP
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-lg tracking-tight">UrbanPulse</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Smart City Monitor</p>
          </div>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-2.5 bg-navy-800/50 border-b border-navy-800 flex items-center justify-between text-xs">
        <span className="text-slate-400">Active Portal:</span>
        <span className={`px-2 py-0.5 rounded font-bold text-[11px] tracking-wide uppercase ${
          isAuthority ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
        }`}>
          {isAuthority ? 'Authority Mode' : 'Citizen Mode'}
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : item.highlight
                    ? 'bg-navy-800/70 text-slate-200 hover:bg-navy-800 hover:text-white border border-navy-700/50'
                    : 'text-slate-400 hover:bg-navy-800/60 hover:text-slate-200'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Logout Footer */}
      <div className="p-3.5 border-t border-navy-800 bg-navy-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-navy-800/60 border border-navy-700/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 font-bold text-xs">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'user@urbanpulse.demo'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;
