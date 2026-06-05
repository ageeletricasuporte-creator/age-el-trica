/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  FileText,
  Printer,
  Copy,
  MessageSquare,
  TrendingUp,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import {
  Orcamento,
  ItemOrcamento,
  Cliente,
  Servico,
  NivelAcesso,
  StatusOrcamento,
  ConfiguracaoEmpresa
} from '../../types';
import { AgeEletricaDB } from '../../dataSeed';
import { ConfirmModal } from './ConfirmModal';

interface AdminBudgetsProps {
  budgets: Orcamento[];
  budgetItems: ItemOrcamento[];
  clients: Cliente[];
  services: Servico[];
  config: ConfiguracaoEmpresa;
  onSaveBudgets: (b: Orcamento[], items: ItemOrcamento[]) => void;
  userRole: NivelAcesso;
  userName: string;
}

export function AdminBudgets({
  budgets,
  budgetItems,
  clients,
  services,
  config,
  onSaveBudgets,
  userRole,
  userName
}: AdminBudgetsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | StatusOrcamento>('Todos');

  // Modal and Builder states
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Orcamento | null>(null);

  // Active printable overlay
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<Orcamento | null>(null);

  // Builder Fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [status, setStatus] = useState<StatusOrcamento>('Em análise');
  const [generalDesc, setGeneralDesc] = useState('');
  const [deliveryLocal, setDeliveryLocal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix / Crédito');
  const [timeframe, setTimeframe] = useState('2 dias úteis');
  const [observations, setObservations] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [validity, setValidity] = useState('');

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<{ id: string; num: string } | null>(null);

  // Items in builder
  const [activeItems, setActiveItems] = useState<Array<{
    id: string;
    servicoId: string;
    descricao: string;
    quantidade: number;
    unidade: string;
    valorUnitario: number;
    valorTotal: number;
    observacaoItem: string;
  }>>([]);

  // Filters
  const filteredBudgets = useMemo(() => {
    return budgets.filter(b => {
      const clientObj = clients.find(c => c.id === b.clienteId);
      const matchesSearch =
        b.numeroOrcamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.responsavelOrcamento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clientObj && clientObj.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'Todos' || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [budgets, clients, searchQuery, statusFilter]);

  // Handle open budget constructor
  const handleOpenNew = () => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Técnicos possuem apenas privilégio de leitura de orçamentos!');
      return;
    }

    const nextNumber = AgeEletricaDB.generateNextOrcamentoNumber();
    setEditingBudget(null);
    setSelectedClientId(clients[0]?.id || '');
    setStatus('Em análise');
    setGeneralDesc('');
    setDeliveryLocal(clients[0] ? `${clients[0].enderecoCompleto}, ${clients[0].numero} - ${clients[0].bairro}` : '');
    setPaymentMethod('Faturamento Pix à vista ou Cartão em até 3x');
    setTimeframe('2 dias úteis');
    setObservations('');
    setDiscount(0);

    const defaultValidity = new Date();
    defaultValidity.setDate(defaultValidity.getDate() + 15); // 15 days standard
    setValidity(defaultValidity.toISOString().substring(0, 10));

    setActiveItems([]);
    setIsBuilderOpen(true);
  };

  const handleOpenEdit = (b: Orcamento) => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Técnicos possuem apenas privilégio de leitura de orçamentos!');
      return;
    }

    setEditingBudget(b);
    setSelectedClientId(b.clienteId);
    setStatus(b.status);
    setGeneralDesc(b.descricaoGeral);
    setDeliveryLocal(b.localServico);
    setPaymentMethod(b.formaPagamento);
    setTimeframe(b.prazoExecucao);
    setObservations(b.observacoes);
    setDiscount(b.desconto);
    setValidity(b.validadeOrcamento);

    // Filter items related to this budget
    const matchedItems = budgetItems.filter(item => item.orcamentoId === b.id);
    setActiveItems(matchedItems.map(item => ({
      id: item.id,
      servicoId: item.servicoId,
      descricao: item.descricaoItem,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      observacaoItem: item.observacaoItem
    })));

    setIsBuilderOpen(true);
  };

  const handleClientChange = (cid: string) => {
    setSelectedClientId(cid);
    const clientObj = clients.find(c => c.id === cid);
    if (clientObj) {
      setDeliveryLocal(`${clientObj.enderecoCompleto || ''}, ${clientObj.numero || ''} - ${clientObj.bairro || ''}, ${clientObj.cidade || ''}/${clientObj.estado || ''}`);
    }
  };

  // Items control
  const handleAddLineItem = () => {
    const firstSrv = services[0];
    if (!firstSrv) return;

    setActiveItems([
      ...activeItems,
      {
        id: `item-temp-${Date.now()}-${Math.random()}`,
        servicoId: firstSrv.id,
        descricao: firstSrv.nomeServico,
        quantidade: 1,
        unidade: firstSrv.unidadeCobranca,
        valorUnitario: firstSrv.precoBase,
        valorTotal: firstSrv.precoBase,
        observacaoItem: ''
      }
    ]);
  };

  const handleUpdateLineItem = (idx: number, field: string, val: any) => {
    const updated = [...activeItems];
    const item = { ...updated[idx] };

    if (field === 'servicoId') {
      const srvObj = services.find(s => s.id === val);
      if (srvObj) {
        item.servicoId = srvObj.id;
        item.descricao = srvObj.nomeServico;
        item.unidade = srvObj.unidadeCobranca;
        item.valorUnitario = srvObj.precoBase;
        item.valorTotal = srvObj.precoBase * item.quantidade;
      }
    } else if (field === 'quantidade') {
      const qty = parseFloat(val) || 0;
      item.quantidade = qty;
      item.valorTotal = qty * item.valorUnitario;
    } else if (field === 'valorUnitario') {
      const price = parseFloat(val) || 0;
      item.valorUnitario = price;
      item.valorTotal = item.quantidade * price;
    } else if (field === 'descricao') {
      item.descricao = val;
    } else if (field === 'observacaoItem') {
      item.observacaoItem = val;
    }

    updated[idx] = item;
    setActiveItems(updated);
  };

  const handleRemoveLineItem = (idx: number) => {
    setActiveItems(activeItems.filter((_, i) => i !== idx));
  };

  // Math totals
  const subtotal = useMemo(() => {
    return activeItems.reduce((acc, curr) => acc + curr.valorTotal, 0);
  }, [activeItems]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Vincule um cliente cadastrado!');
      return;
    }
    if (activeItems.length === 0) {
      setErrorMessage('Adicione pelo menos 1 serviço ou item ao orçamento!');
      return;
    }

    let bId = editingBudget ? editingBudget.id : `orc-${Date.now()}`;
    let bNum = editingBudget ? editingBudget.numeroOrcamento : AgeEletricaDB.generateNextOrcamentoNumber();

    const finalizedBudget: Orcamento = {
      id: bId,
      numeroOrcamento: bNum,
      clienteId: selectedClientId,
      dataOrcamento: editingBudget ? editingBudget.dataOrcamento : new Date().toISOString().substring(0, 10),
      validadeOrcamento: validity,
      responsavelOrcamento: editingBudget ? editingBudget.responsavelOrcamento : userName,
      status,
      descricaoGeral: generalDesc || 'Serviços Elétricos Profissionais AGE',
      localServico: deliveryLocal,
      formaPagamento: paymentMethod,
      prazoExecucao: timeframe,
      observacoes: observations,
      subtotal,
      desconto: discount,
      valorTotal: total,
      dataCriacao: editingBudget ? editingBudget.dataCriacao : new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    // Construct persistent items list
    const finalizedItems: ItemOrcamento[] = activeItems.map((item, idx) => ({
      id: item.id.startsWith('item-temp-') ? `item-pers-${idx}-${Date.now()}` : item.id,
      orcamentoId: bId,
      servicoId: item.servicoId,
      descricaoItem: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valorUnitario: item.valorUnitario,
      valorTotal: item.valorTotal,
      observacaoItem: item.observacaoItem
    }));

    // Save
    let updatedBudgets: Orcamento[];
    let updatedItems: ItemOrcamento[];

    if (editingBudget) {
      updatedBudgets = budgets.map(x => x.id === bId ? finalizedBudget : x);
      // Clean previous items associated to budget, re-append
      updatedItems = [
        ...budgetItems.filter(item => item.orcamentoId !== bId),
        ...finalizedItems
      ];
    } else {
      updatedBudgets = [finalizedBudget, ...budgets];
      updatedItems = [...budgetItems, ...finalizedItems];
    }

    onSaveBudgets(updatedBudgets, updatedItems);
    setIsBuilderOpen(false);
  };

  const handleDeleteBudgetTrigger = (id: string, numCode: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Permissão restrita. Apenas Administradores podem excluir orçamentos!');
      return;
    }
    setBudgetToDelete({ id, num: numCode });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (budgetToDelete) {
      const updatedB = budgets.filter(b => b.id !== budgetToDelete.id);
      const updatedI = budgetItems.filter(i => i.orcamentoId !== budgetToDelete.id);
      onSaveBudgets(updatedB, updatedI);
      setBudgetToDelete(null);
      setSuccessMessage('Orçamento excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsConfirmOpen(false);
  };

  // Copy WhatsApp layout link standard
  const handleCopyWhatsAppText = (b: Orcamento) => {
    const clientObj = clients.find(c => c.id === b.clienteId);
    if (!clientObj) return;

    const baseMessage = `Olá, ${clientObj.nomeCompleto}! Segue o orçamento solicitado para a AGE Elétrica.\n\n📄 *Orçamento nº:* ${b.numeroOrcamento}\n⚡ *Escopo:* ${b.descricaoGeral}\n💵 *Valor Total:* R$ ${b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🗓️ *Validade:* ${b.validadeOrcamento.split('-').reverse().join('/')}\n\nQualquer dúvida técnica ou comercial, estamos de prontidão para agendar os eletricistas!`;

    navigator.clipboard.writeText(baseMessage);
    setSuccessMessage('Template de WhatsApp copiado para a Área de Transferência! Cole no chat do cliente.');
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  // PDF Print Trigger
  const handlePrint = () => {
    window.print();
  };

  // Open Budget PDF/Print view in a clean standalone window/tab (iOS / PWA / Android fallback supported)
  const handleOpenInNewTabBudget = (b: Orcamento) => {
    const clientObj = clients.find(cl => cl.id === b.clienteId);
    const clientDetailsHtml = clientObj ? `
      <div>
        <h3 class="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">CLIENTE DESTINATÁRIO</h3>
        <div class="space-y-1 text-zinc-700 font-sans">
          <p class="font-extrabold text-black text-[13px]">${clientObj.nomeCompleto}</p>
          <p>WhatsApp: ${clientObj.whatsapp}</p>
          <p>Tipo do Imóvel: ${clientObj.tipoCliente}</p>
          <p>Local do Serviço: ${b.localServico || 'Natal, RN'}</p>
        </div>
      </div>
    ` : `
      <div>
        <h3 class="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">CLIENTE DESTINATÁRIO</h3>
        <p class="text-red-500 font-mono">Cliente não localizado no banco.</p>
      </div>
    `;

    const itemsHtml = budgetItems
      .filter(item => item.orcamentoId === b.id)
      .map((it, idx) => `
        <tr class="text-zinc-800 font-sans border-b border-zinc-150">
          <td class="p-2.5 font-medium">${it.descricaoItem}</td>
          <td class="p-2.5 text-center font-mono">${it.quantidade}</td>
          <td class="p-2.5 text-right font-mono">R$ ${it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="p-2.5 text-right font-mono font-bold text-black">R$ ${it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

    const logoHtml = (config.logoPdf || config.logo) ? `
      <img src="${config.logoPdf || config.logo}" alt="Logo" class="max-h-16 max-w-[120px] object-contain shrink-0 rounded-md" />
    ` : `
      <div class="p-1 px-1.5 bg-zinc-950 text-amber-500 font-extrabold text-lg rounded shrink-0">⚡ AGE</div>
    `;

    const docHtml = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Orçamento ${b.numeroOrcamento} - AGE Elétrica</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            .no-print { display: none !important; }
            body { background: #ffffff !important; padding: 0 !important; }
            .print-card { box-shadow: none !important; border: none !important; max-width: 100% !important; margin: 0 !important; }
          }
        </style>
      </head>
      <body class="bg-zinc-100 p-4 md:p-8 font-sans">
        <div class="max-w-4xl mx-auto w-full bg-zinc-900 text-white p-4 rounded-xl mb-6 flex justify-between items-center no-print shadow-md">
          <span class="text-xs font-bold font-mono tracking-wider">Visualização Segura - Orçamento AGE Elétrica</span>
          <div class="flex gap-2">
            <button onclick="window.print()" class="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              Gerar PDF / Imprimir
            </button>
            <button onclick="window.close()" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer">
              Fechar
            </button>
          </div>
        </div>

        <div class="max-w-4xl mx-auto w-full bg-white text-black p-8 md:p-12 shadow-xl rounded-sm border border-gray-300 print-card">
          <div class="flex justify-between items-start border-b-2 border-amber-500 pb-5 mb-6">
            <div class="flex items-center gap-3">
              ${logoHtml}
              <div>
                <h1 class="text-lg font-black tracking-tight uppercase">${config.nomeEmpresa || 'AGE ELÉTRICA'}</h1>
                <p class="text-[10px] text-gray-500 tracking-wider">INSTALAÇÕES COLETIVAS • SISTEMAS DE QUADROS • CARREGAMENTO WALLBOX</p>
                <p class="text-[10px] text-gray-500">CNPJ: ${config.cnpj || '35.452.127/0001-90'} • CFT Ativo</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 font-mono block uppercase">DOCUMENTO FISCAL</span>
              <span class="text-xl font-bold text-amber-500 block font-mono">${b.numeroOrcamento}</span>
              <span class="text-[10px] text-gray-500 block font-mono">Emissão: ${b.dataOrcamento.split('-').reverse().join('/')}</span>
              <span class="text-[10px] text-red-500 block font-mono">Validade: ${b.validadeOrcamento.split('-').reverse().join('/')}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6 border-b pb-6">
            ${clientDetailsHtml}
            <div>
              <h3 class="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">RESPONSÁVEL TÉCNICO</h3>
              <div class="space-y-1 text-zinc-700">
                <p class="font-extrabold text-black font-sans">${b.responsavelOrcamento}</p>
                <p>NORMAS: <strong>NBR 5410, NR10, NR35</strong></p>
                <p>Instalações Certificadas de Alta Performance</p>
                <p>Contato corporativo: ${config.telefone || '(84) 99888-7766'}</p>
              </div>
            </div>
          </div>

          <div class="mb-6 space-y-2">
            <span class="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block">Escopo / Descrição Geral do Serviço</span>
            <p class="text-xs bg-zinc-50 border border-zinc-200 p-3.5 rounded leading-relaxed text-zinc-800 italic">${b.descricaoGeral}</p>
          </div>

          <div class="border border-zinc-150 rounded overflow-hidden mb-6">
            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-zinc-100 text-zinc-700 font-mono font-bold border-b border-zinc-200 uppercase tracking-wider">
                  <th class="p-2.5">Item</th>
                  <th class="p-2.5 text-center w-16">Qtd</th>
                  <th class="p-2.5 text-right w-28">Preço Unit.</th>
                  <th class="p-2.5 text-right w-28">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-150">
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div class="flex flex-col items-end gap-1.5 text-xs font-mono text-zinc-650 mb-8 border-b pb-4">
            <div>Subtotal Geral: R$ ${b.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            ${b.desconto > 0 ? `<div class="text-red-600 font-semibold">Desconto Concedido: R$ -${b.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>` : ''}
            <div class="text-sm font-bold text-zinc-950">
              Valor Total do Orçamento: <strong class="text-green-600 text-base">R$ ${b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[10.5px] mt-10">
            <div class="space-y-1">
              <p class="font-bold text-zinc-800">CONDIÇÕES COMERCIAIS</p>
              <p><strong>Prazo de Execução:</strong> ${b.prazoExecucao}</p>
              <p><strong>Forma de Pagamento:</strong> ${b.formaPagamento}</p>
            </div>
            <div class="text-center pt-8 border-t border-zinc-200 mt-4 sm:pt-4 sm:border-t-0 font-mono">
              <div class="w-full max-w-[220px] mx-auto border-b border-zinc-400 py-3 block text-center"></div>
              <span class="font-bold text-zinc-900 block mt-1">${b.responsavelOrcamento}</span>
            </div>
          </div>

          <div class="text-[8px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t">
            ${config.rodapePdf || 'A AGE Elétrica agradece a preferência.'}
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(docHtml);
      newTab.document.close();
    } else {
      const blob = new Blob([docHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Orcamento_${b.numeroOrcamento}.html`;
      link.click();
    }
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
          <h2 className="text-xl font-extrabold text-white">Central de Orçamentos e Invoices</h2>
          <p className="text-zinc-500 text-xs text-sans">Crie, monitore, altere status e emita PDFs técnicos estruturados em conformidade com o NBR 5410.</p>
        </div>
        {userRole !== 'Tecnico/Eletricista' && (
          <button
            onClick={handleOpenNew}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-black" strokeWidth={3} /> NOVO ORÇAMENTO
          </button>
        )}
      </div>

      {/* Index Filters row */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between no-print">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de orçamento, técnico ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-1.5 w-full md:w-auto overflow-x-auto justify-end">
          {['Todos', 'Em análise', 'Enviado', 'Aprovado', 'Recusado', 'Finalizado'].map(st => (
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

      {/* Budgets list presentation */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900/60 p-12 text-center text-zinc-500 no-print">
          <FileText className="w-12 h-12 text-zinc-750 mx-auto mb-3" />
          <span className="text-white font-bold block mb-1">Nenhum orçamento encontrado</span>
          <span className="text-xs">Tente redefinir os filtros superiores ou inicie um orçamento rápido para um cliente.</span>
        </div>
      ) : (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden no-print">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/20 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                  <th className="py-4 px-5">Código / Emissão</th>
                  <th className="py-4 px-5">Cliente Vinculado</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Descrição Geral</th>
                  <th className="py-4 px-5 font-mono text-right">Valor Total</th>
                  <th className="py-4 px-5 text-right">Ações Técnicas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {filteredBudgets.map(b => {
                  const clientObj = clients.find(c => c.id === b.clienteId);
                  return (
                    <tr key={b.id} className="hover:bg-zinc-900/10 transition group text-zinc-400">
                      <td className="py-4 px-5 text-white font-mono font-bold">
                        <span className="text-amber-500 block">{b.numeroOrcamento}</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Emitido: {b.dataOrcamento.split('-').reverse().join('/')}</span>
                      </td>
                      <td className="py-4 px-5">
                        {clientObj ? (
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-white text-sm block">{clientObj.nomeCompleto}</span>
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase">{clientObj.tipoCliente} • {clientObj.cidade}</span>
                          </div>
                        ) : (
                          <span className="text-red-400 italic">Desconhecido</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                          b.status === 'Aprovado' || b.status === 'Finalizado' ? 'bg-green-500/10 text-green-400 border-green-550/20' :
                          b.status === 'Recusado' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          b.status === 'Enviado' ? 'bg-amber-500/10 text-amber-500 border-amber-550/20' :
                          'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-5 max-w-xs block leading-relaxed truncate mt-2 text-zinc-300" title={b.descricaoGeral}>
                        {b.descricaoGeral}
                      </td>
                      <td className="py-4 px-5 text-right font-mono font-extrabold text-white text-sm">
                        R$ {b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2 text-zinc-500">
                          <button
                            onClick={() => setSelectedBudgetForPrint(b)}
                            className="p-1 px-2.5 text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white rounded transition font-mono uppercase flex items-center gap-1"
                            title="Imprimir visualizador A4"
                          >
                            <Printer className="w-3 h-3" /> PDF A4
                          </button>
                          <button
                            onClick={() => handleCopyWhatsAppText(b)}
                            className="p-1 px-1.5 bg-zinc-900 border border-zinc-800 text-green-400 hover:bg-green-500/10 rounded transition"
                            title="Copia modelo WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {userRole !== 'Tecnico/Eletricista' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(b)}
                                className="p-1 px-1.5 bg-zinc-905 border border-zinc-900 hover:text-amber-500 rounded transition"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {userRole === 'Administrador' && (
                                <button
                                  onClick={() => handleDeleteBudgetTrigger(b.id, b.numeroOrcamento)}
                                  className="p-1 px-1.5 bg-zinc-905 border border-zinc-900 hover:text-red-400 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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

      {/* MODAL: BUDGET CONSTRUCTOR / BUILDER */}
      {isBuilderOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => setIsBuilderOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-zinc-850 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              {editingBudget ? `Alterar Orçamento: ${editingBudget.numeroOrcamento}` : 'Montar Orçamento Completo'}
            </h3>

            <form onSubmit={handleSaveBudget} className="space-y-6">
              
              {/* Client & Status header row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-850">
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-500 block mb-1">Selecione o Cliente Cadastrado *</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="" disabled>Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.tipoCliente})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Status Ativo do Orçamento</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusOrcamento)}
                    className="w-full bg-zinc-900 border border-zinc-800 outline-none rounded-xl py-2 px-3 text-xs text-white uppercase font-mono"
                  >
                    <option value="Em análise">Em análise</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Recusado">Recusado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Validade do Orçamento *</label>
                  <input
                    type="date"
                    required
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* General inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Descrição Geral do Serviço (Escopo)</label>
                  <input
                    type="text"
                    required
                    value={generalDesc}
                    onChange={(e) => setGeneralDesc(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white outline-none"
                    placeholder="Ex: Instalação de fiação para Wallbox de 22kW..."
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Local de Execução (Endereço Completo)</label>
                  <input
                    type="text"
                    required
                    value={deliveryLocal}
                    onChange={(e) => setDeliveryLocal(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Condições de Pagamento Padrão</label>
                  <input
                    type="text"
                    required
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Prazo Estimado de Execução</label>
                  <input
                    type="text"
                    required
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Observações Técnicas Relevantes</label>
                  <input
                    type="text"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white outline-none"
                    placeholder="Ex: Disjuntores e cabeamento fornecidos pelo contratante..."
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-zinc-850 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-mono font-bold text-amber-500 uppercase">Itens de Mão de Obra e Atividades</h4>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] uppercase font-mono border border-zinc-700"
                  >
                    + ADICIONAR ATIVIDADE
                  </button>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {activeItems.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-950 p-3 rounded-xl border border-zinc-900 group">
                      
                      {/* Service selector */}
                      <div className="md:col-span-4">
                        <label className="text-[10px] text-zinc-500 font-mono block">Serviço de Referência</label>
                        <select
                          value={item.servicoId}
                          onChange={(e) => handleUpdateLineItem(idx, 'servicoId', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1.5 text-xs text-white outline-none"
                        >
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.nomeServico}</option>
                          ))}
                        </select>
                      </div>

                      {/* Customized Description */}
                      <div className="md:col-span-3">
                        <label className="text-[10px] text-zinc-500 font-mono block">Descrição Customizada</label>
                        <input
                          type="text"
                          value={item.descricao}
                          onChange={(e) => handleUpdateLineItem(idx, 'descricao', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1 text-xs text-white outline-none"
                        />
                      </div>

                      {/* Qtd */}
                      <div className="md:col-span-1">
                        <label className="text-[10px] text-zinc-500 font-mono block">Quantidade</label>
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => handleUpdateLineItem(idx, 'quantidade', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1 text-xs text-white font-mono text-center outline-none"
                        />
                      </div>

                      {/* Unit label indicator */}
                      <div className="md:col-span-1 text-center font-mono">
                        <span className="text-[10px] text-zinc-500 block">Medida</span>
                        <span className="text-[10px] text-gray-400 capitalize block mt-2">{item.unidade}</span>
                      </div>

                      {/* Price standard */}
                      <div className="md:col-span-1.5">
                        <label className="text-[10px] text-zinc-500 font-mono block">Unitário</label>
                        <input
                          type="number"
                          value={item.valorUnitario}
                          onChange={(e) => handleUpdateLineItem(idx, 'valorUnitario', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-1 text-xs text-white font-mono outline-none"
                        />
                      </div>

                      {/* Total */}
                      <div className="md:col-span-1.5 text-right font-mono pr-2">
                        <span className="text-[10px] text-zinc-500 block">Total</span>
                        <span className="text-xs font-bold text-white block mt-2">R$ {item.valorTotal.toFixed(2)}</span>
                      </div>

                      {/* Delete item line */}
                      <div className="md:col-span-1 flex items-end justify-center md:pb-1">
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="text-zinc-550 hover:text-red-400 p-1 rounded hover:bg-zinc-900 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Extra custom remark line */}
                      <div className="md:col-span-12 border-t border-zinc-900/60 pt-1.5 flex gap-2 items-center">
                        <span className="text-[9px] text-amber-500 font-mono uppercase shrink-0">Observação do Item:</span>
                        <input
                          type="text"
                          placeholder="Ex: Lorenzetti Advanced 110V ou bypass no DR..."
                          value={item.observacaoItem}
                          onChange={(e) => handleUpdateLineItem(idx, 'observacaoItem', e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-[10px] text-zinc-400 font-mono p-0 h-4"
                        />
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Discount and mathematical Summary */}
              <div className="pt-4 border-t border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900/85">
                  <label className="text-xs text-zinc-400 block mb-1">Aplicar Desconto Especial (R$)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono outline-none"
                  />
                  <span className="text-[10px] text-zinc-650 font-mono block mt-2">※ O desconto reduz diretamente o subtotal da fatura.</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-900/85 text-right space-y-2">
                  <div className="text-xs text-zinc-400 font-mono">
                    SUBTOTAL: <span className="text-gray-300 font-bold">R$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-red-400 font-mono">
                    DESCONTO: <span className="font-bold">R$ {discount.toFixed(2)}</span>
                  </div>
                  <div className="text-base text-white font-mono font-bold border-t border-zinc-900 pt-2 flex justify-between">
                    <span>VALOR TOTAL:</span>
                    <span className="text-amber-500 text-lg">R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Salvar Orçamento
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* A4 PRINT VIEW OVERLAY MODAL */}
      {selectedBudgetForPrint && (
        <div className="fixed inset-0 bg-zinc-100 dark:bg-[#0c0c0e] backdrop-blur-md z-50 overflow-y-auto flex flex-col justify-start p-2 sm:p-4 md:p-8 no-print-backdrop text-zinc-900">
          
          {/* Header commands in preview */}
          <div className="max-w-4xl mx-auto w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 no-print shadow-xl">
            <span className="text-white text-xs font-extrabold font-mono uppercase tracking-wider">
              Visualização de Orçamento ({selectedBudgetForPrint.numeroOrcamento})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Baixar PDF / Imprimir
              </button>
              <button
                onClick={() => handleOpenInNewTabBudget(selectedBudgetForPrint)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
              </button>
              <button
                onClick={() => setSelectedBudgetForPrint(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl transition text-xs cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>

          {/* Core iOS Safari PWA Fallback Notice */}
          <div className="max-w-4xl mx-auto w-full bg-zinc-900/50 border border-zinc-200/20 backdrop-blur p-4 rounded-2xl mb-6 text-xs flex flex-col md:flex-row justify-between md:items-center gap-3 no-print text-zinc-700 dark:text-zinc-300">
            <div>
              <p className="font-bold text-amber-600 dark:text-amber-400">💡 No iPhone / PWA da AGE Elétrica:</p>
              <p className="text-[11px] mt-0.5">Se o carregamento interno falhar ou ficar cinza/preto, toque em "Abrir em Nova Aba" para usar o visualizador do Safari e salvar o arquivo diretamente no dispositivo.</p>
            </div>
            <button
              onClick={() => handleOpenInNewTabBudget(selectedBudgetForPrint)}
              className="bg-zinc-800 hover:bg-zinc-750 text-white font-bold px-3.5 py-2 rounded-xl text-[10.5px] uppercase tracking-wide shrink-0 transition-all flex items-center justify-center gap-1.5 self-start md:self-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" /> Testar Nova Aba
            </button>
          </div>

          {/* Core Invoice container designed as standard corporative paper block */}
          <div className="max-w-4xl mx-auto w-full bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 p-4 sm:p-8 md:p-12 shadow-2xl rounded-xl sm:rounded-sm font-sans border border-zinc-250 dark:border-zinc-250 print-card">
            
            {/* Header section containing custom lightning logo */}
            <div className="flex justify-between items-start border-b-2 border-amber-500 pb-5 mb-6">
              <div className="flex items-center gap-3">
                {(config.logoPdf || config.logo) ? (
                  <img
                    src={config.logoPdf || config.logo}
                    alt="Logo"
                    className="max-h-16 max-w-[120px] object-contain shrink-0 rounded-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-1 px-1.5 bg-zinc-950 text-amber-500 font-extrabold text-lg rounded shrink-0 print:border fill-black">
                    ⚡ AGE
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-black tracking-tight uppercase">{config.nomeEmpresa}</h1>
                  <p className="text-[10px] text-gray-500 tracking-wider">INSTALAÇÕES COLETIVAS • SISTEMAS DE QUADROS • CARREGAMENTO WALLBOX</p>
                  <p className="text-[10px] text-gray-500">CNPJ: {config.cnpj} • Inscrição Municipal • CFT Ativo</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-400 font-mono block uppercase">DOCUMENTO FISCAL</span>
                <span className="text-xl font-bold text-amber-500 block font-mono">{selectedBudgetForPrint.numeroOrcamento}</span>
                <span className="text-[10px] text-gray-500 block font-mono">Emissão: {selectedBudgetForPrint.dataOrcamento.split('-').reverse().join('/')}</span>
                <span className="text-[10px] text-red-500 block font-mono">Validade: {selectedBudgetForPrint.validadeOrcamento.split('-').reverse().join('/')}</span>
              </div>
            </div>

            {/* Issuer operational facts */}
            <div className="grid grid-cols-2 gap-6 bg-zinc-50 border border-gray-150 p-4 rounded-sm text-[11px] mb-6">
              <div>
                <span className="font-bold text-amber-500 uppercase block mb-1 text-[9px] tracking-wider">Dados do Emissor Comercial:</span>
                <p className="font-extrabold">{config.nomeFantasia} Prestação e Engenharia</p>
                <p>Endereço: {config.endereco}</p>
                <p>Cidade/UF: {config.cidade} - {config.estado}</p>
                <p>E-mail: {config.email}</p>
                <p>WhatsApp: {config.whatsapp}</p>
              </div>

              <div>
                <span className="font-bold text-amber-500 uppercase block mb-1 text-[9px] tracking-wider">Identificação do Cliente Beneficiário:</span>
                {(() => {
                  const c = clients.find(cl => cl.id === selectedBudgetForPrint.clienteId);
                  if (!c) return <p className="italic text-red-400">Dados do cliente ausentes</p>;
                  return (
                    <>
                      <p className="font-extrabold">{c.nomeCompleto}</p>
                      <p>CPF/CNPJ: {c.cpfCnpj || 'Não cadastrado'}</p>
                      <p>Fone de Contato: {c.telefone}</p>
                      <p>Endereço do Local: {selectedBudgetForPrint.localServico}</p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Scope details */}
            <div className="mb-6">
              <span className="font-bold text-amber-500 uppercase block mb-1 text-[9px] tracking-wider">Escopo e Descrição dos Serviços:</span>
              <p className="text-xs bg-zinc-50 border border-gray-150 p-3 rounded-sm leading-relaxed italic">{selectedBudgetForPrint.descricaoGeral}</p>
            </div>

            {/* Items Table Grid */}
            <div className="mb-6 border border-gray-200 rounded-sm overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950 text-white font-mono text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item / Atividade Especializada</th>
                    <th className="py-2.5 px-3 text-center">Unidade</th>
                    <th className="py-2.5 px-3 text-center">Quantidade</th>
                    <th className="py-2.5 px-3 text-right">Unitário</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {budgetItems
                    .filter(item => item.orcamentoId === selectedBudgetForPrint.id)
                    .map((item, idx) => (
                      <tr key={item.id} className="hover:bg-zinc-50">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 block">{item.descricaoItem}</span>
                          {item.observacaoItem && (
                            <span className="text-[10px] text-gray-500 font-mono block italic">⚙️ {item.observacaoItem}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono capitalize text-[10px]">{item.unidade}</td>
                        <td className="py-3 px-3 text-center font-mono">{item.quantidade}</td>
                        <td className="py-3 px-3 text-right font-mono text-gray-600">R$ {item.valorUnitario.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">R$ {item.valorTotal.toFixed(2)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Balance Calculation */}
            <div className="flex justify-end mb-6">
              <div className="max-w-xs w-full bg-zinc-50 border border-gray-150 p-4 rounded-sm text-right space-y-1.5 text-xs">
                <div className="font-mono text-gray-500">Subtotal: R$ {selectedBudgetForPrint.subtotal.toFixed(2)}</div>
                <div className="font-mono text-red-500">Desconto: R$ -{selectedBudgetForPrint.desconto.toFixed(2)}</div>
                <div className="font-mono font-black text-slate-900 text-sm border-t border-gray-200 pt-2 flex justify-between">
                  <span>Valor Líquido:</span>
                  <span className="text-slate-950">R$ {selectedBudgetForPrint.valorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment operational parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-gray-200 text-[11px] mb-8">
              <div>
                <span className="font-bold text-amber-500 uppercase block mb-1 text-[9px]">Instruções de Pagamento:</span>
                <p className="font-bold">Forma de Pagamento: {selectedBudgetForPrint.formaPagamento}</p>
                <p>Transferência via Chave Pix (CNPJ): <span className="font-semibold">{config.chavePix}</span></p>
                <p>Dados Bancários: {config.dadosBancarios}</p>
                <p>Prazo Executivo Estimado: {selectedBudgetForPrint.prazoExecucao}</p>
              </div>

              <div>
                <span className="font-bold text-amber-500 uppercase block mb-1 text-[9px]">Condições Gerais AGE:</span>
                <p className="text-gray-500 leading-relaxed text-[10px] italic">
                  * Materiais não inclusos, salvo especificados neste documento.<br/>
                  * A garantia técnica cobre a fiação e mão de obra pelo prazo legal de 90 dias.<br/>
                  * Readequações extras de escopo demandarão aditivos orçamentários.
                </p>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4 mb-8">
              <div className="space-y-1">
                <div className="border-b border-gray-300 mx-auto w-48 h-8" />
                <span className="font-extrabold text-slate-800 block text-center mt-2">AGE Elétrica Prestador</span>
                <span className="text-[10px] text-gray-400 block font-mono">Assinado Digitalmente por: {selectedBudgetForPrint.responsavelOrcamento}</span>
              </div>
              <div className="space-y-1">
                <div className="border-b border-gray-300 mx-auto w-48 h-8" />
                <span className="font-extrabold text-slate-800 block text-center mt-2">Aceite de Contratação Cliente</span>
                <span className="text-[10px] text-gray-400 block font-mono">Ciência e Aprovação de Vistoria</span>
              </div>
            </div>

            {/* Standard footprint */}
            <div className="text-center text-[10px] text-gray-400 font-mono border-t border-gray-150 pt-3">
              {config.rodapePdf || 'A AGE Elétrica agradece a preferência.'}
            </div>

          </div>

          {/* Close floating element in printout overlay */}
          <div className="max-w-4xl mx-auto w-full pt-4 text-center text-xs text-zinc-500 uppercase tracking-widest no-print">
            Clique em "Imprimir / PDF" para obter cópia vetorizada de alta qualidade • Pressione Esc para voltar
          </div>

        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Excluir Orçamento?"
        message={`Tem certeza de que deseja banir o orçamento ${budgetToDelete?.num}?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
