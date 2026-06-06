/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users as UsersIcon,
  ShieldAlert,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  User,
  Zap,
  Lock,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Mail
} from 'lucide-react';

// Database core
import { AgeEletricaDB } from '../../dataSeed';
import {
  Cliente,
  Servico,
  Orcamento,
  ItemOrcamento,
  Recibo,
  Atendimento,
  SolicitacaoPublica,
  Usuario,
  ConfiguracaoEmpresa,
  NivelAcesso
} from '../../types';

// Subcomponents imports
import { AdminDashboard } from './AdminDashboard';
import { AdminClients } from './AdminClients';
import { AdminServices } from './AdminServices';
import { AdminBudgets } from './AdminBudgets';
import { AdminReceipts } from './AdminReceipts';
import { AdminAgenda } from './AdminAgenda';
import { AdminSolicitations } from './AdminSolicitations';
import { AdminUsers } from './AdminUsers';
import { AdminSettings } from './AdminSettings';
import { AdminGmail } from './AdminGmail';
import { ConfirmModal } from './ConfirmModal';

interface AdminPanelProps {
  onBackToSite: () => void;
  currentRoute: 'terminal-login' | 'terminal';
  onNavigateToRoute: (route: 'portal' | 'app' | 'terminal-login' | 'terminal') => void;
}

