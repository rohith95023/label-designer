import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import SavedTemplates from './pages/SavedTemplates';
import Translation from './pages/Translation';
import History from './pages/History';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/ToastContext';
import { LabelProvider, useLabel } from './context/LabelContext';
import { ThemeProvider } from './context/ThemeContext';

function AppContent() {
  const { loading } = useLabel();

  React.useEffect(() => {
    if (!loading) {
      document.body.classList.add('app-ready');
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="fixed inset-0 min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6 lg:p-12 z-[9999]">
        {/* Animated Background Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-tertiary/5 rounded-full blur-[100px] animate-pulse delay-700"></div>

        <div className="relative flex flex-col items-center gap-12 max-w-sm w-full animate-fade-in duration-700">
          {/* Scientific Pulsing Logo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-glow-lg border border-primary/20 animate-bounce-subtle">
              <span className="material-symbols-outlined text-on-primary text-5xl">medication</span>
            </div>
            <div className="absolute inset-0 rounded-[32px] bg-primary/20 animate-ping opacity-20"></div>
          </div>

          {/* Status Indicators */}
          <div className="text-center space-y-4 w-full">
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tighter mb-1">Clinical Label Design</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] opacity-80">Loading</p>
            </div>
            
            {/* Professional Loading Bar */}
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10 shadow-inner p-[2px]">
              <div className="h-full bg-gradient-to-r from-primary via-tertiary to-primary rounded-full animate-loading-bar shadow-glow-sm"></div>
            </div>
          </div>
        </div>

        {/* Security / Compliance Badge (Bottom) */}
        <div className="absolute bottom-12 flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500 cursor-default px-8 py-3 rounded-2xl border border-outline-variant/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
            <span className="text-[9px] font-black uppercase tracking-widest">TLS 1.3 Certified</span>
          </div>
          <div className="w-px h-3 bg-on-surface-variant/20"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span className="text-[9px] font-black uppercase tracking-widest">GxP Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute requiredPermission="dashboard">
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/assets" element={
        <ProtectedRoute requiredPermission="templates">
          <TemplateLibrary />
        </ProtectedRoute>
      } />

      <Route path="/saved-templates" element={
        <ProtectedRoute requiredPermission="saved-templates">
          <SavedTemplates />
        </ProtectedRoute>
      } />
      
      <Route path="/editor" element={
        <ProtectedRoute requiredRole="OPERATOR" requiredPermission="editor">
          <LabelEditor />
        </ProtectedRoute>
      } />
      
      <Route path="/translation" element={
        <ProtectedRoute requiredPermission="translation">
          <Translation />
        </ProtectedRoute>
      } />
      
      <Route path="/history" element={
        <ProtectedRoute requiredPermission="history">
          <History />
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Settings />
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute requiredRole="ADMIN">
          <UserManagement />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LabelProvider>
              <AppContent />
            </LabelProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
