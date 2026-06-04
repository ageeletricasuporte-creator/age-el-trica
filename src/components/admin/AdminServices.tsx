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
  Zap,
  Tag
} from 'lucide-react';
import { Servico, NivelAcesso, UnidadeCobranca } from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminServicesProps {
  services: Servico[];
  onSaveServices: (data: Servico[]) => void;
  userRole: NivelAcesso;
}

export function AdminServices({
  services,
  onSaveServices,
  userRole
}: AdminServicesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modal and Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Instalação');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number>(100);
  const [chargeUnit, setChargeUnit] = useState<UnidadeCobranca>('serviço');
  const [averageTime, setAverageTime] = useState('');
  const [techObservations, setTechObservations] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  // Error & Success Alert States (resolves iframe issues)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);

  // Categories list
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.categoria));
    return ['Todos', ...Array.from(cats)];
  }, [services]);

  // Filtering
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch =
        s.nomeServico.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.observacoesTecnicas.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = categoryFilter === 'Todos' || s.categoria === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [services, searchQuery, categoryFilter]);

  const handleOpenNew = () => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Apenas Administradores ou Atendentes podem editar o portfólio de serviços!');
      return;
    }
    setEditingService(null);
    setName('');
    setCategory('Instalação');
    setDescription('');
    setBasePrice(100);
    setChargeUnit('serviço');
    setAverageTime('1 hora');
    setTechObservations('');
    setStatus('Ativo');
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Servico) => {
    if (userRole === 'Tecnico/Eletricista') {
      setErrorMessage('Sem permissão. Apenas Administradores ou Atendentes podem editar o portfólio de serviços!');
      return;
    }
    setEditingService(s);
    setName(s.nomeServico);
    setCategory(s.categoria);
    setDescription(s.descricao);
    setBasePrice(s.precoBase);
    setChargeUnit(s.unidadeCobranca);
    setAverageTime(s.tempoMedio);
    setTechObservations(s.observacoesTecnicas);
    setStatus(s.status);
    setErrorMessage(null);
    setIsFormOpen(true);
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Sem permissão. Apenas o perfil Administrador pode redefinir o portfólio de serviços do sistema!');
      return;
    }
    setServiceToDelete({ id, name });
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (serviceToDelete) {
      const updated = services.filter(s => s.id !== serviceToDelete.id);
      onSaveServices(updated);
      setServiceToDelete(null);
      setSuccessMessage('Serviço excluído com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setIsConfirmOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || basePrice <= 0) {
      setErrorMessage('Por favor, preencha o Nome e defina um Preço Base válido superior a zero!');
      return;
    }

    let updatedList: Servico[] = [];

    if (editingService) {
      updatedList = services.map(s => {
        if (s.id === editingService.id) {
          return {
            ...s,
            nomeServico: name,
            categoria: category,
            descricao: description,
            precoBase: basePrice,
            unidadeCobranca: chargeUnit,
            tempoMedio: averageTime,
            observacoesTecnicas: techObservations,
            status
          };
        }
        return s;
      });
      setSuccessMessage('Serviço atualizado com sucesso!');
    } else {
      const newService: Servico = {
        id: `srv-${Date.now()}`,
        nomeServico: name,
        categoria: category,
        descricao: description,
        precoBase: basePrice,
        unidadeCobranca: chargeUnit,
        tempoMedio: averageTime,
        observacoesTecnicas: techObservations,
        status: 'Ativo'
      };
      updatedList = [...services, newService];
      setSuccessMessage('Novo serviço adicionado com sucesso!');
    }

    onSaveServices(updatedList);
    setErrorMessage(null);
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
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
          <h2 className="text-xl font-extrabold text-white">Catálogo de Serviços Elétricos (NBR)</h2>
          <p className="text-zinc-500 text-xs text-sans">Gerencie o portfólio de soluções ativas e parametrize preços de referência.</p>
        </div>
        {userRole !== 'Tecnico/Eletricista' && (
          <button
            onClick={handleOpenNew}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-black" strokeWidth={3} /> NOVOS PARÂMETROS
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por serviços elétricos catalogados..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${categoryFilter === cat ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-white border border-zinc-850'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services representation list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((s, index) => (
          <div
            key={s.id}
            className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/20 p-5 rounded-2xl transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-mono tracking-widest text-amber-500 uppercase bg-amber-500/10 border border-amber-500/15 px-2 py-0.5 rounded">
                  {s.categoria}
                </span>
                <span className="text-zinc-650 font-mono text-[10px]">INDEX: #{index+1}</span>
              </div>

              <h4 className="text-white font-extrabold text-base mb-1.5">{s.nomeServico}</h4>
              <p className="text-zinc-400 text-xs leading-relaxed mb-4 line-clamp-3">{s.descricao}</p>

              {/* Technical indicators standard */}
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-900/80 space-y-2 text-xs mb-4">
                <div className="flex justify-between items-center text-zinc-500 font-mono">
                  <span>UNIDADE:</span>
                  <span className="text-gray-350 font-bold block bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded-full uppercase text-[9px]">{s.unidadeCobranca}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 font-mono">
                  <span>TEMPO MÉDIO:</span>
                  <span className="text-white font-medium">{s.tempoMedio}</span>
                </div>
                <div className="text-zinc-500 font-mono">
                  <span className="block text-[9px] uppercase font-bold text-amber-500 mb-0.5">Observações Técnicas NBR:</span>
                  <span className="block text-zinc-400 text-[10px] leading-relaxed italic truncate" title={s.observacoesTecnicas}>{s.observacoesTecnicas}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-900 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono block uppercase">Valor de Referência</span>
                <span className="text-lg font-extrabold text-white font-mono">R$ {s.precoBase.toFixed(2)}</span>
              </div>

              {userRole !== 'Tecnico/Eletricista' && (
                <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 px-2.5 text-[11px] bg-zinc-900 hover:bg-amber-500 hover:text-black font-semibold rounded border border-zinc-800 transition"
                    title="Configurar Parâmetros"
                  >
                    Editar
                  </button>
                  {userRole === 'Administrador' && (
                    <button
                      onClick={() => handleDeleteTrigger(s.id, s.nomeServico)}
                      className="p-1 px-1.5 bg-zinc-905 hover:bg-red-500/20 hover:text-red-400 rounded border border-zinc-900 transition"
                      title="Excluir do Catálogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Service Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-zinc-850 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-6 border-b border-zinc-800 pb-3">
              {editingService ? `Editar Serviço: ${editingService.nomeServico}` : 'Cadastrar Parâmetros de Serviço'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Nome Fantasia do Serviço *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  placeholder="Ex: Instalação de DPS de Proteção"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Categoria de Atividade</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  >
                    <option value="Instalação">Instalação</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Emergência">Emergência</option>
                    <option value="Recarga veicular">Recarga veicular</option>
                    <option value="Quadro elétrico">Quadro elétrico</option>
                    <option value="Iluminação">Iluminação</option>
                    <option value="Segurança elétrica">Segurança elétrica</option>
                    <option value="Automação">Automação</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Unidade de Cobrança</label>
                  <select
                    value={chargeUnit}
                    onChange={(e) => setChargeUnit(e.target.value as UnidadeCobranca)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white capitalize font-mono"
                  >
                    <option value="serviço">Serviço fechado</option>
                    <option value="hora">Eletricista por hora</option>
                    <option value="metro">Por metro linear</option>
                    <option value="ponto">Ponto elétrico (tomada/interruptor)</option>
                    <option value="visita">Taxa de Visita + checklist</option>
                    <option value="diária">Diária residencial / predial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Preço Base Referencial (R$) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tempo Médio Cronometrado Estimado</label>
                  <input
                    type="text"
                    required
                    value={averageTime}
                    onChange={(e) => setAverageTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                    placeholder="Ex: 1.5 hora ou 30 min"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Descrição Comercial Resumida</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white"
                  placeholder="Explique resumidamente os limites do serviço..."
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Observações Técnicas e Normas de Segurança (NR10)</label>
                <textarea
                  rows={2}
                  value={techObservations}
                  onChange={(e) => setTechObservations(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 outline-none rounded-xl py-2 px-3 text-xs text-white font-mono"
                  placeholder="Ex: Demanda disjuntor de proteção DIN modelo bipolar Curva C de 40A..."
                />
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
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Salvar Parâmetros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Excluir Serviço?"
        message={`Tem certeza de que deseja excluir permanentemente o serviço "${serviceToDelete?.name}" das opções do sistema?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
