import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

/**
 * Premium Global Header (Primary Branding Bar)
 * Inspired by Canva's dark-mode branding header.
 */
export default function GlobalHeader({ 
  leftContent, 
  centerContent, 
  rightContent,
  activePage = ''
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="h-[64px] bg-[var(--color-primary-dark)] flex items-center justify-between px-4 gap-4 shrink-0 relative z-[1000] shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
    >
      {/* ── Left Section: Identity & Contextual Menus ── */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10 shadow-sm">
            <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
          </div>
          <span className="text-[15px] font-black tracking-tight text-white uppercase translate-y-[1px] hidden lg:block">PharmaPrecise</span>
        </Link>

        {leftContent && (
          <>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            {leftContent}
          </>
        )}
      </div>

      {/* ── Center Section: Navigation or Context ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
        {centerContent || (
          <nav className="flex items-center gap-1">
            {[
              { label: 'Dashboard', to: '/' },
              { label: 'Templates', to: '/assets' },
              { label: 'Label Editor', to: '/editor' },
              { label: 'Translation', to: '/translation' },
            ].map(link => {
              const isActive = 
                activePage === link.label.toLowerCase() || 
                (link.to === '/' && activePage === 'dashboard') ||
                (link.to === '/assets' && activePage === 'assets') ||
                (link.to === '/editor' && activePage === 'editor') ||
                (link.to === '/translation' && activePage === 'translation');

              return (
                <Link 
                  key={link.to} 
                  to={link.to}
                  className={`px-5 py-2 rounded-xl text-[13px] font-bold transition-all ${
                    isActive 
                      ? 'bg-white/10 text-white border border-white/10' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Right Section: Tools, Profile, Identity ── */}
      <div className="flex items-center gap-4">
        {rightContent}

        <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
          >
            <div className="flex flex-col items-end text-right hidden sm:flex">
                <span className="text-[11px] font-black text-white/90 leading-none mb-0.5">{user?.username}</span>
                <span className="text-[9px] text-[var(--color-primary)] font-black uppercase tracking-[0.2em] opacity-100">{user?.role}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-black text-sm border-2 border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 p-2 z-[2100]"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Signed in as</p>
                  <p className="text-[13px] font-bold text-slate-900 truncate">{user?.email}</p>
                </div>
                
                <button 
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary-dark)] rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">account_circle</span>
                  Security Profile
                </button>
                
                <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
