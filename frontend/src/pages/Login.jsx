import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Reveal animation delay
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Identity verification failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* Animated Medical Background */}
      <div className="medical-bg">
        <div className="bg-sphere sphere-1"></div>
        <div className="bg-sphere sphere-2"></div>
        <div className="bg-grid-overlay"></div>
      </div>

      <div className={`login-content-wrapper ${isVisible ? 'visible' : ''}`}>
        <div className="login-visual-section">
          <div className="branding-glass">
            <div className="pharma-logo-container">
              <div className="pharma-logo-core animate-pulse">
                <span className="material-symbols-outlined text-5xl text-white">precision_manufacturing</span>
              </div>
              <div className="logo-rings"></div>
            </div>
            <div className="branding-text">
              <h1 className="text-4xl font-black text-white tracking-tighter">Clinical Label Design</h1>
              <p className="text-blue-200/60 font-medium tracking-[0.2em] uppercase text-xs mt-2">Validated Pharmaceutical Environment</p>
            </div>
          </div>
          
          <div className="compliance-badges">
            <div className="badge-item">
              <span className="material-symbols-outlined">verified_user</span>
              <span>21 CFR Part 11</span>
            </div>
            <div className="badge-item">
              <span className="material-symbols-outlined">security</span>
              <span>GAMP 5 Compliant</span>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="login-card-glass">
            <div className="form-header">
              <h2 className="text-2xl font-bold text-on-surface">System Authentication</h2>
              <p className="text-sm text-on-surface-variant font-medium">Verify your organizational identity to enter.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form-fields">
              {error && (
                <div className="login-error-alert animate-shake">
                  <span className="material-symbols-outlined text-sm">report</span>
                  {error}
                </div>
              )}
              
              <div className="pharma-input-group">
                <label>Organizational ID</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">person</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. USER-7742"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pharma-input-group">
                <label>Security Key</label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">key</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className={`pharma-auth-btn ${loading ? 'loading' : ''}`} 
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-processing">
                    <span className="auth-spinner"></span>
                    Initializing Secure Session...
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Verify Identity <span className="material-symbols-outlined">arrow_forward</span>
                  </span>
                )}
              </button>
            </form>

            <div className="login-support">
              <p>Forgotten access keys? <button type="button">Request Recovery</button></p>
            </div>
          </div>
        </div>
      </div>

      <footer className="login-system-footer">
        <div className="footer-status">
          <span className="status-dot"></span>
          All Systems Operational
        </div>
        <p>© 2026 PharmaSystem Corp • Validated Laboratory V2.4.0</p>
      </footer>
    </div>
  );
};

export default Login;
