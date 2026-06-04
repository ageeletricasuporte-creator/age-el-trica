/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Inbox,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Cliente, Orcamento, Recibo, Atendimento, SolicitacaoPublica } from '../../types';

interface AdminDashboardProps {
  clients: Cliente[];
  budgets: Orcamento[];
  receipts: Recibo[];
  appointments: Atendimento[];
  solicitations: SolicitacaoPublica[];
  onNavigateToTab: (tab: any) => void;
}

export function AdminDashboard({
  clients,
  budgets,
  receipts,
  appointments,
  solicitations,
  onNavigateToTab
}: AdminDashboardProps) {

  // Computations
  const stats = useMemo(() => {
    const totalApprovedVal = budgets
      .filter(b => b.status === 'Aprovado' || b.status === 'Finalizado')
      .reduce((acc, curr) => acc + curr.valorTotal, 0);

    const totalInvoicedVal = budgets.reduce((acc, curr) => acc + curr.valorTotal, 0);

    const receivedRevenue = receipts
      .filter(r => r.status === 'Pago')
      .reduce((acc, curr) => acc + curr.valorRecebido, 0);

    const pendingAppointments = appointments.filter(a => a.status === 'Agendado' || a.status === 'Em andamento').length;

    const newSolicitations = solicitations.filter(s => s.status === 'Novo').length;

    return {
      totalApprovedVal,
      totalInvoicedVal,
      receivedRevenue,
      pendingAppointments,
      newSolicitations
    };
  }, [clients, budgets, receipts, appointments, solicitations]);

  // Compute budget counts
  const budgetCounts = useMemo(() => {
    let sent = 0;
    let approved = 0;
    let refused = 0;
    let analysis = 0;

    budgets.forEach(b => {
      if (b.status === 'Enviado') sent++;
      else if (b.status === 'Aprovado' || b.status === 'Finalizado') approved++;
      else if (b.status === 'Recusado') refused++;
      else if (b.status === 'Em análise') analysis++;
    });

    return { sent, approved, refused, analysis };
  }, [budgets]);

  // Group solicitations by city for quick insights
  const regionShares = useMemo(() => {
    const counts: Record<string, number> = {};
    clients.forEach(c => {
      const b = c.bairro || 'Outros';
      counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts).map(([bairro, count]) => ({ bairro, count })).slice(0, 5);
  }, [clients]);

  return (
    <div className="space-y-6">
      
      {/* Visual greeting bar */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 rounded-2xl border border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Painel Geral da AGE Elétrica</h2>
          <p className="text-zinc-400 text-xs mt-1">Visão geral em tempo real de faturamento, equipes técnicas em campo e solicitações de clientes em Natal e região.</p>
        </div>
        <div className="bg-amber-500/15 border border-amber-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-amber-500 font-mono font-semibold uppercase">Dados Atualizados</span>
        </div>
      </div>

      {/* Numerical Metrics Bento-Style Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Customers */}
        <div
          onClick={() => onNavigateToTab('clientes')}
          className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/20 p-5 rounded-2xl transition cursor-pointer flex justify-between items-center"
        >
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-mono block">CLIENTES ATIVOS</span>
            <span className="text-2xl font-extrabold text-white block">{clients.length}</span>
            <span className="text-[10px] text-zinc-400">Total cadastrados</span>
          </div>
          <div className="p-3 bg-zinc-900 text-amber-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Approved Budgets */}
        <div
          onClick={() => onNavigateToTab('orçamentos')}
          className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/20 p-5 rounded-2xl transition cursor-pointer flex justify-between items-center"
        >
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-mono block">ORÇAMENTOS APROVADOS</span>
            <span className="text-2xl font-extrabold text-green-400 block">R$ {stats.totalApprovedVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-zinc-400">{budgetCounts.approved} aprovados/finalizados</span>
          </div>
          <div className="p-3 bg-zinc-900 text-green-400 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Total Receipts Cash Realized */}
        <div
          onClick={() => onNavigateToTab('recibos')}
          className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/20 p-5 rounded-2xl transition cursor-pointer flex justify-between items-center"
        >
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-mono block">RECEITA CONFIRMADA</span>
            <span className="text-2xl font-extrabold text-amber-500 block">R$ {stats.receivedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-[10px] text-zinc-400">Faturamento liquidado</span>
          </div>
          <div className="p-3 bg-zinc-900 text-amber-500 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* KPI: Pending Service Schedules */}
        <div
          onClick={() => onNavigateToTab('agenda')}
          className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/20 p-5 rounded-2xl transition cursor-pointer flex justify-between items-center"
        >
          <div className="space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase font-mono block">SERVIÇOS EM CAMPO</span>
            <span className="text-2xl font-extrabold text-blue-400 block">{stats.pendingAppointments}</span>
            <span className="text-[10px] text-zinc-400">Agendados ou em andamento</span>
          </div>
          <div className="p-3 bg-zinc-900 text-blue-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Secondary row for interactive indicators and alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Inquiries & Conversions status */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
            <div>
              <h3 className="text-white font-bold">Resumo Organizacional e Status de Orçamentos</h3>
              <p className="text-zinc-500 text-xs">Conversões do mês atual</p>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Total emitidos: R$ {stats.totalInvoicedVal.toLocaleString('pt-BR')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Em análise</span>
              <span className="text-xl font-bold text-gray-400 block mt-1">{budgetCounts.analysis}</span>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Enviados</span>
              <span className="text-xl font-bold text-amber-500 block mt-1">{budgetCounts.sent}</span>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Aprovados</span>
              <span className="text-xl font-bold text-green-400 block mt-1">{budgetCounts.approved}</span>
            </div>
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-850 text-center">
              <span className="text-[10px] text-zinc-500 uppercase block font-mono">Recusados</span>
              <span className="text-xl font-bold text-red-400 block mt-1">{budgetCounts.refused}</span>
            </div>
          </div>

          {/* Simple Visual Bar charts representing pipeline */}
          <div className="space-y-3 pt-2">
            <span className="text-xs text-zinc-400 block font-semibold">Representação Visual do Escopo Financeiro</span>
            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${stats.totalInvoicedVal ? (stats.totalApprovedVal/stats.totalInvoicedVal) * 100 : 0}%` }}
                className="bg-green-500 h-full"
                title="Aprovados"
              />
              <div
                style={{ width: `${stats.totalInvoicedVal ? ((budgets.filter(b=>b.status==='Enviado').reduce((a,c)=>a+c.valorTotal,0))/stats.totalInvoicedVal) * 100 : 0}%` }}
                className="bg-amber-500 h-full"
                title="Enviados"
              />
              <div
                style={{ width: `${stats.totalInvoicedVal ? ((budgets.filter(b=>b.status==='Em análise').reduce((a,c)=>a+c.valorTotal,0))/stats.totalInvoicedVal) * 100 : 0}%` }}
                className="bg-zinc-600 h-full"
                title="Em análise"
              />
            </div>
            <div className="flex gap-4 text-[10px] text-zinc-500 font-mono justify-center">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full" /> Aprovados ({stats.totalInvoicedVal ? Math.round((stats.totalApprovedVal/stats.totalInvoicedVal)*100) : 0}%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-500 rounded-full" /> Enviados</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-zinc-600 rounded-full" /> Outros</span>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
              <h4 className="text-white text-xs font-bold mb-3 flex items-center gap-1"><Inbox className="w-4 h-4 text-amber-500" /> Solicitações Pendentes no Site</h4>
              {solicitations.filter(s => s.status === 'Novo').length > 0 ? (
                <div className="space-y-2">
                  {solicitations.filter(s => s.status === 'Novo').slice(0, 2).map(s => (
                    <div key={s.id} className="text-xs bg-zinc-950 p-2.5 rounded border border-zinc-850 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white block">{s.nome}</span>
                        <span className="text-zinc-500 text-[10px] font-mono">{s.bairro} - {s.tipoServico}</span>
                      </div>
                      <button
                        onClick={() => onNavigateToTab('solicitacoes')}
                        className="bg-amber-500 hover:bg-amber-600 text-black text-[10px] font-bold py-1 px-2.5 rounded transition"
                      >
                        Atender
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 block italic leading-8">Nenhuma solicitação de lead pendente.</span>
              )}
            </div>

            <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900">
              <h4 className="text-white text-xs font-bold mb-3 flex items-center gap-1"><Clock className="w-4 h-4 text-blue-400" /> Próximos Atendimentos Técnicos</h4>
              {appointments.filter(a => a.status === 'Agendado' || a.status === 'Em andamento').length > 0 ? (
                <div className="space-y-2">
                  {appointments.filter(a => a.status === 'Agendado' || a.status === 'Em andamento').slice(0, 2).map(a => {
                    const cli = clients.find(c => c.id === a.clienteId);
                    return (
                      <div key={a.id} className="text-xs bg-zinc-950 p-2.5 rounded border border-zinc-850 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-white block">{cli?.nomeCompleto || 'Cliente'}</span>
                          <span className="text-zinc-500 text-[10px] font-mono">📅 {a.dataAgendada} às {a.horario} • {a.tecnicoResponsavel.split(' ')[0]}</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          {a.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 block italic leading-8">Nenhum atendimento agendado na fila.</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: bento metadata box representing clients districts count */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-900 pb-3 mb-4">
              <h3 className="text-white font-bold text-sm">Distribuição Geográfica</h3>
              <p className="text-zinc-500 text-xs">Concentração de Clientes por Bairro</p>
            </div>

            {regionShares.length > 0 ? (
              <div className="space-y-3">
                {regionShares.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-zinc-400">
                      <span className="font-bold text-gray-200">{item.bairro}</span>
                      <span className="font-mono text-[11px]">{item.count} {item.count === 1 ? 'cliente' : 'clientes'}</span>
                    </div>
                    {/* Visual mini-bar */}
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(item.count / clients.length) * 100}%` }}
                        className="bg-amber-500 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-500 italic block py-4">Sem informações disponíveis no momento.</span>
            )}
          </div>

          <div className="pt-6 border-t border-zinc-900 text-xs text-zinc-500 font-mono">
            <span>Última atualização: {new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

      </div>

    </div>
  );
}
