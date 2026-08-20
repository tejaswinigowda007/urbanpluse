import React from 'react';

const PriorityBadge = ({ priority, showDot = true, className = "" }) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  
  const styles = {
    LOW: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'LOW'
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'MEDIUM'
    },
    HIGH: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      label: 'HIGH'
    },
    CRITICAL: {
      bg: 'bg-red-50 text-red-700 border-red-200 shadow-sm',
      dot: 'bg-red-500 animate-ping',
      label: 'CRITICAL'
    },
  }[p] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    label: p
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles.bg} ${className}`}>
      {showDot && (
        <span className="relative flex h-2 w-2">
          {p === 'CRITICAL' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`}></span>
        </span>
      )}
      {styles.label}
    </span>
  );
};

export default PriorityBadge;
