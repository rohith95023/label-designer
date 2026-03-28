import React, { useState } from 'react';
import { useLabel, LABEL_PRESETS } from '../context/LabelContext';
import { useTheme } from '../context/ThemeContext';
import AppLayout from '../components/common/AppLayout';

function SectionCard({ icon, iconGrad, title, children }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/20">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${iconGrad} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-white text-lg"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        <h2 className="font-bold text-sm uppercase tracking-wider text-on-surface">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0 mr-4">
        <p className="text-sm font-semibold text-on-surface">{label}</p>
        {desc && <p className="text-xs text-on-surface-variant mt-0.5">{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ease-spring shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          value
            ? 'bg-gradient-to-r from-primary to-tertiary shadow-glow-sm'
            : 'bg-surface-container-high dark:bg-surface-container'
        }`}
      >
        <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-card transition-transform duration-300 ease-spring ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { settings, updateSettings, getAllFiles, exportJSON } = useLabel();
  const { theme, toggleTheme } = useTheme();

  const [profileName, setProfileName] = useState(settings.profileName || 'Pharma Designer');
  const [confirmClear, setConfirmClear] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = () => {
    updateSettings({ profileName });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearAll = () => {
    // Legacy localStorage cleared, now transitioning to Cloud Data Management
    // In a production environment, this would call a backend 'reset' endpoint
    alert("Data clearing is currently handled through your Cloud Dashboard. Resetting local preferences.");
    setConfirmClear(false);
    window.location.reload(); 
  };

  const handleExportAll = () => {
    const allFiles = getAllFiles();
    const fullData = {};
    allFiles.forEach(f => {
      fullData[f.id] = {
        meta: { fileId: f.id, fileName: f.name, labelSize: f.labelSize, bgColor: f.bgColor },
        elements: f.elementsData,
        savedAt: f.updatedAt
      };
    });
    const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'all_pharma_labels.json'; a.click();
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
        const merged = [...existingIdx, ...idx].reduce((acc, v) => { acc[v.fileId] = v; return acc; }, {});
        localStorage.setItem('plabel_index', JSON.stringify(Object.values(merged)));
        alert(`Imported ${Object.keys(data).length} file(s) successfully.`);
      } catch { alert('Failed to import — invalid JSON file.'); }
    };
    reader.readAsText(file);
  };

  return (
    <AppLayout activePage="settings">
      <div className="p-6 lg:p-10 pb-24 max-w-5xl mx-auto">

        {/* Hero */}
        <div className="mb-10 animate-slide-up">
          <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Preferences</p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-gradient mb-2">Settings</h1>
          <p className="text-on-surface-variant text-sm max-w-lg">
            Customize your workspace, editor defaults, and compliance rules.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* User Settings */}
          <SectionCard icon="person" iconGrad="from-blue-500 to-blue-700" title="User Settings">
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Profile Name</label>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                className="input-premium"
                placeholder="Your name..."
              />
            </div>
            <div className="border-t border-outline-variant/20 pt-3">
              <Toggle
                label="Dark Mode"
                desc="Switch between light and dark interface"
                value={theme === 'dark'}
                onChange={toggleTheme}
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-250 ${
                saved
                  ? 'bg-secondary text-on-secondary shadow-[0_0_0_3px_rgba(5,150,105,0.2)]'
                  : 'btn-gradient'
              }`}
            >
              {saved ? (
                <><span className="material-symbols-outlined text-base animate-scale-in">check_circle</span> Saved!</>
              ) : (
                <><span className="material-symbols-outlined text-base">save</span> Save Changes</>
              )}
            </button>
          </SectionCard>

          {/* Editor Settings */}
          <SectionCard icon="tune" iconGrad="from-violet-500 to-purple-700" title="Editor Settings">
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Default Label Size</label>
              <select
                value={settings.defaultSize}
                onChange={e => updateSettings({ defaultSize: e.target.value })}
                className="input-premium"
              >
                {LABEL_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Units</label>
              <div className="flex gap-2">
                {['mm', 'px', 'in'].map(u => (
                  <button
                    key={u}
                    onClick={() => updateSettings({ units: u })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      settings.units === u
                        ? 'bg-gradient-to-br from-primary to-primary-container text-on-primary border-transparent shadow-glow-sm'
                        : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:bg-surface-container'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-outline-variant/20 pt-1">
              <Toggle
                label="Show Grid"
                desc="Display grid lines on the editor canvas"
                value={settings.gridEnabled}
                onChange={v => updateSettings({ gridEnabled: v })}
              />
            </div>
          </SectionCard>

          {/* Translation Settings */}
          <SectionCard icon="translate" iconGrad="from-sky-500 to-cyan-600" title="Translation Settings">
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">Default Language</label>
              <select
                value={settings.defaultLanguage}
                onChange={e => updateSettings({ defaultLanguage: e.target.value })}
                className="input-premium"
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
            <div className="border-t border-outline-variant/20 pt-1">
              <Toggle
                label="Auto-Translate"
                desc="Automatically translate label content when switching language"
                value={settings.autoTranslate}
                onChange={v => updateSettings({ autoTranslate: v })}
              />
            </div>
          </SectionCard>

          {/* Compliance Settings */}
          <SectionCard icon="verified_user" iconGrad="from-emerald-500 to-teal-700" title="Compliance Settings">
            <Toggle
              label="FDA Validation Rules"
              desc="Enforce FDA compliance checks when validating labels"
              value={settings.fdaValidation}
              onChange={v => updateSettings({ fdaValidation: v })}
            />
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-amber-500/8 to-orange-500/6 border border-amber-200/60 dark:border-amber-700/40">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-500 text-base mt-0.5 shrink-0"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  warning
                </span>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed">
                  Disabling FDA rules will skip barcode, expiry date, brand name, and safety warning checks during label validation.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Storage Management */}
          <div className="xl:col-span-2">
            <SectionCard icon="storage" iconGrad="from-slate-500 to-slate-700" title="Storage Management">
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={handleExportAll}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                  Export All Files
                </button>
                <label className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-95">
                  <span className="material-symbols-outlined text-lg">upload</span>
                  Import Files
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/60 transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">delete_forever</span>
                  Clear All Files
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">
                Your data is securely synchronized with the Pharma Cloud backend. Export regularly for offline backups.
              </p>
            </SectionCard>
          </div>

        </div>
      </div>

      {/* Confirm Modal */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-fade-in">
          <div className="glass-card rounded-3xl shadow-float p-8 max-w-sm w-full animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600 text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                delete_forever
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 text-on-surface">Clear All Data?</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              This will permanently delete <strong>all files, history, and activity logs</strong>.
              This action <strong>cannot be undone</strong>.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmClear(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-bold hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors shadow-[0_0_0_3px_rgba(220,38,38,0.2)]"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
