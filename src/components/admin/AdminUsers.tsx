/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Shield,
  Plus,
  Trash2,
  Lock,
  Mail,
  User,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { Usuario, NivelAcesso } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminUsersProps {
  users: Usuario[];
  onSaveUsers: (data: Usuario[]) => void;
  userRole: NivelAcesso;
  currentUserEmail: string;
}

export function AdminUsers({
  users,
  onSaveUsers,
  userRole,
  currentUserEmail
}: AdminUsersProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<NivelAcesso>('Tecnico/Eletricista');

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);

  if (userRole !== 'Administrador') {
    return (
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-505/20 text-sans">
          🔒
        </div>
        <h3 className="text-white text-base font-extrabold font-sans">Acesso Altamente Restrito</h3>
        <p className="text-zinc-500 text-xs leading-relaxed text-sans">
          Apenas usuários com perfil de <strong className="text-white">Administrador Sênior</strong> possuem autorização para alterar credenciais de funcionários ou auditar registros de chaves de segurança da AGE Elétrica.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEmail('');
    setName('');
    setPassword('');
    setRole('Tecnico/Eletricista');
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !role || !password) {
      setErrorMessage('Por favor, preencha todos os campos e senhas da nova credencial!');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setErrorMessage('Endereço de e-mail inválido!');
      return;
    }

    const alreadyExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (alreadyExists) {
      setErrorMessage('Este endereço de e-mail já possui uma credencial de acesso ativa no banco do sistema!');
      return;
    }

    const newUser: Usuario = {
      id: `usr-${Date.now()}`,
      email: email.toLowerCase(),
      nome: name,
      nivelAcesso: role,
      senhaHash: password,
      status: 'Ativo',
      telefone: '',
      ultimoAcesso: new Date().toISOString(),
      dataCriacao: new Date().toISOString()
    };

    onSaveUsers([...users, newUser]);
    setErrorMessage(null);
    setSuccessMessage('Novas credenciais salvas com sucesso!');
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteTrigger = (id: string, userEmail: string) => {
    if (userEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      setErrorMessage('ERRO DE SEGURANÇA: Não é permitido desativar sua própria credencial de login ativa!');
      return;
    }
    setUserToDelete({ id, email: userEmail });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      onSaveUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
      setSuccessMessage('Privilégios de acesso banidos/apagados permanentemente.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-350 font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-350 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Gestão Jurídica de Contas e Credenciais</h2>
          <p className="text-zinc-500 text-xs">Administre as credenciais do corpo técnico de eletricistas, atendentes comerciais e controle as permissões NR10.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 text-black" strokeWidth={3} /> NOVAS CREDENCIAIS
        </button>
      </div>

      {/* Warning layout about access roles */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-amber-500 font-sans">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <strong className="block text-white mb-0.5">Parâmetros de Alocação de Funções (Padrões de Trabalho):</strong>
          <span>
            • <strong>Administrador:</strong> Acesso irrestrito a configurações, remoções financeiras, faturamentos, estornos e criação de contas.<br/>
            • <strong>Atendente:</strong> Permissões para mediar chamados públicos, clientes, agendas e redigir orçamentos/recibos.<br/>
            • <strong>Técnico/Eletricista:</strong> Visualização de orçamentos e edição direta do Diário de Obras (Laudos e assinaturas).
          </span>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-zinc-900 bg-zinc-900/20 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
              <th className="py-4 px-5">Colaborador / Técnico</th>
              <th className="py-4 px-5">Perfil de Operação</th>
              <th className="py-4 px-5 font-mono">Endereço de E-mail</th>
              <th className="py-4 px-5">Situação</th>
              <th className="py-4 px-5 text-right">Ação Corretiva</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 text-zinc-400">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-zinc-900/10 transition">
                <td className="py-4 px-5 text-white font-bold flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 text-zinc-450 border border-zinc-850 flex items-center justify-center text-[10px] uppercase">
                    {u.nome.substring(0, 2)}
                  </div>
                  <div>
                    <span className="block">{u.nome}</span>
                    <span className="text-[10px] text-zinc-500 font-normal">Cadastrado em: {u.dataCriacao.split('T')[0].split('-').reverse().join('/')}</span>
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-white font-medium text-[11px] block">{u.nivelAcesso}</span>
                  </div>
                </td>
                <td className="py-4 px-5 font-mono text-zinc-350">{u.email}</td>
                <td className="py-4 px-5">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-500/10 text-green-400 border border-green-550/20">
                    ATIVO CFT
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  {u.email.toLowerCase() !== currentUserEmail.toLowerCase() ? (
                    <button
                      onClick={() => handleDeleteTrigger(u.id, u.email)}
                      className="text-zinc-650 hover:text-red-400 p-1 rounded hover:bg-zinc-900 transition"
                      title="Banir Credencial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-amber-500 text-[10px] font-mono italic">Logado em uso</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD USER CREDENTIAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full bg-zinc-850 text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" /> Registrar Credencial AGE
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome Completo do Funcionário *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-3 text-xs text-white"
                    placeholder="Ex: Geraldo Fonseca"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Endereço de E-mail Institucional *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-3 text-xs text-white"
                    placeholder="email@ageeletrica.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Definir Nível de Acesso Sênior</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as NivelAcesso)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                >
                  <option value="Administrador">Administrador Geral</option>
                  <option value="Atendente">Atendente Comercial</option>
                  <option value="Tecnico/Eletricista">Técnico / Eletricista Campo</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Senha de Acesso Criptografada *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Salvar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Banir Credencial?"
        message={`Tem certeza de que deseja BANIR ou APAGAR permanentemente os privilégios de acesso de "${userToDelete?.email}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
