import React from 'react';

const StatusBadge = ({ status, className = "" }) => {
  const s = (status || 'OPEN').toUpperCase();
  
  const styles = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
    'IN PROGRESS': 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[s] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles} ${className}`}>
      {s}
    </span>
  );
};

export default StatusBadge;
