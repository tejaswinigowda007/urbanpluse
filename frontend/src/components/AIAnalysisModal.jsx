import React from 'react';
import { X, AlertTriangle, ShieldCheck, Clock, Zap, MapPin, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import EscalationGauge from './EscalationGauge';

const AIAnalysisModal = ({ report, onClose, onUpdateStatus, userRole }) => {
  if (!report) return null;

  const isAuthority = userRole === 'AUTHORITY';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 p-5 text-white flex items-start justify-between border-b border-navy-700">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {report.report_id}
              </span>
              <PriorityBadge priority={report.priority} />
              <StatusBadge status={report.status} />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-white">{report.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>{report.location_name} (Lat: {report.latitude}, Lon: {report.longitude})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Key Escalation Metric Bar */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900">AI Escalation Risk Forecast</span>
              </div>
              <span className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                Model: Random Forest Classifier
              </span>
            </div>
            <EscalationGauge probability={report.escalation_probability} />
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-500 block">Severity Rating</span>
                <span className="font-bold text-slate-800">{report.current_severity} / 5</span>
              </div>
              <div>
                <span className="text-slate-500 block">Days Unresolved</span>
                <span className="font-bold text-slate-800">{report.days_unresolved} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Escalation</span>
                <span className="font-bold text-orange-600">
                  {report.priority === 'CRITICAL' ? '1 - 2 Days (Urgent)' : report.priority === 'HIGH' ? '3 - 5 Days' : '7+ Days'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Predicted Priority</span>
                <span className="font-bold text-slate-800">{report.priority}</span>
              </div>
            </div>
          </div>

          {/* Extracted Risk Factors */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Identified Escalation Risk Factors
            </h4>
            <div className="space-y-1.5">
              {report.risk_factors && report.risk_factors.length > 0 ? (
                report.risk_factors.map((factor, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-700">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>{factor}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No critical compounding factors flagged.</p>
              )}
            </div>
          </div>

          {/* Recommended Municipal Action */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              AI Recommended Municipal Action
            </h4>
            <p className="text-xs font-medium text-amber-900 leading-relaxed">
              {report.recommended_action || "Schedule routine inspection according to standard zonal queue."}
            </p>
          </div>

          {/* Issue Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Issue Description</h4>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Authority Workflow Controls */}
          {isAuthority && onUpdateStatus && (
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Update Resolution Status</h4>
              <div className="flex flex-wrap gap-2">
                {['OPEN', 'ASSIGNED', 'IN PROGRESS', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    disabled={report.status === st}
                    onClick={() => onUpdateStatus(report.report_id, st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      report.status === st
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : st === 'RESOLVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
                  >
                    Mark as {st}
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AIAnalysisModal;
