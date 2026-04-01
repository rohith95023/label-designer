import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { key: 'dashboard', to: '/', icon: 'grid_view', label: 'Dashboard', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'dashboard' },
  { key: 'assets', to: '/assets', icon: 'auto_awesome_mosaic', label: 'Template Library', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'templates' },
  { key: 'saved-templates', to: '/saved-templates', icon: 'folder_open', label: 'Saved Labels', roles: ['ADMIN', 'REVIEWER', 'OPERATOR'], permission: 'saved-templates' },
  { key: 'editor', to: '/editor', icon: 'edit_document', label: 'Label Editor', roles: ['ADMIN', 'OPERATOR'], permission: 'editor' },
  { key: 'translation', to: '/translation', icon: 'translate', label: 'Translation', roles: ['ADMIN', 'REVIEWER', 'OPERATOR', 'EXTERNAL'], permission: 'translation' },
  { key: 'history', to: '/history', icon: 'history', label: 'History', roles: ['ADMIN', 'REVIEWER', 'OPERATOR'], permission: 'history' },
  { key: 'users', to: '/admin/users', icon: 'group', label: 'Users', roles: ['ADMIN'], permission: 'users' },
  { key: 'settings', to: '/settings', icon: 'settings', label: 'Settings', roles: ['ADMIN'], permission: 'settings' },
];

export default function AppLayout({ children, activePage = '', searchBar = null }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, logoutLoading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    <div className="bg-mesh text-on-surface min-h-screen">
      {/* Logout Animation Overlay */}
      {logoutLoading && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-mesh/80 dark:bg-[#0D1117]/90 backdrop-blur-2xl animate-in fade-in duration-500">
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
              Clinical Label Design
            </span>
          </button>
        </div>

        <div className="hidden md:flex flex-1 items-center justify-center gap-1 bg-surface-container-low/60 dark:bg-slate-900/40 backdrop-blur-md px-1.5 py-1.5 border border-outline-variant/10 rounded-full max-w-xl mx-auto">
          {filteredNavItems.filter(n => ['dashboard', 'assets', 'editor', 'translation'].includes(n.key)).map(item => (
            <Link
              key={item.key}
              to={item.to}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-tight transition-all duration-200 ${activePage === item.key
                  ? 'bg-primary text-on-primary shadow-glow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-blue-100 hover:bg-slate-100 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: search + theme toggle + User */}
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

          {/* User Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 pl-3 rounded-full hover:bg-surface-container dark:hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col items-end text-right hidden sm:flex">
                <span className="text-[12px] font-bold leading-none">{user?.username}</span>
                <span className="text-[10px] text-outline font-medium uppercase tracking-wider">{user?.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-glow-lg p-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                  <p className="text-[11px] font-bold text-outline uppercase tracking-widest">System Identity</p>
                  <p className="text-[13px] font-medium truncate">{user?.email}</p>
                </div>
                <button 
                  onClick={() => navigate('/settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium hover:bg-surface-container dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  Security Profile
                </button>
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-error hover:bg-error/10 dark:hover:bg-error/20 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex pt-16 h-screen overflow-hidden">

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <aside
          className={`hidden lg:flex flex-col h-full bg-white dark:bg-[#0F1420] border-r border-outline-variant/30 dark:border-white/5 shrink-0 overflow-hidden transition-all duration-350 ease-out-expo ${collapsed ? 'w-[68px]' : 'w-64'
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
