import React, { useEffect, useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { AgeEletricaDB } from '../dataSeed';
import { Cliente, Orcamento, ItemOrcamento, Recibo, ConfiguracaoEmpresa } from '../types';

interface StandalonePrintProps {
  printBudgetId: string | null;
  printReceiptId: string | null;
  onBack: () => void;
}

export function StandalonePrint({ printBudgetId, printReceiptId, onBack }: StandalonePrintProps) {
  const [budget, setBudget] = useState<Orcamento | null>(null);
  const [budgetItems, setBudgetItems] = useState<ItemOrcamento[]>([]);
  const [receipt, setReceipt] = useState<Recibo | null>(null);
  const [client, setClient] = useState<Cliente | null>(null);
  const [config, setConfig] = useState<ConfiguracaoEmpresa>(AgeEletricaDB.getConfig());

  useEffect(() => {
    // Force initial state loads
    const allClients = AgeEletricaDB.getClients();
    const allBudgets = AgeEletricaDB.getBudgets();
    const allItems = AgeEletricaDB.getBudgetItems();
    const allReceipts = AgeEletricaDB.getReceipts();
    const companyConfig = AgeEletricaDB.getConfig();
    setConfig(companyConfig);

    if (printBudgetId) {
      const match = allBudgets.find(b => b.id === printBudgetId || b.numeroOrcamento === printBudgetId);
      if (match) {
        setBudget(match);
        const filteredItems = allItems.filter(it => it.orcamentoId === match.id);
        setBudgetItems(filteredItems);
        const matchedClient = allClients.find(c => c.id === match.clienteId);
        if (matchedClient) {
          setClient(matchedClient);
        }
      }
    } else if (printReceiptId) {
      const match = allReceipts.find(r => r.id === printReceiptId || r.numeroRecibo === printReceiptId);
      if (match) {
        setReceipt(match);
        const matchedClient = allClients.find(c => c.id === match.clienteId);
        if (matchedClient) {
          setClient(matchedClient);
        }
      }
    }
  }, [printBudgetId, printReceiptId]);

  const handlePrint = () => {
    window.print();
  };

  if (!budget && !receipt) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-zinc-200">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Documento Não Localizado</h2>
          <p className="text-sm text-zinc-500 mb-6">Não conseguimos localizar o orçamento ou recibo solicitado. Por favor, verifique o link ou retorne ao sistema.</p>
          <button
            onClick={onBack}
            className="w-full bg-[#f2b705] hover:bg-[#f2b705]/90 text-black font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Sistema
          </button>
        </div>
      </div>
    );
  }

  const logoHtml = (config.logoPdf || config.logo) ? (
    <img
      src={config.logoPdf || config.logo}
      alt="Logo"
      className="max-h-16 max-w-[120px] object-contain shrink-0 rounded-md"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div className="p-1.5 px-2.5 bg-zinc-950 text-amber-500 font-extrabold text-base rounded shrink-0 leading-none">
      ⚡ AGE
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900 flex flex-col items-center py-4 px-2 sm:p-6 md:p-8 no-print-backdrop">
      {/* Top action header (hidden on print) */}
      <div className="max-w-4xl w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl mb-6 flex justify-between items-center no-print shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white p-2 rounded-xl transition cursor-pointer"
            title="Voltar ao Sistema"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-white text-xs font-extrabold font-mono uppercase tracking-wider hidden sm:inline-block">
            {budget ? `Orçamento ${budget.numeroOrcamento}` : `Recibo ${receipt?.numeroRecibo}`}
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="bg-[#f2b705] hover:bg-amber-500 text-black font-extrabold px-4 py-2.5 rounded-xl transition text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg"
        >
          <Printer className="w-4 h-4" /> Gerar PDF / Imprimir
        </button>
      </div>

      {/* A4 Styled Pure White Paper Sheet Container */}
      <div className="max-w-4xl w-full bg-white text-zinc-900 p-6 sm:p-8 md:p-12 shadow-2xl rounded-sm font-sans border border-zinc-300 print-card mb-12">
        {budget && (
          <div className="space-y-6">
            {/* Header section containing custom lightning logo */}
            <div className="flex justify-between items-start border-b-2 border-amber-500 pb-5 mb-6">
              <div className="flex items-center gap-3">
                {logoHtml}
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-zinc-900 leading-none">
                    {config.nomeEmpresa || 'AGE ELÉTRICA'}
                  </h1>
                  <p className="text-[9px] text-zinc-500 tracking-wider mt-1 block max-w-sm">
                    INSTALAÇÕES COLETIVAS • SISTEMAS DE QUADROS • CARREGAMENTO WALLBOX
                  </p>
                  <p className="text-[9px] text-zinc-550 block mt-0.5">
                    CNPJ: {config.cnpj || '35.452.127/0001-90'} • CFT Ativo
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 font-mono block uppercase">ORÇAMENTO</span>
                <span className="text-base sm:text-xl font-black text-amber-500 block font-mono">
                  {budget.numeroOrcamento}
                </span>
                <span className="text-[9px] text-zinc-500 block font-mono">
                  Emissão: {budget.dataOrcamento.split('-').reverse().join('/')}
                </span>
                <span className="text-[9px] text-red-500 block font-mono font-bold">
                  Validade: {budget.validadeOrcamento.split('-').reverse().join('/')}
                </span>
              </div>
            </div>

            {/* Client Context Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs mb-6 border-b border-zinc-150 pb-6">
              <div>
                <h3 className="font-extrabold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[10.5px]">
                  CLIENTE DESTINATÁRIO
                </h3>
                {client ? (
                  <div className="space-y-1 text-zinc-700 font-sans">
                    <p className="font-extrabold text-zinc-955 text-[13px]">{client.nomeCompleto}</p>
                    <p>WhatsApp: {client.whatsapp}</p>
                    <p>Tipo do Imóvel: {client.tipoCliente}</p>
                    <p>Local do Serviço: {budget.localServico || 'Natal, RN'}</p>
                  </div>
                ) : (
                  <p className="text-red-500 font-mono">Cliente não localizado no banco.</p>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[10.5px]">
                  RESPONSÁVEL TÉCNICO
                </h3>
                <div className="space-y-1 text-zinc-700">
                  <p className="font-extrabold text-zinc-955 font-sans">{budget.responsavelOrcamento}</p>
                  <p>Inspecionado pelas Normas Regulamentadoras: <strong>NBR 5410, NR10, NR35</strong></p>
                  <p>Instalações Certificadas de Alta Performance</p>
                  <p>Contato corporativo: {config.telefone || '(84) 99888-7766'}</p>
                </div>
              </div>
            </div>

            {/* Scope / General description */}
            <div className="mb-6 space-y-1.5">
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block">
                Escopo / Descrição Geral do Serviço
              </span>
              <p className="text-xs bg-zinc-50 border border-zinc-200 p-3.5 rounded-lg leading-relaxed text-zinc-800 italic">
                {budget.descricaoGeral}
              </p>
            </div>

            {/* Itemized Table */}
            <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-mono font-bold border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center w-16">Qtd</th>
                    <th className="p-2.5 text-right w-28">Preço Unit.</th>
                    <th className="p-2.5 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {budgetItems.map((it, idx) => (
                    <tr key={it.id || idx} className="text-zinc-800 font-sans">
                      <td className="p-2.5 font-medium">{it.descricaoItem}</td>
                      <td className="p-2.5 text-center font-mono">{it.quantidade}</td>
                      <td className="p-2.5 text-right font-mono">
                        R$ {it.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-zinc-900">
                        R$ {it.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {budgetItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-zinc-400 font-mono text-[11px]">
                        Nenhum item adicionado a este orçamento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary math block */}
            <div className="flex flex-col items-end gap-1.5 text-xs font-mono text-zinc-650 mb-8 border-b border-zinc-150 pb-4">
              <div>Subtotal Geral: R$ {budget.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              {budget.desconto > 0 && (
                <div className="text-red-600 font-semibold">Desconto Concedido: R$ -{budget.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              )}
              <div className="text-sm font-bold text-zinc-950">
                Valor Total do Orçamento: <strong className="text-green-600 text-base">R$ {budget.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {/* Standard footprint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[10.5px] mt-10">
              <div className="space-y-1">
                <p className="font-bold text-zinc-800">CONDIÇÕES COMERCIAIS</p>
                <p><strong>Prazo de Execução:</strong> {budget.prazoExecucao}</p>
                <p><strong>Forma de Pagamento:</strong> {budget.formaPagamento}</p>
                <p>Fiação antichama e barramentos dimensionados em cobre puro.</p>
              </div>

              <div className="text-center pt-8 border-t border-zinc-200 mt-4 sm:pt-4 sm:border-t-0 font-mono">
                <div className="w-full max-w-[220px] mx-auto border-b border-zinc-400 py-3 block text-center" />
                <span className="font-bold text-zinc-900 block mt-1">{budget.responsavelOrcamento}</span>
                <span className="text-[8px] text-zinc-500 block uppercase tracking-widest">Responsável pela Emissão</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[8px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t border-zinc-150">
              {config.rodapePdf || 'AGE Elétrica • Tecnologia, Confiança e Garantia NBR 5410'}
            </div>
          </div>
        )}

        {receipt && (
          <div className="space-y-6">
            {/* Header layout */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4 mb-6">
              {logoHtml}
              <div className="text-right">
                <span className="text-[11px] text-zinc-400 block font-mono">RECIBO DE QUITAÇÃO</span>
                <span className="text-base sm:text-lg font-black text-zinc-900 font-mono">{receipt.numeroRecibo}</span>
                <span className="text-xs font-mono block">Valor: <strong className="text-green-605">R$ {receipt.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            </div>

            {/* Recibo text container */}
            <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-lg mb-6 text-sm leading-relaxed text-zinc-800">
              <p className="mb-4">
                Recebemos de <strong className="text-zinc-950 text-base">{client ? client.nomeCompleto : 'Cliente Pagador'}</strong> as devidas importâncias financeiras do serviço executado.
              </p>

              <div className="bg-white/80 p-4 border border-zinc-150 rounded-lg my-4">
                <h3 className="font-extrabold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[10.5px]">CLIENTE BENEFICIÁRIO</h3>
                {client ? (
                  <div className="space-y-0.5 text-zinc-700 font-sans text-xs">
                    <p className="font-bold text-zinc-900">{client.nomeCompleto}</p>
                    <p>WhatsApp: {client.whatsapp}</p>
                    <p>Endereço: {client.enderecoCompleto || 'Natal, RN'} - {client.bairro}, {client.cidade}</p>
                  </div>
                ) : (
                  <p className="text-red-500 font-mono text-xs">Cliente não localizado no banco.</p>
                )}
              </div>

              <p className="mt-4">
                A importância de <strong className="text-zinc-950 font-mono">R$ {receipt.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> representa o faturamento integral e quitação total do escopo técnico:
              </p>

              <p className="bg-green-50 text-zinc-900 p-4 border border-green-200/60 rounded-lg font-bold italic my-3">
                "{receipt.referenteServico}"
              </p>

              <p className="text-xs leading-relaxed text-zinc-650 mt-4 font-sans">
                <strong>Garantia do Serviço:</strong> {receipt.observacoes || 'Garantia legal assegurada de 90 dias conforme dispõe o Código de Defesa do Consumidor.'}
              </p>
            </div>

            {/* Recibo signature/state footer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-700 mt-8 border-t border-zinc-200 pt-6">
              <div className="space-y-1 font-mono">
                <p className="font-bold text-zinc-900">DETALHES DA QUITAÇÃO</p>
                <p>Data Emissão: {receipt.dataEmissao.split('-').reverse().join('/')}</p>
                <p>Operado via: {receipt.formaPagamento}</p>
                <p className="text-green-600 font-bold uppercase font-sans">Estado comercial: PAGO E QUITADO</p>
              </div>
              <div className="text-center font-sans">
                <div className="w-full max-w-[200px] mx-auto border-b border-zinc-400 py-3.5 block" />
                <span className="font-bold text-zinc-950 block mt-1">{receipt.responsavelRecebimento}</span>
                <span className="text-[8px] text-[#f2b705] block uppercase tracking-widest font-bold mt-0.5">Técnico Sênior Autorizado</span>
              </div>
            </div>

            {/* Footer metadata info */}
            <div className="text-[8.5px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t border-zinc-150">
              Contatos corporativo para vistorias: {config.email || 'ageeletricasuporte@gmail.com'} • WhatsApp {config.whatsapp || '84 99988-8877'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
