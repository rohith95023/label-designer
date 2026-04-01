import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import AppLayout from '../components/common/AppLayout';

/* Animated number counter */
function AnimatedNumber({ target, duration = 900 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * target));
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return <>{val}</>;
}

const STAT_CARDS = (fileCount, totalExports, lastEdited, navigate, openCb) => [
  {
    color: 'stat-card-blue',
    icon: 'description',
    label: 'Total Labels',
    value: fileCount,
    sub: 'Files created',
    onClick: () => navigate('/history'),
    gradient: 'from-blue-500/10 to-blue-600/5',
    iconGrad: 'from-blue-500 to-blue-700',
  },
  {
    color: 'stat-card-green',
    icon: 'file_download_done',
    label: 'Total Exports',
    value: totalExports,
    sub: 'Successful downloads',
    onClick: () => navigate('/history'),
    gradient: 'from-emerald-500/10 to-emerald-600/5',
    iconGrad: 'from-emerald-500 to-emerald-700',
  },
  {
    color: 'stat-card-amber',
    icon: 'schedule',
    label: 'Last Edited',
    value: null,
    text: lastEdited,
    sub: 'Most recent project',
    onClick: openCb,
    gradient: 'from-amber-500/10 to-orange-500/5',
    iconGrad: 'from-amber-400 to-orange-500',
  },
];

const QUICK_ACTIONS = (handleNew, navigate, handleUpload) => [
  {
    icon: 'add_box',
    label: 'Create New Label',
    desc: 'Start from a blank canvas',
    gradient: 'from-blue-500 to-blue-700',
    glow: 'rgba(37,99,235,0.25)',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-100 dark:border-blue-900/40',
    onClick: handleNew,
  },
  {
    icon: 'auto_awesome_mosaic',
    label: 'Use Template',
    desc: 'Pick from the library',
    gradient: 'from-violet-500 to-purple-700',
    glow: 'rgba(124,58,237,0.25)',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-100 dark:border-violet-900/40',
    onClick: () => navigate('/assets'),
  },
  {
    icon: 'upload_file',
    label: 'Open JSON File',
    desc: 'Import an existing label',
    gradient: 'from-emerald-500 to-teal-700',
    glow: 'rgba(5,150,105,0.25)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-100 dark:border-emerald-900/40',
    onClick: handleUpload,
  },
];

export default function Dashboard() {
  const { user: currentUser } = useAuth();
  const { newFile, openFileById, getAllFiles, openFileFromJSON, activityLogs, loading: labelLoading } = useLabel();
  const navigate = useNavigate();
  const allFiles = useMemo(() => getAllFiles().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [getAllFiles]);
  const fileInputRef = useRef(null);

  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const canApprove = currentUser?.role?.name === 'ADMIN' || currentUser?.role?.name === 'APPROVER';

  useEffect(() => {
    if (canApprove) {
      const fetchApprovals = async () => {
        setApprovalsLoading(true);
        try {
          const data = await api.getApprovals();
          setApprovals(data.filter(a => a.status === 'PENDING'));
        } catch (err) {
          console.error("Failed to fetch approvals:", err);
        } finally {
          setApprovalsLoading(false);
        }
      };
      fetchApprovals();
    }
  }, [canApprove]);

  const totalExports = useMemo(() => 
    (activityLogs || []).filter(log => log?.action === 'Exported JSON').length
  , [activityLogs]);

  const lastEdited = allFiles.length > 0 ? allFiles[0].name || 'Untitled' : 'None';

  const handleNewFile = () => { newFile(); navigate('/editor'); };
  const handleOpenFile = (id) => { openFileById(id); navigate('/editor'); };
  const handleNoopUpload = () => fileInputRef.current?.click();
  const handleJSONUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { openFileFromJSON(ev.target.result); navigate('/editor'); };
    reader.readAsText(file);
    e.target.value = null;
  };

  const statCards = STAT_CARDS(allFiles.length, totalExports, lastEdited, navigate,
    () => allFiles[0] && handleOpenFile(allFiles[0].id));
  const quickActions = QUICK_ACTIONS(handleNewFile, navigate, handleNoopUpload);

  return (
    <AppLayout activePage="dashboard">
      <div className="p-6 lg:p-10 pb-24 max-w-6xl mx-auto">

        {/* ── Hero ───────────────────────────────────────────────────── */}
        <div className="mb-10 animate-slide-up">
          <p className="text-primary font-bold text-[11px] uppercase tracking-[0.2em] mb-2">Welcome back</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter leading-tight text-gradient mb-3">
            Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm max-w-md">
            Manage, design, and export pharmaceutical labels — all in one place.
          </p>
        </div>

        {labelLoading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Approvals Section (Conditional) ────────────────────────── */}
            {canApprove && (
              <section className="mb-10 animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-on-surface tracking-tight">Pending Approvals</h2>
                    {approvals.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-4 ring-red-500/10">
                        {approvals.length}
                      </span>
                    )}
                  </div>
                </div>
                
                {approvalsLoading ? (
                  <div className="p-10 flex justify-center opacity-30"><div className="um-spinner w-6 h-6" /></div>
                ) : approvals.length === 0 ? (
                  <div className="p-8 glass-card rounded-2xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-outline/30 text-3xl mb-2">fact_check</span>
                    <p className="text-xs text-on-surface-variant font-medium">All caught up! No labels waiting for approval.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvals.map(app => (
                      <div key={app.id} className="glass-card rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">assignment_late</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{app.label.name}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                              Version {app.versionNo} • Requested by {app.requestedBy.username}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleOpenFile(app.label.id)}
                          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:shadow-glow-sm transition-all"
                        >
                          Review
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            {/* ── Stat Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {statCards.map((card, i) => (
                <button
                  key={i}
                  onClick={card.onClick}
                  className={`glass-card rounded-2xl p-6 text-left flex flex-col justify-between gap-4 ${card.color} animate-slide-up stagger-${i + 1}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="stat-icon-bg">
                      <span className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {card.icon}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-outline/40 text-lg">open_in_new</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
                      {card.label}
                    </p>
                    {card.value !== null ? (
                      <p className="text-4xl font-black text-on-surface">
                        <AnimatedNumber target={card.value} />
                      </p>
                    ) : (
                      <p className="text-xl font-bold text-on-surface truncate" title={card.text}>
                        {card.text}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-0.5">{card.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Quick Actions ───────────────────────────────────────────── */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-on-surface tracking-tight">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.onClick}
                    className={`group flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border ${action.bg} ${action.border} transition-all duration-250 hover:-translate-y-1 active:scale-[0.97] animate-slide-up stagger-${i + 4} relative overflow-hidden`}
                  >
                    {/* Glow orb */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${action.glow} 0%, transparent 70%)`,
                      }}
                    />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-float group-hover:scale-110 transition-transform duration-250 ease-spring`}>
                      <span className="material-symbols-outlined text-white text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {action.icon}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm text-on-surface">{action.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <input ref={fileInputRef} id="json-upload" type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
            </section>
          </>
        )}

        {/* ── Recent Files Section Removed ── */}
      </div>
    </AppLayout>
  );
}
