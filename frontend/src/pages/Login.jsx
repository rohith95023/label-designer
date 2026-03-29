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

      {/* Premium Glass Login Card */}
      <div className="relative z-10 w-full max-w-lg glass-card rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-1000 bg-white/30 dark:bg-black/40 backdrop-blur-2xl border-white/20">

        <div className="p-8 lg:p-14 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-10 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-glow-sm transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Sticker size={28} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-700 to-primary tracking-tighter">PharmaLabel Designer</span>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Access Portal</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl text-sm font-bold animate-shake flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">warning</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-extrabold text-slate-700 dark:text-blue-200 ml-1 uppercase tracking-widest opacity-80">user name or mail</label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.identity ? 'text-error' : 'text-slate-400 group-focus-within:text-primary'}`}>
                  <Mail size={20} />
                </div>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => {
                    setIdentity(e.target.value);
                    if (fieldErrors.identity) setFieldErrors(prev => ({ ...prev, identity: null }));
                  }}
                  placeholder="user name or mail"
                  className={`w-full pl-12 pr-12 py-4 bg-white/40 dark:bg-black/20 border rounded-2xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-500/50 font-medium text-slate-900 dark:text-white backdrop-blur-sm shadow-inner ${
                    fieldErrors.identity 
                    ? 'border-error/50 focus:ring-error/20 bg-error/5' 
                    : 'border-white/40 dark:border-white/10 focus:ring-primary focus:border-transparent'
                  }`}
                />
                {identity && (
                  <button
                    type="button"
                    onClick={() => setIdentity('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-2 transition-colors duration-200"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {fieldErrors.identity && (
                <p className="text-[12px] text-error font-bold ml-1 animate-slide-up flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {fieldErrors.identity}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-extrabold text-slate-700 dark:text-blue-200 ml-1 uppercase tracking-widest opacity-80">password</label>
              <div className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${fieldErrors.password ? 'text-error' : 'text-slate-400 group-focus-within:text-primary'}`}>
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }));
                  }}
                  placeholder="password"
                  className={`w-full pl-12 pr-12 py-4 bg-white/40 dark:bg-black/20 border rounded-2xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-500/50 font-medium text-slate-900 dark:text-white backdrop-blur-sm shadow-inner ${
                    fieldErrors.password 
                    ? 'border-error/50 focus:ring-error/20 bg-error/5' 
                    : 'border-white/40 dark:border-white/10 focus:ring-primary focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[12px] text-error font-bold ml-1 animate-slide-up flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:bg-blue-600 hover:shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying Identity...
                </span>
              ) : (
                <span className="relative z-10">Login</span>
              )}
            </button>

          </form>
        </div>
      </div>


    </div>
  );
};

export default Login;

