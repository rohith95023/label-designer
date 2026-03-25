import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TemplateLibrary from './pages/TemplateLibrary';
import LabelEditor from './pages/LabelEditor';
import Translation from './pages/Translation';
import { ToastProvider } from './components/common/ToastContext';
import { LabelProvider } from './context/LabelContext';

export default function App() {
  return (
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
  );
}
