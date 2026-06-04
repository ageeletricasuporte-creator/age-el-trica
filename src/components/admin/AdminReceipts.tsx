/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  X,
  Check,
  Printer,
  MessageSquare,
  FileText,
  DollarSign,
  Briefcase,
  Trash2,
  Lock
} from 'lucide-react';
import {
  Recibo,
  Orcamento,
  Cliente,
  NivelAcesso,
  StatusRecibo,
  ConfiguracaoEmpresa
} from '../../types';
import { AgeEletricaDB } from '../../dataSeed';
import { ConfirmModal } from './ConfirmModal';

interface AdminReceiptsProps {
  receipts: Recibo[];
  budgets: Orcamento[];
  clients: Cliente[];
  config: ConfiguracaoEmpresa;
  onSaveReceipts: (r: Recibo[]) => void;
  userRole: NivelAcesso;
  userName: string;
}

export function AdminReceipts({
  receipts,
  budgets,
  clients,
  config,
  onSaveReceipts,
  userRole,
  userName
}: AdminReceiptsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | StatusRecibo>('Todos');

  // Modal and print states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<Recibo | null>(null);

  // Form Fields
  const [selectedBudgetIdx, setSelectedBudgetIdx] = useState('');
  const [dateReceived, setDateReceived] = useState('');
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [relatedServiceDesc, setRelatedServiceDesc] = useState('');
  const [remarks, setRemarks] = useState('');
  const [status, setStatus] = useState<StatusRecibo>('Pago');

  // Non-blocking hooks (replaces window popup blocks inside iframe)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<{ id: string; num: string } | null>(null);

  // Filter approved or final budgets that don't have receipts yet (or select any)
  const availableBudgets = useMemo(() => {
    return budgets;
  }, [budgets]);

  // Filters
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const clientObj = clients.find(c => c.id === r.clienteId);
      const matchesSearch =
        r.numeroRecibo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.responsavelRecebimento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.referenteServico.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clientObj && clientObj.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'Todos' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [receipts, clients, searchQuery, statusFilter]);

  const handleOpenNew = () => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Eletricistas técnicos não emitem recibos administrativos.');
      return;
    }

    setSelectedBudgetIdx('');
    setDateReceived(new Date().toISOString().substring(0, 10));
    setAmountReceived(0);
    setPaymentMethod('Pix');
    setRelatedServiceDesc('');
    setRemarks('');
    setStatus('Pago');
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleBudgetSelection = (idxStr: string) => {
    setSelectedBudgetIdx(idxStr);
    const budget = budgets.find(b => b.id === idxStr);
    if (budget) {
      setAmountReceived(budget.valorTotal);
      setRelatedServiceDesc(budget.descricaoGeral);
      setPaymentMethod(budget.formaPagamento.toLowerCase().includes('pix') ? 'Pix' : 'Cartão de crédito');
    }
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBudgetIdx) {
      setErrorMessage('Selecione o orçamento de referência para faturar!');
      return;
    }
    if (amountReceived <= 0) {
      setErrorMessage('Defina o valor recebido corretamente!');
      return;
    }

    const budget = budgets.find(b => b.id === selectedBudgetIdx);
    if (!budget) return;

    const nextNumber = AgeEletricaDB.generateNextReciboNumber();

    const newRecibo: Recibo = {
      id: `rec-${Date.now()}`,
      numeroRecibo: nextNumber,
      clienteId: budget.clienteId,
      orcamentoId: budget.id,
      dataEmissao: dateReceived,
      valorRecebido: amountReceived,
      formaPagamento: paymentMethod,
      referenteServico: relatedServiceDesc,
      responsavelRecebimento: userName,
      observacoes: remarks || config.textoPadraoRecibo,
      status,
      assinaturaResponsavel: config.assinaturaDigital,
      dataCriacao: new Date().toISOString()
    };

    onSaveReceipts([newRecibo, ...receipts]);
    setErrorMessage(null);
    setSuccessMessage('Novo recibo emitido com sucesso!');
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteReceiptTrigger = (id: string, num: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Restrição de auditoria. Apenas Administradores podem excluir recibos financeiros!');
      return;
    }
    setReceiptToDelete({ id, num });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (receiptToDelete) {
      onSaveReceipts(receipts.filter(r => r.id !== receiptToDelete.id));
      setReceiptToDelete(null);
      setSuccessMessage('Recibo estornado com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsConfirmOpen(false);
  };

  const handleCopyWhatsAppText = (r: Recibo) => {
    const clientObj = clients.find(c => c.id === r.clienteId);
    if (!clientObj) return;

    const msg = `Olá, ${clientObj.nomeCompleto}! Recebemos seu pagamento relacionado aos serviços prestados pela AGE Elétrica.\n\n🧾 *Recibo de Garantia nº:* ${r.numeroRecibo}\n💰 *Valor:* R$ ${r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💳 *Forma:* ${r.formaPagamento}\n🛠️ *Referente:* ${r.referenteServico}\n\nAgradecemos a confiança! O arquivo formal em PDF já está registrado no sistema comercial.`;

    navigator.clipboard.writeText(msg);
    setSuccessMessage('Propriedades do recibo para WhatsApp copiadas com sucesso!');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex justify-between items-center no-print">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-350 font-bold">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-xs flex justify-between items-center no-print">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-400 hover:text-green-350 font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-white">Central de Recibos e Quitações</h2>
          <p className="text-zinc-500 text-xs">Vincule orçamentos aprovados de chuveiros e wallboxes, emita quitações legais e assegure os termos de garantia.</p>
        </div>
        {userRole !== 'Tecnico/Eletricista' && (
          <button
            onClick={handleOpenNew}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-black" strokeWidth={3} /> EMITIR RECIBO
          </button>
        )}
      </div>

      {/* Search filters */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar recibos por código, serviço ou nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
          {['Todos', 'Pago', 'Parcial', 'Cancelado'].map(st => (
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

      {/* Receipts list */}
      {filteredReceipts.length === 0 ? (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900/60 p-12 text-center text-zinc-500 no-print">
          <DollarSign className="w-12 h-12 text-zinc-755 mx-auto mb-3" />
          <span className="text-white font-bold block mb-1">Nenhum recibo computado</span>
          <span className="text-xs">Tente redefinir os filtros superiores ou registre um novo recibo rápido no portfólio.</span>
        </div>
      ) : (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/20 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                  <th className="py-4 px-5">Recibo / Data</th>
                  <th className="py-4 px-5">Cliente Pagador</th>
                  <th className="py-4 px-5">Forma / Status</th>
                  <th className="py-4 px-5">Referente ao Serviço</th>
                  <th className="py-4 px-5 text-right">Valor Quitado</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {filteredReceipts.map(r => {
                  const clientObj = clients.find(c => c.id === r.clienteId);
                  return (
                    <tr key={r.id} className="hover:bg-zinc-900/10 transition text-zinc-400">
                      <td className="py-4 px-5 text-white font-mono font-bold">
                        <span className="text-green-400 block">{r.numeroRecibo}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Emitido: {r.dataEmissao.split('-').reverse().join('/')}</span>
                      </td>
                      <td className="py-4 px-5">
                        {clientObj ? (
                          <div>
                            <span className="font-extrabold text-white text-sm block">{clientObj.nomeCompleto}</span>
                            <span className="text-[10px] font-mono text-zinc-500">{clientObj.cpfCnpj}</span>
                          </div>
                        ) : (
                          <span className="text-red-400 italic">Desconhecido</span>
                        )}
                      </td>
                      <td className="py-4 px-5 space-y-1">
                        <span className="block font-mono font-bold text-gray-350">{r.formaPagamento}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          r.status === 'Pago' ? 'bg-green-500/15 text-green-400 border border-green-500/15' : 'bg-amber-500/15 text-amber-500'
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-4 px-5 max-w-xs truncate leading-relaxed text-zinc-350" title={r.referenteServico}>
                        {r.referenteServico}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-extrabold text-white text-sm">
                        R$ {r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2 text-zinc-500">
                          <button
                            onClick={() => setSelectedReceiptForPrint(r)}
                            className="p-1 px-2 text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white rounded transition font-mono uppercase flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" /> Ficha A4
                          </button>
                          <button
                            onClick={() => handleCopyWhatsAppText(r)}
                            className="p-1 px-1.5 bg-zinc-900 border border-zinc-850 text-green-400 hover:text-green-300 rounded transition"
                            title="WhatsApp text clipboard"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {userRole === 'Administrador' && (
                            <button
                              onClick={() => handleDeleteReceiptTrigger(r.id, r.numeroRecibo)}
                              className="p-1 px-1.5 bg-zinc-905 border border-zinc-900 hover:text-red-400 rounded transition"
                              title="Estornar Recibo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: COMPACT RECEIPT EMISSION FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-850 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1.5 bg-zinc-850 rounded-full text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" /> Emitir Novo Recibo de Quitação
            </h3>

            <form onSubmit={handleSaveReceipt} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Selecione o Orçamento Vinculado *</label>
                <select
                  required
                  value={selectedBudgetIdx}
                  onChange={(e) => handleBudgetSelection(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="">Selecione...</option>
                  {availableBudgets.map(b => {
                    const cl = clients.find(c => c.id === b.clienteId);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.numeroOrcamento} - {cl?.nomeCompleto || 'Desconhecido'} (R$ {b.valorTotal.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Valor Recebido (R$) *</label>
                  <input
                    type="number"
                    required
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Data da Entrada Financeira *</label>
                  <input
                    type="date"
                    required
                    value={dateReceived}
                    onChange={(e) => setDateReceived(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-whiteCheck"
                  >
                    <option value="Pix">Pix imediato</option>
                    <option value="Dinheiro">Dinheiro vivo</option>
                    <option value="Cartão de crédito">Cartão de Crédito</option>
                    <option value="Cartão de débito">Cartão de Débito</option>
                    <option value="Transferência bancária">TED/DOC</option>
                    <option value="Boleto">Boleto Compensa</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Status Quitado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusRecibo)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  >
                    <option value="Pago">Pago Integral</option>
                    <option value="Parcial">Pago Parcial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Referente ao Serviço prestado</label>
                <input
                  type="text"
                  required
                  value={relatedServiceDesc}
                  onChange={(e) => setRelatedServiceDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                  placeholder="Ex: Instalação e fixação de Wallbox..."
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Texto de quitação ou Termos Extra</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-[10px] text-zinc-350 focus:outline-none"
                  placeholder="Se deixar em branco, usará o texto legal da empresa."
                />
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
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Confirmar Emissão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 PRINT VIEW LAYOUT OVERLAY */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 bg-black/95 z-50 overflow-y-auto flex flex-col justify-start p-4 md:p-8 no-print-backdrop">
          
          <div className="max-w-3xl mx-auto w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 flex justify-between items-center no-print">
            <span className="text-white text-xs font-bold font-mono">Recibo Eletrônico de Garantia ({selectedReceiptForPrint.numeroRecibo})</span>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded transition text-xs flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Baixar / Imprimir Recibo
              </button>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded transition text-xs"
              >
                Voltar
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full bg-white text-black p-8 md:p-12 shadow-2xl rounded-sm font-sans border border-gray-300 print-card">
            
            {/* Header layout */}
            <div className="flex justify-between items-center border-b border-gray-300 pb-4 mb-6">
              {(config.logoPdf || config.logo) ? (
                <img
                  src={config.logoPdf || config.logo}
                  alt="Logo"
                  className="max-h-16 max-w-[120px] object-contain shrink-0 rounded-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-lg font-black tracking-widest text-[#0f172a] uppercase border-l-4 border-amber-500 pl-2">AGE Elétrica</span>
              )}
              <div className="text-right">
                <span className="text-[11px] text-gray-400 block font-mono">RECIBO DE QUITAÇÃO</span>
                <span className="text-lg font-semibold text-gray-900 font-mono">{selectedReceiptForPrint.numeroRecibo}</span>
                <span className="text-xs font-mono block">Valor: <strong className="text-green-600">R$ {selectedReceiptForPrint.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>

            {/* Recibo text container */}
            <div className="bg-zinc-50 border border-gray-150 p-6 rounded-sm mb-6 text-sm leading-relaxed text-slate-800">
              
              {/* Formula text of receipt */}
              <p className="mb-4">
                Recebemos de <strong className="text-slate-950 text-base">{(() => {
                  const client = clients.find(c => c.id === selectedReceiptForPrint.clienteId);
                  return client ? client.nomeCompleto : 'Cliente Pagador';
                })()}</strong> 
                {(() => {
                  const client = clients.find(c => c.id === selectedReceiptForPrint.clienteId);
                  if (client && client.cpfCnpj) {
                    return ` (Inscrito no CPF/CNPJ: ${client.cpfCnpj})`;
                  }
                  return '';
                })()} a importância líquida de <strong className="text-slate-950 font-mono">R$ {selectedReceiptForPrint.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, referente ao serviço especializado de:
              </p>
              
              <p className="font-extrabold uppercase bg-amber-500/10 p-2.5 my-3 rounded-sm text-slate-900 border-l-2 border-amber-500 text-xs text-sans">
                {selectedReceiptForPrint.referenteServico}
              </p>

              <p className="mt-4">
                {selectedReceiptForPrint.observacoes || 'Declaramos que recebemos o valor informado referente aos serviços de engenharia e instalações.'}
              </p>

            </div>

            {/* Issuer coordinates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50 border border-gray-100 p-4 rounded text-xs mb-8">
              <div>
                <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider block">Prestadora de Serviços:</span>
                <p className="font-extrabold text-slate-950">{config.nomeEmpresa}</p>
                <p>CNPJ: {config.cnpj}</p>
                <p>Escritório local: {config.endereco}</p>
                <p>E-mail: {config.email} • WhatsApp: {config.whatsapp}</p>
              </div>

              <div>
                <span className="font-bold text-gray-400 uppercase text-[9px] tracking-wider block">Dados da Quitação Financeira:</span>
                <p className="font-mono text-slate-950">Data do Crédito: {selectedReceiptForPrint.dataEmissao.split('-').reverse().join('/')}</p>
                <p className="font-mono">Operado via: {selectedReceiptForPrint.formaPagamento}</p>
                <p className="font-mono">Faturamento Responsável: {selectedReceiptForPrint.responsavelRecebimento}</p>
                <p className="font-mono text-green-600 font-bold uppercase">Situação Comercial: {selectedReceiptForPrint.status}</p>
              </div>
            </div>

            {/* Legal terms of warranty */}
            <div className="p-3 bg-zinc-50 border-l border-amber-500 rounded-sm text-[10px] text-gray-500 leading-relaxed mb-8">
              ⚠️ *Termos Recíprocos de Garantia:* A prestadora elenca garantia legal de 90 dias úteis para os trechos readequados ou instalados. Riscos gerados por sobrecargas adicionais provocadas pelo usuário suspendem a validade deste recibo. Descarte de aparelhos e entulho técnico operado sob as condições NR10.
            </div>

            {/* Signature block */}
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="border-b border-gray-300 w-64 text-center pb-2 mb-2" />
              <span className="font-bold text-slate-950 block text-xs">{selectedReceiptForPrint.responsavelRecebimento}</span>
              <span className="text-[10px] text-gray-400 font-mono block">Diretor Comercial - {config.nomeFantasia}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-[9px] text-gray-400 font-mono border-t border-gray-150 pt-3 mt-12">
              {config.rodapePdf || 'Recibo emitido pelo sistema administrativo AGE Elétrica.'}
            </div>

          </div>

          <div className="max-w-3xl mx-auto w-full pt-4 text-center text-xs text-zinc-500 uppercase tracking-widest no-print">
            Recibo finalizado com sucesso • Prontidão e Responsabilidade Técnica
          </div>

        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Estornar Recibo?"
        message={`Gostaria de estornar / excluir o recibo ${receiptToDelete?.num}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
