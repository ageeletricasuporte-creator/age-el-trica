/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  UserPlus,
  FileText,
  Receipt,
  Smartphone,
  LogOut,
  Send,
  Plus,
  Trash2,
  Printer,
  ChevronRight,
  ArrowLeft,
  X,
  Upload,
  Check,
  Search,
  DollarSign,
  ExternalLink
} from 'lucide-react';
import { AgeEletricaDB } from '../dataSeed';
import {
  Cliente,
  Servico,
  Orcamento,
  ItemOrcamento,
  Recibo,
  ConfiguracaoEmpresa,
  Usuario
} from '../types';

interface AppTecnicoProps {
  onBackToSite: () => void;
}

export function AppTecnico({ onBackToSite }: AppTecnicoProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  // Database states
  const [clients, setClients] = useState<Cliente[]>([]);
  const [budgets, setBudgets] = useState<Orcamento[]>([]);
  const [budgetItems, setBudgetItems] = useState<ItemOrcamento[]>([]);
  const [receipts, setReceipts] = useState<Recibo[]>([]);
  const [config, setConfig] = useState<ConfiguracaoEmpresa>(AgeEletricaDB.getConfig());

  // UI Active Section: 'dashboard' | 'clients' | 'budget' | 'receipt'
  const [activeView, setActiveView] = useState<'dashboard' | 'clients' | 'budget' | 'receipt'>('dashboard');

  // Success/Error notification alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Logo settings modal state
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');
  const [tempLogoBase64, setTempLogoBase64] = useState('');

  // Print view modals for pdf download
  const [selectedBudgetForPrint, setSelectedBudgetForPrint] = useState<Orcamento | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<Recibo | null>(null);

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
      .map((it: any) => `
        <tr class="text-zinc-800 font-sans border-b border-zinc-150">
          <td class="p-2.5 font-medium">${it.descricaoItem}</td>
          <td class="p-2.5 text-center font-mono">${it.quantidade}</td>
          <td class="p-2.5 text-right font-mono">R$ ${(it.valorUnitario || it.precoUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          <td class="p-2.5 text-right font-mono font-bold text-black">R$ ${(it.valorTotal || it.subtotalItem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
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

  // Open Receipt PDF/Print view in a clean standalone window/tab (iOS / PWA / Android fallback supported)
  const handleOpenInNewTabReceipt = (r: Recibo) => {
    const clientObj = clients.find(cl => cl.id === r.clienteId);
    const clientDetailsHtml = clientObj ? `
      <div>
        <h3 class="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">CLIENTE BENEFICIÁRIO</h3>
        <div class="space-y-1 text-zinc-700 font-sans">
          <p class="font-extrabold text-black text-[13px]">${clientObj.nomeCompleto}</p>
          <p>WhatsApp: ${clientObj.whatsapp}</p>
          <p>Endereço: ${clientObj.enderecoCompleto || 'Natal, RN'} - ${clientObj.bairro}, ${clientObj.cidade}</p>
        </div>
      </div>
    ` : `
      <div>
        <h3 class="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">CLIENTE BENEFICIÁRIO</h3>
        <p class="text-red-500 font-mono">Cliente não localizado no banco.</p>
      </div>
    `;

    const logoHtml = (config.logoPdf || config.logo) ? `
      <img src="${config.logoPdf || config.logo}" alt="Logo" class="max-h-16 max-w-[120px] object-contain shrink-0 rounded-md" />
    ` : `
      <div class="p-1 px-1.5 bg-zinc-950 text-amber-500 font-extrabold text-lg rounded shrink-0">⚡ AGE ELÉTRICA</div>
    `;

    const docHtml = `
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recibo ${r.numeroRecibo} - AGE Elétrica</title>
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
        <div class="max-w-3xl mx-auto w-full bg-zinc-900 text-white p-4 rounded-xl mb-6 flex justify-between items-center no-print shadow-md">
          <span class="text-xs font-bold font-mono tracking-wider">Visualização Segura - Recibo AGE Elétrica</span>
          <div class="flex gap-2">
            <button onclick="window.print()" class="bg-green-500 hover:bg-green-600 text-black font-extrabold px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              Gerar PDF / Imprimir Recibo
            </button>
            <button onclick="window.close()" class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs cursor-pointer">
              Fechar
            </button>
          </div>
        </div>

        <div class="max-w-3xl mx-auto w-full bg-white text-black p-8 md:p-12 shadow-xl rounded-sm border border-gray-300 print-card">
          <div class="flex justify-between items-center border-b border-gray-300 pb-4 mb-6">
            <div class="flex items-center gap-3">
              ${logoHtml}
              <div>
                <h1 class="text-md font-extrabold text-zinc-900 uppercase">${config.nomeEmpresa || 'AGE ELÉTRICA'}</h1>
                <p class="text-[9px] text-gray-500">CNPJ: ${config.cnpj || '35.452.127/0001-90'}</p>
                <p class="text-[9px] text-gray-500">Tecnologia e Segurança pelo NBR 5410</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-zinc-400 block tracking-widest font-mono">VIA DO CLIENTE</span>
              <span class="text-lg font-semibold text-gray-900 font-mono">${r.numeroRecibo}</span>
              <span class="text-xs font-mono block">Valor: <strong class="text-green-600">R$ ${r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
            </div>
          </div>

          <div class="border-l-4 border-amber-500 pl-4 py-1 mb-6 text-xs text-zinc-650 italic shrink-0">
            "Sua segurança em instalações elétricas com procedência técnica regulamentada."
          </div>

          <div class="text-xs leading-relaxed space-y-4 mb-8 text-zinc-700">
            <p>Recebemos de <strong>${clientObj ? clientObj.nomeCompleto : 'Cliente não localizado'}</strong> a importância líquida de <strong class="text-slate-950 font-mono">R$ ${r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, referente ao serviço especializado de:</p>
            <p class="font-semibold text-zinc-900 ml-4 border-l-2 pl-3 py-1 bg-zinc-50 border-amber-550">${r.referenteServico}</p>
            <p>${r.observacoes || 'Declaramos que recebemos o valor informado referente aos serviços técnicos de instalações elétricas e manutenção.'}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] bg-zinc-50 p-4 border border-zinc-150 rounded-lg mb-8">
            <div>
              <p class="font-mono text-slate-950">Data do Crédito: ${r.dataEmissao.split('-').reverse().join('/')}</p>
              <p class="font-mono">Operado via: ${r.formaPagamento}</p>
              <p class="font-mono">Faturamento Responsável: ${r.responsavelRecebimento}</p>
              <p class="font-mono text-green-600 font-bold uppercase">Situação Comercial: ${r.status}</p>
            </div>
            ${clientObj ? `
            <div>
              <p class="font-bold underline">Garantias do Serviço:</p>
              <p>• Cobertura de <strong>90 dias</strong> contra falhas mecânicas ou fadiga física dos condutores instalados.</p>
              <p>• Suplementação sob laudo em conformidade com as diretivas vigentes da Coelba / Neoenergia.</p>
            </div>
            ` : ''}
          </div>

          <div class="flex flex-col items-center justify-center pt-8 border-t border-gray-250 mt-12 text-center text-xs">
            <span class="font-bold text-slate-950 block">${r.responsavelRecebimento}</span>
            <span class="text-[9px] text-zinc-400 font-mono uppercase tracking-widest">Responsável pela AGE Elétrica</span>
          </div>

          <div class="text-[8px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t">
            ${config.rodapePdf || 'Recibo emitido pelo sistema administrativo AGE Elétrica.'}
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
      link.download = `Recibo_${r.numeroRecibo}.html`;
      link.click();
    }
  };

  // Quick Client Registration Form
  const [clientForm, setClientForm] = useState({
    nomeCompleto: '',
    whatsapp: '',
    endereco: '',
    bairro: '',
    cidade: 'Natal',
    tipoCliente: 'Residencial' as 'Residencial' | 'Comercial' | 'Industrial' | 'Condomínio'
  });

  // Quick Budget Form State
  const [budgetForm, setBudgetForm] = useState({
    clienteId: '',
    descricaoGeral: '',
    formaPagamento: 'PIX (À Vista)',
    validadeOrcamento: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
    prazoExecucao: '1 Dia Útil',
    desconto: 0,
    items: [{ descricao: '', quantidade: 1, precoUnitario: 0 }]
  });

  // Quick Receipt Form State
  const [receiptForm, setReceiptForm] = useState({
    clienteId: '',
    referenteServico: '',
    valorRecebido: '',
    formaPagamento: 'PIX',
    observacoes: 'Garantia legal de 90 dias conforme CDC nas instalações elétricas.'
  });

  // Check login session
  useEffect(() => {
    const saved = sessionStorage.getItem('age_el_tech_user') || localStorage.getItem('age_el_tech_user');
    if (saved) {
      const parsed = JSON.parse(saved) as Usuario;
      setCurrentUser(parsed);
      setIsAuthenticated(true);
    }

    refreshStates();

    const unsubscribe = AgeEletricaDB.subscribe(() => {
      refreshStates();
    });
    return () => unsubscribe();
  }, []);

  const refreshStates = () => {
    setClients(AgeEletricaDB.getClients());
    setBudgets(AgeEletricaDB.getBudgets());
    setBudgetItems(AgeEletricaDB.getBudgetItems());
    setReceipts(AgeEletricaDB.getReceipts());
    setConfig(AgeEletricaDB.getConfig());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email || !password) {
      setLoginError('Por favor, preencha todos os campos.');
      return;
    }

    const matchedUser = AgeEletricaDB.getUsers().find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.senhaHash === password
    );

    if (matchedUser) {
      if (matchedUser.status !== 'Ativo') {
        setLoginError('Seu usuário está suspenso.');
        return;
      }
      sessionStorage.setItem('age_el_tech_user', JSON.stringify(matchedUser));
      localStorage.setItem('age_el_tech_user', JSON.stringify(matchedUser));
      setCurrentUser(matchedUser);
      setIsAuthenticated(true);
      showNotification('Acesso autenticado com sucesso!', 'success');
    } else {
      setLoginError('E-mail ou Senha inválidos para o Técnico.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('age_el_tech_user');
    localStorage.removeItem('age_el_tech_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    showNotification('Sessão encerrada.', 'success');
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 3500);
    }
  };

  // Quick Client Save
  const saveQuickClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.nomeCompleto || !clientForm.whatsapp) {
      showNotification('Nome Completo e WhatsApp são campos indispensáveis!', 'error');
      return;
    }

    const saved = AgeEletricaDB.addClient({
      nomeCompleto: clientForm.nomeCompleto,
      cpfCnpj: '',
      telefone: clientForm.whatsapp,
      whatsapp: clientForm.whatsapp,
      email: '',
      enderecoCompleto: clientForm.endereco || 'Natal, RN',
      numero: '',
      complemento: '',
      bairro: clientForm.bairro || 'Geral',
      cidade: clientForm.cidade || 'Natal',
      estado: 'RN',
      cep: '',
      tipoCliente: clientForm.tipoCliente,
      observacoes: 'Cadastrado via App Técnico simplificado'
    });

    showNotification(`Cliente "${saved.nomeCompleto}" registrado com sucesso!`, 'success');
    // Set selected client id in budget and receipt form
    setBudgetForm(prev => ({ ...prev, clienteId: saved.id }));
    setReceiptForm(prev => ({ ...prev, clienteId: saved.id }));

    // Reset client form
    setClientForm({
      nomeCompleto: '',
      whatsapp: '',
      endereco: '',
      bairro: '',
      cidade: 'Natal',
      tipoCliente: 'Residencial'
    });
    // Go to dashboard
    setActiveView('dashboard');
  };

  // Budget Items manipulators
  const addBudgetItemRow = () => {
    setBudgetForm(prev => ({
      ...prev,
      items: [...prev.items, { descricao: '', quantidade: 1, precoUnitario: 0 }]
    }));
  };

  const removeBudgetItemRow = (index: number) => {
    if (budgetForm.items.length <= 1) return;
    setBudgetForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateBudgetItem = (index: number, field: string, value: any) => {
    const updated = budgetForm.items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setBudgetForm(prev => ({ ...prev, items: updated }));
  };

  // Quick Budget Save
  const saveQuickBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.clienteId) {
      showNotification('Por favor, selecione um cliente!', 'error');
      return;
    }
    if (!budgetForm.descricaoGeral) {
      showNotification('Insira a descrição geral do escopo técnico!', 'error');
      return;
    }

    // Validate items
    const invalidItems = budgetForm.items.some(it => !it.descricao || it.precoUnitario <= 0);
    if (invalidItems) {
      showNotification('Preencha a descrição de todos os itens e coloque um preço base positivo!', 'error');
      return;
    }

    // Calculations
    const itemsTotal = budgetForm.items.reduce((sum, it) => sum + (it.quantidade * it.precoUnitario), 0);
    const calculatedTotal = Math.max(0, itemsTotal - Number(budgetForm.desconto));

    // Save Budget
    const nextNum = AgeEletricaDB.generateNextOrcamentoNumber();
    const newBudget: Orcamento = {
      id: `orc-${Date.now()}`,
      numeroOrcamento: nextNum,
      clienteId: budgetForm.clienteId,
      dataOrcamento: new Date().toISOString().split('T')[0],
      validadeOrcamento: budgetForm.validadeOrcamento,
      valorTotal: calculatedTotal,
      subtotal: itemsTotal,
      desconto: Number(budgetForm.desconto),
      formaPagamento: budgetForm.formaPagamento,
      prazoExecucao: budgetForm.prazoExecucao,
      descricaoGeral: budgetForm.descricaoGeral,
      responsavelOrcamento: currentUser?.nome || 'Akson Pereira (Técnico)',
      localServico: clients.find(c => c.id === budgetForm.clienteId)?.enderecoCompleto || 'Natal/Metropolitana',
      status: 'Aprovado',
      observacoes: '',
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    // Budget items
    const nextBudgetItems: ItemOrcamento[] = budgetForm.items.map((it, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      orcamentoId: newBudget.id,
      servicoId: 'srv-manual',
      descricaoItem: it.descricao,
      quantidade: it.quantidade,
      unidade: 'serviço',
      valorUnitario: Number(it.precoUnitario),
      valorTotal: it.quantidade * Number(it.precoUnitario),
      observacaoItem: ''
    }));

    const updatedBudgets = [newBudget, ...budgets];
    const updatedBudgetItems = [...nextBudgetItems, ...budgetItems];

    AgeEletricaDB.saveBudgets(updatedBudgets);
    AgeEletricaDB.saveBudgetItems(updatedBudgetItems);

    showNotification(`Orçamento ${nextNum} gerado com sucesso!`, 'success');

    // Trigger PDF Print preview modal immediately
    setSelectedBudgetForPrint(newBudget);

    // Reset Form
    setBudgetForm({
      clienteId: '',
      descricaoGeral: '',
      formaPagamento: 'PIX (À Vista)',
      validadeOrcamento: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
      prazoExecucao: '1 Dia Útil',
      desconto: 0,
      items: [{ descricao: '', quantidade: 1, precoUnitario: 0 }]
    });

    setActiveView('dashboard');
  };

  // Quick Receipt Save
  const saveQuickReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptForm.clienteId) {
      showNotification('Selecione um cliente para vincular o recibo!', 'error');
      return;
    }
    if (!receiptForm.referenteServico) {
      showNotification('Preencha o escopo referente do recebimento!', 'error');
      return;
    }
    const parsedVal = parseFloat(receiptForm.valorRecebido);
    if (isNaN(parsedVal) || parsedVal <= 0) {
      showNotification('Insira um valor pago válido!', 'error');
      return;
    }

    const nextNum = AgeEletricaDB.generateNextReciboNumber();
    const newReceipt: Recibo = {
      id: `rcb-${Date.now()}`,
      numeroRecibo: nextNum,
      clienteId: receiptForm.clienteId,
      orcamentoId: '',
      dataEmissao: new Date().toISOString().split('T')[0],
      valorRecebido: parsedVal,
      formaPagamento: receiptForm.formaPagamento,
      referenteServico: receiptForm.referenteServico,
      responsavelRecebimento: currentUser?.nome || 'Akson Pereira (Técnico)',
      status: 'Pago',
      observacoes: receiptForm.observacoes,
      assinaturaResponsavel: config.assinaturaDigital || 'Akson Pereira',
      dataCriacao: new Date().toISOString()
    };

    const updatedReceipts = [newReceipt, ...receipts];
    AgeEletricaDB.saveReceipts(updatedReceipts);

    showNotification(`Recibo ${nextNum} registrado com sucesso!`, 'success');

    // Open PDF print overlay
    setSelectedReceiptForPrint(newReceipt);

    // Reset Form
    setReceiptForm({
      clienteId: '',
      referenteServico: '',
      valorRecebido: '',
      formaPagamento: 'PIX',
      observacoes: 'Garantia legal de 90 dias conforme CDC nas instalações elétricas.'
    });

    setActiveView('dashboard');
  };

  // WhatsApp Trigger Helpers
  const triggerWhatsAppBudget = (b: Orcamento) => {
    const clientObj = clients.find(c => c.id === b.clienteId);
    if (!clientObj) return;

    const baseMessage = `Olá, ${clientObj.nomeCompleto}! Segue o orçamento técnico proposto pela AGE Elétrica.\n\n📄 *Orçamento nº:* ${b.numeroOrcamento}\n⚡ *Escopo:* ${b.descricaoGeral}\n💵 *Valor Total:* R$ ${b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n🗓️ *Validade:* ${b.validadeOrcamento.split('-').reverse().join('/')}\n\nQualquer dúvida comercial ou dúvidas técnicas das normas, estou à disposição para agendar as correções físicas!`;
    const cleanPhone = clientObj.whatsapp.replace(/\D/g, '');
    const link = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(baseMessage)}`;
    window.open(link, '_blank');
  };

  const triggerWhatsAppReceipt = (r: Recibo) => {
    const clientObj = clients.find(c => c.id === r.clienteId);
    if (!clientObj) return;

    const baseMessage = `Olá, ${clientObj.nomeCompleto}! Segue o comprovante de pagamento e recibo de serviços elétricos da AGE Elétrica.\n\n🧾 *Recibo de Garantia nº:* ${r.numeroRecibo}\n💰 *Valor:* R$ ${r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n💳 *Forma:* ${r.formaPagamento}\n🛠️ *Referente:* ${r.referenteServico}\n\nAgradecemos a preferência! Já consta em nossa base física garantida por 90 dias.`;
    const cleanPhone = clientObj.whatsapp.replace(/\D/g, '');
    const link = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(baseMessage)}`;
    window.open(link, '_blank');
  };

  // Logo handle changes
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setTempLogoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const saveLogoConfig = () => {
    const logoToSave = tempLogoBase64 || tempLogoUrl;
    if (!logoToSave) {
      showNotification('Forneça uma URL de imagem válida ou faça upload do arquivo!', 'error');
      return;
    }

    const updatedConfig = {
      ...config,
      logo: logoToSave
    };

    AgeEletricaDB.saveConfig(updatedConfig);
    setConfig(updatedConfig);
    setShowLogoModal(false);
    setTempLogoUrl('');
    setTempLogoBase64('');
    showNotification('Logotipo atualizado e sincronizado para todos os documentos!', 'success');
  };

  // Delete records from database
  const deleteBudget = (id: string) => {
    if (confirm('Deseja excluir este orçamento definitivamente?')) {
      const updated = budgets.filter(b => b.id !== id);
      const updatedItems = budgetItems.filter(item => item.orcamentoId !== id);
      AgeEletricaDB.saveBudgets(updated);
      AgeEletricaDB.saveBudgetItems(updatedItems);
      showNotification('Orçamento deletado com sucesso.', 'success');
    }
  };

  const deleteReceipt = (id: string) => {
    if (confirm('Deseja excluir este recibo definitivamente?')) {
      const updated = receipts.filter(r => r.id !== id);
      AgeEletricaDB.saveReceipts(updated);
      showNotification('Recibo deletado com sucesso.', 'success');
    }
  };

  // ----------------------------------------------------
  // RENDER: LOGIN ROUTE CONTAINER
  // ----------------------------------------------------
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#070707] flex flex-col justify-center items-center p-4 selection:bg-[#f2b705] selection:text-black font-sans relative">
        <div className="absolute top-4 left-4 no-print">
          <button
            onClick={onBackToSite}
            className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-xs font-mono py-1 px-3 bg-white/[0.02] border border-white/[0.05] rounded-full cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR AO SITE
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-neutral-950 border border-zinc-900 rounded-2xl p-6 sm:p-8 relative overflow-hidden"
        >
          {/* Top layout */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-500 via-[#f2b705] to-amber-700 pointer-events-none" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#f2b705]/10 border border-[#f2b705]/20 text-[#f2b705] mb-3">
              <Smartphone className="w-8 h-8 animate-pulse text-[#f2b705]" />
            </div>
            <h2 className="text-white font-extrabold text-lg uppercase tracking-wider font-display">
              APP AGE ELÉTRICA
            </h2>
            <p className="text-zinc-500 text-[9.5px] uppercase font-mono tracking-widest mt-1.5">
              Área Exclusiva do Técnico • Rápido & Minimalista
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-xl mb-4 text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block mb-1">
                E-mail de Operador *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2.5 rounded-lg text-white text-xs font-mono outline-none focus:border-[#f2b705]/50 transition-colors"
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase block mb-1">
                Senha de Segurança *
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2.5 rounded-lg text-white text-xs font-mono outline-none focus:border-[#f2b705]/50 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#f2b705] text-black hover:bg-[#f2b705]/90 rounded-xl font-mono text-[11px] uppercase tracking-widest font-black transition-all cursor-pointer select-none active:scale-95 shadow-[0_0_12px_rgba(242,183,5,0.15)] mt-6 text-center"
            >
              ENTRAR NO APP
            </button>
          </form>

          <p className="text-[9px] text-zinc-500 text-center mt-6 font-mono font-medium block">
            Dica: use ageeletricasuporte@gmail.com e senha "1234"
          </p>
        </motion.div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER: SECURE AUTHENTICATED TECHNICAL APP
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-[#070707] text-white font-sans selection:bg-[#f2b705] selection:text-black">
      
      {/* Dynamic Tiny notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-green-950 border border-green-700/50 text-green-300 p-3 rounded-xl shadow-lg text-xs flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-green-400 font-bold ml-2">×</button>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 inset-x-4 max-w-sm mx-auto z-50 bg-red-950 border border-red-700/50 text-red-300 p-3 rounded-xl shadow-lg text-xs flex justify-between items-center"
          >
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 font-bold ml-2">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar header, extremely discrete and clean */}
      <header className="border-b border-zinc-900 bg-neutral-950 px-4 py-3 sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          
          {/* Logo and Quick Logo Edit */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                setTempLogoUrl(config.logo || '');
                setShowLogoModal(true);
              }}
              className="relative group focus:outline-none shrink-0"
              title="Clique para alterar seu logotipo"
            >
              {config.logo ? (
                <img 
                  src={config.logo} 
                  alt="AGE Elétrica Logo" 
                  className="h-8 w-auto object-contain bg-zinc-900/40 hover:bg-zinc-800 rounded p-1 transition-all border border-zinc-800 hover:border-[#f2b705]/40" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 bg-zinc-900 hover:bg-zinc-800 rounded flex items-center justify-center text-zinc-400 border border-zinc-800 hover:border-[#f2b705]/40 transition-all">
                  <Upload className="w-4 h-4 text-[#f2b705]" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 bg-[#f2b705] text-black font-sans text-[7px] w-3 h-3 rounded-full flex items-center justify-center font-bold font-mono border border-black opacity-0 group-hover:opacity-100 transition-opacity">
                +
              </span>
            </button>

            <div>
              <span className="text-[12px] font-black uppercase tracking-wider block font-display leading-[1.1]">
                APP AGE ELÉTRICA
              </span>
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">
                TÉCNICO: <span className="text-[#f2b705]">{currentUser.nome.split(' ')[0]}</span>
              </span>
            </div>
          </div>

          {/* Nav & Exit Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSite}
              className="text-[10px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800/60 px-3 py-1.5 rounded-full transition-all cursor-pointer font-bold uppercase tracking-wider"
            >
              SITE OFICIAL
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500/10 hover:bg-red-500/15 text-red-400 hover:text-red-300 border border-red-500/20 p-2 rounded-full transition-all cursor-pointer"
              title="Desconectar do App"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Navigation tabs or main view switcher */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-900 pb-3 mb-6">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-bold rounded-full transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-white text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            Painel Central
          </button>
          <button
            onClick={() => setActiveView('clients')}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-bold rounded-full transition-all cursor-pointer ${
              activeView === 'clients'
                ? 'bg-[#f2b705] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            + Cadastrar Cliente
          </button>
          <button
            onClick={() => setActiveView('budget')}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-bold rounded-full transition-all cursor-pointer ${
              activeView === 'budget'
                ? 'bg-[#f2b705] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            + Criar Orçamento
          </button>
          <button
            onClick={() => setActiveView('receipt')}
            className={`px-4 py-2 text-xs font-mono tracking-wider uppercase font-bold rounded-full transition-all cursor-pointer ${
              activeView === 'receipt'
                ? 'bg-[#f2b705] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            + Criar Recibo
          </button>
        </div>

        {/* ----------------------------------------------------
            VIEW 1: PAINEL CENTRAL (DASHBOARD)
            ---------------------------------------------------- */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Short Introduction greeting */}
            <div className="bg-gradient-to-r from-zinc-950 via-neutral-900 to-zinc-950 border border-zinc-900 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-[#f2b705] via-amber-500 to-transparent pointer-events-none" />
              <div>
                <h1 className="text-base sm:text-lg font-extrabold text-white">Olá, Técnico!</h1>
                <p className="text-zinc-400 text-xs mt-1 leading-relaxed max-w-xl">
                  Este é o seu aplicativo diário para emitir documentações rapidamente no canteiro de obras. 
                  Cadastre clientes, gere faturamentos, emita PDFs e envie imediatamente pelo WhatsApp.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setActiveView('clients')}
                  className="bg-zinc-900 hover:bg-zinc-850 px-3.5 py-2 rounded-xl text-xs font-mono tracking-tight font-bold border border-zinc-800 text-zinc-350 cursor-pointer transition-all"
                >
                  Novo Cliente
                </button>
                <button
                  onClick={() => setActiveView('budget')}
                  className="bg-[#f2b705]/15 hover:bg-[#f2b705]/20 border border-[#f2b705]/30 text-[#f2b705] px-3.5 py-2 rounded-xl text-xs font-mono tracking-tight font-extrabold cursor-pointer transition-all"
                >
                  Criar Orçamento
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-950/60 border border-zinc-900/80 rounded-xl p-4 text-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Clientes Ativos</span>
                <span className="text-lg font-black text-white mt-1 block">{clients.length}</span>
              </div>
              <div className="bg-neutral-950/60 border border-zinc-900/80 rounded-xl p-4 text-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Orçamentos</span>
                <span className="text-lg font-black text-amber-500 mt-1 block">{budgets.length}</span>
              </div>
              <div className="bg-neutral-950/60 border border-zinc-900/80 rounded-xl p-4 text-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block font-bold text-green-400">Recibos Emitidos</span>
                <span className="text-lg font-black text-green-400 mt-1 block">{receipts.length}</span>
              </div>
              <div className="bg-neutral-950/60 border border-zinc-900/80 rounded-xl p-4 text-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">Faturamento Técnico</span>
                <span className="text-lg font-black text-white mt-1 block">
                  R$ {receipts.reduce((sum, r) => sum + r.valorRecebido, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* History split columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Budgets List column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <h3 className="text-xs uppercase font-mono tracking-widest text-[#f2b705] font-black">
                      Últimos Orçamentos
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveView('budget')}
                    className="text-[9px] font-mono text-zinc-400 hover:text-[#f2b705]"
                  >
                    + Novo
                  </button>
                </div>

                {budgets.length === 0 ? (
                  <div className="bg-zinc-950/40 rounded-xl border border-zinc-900 p-8 text-center text-zinc-500 text-xs">
                    Nenhum orçamento emitido por este aplicativo.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {budgets.slice(0, 10).map((b) => {
                      const client = clients.find(c => c.id === b.clienteId);
                      return (
                        <div
                          key={b.id}
                          className="bg-neutral-950 border border-zinc-900 rounded-xl p-3 flex justify-between items-center hover:border-zinc-800 transition-all font-sans"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-amber-500">
                              {b.numeroOrcamento}
                            </span>
                            <h4 className="text-white text-xs font-bold leading-relaxed block mt-1">
                              {client ? client.nomeCompleto : 'Cliente Não Localizado'}
                            </h4>
                            <p className="text-zinc-500 text-[10px] truncate max-w-[180px] sm:max-w-xs">
                              {b.descricaoGeral}
                            </p>
                            <span className="text-green-400 text-xs font-mono font-bold block">
                              R$ {b.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            <button
                              onClick={() => triggerWhatsAppBudget(b)}
                              className="p-1 px-2.5 text-[9px] font-mono font-black uppercase bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/20 hover:bg-[#f2b705] hover:text-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Enviar por WhatsApp"
                            >
                              <Send className="w-2.5 h-2.5" /> Enviar
                            </button>
                            <button
                              onClick={() => setSelectedBudgetForPrint(b)}
                              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Baixar PDF / Imprimir"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBudget(b.id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Receipts List column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-green-500" />
                    <h3 className="text-xs uppercase font-mono tracking-widest text-[#f2b705] font-black">
                      Últimos Recibos / Garantias
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveView('receipt')}
                    className="text-[9px] font-mono text-zinc-400 hover:text-[#f2b705]"
                  >
                    + Novo
                  </button>
                </div>

                {receipts.length === 0 ? (
                  <div className="bg-zinc-950/40 rounded-xl border border-zinc-900 p-8 text-center text-zinc-500 text-xs">
                    Nenhum recibo emitido por este aplicativo.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {receipts.slice(0, 10).map((r) => {
                      const client = clients.find(c => c.id === r.clienteId);
                      return (
                        <div
                          key={r.id}
                          className="bg-neutral-950 border border-zinc-900 rounded-xl p-3 flex justify-between items-center hover:border-zinc-800 transition-all font-sans"
                        >
                          <div className="space-y-1">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-green-400">
                              {r.numeroRecibo}
                            </span>
                            <h4 className="text-white text-xs font-bold leading-relaxed block mt-1">
                              {client ? client.nomeCompleto : 'Cliente Não Localizado'}
                            </h4>
                            <p className="text-zinc-500 text-[10px] truncate max-w-[180px] sm:max-w-xs">
                              {r.referenteServico}
                            </p>
                            <span className="text-green-400 text-xs font-mono font-bold block">
                              R$ {r.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 ml-4">
                            <button
                              onClick={() => triggerWhatsAppReceipt(r)}
                              className="p-1 px-2.5 text-[9px] font-mono font-black uppercase bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/20 hover:bg-[#f2b705] hover:text-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                              title="Enviar por WhatsApp"
                            >
                              <Send className="w-2.5 h-2.5" /> Enviar
                            </button>
                            <button
                              onClick={() => setSelectedReceiptForPrint(r)}
                              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Baixar PDF / Imprimir"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteReceipt(r.id)}
                              className="p-1.5 bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 2: NOVO CADASTRO DE CLIENTE
            ---------------------------------------------------- */}
        {activeView === 'clients' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-neutral-950 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-5">
                <UserPlus className="w-5 h-5 text-[#f2b705]" />
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider font-display">
                  Cadastro Rápido de Cliente
                </h3>
              </div>

              <form onSubmit={saveQuickClient} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                    Nome Completo do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientForm.nomeCompleto}
                    onChange={e => setClientForm({ ...clientForm, nomeCompleto: e.target.value })}
                    placeholder="Ex: João da Silva Santos"
                    className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      WhatsApp / Celular (Com DDD) *
                    </label>
                    <input
                      type="text"
                      required
                      value={clientForm.whatsapp}
                      onChange={e => setClientForm({ ...clientForm, whatsapp: e.target.value })}
                      placeholder="Ex: 84998887766"
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Tipo do Imóvel / Cliente
                    </label>
                    <select
                      value={clientForm.tipoCliente}
                      onChange={e => setClientForm({ ...clientForm, tipoCliente: e.target.value as any })}
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    >
                      <option value="Residencial">Residencial</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Condomínio">Condomínio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                    Endereço de Instalação (Rua, Número, Complemento)
                  </label>
                  <input
                    type="text"
                    value={clientForm.endereco}
                    onChange={e => setClientForm({ ...clientForm, endereco: e.target.value })}
                    placeholder="Ex: Avenida Deodoro da Fonseca, 452, Apto 101"
                    className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={clientForm.bairro}
                      onChange={e => setClientForm({ ...clientForm, bairro: e.target.value })}
                      placeholder="Ex: Petrópolis"
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={clientForm.cidade}
                      onChange={e => setClientForm({ ...clientForm, cidade: e.target.value })}
                      placeholder="Ex: Natal"
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className="w-1/2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#f2b705] hover:bg-[#f2b705]/95 text-black rounded-xl text-xs font-mono font-black tracking-wider transition-all cursor-pointer"
                  >
                    CONFIRMAR CADASTRO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 3: NOVO ORÇAMENTO RÁPIDO
            ---------------------------------------------------- */}
        {activeView === 'budget' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-neutral-950 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-5">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider font-display">
                  Emitir Novo Orçamento Técnico
                </h3>
              </div>

              <form onSubmit={saveQuickBudget} className="space-y-5">
                
                {/* Select client */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block">
                      Selecione o Cliente Cadastrado *
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveView('clients')}
                      className="text-[9.5px] font-mono text-[#f2b705] hover:underline"
                    >
                      + Cadastrar Novo Cliente Primeiro
                    </button>
                  </div>
                  
                  {clients.length === 0 ? (
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-red-500/20 text-red-400 text-xs">
                      Não há nenhum cliente registrado! Cadastre um primeiro no menu superior.
                    </div>
                  ) : (
                    <select
                      required
                      value={budgetForm.clienteId}
                      onChange={e => setBudgetForm({ ...budgetForm, clienteId: e.target.value })}
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2.5 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    >
                      <option value="">-- Selecione o Cliente na Lista --</option>
                      {clients.map(cl => (
                        <option key={cl.id} value={cl.id}>
                          {cl.nomeCompleto} ({cl.tipoCliente}) - {cl.whatsapp}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Scope Description */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                    Descrição Geral do Escopo / Problema Técnico *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={budgetForm.descricaoGeral}
                    onChange={e => setBudgetForm({ ...budgetForm, descricaoGeral: e.target.value })}
                    placeholder="Descreva o serviço a ser feito em conformidade com as normas NBR 5410. Ex: Instalação de carregador de carro elétrico com cabeamento blindado e dispositivo DPS de proteção."
                    className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors leading-relaxed"
                  />
                </div>

                {/* Scope details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Forma de Pagamento
                    </label>
                    <input
                      type="text"
                      value={budgetForm.formaPagamento}
                      onChange={e => setBudgetForm({ ...budgetForm, formaPagamento: e.target.value })}
                      placeholder="PIX (À Vista)"
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Prazo Estimado de Execução
                    </label>
                    <input
                      type="text"
                      value={budgetForm.prazoExecucao}
                      onChange={e => setBudgetForm({ ...budgetForm, prazoExecucao: e.target.value })}
                      placeholder="Ex: 1 Dia Útil"
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Data Validade do Orçamento
                    </label>
                    <input
                      type="date"
                      value={budgetForm.validadeOrcamento}
                      onChange={e => setBudgetForm({ ...budgetForm, validadeOrcamento: e.target.value })}
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Items grid container */}
                <div className="space-y-3 bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 sm:p-4">
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-2 mb-2">
                    <span className="text-[10.5px] uppercase font-mono text-amber-500 font-bold block">
                      Itens / Mão de Obra e Materiais
                    </span>
                    <button
                      type="button"
                      onClick={addBudgetItemRow}
                      className="text-[10px] font-mono text-[#f2b705] hover:text-[#f2b705]/95 flex items-center gap-1 bg-[#f2b705]/15 px-2.5 py-1 rounded border border-[#f2b705]/20 hover:bg-[#f2b705]/20 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Adicionar Item
                    </button>
                  </div>

                  {budgetForm.items.map((it, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-end bg-neutral-950 p-2.5 rounded-lg border border-zinc-900 relative">
                      
                      {/* Description */}
                      <div className="w-full sm:flex-1">
                        <label className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-0.5">
                          Descrição Técnica do Item {idx + 1} *
                        </label>
                        <input
                          type="text"
                          required
                          value={it.descricao}
                          onChange={e => updateBudgetItem(idx, 'descricao', e.target.value)}
                          placeholder="Mão de obra instalação do DPS, fiação geral..."
                          className="w-full bg-neutral-900 border border-zinc-850 px-2.5 py-1.5 rounded text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="w-full sm:w-16">
                        <label className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-0.5">
                          Qtd
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={it.quantidade}
                          onChange={e => updateBudgetItem(idx, 'quantidade', Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-neutral-900 border border-zinc-850 px-2 py-1.5 rounded text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors text-center font-mono"
                        />
                      </div>

                      {/* Price */}
                      <div className="w-full sm:w-28">
                        <label className="text-[9px] uppercase font-mono tracking-wider text-zinc-500 block mb-0.5">
                          Preço Unit. (R$) *
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={it.precoUnitario}
                          onChange={e => updateBudgetItem(idx, 'precoUnitario', parseFloat(e.target.value) || 0)}
                          className="w-full bg-neutral-900 border border-zinc-850 px-2 py-1.5 rounded text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors text-right font-mono"
                        />
                      </div>

                      {/* Delete icon */}
                      {budgetForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBudgetItemRow(idx)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 p-2.5 rounded border border-red-500/15 cursor-pointer ml-1 inline-flex shrink-0 mb-0.5"
                          title="Remover Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Discount option */}
                  <div className="flex justify-end gap-3 items-center border-t border-zinc-850 pt-3">
                    <span className="text-[10px] uppercase font-mono text-zinc-400">Desconto Especial (R$):</span>
                    <input
                      type="number"
                      min="0"
                      value={budgetForm.desconto}
                      onChange={e => setBudgetForm({ ...budgetForm, desconto: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="bg-neutral-950 border border-zinc-850 px-3 py-1.5 rounded text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors text-right font-mono w-28"
                    />
                  </div>

                  {/* Summary math */}
                  <div className="flex flex-col items-end pt-2 text-right">
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Subtotal: R$ {budgetForm.items.reduce((sum, it) => sum + (it.quantidade * (Number(it.precoUnitario) || 0)), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    {budgetForm.desconto > 0 && (
                      <div className="text-[10px] text-red-500 font-mono">
                        Desconto: R$ -{budgetForm.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    <div className="text-xs font-mono font-bold text-green-400 mt-1">
                      Total Líquido: R$ {Math.max(0, budgetForm.items.reduce((sum, it) => sum + (it.quantidade * (Number(it.precoUnitario) || 0)), 0) - Number(budgetForm.desconto)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className="w-1/2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#f2b705] hover:bg-[#f2b705]/95 text-black rounded-xl text-xs font-mono font-black tracking-wider transition-all cursor-pointer"
                  >
                    SALVAR E GERAR ORÇAMENTO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            VIEW 4: NOVO RECIBO / FATURAMENTO RÁPIDO
            ---------------------------------------------------- */}
        {activeView === 'receipt' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-neutral-950 border border-zinc-900 rounded-2xl p-6">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-5">
                <Receipt className="w-5 h-5 text-green-500" />
                <h3 className="text-white font-extrabold text-sm uppercase tracking-wider font-display">
                  Emitir Novo Recibo Oficial
                </h3>
              </div>

              <form onSubmit={saveQuickReceipt} className="space-y-4">
                
                {/* Select client */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block">
                      Selecione o Cliente Cadastrado *
                    </label>
                  </div>
                  {clients.length === 0 ? (
                    <div className="bg-zinc-900/60 p-3 rounded-lg border border-red-500/20 text-red-400 text-xs text-center">
                      Nenhum cliente registrado ainda para receber!
                    </div>
                  ) : (
                    <select
                      required
                      value={receiptForm.clienteId}
                      onChange={e => setReceiptForm({ ...receiptForm, clienteId: e.target.value })}
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2.5 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    >
                      <option value="">-- Selecione o faturado --</option>
                      {clients.map(cl => (
                        <option key={cl.id} value={cl.id}>
                          {cl.nomeCompleto} ({cl.tipoCliente}) - {cl.whatsapp}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Subfields scope */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Valor Pago Recebido (R$) *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 font-mono text-xs">
                        R$
                      </div>
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        value={receiptForm.valorRecebido}
                        onChange={e => setReceiptForm({ ...receiptForm, valorRecebido: e.target.value })}
                        placeholder="Ex: 350.00"
                        className="w-full bg-neutral-900 border border-zinc-850 pl-9 pr-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                      Meio / Forma de Transação
                    </label>
                    <select
                      value={receiptForm.formaPagamento}
                      onChange={e => setReceiptForm({ ...receiptForm, formaPagamento: e.target.value })}
                      className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                    >
                      <option value="PIX">Pix Oficial</option>
                      <option value="Dinheiro">Dinheiro vivo</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência Bancária">Transferência TED/DOC</option>
                    </select>
                  </div>
                </div>

                {/* What service is this referring to */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                    Referente Completo do Serviço Prestado *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiptForm.referenteServico}
                    onChange={e => setReceiptForm({ ...receiptForm, referenteServico: e.target.value })}
                    placeholder="Ex: Correção de curtos-circuitos no disjuntor principal e fiação geral."
                    className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2.5 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                  />
                </div>

                {/* Comments / Legal guarantees */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block mb-1">
                    Observações de Garantia / Notas Legais
                  </label>
                  <textarea
                    rows={2}
                    value={receiptForm.observacoes}
                    onChange={e => setReceiptForm({ ...receiptForm, observacoes: e.target.value })}
                    placeholder="Observações complementares..."
                    className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className="w-1/2 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-mono tracking-wider transition-all cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-[#f2b705] hover:bg-[#f2b705]/95 text-black rounded-xl text-xs font-mono font-black tracking-wider transition-all cursor-pointer"
                  >
                    SALVAR E EMITIR RECIBO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* ----------------------------------------------------
          MODAL: COMPANY LOGO HANDLER
          ---------------------------------------------------- */}
      {showLogoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-neutral-950 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-[#f2b705]" />
            
            <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5 mb-4">
              <span className="text-white text-xs font-extrabold uppercase font-mono">
                Carregar Logotipo Oficial
              </span>
              <button 
                onClick={() => setShowLogoModal(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Option A: Upload base64 */}
              <div className="border-2 border-dashed border-zinc-800 hover:border-zinc-700/85 p-6 rounded-xl text-center bg-zinc-900/15">
                <input
                  type="file"
                  id="logoUploader"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label 
                  htmlFor="logoUploader"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 bg-zinc-900 text-zinc-500 group-hover:text-[#f2b705] border border-zinc-800 rounded-full flex items-center justify-center transition-all">
                    <Upload className="w-5 h-5 text-current" />
                  </div>
                  <span className="text-white text-xs font-bold block">Fazer Upload de arquivo local</span>
                  <span className="text-[10px] text-zinc-500 block">Selecione JPG, PNG ou SVG</span>
                </label>
              </div>

              {/* Option B: Input URL */}
              <div>
                <label className="text-[9px] uppercase font-mono text-zinc-400 block mb-1">
                  Ou digite a URL da Imagem da Logo:
                </label>
                <input
                  type="text"
                  value={tempLogoUrl}
                  onChange={e => {
                    setTempLogoUrl(e.target.value);
                    setTempLogoBase64(''); // Reset base64 upload to use raw URL
                  }}
                  placeholder="https://exemplo.com/sua_logo.png"
                  className="w-full bg-neutral-900 border border-zinc-850 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#f2b705]/50 transition-colors"
                />
              </div>

              {/* Preview */}
              {(tempLogoBase64 || tempLogoUrl) && (
                <div className="border border-zinc-900 bg-neutral-950 p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase font-mono text-zinc-500 block mb-1.5">Visualização</span>
                  <img 
                    src={tempLogoBase64 || tempLogoUrl}
                    alt="Preview"
                    className="max-h-16 w-auto object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t border-zinc-900 mt-4">
                <button
                  onClick={() => setShowLogoModal(false)}
                  className="px-3 py-2 bg-zinc-900 text-zinc-400 hover:text-white rounded text-xs font-mono transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveLogoConfig}
                  className="px-3 py-2 bg-[#f2b705] text-black font-extrabold uppercase rounded text-xs font-mono cursor-pointer transition-all"
                >
                  SALVAR LOGO
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ----------------------------------------------------
          A4 PRINT PREVIEW: BUDGET (ORÇAMENTO) OVERLAY
          ---------------------------------------------------- */}
      {selectedBudgetForPrint && (
        <div className="fixed inset-0 bg-zinc-100 dark:bg-[#0c0c0e] backdrop-blur-md z-50 overflow-y-auto flex flex-col justify-start p-2 sm:p-4 md:p-8 no-print-backdrop text-zinc-900">
          
          {/* Top minimal control print header */}
          <div className="max-w-4xl mx-auto w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 no-print shadow-xl">
            <span className="text-white text-xs font-bold font-mono">
              Orçamento Técnico Proposto ({selectedBudgetForPrint.numeroOrcamento})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-[#f2b705] text-black font-extrabold text-[10.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl hover:bg-[#f2b705]/90 transition-all font-mono cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(242,183,5,0.2)]"
              >
                <Printer className="w-3.5 h-3.5" /> Baixar PDF / Imprimir
              </button>
              <button
                onClick={() => handleOpenInNewTabBudget(selectedBudgetForPrint)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all font-mono cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
              </button>
              <button
                onClick={() => setSelectedBudgetForPrint(null)}
                className="bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs p-1.5 rounded-xl cursor-pointer transition-colors"
                title="Voltar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core iOS Safari PWA Fallback Notice */}
          <div className="max-w-4xl mx-auto w-full bg-zinc-900/50 border border-zinc-200/20 backdrop-blur p-4 rounded-xl mb-6 text-xs flex flex-col md:flex-row justify-between md:items-center gap-3 no-print text-zinc-700 dark:text-zinc-300">
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

          {/* Clean White A4 Printable Card */}
          <div className="max-w-4xl mx-auto w-full bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 p-4 sm:p-8 md:p-12 shadow-2xl rounded-xl sm:rounded-sm font-sans border border-zinc-250 dark:border-zinc-250 print-card">
            
            {/* White A4 Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-6 mb-6">
              <div className="flex items-center gap-3">
                {config.logo ? (
                  <img 
                    src={config.logo} 
                    alt="AGE Elétrica Logo" 
                    className="h-10 w-auto object-contain" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-1 px-1.5 bg-zinc-950 text-amber-500 font-extrabold text-lg rounded shrink-0 ring-1 ring-zinc-800">
                    AGE
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-black uppercase text-zinc-900 leading-[1.1]">
                    AGE ELÉTRICA
                  </h1>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block leading-[1.2]">
                    Instalações Técnicas Autorizadas
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-lg font-bold text-amber-600 block font-mono">
                  {selectedBudgetForPrint.numeroOrcamento}
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">
                  Emissão: {selectedBudgetForPrint.dataOrcamento.split('-').reverse().join('/')}
                </span>
                <span className="text-[10px] text-red-600 block font-mono font-bold">
                  Validade: {selectedBudgetForPrint.validadeOrcamento.split('-').reverse().join('/')}
                </span>
              </div>
            </div>

            {/* Client Context Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs mb-6 border-b pb-6">
              <div>
                <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">
                  CLIENTE DESTINATÁRIO
                </h3>
                {(() => {
                  const c = clients.find(cl => cl.id === selectedBudgetForPrint.clienteId);
                  return c ? (
                    <div className="space-y-1 text-zinc-700 font-sans">
                      <p className="font-extrabold text-black text-[13px]">{c.nomeCompleto}</p>
                      <p>WhatsApp: {c.whatsapp}</p>
                      <p>Tipo do Imóvel: {c.tipoCliente}</p>
                      <p>Local do Serviço: {selectedBudgetForPrint.localServico || 'Natal, RN'}</p>
                    </div>
                  ) : (
                    <p className="text-red-500 font-mono">Cliente não localizado no banco.</p>
                  );
                })()}
              </div>

              <div>
                <h3 className="font-bold text-zinc-900 uppercase tracking-wider mb-2 font-mono text-[11px]">
                  RESPONSÁVEL TÉCNICO
                </h3>
                <div className="space-y-1 text-zinc-700">
                  <p className="font-extrabold text-black font-sans">{selectedBudgetForPrint.responsavelOrcamento}</p>
                  <p>Inspecionado pelas Normas Regulamentadoras: <strong>NBR 5410, NR10, NR35</strong></p>
                  <p>Instalações Certificadas de Alta Performance</p>
                  <p>Contato corporativo: {config.telefone || '(84) 99888-7766'}</p>
                </div>
              </div>
            </div>

            {/* Scope / General description */}
            <div className="mb-6 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-zinc-500 block">
                Escopo / Descrição Geral do Serviço
              </span>
              <p className="text-xs bg-zinc-50 border border-zinc-200 p-3.5 rounded leading-relaxed text-zinc-800 italic">
                {selectedBudgetForPrint.descricaoGeral}
              </p>
            </div>

            {/* Itemized Table */}
            <div className="border border-zinc-150 rounded overflow-hidden mb-6">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700 font-mono font-bold border-b border-zinc-200 uppercase tracking-wider">
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center w-16">Qtd</th>
                    <th className="p-2.5 text-right w-28">Preço Unit.</th>
                    <th className="p-2.5 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  {budgetItems
                    .filter(item => item.orcamentoId === selectedBudgetForPrint.id)
                    .map((it, idx) => (
                      <tr key={it.id || idx} className="text-zinc-800 font-sans hover:bg-zinc-50/50">
                        <td className="p-2.5 font-medium">{it.descricaoItem}</td>
                        <td className="p-2.5 text-center font-mono">{it.quantidade}</td>
                        <td className="p-2.5 text-right font-mono">
                          R$ {it.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-black">
                          R$ {it.subtotalItem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Summary math block */}
            <div className="flex flex-col items-end gap-1.5 text-xs font-mono text-zinc-650 mb-8 border-b pb-4">
              <div>Subtotal Geral: R$ {selectedBudgetForPrint.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              {selectedBudgetForPrint.desconto > 0 && (
                <div className="text-red-600 font-semibold">Desconto Concedido: R$ -{selectedBudgetForPrint.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              )}
              <div className="text-sm font-bold text-zinc-950">
                Valor Total do Orçamento: <strong className="text-green-600 text-base">R$ {selectedBudgetForPrint.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {/* Standard footprint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-[10.5px] mt-10">
              <div className="space-y-1">
                <p className="font-bold text-zinc-800 font-display">CONDIÇÕES COMERCIAIS</p>
                <p><strong>Prazo de Execução:</strong> {selectedBudgetForPrint.prazoExecucao}</p>
                <p><strong>Forma de Pagamento:</strong> {selectedBudgetForPrint.formaPagamento}</p>
                <p>Fiação antichama e barramentos dimensionados em cobre puro.</p>
              </div>

              <div className="text-center pt-8 border-t border-zinc-200 mt-4 sm:pt-4 sm:border-t-0 font-mono">
                <div className="w-full max-w-[220px] mx-auto border-b border-zinc-400 py-3 block text-center" />
                <span className="font-bold text-zinc-900 block mt-1">{selectedBudgetForPrint.responsavelOrcamento}</span>
                <span className="text-[8px] text-zinc-500 block uppercase tracking-widest">Responsável pela Emissão</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-[8px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t">
              AGE Elétrica • CNPJ {config.cnpj || '35.452.127/0001-90'} • Tecnologia, Confiança e Garantia NBR 5410
            </div>
          </div>

          <div className="max-w-4xl mx-auto w-full pt-4 text-center text-xs text-zinc-500 uppercase tracking-widest no-print">
            Pressione ESC ou clique em fechar para fechar a visualização de faturamento.
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          A4 PRINT PREVIEW: RECEIPT (RECIBO) OVERLAY
          ---------------------------------------------------- */}
      {selectedReceiptForPrint && (
        <div className="fixed inset-0 bg-zinc-100 dark:bg-[#0c0c0e] backdrop-blur-md z-50 overflow-y-auto flex flex-col justify-start p-2 sm:p-4 md:p-8 no-print-backdrop text-zinc-900">
          
          <div className="max-w-3xl mx-auto w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 no-print shadow-xl">
            <span className="text-white text-xs font-bold font-mono">
              Recibo Eletrônico de Garantia ({selectedReceiptForPrint.numeroRecibo})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => window.print()}
                className="bg-green-500 text-black font-extrabold text-[10.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl hover:bg-green-600 transition-all font-mono cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.2)]"
              >
                <Printer className="w-3.5 h-3.5" /> Baixar PDF / Imprimir Recibo
              </button>
              <button
                onClick={() => handleOpenInNewTabReceipt(selectedReceiptForPrint)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all font-mono cursor-pointer flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
              </button>
              <button
                onClick={() => setSelectedReceiptForPrint(null)}
                className="bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs p-1.5 rounded-xl cursor-pointer transition-colors"
                title="Voltar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core iOS Safari PWA Fallback Notice */}
          <div className="max-w-3xl mx-auto w-full bg-zinc-900/50 border border-zinc-200/20 backdrop-blur p-4 rounded-xl mb-6 text-xs flex flex-col md:flex-row justify-between md:items-center gap-3 no-print text-zinc-700 dark:text-zinc-300">
            <div>
              <p className="font-bold text-amber-600 dark:text-amber-400">💡 No iPhone / PWA da AGE Elétrica:</p>
              <p className="text-[11px] mt-0.5">Se o carregamento interno falhar ou ficar cinza/preto, toque em "Abrir em Nova Aba" para usar o visualizador do Safari e salvar o arquivo diretamente no dispositivo.</p>
            </div>
            <button
              onClick={() => handleOpenInNewTabReceipt(selectedReceiptForPrint)}
              className="bg-zinc-800 hover:bg-zinc-750 text-white font-bold px-3.5 py-2 rounded-xl text-[10.5px] uppercase tracking-wide shrink-0 transition-all flex items-center justify-center gap-1.5 self-start md:self-center cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-500" /> Testar Nova Aba
            </button>
          </div>

          {/* Clean White A4 Printable Card */}
          <div className="max-w-3xl mx-auto w-full bg-white dark:bg-white text-zinc-900 dark:text-zinc-900 p-4 sm:p-8 md:p-12 shadow-2xl rounded-xl sm:rounded-sm font-sans border border-zinc-250 dark:border-zinc-250 print-card">
            
            <div className="flex justify-between items-start gap-4 border-b pb-6 mb-6">
              <div className="flex items-center gap-3">
                {config.logo ? (
                  <img 
                    src={config.logo} 
                    alt="AGE Elétrica Logo" 
                    className="h-9 w-auto object-contain" 
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-1 px-1.5 bg-zinc-950 text-amber-500 font-extrabold text-lg rounded shrink-0 ring-1 ring-zinc-850">
                    AGE
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-black uppercase text-zinc-900 leading-[1.1]">
                    AGE ELÉTRICA
                  </h1>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block leading-[1.2]">
                    Recibo Oficial de Garantia Legal
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-lg font-bold text-zinc-900 font-mono block">
                  {selectedReceiptForPrint.numeroRecibo}
                </span>
                <span className="text-xs font-mono block text-green-600 font-bold">
                  Valor: R$ {selectedReceiptForPrint.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Declaration Content */}
            <div className="text-[13px] text-zinc-800 leading-relaxed space-y-4 mb-8">
              <p>
                Declaramos para os devidos fins de direito e garantia técnica que a empresa comercial 
                <strong> AGE ELÉTRICA</strong>, inscrita no CNPJ sob o número 
                <strong> {config.cnpj || '35.452.127/0001-90'}</strong>, recebeu do cliente:
              </p>

              <div className="bg-zinc-50 p-4 border rounded-xl my-4">
                {(() => {
                  const client = clients.find(c => c.id === selectedReceiptForPrint.clienteId);
                  return client ? (
                    <div className="font-sans text-xs space-y-1 block">
                      <p className="text-zinc-900 text-sm font-extrabold">{client.nomeCompleto}</p>
                      <p>WhatsApp: {client.whatsapp}</p>
                      <p>Endereço do Local: {client.endereco || 'Natal, RN'} - {client.bairro}, {client.cidade}</p>
                    </div>
                  ) : (
                    <p className="text-red-500 font-mono text-center">Cliente não localizado no banco.</p>
                  );
                })()}
              </div>

              <p>
                A importância descrita no cabeçalho de 
                <strong className="text-black font-mono"> R$ {selectedReceiptForPrint.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>, 
                representando o faturamento total e quitação do seguinte escopo técnico:
              </p>

              <p className="border border-green-200/60 bg-green-50/15 p-3.5 rounded italic text-zinc-900 block font-bold">
                "{selectedReceiptForPrint.referenteServico}"
              </p>

              <p className="text-xs leading-relaxed text-zinc-650 block mt-3">
                <strong>Garantia do Serviço:</strong> {selectedReceiptForPrint.observacoes || 'Garantia legal assegurada de 90 dias conforme dispõe o Código de Defesa do Consumidor.'}
              </p>
            </div>

            {/* Dates and signatures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-zinc-700 mt-8 border-t pt-6">
              <div className="space-y-1 font-mono">
                <p className="font-bold text-zinc-900">DETALHES DA QUITAÇÃO</p>
                <p>Data Recebimento: {selectedReceiptForPrint.dataEmissao.split('-').reverse().join('/')}</p>
                <p>Operado via: {selectedReceiptForPrint.formaPagamento}</p>
                <p className="text-green-600 font-bold uppercase">Estado comercial: PAGO E QUITADO</p>
              </div>

              <div className="text-center font-sans">
                <div className="w-full max-w-[200px] mx-auto border-b border-zinc-400 py-3.5 block" />
                <span className="font-bold text-zinc-950 block mt-1">{selectedReceiptForPrint.responsavelRecebimento}</span>
                <span className="text-[8px] text-[#f2b705] block uppercase tracking-widest font-bold mt-0.5">Técnico Sênior Autorizado</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-[8.5px] text-zinc-400 text-center uppercase tracking-widest mt-12 pt-4 border-t">
              Contatos corporativo para vistorias: {config.email || 'ageeletricasuporte@gmail.com'} • WhatsApp {config.whatsapp || '84 99988-8877'}
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full pt-4 text-center text-xs text-zinc-500 uppercase tracking-widest no-print">
            Pressione ESC ou clique em fechar para fechar a visualização de faturamento.
          </div>
        </div>
      )}

    </div>
  );
}
