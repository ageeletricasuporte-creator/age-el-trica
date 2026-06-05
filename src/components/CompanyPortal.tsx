/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Zap, LayoutDashboard, Terminal, Smartphone } from 'lucide-react';
import { AgeEletricaDB } from '../dataSeed';

interface CompanyPortalProps {
  onSelectApp: () => void;
  onSelectTerminal: () => void;
}

export function CompanyPortal({ onSelectApp, onSelectTerminal }: CompanyPortalProps) {
  const config = AgeEletricaDB.getConfig();

  return (
    <div className="min-h-screen bg-[#050505] tech-grid flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 font-sans selection:bg-[#f2b705] selection:text-black relative overflow-x-hidden w-full max-w-full">
      
      {/* Background glowing effects */}
      <div className="absolute inset-x-0 top-1/4 -translate-y-1/2 flex justify-center pointer-events-none z-0">
        <div className="w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] bg-[#f2b705]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-3xl flex flex-col items-center">
        
        {/* Dynamic clean company branding header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-12"
        >
          {config.logo ? (
            <img 
              src={config.logo} 
              alt="AGE Elétrica" 
              className="mx-auto h-12 sm:h-16 w-auto object-contain mb-4 rounded px-2" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#f2b705]/10 border border-[#f2b705]/20 text-[#f2b705] mb-4">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-[#f2b705] fill-[#f2b705]/20" />
            </div>
          )}
          
          <h1 className="text-white font-extrabold text-2xl sm:text-3xl uppercase tracking-wider font-display">
            AGE Elétrica
          </h1>
          <p className="text-[#a1a1aa] text-[10px] sm:text-xs tracking-[0.2em] uppercase font-mono mt-1.5 font-semibold">
            Instalações de Alta Performance • NBR 5410
          </p>
        </motion.div>

        {/* Binary portal options container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full px-2 sm:px-0">
          
          {/* OPTION 1: CLIENT APP */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-[#0a0a0a] hover:bg-[#0f0f0f] border border-zinc-900 hover:border-[#f2b705]/40 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer glow-amber/15 shadow-xl w-full max-w-full"
            onClick={onSelectApp}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#f2b705]/[0.02] to-transparent rounded-3xl pointer-events-none" />
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f2b705]/10 border border-[#f2b705]/20 flex items-center justify-center text-[#f2b705] mb-5 group-hover:bg-[#f2b705] group-hover:text-black transition-all duration-300 group-hover:scale-110">
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-white font-extrabold text-lg sm:text-xl tracking-tight uppercase group-hover:text-[#f2b705] transition-all font-display">
                App AGE Elétrica
              </h2>
              <p className="text-[#71717a] text-xs sm:text-[13px] leading-relaxed mt-2.5 max-w-[280px]">
                Área do cliente para solicitar serviços, orçamentos e agendamentos com toda praticidade.
              </p>
            </div>

            <div className="mt-8 w-full">
              <button 
                type="button"
                className="w-full bg-[#111111] group-hover:bg-[#f2b705] border border-zinc-800 group-hover:border-transparent text-white group-hover:text-black font-extrabold text-[11px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all duration-300 font-mono"
              >
                ACESSAR APP CLIENTE
              </button>
            </div>
          </motion.div>

          {/* OPTION 2: PRIVATE TERMINAL */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="group relative bg-[#0a0a0a] hover:bg-[#0f0f0f] border border-zinc-900 hover:border-amber-500/30 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer shadow-xl w-full max-w-full"
            onClick={onSelectTerminal}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.01] to-transparent rounded-3xl pointer-events-none" />
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-500 mb-5 group-hover:bg-zinc-800 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                <Terminal className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h2 className="text-white font-extrabold text-lg sm:text-xl tracking-tight uppercase group-hover:text-amber-400 transition-all font-display">
                Terminal AGE Elétrica
              </h2>
              <p className="text-[#71717a] text-xs sm:text-[13px] leading-relaxed mt-2.5 max-w-[280px]">
                Área administrativa privada para gerenciamento técnico, faturamentos e controle interno.
              </p>
            </div>

            <div className="mt-8 w-full">
              <button 
                type="button"
                className="w-full bg-[#111111] group-hover:bg-zinc-800 border border-zinc-800 group-hover:border-zinc-750 text-[#a1a1aa] group-hover:text-white font-extrabold text-[11px] uppercase tracking-widest py-3 px-4 rounded-xl transition-all duration-300 font-mono"
              >
                ENTRAR NO TERMINAL
              </button>
            </div>
          </motion.div>

        </div>

        {/* Footer info lock line */}
        <div className="text-center mt-12 sm:mt-16 text-[#3f3f46] text-[9px] uppercase tracking-widest font-mono z-10 select-none">
          Copyright © {new Date().getFullYear()} AGE Elétrica • Todos os direitos reservados
        </div>

      </div>
    </div>
  );
}
