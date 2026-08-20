import React from 'react';
import { CheckCircle, Clock, ArrowRight, UserCheck } from 'lucide-react';
import StatusBadge from './StatusBadge';

const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-400 italic">No status transition records found.</p>;
  }

  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((item, idx) => (
        <div key={item.id || idx} className="relative group">
          <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <StatusBadge status={item.new_status} />
                {item.old_status !== 'NONE' && (
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    (from {item.old_status})
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(item.changed_at).toLocaleString()}
              </span>
            </div>
            {item.notes && <p className="text-slate-600 mt-1">{item.notes}</p>}
            <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 flex items-center gap-1 text-[11px] text-slate-400">
              <UserCheck className="w-3 h-3 text-slate-400" />
              <span>Updated by: {item.changed_by_name || 'System'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusTimeline;
