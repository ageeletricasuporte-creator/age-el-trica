/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Check,
  UserPlus,
  ArrowRight,
  Clock,
  Trash2,
  FileSpreadsheet,
  AlertOctagon
} from 'lucide-react';
import { SolicitacaoPublica, Cliente, NivelAcesso, StatusSolicitacao } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminSolicitationsProps {
  solicitations: SolicitacaoPublica[];
  clients: Cliente[];
  onSaveSolicitations: (data: SolicitacaoPublica[]) => void;
  onPromoteToClient: (sol: SolicitacaoPublica) => void;
  userRole: NivelAcesso;
}

export function AdminSolicitations({
  solicitations,
  clients,
  onSaveSolicitations,
  onPromoteToClient,
  userRole
}: AdminSolicitationsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | StatusSolicitacao>('Todos');

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic Confirm Modal config
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Filtering
  const filteredSolicitations = useMemo(() => {
    return solicitations.filter(s => {
      const matchSearch =
        s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.descricaoProblema.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tipoServico.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [solicitations, searchQuery, statusFilter]);

  const handleUpdateStatus = (id: string, nextStatus: StatusSolicitacao) => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Solicitações de orçamentos devem ser mediadas por Atendentes ou Administradores.');
      return;
    }

    const updated = solicitations.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus };
      }
      return s;
    });
    onSaveSolicitations(updated);
  };

  const executePromotion = (sol: SolicitacaoPublica) => {
    onPromoteToClient(sol);
    handleUpdateStatus(sol.id, 'Convertido em orçamento');
    setSuccessMessage(`Sucesso! ${sol.nome} foi promovido a cliente no banco.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handlePromote = (sol: SolicitacaoPublica) => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Apenas perfis Administrativos promovem solicitações a clientes estruturados!');
      return;
    }

    const alreadyExists = clients.some(c => c.telefone === sol.whatsapp);
    if (alreadyExists) {
      setConfirmConfig({
        isOpen: true,
        title: 'Cliente duplicado?',
        message: 'Um cliente com esse mesmo telefone já foi cadastrado no sistema. Gostaria de vincular novamente?',
        onConfirm: () => {
          executePromotion(sol);
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
      return;
    }

    executePromotion(sol);
  };

  const handleDelete = (id: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Apenas administradores seniores podem apagar triagens de solicitantes do banco!');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Excluir Solicitante?',
      message: 'Tem certeza de que deseja excluir permanentemente este contato de triagem?',
      onConfirm: () => {
        const updated = solicitations.filter(s => s.id !== id);
        onSaveSolicitations(updated);
        setSuccessMessage('Solicitante excluído do canal público com sucesso!');
        setTimeout(() => setSuccessMessage(null), 3000);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
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
      <div>
        <h2 className="text-xl font-extrabold text-white">Central de Solicitações do Canal Público</h2>
        <p className="text-zinc-500 text-xs">Acompanhe contatos recebidos em tempo real pelo formulário comercial. Promova os cadastros de maneira automatizada.</p>
      </div>

      {/* Filter / search bar */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por remetente, mensagem ou categoria solicitada..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto justify-end">
          {['Todos', 'Novo', 'Em atendimento', 'Convertido em orçamento', 'Recusado', 'Finalizado'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${statusFilter === st ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid view of submissions */}
      {filteredSolicitations.length === 0 ? (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900/60 p-12 text-center text-zinc-500">
          <MessageSquare className="w-12 h-12 text-zinc-755 mx-auto mb-3" />
          <span className="text-white font-bold block mb-1">Nenhum chamado de triagem</span>
          <span className="text-xs">Sua fila de solicitações de clientes externos residenciais e comerciais está em dia!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSolicitations.map(sol => (
            <div
              key={sol.id}
              className={`bg-zinc-950 border p-5 rounded-2xl transition flex flex-col justify-between ${
                sol.status === 'Novo' ? 'border-amber-500/20 shadow-lg shadow-amber-500/[0.01]' : 'border-zinc-900'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
                    ⏱️ {sol.dataSolicitacao.split(' ')[0]} {sol.dataSolicitacao.split(' ')[1] || ''}
                  </span>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    sol.status === 'Novo' ? 'bg-amber-500/10 text-amber-500 border border-amber-505/20 animate-pulse' :
                    sol.status === 'Convertido em orçamento' || sol.status === 'Finalizado' ? 'bg-green-500/15 text-green-400 border border-green-550/15' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>{sol.status}</span>
                </div>

                <div className="mb-3">
                  <h4 className="text-white text-base font-extrabold">{sol.nome}</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">FONE: <span className="text-gray-300 font-bold">{sol.whatsapp}</span></p>
                </div>

                {/* Scope categorized */}
                <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900 text-xs mb-3 space-y-1">
                  <span className="text-[9px] text-amber-500 font-mono block uppercase font-bold">Interesse elétrico:</span>
                  <p className="text-white font-semibold font-sans">{sol.tipoServico}</p>
                </div>

                <div className="mb-4">
                  <span className="text-[9px] text-zinc-500 font-mono block uppercase mb-1">Tradução do chamamento:</span>
                  <p className="text-zinc-400 text-xs leading-relaxed italic bg-zinc-901 p-3 rounded-lg border border-zinc-903">
                    "{sol.descricaoProblema}"
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex flex-wrap gap-2 justify-end">
                {sol.status === 'Novo' && (
                  <>
                    <button
                      onClick={() => handlePromote(sol)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition animate-bounce"
                      title="Promover a cliente e iniciar workflow"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> PROMOVER A CLIENTE
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(sol.id, 'Recusado')}
                      className="bg-zinc-900 text-zinc-400 hover:text-white text-[11px] px-3 py-1.5 rounded-lg border border-zinc-800 transition"
                    >
                      Recusar
                    </button>
                  </>
                )}

                {sol.status !== 'Novo' && (
                  <button
                    onClick={() => handleUpdateStatus(sol.id, 'Novo')}
                    className="bg-zinc-900 text-zinc-400 hover:text-white text-[11px] px-3 py-1.5 rounded-lg border border-zinc-800 transition"
                  >
                    Restaurar para Novo
                  </button>
                )}

                {userRole === 'Administrador' && (
                  <button
                    onClick={() => handleDelete(sol.id)}
                    className="text-zinc-650 hover:text-red-400 p-1.5 rounded bg-zinc-905 border border-zinc-900 transition ml-1"
                    title="Remover Registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
