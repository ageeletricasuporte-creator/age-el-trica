/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompanyPortal } from './components/CompanyPortal';
import { PublicSite } from './components/PublicSite';
import { AdminPanel } from './components/admin/AdminPanel';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'portal' | 'app' | 'terminal-login' | 'terminal'>('portal');
  const [publicTab, setPublicTab] = useState<'home' | 'servicos' | 'sobre' | 'contato'>('home');

  // Initialize and list popstate/hash triggers to enable physical back-forward phone controls
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // Match pathnames or hash values to cover all possible hosted configurations, subfolders, the index.html file, or hashes.
      const isApp = path.endsWith('/app') || path.endsWith('/app/') || hash === '#/app' || hash === '#app';
      const isTerminalLogin = path.endsWith('/terminal-login') || path.endsWith('/terminal-login/') || hash === '#/terminal-login' || hash === '#terminal-login';
      const isTerminal = path.endsWith('/terminal') || path.endsWith('/terminal/') || hash === '#/terminal' || hash === '#terminal';

      if (isApp) {
        setCurrentRoute('app');
      } else if (isTerminalLogin) {
        setCurrentRoute('terminal-login');
      } else if (isTerminal) {
        setCurrentRoute('terminal');
      } else {
        setCurrentRoute('portal');
      }
    };

    handleRouteSync();
    window.addEventListener('popstate', handleRouteSync);
    window.addEventListener('hashchange', handleRouteSync);
    return () => {
      window.removeEventListener('popstate', handleRouteSync);
      window.removeEventListener('hashchange', handleRouteSync);
    };
  }, []);

  const navigateTo = (route: 'portal' | 'app' | 'terminal-login' | 'terminal') => {
    setCurrentRoute(route);
    const hash = route === 'portal' ? '' : `#/${route}`;
    try {
      window.history.pushState({ route }, '', hash || '/');
    } catch (e) {
      window.location.hash = hash;
    }
  };

  return (
    <div className="bg-[#050505] text-white min-h-screen border-t-4 border-[#f2b705] font-sans selection:bg-[#f2b705] selection:text-black overflow-x-hidden w-full max-w-full">
      {currentRoute === 'portal' && (
        <CompanyPortal 
          onSelectApp={() => navigateTo('app')} 
          onSelectTerminal={() => navigateTo('terminal-login')} 
        />
      )}

      {currentRoute === 'app' && (
        <PublicSite
          onNavigateToAdmin={() => navigateTo('portal')}
          onNavigateToRequest={() => {
            setPublicTab('contato');
            // Smooth scroll to top/form
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          publicTab={publicTab}
          setPublicTab={setPublicTab}
        />
      )}

      {(currentRoute === 'terminal-login' || currentRoute === 'terminal') && (
        <AdminPanel
          currentRoute={currentRoute}
          onNavigateToRoute={navigateTo}
          onBackToSite={() => navigateTo('portal')}
        />
      )}
    </div>
  );
}
