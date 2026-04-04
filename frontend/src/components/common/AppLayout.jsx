import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLabel } from '../../context/LabelContext';
import GlobalHeader from './GlobalHeader';
import GlobalSecondaryToolbar from './GlobalSecondaryToolbar';

const NAV_ITEMS = [
  { key: 'dashboard', to: '/', icon: 'grid_view', label: 'Dashboard', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'dashboard' },
  { key: 'assets', to: '/assets', icon: 'auto_awesome_mosaic', label: 'Template Library', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'templates' },
  { key: 'saved-templates', to: '/saved-templates', icon: 'folder_open', label: 'Saved Labels', roles: ['ADMIN', 'REVIEWER', 'OPERATOR'], permission: 'saved-templates' },
  { key: 'editor', to: '/editor', icon: 'edit_document', label: 'Label Editor', roles: ['ADMIN', 'OPERATOR'], permission: 'editor' },
  { key: 'translation', to: '/translation', icon: 'translate', label: 'Translation', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'translation' },
  { key: 'history', to: '/history', icon: 'history', label: 'History', roles: ['ADMIN', 'REVIEWER', 'OPERATOR'], permission: 'history' },
  { key: 'print', to: '/print-requests', icon: 'print', label: 'Print Center', roles: ['ADMIN', 'OPERATOR'], permission: 'print' },
  
  // Masters Section
  { key: 'masters', to: '/masters/label-stocks', icon: 'inventory_2', label: 'Label Stocks', roles: ['ADMIN'], permission: 'masters' },
  { key: 'languages', to: '/masters/languages', icon: 'language', label: 'Languages', roles: ['ADMIN'], permission: 'masters' },
  
  { key: 'users', to: '/admin/users', icon: 'group', label: 'Users', roles: ['ADMIN'], permission: 'users' },
  { key: 'settings', to: '/settings', icon: 'settings', label: 'Settings', roles: ['ADMIN'], permission: 'settings' },
];

export default function AppLayout({ children, activePage = '', searchBar = null }) {
  const { user, logout, logoutLoading } = useAuth();
  const { settings } = useLabel();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const direction = settings?.direction?.toLowerCase() || 'ltr';

  const hasPermission = (item) => {
    if (!user) return false;
    // Admins have override access, but we still respect roles for other types
    if (user.role === 'ADMIN') return true;
    
    // Check if the role is allowed at all
    if (!item.roles.includes(user.role)) return false;

    // Check modular permissions (Restrictive by default)
    if (item.permission) {
      const permissions = user.permissions || [];
      const p = permissions.find(p => 
        p.module.toLowerCase() === item.permission.toLowerCase() && 
        p.event === 'VIEW'
      );
      return p ? p.allowed : false;
    }

    return true; // Default to true if no permission defined but role matches
  };

  const filteredNavItems = NAV_ITEMS.filter(hasPermission);

  return (
    <div className={`bg-mesh text-on-surface min-h-screen ${direction === 'rtl' ? 'rtl-mode' : ''}`} dir={direction}>
      {/* Logout Animation Overlay */}
      {logoutLoading && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-mesh/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }}></div>
              <div className="absolute inset-4 rounded-2xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-lg shadow-primary/20 animate-bounce-subtle">
                <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-gradient mb-2 tracking-tight">Logging Out</h2>
            <p className="text-on-surface-variant font-medium tracking-wide flex items-center gap-1.5 opacity-80">
              Terminating session environment
              <span className="flex gap-1 ml-1">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:200ms]"></span>
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse [animation-delay:400ms]"></span>
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Global Dual-Header System ──────────────────────────────────── */}
      <GlobalHeader 
        activePage={activePage} 
        leftContent={
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-all shrink-0"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-xl">
              {collapsed ? 'menu_open' : 'menu'}
            </span>
          </button>
        }
      />
      
      <GlobalSecondaryToolbar>
        {/* Left: Section Identity / Breadcrumbs */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-xl border border-white/40 shadow-sm backdrop-blur-sm">
          <span className="material-symbols-outlined text-[18px] text-[var(--color-primary-dark)]/60">
            {NAV_ITEMS.find(n => n.key === activePage)?.icon || 'explore'}
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-dark)]">
            {activePage}
          </span>
        </div>

        <div className="flex-1" />

        {/* Center: Search / Pagination / Filters Slot */}
        {searchBar && (
          <div className="max-w-md w-full animate-in fade-in slide-in-from-top-2">
            {searchBar}
          </div>
        )}

        <div className="flex-1" />

        {/* Right: Page Actions Slot */}
        <div className="flex items-center gap-2">
          <button 
            className="h-8 px-4 bg-white/40 border border-white/60 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-dark)] hover:bg-white/60 transition-all shadow-sm"
          >
            Refresh
          </button>
        </div>
      </GlobalSecondaryToolbar>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex pt-16 h-screen overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col h-full bg-white border-r border-outline-variant/30 shrink-0 overflow-hidden transition-all duration-350 ease-out-expo ${collapsed ? 'w-[68px]' : 'w-64'
            }`}
        >
          {/* Logo area inside sidebar */}
          <div className={`flex items-center h-16 border-b border-outline-variant/20 px-4 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                medical_services
              </span>
            </div>
            {!collapsed && (
              <span className="font-extrabold text-[15px] tracking-tight text-gradient leading-none">
                Clinical Label Design
              </span>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto scrollbar-hide">
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-outline px-2 mb-1 mt-1">
                Main Menu
              </p>
            )}
            {filteredNavItems.filter(n => !['editor', 'translation'].includes(n.key)).map(item => {
              const isActive = activePage === item.key;
              if (collapsed) {
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    title={item.label}
                    className={`sidebar-item-collapsed w-10 h-10 mx-auto ${isActive ? 'active' : ''}`}
                  >
                    <span
                      className="material-symbols-outlined text-[22px]"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                  </Link>
                );
              }
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <span
                    className="material-symbols-outlined text-[22px] shrink-0"
                    style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: version badge */}
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0 page-enter custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
