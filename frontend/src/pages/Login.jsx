import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'AUTHORITY') {
        navigate('/authority-dashboard');
      } else {
        navigate('/citizen-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);
    try {
      const user = await login(demoEmail, demoPassword);
      if (user.role === 'AUTHORITY') {
        navigate('/authority-dashboard');
      } else {
        navigate('/citizen-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/20 font-extrabold text-2xl">
            UP
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          UrbanPulse
        </h2>
        <p className="mt-1 text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
          AI-Based Micro-Issue Trend & Escalation Predictor
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-200 sm:px-10">
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@urbanpulse.demo"
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              1-Click Demo Accounts (Fast Evaluation)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen@urbanpulse.demo', 'DemoPass123!')}
                className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 transition-colors text-left"
              >
                <User className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="block leading-tight">Demo Citizen</span>
                  <span className="text-[10px] text-blue-500 font-normal">Report & Track</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('authority@urbanpulse.demo', 'DemoPass123!')}
                className="flex items-center justify-center gap-2 p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 transition-colors text-left"
              >
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <div>
                  <span className="block leading-tight">Demo Authority</span>
                  <span className="text-[10px] text-purple-500 font-normal">Command Center</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <span className="text-xs text-slate-500">Need a new citizen account? </span>
            <Link to="/register" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Register here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
