import React, { useEffect, useState } from 'react';
import { mlApi } from '../services/api';
import KPICard from '../components/KPICard';
import {
  BrainCircuit,
  BarChart3,
  Sparkles,
  CheckCircle,
  Activity,
  Layers,
  Database,
  Sliders,
  Info,
  RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const MLModelPerformance = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await mlApi.getPerformance();
      setMetrics(res.data);
    } catch (err) {
      console.error("Failed to load ML metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading ML evaluation metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-12 text-center text-xs text-red-500">Failed to load ML performance data.</div>;
  }

  const classLabels = metrics.class_labels || ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const cm = metrics.confusion_matrix || [];
  const featImp = metrics.feature_importances || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
            <span>Academic ML Validation Suite</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Machine Learning Model Performance
          </h2>
          <p className="text-xs text-slate-500">
            Empirical evaluation of {metrics.model_name} evaluated on 80/20 train/test split of {metrics.dataset_name}
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-evaluate
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          title="Overall Accuracy"
          value={`${(metrics.accuracy * 100).toFixed(2)}%`}
          subtitle="Correct classifications"
          icon={CheckCircle}
          color="emerald"
        />
        <KPICard
          title="Weighted Precision"
          value={`${(metrics.precision * 100).toFixed(2)}%`}
          subtitle="Positive predictive value"
          icon={Activity}
          color="blue"
        />
        <KPICard
          title="Weighted Recall"
          value={`${(metrics.recall * 100).toFixed(2)}%`}
          subtitle="True positive rate"
          icon={Layers}
          color="purple"
        />
        <KPICard
          title="Weighted F1-Score"
          value={`${(metrics.f1_score * 100).toFixed(2)}%`}
          subtitle="Harmonic mean"
          icon={Sparkles}
          color="orange"
        />
      </div>

      {/* Dataset & Architecture Info Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Dataset Distribution</span>
            <p className="font-extrabold text-slate-900 text-sm">{metrics.total_samples} Total Prototype Samples</p>
            <span className="text-slate-500">Train: {metrics.training_samples} (80%) | Test: {metrics.testing_samples} (20%)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Algorithm Selected</span>
            <p className="font-extrabold text-slate-900 text-sm">Random Forest Classifier</p>
            <span className="text-slate-500">n_estimators=120, max_depth=12, balanced</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">Macro-Averaged F1</span>
            <p className="font-extrabold text-slate-900 text-sm">{(metrics.f1_macro * 100).toFixed(2)}%</p>
            <span className="text-slate-500">Precision: {(metrics.precision_macro * 100).toFixed(2)}% | Recall: {(metrics.recall_macro * 100).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Feature Importance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Confusion Matrix Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">4x4 Multiclass Confusion Matrix</h3>
            <p className="text-xs text-slate-500">Evaluated on test subset ({metrics.testing_samples} samples)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border border-slate-100 bg-slate-50 text-[10px] text-slate-400 uppercase font-bold">
                    Actual \ Pred
                  </th>
                  {classLabels.map(l => (
                    <th key={l} className="p-2 border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-700">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.map((row, i) => (
                  <tr key={classLabels[i]}>
                    <td className="p-2 border border-slate-100 bg-slate-50 font-bold text-slate-700 text-left">
                      {classLabels[i]}
                    </td>
                    {row.map((val, j) => {
                      const isDiagonal = i === j;
                      const intensity = isDiagonal ? Math.min(val / 80, 1) : Math.min(val / 30, 0.5);
                      const bgColor = isDiagonal
                        ? `rgba(37, 99, 235, ${0.15 + intensity * 0.4})`
                        : val > 0 ? `rgba(239, 68, 68, ${0.08 + intensity * 0.2})` : 'transparent';
                      
                      return (
                        <td
                          key={j}
                          style={{ backgroundColor: bgColor }}
                          className={`p-3 border border-slate-100 font-mono font-bold ${
                            isDiagonal ? 'text-blue-900' : val > 0 ? 'text-red-700' : 'text-slate-300'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Diagonal cells represent correct class classifications by the trained model.
          </p>
        </div>

        {/* Feature Importance Bar Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Random Forest Feature Importance Rankings</h3>
            <p className="text-xs text-slate-500">Gini-impurity contribution ranking per micro-issue attribute</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={featImp.slice(0, 7)}
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Importance']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="percentage" name="Importance %" fill="#2563eb" radius={[0, 4, 4, 0]}>
                  {featImp.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#2563eb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Per-Class Breakdown Table */}
      {metrics.per_class_metrics && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Per-Class Precision, Recall & F1-Score Breakdown</h3>
            <p className="text-xs text-slate-500">Fine-grained validation across all 4 priority classes</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Class Label</th>
                  <th className="py-2.5 px-4 font-bold">Precision</th>
                  <th className="py-2.5 px-4 font-bold">Recall</th>
                  <th className="py-2.5 px-4 font-bold">F1-Score</th>
                  <th className="py-2.5 px-4 font-bold text-right">Test Support Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(metrics.per_class_metrics).map(([cls, data]) => (
                  <tr key={cls} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{cls}</td>
                    <td className="py-3 px-4 font-mono">{(data.precision * 100).toFixed(2)}%</td>
                    <td className="py-3 px-4 font-mono">{(data.recall * 100).toFixed(2)}%</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{(data.f1_score * 100).toFixed(2)}%</td>
                    <td className="py-3 px-4 font-mono text-right text-slate-500">{data.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default MLModelPerformance;
