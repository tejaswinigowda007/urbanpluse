import React from 'react';

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue', alert = false }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${alert ? 'ring-2 ring-red-500/20' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span className={`font-semibold ${trend.startsWith('+') ? 'text-orange-600' : 'text-emerald-600'}`}>
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default KPICard;
