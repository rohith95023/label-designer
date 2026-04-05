import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLabel } from '../context/LabelContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';


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
    color: 'bg-white',
    icon: 'description',
    label: 'Total Labels',
    value: fileCount,
    sub: 'Files created',
    onClick: () => navigate('/history'),
    border: 'border-slate-200',
    iconColor: 'bg-blue-600',
  },
  {
    color: 'bg-white',
    icon: 'file_download_done',
    label: 'Total Exports',
    value: totalExports,
    sub: 'Successful downloads',
    onClick: () => navigate('/history'),
    border: 'border-slate-200',
    iconColor: 'bg-emerald-600',
  },
  {
    color: 'bg-white',
    icon: 'schedule',
    label: 'Last Edited',
    value: null,
    text: lastEdited,
    sub: 'Most recent project',
    onClick: openCb,
    border: 'border-slate-200',
    iconColor: 'bg-amber-600',
  },
];

const QUICK_ACTIONS = (handleNew, navigate, handleUpload) => [
  {
    icon: 'add_box',
    label: 'Create New Label',
    desc: 'Start from a blank canvas',
    bg: 'bg-white',
    border: 'border-slate-200',
    iconColor: 'bg-blue-600',
    onClick: handleNew,
  },
  {
    icon: 'auto_awesome_mosaic',
    label: 'Use Template',
    desc: 'Pick from the library',
    bg: 'bg-white',
    border: 'border-slate-200',
    iconColor: 'bg-emerald-600',
    onClick: () => navigate('/assets'),
  },
  {
    icon: 'upload_file',
    label: 'Open JSON File',
    desc: 'Import an existing label',
    bg: 'bg-white',
    border: 'border-slate-200',
    iconColor: 'bg-slate-700',
    onClick: handleUpload,
  },
];

export default function Dashboard() {
  const { user: currentUser, accessToken } = useAuth();
  const { newFile, openFileById, getAllFiles, openFileFromJSON, activityLogs, loading: labelLoading } = useLabel();
  const navigate = useNavigate();
  const allFiles = useMemo(() => getAllFiles().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [getAllFiles]);
  const fileInputRef = useRef(null);

  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  const canApprove = currentUser?.role?.name === 'ADMIN' || currentUser?.role?.name === 'APPROVER';

  useEffect(() => {
    if (canApprove && accessToken) {
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
  }, [canApprove, accessToken]);

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
    <div className="p-6 lg:p-10 pb-24 max-w-6xl mx-auto">

        {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <motion.div 
          className="mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-[var(--color-primary-mid)] font-black text-[11px] uppercase tracking-[0.3em] mb-3">Workspace Overview</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-[var(--color-primary-dark)] mb-4">
            Welcome to <span className="text-[var(--color-secondary)]">Dashboard</span>
          </h1>
        
        </motion.div>

        {labelLoading ? (
          <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* â”€â”€ Approvals Section (Conditional) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                  <div className="p-10 flex justify-center"><div className="um-spinner w-6 h-6" /></div>
                ) : approvals.length === 0 ? (
                  <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">fact_check</span>
                    <p className="text-xs text-slate-500 font-medium">All caught up! No labels waiting for approval.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {approvals.map(app => (
                      <div key={app.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">assignment_late</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{app.label.name}</p>
                            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                              Version {app.versionNo} Â• Requested by {app.requestedBy.username}
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
            {/* â”€â”€ Stat Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {statCards.map((card, i) => (
                <motion.button
                  key={i}
                  onClick={card.onClick}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`relative overflow-hidden rounded-[24px] p-7 text-left flex flex-col justify-between gap-6 border shadow-sm ${card.color} ${card.border}`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconColor} flex items-center justify-center text-white shadow-sm`}>
                      <span className="material-symbols-outlined text-xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {card.icon}
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[var(--color-primary-dark)]/20 text-lg">arrow_forward</span>
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--color-primary-dark)]/40 mb-1">
                      {card.label}
                    </p>
                    {card.value !== null ? (
                      <p className="text-5xl font-black text-[var(--color-primary-dark)] tracking-tighter">
                        <AnimatedNumber target={card.value} />
                      </p>
                    ) : (
                      <p className="text-xl font-black text-[var(--color-primary-dark)] truncate tracking-tight" title={card.text}>
                        {card.text}
                      </p>
                    )}
                    <p className="text-[11px] font-bold text-[var(--color-primary-dark)]/60 mt-1">{card.sub}</p>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* â”€â”€ Quick Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-[var(--color-primary-dark)] tracking-tight uppercase tracking-widest text-[12px] opacity-40">Creative Workflow</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, i) => (
                  <motion.button
                    key={i}
                    onClick={action.onClick}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + (0.1 * i), duration: 0.5 }}
                    whileHover={{ scale: 1.03, y: -5 }}
                    className={`group flex flex-col items-center justify-center gap-5 p-10 rounded-[32px] border ${action.bg} ${action.border} transition-all relative overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-black/5 active:scale-[0.98] animate-slide-up`}
                  >
                    <div className={`w-16 h-16 rounded-[22px] ${action.iconColor} flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300`}>
                      <span className="material-symbols-outlined text-white text-3xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {action.icon}
                      </span>
                    </div>
                    <div className="text-center relative z-10">
                      <p className="font-black text-[15px] text-[var(--color-primary-dark)] tracking-tight">{action.label}</p>
                      <p className="text-[11px] font-medium text-[var(--color-primary-dark)]/50 mt-1">{action.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
              <input ref={fileInputRef} id="json-upload" type="file" accept=".json" onChange={handleJSONUpload} className="hidden" />
            </section>
          </>
        )}

      </div>
  );
}
