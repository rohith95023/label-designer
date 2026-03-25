import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useToast } from '../components/common/ToastContext';

// Mock translation dictionary for demonstration
const mockDictionary = {
  'HINDI (INDIA)': {
    'AMOXICILLIN': 'अमोक्सिसिलिन',
    'Active Component': 'सक्रिय घटक',
    '500mg Capsules\\nHard gelatin capsules containing amoxicillin trihydrate.': '500 मिलीग्राम कैप्सूल\\nएमोक्सिसिलिन ट्राइहाइड्रेट युक्त हार्ड जिलेटिन कैप्सूल।',
    'Keep out of reach of children. Store below 25°C in a dry place.': 'बच्चों की पहुँच से दूर रखें। 25°C से नीचे सूखी जगह पर स्टोर करें।',
    'PULMOCLEAR': 'पुल्मोक्लियर',
    'Cough Syrup 100ml\\nFast relief from dry cough.': 'खांसी का सिरप 100 मिली\\nसूखी खांसी से तुरंत राहत।',
    'DERMASOOTH': 'डर्मासूथ',
    'For external use only.': 'केवल बाहरी उपयोग के लिए।'
  },
  'KANNADA (INDIA)': {
    'AMOXICILLIN': 'ಅಮಾಕ್ಸಿಸಿಲಿನ್',
    'Keep out of reach of children. Store below 25°C in a dry place.': 'ಮಕ್ಕಳ ಕೈಗೆ ಎಟಕದಂತೆ ಇಡಿ. 25°C ಕ್ಕಿಂತ ಕಡಿಮೆ ತಾಪಮಾನದಲ್ಲಿ ಒಣ ಸ್ಥಳದಲ್ಲಿ ಸಂಗ್ರಹಿಸಿ.'
  }
};

