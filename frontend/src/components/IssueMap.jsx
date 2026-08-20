import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';
import { AlertTriangle, Clock, MapPin, Eye, Maximize2, Compass, Layers, AlertCircle, RefreshCw, Info } from 'lucide-react';

const BENGALURU_COORDS = [12.9716, 77.5946];

// Custom priority marker generator using Leaflet DivIcon
const createCustomMarker = (priority) => {
  const p = (priority || 'MEDIUM').toUpperCase();
  const colors = {
    CRITICAL: { bg: '#ef4444', border: '#b91c1c', ring: 'rgba(239, 68, 68, 0.4)' },
    HIGH: { bg: '#f97316', border: '#c2410c', ring: 'rgba(249, 115, 22, 0.3)' },
    MEDIUM: { bg: '#f59e0b', border: '#b45309', ring: 'rgba(245, 158, 11, 0.3)' },
    LOW: { bg: '#10b981', border: '#047857', ring: 'rgba(16, 185, 129, 0.3)' },
  }[p] || { bg: '#3b82f6', border: '#1d4ed8', ring: 'rgba(59, 130, 246, 0.3)' };

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
    ">
      ${p === 'CRITICAL' ? `<div style="
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: ${colors.ring};
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>` : ''}
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: ${colors.bg};
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Map controller for programmatic resize, recentering, and bounds fitting
const MapController = ({ center, zoom, boundsToFit, triggerFitKey }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size on mount to ensure tiles render immediately
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12, { animate: true });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (boundsToFit && boundsToFit.length > 0) {
      try {
        const latLngBounds = L.latLngBounds(boundsToFit);
        if (latLngBounds.isValid()) {
          map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 15, animate: true });
        }
      } catch (err) {
        console.warn("Bounds fitting warning:", err);
      }
    }
  }, [triggerFitKey, map]);

  return null;
};

const IssueMap = ({
  reports = [],
  onSelectReport,
  height = "550px",
  minHeight = "500px",
  selectedLocation = null,
  loading = false,
  error = null
}) => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activePriority, setActivePriority] = useState('ALL');
  const [fitTrigger, setFitTrigger] = useState(0);

  const categories = ['ALL', 'Pothole', 'Water Leakage', 'Garbage Accumulation', 'Streetlight Failure', 'Drainage', 'Road Damage'];
  const priorities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredReports = reports.filter(r => {
    const matchCat = activeCategory === 'ALL' || r.category === activeCategory;
    const matchPrio = activePriority === 'ALL' || r.priority === activePriority;
    return matchCat && matchPrio;
  });

  const markerCoords = filteredReports
    .map(r => [Number(r.latitude) || 12.9716, Number(r.longitude) || 77.5946])
    .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon) && lat !== 0 && lon !== 0);

  const handleFitAll = () => {
    if (markerCoords.length > 0) {
      setFitTrigger(prev => prev + 1);
    }
  };

  const isFullHeight = height === '100%';

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white flex flex-col ${
        isFullHeight ? 'h-full' : ''
      }`}
      style={{ height: isFullHeight ? '100%' : height, minHeight: minHeight }}
    >
      {/* Map Filter Controls Bar */}
      <div className="p-3 bg-white/95 backdrop-blur border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs z-10 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[11px]">Priority:</span>
          {priorities.map(prio => (
            <button
              key={prio}
              onClick={() => setActivePriority(prio)}
              className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                activePriority === prio
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {prio}
            </button>
          ))}

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <button
              onClick={handleFitAll}
              title="Fit all visible markers"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
            >
              <Maximize2 className="w-3 h-3 text-slate-500" />
              <span>Fit Markers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas Wrapper */}
      <div className="relative flex-1 w-full h-full min-h-[350px]">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg border border-slate-200 text-xs font-semibold text-slate-700">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Loading Bengaluru Issue Markers...</span>
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State Overlay if 0 reports */}
        {!loading && reports.length === 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>No reported urban issues found. Displaying Bengaluru base map.</span>
          </div>
        )}

        {/* Leaflet MapContainer */}
        <MapContainer
          center={BENGALURU_COORDS}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
          style={{ width: '100%', height: '100%', minHeight: '350px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapController
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lon] : BENGALURU_COORDS}
            zoom={selectedLocation ? 14 : 12}
            boundsToFit={markerCoords}
            triggerFitKey={fitTrigger}
          />

          {filteredReports.map(report => {
            const lat = Number(report.latitude) || 12.9716;
            const lon = Number(report.longitude) || 77.5946;
            return (
              <Marker
                key={report.report_id}
                position={[lat, lon]}
                icon={createCustomMarker(report.priority)}
              >
                <Popup className="urbanpulse-map-popup">
                  <div className="p-1 min-w-[250px] text-slate-800">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] font-bold text-blue-600">{report.report_id}</span>
                      <PriorityBadge priority={report.priority} showDot={false} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug mb-1">{report.title}</h4>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{report.location_name}</span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 mb-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Category:</span>
                        <span className="font-semibold text-slate-800">{report.category}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Severity:</span>
                        <span className="font-bold text-slate-800">{report.current_severity} / 5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Escalation Probability:</span>
                        <span className="font-bold text-red-600">{report.escalation_probability}%</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500">Status:</span>
                        <StatusBadge status={report.status} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectReport && onSelectReport(report)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View AI Risk Analysis
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Floating Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-slate-200 shadow-md text-xs z-[1000] flex items-center gap-3">
        <span className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Legend:</span>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Critical</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> High</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium</div>
        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low</div>
      </div>
    </div>
  );
};

export default IssueMap;