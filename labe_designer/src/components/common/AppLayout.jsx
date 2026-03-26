import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { key: 'dashboard',    to: '/',            icon: 'grid_view',            label: 'Dashboard' },
  { key: 'assets',       to: '/assets',      icon: 'auto_awesome_mosaic',  label: 'Template Library' },
  { key: 'editor',       to: '/editor',      icon: 'edit_document',        label: 'Label Editor' },
  { key: 'translation',  to: '/translation', icon: 'translate',            label: 'Translation' },
  { key: 'history',      to: '/history',     icon: 'history',              label: 'History' },
  { key: 'settings',     to: '/settings',    icon: 'settings',             label: 'Settings' },
];

export default function AppLayout({ children, activePage = '', searchBar = null }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-mesh text-on-surface min-h-screen">

      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 glass-header h-16 flex items-center justify-between px-6 gap-4">
        {/* Left: burger + logo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <span className="material-symbols-outlined text-xl">
              {collapsed ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* Brand wordmark */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-glow-sm shrink-0">
              <span className="material-symbols-outlined text-white text-lg"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                medical_services
              </span>
            </div>
            <span className="hidden sm:block font-extrabold text-[16px] tracking-tight text-gradient select-none">
              PharmaLabel
            </span>
          </button>
        </div>

        {/* Center: top navigation (lg+) */}
          <div className="hidden md:flex flex-1 items-center justify-center gap-1 bg-surface-container-low/60 dark:bg-slate-900/40 backdrop-blur-md px-1.5 py-1.5 border border-outline-variant/10 rounded-full max-w-xl mx-auto">
          {NAV_ITEMS.filter(n => ['dashboard','assets','editor','translation'].includes(n.key)).map(item => (
            <Link
              key={item.key}
              to={item.to}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-tight transition-all duration-200 ${
                activePage === item.key
                  ? 'bg-primary text-on-primary shadow-glow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
          </div>

        {/* Right: search + theme toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {searchBar && (
            <div className="hidden md:block">
              {searchBar}
            </div>
          )}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="p-2 rounded-xl text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90 group"
          >
            <span
              className="material-symbols-outlined text-xl transition-transform duration-300 group-hover:rotate-12"
              style={{ fontVariationSettings: theme === 'dark' ? "'FILL' 1" : "'FILL' 0" }}
            >
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex pt-16 h-screen overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col h-full bg-white dark:bg-[#0F1420] border-r border-outline-variant/30 dark:border-white/5 shrink-0 overflow-hidden transition-all duration-350 ease-out-expo ${
            collapsed ? 'w-[68px]' : 'w-64'
          }`}
        >
          {/* Logo area inside sidebar */}
          <div className={`flex items-center h-16 border-b border-outline-variant/20 dark:border-white/5 px-4 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-base"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
                medical_services
              </span>
            </div>
            {!collapsed && (
              <span className="font-extrabold text-[15px] tracking-tight text-gradient leading-none">
                PharmaLabel
              </span>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto scrollbar-hide">
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-outline px-2 mb-1 mt-1">
                Navigation
              </p>
            )}
            {NAV_ITEMS.map(item => {
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
          {!collapsed && (
            <div className="p-4 border-t border-outline-variant/20 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/5 to-tertiary/5 border border-primary/10">
                <span className="material-symbols-outlined text-primary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <div>
                  <p className="text-[11px] font-bold text-primary leading-none">FDA Ready</p>
                  <p className="text-[10px] text-outline">Compliance v2.0</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0 page-enter custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
