import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../services/api';
import PriorityBadge from '../components/PriorityBadge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  MapPin,
  Sparkles,
  Zap,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const TrendIntelligence = () => {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const res = await analyticsApi.getTrends();
        setTrends(res.data);
      } catch (err) {
        console.error("Failed to load trends:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading trend intelligence...</div>;
  }

  const cards = trends?.category_summary_cards || [];
  const insights = trends?.deterministic_insights || [];
  const locations = trends?.reports_by_location || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Calculated Municipal Time-Series Intelligence</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Trend Intelligence & Recurrence Analytics
        </h2>
        <p className="text-xs text-slate-500">
          Empirical aggregations and deterministic pattern detection calculated from live database reports
        </p>
      </div>

      {/* Category Trend Cards (Potholes, Water Leakage, Garbage, Streetlights, etc.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {cards.map(card => {
          const isUp = card.week_over_week_change > 0;
          return (
            <div key={card.category} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 truncate uppercase">{card.category}</p>
                <div className="flex items-baseline justify-between mt-1">
                  <h4 className="text-xl font-extrabold text-slate-900">{card.count}</h4>
                  <span className="text-[11px] text-slate-400">{card.percentage}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className={`flex items-center font-bold text-[11px] ${isUp ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  <span>{card.week_over_week_change > 0 ? `+${card.week_over_week_change}%` : `${card.week_over_week_change}%`}</span>
                </div>
                <PriorityBadge priority={card.risk_level} showDot={false} className="text-[10px] px-1.5 py-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deterministic Analytical Insights Formulated from Database Data */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <h3 className="font-extrabold text-base text-slate-900">Deterministic Analytical Insights</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100">
            Rule-Based Pattern Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {insights.map(ins => (
            <div key={ins.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-slate-900 text-sm leading-snug">{ins.headline}</span>
                <PriorityBadge priority={ins.escalation_risk} />
              </div>
              <p className="text-slate-600 leading-relaxed">{ins.description}</p>
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                <span className="font-bold text-amber-800 uppercase text-[10px] block mb-0.5">Municipal Action:</span>
                {ins.recommended_action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Reports Timeline */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">30-Day Citywide Issue Volume</h3>
            <p className="text-xs text-slate-500">Incident frequency aggregation over time</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.reports_over_time || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCountTrends" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" name="Reports" stroke="#2563eb" strokeWidth={2} fill="url(#colorCountTrends)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Initial Severity Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of initial severity ratings (1 to 5)</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.severity_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="severity" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" name="Incidents" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* High Risk Locations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
        <div>
          <h3 className="font-extrabold text-base text-slate-900">High-Risk Zonal Hubs & Recurrence Heatmap</h3>
          <p className="text-xs text-slate-500">Bengaluru municipal sectors ranked by escalation probability and critical count</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4 font-bold">Location Hub</th>
                <th className="py-3 px-4 font-bold">Dominant Category</th>
                <th className="py-3 px-4 font-bold">Total Cases</th>
                <th className="py-3 px-4 font-bold">Critical / High</th>
                <th className="py-3 px-4 font-bold">Average Escalation Risk</th>
                <th className="py-3 px-4 font-bold text-right">Zonal Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {locations.map(loc => (
                <tr key={loc.location_name} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{loc.location_name}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 font-medium">
                    {loc.dominant_category}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">
                    {loc.total_reports}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="text-red-600 font-bold">{loc.critical_count} Crit</span> / {loc.high_count} High
                  </td>
                  <td className="py-3.5 px-4 font-bold text-red-600 font-mono">
                    {loc.avg_escalation_prob}%
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <PriorityBadge priority={loc.risk_score} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TrendIntelligence;
