import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import Translation from './pages/Translation';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import { ToastProvider } from './components/common/ToastContext';
import { LabelProvider } from './context/LabelContext';
import { ThemeProvider } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <LabelProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<TemplateLibrary />} />
              <Route path="/editor" element={<LabelEditor />} />
              <Route path="/translation" element={<Translation />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </LabelProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
