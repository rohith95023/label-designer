import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LabelPreview from '../common/LabelPreview';

export default function VersionComparisonModal({ isOpen, onClose, versionA, versionB }) {
  if (!versionA || !versionB) return null;

  const diffElements = (a, b) => {
    // Simple logic: highlight elements that don't match by ID/content
    const aMap = new Map(a.map(e => [e.id, e]));
    const bMap = new Map(b.map(e => [e.id, e]));
    
    const allIds = new Set([...aMap.keys(), ...bMap.keys()]);
    const changes = [];

    allIds.forEach(id => {
      const elA = aMap.get(id);
      const elB = bMap.get(id);
      if (!elA) changes.push({ id, type: 'added', el: elB });
      else if (!elB) changes.push({ id, type: 'removed', el: elA });
      else if (JSON.stringify(elA) !== JSON.stringify(elB)) {
        changes.push({ id, type: 'modified', elA, elB });
      }
    });

    return changes;
  };

  const changes = diffElements(versionA.designJson.elementsData, versionB.designJson.elementsData);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-7xl h-[90vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                  <span className="material-symbols-outlined text-2xl">difference</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Version Comparison</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analyzing changes between v{versionA.versionNo} and v{versionB.versionNo}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all">
                <span className="material-symbols-outlined text-slate-500">close</span>
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="flex-1 overflow-hidden flex">
              {/* Version A */}
              <div className="flex-1 border-r border-slate-100 flex flex-col">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="px-3 py-1 bg-slate-200 rounded-full text-[10px] font-black uppercase text-slate-600 tracking-wider">Older Version (v{versionA.versionNo})</span>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(versionA.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex-1 bg-slate-100 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
                  <div className="shadow-2xl scale-[0.8]">
                    <LabelPreview 
                      elements={versionA.designJson.elementsData} 
                      meta={{
                        labelSize: versionA.designJson.labelSize,
                        bgColor: versionA.designJson.bgColor || '#ffffff'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Version B */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-600 rounded-full text-[10px] font-black uppercase text-white tracking-wider">Newer Version (v{versionB.versionNo})</span>
                  <span className="text-[10px] font-bold text-indigo-400">{new Date(versionB.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex-1 bg-slate-100 flex items-center justify-center p-12 overflow-auto custom-scrollbar">
                  <div className="shadow-2xl scale-[0.8]">
                    <LabelPreview 
                      elements={versionB.designJson.elementsData} 
                      meta={{
                        labelSize: versionB.designJson.labelSize,
                        bgColor: versionB.designJson.bgColor || '#ffffff'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sidebar: Change List */}
              <div className="w-80 border-l border-slate-100 bg-white flex flex-col">
                <div className="p-4 border-b border-slate-100 font-bold text-xs uppercase tracking-widest text-slate-500">
                  Change Summary ({changes.length})
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {changes.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-400 font-medium">No visual differences detected</p>
                    </div>
                  ) : (
                    changes.map((c, i) => (
                      <div key={i} className={`p-3 rounded-xl border text-left flex items-start gap-3 ${
                        c.type === 'added' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        c.type === 'removed' ? 'bg-red-50 border-red-100 text-red-700' :
                        'bg-blue-50 border-blue-100 text-blue-700'
                      }`}>
                        <span className="material-symbols-outlined text-[18px] opacity-60">
                          {c.type === 'added' ? 'add_circle' : c.type === 'removed' ? 'remove_circle' : 'edit_square'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-black uppercase tracking-tight truncate">{(c.el || c.elA).name || 'Unnamed Element'}</p>
                          <p className="text-[10px] font-medium opacity-80 leading-tight mt-0.5">
                            {c.type === 'added' ? 'Inserted into layout' : c.type === 'removed' ? 'Deleted from layout' : 'Modified properties'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-[12px] font-bold hover:bg-slate-100 transition-all"
              >
                Close Comparison
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
