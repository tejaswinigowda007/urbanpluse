import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportsApi } from '../services/api';
import {
  AlertTriangle,
  MapPin,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  Info,
  ChevronRight
} from 'lucide-react';
import PriorityBadge from '../components/PriorityBadge';
import EscalationGauge from '../components/EscalationGauge';

const BENGALURU_HUBS = [
  { name: 'Bannerghatta Road', lat: 12.8988, lon: 77.5998, defaultCat: 'Pothole' },
  { name: 'BTM Layout', lat: 12.9166, lon: 77.6101, defaultCat: 'Garbage Accumulation' },
  { name: 'JP Nagar', lat: 12.9063, lon: 77.5857, defaultCat: 'Water Leakage' },
  { name: 'Jayanagar', lat: 12.9308, lon: 77.5838, defaultCat: 'Streetlight Failure' },
  { name: 'Electronic City', lat: 12.8452, lon: 77.6602, defaultCat: 'Road Damage' },
  { name: 'Koramangala', lat: 12.9352, lon: 77.6245, defaultCat: 'Drainage' },
  { name: 'HSR Layout', lat: 12.9121, lon: 77.6446, defaultCat: 'Pothole' },
  { name: 'Indiranagar', lat: 12.9784, lon: 77.6408, defaultCat: 'Garbage Accumulation' },
  { name: 'Whitefield', lat: 12.9698, lon: 77.7499, defaultCat: 'Road Damage' },
];

const CATEGORIES = [
  'Pothole',
  'Water Leakage',
  'Garbage Accumulation',
  'Streetlight Failure',
  'Drainage',
  'Road Damage',
  'Other'
];

const SEVERITY_DESCRIPTIONS = {
  1: 'Minor cosmetic defect; no immediate disruption to traffic or public safety.',
  2: 'Moderate issue; causes slight pedestrian or vehicular slowdown.',
  3: 'Noticeable disruption; potential to worsen rapidly if left unmanaged.',
  4: 'High severity; causing clear vehicular damage or sanitation hazards.',
  5: 'Critical hazard; immediate risk of severe accidents, structural damage, or localized flooding.'
};

const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [locationName, setLocationName] = useState('Bannerghatta Road');
  const [latitude, setLatitude] = useState(12.8988);
  const [longitude, setLongitude] = useState(77.5998);
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [daysUnresolved, setDaysUnresolved] = useState(2);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState('');

  const handleSelectHub = (hub) => {
    setLocationName(hub.name);
    setLatitude(hub.lat);
    setLongitude(hub.lon);
    if (!title || CATEGORIES.some(c => title.startsWith(c))) {
      setTitle(`${category} near ${hub.name}`);
    }
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    if (!title || CATEGORIES.some(c => title.startsWith(c))) {
      setTitle(`${newCat} near ${locationName}`);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        try {
          const upRes = await reportsApi.uploadImage(formData);
          imageUrl = upRes.data.image_url;
        } catch (imgErr) {
          console.warn("Image upload failed, proceeding with report submission:", imgErr);
        }
      }

      const payload = {
        title: title || `${category} near ${locationName}`,
        category,
        location_name: locationName,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description,
        current_severity: parseInt(severity),
        days_unresolved: parseInt(daysUnresolved),
        image_url: imageUrl,
        traffic_level: 'High',
        weather_factor: 'Clear'
      };

      const res = await reportsApi.create(payload);
      setPredictionResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report. Please check input fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Real-time AI Prediction Pipeline</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Report an Urban Micro-Issue
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Submit details regarding potholes, water leaks, garbage, or road damage. UrbanPulse will run Random Forest ML to predict escalation risk and notify municipal authorities.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Report Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        
        {/* Quick Bengaluru Location Presets */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Select Bengaluru Location Hub (Quick Presets)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {BENGALURU_HUBS.map(hub => (
              <button
                type="button"
                key={hub.name}
                onClick={() => handleSelectHub(hub)}
                className={`p-2 rounded-xl text-left border text-xs transition-all ${
                  locationName === hub.name
                    ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="block truncate">{hub.name}</span>
                <span className={`text-[10px] block truncate ${locationName === hub.name ? 'text-blue-100' : 'text-slate-400'}`}>
                  Lat {hub.lat.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Location Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Location Name / Landmark
            </label>
            <input
              type="text"
              required
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Category & Title */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Report Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Pothole near Vega City Mall"
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Severity Slider (1-5) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Current Severity Level: <span className="text-blue-600 font-extrabold text-sm">{severity} / 5</span>
            </label>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
              severity >= 4 ? 'bg-red-100 text-red-700' : severity >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {severity === 5 ? 'Critical Hazard' : severity === 4 ? 'High Severity' : severity === 3 ? 'Moderate' : 'Low / Minor'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <p className="text-[11px] text-slate-500 mt-1 italic">
            {SEVERITY_DESCRIPTIONS[severity]}
          </p>
        </div>

        {/* Days Issue Has Existed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              4. Days Issue Has Existed (Unresolved)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              required
              value={daysUnresolved}
              onChange={(e) => setDaysUnresolved(parseInt(e.target.value) || 0)}
              className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-1">Duration directly compounds ML escalation probability.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Optional Photo Upload
            </label>
            <div className="mt-1 flex items-center gap-3">
              <label className="cursor-pointer flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 transition-colors">
                <Camera className="w-4 h-4 text-slate-500" />
                <span>{imageFile ? 'Change Photo' : 'Upload Image'}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
              )}
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            5. Issue Description & Context
          </label>
          <textarea
            rows="3"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the physical condition, traffic disruption, water accumulation, or danger to pedestrians..."
            className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white leading-relaxed"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            {submitting ? 'Running ML Inference & Submitting...' : 'Submit Report & Predict Escalation'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>

      {/* INSTANT AI PREDICTION FEEDBACK MODAL UPON SUBMISSION */}
      {predictionResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95">
            
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Issue Registered & Analyzed</h3>
                  <p className="text-xs text-blue-200 font-mono">ID: {predictionResult.report_id}</p>
                </div>
              </div>
              <PriorityBadge priority={predictionResult.priority} />
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <EscalationGauge probability={predictionResult.escalation_probability} />
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Priority Level</span>
                    <span className="font-bold">{predictionResult.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Estimated Escalation</span>
                    <span className="font-bold text-orange-600">
                      {predictionResult.priority === 'CRITICAL' ? '1 - 2 Days' : '3 - 5 Days'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Initial Status</span>
                    <span className="font-bold text-blue-600">OPEN</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Model Identified Risk Factors
                </h4>
                <div className="space-y-1">
                  {predictionResult.risk_factors?.map((f, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50 text-slate-700">
                      <ChevronRight className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-amber-900">
                <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-800 mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Recommended Municipal Dispatch
                </span>
                <p className="leading-relaxed font-medium">
                  {predictionResult.recommended_action}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2.5">
              <button
                onClick={() => navigate('/live-feed')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-colors"
              >
                View in Live Feed
              </button>
              <button
                onClick={() => navigate('/my-reports')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm"
              >
                Go to My Reports &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportIssue;
