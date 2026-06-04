/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Plus,
  X,
  Check,
  MapPin,
  Clipboard,
  Camera,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  Atendimento,
  Cliente,
  Orcamento,
  NivelAcesso,
  StatusAtendimento
} from '../../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminAgendaProps {
  appointments: Atendimento[];
  clients: Cliente[];
  budgets: Orcamento[];
  onSaveAppointments: (data: Atendimento[]) => void;
  userRole: NivelAcesso;
}

export function AdminAgenda({
  appointments,
  clients,
  budgets,
  onSaveAppointments,
  userRole
}: AdminAgendaProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | StatusAtendimento>('Todos');

  // Modal forms
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Atendimento | null>(null);

  // Resolution modal (tech update modal)
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [activeTechApp, setActiveTechApp] = useState<Atendimento | null>(null);

  // Form Fields
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBudgetId, setSelectedBudgetId] = useState('');
  const [technician, setTechnician] = useState('Carlos Silva (Eletricista)');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [generalDesc, setGeneralDesc] = useState('');

  // Tech progress Form fields
  const [techObservations, setTechObservations] = useState('');
  const [techStatus, setTechStatus] = useState<StatusAtendimento>('Agendado');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [typedSignature, setTypedSignature] = useState('');

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [appointmentToDeleteId, setAppointmentToDeleteId] = useState<string | null>(null);

  // Canvas Drawing configuration for digital signoff
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Filter schedules
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const clientObj = clients.find(c => c.id === a.clienteId);
      const matchesSearch =
        a.tecnicoResponsavel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.descricaoAtendimento.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (clientObj && clientObj.nomeCompleto.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, clients, searchQuery, statusFilter]);

  const handleOpenNew = () => {
    if (userRole === 'Tecnico/Eletricista') {
      alert('Sem permissão. Técnicos não redefinem a agenda geral do sistema!');
      return;
    }

    setEditingAppointment(null);
    setSelectedClientId(clients[0]?.id || '');
    setSelectedBudgetId('');
    setTechnician('Carlos Silva (Eletricista)');
    setDateStr(new Date().toISOString().substring(0, 10));
    setTimeStr('09:00');
    setGeneralDesc('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (a: Atendimento) => {
    if (userRole === 'Tecnico/Eletricista') {
      alert('Sem permissão. Técnicos não redefinem a agenda geral do sistema!');
      return;
    }

    setEditingAppointment(a);
    setSelectedClientId(a.clienteId);
    setSelectedBudgetId(a.orcamentoId);
    setTechnician(a.tecnicoResponsavel);
    setDateStr(a.dataAgendada);
    setTimeStr(a.horario);
    setGeneralDesc(a.descricaoAtendimento);
    setIsFormOpen(true);
  };

  // Open task resolution workflow
  const handleOpenResolution = (a: Atendimento) => {
    setActiveTechApp(a);
    setTechObservations(a.observacoesTecnicas);
    setTechStatus(a.status);
    setBeforePhotos(a.fotosAntes);
    setAfterPhotos(a.fotosDepois);
    setTypedSignature(a.assinaturaCliente);
    setIsTechModalOpen(true);
  };

  // Canvas mouse interactions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#f59e0b'; // Amber brush color
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Upload/mock picture injection
  const handleMockUploadBefore = () => {
    const mockPic = 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&auto=format&fit=crop&q=60';
    setBeforePhotos([...beforePhotos, mockPic]);
  };

  const handleMockUploadAfter = () => {
    const mockPic = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60';
    setAfterPhotos([...afterPhotos, mockPic]);
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMessage('Vincule o cliente cadastrado!');
      return;
    }

    let updatedList: Atendimento[] = [];

    if (editingAppointment) {
      updatedList = appointments.map(a => {
        if (a.id === editingAppointment.id) {
          return {
            ...a,
            clienteId: selectedClientId,
            orcamentoId: selectedBudgetId,
            tecnicoResponsavel: technician,
            dataAgendada: dateStr,
            horario: timeStr,
            descricaoAtendimento: generalDesc
          };
        }
        return a;
      });
      setSuccessMessage('Compromisso agendado atualizado com sucesso!');
    } else {
      const newApp: Atendimento = {
        id: `ate-${Date.now()}`,
        clienteId: selectedClientId,
        orcamentoId: selectedBudgetId,
        tecnicoResponsavel: technician,
        dataAgendada: dateStr,
        horario: timeStr,
        status: 'Agendado',
        descricaoAtendimento: generalDesc,
        observacoesTecnicas: '',
        fotosAntes: [],
        fotosDepois: [],
        assinaturaCliente: '',
        dataFinalizacao: ''
      };
      updatedList = [newApp, ...appointments];
      setSuccessMessage('Novo compromisso adicionado com sucesso!');
    }

    onSaveAppointments(updatedList);
    setErrorMessage(null);
    setIsFormOpen(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleSaveTechProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTechApp) return;

    // Convert drawn signature if captured by canvas
    let finalSignature = typedSignature;
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if signature drawn (we simply simulate typing or use base64 data)
      finalSignature = typedSignature || 'Assinado Eletronicamente por IP';
    }

    const updated = appointments.map(a => {
      if (a.id === activeTechApp.id) {
        return {
          ...a,
          status: techStatus,
          observacoesTecnicas: techObservations,
          fotosAntes: beforePhotos,
          fotosDepois: afterPhotos,
          assinaturaCliente: finalSignature,
          dataFinalizacao: techStatus === 'Concluído' ? new Date().toISOString() : a.dataFinalizacao
        };
      }
      return a;
    });

    onSaveAppointments(updated);
    setIsTechModalOpen(false);
    setActiveTechApp(null);
  };

  const handleDeleteTrigger = (id: string) => {
    if (userRole !== 'Administrador') {
      setErrorMessage('Apenas Administradores podem excluir compromissos agendados!');
      return;
    }
    setAppointmentToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (appointmentToDeleteId) {
      onSaveAppointments(appointments.filter(a => a.id !== appointmentToDeleteId));
      setAppointmentToDeleteId(null);
      setSuccessMessage('Agendamento excluído da escala com sucesso!');
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

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white font-sans">Escala Técnica e Serviços Agendados</h2>
          <p className="text-zinc-500 text-xs">Monitore os atendimentos de emergências, instalações residenciais de chuveiro e wallbox veicular.</p>
        </div>
        {userRole !== 'Tecnico/Eletricista' && (
          <button
            onClick={handleOpenNew}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-4 py-2 rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-black" strokeWidth={3} /> AGENDAR ATENDIMENTO
          </button>
        )}
      </div>

      {/* Filters Search row */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por técnico, descrição ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 outline-none rounded-xl py-2 pl-9 pr-4 text-xs text-white transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto justify-end">
          {['Todos', 'Agendado', 'Em andamento', 'Concluído', 'Cancelado', 'Reagendado'].map(st => (
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

      {/* Visual Timeline Cards list */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-zinc-950 rounded-2xl border border-zinc-900/60 p-12 text-center text-zinc-500">
          <Calendar className="w-12 h-12 text-zinc-750 mx-auto mb-3" />
          <span className="text-white font-bold block mb-1">Nenhum atendimento escalado</span>
          <span className="text-xs">Tente redefinir os filtros superiores ou faça um novo agendamento rápido no portfólio.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map(app => {
            const clientObj = clients.find(c => c.id === app.clienteId);
            const budgetObj = budgets.find(b => b.id === app.orcamentoId);
            return (
              <div
                key={app.id}
                className="bg-zinc-950 border border-zinc-900 hover:border-amber-500/15 p-5 rounded-2xl transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      <span>{app.dataAgendada.split('-').reverse().join('/')}</span>
                      <span className="text-zinc-650">•</span>
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{app.horario}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      app.status === 'Concluído' ? 'bg-green-500/15 text-green-400 border border-green-550/20' :
                      app.status === 'Cancelado' ? 'bg-red-500/15 text-red-500' :
                      app.status === 'Em andamento' ? 'bg-amber-500/15 text-amber-500 animate-pulse' :
                      'bg-blue-500/15 text-blue-400 border border-blue-550/15'
                    }`}>{app.status}</span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      {clientObj ? (
                        <>
                          <span className="font-extrabold text-white text-base block">{clientObj.nomeCompleto}</span>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full inline-block mt-1">🏠 {clientObj.tipoCliente} • {clientObj.bairro}</span>
                        </>
                      ) : (
                        <span className="text-red-400 font-bold italic">Dados do cliente ausentes</span>
                      )}
                    </div>

                    <p className="text-zinc-400 font-sans leading-relaxed text-xs">{app.descricaoAtendimento}</p>

                    {budgetObj && (
                      <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-850 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-500" /> Orçamento: <strong className="text-amber-500">{budgetObj.numeroOrcamento}</strong> (R$ {budgetObj.valorTotal.toFixed(2)})
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-900 flex justify-between items-center">
                  <div className="font-mono text-[10px] text-zinc-500">
                    <span>Eletricista Escutado:</span>
                    <span className="block text-gray-300 font-bold">{app.tecnicoResponsavel.split(' ')[0]}</span>
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleOpenResolution(app)}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-1.5 px-3.5 rounded text-xs transition"
                    >
                      Preencher Laudo
                    </button>
                    {userRole !== 'Tecnico/Eletricista' && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1 rounded-lg border border-zinc-850 transition"
                        >
                          <Clipboard className="w-3.5 h-3.5" />
                        </button>
                        {userRole === 'Administrador' && (
                          <button
                            onClick={() => handleDeleteTrigger(app.id)}
                            className="bg-zinc-905 hover:bg-red-500/10 hover:text-red-400 p-1 rounded-lg border border-zinc-900 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: APPOINTMENT SCHEDULER FORM (Admin/Attendant only) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-zinc-850 text-zinc-450"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              {editingAppointment ? 'Alterar Agendamento Técnico' : 'Agendar Novo Atendimento Elétrico'}
            </h3>

            <form onSubmit={handleSaveAppointment} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Escolher Cliente Cadastrado *</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="" disabled>Escolha...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto} ({c.bairro})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Vincular Orçamento Aprovado (Opcional)</label>
                <select
                  value={selectedBudgetId}
                  onChange={(e) => setSelectedBudgetId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                >
                  <option value="">Nenhum orçamento vinculado</option>
                  {budgets.map(b => {
                    const cl = clients.find(c => c.id === b.clienteId);
                    return <option key={b.id} value={b.id}>{b.numeroOrcamento} - {cl?.nomeCompleto || 'Desconhecido'} (R$ {b.valorTotal.toFixed(2)})</option>;
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Data Agendada *</label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Horário Marcado *</label>
                  <input
                    type="time"
                    required
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Técnico/Eletricista Alocado de Prontidão</label>
                <select
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="Carlos Silva (Eletricista)">Carlos Silva (Eletricista Certificado)</option>
                  <option value="Geraldo Fonseca (AGE)">Geraldo Fonseca (Responsável Geral)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Escopo ou Descrição do Atendimento *</label>
                <textarea
                  required
                  rows={3}
                  value={generalDesc}
                  onChange={(e) => setGeneralDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none"
                  placeholder="Ex: Resolver vazamento de energia do chuveiro ou implantar a caixa blindada do Wallbox veicular..."
                />
              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-zinc-850 hover:bg-zinc-850 text-zinc-400 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-black" strokeWidth={2.5} /> Salvar Escala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLUTION/TECHNICAL LOG FORM MODAL */}
      {isTechModalOpen && activeTechApp && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full p-6 relative shadow-2xl my-8">
            <button
              onClick={() => { setIsTechModalOpen(false); setActiveTechApp(null); }}
              className="absolute right-4 top-4 p-1.5 bg-zinc-850 rounded-full text-zinc-400"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-white mb-6 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-amber-500" /> Preencher Diário Técnico e Assinatura
            </h3>

            <form onSubmit={handleSaveTechProgress} className="space-y-5 text-xs">
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Resumo do Cronograma:</span>
                <p className="text-white font-semibold text-sm">Cliente: {clients.find(c => c.id === activeTechApp.clienteId)?.nomeCompleto}</p>
                <p className="text-zinc-400">Escala de Serviço: {activeTechApp.descricaoAtendimento}</p>
                <p className="text-zinc-400">Instalação via: {activeTechApp.tecnicoResponsavel}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-amber-500 block mb-1 font-bold">Estado do Atendimento</label>
                  <select
                    value={techStatus}
                    onChange={(e) => setTechStatus(e.target.value as StatusAtendimento)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white uppercase font-mono"
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluído">Concluído com Sucesso</option>
                    <option value="Cancelado">Cancelado / Abortado</option>
                    <option value="Reagendado">Reagendado por força maior</option>
                  </select>
                </div>
              </div>

              {/* Photos Mockers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-850 pt-4">
                <div>
                  <label className="text-zinc-400 font-mono text-[10px] block uppercase mb-1">Fotos Antes do Serviço (Vistoria Geral)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {beforePhotos.map((p, idx) => (
                      <img key={idx} src={p} alt="Antes" className="w-12 h-12 object-cover rounded border border-zinc-805" />
                    ))}
                    <button
                      type="button"
                      onClick={handleMockUploadBefore}
                      className="w-12 h-12 bg-zinc-950 hover:bg-zinc-850 rounded border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 font-mono text-[10px] block uppercase mb-1">Fotos Depois do Serviço (Conformidade Final)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {afterPhotos.map((p, idx) => (
                      <img key={idx} src={p} alt="Depois" className="w-12 h-12 object-cover rounded border border-zinc-805" />
                    ))}
                    <button
                      type="button"
                      onClick={handleMockUploadAfter}
                      className="w-12 h-12 bg-zinc-950 hover:bg-zinc-850 rounded border border-dashed border-zinc-800 flex flex-col items-center justify-center text-zinc-500"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Laudo Técnico / Parecer de Engenharia sobre os testes realizados</label>
                <textarea
                  rows={3}
                  value={techObservations}
                  onChange={(e) => setTechObservations(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none font-mono"
                  placeholder="Ex: Tensão aferida de 221V sem flutuações, disjuntor superaquecido Siemens trocado, aterramento medindo 3.5 ohms."
                />
              </div>

              {/* INTERACTIVE SIGNATURE BOX */}
              <div className="border-t border-zinc-850 pt-4">
                <span className="font-bold text-amber-500 font-mono text-[10px] block uppercase mb-2">Assinatura Digital de Ciência do Cliente (ACEITE)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Drawing Area */}
                  <div className="md:col-span-7 bg-zinc-950 p-2 rounded-xl border border-zinc-900 text-center">
                    <span className="text-[9px] text-zinc-500 block mb-2 font-mono">Arraste o mouse ou assine com o toque na tela:</span>
                    <canvas
                      ref={canvasRef}
                      width={320}
                      height={100}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="bg-black border border-zinc-850 rounded mx-auto cursor-crosshair touch-none"
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-[10px] text-zinc-500 hover:text-white font-mono mt-2"
                    >
                      Limpar Desenho
                    </button>
                  </div>

                  {/* Cursive text signature alternative */}
                  <div className="md:col-span-5 bg-zinc-950 p-3 rounded-xl border border-zinc-900 space-y-2">
                    <span className="text-[9px] text-zinc-500 block font-mono">Alternativa: Digitar Nome do Portador:</span>
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                      placeholder="Ex: Maria Ramos Nogueira"
                    />
                    <span className="text-[10px] text-amber-500 font-mono block italic text-center underline decoration-amber-500/20">
                      Cursive: {typedSignature || 'Assinado eletronicamente'}
                    </span>
                  </div>
                </div>

              </div>

              <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsTechModalOpen(false); setActiveTechApp(null); }}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4 fill-green-600" /> Finalizar Diário Técnico
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Excluir Compromisso?"
        message="Tem certeza de que deseja banir este agendamento da escala de visitas?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
}
