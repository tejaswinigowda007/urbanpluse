import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import ReportIssue from './pages/ReportIssue';
import MyReports from './pages/MyReports';
import LiveFeed from './pages/LiveFeed';
import LiveMap from './pages/LiveMap';
import AIRiskAnalysis from './pages/AIRiskAnalysis';
import TrendIntelligence from './pages/TrendIntelligence';
import IssueManagement from './pages/IssueManagement';
import MLModelPerformance from './pages/MLModelPerformance';
import Alerts from './pages/Alerts';

// Protected Route Component
const ProtectedRoute = ({ children, requireRole = null }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-xs">
        Initializing UrbanPulse System...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={user?.role === 'AUTHORITY' ? '/authority-dashboard' : '/citizen-dashboard'} replace />;
  }

  return children;
};

// Main Application Layout Wrapper
const AppLayout = ({ children, title }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar title={title} />
        <main className="flex-1 pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};

function AppRoutes() {
  const { isAuthenticated, isAuthority } = useAuth();

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated
            ? <Navigate to={isAuthority ? '/authority-dashboard' : '/citizen-dashboard'} replace />
            : <Login />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated
            ? <Navigate to="/citizen-dashboard" replace />
            : <Register />
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? (isAuthority ? '/authority-dashboard' : '/citizen-dashboard') : '/login'} replace />
        }
      />

      {/* Citizen Routes */}
      <Route
        path="/citizen-dashboard"
        element={
          <ProtectedRoute>
            <AppLayout title="Citizen Dashboard">
              <CitizenDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report-issue"
        element={
          <ProtectedRoute>
            <AppLayout title="Report Micro-Issue">
              <ReportIssue />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute>
            <AppLayout title="My Submitted Reports">
              <MyReports />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Common Shared Routes */}
      <Route
        path="/live-feed"
        element={
          <ProtectedRoute>
            <AppLayout title="Live Incident Feed">
              <LiveFeed />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/live-map"
        element={
          <ProtectedRoute>
            <AppLayout title="Geospatial Map">
              <LiveMap />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/trends"
        element={
          <ProtectedRoute>
            <AppLayout title="Trend Intelligence">
              <TrendIntelligence />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-risk-analysis"
        element={
          <ProtectedRoute>
            <AppLayout title="AI Risk Analysis">
              <AIRiskAnalysis />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AppLayout title="Critical Escalation Alerts">
              <Alerts />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Authority-Only Routes */}
      <Route
        path="/authority-dashboard"
        element={
          <ProtectedRoute requireRole="AUTHORITY">
            <AppLayout title="Smart City Command Center">
              <AuthorityDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/issue-management"
        element={
          <ProtectedRoute requireRole="AUTHORITY">
            <AppLayout title="Issue Management Console">
              <IssueManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ml-performance"
        element={
          <ProtectedRoute requireRole="AUTHORITY">
            <AppLayout title="ML Model Validation & Metrics">
              <MLModelPerformance />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
