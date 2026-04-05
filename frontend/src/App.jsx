import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// ── Lazy-loaded Route Components ──
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TemplateLibrary = lazy(() => import('./pages/TemplateLibrary'));
const LabelEditor = lazy(() => import('./pages/LabelEditor'));
const SavedTemplates = lazy(() => import('./pages/SavedTemplates'));
const Translation = lazy(() => import('./pages/Translation'));
const History = lazy(() => import('./pages/History'));
const PrintRequests = lazy(() => import('./pages/PrintRequests'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

// ── Masters lazy-loading ──
const LabelStocks = lazy(() => import('./pages/masters/LabelStocks'));
const Placeholders = lazy(() => import('./pages/masters/Placeholders'));
const Objects = lazy(() => import('./pages/masters/Objects'));
const Languages = lazy(() => import('./pages/masters/Languages'));
const PhrasesTranslations = lazy(() => import('./pages/masters/PhrasesTranslations'));

import SplashScreen from './components/common/SplashScreen';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/ToastContext';
import { LabelProvider, useLabel } from './context/LabelContext';
import PersistentAppLayout from './components/common/PersistentAppLayout';
import { Outlet } from 'react-router-dom';

function AppLayoutWrapper() {
  return (
    <PersistentAppLayout>
      <Outlet />
    </PersistentAppLayout>
  );
}

function AppContent() {
  const { loading } = useLabel();

  React.useEffect(() => {
    if (!loading) {
      document.body.classList.add('app-ready');
    }
  }, [loading]);

  return (
    <Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Main App Ecosystem with Persistent Header/Sidebar */}
        <Route element={<ProtectedRoute requiredPermission="dashboard"><AppLayoutWrapper /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          
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
        </Route>
        
        {/* Exclusive Environment Routes (Shifting Pages) */}
        <Route path="/editor" element={
          <ProtectedRoute requiredRole="OPERATOR" requiredPermission="editor">
            <LabelEditor />
          </ProtectedRoute>
        } />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <LabelProvider>
            <AppContent />
          </LabelProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