export default function Translation() {
  const { activeTemplate, elements, updateElement } = useLabel();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [targetLang, setTargetLang] = useState('HINDI (INDIA)');
  // Local state to hold the drafted translations for each element ID
  const [draftTranslations, setDraftTranslations] = useState({});

  // Filter elements that actually contain readable text (ignore barcodes, generic placeholders)
  const translatableElements = elements.filter(el => el.type === 'text' || el.type === 'subtext' || el.type === 'warnings');

  // When language changes, auto-translate using mock dictionary
  useEffect(() => {
    const newDrafts = {};
    translatableElements.forEach(el => {
      // Look up in dictionary, else fallback to adding a fake suffix to prove translation path works
      if (mockDictionary[targetLang] && mockDictionary[targetLang][el.text]) {
        newDrafts[el.id] = mockDictionary[targetLang][el.text];
      } else {
        newDrafts[el.id] = `[${targetLang.split(' ')[0]}] ${el.text}`;
      }
    });
    setDraftTranslations(newDrafts);
  }, [targetLang, elements]);

  const handleApplyTranslations = () => {
    // Apply all drafted text back to the global context state
    Object.keys(draftTranslations).forEach(id => {
      updateElement(id, { text: draftTranslations[id] });
    });
    
    showToast(`Translations applied to Editor for ${targetLang}.`, 'success');
  };

  return (
    <div className="bg-background text-on-surface antialiased">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-[0px_12px_32px_rgba(25,28,30,0.04)] h-16 flex items-center justify-between px-8 font-inter antialiased tracking-tight text-sm font-medium">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold tracking-tighter text-blue-900">PharmaLabel Precision</span>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-500 hover:text-blue-600 transition-colors">
              Template Library
            </Link>
            <Link to="/editor" className="text-slate-500 hover:text-blue-600 transition-colors">
              Label Editor
            </Link>
            <Link to="/translation" className="text-blue-700 border-b-2 border-blue-600 pb-1">
              Translation
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        {/* SideNavBar */}
        <aside className="hidden md:flex flex-col gap-4 p-6 h-[calc(100vh-64px)] w-64 bg-slate-50 border-r-0 sticky top-16 border-r border-outline-variant/10">
          <div className="mb-4">
            <p className="font-inter text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">Lab Workspace</p>
            <p className="text-[10px] text-slate-400 font-medium">Clinical Precision v2.4</p>
          </div>
          <nav className="flex flex-col gap-2">
            <button onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 hover:translate-x-1 transition-transform duration-200 rounded-lg group">
              <span className="material-symbols-outlined text-xl group-hover:text-blue-700">dashboard</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">Dashboard</span>
            </button>
            <button onClick={() => navigate('/editor')} className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-100 hover:translate-x-1 transition-transform duration-200 rounded-lg group">
              <span className="material-symbols-outlined text-xl group-hover:text-blue-700">edit_document</span>
              <span className="font-inter text-xs uppercase tracking-widest font-semibold">Editor</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 bg-surface">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="max-w-2xl">
              <span className="text-primary font-inter text-xs uppercase tracking-[0.1em] font-bold block mb-2">Translation Module</span>
              <h1 className="text-4xl font-headline font-extrabold tracking-tight text-on-surface mb-2">Precision Localization Studio</h1>
              <p className="text-on-surface-variant body-md leading-relaxed">
                Currently translating: <strong className="text-primary">{activeTemplate ? activeTemplate.name : 'Unsaved Project'}</strong>
              </p>
            </div>
          </div>

          {!activeTemplate || translatableElements.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">translate</span>
              <h3 className="text-xl font-bold text-on-surface">No Translatable Content</h3>
              <p className="text-on-surface-variant mt-2 max-w-sm">Please select a template from the Library and ensure it contains text elements before translating.</p>
              <button onClick={() => navigate('/')} className="mt-6 btn-gradient px-6 py-2 rounded text-white font-bold text-sm shadow-sm">Go to Library</button>
            </div>
          ) : (
            <>
              {/* Translation Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Source Content */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                      <span className="font-headline font-bold text-on-surface uppercase tracking-wider text-xs">Source Text</span>
                    </div>
                    <span className="text-primary font-bold text-xs">ENGLISH (US)</span>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.04)] relative overflow-hidden group border border-outline-variant/10">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-fixed"></div>
                    <div className="space-y-6">
                      
                      {translatableElements.map(el => (
                        <div key={`source-${el.id}`} className="p-4 rounded-xl bg-surface-container-low border-b-2 border-outline-variant/20">
                          <label className="block text-[10px] uppercase font-bold text-primary mb-2">{el.heading || 'Text Node'}</label>
                          <p className="text-sm font-headline font-medium text-on-surface whitespace-pre-wrap">{el.text}</p>
                        </div>
                      ))}

                    </div>
                  </div>
                </div>

                {/* Target Content */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="font-headline font-bold text-on-surface uppercase tracking-wider text-xs">Target Translation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="bg-transparent border-none text-secondary font-bold text-xs focus:ring-0 cursor-pointer outline-none"
                      >
                        <option value="HINDI (INDIA)">HINDI (INDIA)</option>
                        <option value="KANNADA (INDIA)">KANNADA (INDIA)</option>
                        <option value="SPANISH (EU)">SPANISH (EU)</option>
                        <option value="FRENCH (FR)">FRENCH (FR)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.04)] relative border border-outline-variant/10">
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary-fixed"></div>
                    
                    <div className="space-y-6">
                      {translatableElements.map(el => (
                        <div key={`target-${el.id}`} className="p-4 rounded-xl bg-surface-container-low border-b-2 border-outline-variant/20 focus-within:bg-white focus-within:border-primary transition-all">
                          <div className="flex justify-between items-start mb-2">
                            <label className="block text-[10px] uppercase font-bold text-secondary">{el.heading || 'Text Node'}</label>
                            {mockDictionary[targetLang] && mockDictionary[targetLang][el.text] && (
                              <span className="material-symbols-outlined text-xs text-secondary-container bg-on-secondary-container/10 px-1 rounded" title="AI Verified Match">verified</span>
                            )}
                          </div>
                          <textarea 
                            className="w-full bg-transparent border-none outline-none p-0 text-on-surface body-md leading-relaxed focus:ring-0 min-h-[60px] resize-none"
                            value={draftTranslations[el.id] || ''}
                            onChange={(e) => setDraftTranslations({ ...draftTranslations, [el.id]: e.target.value })}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-outline-variant/10">
                      <button 
                        onClick={handleApplyTranslations}
                        className="bg-primary text-white font-semibold px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 hover:bg-primary-container transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        Apply to Editor
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Metric Cluster Section */}
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm">
                  <p className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">Translation Accuracy</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-extrabold text-on-surface">99.4%</span>
                    <span className="text-secondary body-sm font-bold flex items-center"><span className="material-symbols-outlined text-sm">arrow_upward</span></span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm">
                  <p className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">Medical Confidence</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-extrabold text-on-surface">High</span>
                    <span className="material-symbols-outlined text-secondary" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm">
                  <p className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">Elements Count</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-headline font-extrabold text-on-surface">{translatableElements.length}</span>
                    <span className="material-symbols-outlined text-secondary">fact_check</span>
                  </div>
                </div>
                
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/5 shadow-sm overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-primary font-bold text-[10px] uppercase tracking-widest mb-2">Target ISO Code</p>
                    <span className="text-3xl font-headline font-extrabold text-on-surface">{targetLang.substring(0,2)}</span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{targetLang}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