export function AdminPanel({ onBackToSite, currentRoute, onNavigateToRoute }: AdminPanelProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Password change states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [userToUpdatePassword, setUserToUpdatePassword] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  // Logged-in user information
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Mobile drawer panel state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Database Memory states
  const [clients, setClients] = useState<Cliente[]>([]);
  const [services, setServices] = useState<Servico[]>([]);
  const [budgets, setBudgets] = useState<Orcamento[]>([]);
  const [budgetItems, setBudgetItems] = useState<ItemOrcamento[]>([]);
  const [receipts, setReceipts] = useState<Recibo[]>([]);
  const [appointments, setAppointments] = useState<Atendimento[]>([]);
  const [solicitations, setSolicitations] = useState<SolicitacaoPublica[]>([]);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [config, setConfig] = useState<ConfiguracaoEmpresa | null>(null);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'servicos' | 'orcamentos' | 'recibos' | 'fila' | 'contas' | 'settings' | 'gmail'>('dashboard');

  // Load backend states on startup
  useEffect(() => {
    // Check if session exists in sessionStorage or localStorage
    const savedUser = sessionStorage.getItem('age_el_logged_user') || localStorage.getItem('age_el_logged_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as Usuario;
      setCurrentUser(parsed);
      setIsAuthenticated(true);
    }

    refreshLocalStates();

    // Subscribe to real-time updates from Firebase synced DB
    const unsubscribe = AgeEletricaDB.subscribe(() => {
      refreshLocalStates();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync state between routing paths and current session status
  useEffect(() => {
    if (isAuthenticated && currentUser && currentRoute === 'terminal-login') {
      onNavigateToRoute('terminal');
    } else if ((!isAuthenticated || !currentUser) && currentRoute === 'terminal') {
      onNavigateToRoute('terminal-login');
    }
  }, [isAuthenticated, currentUser, currentRoute, onNavigateToRoute]);

  const refreshLocalStates = () => {
    setClients(AgeEletricaDB.getClients());
    setServices(AgeEletricaDB.getServices());
    setBudgets(AgeEletricaDB.getBudgets());
    setBudgetItems(AgeEletricaDB.getBudgetItems());
    setReceipts(AgeEletricaDB.getReceipts());
    setAppointments(AgeEletricaDB.getAppointments());
    setSolicitations(AgeEletricaDB.getSolicitations());
    setUsers(AgeEletricaDB.getUsers());
    setConfig(AgeEletricaDB.getConfig());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Por favor, preencha todos os campos!');
      return;
    }

    // Attempt retrieval
    const dbUsers = AgeEletricaDB.getUsers();
    const found = dbUsers.find(
      u => u.email.toLowerCase() === loginEmail.toLowerCase() && u.senhaHash === loginPassword
    );

    if (found) {
      if (found.status !== 'Ativo') {
        setLoginError('Sua credencial de funcionário foi suspensa do banco!');
        return;
      }
      
      // If logging in with default passwords (1234 or Admin@123), force custom password selection
      if (found.senhaHash === '1234' || found.senhaHash === 'Admin@123' || found.precisaMudarSenha) {
        setUserToUpdatePassword(found);
        setShowChangePasswordModal(true);
        return;
      }

      setCurrentUser(found);
      setIsAuthenticated(true);
      sessionStorage.setItem('age_el_logged_user', JSON.stringify(found));
      localStorage.setItem('age_el_logged_user', JSON.stringify(found));
      onNavigateToRoute('terminal');
    } else {
      setLoginError('E-mail ou chave de acesso incorretos. Verifique suas credenciais!');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    if (!newPassword || !confirmNewPassword) {
      setPasswordChangeError('Por favor, preencha os campos da nova senha!');
      return;
    }

    if (newPassword === '1234' || newPassword === 'Admin@123') {
      setPasswordChangeError('A nova senha não pode ser igual às senhas padrões (1234 ou Admin@123)!');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordChangeError('A nova senha deve ter no mínimo 4 caracteres!');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('As senhas digitadas não conferem! Verifique.');
      return;
    }

    if (userToUpdatePassword) {
      // Find and update the user in the database
      const dbUsers = AgeEletricaDB.getUsers();
      const updatedUsers = dbUsers.map(u => {
        if (u.id === userToUpdatePassword.id) {
          return { ...u, senhaHash: newPassword, precisaMudarSenha: false };
        }
        return u;
      });

      // Saving to DB - triggers localStorage and instant Firestore cloud sync
      AgeEletricaDB.saveUsers(updatedUsers);
      setUsers(updatedUsers);

      const updatedUser = { ...userToUpdatePassword, senhaHash: newPassword, precisaMudarSenha: false };
      
      // Authenticate the user session of the freshly set credentials
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      sessionStorage.setItem('age_el_logged_user', JSON.stringify(updatedUser));
      localStorage.setItem('age_el_logged_user', JSON.stringify(updatedUser));

      // Reset wizard states
      setShowChangePasswordModal(false);
      setUserToUpdatePassword(null);
      setNewPassword('');
      setConfirmNewPassword('');
      alert('Sua senha particular de segurança foi configurada e sincronizada com sucesso!');
      onNavigateToRoute('terminal');
    }
  };

  const handleLogoutTrigger = () => {
    setIsLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('age_el_logged_user');
    localStorage.removeItem('age_el_logged_user');
    setIsLogoutConfirmOpen(false);
    onNavigateToRoute('terminal-login');
  };

  // State saving handlers wrapper
  const handleSaveClients = (updated: Cliente[]) => {
    AgeEletricaDB.saveClients(updated);
    setClients(updated);
  };

  const handleSaveServices = (updated: Servico[]) => {
    AgeEletricaDB.saveServices(updated);
    setServices(updated);
  };

  const handleSaveBudgets = (updatedB: Orcamento[], updatedItems: ItemOrcamento[]) => {
    AgeEletricaDB.saveBudgets(updatedB);
    AgeEletricaDB.saveBudgetItems(updatedItems);
    setBudgets(updatedB);
    setBudgetItems(updatedItems);
  };

  const handleSaveReceipts = (updated: Recibo[]) => {
    AgeEletricaDB.saveReceipts(updated);
    setReceipts(updated);
  };

  const handleSaveAppointments = (updated: Atendimento[]) => {
    AgeEletricaDB.saveAppointments(updated);
    setAppointments(updated);
  };

  const handleSaveSolicitations = (updated: SolicitacaoPublica[]) => {
    AgeEletricaDB.saveSolicitations(updated);
    setSolicitations(updated);
  };

  const handleSaveUsers = (updated: Usuario[]) => {
    AgeEletricaDB.saveUsers(updated);
    setUsers(updated);
  };

  const handleSaveConfig = (updated: ConfiguracaoEmpresa) => {
    AgeEletricaDB.saveConfig(updated);
    setConfig(updated);

    if (updated.nomeAdministrador) {
      const dbUsers = AgeEletricaDB.getUsers();
      const updatedUsers = dbUsers.map(u => {
        if (u.email && u.email.toLowerCase() === 'ageeletricasuporte@gmail.com') {
          return { ...u, nome: updated.nomeAdministrador! };
        }
        return u;
      });
      AgeEletricaDB.saveUsers(updatedUsers);
      setUsers(updatedUsers);

      if (currentUser && currentUser.email.toLowerCase() === 'ageeletricasuporte@gmail.com' && currentUser.nome !== updated.nomeAdministrador) {
        const updatedCurrentUser = { ...currentUser, nome: updated.nomeAdministrador };
        setCurrentUser(updatedCurrentUser);
        sessionStorage.setItem('age_el_logged_user', JSON.stringify(updatedCurrentUser));
        localStorage.setItem('age_el_logged_user', JSON.stringify(updatedCurrentUser));
      }
    }
  };

  // Promote contact prospect directly to systemic Client NBR
  const handlePromoteToClient = (sol: SolicitacaoPublica) => {
    const nextClient: Cliente = {
      id: `cli-${Date.now()}`,
      nomeCompleto: sol.nome,
      tipoCliente: 'Residencial', // default
      cpfCnpj: '',
      telefone: sol.whatsapp,
      whatsapp: sol.whatsapp,
      email: 'atendimento@ageeletrica.com',
      enderecoCompleto: sol.endereco || 'Solicitar Endereço',
      numero: '',
      complemento: '',
      bairro: sol.bairro || 'Solicitar Bairro',
      cidade: sol.cidade || 'Natal',
      estado: 'RN',
      cep: '',
      observacoes: sol.descricaoProblema || '',
      dataCadastro: new Date().toISOString(),
      statusCliente: 'Ativo'
    };

    const updated = [nextClient, ...clients];
    handleSaveClients(updated);
    alert(`Sucesso! "${sol.nome}" foi promovido a cliente. Detalhes de endereço podem ser reajustados na aba de Clientes.`);
  };

  // Auth screen layout
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-between p-4 selection:bg-amber-500 selection:text-black font-sans relative overflow-hidden">
        {/* Abstract grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-black to-black pointer-events-none" />

        {/* Header */}
        <header className="max-w-7xl mx-auto w-full z-15 pt-4 flex justify-between items-center text-xs text-zinc-500 font-mono no-print">
          <button
            onClick={onBackToSite}
            className="hover:text-amber-500 font-semibold transition flex items-center gap-1.5"
          >
            ← VOLTAR À PÁGINA INICIAL
          </button>
          <span>SISTEMA INTERNO AGE ELÉTRICA</span>
        </header>

        {/* Center panel */}
        <main className="z-10 w-full max-w-sm mx-auto bg-zinc-950 border border-zinc-900 rounded-3xl p-8 shadow-2xl relative">
          {showChangePasswordModal && userToUpdatePassword ? (
            <div>
              <div className="text-center mb-6">
                <span className="p-1 px-1.5 bg-amber-500/10 text-amber-500 font-black text-[10px] rounded border border-amber-500/20 italic tracking-widest inline-block mb-3">
                  🔐 COORDENAÇÃO DE SEGURANÇA
                </span>
                <h1 className="text-white text-xl font-black uppercase tracking-tight">Nova Senha</h1>
                <p className="text-zinc-400 text-[11px] leading-relaxed mt-2">
                  Olá, <strong className="text-white">{userToUpdatePassword.nome}</strong>! Para garantir a segurança integral do seu painel corporativo e de suas assinaturas de orçamentos, você deve redefinir a sua senha provisória de acesso.
                </p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs">
                {passwordChangeError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-semibold leading-relaxed">
                    ⚠️ {passwordChangeError}
                  </div>
                )}

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">E-mail Cadastrado</label>
                  <input
                    type="text"
                    value={userToUpdatePassword.email}
                    disabled
                    className="w-full bg-zinc-900/50 border border-zinc-900 outline-none rounded-xl py-2.5 px-3 text-zinc-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Crie sua Senha Particular</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2.5 pl-9 pr-3 text-white font-mono"
                      placeholder="Nova senha pessoal"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Confirme a Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2.5 pl-9 pr-3 text-white font-mono"
                      placeholder="Repita a senha pessoal"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setUserToUpdatePassword(null);
                      setNewPassword('');
                      setConfirmNewPassword('');
                      setPasswordChangeError('');
                    }}
                    className="w-1/3 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-900 text-zinc-400 font-extrabold py-3.5 rounded-xl transition text-[10px] tracking-wider uppercase cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3.5 rounded-xl transition text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Gravar Senha <ChevronRight className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <span className="p-1 px-1.5 bg-zinc-900 border border-zinc-800 text-amber-500 font-black text-[10px] rounded italic tracking-widest inline-block mb-3 select-none">
                  ⚡ AGE ELÉTRICA
                </span>
                <h1 className="text-white text-xl font-black uppercase tracking-tight font-display text-center">Terminal AGE Elétrica</h1>
                <p className="text-[#f2b705] text-xs leading-relaxed mt-1 font-bold">Gerenciador administrativo</p>
                <p className="text-zinc-500 text-[11px] leading-relaxed mt-2.5 max-w-[240px] mx-auto">Insira seus dados de acesso credenciados para realizar o controle interno.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-semibold leading-relaxed">
                    ⚠️ {loginError}
                  </div>
                )}

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-white transition font-mono"
                    placeholder="Ex: ageeletricasuporte@gmail.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-zinc-400 font-mono block mb-1">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-650 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-3 text-white font-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-3.5 rounded-xl transition text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Entrar no App <ChevronRight className="w-4 h-4 text-black" strokeWidth={3} />
                </button>
              </form>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-[10px] text-zinc-700 font-mono z-15 no-print">
          Aplicativo de Gestão AGE Elétrica • NBR 5410
        </footer>

      </div>
    );
  }

  // Loaded configuration guard
  if (!config) {
    return <div className="text-center py-24 text-white text-sans">Carregando parâmetros sistêmicos do banco...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 selection:bg-[#f2b705] selection:text-black font-sans relative flex flex-col md:flex-row w-full max-w-[100vw] overflow-x-hidden">

      {/* MOBILE TOP BAR - Fixed/Sticky on mobile */}
      <div className="md:hidden w-full bg-zinc-950 border-b border-zinc-900 p-4 flex items-center justify-between no-print sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {config.logo ? (
            <img src={config.logo} alt="Logo" className="max-h-7 max-w-[65px] object-contain rounded" referrerPolicy="no-referrer" />
          ) : (
            <span className="p-1 px-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold text-[10px] rounded tracking-wider italic">
              ⚡ AGE
            </span>
          )}
          <span className="text-white font-extrabold text-xs tracking-tight">{config.nomeFantasia || 'Sistema AGE'}</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[#f2b705] hover:text-white transition cursor-pointer"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop filter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Drawer side panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-zinc-950 border-r border-zinc-900 z-50 p-6 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div>
                {/* Close and Brand row */}
                <div className="flex items-center justify-between pb-6 border-b border-zinc-900 mb-6 font-display">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold text-xs rounded tracking-widest italic">
                      ⚡ AGE
                    </span>
                    <span className="text-white font-extrabold text-sm block leading-tight">Terminal</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Quick profile */}
                <div className="p-3 bg-zinc-900/40 rounded-2xl border border-zinc-900 flex items-center gap-2.5 mb-6">
                  <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-xs">
                    {currentUser.nome.substring(0,2)}
                  </div>
                  <div>
                    <span className="text-white text-xs font-bold block leading-none">{currentUser.nome.split(' ')[0]}</span>
                    <span className="text-[9px] text-[#f2b705] font-mono mt-0.5 block uppercase tracking-wider">{currentUser.nivelAcesso}</span>
                  </div>
                </div>

                {/* Mobile navigation links */}
                <nav className="space-y-1.5 text-xs max-h-[60vh] overflow-y-auto pr-1">
                  {[
                    { id: 'dashboard', label: 'Dashboard Gerencial', icon: LayoutDashboard },
                    { id: 'agenda', label: 'Escala / Agenda Técnica', icon: Calendar },
                    { id: 'clientes', label: 'Clientes Cadastrados', icon: UsersIcon },
                    { id: 'servicos', label: 'Catálogo de Serviços', icon: Layers },
                    { id: 'orcamentos', label: 'Orçamentos & Invoices', icon: FileText },
                    { id: 'recibos', label: 'Quitações & Recibos', icon: DollarSign },
                    ...((currentUser.nivelAcesso !== 'Tecnico/Eletricista') ? [{ id: 'fila', label: 'Fila de Contatos', icon: MessageSquare }] : []),
                    ...((currentUser.nivelAcesso === 'Administrador') ? [
                      { id: 'contas', label: 'Contas de Acesso', icon: ShieldAlert },
                      { id: 'settings', label: 'Configuração Geral', icon: SettingsIcon }
                    ] : [])
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-semibold transition ${activeTab === item.id ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                      >
                        <IconComp className="w-4 h-4 shrink-0" /> {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Back and Logout blocks on Mobile menu */}
              <div className="pt-4 border-t border-zinc-900 text-xs text-zinc-550 space-y-2.5">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onBackToSite();
                  }}
                  className="w-full text-left hover:text-amber-500 transition py-1 text-[11px] font-mono text-[#a1a1aa] block"
                >
                  ← RETORNAR À TELA INICIAL
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogoutTrigger();
                  }}
                  className="w-full flex items-center gap-2.5 hover:text-red-400 transition text-[#a1a1aa]"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Encerrar Sessão
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR NAVIGATION - Hides on small devices or during page print */}
      <aside className="hidden md:flex w-64 bg-zinc-950 border-r border-[#1a1a1a] flex-col justify-between shrink-0 no-print">
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.logo ? (
                <img src={config.logo} alt="Logo" className="max-h-8 max-w-[80px] object-contain rounded" referrerPolicy="no-referrer" />
              ) : (
                <span className="p-1 px-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-xs rounded tracking-widest italic select-none">
                  ⚡ AGE
                </span>
              )}
              <div>
                <span className="text-white font-extrabold text-sm block leading-tight">{config.nomeFantasia || 'Sistema AGE'}</span>
                <span className="text-[9px] text-zinc-550 font-mono tracking-widest block uppercase">CFT ATIVO • NBR</span>
              </div>
            </div>
          </div>

          {/* Quick Profile User Tag */}
          <div className="p-4 mx-3 my-4 bg-zinc-900/40 rounded-2xl border border-zinc-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.nome.substring(0,2)}
            </div>
            <div>
              <span className="text-white text-xs font-bold block leading-none">{currentUser.nome.split(' ')[0]}</span>
              <span className="text-[10px] text-amber-500 font-mono mt-1 block uppercase font-bold tracking-wider">{currentUser.nivelAcesso}</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="px-3 space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'dashboard' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard Gerencial
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'agenda' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <Calendar className="w-4 h-4 shrink-0" /> Escala / Agenda Técnica
            </button>

            <button
              onClick={() => setActiveTab('clientes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'clientes' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <UsersIcon className="w-4 h-4 shrink-0" /> Clientes Cadastrados
            </button>

            <button
              onClick={() => setActiveTab('servicos')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'servicos' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <Layers className="w-4 h-4 shrink-0" /> Catálogo de Serviços
            </button>

            <button
              onClick={() => setActiveTab('orcamentos')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'orcamentos' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <FileText className="w-4 h-4 shrink-0" /> Orçamentos & Invoices
            </button>

            <button
              onClick={() => setActiveTab('recibos')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'recibos' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
            >
              <DollarSign className="w-4 h-4 shrink-0" /> Quitações & Recibos
            </button>

            {/* Admin or Attendant rows */}
            {currentUser.nivelAcesso !== 'Tecnico/Eletricista' && (
              <button
                onClick={() => setActiveTab('fila')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'fila' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" /> Fila de Contatos
                {solicitations.filter(s => s.status === 'Pendente').length > 0 && (
                  <span className="bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/15 shrink-0 px-2 py-0.5 rounded text-[9px] font-bold font-mono ml-auto">
                    {solicitations.filter(s => s.status === 'Pendente').length}
                  </span>
                )}
              </button>
            )}

            {/* Strict Admin limits */}
            {currentUser.nivelAcesso === 'Administrador' && (
              <>
                <button
                  onClick={() => setActiveTab('gmail')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'gmail' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <Mail className="w-4 h-4 shrink-0" /> Correio & Gmail
                </button>

                <button
                  onClick={() => setActiveTab('contas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'contas' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" /> Contas de Acesso
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition ${activeTab === 'settings' ? 'bg-[#f2b705] text-black font-extrabold' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <SettingsIcon className="w-4 h-4 shrink-0" /> Configuração Geral
                </button>
              </>
            )}

          </nav>
        </div>

        {/* Back and Logout blocks */}
        <div className="p-4 border-t border-zinc-900 text-xs text-zinc-550 space-y-2">
          <button
            onClick={onBackToSite}
            className="w-full text-left hover:text-[#f2b705] transition py-1 text-[11px] font-mono block"
          >
            ← RETORNAR À TELA INICIAL
          </button>
          <button
            onClick={handleLogoutTrigger}
            className="w-full flex items-center gap-2.5 hover:text-red-400 transition text-[#a1a1aa]"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 bg-black p-6 md:p-8 overflow-y-auto print-container flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Header Row - Hides on paper print */}
          <header className="flex justify-between items-center pb-4 border-b border-zinc-900 no-print">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-white text-xs font-bold block font-sans">
                {currentUser.nivelAcesso === 'Administrador' ? 'Gerenciador Sênior AGE' : 'Acesso Operador'}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-450 px-3 py-1 rounded-xl block font-mono">
                Logado como: <strong>{currentUser.email}</strong>
              </span>
            </div>
          </header>

          {/* Active Tab Frame Router */}
          <div className="min-h-[500px]">
            {activeTab === 'dashboard' && (
              <AdminDashboard
                clients={clients}
                budgets={budgets}
                receipts={receipts}
                appointments={appointments}
                solicitations={solicitations}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'clientes' && (
              <AdminClients
                clients={clients}
                appointments={appointments}
                budgets={budgets}
                receipts={receipts}
                onSaveClients={handleSaveClients}
                userRole={currentUser.nivelAcesso}
              />
            )}

            {activeTab === 'servicos' && (
              <AdminServices
                services={services}
                onSaveServices={handleSaveServices}
                userRole={currentUser.nivelAcesso}
              />
            )}

            {activeTab === 'orcamentos' && (
              <AdminBudgets
                budgets={budgets}
                budgetItems={budgetItems}
                clients={clients}
                services={services}
                config={config}
                onSaveBudgets={handleSaveBudgets}
                userRole={currentUser.nivelAcesso}
                userName={currentUser.nome}
              />
            )}

            {activeTab === 'recibos' && (
              <AdminReceipts
                receipts={receipts}
                budgets={budgets}
                clients={clients}
                config={config}
                onSaveReceipts={handleSaveReceipts}
                userRole={currentUser.nivelAcesso}
                userName={currentUser.nome}
              />
            )}

            {activeTab === 'agenda' && (
              <AdminAgenda
                appointments={appointments}
                clients={clients}
                budgets={budgets}
                onSaveAppointments={handleSaveAppointments}
                userRole={currentUser.nivelAcesso}
              />
            )}

            {activeTab === 'fila' && (
              <AdminSolicitations
                solicitations={solicitations}
                clients={clients}
                onSaveSolicitations={handleSaveSolicitations}
                onPromoteToClient={handlePromoteToClient}
                userRole={currentUser.nivelAcesso}
              />
            )}

            {activeTab === 'contas' && (
              <AdminUsers
                users={users}
                onSaveUsers={handleSaveUsers}
                userRole={currentUser.nivelAcesso}
                currentUserEmail={currentUser.email}
              />
            )}

            {activeTab === 'gmail' && config && (
              <AdminGmail
                clients={clients}
                config={config}
              />
            )}

            {activeTab === 'settings' && (
              <AdminSettings
                config={config}
                onSaveConfig={handleSaveConfig}
                userRole={currentUser.nivelAcesso}
              />
            )}
          </div>

        </div>

        {/* Footprint - Hides on paper print */}
        <footer className="pt-12 text-zinc-700 font-mono text-[9px] text-center border-t border-zinc-900 mt-12 select-none no-print">
          Copyright © {new Date().getFullYear()} AGE Elétrica • NBR 5410 • CFT Registro nº 54109 • Projetado e otimizado com cuidado.
        </footer>
      </main>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Encerrar Sessão?"
        message="Deseja realmente encerrar sua sessão no sistema comercial AGE Elétrica?"
        onConfirm={handleConfirmLogout}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

    </div>
  );
}
