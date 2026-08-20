import React, { useEffect, useState } from 'react';
import { alertsApi, reportsApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import AIAnalysisModal from '../components/AIAnalysisModal';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  ShieldAlert,
  CheckCheck,
  Check,
  MapPin,
  Clock,
  AlertTriangle,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

const Alerts = () => {
  const { user, isAuthority } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = unreadOnly ? { is_read: false } : {};
      const res = await alertsApi.getAll(params);
      setAlerts(res.data);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [unreadOnly]);

  const handleMarkRead = async (alertId) => {
    try {
      await alertsApi.markRead(alertId);
      setAlerts(alerts.map(a => a.alert_id === alertId ? { ...a, is_read: true } : a));
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await alertsApi.markAllRead();
      setAlerts(alerts.map(a => ({ ...a, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleInspectReport = async (reportId) => {
    try {
      const res = await reportsApi.getById(reportId);
      setSelectedReport(res.data);
    } catch (err) {
      alert("Could not load report details.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold mb-2 border border-red-200">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            <span>Escalation Probability Threshold: &ge; 80% or Priority: CRITICAL</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Critical Escalation Alerts Matrix
          </h2>
          <p className="text-xs text-slate-500">
            Automated alerts dispatched by UrbanPulse ML for rapid municipal mitigation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              unreadOnly ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show All Alerts'}
          </button>
          {isAuthority && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading alerts stream...</div>
      ) : alerts.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold">No critical escalation alerts pending.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {alerts.map(alert => (
            <div
              key={alert.alert_id}
              className={`bg-white rounded-2xl p-5 border shadow-sm transition-all space-y-3 ${
                !alert.is_read ? 'border-red-300 ring-1 ring-red-400/30 bg-red-50/20' : 'border-slate-200 opacity-85'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${alert.is_read ? 'bg-slate-400' : 'bg-red-600 animate-pulse'}`}>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-[11px] font-bold text-blue-600 mr-2">{alert.alert_id}</span>
                    <span className="font-mono text-[11px] text-slate-400">({alert.report_id})</span>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{alert.message}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <PriorityBadge priority={alert.priority} />
                  <span className="font-bold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                    {alert.escalation_probability}% Risk
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="font-bold text-slate-500 block text-[10px] uppercase mb-1">Identified Compounding Factors:</span>
                  <ul className="space-y-0.5 text-slate-700">
                    {alert.risk_factors?.slice(0, 2).map((rf, i) => (
                      <li key={i} className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                        <span className="truncate">{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-amber-800 block text-[10px] uppercase mb-1">Urgent Recommended Action:</span>
                  <p className="text-amber-900 font-medium line-clamp-2 leading-relaxed">
                    {alert.recommended_action}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(alert.created_at).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {isAuthority && !alert.is_read && (
                    <button
                      onClick={() => handleMarkRead(alert.alert_id)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark as Read
                    </button>
                  )}
                  <button
                    onClick={() => handleInspectReport(alert.report_id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Incident
                  </button>
                </div>
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

export default Alerts;
