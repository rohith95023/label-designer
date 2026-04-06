import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../components/common/SplashScreen';

const AuthContext = createContext();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  withCredentials: true, // Crucial for BFF/Cookie refresh
});

let refreshPromise = null;

export const AuthProvider = ({ children }) => {
  // Use a hint to skip the splash screen if the user was recently logged in
  const hintRaw = localStorage.getItem('pharma_user_hint');
  const hint = JSON.parse(hintRaw || 'null');

  const [user, setUser] = useState(hint);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionLostByTab, setSessionLostByTab] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const navigate = useNavigate();

  // Optimized setFullUser that also saves the hint and tab active flag
  const setFullUser = (userData, token = null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('pharma_user_hint', JSON.stringify(userData));
      sessionStorage.setItem('pharma_tab_session_active', 'true');
    } else {
      localStorage.removeItem('pharma_user_hint');
      sessionStorage.removeItem('pharma_tab_session_active');
    }
    if (token) {
      setAccessToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  };

  const refreshAction = useCallback(async () => {
    if (refreshPromise) return refreshPromise;

    refreshPromise = api.post('/auth/refresh')
      .then(response => {
        const { accessToken: token, user: userData } = response.data;
        setFullUser(userData, token);
        sessionStorage.setItem('pharma_tab_session_active', 'true'); // Repopulate on refresh success
        return token;
      })
      .catch(err => {
        setFullUser(null);
        setAccessToken(null);
        sessionStorage.removeItem('pharma_tab_session_active');
        delete api.defaults.headers.common['Authorization'];
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/login');
        }
      })
      .finally(() => {
        refreshPromise = null;
        setLoading(false);
      });

    return refreshPromise;
  }, [navigate]);

  // Startup verify logic
  useEffect(() => {
    const initSession = async () => {
      const isTabActive = sessionStorage.getItem('pharma_tab_session_active');
      console.log("[Auth-Init] Start check - Hint:", !!hintRaw, "TabActive:", !!isTabActive);

      try {
        if (hintRaw && !isTabActive) {
          console.warn("[Auth-Init] GxP Violation: Tab context recycled. Terminating session.");
          setUser(null);
          setAccessToken(null);
          setSessionLostByTab(true);
          setLoading(false);
          localStorage.removeItem('pharma_user_hint');
          delete api.defaults.headers.common['Authorization'];
        } else if (hintRaw && isTabActive) {
          console.log("[Auth-Init] Persistent tab active. Refreshing...");
          await refreshAction();
        } else {
          console.log("[Auth-Init] No prior session. Start clean.");
          setLoading(false);
        }
      } catch (err) {
        console.error("[Auth-Init] Initialization Error:", err);
        setLoading(false);
      }
    };

    initSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only once on mount

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { accessToken: token, user: userData } = response.data;
      setFullUser(userData, token);
      return userData;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  };

  const logout = async () => {
    setFullUser(null);
    setAccessToken(null);
    delete api.defaults.headers.common['Authorization'];
    navigate('/login');
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Silent logout error', err);
    }
  };

  // Response interceptor for automatic refresh on 401
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/')
        ) {
          originalRequest._retry = true;
          try {
            const newToken = await refreshAction();
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            // ignore
          }
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [refreshAction, navigate]);

  console.log("[Auth-Render] Loading:", loading, "LostByTab:", sessionLostByTab, "AccessToken:", !!accessToken);

  // ── Render Phase ─────────────────────────────────────────────────────────────

  if (loading) {
    return <SplashScreen />;
  }

  if (sessionLostByTab && !accessToken) {
    console.log("[Auth-Render] GxP Security Gate: Rendering SessionLostCard...");
    return (
      <div className="fixed inset-0 flex items-center justify-center p-6 z-[200000] overflow-hidden"
        id="session-lost-guard">

        {/* Video Background matching Login */}
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
        <div className="absolute inset-0 z-[1] bg-black/30 backdrop-blur-[1px]"></div>

        <div className="relative z-10 bg-white/95 backdrop-blur-sm rounded-[32px] p-10 text-center shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-slate-200/50 animate-in fade-in zoom-in duration-500 flex flex-col items-center max-w-sm w-full mx-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-6 border border-red-100/50">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_maybe</span>
          </div>

          <h2 className="text-xl font-bold text-slate-950 tracking-tight mb-6 leading-none uppercase">Session Expired</h2>


          <p className="text-slate-500 text-sm mb-10 max-w-[280px]">
            Your session has been terminated for security and regulatory compliance.
          </p>

          <button
            id="reauth-btn"
            onClick={() => {
              console.log("[Auth] Redirecting to Clean Login...");
              // Clear everything and force a hard reload to login
              setUser(null);
              setAccessToken(null);
              setSessionLostByTab(false);
              localStorage.removeItem('pharma_user_hint');
              sessionStorage.removeItem('pharma_tab_session_active');
              navigate('/login');
            }}
            className="h-10 px-10 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest text-[10px] rounded-full shadow-2xl hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-white/10"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            RE-LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, refreshAction, loading, logoutLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default api;
