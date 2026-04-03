import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import SavedTemplates from './pages/SavedTemplates';
import Translation from './pages/Translation';
import History from './pages/History';
import PrintRequests from './pages/PrintRequests';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import LabelStocks from './pages/masters/LabelStocks';
import Placeholders from './pages/masters/Placeholders';
import Objects from './pages/masters/Objects';
import Languages from './pages/masters/Languages';
import PhrasesTranslations from './pages/masters/PhrasesTranslations';
import SplashScreen from './components/common/SplashScreen';
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
    return <SplashScreen />;
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
      
      <Route path="/print-requests" element={
        <ProtectedRoute requiredPermission="print">
          <PrintRequests />
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

      {/* Setup Masters */}
      <Route path="/masters/label-stocks" element={
        <ProtectedRoute requiredRole="ADMIN">
          <LabelStocks />
        </ProtectedRoute>
      } />
      <Route path="/masters/placeholders" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Placeholders />
        </ProtectedRoute>
      } />
      <Route path="/masters/assets" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Objects />
        </ProtectedRoute>
      } />
      <Route path="/masters/languages" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Languages />
        </ProtectedRoute>
      } />
      <Route path="/masters/phrases" element={
        <ProtectedRoute requiredRole="ADMIN">
          <PhrasesTranslations />
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
