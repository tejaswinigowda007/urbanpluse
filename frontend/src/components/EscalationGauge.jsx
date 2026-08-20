import React from 'react';

const EscalationGauge = ({ probability, size = "md", showLabel = true }) => {
  const prob = Math.min(100, Math.max(0, Number(probability) || 0));
  
  let colorClass = "bg-emerald-500";
  let textColor = "text-emerald-700";
  let label = "Low Risk";
  
  if (prob >= 80) {
    colorClass = "bg-red-500";
    textColor = "text-red-700";
    label = "Critical Risk";
  } else if (prob >= 55) {
    colorClass = "bg-orange-500";
    textColor = "text-orange-700";
    label = "High Risk";
  } else if (prob >= 35) {
    colorClass = "bg-amber-500";
    textColor = "text-amber-700";
    label = "Medium Risk";
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="font-semibold text-slate-700">Escalation Probability</span>
          <span className={`font-bold ${textColor}`}>{prob.toFixed(1)}% ({label})</span>
        </div>
      )}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${prob}%` }}
        />
      </div>
    </div>
  );
};

export default EscalationGauge;
