import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import Translation from './pages/Translation';
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
              <Route path="/" element={<TemplateLibrary />} />
              <Route path="/editor" element={<LabelEditor />} />
              <Route path="/translation" element={<Translation />} />
            </Routes>
          </LabelProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
