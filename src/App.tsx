/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CompanyPortal } from './components/CompanyPortal';
import { PublicSite } from './components/PublicSite';
import { AdminPanel } from './components/admin/AdminPanel';
import { AppTecnico } from './components/AppTecnico';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'portal' | 'app' | 'terminal-login' | 'terminal' | 'app-tecnico'>('app');
  const [publicTab, setPublicTab] = useState<'home' | 'servicos' | 'sobre' | 'contato'>('home');

  // Initialize and list popstate/hash triggers to enable physical back-forward phone controls
  useEffect(() => {
    const handleRouteSync = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // Normalize string of path and hash to determine route
      let routeStr = '';
      if (hash && hash.startsWith('#/')) {
        routeStr = hash.replace('#/', '');
      } else if (hash && hash.startsWith('#')) {
        routeStr = hash.replace('#', '');
      } else {
        const segments = path.split('/').filter(Boolean);
        routeStr = segments[segments.length - 1] || '';
      }

      if (routeStr === 'servicos') {
        setCurrentRoute('app');
        setPublicTab('servicos');
      } else if (routeStr === 'sobre') {
        setCurrentRoute('app');
        setPublicTab('sobre');
      } else if (routeStr === 'contato') {
        setCurrentRoute('app');
        setPublicTab('contato');
      } else if (routeStr === 'app-tecnico') {
        setCurrentRoute('app-tecnico');
      } else if (routeStr === 'terminal-login') {
        setCurrentRoute('terminal-login');
      } else if (routeStr === 'terminal') {
        setCurrentRoute('terminal');
      } else if (routeStr === 'portal') {
        setCurrentRoute('portal');
      } else {
        // Fallback / index home
        setCurrentRoute('app');
        setPublicTab('home');
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

  const navigateTo = (route: 'portal' | 'app' | 'terminal-login' | 'terminal' | 'app-tecnico') => {
    setCurrentRoute(route);
    if (route === 'app') {
      setPublicTab('home');
    }

    const path = route === 'portal' ? '/' : (route === 'app' ? '/' : `/${route}`);
    try {
      window.history.pushState({ route, tab: 'home' }, '', path);
    } catch (e) {
      window.location.hash = route === 'portal' ? '' : `#/${route}`;
    }
  };

  const updatePublicTab = (tab: 'home' | 'servicos' | 'sobre' | 'contato') => {
    setPublicTab(tab);
    const path = tab === 'home' ? '/' : `/${tab}`;
    try {
      window.history.pushState({ route: 'app', tab }, '', path);
    } catch (e) {
      window.location.hash = `#/${tab}`;
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
          onNavigateToAdmin={() => navigateTo('terminal-login')}
          onNavigateToAppTecnico={() => navigateTo('app-tecnico')}
          onNavigateToRequest={() => {
            updatePublicTab('contato');
            // Smooth scroll to top/form
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          publicTab={publicTab}
          setPublicTab={updatePublicTab}
        />
      )}

      {currentRoute === 'app-tecnico' && (
        <AppTecnico onBackToSite={() => navigateTo('app')} />
      )}

      {(currentRoute === 'terminal-login' || currentRoute === 'terminal') && (
        <AdminPanel
          currentRoute={currentRoute}
          onNavigateToRoute={navigateTo}
          onBackToSite={() => navigateTo('app')}
        />
      )}
    </div>
  );
}
