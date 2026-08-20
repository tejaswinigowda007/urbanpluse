import React, { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import AIAnalysisModal from '../components/AIAnalysisModal';
import StatusTimeline from '../components/StatusTimeline';
import { useAuth } from '../context/AuthContext';
import {
  SlidersHorizontal,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  History,
  MapPin,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const IssueManagement = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [timelineReport, setTimelineReport] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  // Status Change Dialog State
  const [statusModalReport, setStatusModalReport] = useState(null);
  const [targetStatus, setTargetStatus] = useState('IN PROGRESS');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getAll({ limit: 200 });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load reports for management:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenStatusModal = (report, defaultNext) => {
    setStatusModalReport(report);
    setTargetStatus(defaultNext);
    setStatusNotes('');
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalReport) return;
    setUpdating(true);
    try {
      await reportsApi.updateStatus(statusModalReport.report_id, {
        status: targetStatus,
        notes: statusNotes || `Status updated to ${targetStatus} by ${user?.name || 'Authority'}`
      });
      setStatusModalReport(null);
      await fetchReports();
      if (selectedReport && selectedReport.report_id === statusModalReport.report_id) {
        setSelectedReport({ ...selectedReport, status: targetStatus });
      }
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setUpdating(false);
    }
  };

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
    const matchPriority = priorityFilter === 'ALL' || r.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2 border border-purple-200">
            <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
            <span>Smart City Municipal Workflow Console</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Authority Issue Management Portal
          </h2>
          <p className="text-xs text-slate-500">
            Filter, assign, update resolution statuses, and log immutable audit histories across all urban micro-issues
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Database
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, title, location..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="font-bold text-slate-400 uppercase text-[10px]">Status:</span>
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

        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="font-bold text-slate-400 uppercase text-[10px]">Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(prio => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-2.5 py-0.5 rounded font-semibold text-[11px] shrink-0 ${
                priorityFilter === prio
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading issues database...</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-xs text-slate-500">No issues found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Report ID</th>
                  <th className="py-3.5 px-4 font-bold">Issue Title & Category</th>
                  <th className="py-3.5 px-4 font-bold">Location</th>
                  <th className="py-3.5 px-4 font-bold">Priority & Risk</th>
                  <th className="py-3.5 px-4 font-bold">Current Status</th>
                  <th className="py-3.5 px-4 font-bold">Workflow Actions</th>
                  <th className="py-3.5 px-4 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(report => (
                  <tr key={report.report_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {report.report_id}
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <p className="font-bold text-slate-900 truncate">{report.title}</p>
                      <span className="text-[11px] text-slate-500">{report.category}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{report.location_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <PriorityBadge priority={report.priority} />
                        <span className="font-bold text-slate-700">{report.escalation_probability}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={report.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {report.status === 'OPEN' && (
                          <button
                            onClick={() => handleOpenStatusModal(report, 'IN PROGRESS')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors"
                          >
                            Dispatch Crew
                          </button>
                        )}
                        {report.status === 'IN PROGRESS' && (
                          <button
                            onClick={() => handleOpenStatusModal(report, 'RESOLVED')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {report.status === 'RESOLVED' && (
                          <button
                            onClick={() => handleOpenStatusModal(report, 'OPEN')}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md text-[10px] font-bold transition-colors"
                          >
                            Reopen
                          </button>
                        )}
                        {report.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleOpenStatusModal(report, 'IN PROGRESS')}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[10px] font-bold shadow-xs transition-colors"
                          >
                            Start Work
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
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
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {statusModalReport && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Update Resolution Status</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{statusModalReport.report_id} &bull; {statusModalReport.title}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">Target Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="OPEN">OPEN (Under review)</option>
                  <option value="ASSIGNED">ASSIGNED (Zonal engineer designated)</option>
                  <option value="IN PROGRESS">IN PROGRESS (Field team dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Physical repair complete)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold uppercase text-[10px] mb-1">Audit Notes / Reason</label>
                <textarea
                  rows="3"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g. Dispatched asphalt repair truck to Bannerghatta Road, team on site..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setStatusModalReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStatusChange}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
              >
                {updating ? 'Updating...' : 'Confirm Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis Modal */}
      {selectedReport && (
        <AIAnalysisModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={(id, st) => handleOpenStatusModal(selectedReport, st)}
          userRole={user?.role}
        />
      )}

      {/* Timeline Modal */}
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

export default IssueManagement;
