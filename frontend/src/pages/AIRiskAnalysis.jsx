import React, { useEffect, useState } from 'react';
import { reportsApi, predictApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import EscalationGauge from '../components/EscalationGauge';
import AIAnalysisModal from '../components/AIAnalysisModal';
import { useAuth } from '../context/AuthContext';
import {
  BrainCircuit,
  AlertTriangle,
  Zap,
  Clock,
  MapPin,
  Sparkles,
  Search,
  Filter,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';

const AIRiskAnalysis = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);

  // Live sandbox tester state
  const [showSandbox, setShowSandbox] = useState(false);
  const [sandboxType, setSandboxType] = useState('Pothole');
  const [sandboxSeverity, setSandboxSeverity] = useState(4);
  const [sandboxDays, setSandboxDays] = useState(6);
  const [sandboxNearby, setSandboxNearby] = useState(8);
  const [sandboxTraffic, setSandboxTraffic] = useState('High');
  const [sandboxWeather, setSandboxWeather] = useState('Heavy Rain');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getAll({ limit: 100 });
      setReports(res.data);
    } catch (err) {
      console.error("Failed to load reports for AI risk analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleTestSandbox = async () => {
    setSandboxLoading(true);
    try {
      const res = await predictApi.predict({
        issue_type: sandboxType,
        current_severity: parseInt(sandboxSeverity),
        days_unresolved: parseInt(sandboxDays),
        nearby_reports: parseInt(sandboxNearby),
        frequency_last_7_days: 6,
        frequency_change_percentage: 35.0,
        traffic_level: sandboxTraffic,
        population_density: 'High',
        location_risk_score: 8,
        historical_escalations: 3,
        weather_factor: sandboxWeather
      });
      setSandboxResult(res.data);
    } catch (err) {
      alert("Prediction test failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setSandboxLoading(false);
    }
  };

  const filtered = reports.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
                        r.location_name.toLowerCase().includes(search.toLowerCase()) ||
                        r.category.toLowerCase().includes(search.toLowerCase()) ||
                        r.report_id.toLowerCase().includes(search.toLowerCase());
    const matchPrio = priorityFilter === 'ALL' || r.priority === priorityFilter;
    return matchSearch && matchPrio;
  }).sort((a, b) => b.escalation_probability - a.escalation_probability);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
            <span>Multi-Factor AI Inference Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">AI Risk & Escalation Predictor</h2>
          <p className="text-xs text-slate-500">
            Ranked municipal risk index evaluated via Scikit-learn Random Forest Classifier
          </p>
        </div>

        <button
          onClick={() => {
            setShowSandbox(!showSandbox);
            if (!sandboxResult) handleTestSandbox();
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          {showSandbox ? 'Hide ML Feature Sandbox' : 'Open Live ML Prediction Sandbox'}
        </button>
      </div>

      {/* Live ML Feature Sandbox (Interactive Tester) */}
      {showSandbox && (
        <div className="bg-gradient-to-br from-navy-900 to-slate-900 text-white rounded-2xl p-6 border border-navy-700 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-navy-700 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-base">Interactive ML Inference Sandbox (POST /api/predict)</h3>
            </div>
            <span className="text-xs font-mono text-blue-300">Model: Random Forest Classifier</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Issue Type</label>
              <select
                value={sandboxType}
                onChange={(e) => setSandboxType(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-white"
              >
                {['Pothole', 'Water Leakage', 'Garbage Accumulation', 'Streetlight Failure', 'Drainage', 'Road Damage'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Severity: {sandboxSeverity}/5</label>
              <input
                type="range" min="1" max="5" step="1"
                value={sandboxSeverity}
                onChange={(e) => setSandboxSeverity(parseInt(e.target.value))}
                className="w-full h-2 bg-navy-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Days Unresolved</label>
              <input
                type="number" min="0" max="60"
                value={sandboxDays}
                onChange={(e) => setSandboxDays(parseInt(e.target.value) || 0)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Nearby Reports</label>
              <input
                type="number" min="0" max="30"
                value={sandboxNearby}
                onChange={(e) => setSandboxNearby(parseInt(e.target.value) || 0)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Traffic Level</label>
              <select
                value={sandboxTraffic}
                onChange={(e) => setSandboxTraffic(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-white"
              >
                {['Low', 'Medium', 'High', 'Very High'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Weather Factor</label>
              <select
                value={sandboxWeather}
                onChange={(e) => setSandboxWeather(e.target.value)}
                className="w-full bg-navy-800 border border-navy-700 rounded-lg p-2 text-white"
              >
                {['Clear', 'Moderate Rain', 'Heavy Rain', 'Storm'].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleTestSandbox}
              disabled={sandboxLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              {sandboxLoading ? 'Predicting...' : 'Execute Live Prediction'}
            </button>

            {sandboxResult && (
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 mr-1.5">Escalation Probability:</span>
                  <span className="font-extrabold text-orange-400 text-sm">{sandboxResult.escalation_probability}%</span>
                </div>
                <div>
                  <span className="text-slate-400 mr-1.5">Priority:</span>
                  <PriorityBadge priority={sandboxResult.priority} />
                </div>
                <div>
                  <span className="text-slate-400 mr-1.5">Est. Escalation:</span>
                  <span className="font-bold text-white">{sandboxResult.estimated_escalation_days} Days</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, title, location, category..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(prio => (
            <button
              key={prio}
              onClick={() => setPriorityFilter(prio)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                priorityFilter === prio
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* AI Risk Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading AI risk evaluations...</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
          No reports match filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(report => (
            <div
              key={report.report_id}
              className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between ${
                report.priority === 'CRITICAL' ? 'border-red-200 ring-1 ring-red-400/30' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-[11px] font-bold text-blue-600">{report.report_id}</span>
                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{report.title}</h3>
                  </div>
                  <PriorityBadge priority={report.priority} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{report.location_name}</span>
                </div>

                {/* Escalation Gauge */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                  <EscalationGauge probability={report.escalation_probability} />
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <div>Severity: <b>{report.current_severity}/5</b></div>
                    <div>Unresolved: <b>{report.days_unresolved}d</b></div>
                    <div>Status: <b>{report.status}</b></div>
                  </div>
                </div>

                {/* Compounding Risk Factors snippet */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Factors:</span>
                  {report.risk_factors?.slice(0, 2).map((f, i) => (
                    <div key={i} className="text-xs text-slate-600 flex items-start gap-1">
                      <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Action & CTA */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/60 text-xs text-amber-900">
                  <span className="font-bold text-[10px] text-amber-800 uppercase block">Recommended Action:</span>
                  <p className="line-clamp-2 leading-relaxed mt-0.5">{report.recommended_action}</p>
                </div>

                <button
                  onClick={() => setSelectedReport(report)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect Full Machine Learning Diagnostic
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

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

export default AIRiskAnalysis;
