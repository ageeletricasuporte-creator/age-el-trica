/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Edit,
  Trash2,
  X,
  History,
  FileText,
  DollarSign,
  Calendar,
  Check,
  UserCheck
} from 'lucide-react';
import { Cliente, NivelAcesso, TipoCliente, Orcamento, Recibo, Atendimento } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminClientsProps {
  clients: Cliente[];
  budgets: Orcamento[];
  receipts: Recibo[];
  appointments: Atendimento[];
  onSaveClients: (data: Cliente[]) => void;
  userRole: NivelAcesso;
}

export function AdminClients({
  clients,
  budgets,
  receipts,
  appointments,
  onSaveClients,
  userRole
}: AdminClientsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');

  // Modal and Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Cliente | null>(null);

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [num, setNum] = useState('');
  const [complement, setComplement] = useState('');
  const [bairro, setBairro] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [cep, setCep] = useState('');
  const [clientType, setClientType] = useState<TipoCliente>('Residencial');
  const [observations, setObservations] = useState('');

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch =
        c.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cpfCnpj.includes(searchQuery) ||
        c.telefone.includes(searchQuery) ||
        c.whatsapp.includes(searchQuery) ||
        c.bairro.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cidade.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = filterType === 'Todos' || c.tipoCliente === filterType;

      return matchSearch && matchType;
    });
  }, [clients, searchQuery, filterType]);

  const handleOpenNew = () => {
    setEditingClient(null);
    setFullName('');
    setCpfCnpj('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setAddress('');
    setNum('');
    setComplement('');
    setBairro('');
    setCity('Natal');
    setState('RN');
    setCep('');
    setClientType('Residencial');
    setObservations('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Cliente) => {
    setEditingClient(c);
    setFullName(c.nomeCompleto);
    setCpfCnpj(c.cpfCnpj);
    setPhone(c.telefone);
    setWhatsapp(c.whatsapp);
    setEmail(c.email);
    setAddress(c.enderecoCompleto);
    setNum(c.numero);
    setComplement(c.complemento);
    setBairro(c.bairro);
    setCity(c.cidade);
    setState(c.estado);
    setCep(c.cep);
    setClientType(c.tipoCliente);
    setObservations(c.observacoes);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Sem permissão. Apenas o perfil Administrador pode excluir clientes!');
      return;
    }
    setClientToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      const updated = clients.filter(v => v.id !== clientToDelete.id);
      onSaveClients(updated);
      setClientToDelete(null);
      setSuccessMessage('Cliente excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsConfirmOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      setErrorMessage('Nome Completo e Telefone são campos obrigatórios!');
      return;
    }

    let updatedList: Cliente[] = [];

    if (editingClient) {
      // Edit existing
      updatedList = clients.map(c => {
        if (c.id === editingClient.id) {
          return {
            ...c,
            nomeCompleto: fullName,
            cpfCnpj,
            telefone: phone,
            whatsapp,
            email,
            enderecoCompleto: address,
            numero: num,
            complemento: complement,
            bairro,
            cidade: city,
            estado: state,
            cep,
            tipoCliente: clientType,
            observacoes: observations
          };
        }
        return c;
      });
      setSuccessMessage('Cadastro do cliente atualizado com sucesso!');
    } else {
      // Create new
      const newClient: Cliente = {
        id: `cli-${Date.now()}`,
        nomeCompleto: fullName,
        cpfCnpj,
        telefone: phone,
        whatsapp,
        email,
        enderecoCompleto: address,
        numero: num,
        complemento: complement,
        bairro,
        cidade: city,
        estado: state,
        cep,
        tipoCliente: clientType,
        observacoes: observations,
        dataCadastro: new Date().toISOString(),
        statusCliente: 'Ativo'
      };
      updatedList = [newClient, ...clients];
      setSuccessMessage('Novo cliente adicionado com sucesso!');
    }

    onSaveClients(updatedList);
    setErrorMessage(null);
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Aggregated client history query
  const historyData = useMemo(() => {
    if (!selectedClientForHistory) return null;
    const cid = selectedClientForHistory.id;

    const matchedBudgets = budgets.filter(b => b.clienteId === cid);
    const matchedReceipts = receipts.filter(r => r.clienteId === cid);
    const matchedAppointments = appointments.filter(a => a.clienteId === cid);

    return {
      budgets: matchedBudgets,
      receipts: matchedReceipts,
      appointments: matchedAppointments
    };
  }, [selectedClientForHistory, budgets, receipts, appointments]);

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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white">Cadastros de Clientes</h2>
          <p className="text-zinc-500 text-xs">Gerencie a carteira de contatos residenciais e condomínios da AGE Elétrica.</p>
        </div>
        <button
          onClick={handleOpenNew}
          className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow"
        >
          <Plus className="w-4 h-4 text-black" strokeWidth={3} /> ADICIONAR CLIENTE
        </button>
      </div>

      {/* Searching row */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, bairro, telefone, CPF/CNPJ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
          {['Todos', 'Residencial', 'Comercial', 'Industrial', 'Condomínio'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${filterType === type ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850'}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900/60 p-12 text-center text-zinc-500">
          <UserCheck className="w-12 h-12 text-zinc-650 mx-auto mb-3" />
          <span className="text-white font-bold block mb-1">Nenhum cliente catalogado</span>
          <span className="text-xs">Clique no botão superior para registrar novo cliente na base de dados.</span>
        </div>
      ) : (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 bg-zinc-900/20 text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                  <th className="py-4 px-5">Cliente</th>
                  <th className="py-4 px-5">Tipo</th>
                  <th className="py-4 px-5">CPF / CNPJ</th>
                  <th className="py-4 px-5">Contato</th>
                  <th className="py-4 px-5">Localização</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-xs">
                {filteredClients.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/10 transition group text-gray-300">
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-white text-sm block">{c.nomeCompleto}</span>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">Cadastrado em: {new Date(c.dataCadastro).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        c.tipoCliente === 'Residencial' ? 'bg-amber-500/15 border border-amber-500/15 text-amber-500' :
                        c.tipoCliente === 'Comercial' ? 'bg-blue-500/15 border border-blue-500/15 text-blue-400' :
                        c.tipoCliente === 'Industrial' ? 'bg-purple-500/15 border border-purple-500/15 text-purple-400' :
                        'bg-teal-500/15 border border-teal-500/15 text-teal-400'
                      }`}>
                        {c.tipoCliente}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-zinc-400">{c.cpfCnpj || 'Não informado'}</td>
                    <td className="py-4 px-5 space-y-0.5">
                      <span className="block font-mono text-[11px]">📞 {c.telefone}</span>
                      {c.whatsapp && <span className="block font-mono text-[11px] text-green-400">💬 {c.whatsapp}</span>}
                    </td>
                    <td className="py-4 px-5 max-w-xs space-y-0.5">
                      <span className="block truncated text-gray-200">{c.enderecoCompleto}, {c.numero}</span>
                      <span className="block text-[10px] text-zinc-500 font-mono">{c.bairro} - {c.cidade}/{c.estado}</span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex justify-end gap-2 text-zinc-400">
                        <button
                          onClick={() => setSelectedClientForHistory(c)}
                          className="p-1 px-2 text-[10px] bg-zinc-900 hover:bg-amber-500/10 hover:text-amber-500 rounded border border-zinc-800 transition flex items-center gap-1 font-mono uppercase"
                          title="Ficha e Histórico"
                        >
                          <History className="w-3 h-3" /> Ficha
                        </button>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 hover:text-amber-500 rounded transition"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {userRole === 'Administrador' && (
                          <button
                            onClick={() => handleDeleteTrigger(c.id, c.nomeCompleto)}
                            className="p-1.5 bg-zinc-905 border border-zinc-905 hover:bg-red-500/20 hover:text-red-400 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Customer Form (Edit/Create) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-zinc-850 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-3">
              {editingClient ? `Editar Cadastro: ${editingClient.nomeCompleto}` : 'Cadastrar Novo Cliente'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">CPF ou CNPJ</label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                    placeholder="Ex: 000.000.000-00 ou 00.000.000/0001-00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Telefone Fixo *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">WhatsApp Mobile</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                    placeholder="Com DDD"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white text-sans"
                    placeholder="contato@cliente.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-zinc-400 block mb-1">Endereço Completo</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Número</label>
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => setNum(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Complemento</label>
                  <input
                    type="text"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Bairro</label>
                  <input
                    type="text"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Estado</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  >
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AM">AM</option>
                    <option value="AP">AP</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MG">MG</option>
                    <option value="MS">MS</option>
                    <option value="MT">MT</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="PR">PR</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="RS">RS</option>
                    <option value="SC">SC</option>
                    <option value="SE">SE</option>
                    <option value="SP">SP</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">CEP</label>
                  <input
                    type="text"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Classificação do Cliente</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as TipoCliente)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="Residencial">Residencial</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Condomínio">Condomínio</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Anotações Internas de Prata / Restrições</label>
                  <input
                    type="text"
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                    placeholder="Ex: interfone quebrado, proprietário no exterior..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER: Ficha e Histórico do Cliente */}
      {selectedClientForHistory && historyData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-zinc-900 border-l border-zinc-800 h-full max-w-lg w-full p-6 relative flex flex-col justify-between overflow-y-auto">
            
            <div>
              <button
                onClick={() => setSelectedClientForHistory(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="border-b border-zinc-850 pb-4 mb-6">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full text-amber-500 text-[10px] font-mono mb-2 uppercase">
                  Ficha Cadastral Ativa
                </div>
                <h3 className="text-xl font-extrabold text-white">{selectedClientForHistory.nomeCompleto}</h3>
                <span className="text-zinc-500 font-mono text-[11px] block">{selectedClientForHistory.tipoCliente} • CPF/CNPJ: {selectedClientForHistory.cpfCnpj || 'Isento'}</span>
              </div>

              {/* Informações detalhadas */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 space-y-2 mb-6 text-xs">
                <div><span className="text-zinc-500 font-mono">Telefone:</span> <span className="text-zinc-350 font-mono font-bold">{selectedClientForHistory.telefone}</span></div>
                <div><span className="text-zinc-500 font-mono">WhatsApp:</span> <span className="text-green-400 font-mono font-bold">{selectedClientForHistory.whatsapp || 'Não cadastrado'}</span></div>
                <div><span className="text-zinc-500 font-mono">Email:</span> <span className="text-zinc-355 font-mono">{selectedClientForHistory.email || 'Não cadastrado'}</span></div>
                <div><span className="text-zinc-500 font-mono">Endereço:</span> <span className="text-zinc-350">{selectedClientForHistory.enderecoCompleto}, {selectedClientForHistory.numero} {selectedClientForHistory.complemento ? `(${selectedClientForHistory.complemento})` : ''} - {selectedClientForHistory.bairro}, {selectedClientForHistory.cidade}/{selectedClientForHistory.estado}</span></div>
                {selectedClientForHistory.observacoes && (
                  <div className="pt-2 border-t border-zinc-900"><span className="text-amber-500 font-mono block text-[10px] uppercase font-bold">Observações internas:</span> <span className="text-zinc-400 block italic leading-relaxed">{selectedClientForHistory.observacoes}</span></div>
                )}
              </div>

              {/* History Lists stacked */}
              <div className="space-y-6">
                
                {/* Historical Budgets */}
                <div>
                  <h4 className="text-xs font-mono text-zinc-400 border-b border-zinc-850 pb-2 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-white font-bold"><FileText className="w-4 h-4 text-amber-500" /> Historic de Orçamentos</span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">{historyData.budgets.length}</span>
                  </h4>
                  {historyData.budgets.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 font-mono block italic">Sem nenhum orçamento registrado.</span>
                  ) : (
                    <div className="space-y-2">
                      {historyData.budgets.map(b => (
                        <div key={b.id} className="bg-zinc-950 border border-zinc-850 p-2.5 rounded text-xs flex justify-between items-center font-sans">
                          <div>
                            <span className="font-extrabold text-white block">{b.numeroOrcamento}</span>
                            <span className="text-zinc-500 text-[10px] font-mono">{b.dataOrcamento} • Responsável: {b.responsavelOrcamento}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-amber-500 font-bold block">R$ {b.valorTotal.toFixed(2)}</span>
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                              b.status === 'Aprovado' || b.status === 'Finalizado' ? 'bg-green-500/10 text-green-400 border border-green-500/15' :
                              b.status === 'Em análise' ? 'bg-zinc-800 text-zinc-400' :
                              'bg-amber-500/10 text-amber-500 border border-amber-500/15'
                            }`}>{b.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historical Receipts */}
                <div>
                  <h4 className="text-xs font-mono text-zinc-400 border-b border-zinc-850 pb-2 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-white font-bold"><DollarSign className="w-4 h-4 text-green-400" /> Histórico de Recibos de Garantia</span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">{historyData.receipts.length}</span>
                  </h4>
                  {historyData.receipts.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 font-mono block italic">Nenhum recibo de pagamento emitido.</span>
                  ) : (
                    <div className="space-y-2">
                      {historyData.receipts.map(r => (
                        <div key={r.id} className="bg-zinc-950 border border-zinc-850 p-2.5 rounded text-xs flex justify-between items-center">
                          <div>
                            <span className="font-extrabold text-white block">{r.numeroRecibo}</span>
                            <span className="text-zinc-500 text-[10px] font-mono">Emitido em: {r.dataEmissao} via {r.formaPagamento}</span>
                          </div>
                          <span className="font-mono text-green-400 font-bold">R$ {r.valorRecebido.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Technical Appointments */}
                <div>
                  <h4 className="text-xs font-mono text-zinc-400 border-b border-zinc-850 pb-2 mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-white font-bold"><Calendar className="w-4 h-4 text-blue-400" /> Histórico de Atendimentos de Equipe</span>
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-bold">{historyData.appointments.length}</span>
                  </h4>
                  {historyData.appointments.length === 0 ? (
                    <span className="text-[11px] text-zinc-500 font-mono block italic">Nenhum atendimento em campo marcado.</span>
                  ) : (
                    <div className="space-y-2">
                      {historyData.appointments.map(a => (
                        <div key={a.id} className="bg-zinc-950 border border-zinc-850 p-2.5 rounded text-xs">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-1.5">
                            <span className="font-mono text-blue-400 font-semibold">{a.dataAgendada} às {a.horario}</span>
                            <span className="text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase">{a.status}</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed text-[11px]">{a.descricaoAtendimento}</p>
                          <span className="text-[10px] text-zinc-500 font-mono block mt-1">Eletricista: {a.tecnicoResponsavel}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>

            <button
              onClick={() => setSelectedClientForHistory(null)}
              className="w-full bg-zinc-800 hover:bg-zinc-750 text-white font-bold py-2.5 rounded-xl transition text-xs mt-8"
            >
              Fechar Ficha do Cliente
            </button>

          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Excluir Cliente?"
        message={`Tem certeza de que deseja banir ou excluir permanentemente o cliente "${clientToDelete?.name}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
