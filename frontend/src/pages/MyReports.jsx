import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import AIAnalysisModal from '../components/AIAnalysisModal';
import StatusTimeline from '../components/StatusTimeline';
import {
  FileText,
  Clock,
  MapPin,
  Eye,
  Search,
  PlusCircle,
  History,
  AlertTriangle
} from 'lucide-react';

const MyReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [timelineReport, setTimelineReport] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getAll({ user_id: user?.id, limit: 100 });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load my reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const handleOpenTimeline = async (report) => {
    setTimelineReport(report);
    try {
      const res = await reportsApi.getHistory(report.report_id);
      setHistoryData(res.data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                        r.location_name.toLowerCase().includes(search.toLowerCase()) ||
                        r.category.toLowerCase().includes(search.toLowerCase()) ||
                        r.report_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Submitted Issue Reports</h2>
          <p className="text-xs text-slate-500">Track resolution milestones, audit trails, and machine learning risk ratings</p>
        </div>
        <button
          onClick={() => navigate('/report-issue')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report Another Issue
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, area..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading your reports...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">No matching reports found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Report ID</th>
                  <th className="py-3 px-4 font-bold">Issue Title & Category</th>
                  <th className="py-3 px-4 font-bold">Location</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">ML Risk & Priority</th>
                  <th className="py-3 px-4 font-bold">Reported Date</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(report => (
                  <tr key={report.report_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {report.report_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{report.title}</p>
                      <span className="text-[11px] text-slate-500">{report.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{report.location_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={report.priority} />
                        <span className="font-bold text-slate-700">{report.escalation_probability}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleOpenTimeline(report)}
                        title="Status Timeline"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors inline-flex items-center"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        View AI Analysis
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedReport && (
        <AIAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          userRole={user?.role}
        />
      )}

      {timelineReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Resolution History Audit Trail</h3>
                <p className="text-xs text-slate-500 font-mono">{timelineReport.report_id} &bull; {timelineReport.title}</p>
              </div>
              <button
                onClick={() => setTimelineReport(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <StatusTimeline history={historyData} />

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setTimelineReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyReports;
