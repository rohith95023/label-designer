import React, { useState, useEffect } from 'react';

const MODULE_CONFIG = [
  { id: 'dashboard',   label: 'Dashboard',    icon: 'dashboard',        desc: 'Main overview and clinical summary' },
  { id: 'templates',   label: 'Template Lib', icon: 'inventory_2',      desc: 'Validated system template library' },
  { id: 'saved-templates', label: 'Central Repo', icon: 'folder_managed',   desc: 'User saved labels and repository' },
  { id: 'editor',      label: 'Label Designer',icon: 'edit_square',      desc: 'High-fidelity label editing tools' },
  { id: 'translation', label: 'Translation',  icon: 'translate',        desc: 'Multi-language clinical translation' },
  { id: 'history',     label: 'Audit Trail',  icon: 'history',          desc: 'FDA 21 CFR Part 11 audit history' },
  { id: 'settings',    label: 'System Config',icon: 'settings',         desc: 'Global application preferences' },
  { id: 'users',       label: 'User Manager', icon: 'group',            desc: 'IAM and permission oversight' },
];

const EVENTS = [
  { id: 'VIEW',    label: 'View',    icon: 'visibility' },
  { id: 'CREATE',  label: 'Create',  icon: 'add_circle' },
  { id: 'EDIT',    label: 'Modify',  icon: 'edit' },
  { id: 'DELETE',  label: 'Purge',   icon: 'delete_forever' },
  { id: 'APPROVE', label: 'Approve', icon: 'verified_user' },
];

const PermissionMatrix = ({ permissions, onChange }) => {
  const [localPermissions, setLocalPermissions] = useState(permissions || []);

  useEffect(() => {
    setLocalPermissions(permissions || []);
  }, [permissions]);

  const handleToggle = (module, event) => {
    const existingIndex = localPermissions.findIndex(
      p => p.module === module && p.event === event
    );

    let newPermissions = [...localPermissions];
    if (existingIndex > -1) {
      newPermissions[existingIndex] = {
        ...newPermissions[existingIndex],
        allowed: !newPermissions[existingIndex].allowed
      };
    } else {
      newPermissions.push({ module, event, allowed: true });
    }

    setLocalPermissions(newPermissions);
    onChange(newPermissions);
  };

  const isAllowed = (module, event) => {
    const p = localPermissions.find(p => p.module === module && p.event === event);
    return p ? p.allowed : false;
  };

  return (
    <div className="permission-matrix-container mt-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm">
          <span className="material-symbols-outlined text-xl">shield_person</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface tracking-tight">Access Control Matrix</h3>
          <p className="text-[10px] text-on-surface-variant font-medium">Define modular operational permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODULE_CONFIG.map(config => {
          const hasPageAccess = isAllowed(config.id, 'VIEW');
          
          return (
            <div 
              key={config.id} 
              className={`glass-card rounded-[24px] p-5 border transition-all duration-300 ${
                hasPageAccess 
                  ? 'border-primary/20 bg-primary/5 ring-1 ring-primary/5 shadow-glow-sm' 
                  : 'border-outline-variant/10 bg-surface-container-lowest'
              }`}
            >
              {/* Card Header: Module Identity + Main Toggle */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                    hasPageAccess ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'
                  }`}>
                    <span className="material-symbols-outlined text-xl">{config.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface">{config.label}</h4>
                    <p className="text-[10px] text-on-surface-variant font-medium opacity-80">{config.desc}</p>
                  </div>
                </div>

                {/* Main Visibility Switch */}
                <button 
                  type="button"
                  onClick={() => handleToggle(config.id, 'VIEW')}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none border-2 ${
                    hasPageAccess ? 'bg-primary border-primary' : 'bg-surface-container-highest border-transparent'
                  }`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    hasPageAccess ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Action Subset Grid */}
              <div className={`space-y-2 pt-4 border-t border-outline-variant/5 transition-all duration-500 ${
                hasPageAccess ? 'opacity-100' : 'opacity-20 pointer-events-none'
              }`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Operational Controls</p>
                <div className="flex flex-wrap gap-2">
                  {EVENTS.filter(e => e.id !== 'VIEW').map(event => {
                    const active = isAllowed(config.id, event.id);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => handleToggle(config.id, event.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          active 
                            ? 'bg-primary/10 border-primary/20 text-primary shadow-glow-xs scale-[1.05]' 
                            : 'bg-surface-container-low border-outline-variant/10 text-on-surface-variant hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {active ? 'check_circle' : event.icon}
                        </span>
                        {event.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Warning for restricted modules */}
      <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-4">
        <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
        <div className="flex-1">
          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1 tracking-tight">Segregation of Duties (SoD) Note</p>
          <p className="text-[10px] text-amber-700/80 dark:text-amber-300/60 leading-relaxed">
            Changing these permissions will take effect upon the user's next session initialization. 
            All modifications to the access matrix are captured in the System Integrity Audit Log.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;
