import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cross, Zap, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    role: 'CUSTOMER'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      {/* Left Deep Teal Panel (Matching image.png Mockup) */}
      <div className="lg:w-1/2 bg-[#024F46] text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Background Dot Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
        />

        {/* Top Logo */}
        <div className="flex items-center space-x-2 z-10">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
            <Cross className="w-5 h-5 text-teal-300 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">PharmaDrop</span>
        </div>

        {/* Middle Hero Section */}
        <div className="my-12 z-10 max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Know where every delivery stands.
          </h1>
          <p className="text-teal-100/80 text-lg leading-relaxed font-normal">
            Clinical precision and local reliability for medical logistics across Kenya.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="flex items-center space-x-4 z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex flex-col justify-between w-36">
            <Zap className="w-5 h-5 text-teal-300 mb-2" />
            <span className="text-xs font-semibold text-white">Fast Dispatch</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex flex-col justify-between w-36">
            <ShieldCheck className="w-5 h-5 text-teal-300 mb-2" />
            <span className="text-xs font-semibold text-white">Secure Chain</span>
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
                  ? 'border-[#005C53] text-[#005C53] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); }}
              className={`pb-3 px-6 font-medium text-sm transition-all border-b-2 ${
                activeTab === 'register'
                  ? 'border-[#005C53] text-[#005C53] font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center space-x-2">
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
                    Email or Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email or phone (e.g. customer1)"
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none bg-white"
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
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 outline-none bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    User Role
                  </label>
                  <select
                    value={regData.role}
                    onChange={(e) => setRegData({ ...regData, role: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-600 outline-none bg-white"
                  >
                    <option value="CUSTOMER">Customer (Track my medicine)</option>
                    <option value="PHARMACY_STAFF">Pharmacy Staff (Create dispatches)</option>
                    <option value="DISPATCHER">Dispatcher (Manage rider queue)</option>
                    <option value="RIDER">Rider (Deliver orders)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={regData.first_name}
                      onChange={(e) => setRegData({ ...regData, first_name: e.target.value })}
                      placeholder="Jane"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
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
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
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
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#004D40] hover:bg-[#00382E] text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm"
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
