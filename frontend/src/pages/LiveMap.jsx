import React, { useEffect, useState } from 'react';
import { reportsApi } from '../services/api';
import IssueMap from '../components/IssueMap';
import AIAnalysisModal from '../components/AIAnalysisModal';
import { useAuth } from '../context/AuthContext';
import { MapPin, RefreshCw, Radio, Layers, AlertTriangle } from 'lucide-react';

const LiveMap = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchMapReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reportsApi.getAll({ limit: 200 });
      setReports(res.data || []);
    } catch (err) {
      console.error("Failed to load map reports:", err);
      setError("Unable to connect to backend server. Displaying offline Bengaluru map.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapReports();
  }, []);

  const criticalCount = reports.filter(r => r.priority === 'CRITICAL').length;
  const highCount = reports.filter(r => r.priority === 'HIGH').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4 flex flex-col h-[calc(100vh-80px)]">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Bengaluru Geospatial Intelligence Map
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive OpenStreetMap plotting micro-issue clusters with Random Forest priority classifications
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {reports.length > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{reports.length} Active Issues Plotted</span>
              {criticalCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full font-bold text-[10px]">
                  {criticalCount} Critical
                </span>
              )}
            </div>
          )}

          <button
            onClick={fetchMapReports}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Map
          </button>
        </div>
      </div>

      {/* Geospatial Map Canvas Container */}
      <div className="flex-1 w-full min-h-[550px] relative">
        <IssueMap
          reports={reports}
          onSelectReport={setSelectedReport}
          height="100%"
          minHeight="550px"
          loading={loading}
          error={error}
        />
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

export default LiveMap;