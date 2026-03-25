import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useToast } from '../components/common/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { GEO_LANGUAGE_DATA, ELEMENT_TYPE_LABELS, TRANSLATABLE_TYPES } from '../data/geoLanguages';
import { translateBatch } from '../services/translation.service';

const TYPE_COLORS = {
  text: 'text-blue-700 bg-blue-50 border-blue-200',
  subtext: 'text-purple-700 bg-purple-50 border-purple-200',
  warnings: 'text-red-700 bg-red-50 border-red-200',
  dosage: 'text-green-700 bg-green-50 border-green-200',
  expiry: 'text-amber-700 bg-amber-50 border-amber-200',
  manufacturing: 'text-teal-700 bg-teal-50 border-teal-200',
  storage: 'text-orange-700 bg-orange-50 border-orange-200',
};

export default function Translation() {
  const { activeTemplate, elements, updateElement, commitUpdate, meta } = useLabel();
  const { showToast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ── Geo / Language selectors ────────────────────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedLang, setSelectedLang] = useState(null); // { code, name }

  const countryData = GEO_LANGUAGE_DATA.find(c => c.country === selectedCountry);
  const stateData = countryData?.states.find(s => s.name === selectedState);
  const availableLangs = stateData?.languages || [];

  // Reset cascade
  useEffect(() => { setSelectedState(''); setSelectedLang(null); }, [selectedCountry]);
  useEffect(() => { setSelectedLang(null); }, [selectedState]);
  useEffect(() => {
    if (availableLangs.length === 1) setSelectedLang(availableLangs[0]);
  }, [selectedState]);

  // ── Element selection (checkboxes) ──────────────────────────────────────────
  const translatableElements = elements.filter(el => TRANSLATABLE_TYPES.includes(el.type));
  const [checkedIds, setCheckedIds] = useState(new Set());

  // Auto-check all on element list change
  useEffect(() => {
    setCheckedIds(new Set(translatableElements.map(e => e.id)));
  }, [elements.length]);

  const toggleCheck = (id) => setCheckedIds(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });
  const toggleAll = (val) => setCheckedIds(val ? new Set(translatableElements.map(e => e.id)) : new Set());

  // ── Translations draft ──────────────────────────────────────────────────────
  const [draftTranslations, setDraftTranslations] = useState({});
  const [translating, setTranslating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleTranslate = useCallback(async () => {
    if (!selectedLang) {
      showToast('Please complete all 3 dropdown selections first.', 'error');
      return;
    }
    const toTranslate = translatableElements
      .filter(el => checkedIds.has(el.id))
      .map(el => ({ id: el.id, text: el.text || '' }));

    if (toTranslate.length === 0) {
      showToast('No elements selected for translation.', 'error');
      return;
    }

    setTranslating(true);
    setProgress({ done: 0, total: toTranslate.length });
    try {
      const results = await translateBatch(
        toTranslate,
        selectedLang.code,
        (done, total) => setProgress({ done, total })
      );
      setDraftTranslations(prev => ({ ...prev, ...results }));
      showToast(`Translated ${toTranslate.length} elements to ${selectedLang.name}!`, 'success');
    } catch (e) {
      showToast('Translation failed. Please try again.', 'error');
    } finally {
      setTranslating(false);
      setProgress({ done: 0, total: 0 });
    }
  }, [selectedLang, translatableElements, checkedIds]);

  const handleApplyTranslations = () => {
    const checkedWithDraft = translatableElements.filter(
      el => checkedIds.has(el.id) && draftTranslations[el.id] !== undefined
    );
    if (checkedWithDraft.length === 0) {
      showToast('Nothing to apply. Please translate first.', 'error');
      return;
    }
    checkedWithDraft.forEach(el => updateElement(el.id, { text: draftTranslations[el.id] }));
    commitUpdate();
    showToast(`${checkedWithDraft.length} translation(s) applied to canvas!`, 'success');
  };

  const allChecked = translatableElements.length > 0 && translatableElements.every(el => checkedIds.has(el.id));
  const someChecked = translatableElements.some(el => checkedIds.has(el.id));

  const projectName = activeTemplate?.name || meta.fileName || 'Unsaved Project';
  const isReady = selectedCountry && selectedState && selectedLang;

  return (
    <div className="bg-[#F1F3F6] text-on-surface antialiased min-h-screen">

      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-[#F8FAFC] dark:bg-slate-900 border-b border-black/5 h-14 flex items-center justify-between px-6 relative">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-lg font-extrabold tracking-tighter text-blue-900">Pharma Label Design</Link>
          <div className="w-[1px] h-5 bg-slate-200 mx-1" />
        </div>

        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-6 text-[15px] font-semibold">
          <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors">Dashboard</Link>
          <Link to="/assets" className="text-slate-500 hover:text-slate-800 transition-colors">Template Library</Link>
          <Link to="/editor" className="text-slate-500 hover:text-slate-800 transition-colors">Label Editor</Link>
          <Link to="/translation" className="text-blue-700 font-bold border-b-2 border-blue-600 pb-1">Translation</Link>
        </nav>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="material-symbols-outlined text-[14px]">edit_document</span>
            {projectName}
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      <div className="pt-14 flex min-h-screen">

        {/* ── Left Sidebar: Source ─────────────────────────────────────────── */}
        <aside className="w-[340px] shrink-0 bg-[#F8FAFC] dark:bg-slate-900 border-r border-black/5 flex flex-col overflow-hidden sticky top-14 h-[calc(100vh-56px)]">
          {/* Header */}
          <div className="px-5 py-4 border-b border-black/5 bg-slate-50/80 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Source Text</span>
              </div>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">ENGLISH (SOURCE)</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{translatableElements.length} translatable element{translatableElements.length !== 1 ? 's' : ''} on canvas</p>
          </div>

          {/* Select All */}
          {translatableElements.length > 0 && (
            <div className="px-5 py-2.5 border-b border-black/5 bg-white shrink-0 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                  onChange={e => toggleAll(e.target.checked)}
                  className="w-3.5 h-3.5 cursor-pointer accent-blue-600 rounded"
                />
                <span className="text-[10px] font-semibold text-slate-700">Select All</span>
              </label>
              <span className="text-[10px] text-slate-500">{checkedIds.size} selected</span>
            </div>
          )}

          {/* Elements List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {translatableElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">text_fields</span>
                <p className="text-xs font-bold text-slate-600">No text elements on canvas</p>
                <p className="text-[10px] text-slate-500 mt-1">Add text elements in the Editor first.</p>
                <button onClick={() => navigate('/editor')} className="mt-4 btn-gradient text-white text-[10px] font-bold px-4 py-1.5 rounded-lg shadow-sm">
                  Open Editor
                </button>
              </div>
            ) : (
              translatableElements.map(el => {
                const isChecked = checkedIds.has(el.id);
                const typeLabel = ELEMENT_TYPE_LABELS[el.type] || el.type;
                const typeStyle = TYPE_COLORS[el.type] || 'text-slate-600 bg-slate-50 border-slate-200';
                return (
                  <div
                    key={el.id}
                    onClick={() => toggleCheck(el.id)}
                    className={`rounded-xl border p-3 cursor-pointer transition-all ${isChecked ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-400/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheck(el.id)}
                        onClick={e => e.stopPropagation()}
                        className="mt-0.5 w-3.5 h-3.5 cursor-pointer accent-blue-600 rounded shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${typeStyle}`}>
                            {el.heading || typeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 font-medium leading-snug whitespace-pre-wrap line-clamp-3">
                          {el.text || <span className="text-slate-300 italic">Empty</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Main Area: Target ────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Controls Bar ── */}
          <div className="bg-[#F8FAFC] dark:bg-slate-900 border-b border-black/5 px-6 py-4 shrink-0">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[680px]">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2">Translate To</p>
                <div className="flex items-center gap-3">

                  {/* Country */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Country</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-500">public</span>
                      <select
                        value={selectedCountry}
                        onChange={e => setSelectedCountry(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 cursor-pointer appearance-none"
                      >
                        <option value="">Select Country…</option>
                        {GEO_LANGUAGE_DATA.map(c => (
                          <option key={c.code} value={c.country}>{c.country}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-[16px] text-slate-400 mb-0.5 mt-5">chevron_right</span>

                  {/* State */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">State / Region</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-500">location_on</span>
                      <select
                        value={selectedState}
                        onChange={e => setSelectedState(e.target.value)}
                        disabled={!selectedCountry}
                        className="w-full pl-8 pr-3 py-2 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 cursor-pointer disabled:opacity-40 appearance-none"
                      >
                        <option value="">Select State…</option>
                        {(countryData?.states || []).map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <span className="material-symbols-outlined text-[16px] text-slate-400 mb-0.5 mt-5">chevron_right</span>

                  {/* Language */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Language</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-slate-500">translate</span>
                      <select
                        value={selectedLang?.code || ''}
                        onChange={e => setSelectedLang(availableLangs.find(l => l.code === e.target.value) || null)}
                        disabled={!selectedState}
                        className="w-full pl-8 pr-3 py-2 text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 cursor-pointer disabled:opacity-40 appearance-none"
                      >
                        <option value="">Select Language…</option>
                        {/* Always show English as a global option */}
                        {availableLangs.some(l => l.code === 'en') ? null : (
                          <option value="en">English (Global)</option>
                        )}
                        {availableLangs.map(l => (
                          <option key={l.code} value={l.code}>{l.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2 pb-0.5">
                <button
                  onClick={handleTranslate}
                  disabled={!isReady || translating || checkedIds.size === 0}
                  className="flex items-center gap-2 px-5 py-2 btn-gradient text-white rounded-lg text-[11px] font-bold shadow-sm disabled:opacity-40 transition-all active:scale-95"
                >
                  {translating ? (
                    <>
                      <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
                      {progress.total > 0 ? `${progress.done}/${progress.total}` : 'Translating…'}
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[15px]">g_translate</span>
                      Translate
                    </>
                  )}
                </button>
                <button
                  onClick={handleApplyTranslations}
                  disabled={Object.keys(draftTranslations).length === 0 || checkedIds.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-[11px] font-bold shadow-sm disabled:opacity-40 transition-all active:scale-95 hover:bg-green-700"
                >
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Apply to Editor
                </button>
                <button
                  onClick={() => navigate('/editor')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  Go to Editor
                </button>
              </div>
            </div>

            {/* Status Bar */}
            {isReady && (
              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
                <span className="material-symbols-outlined text-[12px] text-green-500">check_circle</span>
                Translating to <strong className="text-slate-700">{selectedLang?.name}</strong>
                <span className="text-slate-300">•</span>
                {selectedState}, {selectedCountry}
                <span className="text-slate-300">•</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{selectedLang?.code}</span>
              </div>
            )}
          </div>

          {/* ── Translation Content ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {translatableElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="material-symbols-outlined text-6xl text-slate-400 mb-4">translate</span>
                <h3 className="text-lg font-bold text-slate-700">No Content to Translate</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm">Add text elements to your label in the Editor, then come back here to translate them.</p>
                <button onClick={() => navigate('/editor')} className="mt-6 btn-gradient px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm">Go to Editor</button>
              </div>
            ) : (
              <div>
                {/* Target Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">Target Translations</span>
                    {selectedLang && (
                      <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 ml-1 uppercase">
                        {selectedLang.name} · {selectedLang.code}
                      </span>
                    )}
                  </div>
                  {!isReady && (
                    <p className="text-[10px] text-amber-600 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">info</span>
                      Select a country, state, and language to begin.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {translatableElements.map(el => {
                    const isChecked = checkedIds.has(el.id);
                    const typeLabel = ELEMENT_TYPE_LABELS[el.type] || el.type;
                    const typeStyle = TYPE_COLORS[el.type] || 'text-slate-600 bg-slate-50 border-slate-200';
                    const hasDraft = draftTranslations[el.id] !== undefined;

                    return (
                      <div
                        key={`target-${el.id}`}
                        className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${isChecked ? 'border-green-200 dark:border-green-900 shadow-sm' : 'border-slate-100 dark:border-white/5 opacity-50'}`}
                      >
                        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCheck(el.id)}
                            className="w-3.5 h-3.5 cursor-pointer accent-blue-600 rounded"
                          />
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${typeStyle}`}>
                            {el.heading || typeLabel}
                          </span>
                          <span className="text-[9px] text-slate-400 ml-auto">
                            {el.text?.length || 0} chars
                          </span>
                          {hasDraft && isChecked && (
                            <span className="material-symbols-outlined text-[12px] text-green-500" title="Translated">check_circle</span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-slate-100">
                          {/* Source preview */}
                          <div className="p-3">
                            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">English (Source)</p>
                            <p className="text-[11px] text-slate-700 leading-snug whitespace-pre-wrap">{el.text || <span className="italic text-slate-400">empty</span>}</p>
                          </div>

                          {/* Translation textarea */}
                          <div className="p-3">
                            <p className="text-[9px] font-semibold text-green-700 uppercase tracking-wider mb-1.5">
                              {selectedLang ? selectedLang.name : 'Target Language'}
                            </p>
                            {isChecked ? (
                              <textarea
                                className="w-full text-[11px] text-slate-800 font-medium leading-snug bg-transparent outline-none resize-none min-h-[48px] border-none"
                                placeholder={
                                  translating
                                    ? 'Translating…'
                                    : isReady
                                      ? 'Click "Translate" to auto-translate, or type manually…'
                                      : 'Select a language above first…'
                                }
                                value={draftTranslations[el.id] || ''}
                                onChange={e => setDraftTranslations(prev => ({ ...prev, [el.id]: e.target.value }))}
                                dir={['ar', 'he', 'fa', 'ur'].includes(selectedLang?.code) ? 'rtl' : 'ltr'}
                              />
                            ) : (
                              <p className="text-[10px] text-slate-400 italic">Unchecked — will not be translated</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom stats */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 p-4 text-center shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Selected</p>
                    <p className="text-2xl font-extrabold text-blue-600">{checkedIds.size}</p>
                    <p className="text-[9px] text-slate-400">of {translatableElements.length} elements</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 p-4 text-center shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Translated</p>
                    <p className="text-2xl font-extrabold text-green-600">
                      {translatableElements.filter(el => draftTranslations[el.id]).length}
                    </p>
                    <p className="text-[9px] text-slate-400">elements with drafts</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 p-4 text-center shadow-sm">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Target</p>
                    <p className="text-2xl font-extrabold text-slate-700">
                      {selectedLang ? selectedLang.code.toUpperCase() : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400">{selectedLang?.name || 'Not selected'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
