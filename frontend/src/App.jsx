import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import Translation from './pages/Translation';
import History from './pages/History';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import ProtectedRoute from './components/common/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/common/ToastContext';
import { LabelProvider } from './context/LabelContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <LabelProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/assets" element={
                  <ProtectedRoute>
                    <TemplateLibrary />
                  </ProtectedRoute>
                } />
                
                <Route path="/editor" element={
                  <ProtectedRoute requiredRole="OPERATOR">
                    <LabelEditor />
                  </ProtectedRoute>
                } />
                
                <Route path="/translation" element={
                  <ProtectedRoute>
                    <Translation />
                  </ProtectedRoute>
                } />
                
                <Route path="/history" element={
                  <ProtectedRoute>
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
            </LabelProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
