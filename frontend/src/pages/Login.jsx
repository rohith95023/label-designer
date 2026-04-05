import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sticker, X } from 'lucide-react';

const Login = () => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!identity.trim()) errors.identity = 'User name or mail is required';
    if (!password.trim()) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validate()) return;

    setLoading(true);
    try {
      await login(identity, password);
      navigate('/');
    } catch (err) {
      if (err.message?.toLowerCase().includes('locked')) {
        setError(err.message);
      } else if (err.message?.toLowerCase().includes('password') || err.message?.toLowerCase().includes('invalid')) {
        setError('Invalid user name or password');
        setFieldErrors({ identity: true, password: true });
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 w-full h-full object-cover grayscale-[0.2] brightness-[0.4] saturate-[0.8]"
      >
        <source src="/login background.mp4" type="video/mp4" />
      </video>

      {/* Glassmorphic Overlay */}
      <div className="absolute inset-0 z-[1] bg-black/40 backdrop-blur-[1px]"></div>

      {/* Light Mode Glass Login Card */}
      <div className="relative z-10 w-full max-w-lg rounded-[3rem] shadow-[0_40px_120px_rgba(0,0,0,0.3)] overflow-hidden animate-in fade-in zoom-in duration-1000 bg-slate-100/90 backdrop-blur-3xl border border-white/60">

        <div className="p-10 lg:p-14 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Sticker size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">PharmaPrecise</span>
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Access Portal</h1>
            <p className="text-slate-800 font-black text-[10px] uppercase tracking-[0.2em]">Secure compliance management system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-[13px] font-bold animate-shake flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">warning</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1 uppercase tracking-[0.2em]">user name or mail</label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.identity ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                  <Mail size={18} />
                </div>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (fieldErrors.identity) setFieldErrors(prev => ({ ...prev, identity: null }));
                  }}
                  placeholder="name@precision.pharma"
                  className={`w-full pl-12 pr-12 py-4 bg-white/60 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 font-bold text-slate-950 shadow-sm ${
                    fieldErrors.identity 
                    ? 'border-red-500/30 focus:ring-red-500/10' 
                    : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600/30'
                  }`}
                />
                {identity && (
                  <button
                    type="button"
                    onClick={() => setIdentity('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 transition-colors duration-200"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-600 ml-1 uppercase tracking-[0.2em]">password</label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'}`}>
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-4 bg-white/60 border-2 rounded-2xl focus:outline-none focus:ring-4 transition-all placeholder:text-slate-400 font-bold text-slate-950 shadow-sm ${
                    fieldErrors.password 
                    ? 'border-red-500/30 focus:ring-red-500/10' 
                    : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600/30'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group uppercase tracking-widest flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  AUTHORIZING...
                </>
              ) : (
                <>
                  LOGIN
                  <span className="material-symbols-outlined text-2xl font-bold">login</span>
                </>
              )}
            </button>

          </form>
        </div>
      </div>


    </div>
  );
};

export default Login;

