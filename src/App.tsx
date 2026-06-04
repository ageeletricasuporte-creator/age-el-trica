/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PublicSite } from './components/PublicSite';
import { AdminPanel } from './components/admin/AdminPanel';

export default function App() {
  const [currentView, setCurrentView] = useState<'public' | 'admin'>('public');
  const [publicTab, setPublicTab] = useState<'home' | 'servicos' | 'sobre' | 'contato'>('home');

  return (
    <div className="bg-[#050505] text-white min-h-screen border-t-4 border-[#f2b705] font-sans selection:bg-[#f2b705] selection:text-black">
      {currentView === 'public' ? (
        <PublicSite
          onNavigateToAdmin={() => setCurrentView('admin')}
          onNavigateToRequest={() => {
            setPublicTab('contato');
            // Smooth scroll to top/form
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          publicTab={publicTab}
          setPublicTab={setPublicTab}
        />
      ) : (
        <AdminPanel
          onBackToSite={() => setCurrentView('public')}
        />
      )}
    </div>
  );
}
