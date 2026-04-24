import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
import Sidebar from './Sidebar';
import LiquidBackground from './LiquidBackground';
import { useI18n } from '../i18n/useI18n';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-vg-dark relative">
      <LiquidBackground />
      {/* SVG filter provides displacement-based lensing for liquid glass */}
      <svg className="absolute w-0 h-0" aria-hidden focusable="false">
        <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="70" />
        </filter>
      </svg>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* iOS 26 Liquid Glass top bar */}
      <header className="fixed top-3 inset-x-3 h-14 z-30 flex items-center justify-between px-5 rounded-full liquid-glass">
        <div className="flex items-center min-w-0 gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={t('layout.openMenu')}
            aria-controls="app-sidebar"
            aria-expanded={sidebarOpen}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">VG</span>
            </div>
            <span className="text-white font-semibold">VisionGuard</span>
          </div>
        </div>
        <UserButton afterSignOutUrl="/" />
      </header>

      <main className="min-h-screen">
        <div className="h-20 shrink-0" aria-hidden />
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
