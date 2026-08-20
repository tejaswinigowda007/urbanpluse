import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi, analyticsApi } from '../services/api';
import KPICard from '../components/KPICard';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import EscalationGauge from '../components/EscalationGauge';
import IssueMap from '../components/IssueMap';
import AIAnalysisModal from '../components/AIAnalysisModal';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Eye,
  MapPin,
  Sparkles,
  Radio
} from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        reportsApi.getAll({ limit: 100 }),
        reportsApi.getAll({ user_id: user?.id, limit: 20 })
      ]);
      setReports(allRes.data);
      setMyReports(myRes.data);
    } catch (err) {
      console.error("Failed to load citizen dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const totalSubmitted = myReports.length;
  const openCount = myReports.filter(r => r.status !== 'RESOLVED').length;
  const resolvedCount = myReports.filter(r => r.status === 'RESOLVED').length;
  const highRiskCount = myReports.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Top Welcome Banner & CTA */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold mb-2 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Powered Urban Micro-Issue Predictor</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Citizen'}!
          </h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            Report local micro-issues before they escalate into major civic disruptions. Our machine learning engine automatically predicts escalation risk and alerts municipal authorities.
          </p>
        </div>
        <button
          onClick={() => navigate('/report-issue')}
          className="flex items-center gap-2 px-5 py-3 bg-brand-orange hover:bg-brand-orange-dark text-white rounded-xl font-bold text-sm shadow-md shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="My Total Reports"
          value={totalSubmitted}
          subtitle="Lifetime submissions"
          icon={FileText}
          color="blue"
        />
        <KPICard
          title="Open Reports"
          value={openCount}
          subtitle="Under municipal processing"
          icon={Clock}
          color="amber"
        />
        <KPICard
          title="Resolved Reports"
          value={resolvedCount}
          subtitle="Repairs verified"
          icon={CheckCircle2}
          color="emerald"
        />
        <KPICard
          title="High Escalation Risk"
          value={highRiskCount}
          subtitle="AI flagged critical / high"
          icon={AlertTriangle}
          color="red"
          alert={highRiskCount > 0}
        />
      </div>

      {/* Main Grid: My Recent Reports & Live Map Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* My Recent Reports Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">My Recent Submissions</h3>
              <p className="text-xs text-slate-500">Track real-time status and AI escalation probabilities</p>
            </div>
            <button
              onClick={() => navigate('/my-reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading reports...</div>
          ) : myReports.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">You have not submitted any issue reports yet.</p>
              <button
                onClick={() => navigate('/report-issue')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
              >
                Submit Your First Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2.5 font-bold">Issue / Category</th>
                    <th className="pb-2.5 font-bold">Location</th>
                    <th className="pb-2.5 font-bold">Status</th>
                    <th className="pb-2.5 font-bold">Escalation Risk</th>
                    <th className="pb-2.5 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myReports.slice(0, 5).map(report => (
                    <tr key={report.report_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-2">
                        <p className="font-bold text-slate-900">{report.title}</p>
                        <span className="text-[11px] text-slate-500">{report.category}</span>
                      </td>
                      <td className="py-3 px-2 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[120px]">{report.location_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="py-3 px-2 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={report.priority} showDot={false} />
                          <span className="font-bold text-slate-700">{report.escalation_probability}%</span>
                        </div>
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                        >
                          View Analysis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Map Preview Snapshot */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                Bengaluru Live Map
              </h3>
              <p className="text-xs text-slate-500">Real-time urban micro-issues</p>
            </div>
            <button
              onClick={() => navigate('/live-map')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Full Map
            </button>
          </div>

          <div className="flex-1 min-h-[300px]">
            <IssueMap reports={reports} onSelectReport={setSelectedReport} height="320px" />
          </div>
        </div>

      </div>

      {/* AI Analysis Modal */}
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

export default CitizenDashboard;
