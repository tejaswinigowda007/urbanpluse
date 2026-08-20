import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsApi, reportsApi, alertsApi } from '../services/api';
import KPICard from '../components/KPICard';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import IssueMap from '../components/IssueMap';
import AIAnalysisModal from '../components/AIAnalysisModal';
import {
  FileText,
  Clock,
  AlertOctagon,
  CheckCircle,
  MapPin,
  Activity,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Radio,
  Eye,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const AuthorityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trends, setTrends] = useState(null);
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchAuthorityData = async () => {
    try {
      setLoading(true);
      const [trendRes, repRes, alertRes] = await Promise.all([
        analyticsApi.getTrends(),
        reportsApi.getAll({ limit: 100 }),
        alertsApi.getAll({ is_read: false, limit: 10 })
      ]);
      setTrends(trendRes.data);
      setReports(repRes.data);
      setAlerts(alertRes.data);
    } catch (err) {
      console.error("Failed to load authority dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorityData();
    const interval = setInterval(fetchAuthorityData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await reportsApi.updateStatus(reportId, { status: newStatus, notes: `Updated from Authority Command Dashboard.` });
      await fetchAuthorityData();
      if (selectedReport && selectedReport.report_id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    }
  };

  const kpis = trends?.kpis || {
    total_reports: 0,
    open_issues: 0,
    critical_issues: 0,
    resolved_issues: 0,
    high_risk_areas_count: 0,
    average_escalation_risk: 0
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-xl border border-navy-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 border border-blue-400/30">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Smart City Municipal Command Center &bull; Bengaluru</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            UrbanPulse Authority Control Matrix
          </h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xl">
            Real-time proactive micro-issue detection, multi-factor machine learning escalation prediction, and automated dispatch workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/issue-management')}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
          >
            Manage All Issues
          </button>
          <button
            onClick={() => navigate('/ml-performance')}
            className="px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ML Model Metrics
          </button>
        </div>
      </div>

      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <KPICard
          title="Total Reports"
          value={kpis.total_reports}
          subtitle="All logged cases"
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Open Issues"
          value={kpis.open_issues}
          subtitle="Pending / Active"
          icon={Clock}
          color="amber"
        />
        <KPICard
          title="Critical Risk"
          value={kpis.critical_issues}
          subtitle="Escalation >= 80%"
          icon={AlertOctagon}
          color="red"
          alert={kpis.critical_issues > 0}
        />
        <KPICard
          title="Resolved"
          value={kpis.resolved_issues}
          subtitle="Closed issues"
          icon={CheckCircle}
          color="emerald"
        />
        <KPICard
          title="High-Risk Areas"
          value={kpis.high_risk_areas_count}
          subtitle="Clustered zones"
          icon={MapPin}
          color="purple"
        />
        <KPICard
          title="Avg Escalation"
          value={`${kpis.average_escalation_risk}%`}
          subtitle="Citywide risk mean"
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Critical Escalation Alerts Bar (if unread alerts exist) */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-red-900">
                {alerts.length} Critical Escalation Alert{alerts.length > 1 ? 's' : ''} Require Immediate Attention!
              </h4>
              <p className="text-xs text-red-700">
                {alerts[0].message}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 shadow-sm"
          >
            Review Alerts Drawer &rarr;
          </button>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 30-Day Volume Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">30-Day Issue Reporting & Escalation Trend</h3>
              <p className="text-xs text-slate-500">Calculated volume timeline across Bengaluru municipal zones</p>
            </div>
            <button
              onClick={() => navigate('/trends')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Detailed Analytics &rarr;
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.reports_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" name="Reports" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Issues by Category</h3>
            <p className="text-xs text-slate-500">Distribution of urban micro-issue types</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trends?.reports_by_category || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {(trends?.reports_by_category || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-slate-100">
            {(trends?.reports_by_category || []).slice(0, 4).map((c, i) => (
              <div key={c.category} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-slate-600 truncate">{c.category}: <b>{c.count}</b></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Geospatial Map & Live Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Geospatial Issue Intelligence Map</h3>
              <p className="text-xs text-slate-500">Live priority markers and escalation hotspots in Bengaluru</p>
            </div>
            <button
              onClick={() => navigate('/live-map')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Expand Full Map &rarr;
            </button>
          </div>

          <IssueMap reports={reports} onSelectReport={setSelectedReport} height="400px" />
        </div>

        {/* Emerging Trends & High Risk Clusters Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Emerging Clusters
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Top Hubs</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Zonal clusters with elevated recurrence</p>

            <div className="space-y-2.5 overflow-y-auto max-h-[340px]">
              {(trends?.reports_by_location || []).slice(0, 5).map(loc => (
                <div key={loc.location_name} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{loc.location_name}</span>
                    <PriorityBadge priority={loc.risk_score} />
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Dominant: <b>{loc.dominant_category}</b></span>
                    <span>Total: <b>{loc.total_reports}</b> ({loc.critical_count} Crit)</span>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Avg Escalation:</span>
                    <span className="font-bold text-red-600">{loc.avg_escalation_prob}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/trends')}
            className="w-full mt-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
          >
            View Trend Intelligence Suite &rarr;
          </button>
        </div>

      </div>

      {/* AI Analysis Modal */}
      {selectedReport && (
        <AIAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={handleUpdateStatus}
          userRole={user?.role}
        />
      )}

    </div>
  );
};

export default AuthorityDashboard;
