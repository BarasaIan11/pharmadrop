import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deliveryAPI } from '../services/api';
import { Cross, Zap, ShieldCheck, ArrowRight, AlertCircle, Building } from 'lucide-react';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [username, setUsername] = useState('customer1');
  const [password, setPassword] = useState('password123');

  // Register state
  const [regData, setRegData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: 'CUSTOMER',
    pharmacy: ''
  });

  const [pharmacies, setPharmacies] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      const res = await deliveryAPI.getPharmacies();
      const data = res.data.results || res.data;
      if (Array.isArray(data)) setPharmacies(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username, password);
      redirectUser(user.role);
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Invalid credentials. Try customer1 / password123');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(regData);
      redirectUser(user.role);
    } catch (err) {
      console.error('Register failed:', err);
      setError(err.response?.data?.username?.[0] || 'Registration failed. Check your input.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role) => {
    if (role === 'CUSTOMER') navigate('/customer/orders');
    else if (role === 'PHARMACY_STAFF') navigate('/pharmacy/new-delivery');
    else if (role === 'DISPATCHER') navigate('/dispatcher/unassigned');
    else if (role === 'RIDER') navigate('/rider/deliveries');
    else navigate('/customer/orders');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Left Panel with Real High-Res Medical Logistics Image & Deep Teal Overlay */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 lg:p-16 overflow-hidden min-h-[400px] lg:min-h-screen">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1600&q=80"
          alt="Medical Logistics & Pharmacy Delivery"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Deep Teal Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-[#024F46]/85 backdrop-blur-xs" />

        {/* Dot Matrix Pattern Accent */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />

        {/* Top Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shadow-md">
            <Cross className="w-6 h-6 text-teal-300 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">PharmaDrop</span>
        </div>

        {/* Middle Hero Section */}
        <div className="my-12 z-10 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6 drop-shadow-sm">
            Know where every delivery stands.
          </h1>
          <p className="text-teal-100/90 text-lg leading-relaxed font-normal">
            Clinical precision, multi-tenant pharmacy operations, and local reliability for medical logistics across Kenya.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="flex items-center space-x-4 z-10">
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-between w-40 shadow-lg">
            <Zap className="w-6 h-6 text-teal-300 mb-2" />
            <span className="text-xs font-bold text-white">Fast Dispatch</span>
          </div>
          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col justify-between w-40 shadow-lg">
            <ShieldCheck className="w-6 h-6 text-teal-300 mb-2" />
            <span className="text-xs font-bold text-white">Secure Chain</span>
          </div>
        </div>
      </div>

      {/* Right Login/Register Form Panel */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 mb-8">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`pb-3 px-6 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'login'
                  ? 'border-[#005C53] text-[#005C53] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`pb-3 px-6 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'register'
                  ? 'border-[#005C53] text-[#005C53] font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'login' ? (
            /* LOGIN FORM */
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Welcome Back</h2>
              <p className="text-sm text-slate-500 mb-6">Access your dashboard to track deliveries.</p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter email or username (e.g. customer1)"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-xs text-[#005C53] font-semibold hover:underline">
                      Forgot password?
                    </a>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-md"
                >
                  <span>{loading ? 'Logging in...' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            /* REGISTER FORM */
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
              <p className="text-sm text-slate-500 mb-6">Register to manage or track medical orders.</p>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">User Role</label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none bg-white"
                  >
                    <option value="CUSTOMER">Customer (Track my medicine)</option>
                    <option value="PHARMACY_STAFF">Pharmacy Staff (Create dispatches)</option>
                    <option value="DISPATCHER">Dispatcher (Manage rider queue)</option>
                    <option value="RIDER">Rider (Deliver orders)</option>
                  </select>
                </div>

                {regData.role !== 'CUSTOMER' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>Pharmacy Station</span>
                    </label>
                    <select
                      value={regData.pharmacy}
                      onChange={(e) => setRegData({ ...regData, pharmacy: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-600 outline-none bg-white"
                    >
                      <option value="">Select Pharmacy Station...</option>
                      {pharmacies.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={regData.first_name}
                      onChange={(e) => setRegData({ ...regData, first_name: e.target.value })}
                      placeholder="Jane"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={regData.last_name}
                      onChange={(e) => setRegData({ ...regData, last_name: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={regData.username}
                    onChange={(e) => setRegData({ ...regData, username: e.target.value })}
                    placeholder="janedoe"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={regData.phone_number}
                    onChange={(e) => setRegData({ ...regData, phone_number: e.target.value })}
                    placeholder="+254712345678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regData.password}
                    onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-2 shadow-md"
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
