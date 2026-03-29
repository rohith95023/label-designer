import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verifying Enterprise Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin override
  if (user.role === 'ADMIN') return children;

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // Modular Permission check (Access Control Matrix)
  if (requiredPermission) {
    const permissions = user.permissions || [];
    
    // Check if user has VIEW permission for this module
    const p = permissions.find(p => 
      p.module.toLowerCase() === requiredPermission.toLowerCase() && 
      p.event.toUpperCase() === 'VIEW'
    );

    const hasAccess = !!(p && p.allowed);

    console.log(`[AccessControl Diagnosis] Route: ${location.pathname}, Required: ${requiredPermission}, User: ${user.username}, Role: ${user.role}, HasViewPerm: ${!!p}, Allowed: ${p?.allowed}, PermCount: ${permissions.length}`);
    console.log(`[AccessControl Trace] Full User JSON:`, JSON.stringify(user, null, 2));

    if (!hasAccess) {
      console.warn(`Access Denied: User ${user.username} lacks VIEW permission for ${requiredPermission}`);
      
      // Prevent infinite redirect loops
      if (location.pathname === '/' || requiredPermission === 'dashboard') {
        return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="glass-card max-w-md w-full p-10 text-center rounded-[32px] border border-white/5 shadow-2xl animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl">shield_lock</span>
              </div>
              <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Access Denied</h1>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Your account does not have permission to view the <strong className="text-white">{requiredPermission}</strong> module. 
                Please contact your supervisor for access.
              </p>
              
              <button 
                onClick={logout}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-glow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Return to Login
              </button>

              <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-slate-500 font-medium uppercase tracking-widest text-left">
                <p className="mb-1">Security Diagnostic</p>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white/5 p-2 rounded-lg">User: <span className="text-slate-300">{user.username}</span></div>
                  <div className="bg-white/5 p-2 rounded-lg">Role: <span className="text-slate-300">{user.role}</span></div>
                  <div className="bg-white/5 p-2 rounded-lg col-span-2">Effective Permissions: <span className="text-slate-300">{permissions.length} active</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
