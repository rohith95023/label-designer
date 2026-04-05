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

        <div className="relative z-10 bg-white rounded-[44px] p-12 text-center shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/20 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
          <div className="w-16 h-16 rounded-[24px] bg-red-500/10 flex items-center justify-center text-red-500 mb-10 border border-red-500/10 shadow-inner">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>gpp_maybe</span>
          </div>
          
          <h2 className="text-2xl font-black text-[#0F172A] tracking-tighter mb-8 leading-none uppercase">Session Expired</h2>

          <button 
            id="reauth-btn"
            onClick={() => {
                console.log("[Auth] Redirecting to Clean Login...");
                setUser(null);
                setAccessToken(null);
                setSessionLostByTab(false);
                navigate('/login', { replace: true });
            }}
            className="h-11 px-10 bg-[#1E40AF] hover:bg-[#1D4ED8] text-white font-black uppercase tracking-[0.1em] text-[12px] rounded-[22px] shadow-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
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
