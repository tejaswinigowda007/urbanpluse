import React, { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import AIAnalysisModal from '../components/AIAnalysisModal';
import {
  Radio,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Eye,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LiveFeed = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activePriority, setActivePriority] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchLiveFeed = async () => {
    try {
      const res = await reportsApi.getAll({ limit: 80 });
      setReports(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Live feed poll error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed();
    const interval = setInterval(fetchLiveFeed, 8000); // 8-second auto polling
    return () => clearInterval(interval);
  }, []);

  const categories = ['ALL', 'Pothole', 'Water Leakage', 'Garbage Accumulation', 'Streetlight Failure', 'Drainage', 'Road Damage'];
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filtered = reports.filter(r => {
    const matchCat = activeCategory === 'ALL' || r.category === activeCategory;
    const matchPrio = activePriority === 'ALL' || r.priority === activePriority;
    return matchCat && matchPrio;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">UrbanPulse Live Feed</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous real-time stream of citizen-reported urban issues & AI escalation predictions
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Updated: {lastRefreshed.toLocaleTimeString()}</span>
          <button
            onClick={fetchLiveFeed}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Filter Priority:</span>
          {priorities.map(prio => (
            <button
              key={prio}
              onClick={() => setActivePriority(prio)}
              className={`px-2.5 py-0.5 rounded font-semibold text-[11px] ${
                activePriority === prio
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading live incident feed...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No reports matching active filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(report => (
            <div
              key={report.report_id}
              className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between ${
                report.priority === 'CRITICAL' ? 'border-red-200 ring-1 ring-red-400/30' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-blue-600">{report.report_id}</span>
                  <PriorityBadge priority={report.priority} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">{report.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{report.location_name}</span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {report.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Escalation Risk:</span>
                  <span className="font-extrabold text-red-600">{report.escalation_probability}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <StatusBadge status={report.status} />
                </div>

                <button
                  onClick={() => setSelectedReport(report)}
                  className="w-full mt-2 py-2 px-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View AI Risk Analysis
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <AIAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          userRole={user?.role}
        />
      )}

    </div>
  );
};

export default LiveFeed;
