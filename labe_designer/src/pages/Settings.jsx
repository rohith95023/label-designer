import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLabel, LABEL_PRESETS, getLogs } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { settings, updateSettings, getAllFiles, exportJSON, meta } = useLabel();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState(settings.profileName || 'Pharma Designer');
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSaveProfile = () => {
    updateSettings({ profileName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('plabel_'));
    keys.forEach(k => localStorage.removeItem(k));
    setConfirmClear(false);
    window.location.href = '/';
  };

  const handleExportAll = () => {
    const allFiles = getAllFiles();
    const fullData = {};
    allFiles.forEach(f => {
      const raw = localStorage.getItem(`plabel_file_${f.fileId}`);
      if (raw) try { fullData[f.fileId] = JSON.parse(raw); } catch {}
    });
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_pharma_labels.json';
    a.click();
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        Object.entries(data).forEach(([id, val]) => {
          localStorage.setItem(`plabel_file_${id}`, JSON.stringify(val));
        });
        const idx = Object.keys(data).map(id => ({
          fileId: id,
          fileName: data[id]?.meta?.fileName || null,
          updatedAt: data[id]?.savedAt || Date.now()
        }));
        const existingIdx = (() => { try { return JSON.parse(localStorage.getItem('plabel_index') || '[]'); } catch { return []; } })();
        const merged = [...existingIdx, ...idx].reduce((acc, v) => {
          acc[v.fileId] = v; return acc;
        }, {});
        localStorage.setItem('plabel_index', JSON.stringify(Object.values(merged)));
        alert(`Imported ${Object.keys(data).length} file(s) successfully.`);
      } catch {
        alert('Failed to import — invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const SectionTitle = ({ icon, label }) => (
    <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-100 dark:border-slate-700">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      <h2 className="text-base font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">{label}</h2>
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="bg-background text-on-surface min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-[#F8FAFC]/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-black/5 dark:border-white/10 h-16 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <span className="text-xl font-bold tracking-tighter text-blue-900 dark:text-blue-100">Pharma Label Design</span>
        </div>
        
        <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-8 items-center font-inter antialiased tracking-tight text-[15px] font-semibold">
          <Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Dashboard
          </Link>
          <Link to="/assets" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Template Library
          </Link>
          <Link to="/editor" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Label Editor
          </Link>
          <Link to="/translation" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors">
            Translation
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 text-on-surface-variant hover:bg-blue-50/50 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95">
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>
        </div>
      </header>

      <div className="flex pt-16 h-screen overflow-hidden">
        {/* SideNavBar */}
        <aside className={`hidden lg:flex flex-col gap-8 p-6 h-full bg-white dark:bg-slate-950 shrink-0 border-r border-slate-100 overflow-y-hidden transition-all duration-300 ${sidebarCollapsed ? 'w-24' : 'w-72'}`}>
          <nav className="flex flex-col gap-3">
            <Link to="/" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">grid_view</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Dashboard</span>}
            </Link>
            <Link to="/assets" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">business</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">Template Library</span>}
            </Link>
            <Link to="/history" className={`flex items-center gap-4 py-4 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5'}`}>
              <span className="material-symbols-outlined text-2xl">history</span>
              {!sidebarCollapsed && <span className="font-semibold text-[15px] tracking-tight">History</span>}
            </Link>
            <Link to="/settings" className={`flex items-center gap-4 py-4 transition-all duration-300 rounded-[20px] ${sidebarCollapsed ? 'justify-center px-0' : 'px-5 bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900/50'}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
              {!sidebarCollapsed && <span className="font-bold text-[15px] tracking-tight">Settings</span>}
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-surface p-8 lg:p-12">
          <div className="mb-10">
            <span className="text-primary font-bold text-[0.7rem] uppercase tracking-[0.2em] block mb-2">Preferences</span>
            <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">Settings</h1>
            <p className="text-on-surface-variant max-w-lg mt-3 text-sm">Customize your workspace, editor defaults, and compliance rules.</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-5xl">

            {/* User Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <SectionTitle icon="person" label="User Settings" />
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Profile Name</label>
                <input
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <Toggle
                  label="Dark Mode"
                  desc="Switch between light and dark interface"
                  value={theme === 'dark'}
                  onChange={toggleTheme}
                />
              </div>
              <button
                onClick={handleSaveProfile}
                className="mt-4 w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                {saved ? <><span className="material-symbols-outlined text-lg">check</span> Saved!</> : 'Save Changes'}
              </button>
            </div>

            {/* Editor Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <SectionTitle icon="tune" label="Editor Settings" />
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Default Label Size</label>
                <select
                  value={settings.defaultSize}
                  onChange={e => updateSettings({ defaultSize: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {LABEL_PRESETS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Units</label>
                <div className="flex gap-2">
                  {['mm', 'px', 'in'].map(u => (
                    <button
                      key={u}
                      onClick={() => updateSettings({ units: u })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${settings.units === u ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-primary/50'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle
                label="Show Grid"
                desc="Display grid lines on the editor canvas"
                value={settings.gridEnabled}
                onChange={v => updateSettings({ gridEnabled: v })}
              />
            </div>

            {/* Translation Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <SectionTitle icon="translate" label="Translation Settings" />
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Default Language</label>
                <select
                  value={settings.defaultLanguage}
                  onChange={e => updateSettings({ defaultLanguage: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="ar">🇸🇦 Arabic</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                </select>
              </div>
              <Toggle
                label="Auto-Translate"
                desc="Automatically translate label content when switching language"
                value={settings.autoTranslate}
                onChange={v => updateSettings({ autoTranslate: v })}
              />
            </div>

            {/* Compliance Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
              <SectionTitle icon="verified_user" label="Compliance Settings" />
              <Toggle
                label="FDA Validation Rules"
                desc="Enforce FDA compliance checks when validating labels"
                value={settings.fdaValidation}
                onChange={v => updateSettings({ fdaValidation: v })}
              />
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  <strong>Note:</strong> Disabling FDA rules will skip barcode, expiry date, brand name, and safety warning checks during label validation.
                </p>
              </div>
            </div>

            {/* Storage Management */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm xl:col-span-2">
              <SectionTitle icon="storage" label="Storage Management" />
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Export All Files
                </button>
                <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Import Files
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  Clear All Files
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-4">All data is stored in your browser's localStorage. Export regularly to avoid data loss.</p>
            </div>

          </div>
        </main>
      </div>

      {/* Clear Confirm Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2 text-red-600">⚠️ Clear All Data?</h3>
            <p className="text-sm text-slate-500 mb-6">This will permanently delete <strong>all files, history, and activity logs</strong>. This action <strong>cannot be undone</strong>.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleClearAll} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors">Yes, Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
