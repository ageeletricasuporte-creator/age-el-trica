/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText,
  Search,
  CheckCircle,
  TrendingUp,
  X,
  Plus,
  Minus,
  MessageSquare,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Truck,
  Cpu,
  Award,
  Check,
  Leaf,
  Video,
  Wrench,
  Instagram,
  BatteryCharging,
  Calendar,
  Layers,
  Lightbulb,
  Flame,
  Smartphone,
  Key,
  Facebook,
  Share2,
  Star,
  Send,
  Bot,
  User,
  Loader
} from 'lucide-react';
import { Servico, ConfiguracaoEmpresa, Cliente } from '../types';
import { AgeEletricaDB } from '../dataSeed';
import { generateAppointmentPDF, generateTechnicalReportPDF } from '../lib/pdfGenerator';
import defaultBannerImg from '../assets/images/electrician_hero_1780581241012.png';

interface PublicSiteProps {
  onNavigateToAdmin: () => void;
  onNavigateToAppTecnico: () => void;
  onNavigateToRequest: () => void;
  publicTab: 'home' | 'servicos' | 'sobre' | 'contato';
  setPublicTab: (tab: 'home' | 'servicos' | 'sobre' | 'contato') => void;
}

export function PublicSite({
  onNavigateToAdmin,
  onNavigateToAppTecnico,
  onNavigateToRequest,
  publicTab,
  setPublicTab
}: PublicSiteProps) {
  const [services, setServices] = React.useState<Servico[]>([]);
  const [config, setConfig] = React.useState<ConfiguracaoEmpresa>(() => AgeEletricaDB.getConfig());

  // Real-time replicated collections for responsive customer application
  const [allClients, setAllClients] = useState<Cliente[]>(() => AgeEletricaDB.getClients());
  const [allBudgets, setAllBudgets] = useState<any[]>(() => AgeEletricaDB.getBudgets());
  const [allAppointments, setAllAppointments] = useState<any[]>(() => AgeEletricaDB.getAppointments());
  const [allReceipts, setAllReceipts] = useState<any[]>(() => AgeEletricaDB.getReceipts());
  const [allSolicitations, setAllSolicitations] = useState<any[]>(() => AgeEletricaDB.getSolicitations());

  // Customer authentication status
  const [loggedClient, setLoggedClient] = useState<Cliente | null>(null);
  const loggedClientRef = React.useRef<Cliente | null>(null);

  const updateLoggedClient = (client: Cliente | null) => {
    loggedClientRef.current = client;
    setLoggedClient(client);
  };

  // Mouse Glow Position Tracking Overlay Ref for high-performance dynamic tech backdrop (avoids React re-renders)
  const glowOverlayRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Fetch initial dataset
    setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
    setConfig(AgeEletricaDB.getConfig());

    // Sync database updates dynamically
    const unsubscribe = AgeEletricaDB.subscribe(() => {
      setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
      setConfig(AgeEletricaDB.getConfig());

      const clientsList = AgeEletricaDB.getClients();
      setAllClients(clientsList);
      setAllBudgets(AgeEletricaDB.getBudgets());
      setAllAppointments(AgeEletricaDB.getAppointments());
      setAllReceipts(AgeEletricaDB.getReceipts());
      setAllSolicitations(AgeEletricaDB.getSolicitations());

      if (loggedClientRef.current) {
        const found = clientsList.find(c => c.id === loggedClientRef.current?.id);
        if (found) {
          setLoggedClient(found);
        }
      }
    });

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let handleMouseMove: ((e: MouseEvent) => void) | null = null;

    if (!isMobile) {
      handleMouseMove = (e: MouseEvent) => {
        if (glowOverlayRef.current) {
          glowOverlayRef.current.style.background = `radial-gradient(550px circle at ${e.clientX}px ${e.clientY}px, rgba(242,183,5,0.06), transparent 80%)`;
        }
      };
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      unsubscribe();
      if (handleMouseMove) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Servico | null>(null);

  // Active form tab for contact area
  const [activeFormTab, setActiveFormTab] = useState<'orcamento' | 'agendamento'>('agendamento');

  // Contact form submission states
  const [contactForm, setContactForm] = useState({
    nome: '',
    whatsapp: '',
    endereco: '',
    bairro: '',
    cidade: '',
    tipoServico: '',
    descricaoProblema: '',
    melhorHorario: 'Qualquer Horário'
  });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [submittedNum, setSubmittedNum] = useState('');

  // Pristine Service Scheduling Form States
  const [scheduleForm, setScheduleForm] = useState({
    nome: '',
    whatsapp: '',
    email: '',
    bairro: '',
    endereco: '',
    tipoServico: '',
    dataDesejada: '',
    horarioDesejado: 'Qualquer Horário',
    observacoes: '',
    urgencia: 'Média',
    categoria: 'Instalações'
  });
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [scheduleSubmittedNum, setScheduleSubmittedNum] = useState('');
  const [lastSubmittedSchedule, setLastSubmittedSchedule] = useState<any | null>(null);

  // AI Classification and Qualification states
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationSuccess, setClassificationSuccess] = useState(false);

  // AI Chatbot states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; date: Date; isGreen?: boolean; isWhatsApp?: boolean }>>([
    {
      sender: 'bot',
      text: 'Olá! Sou o Assistente Inteligente da AGE Elétrica. ⚡\nComo posso ajudar você hoje com seus serviços elétricos, automação residencial ou agendamento de orçamento?',
      date: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatTyping, setIsChatTyping] = useState(false);

  // Interactive App-Cliente States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Registration profile form
  const [regForm, setRegForm] = useState({
    nomeCompleto: '',
    cpfCnpj: '',
    telefone: '',
    whatsapp: '',
    email: '',
    enderecoCompleto: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    tipoCliente: 'Residencial' as 'Residencial' | 'Comercial' | 'Industrial' | 'Condomínio',
    observacoes: ''
  });

  // Raising a service request / scheduling from within the App
  const [newReqForm, setNewReqForm] = useState({
    categoria: 'Outros',
    descricao: '',
    melhorHorario: 'Qualquer Horário'
  });
  const [newReqSuccess, setNewReqSuccess] = useState(false);

  // Active sub-navigation inside client dashboard panels
  const [currentClientTab, setCurrentClientTab] = useState<'dados' | 'solicitacoes' | 'orcamentos' | 'agendamentos' | 'recibos'>('solicitacoes');

  // Selected receipt for official printable view
  const [selectedReceiptForModal, setSelectedReceiptForModal] = useState<any | null>(null);

  // Success notifications inside Client Area
  const [clientActionSuccess, setClientActionSuccess] = useState('');

  // Categories processing and sanitization
  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.categoria));
    return ['Todos', ...Array.from(cats)];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesSearch = s.nomeServico.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.observacoesTecnicas.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || s.categoria === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.nome || !contactForm.whatsapp) {
      alert('Por favor, preencha o Nome e o WhatsApp!');
      return;
    }

    // Add public request into Firestore with auto sync
    const solicitation = AgeEletricaDB.addSolicitacao({
      nome: contactForm.nome,
      whatsapp: contactForm.whatsapp,
      endereco: contactForm.endereco || 'Não informado',
      bairro: contactForm.bairro || 'Não informado',
      cidade: contactForm.cidade || 'Não informado',
      tipoServico: contactForm.tipoServico || 'Serviço Elétrico Geral',
      descricaoProblema: contactForm.descricaoProblema || 'Solicitou orçamento pelo site',
      foto: '',
      melhorHorario: contactForm.melhorHorario
    });

    setSubmittedNum(solicitation.id.replace('sol-', ''));
    setContactSuccess(true);

    // Reset fields
    setContactForm({
      nome: '',
      whatsapp: '',
      endereco: '',
      bairro: '',
      cidade: '',
      tipoServico: '',
      descricaoProblema: '',
      melhorHorario: 'Qualquer Horário'
    });
  };

  const openWhatsAppDirect = (nome: string, servico: string) => {
    const textMsg = `Olá AGE Elétrica! Gostaria de solicitar um orçamento para o serviço de ${servico}. Meu nome é ${nome}.`;
    const encoded = encodeURIComponent(textMsg);
    window.open(`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  const getWhatsAppSubmissionLink = (id: string, name: string, service: string) => {
    const textMsg = `Olá, equipe AGE Elétrica! Enviei minha solicitação de orçamento pelo site. (Protocolo: AGE-SOL-${id}).\nNome: ${name}\nServiço: ${service}`;
    return `https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(textMsg)}`;
  };

  // Pristine Handler: Submit Appointment Booking & Securely Deliver Email Reports
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.nome || !scheduleForm.whatsapp) {
      alert('Por favor, preencha pelo menos o Nome Completo e o WhatsApp!');
      return;
    }

    // 1. Log a solicitation row into the Firestore-bound class manager
    const summaryNotes = `AGENDAMENTO DE SERVIÇO:
- Bairro: ${scheduleForm.bairro}
- Endereço / Ref: ${scheduleForm.endereco}
- Urgência Determinada por IA: ${scheduleForm.urgencia}
- Categoria Geral: ${scheduleForm.categoria}
- Observações: ${scheduleForm.observacoes || 'Nenhuma'}
- Data Solicitada: ${scheduleForm.dataDesejada}
- Horário: ${scheduleForm.horarioDesejado}`;

    const solicitation = AgeEletricaDB.addSolicitacao({
      nome: scheduleForm.nome,
      whatsapp: scheduleForm.whatsapp,
      endereco: scheduleForm.endereco || 'Não informado',
      bairro: scheduleForm.bairro || 'Não informado',
      cidade: 'Natal',
      tipoServico: scheduleForm.tipoServico || 'Serviço Elétrico Geral',
      descricaoProblema: summaryNotes,
      foto: '',
      melhorHorario: scheduleForm.horarioDesejado
    });

    const protocolId = solicitation.id.replace('sol-', '');
    setScheduleSubmittedNum(protocolId);
    setLastSubmittedSchedule({
      nome: scheduleForm.nome,
      whatsapp: scheduleForm.whatsapp,
      email: scheduleForm.email,
      bairro: scheduleForm.bairro,
      endereco: scheduleForm.endereco,
      tipoServico: scheduleForm.tipoServico || 'Serviço Elétrico Geral',
      dataDesejada: scheduleForm.dataDesejada,
      horarioDesejado: scheduleForm.horarioDesejado,
      observacoes: scheduleForm.observacoes,
      urgencia: scheduleForm.urgencia,
      categoria: scheduleForm.categoria,
      protocolId: protocolId
    });
    setScheduleSuccess(true);

    // 2. Dispatch secure server-to-server HTML email dispatch report
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: scheduleForm.nome,
          whatsapp: scheduleForm.whatsapp,
          email: scheduleForm.email || 'Não informado',
          bairro: scheduleForm.bairro || 'Não informado',
          endereco: scheduleForm.endereco || 'Não informado',
          tipoServico: scheduleForm.tipoServico || 'Serviço Elétrico Geral',
          dataDesejada: scheduleForm.dataDesejada || 'Não fornecida',
          horarioDesejado: scheduleForm.horarioDesejado,
          observacoes: `Urência: ${scheduleForm.urgencia} | Categoria: ${scheduleForm.categoria}\n\nObservações Adicionais: ${scheduleForm.observacoes || 'Nenhuma'}`
        })
      });
    } catch (err) {
      console.error('Falha de rede para disparar e-mail:', err);
    }

    // 3. Clear schedule state cleanly
    setScheduleForm({
      nome: '',
      whatsapp: '',
      email: '',
      bairro: '',
      endereco: '',
      tipoServico: '',
      dataDesejada: '',
      horarioDesejado: 'Qualquer Horário',
      observacoes: '',
      urgencia: 'Média',
      categoria: 'Instalações'
    });
    setClassificationSuccess(false);
  };

  // Pristine Handler: AI Auto-Classification & Qualification
  const handleAIClassification = async () => {
    const textToClassify = scheduleForm.observacoes || contactForm.descricaoProblema;
    if (!textToClassify || !textToClassify.trim()) {
      alert('Por favor, descreva em poucas palavras o problema elétrico no campo de observações para a inteligência analisar.');
      return;
    }

    setIsClassifying(true);
    setClassificationSuccess(false);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: textToClassify,
          availableServices: services.map(s => ({ nomeServico: s.nomeServico, categoria: s.categoria }))
        })
      });

      if (!response.ok) {
        throw new Error('Falha técnica no serviço de classificação de IA');
      }

      const parsed = await response.json();
      if (parsed && !parsed.error) {
        // Apply structured parameters to the scheduling form
        setScheduleForm(prev => ({
          ...prev,
          tipoServico: parsed.tipoServico || prev.tipoServico,
          urgencia: parsed.urgencia || prev.urgencia,
          categoria: parsed.categoria || prev.categoria
        }));

        // Mirror service type to contact form to streamline both screens
        setContactForm(prev => ({
          ...prev,
          tipoServico: parsed.tipoServico || prev.tipoServico
        }));

        setClassificationSuccess(true);
      }
    } catch (err) {
      console.error('Erro na classificação automática:', err);
      alert('No momento o analisador inteligente de demanda está instável. Você pode preencher o tipo de serviço manualmente no formulário ou entrar em contato pelo WhatsApp!');
    } finally {
      setIsClassifying(false);
    }
  };

  // Pristine Handler: Chatbot Interactivity & Answers Dispatch
  const handleSendChatMessage = async (textToSend?: string) => {
    const msgText = textToSend || chatInput;
    if (!msgText || !msgText.trim()) return;

    // Append user message
    const userMsg = { sender: 'user' as const, text: msgText, date: new Date() };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);

    if (!textToSend) {
      setChatInput('');
    }

    setIsChatTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            sender: m.sender,
            text: m.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erro na conexão com assistente virtual');
      }

      const data = await response.json();
      const botReply = data.text || 'Desculpe, não consegui obter resposta da minha central de IA no momento. Por favor tente novamente.';

      // Determine colors based on keywords
      const replyLower = botReply.toLowerCase();
      const isGreen = replyLower.includes('carregador') || 
                      replyLower.includes('veicular') || 
                      replyLower.includes('solar') || 
                      replyLower.includes('energia limpa') || 
                      replyLower.includes('wallbox') || 
                      replyLower.includes('fotovoltaica');
      const isWhatsApp = replyLower.includes('whatsapp') || 
                         replyLower.includes('contato') || 
                         replyLower.includes('chamar');

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          date: new Date(),
          isGreen,
          isWhatsApp
        }
      ]);
    } catch (err) {
      console.error('Erro na IA do Chat:', err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'No momento nosso suporte inteligente está passando por uma instabilidade. Você pode continuar pelo botão do WhatsApp ou fazer seu agendamento diretamente pelo site.',
          date: new Date(),
          isWhatsApp: true
        }
      ]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const getWhatsAppBookingLink = (id: string, name: string, service: string) => {
    const textMsg = `Olá equipe AGE! Fiz meu agendamento pelo site. (Código: AGE-SCH-${id}).\nNome: ${name}\nServiço Solicitado: ${service}`;
    return `https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(textMsg)}`;
  };

  // Testimonials custom technical array based in Natal/RN regions
  const testimonials = [
    {
      author: "Dra. Clarice Vasconcelos",
      location: "Petrópolis, Natal",
      role: "Moradora de Apartamento",
      text: "Excelente projeto na reforma do quadro elétrico do nosso apartamento. Laudo de conformidade técnica emitido de forma impecável. Profissionais altamente capacitados, limpos e atenciosos.",
      category: "Residencial / Ap",
      rating: 5
    },
    {
      author: "Juliano Fontes",
      location: "Ponta Negra, Natal",
      role: "Proprietário de Veículo Elétrico",
      text: "Instalação técnica impecável do meu carregador BYD Wallbox de alta capacidade para minha vaga de garagem. Homologação rápida, cabeamento dimensionado com perfeição e acabamento cirúrgico.",
      category: "Wallbox",
      rating: 5
    },
    {
      author: "Marcos Aurelio Macedo",
      location: "Lagoa Nova, Natal",
      role: "Residência Unifamiliar",
      text: "Estávamos parados com curto frequente na rede do ar condicionado e tomadas. A equipe chegou rápido, realizou testes digitais com aparelhos calibrados, isolou a falha e sanou tudo no mesmo dia.",
      category: "Manutenção & Ar",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col selection:bg-[#f2b705] selection:text-black relative overflow-hidden tech-grid pb-12">
      
      {/* 1. Global Interactive Mouse Tracker Overlay */}
      <div 
        ref={glowOverlayRef}
        className="pointer-events-none fixed inset-0 z-30 transition duration-300 opacity-25 md:opacity-45"
        style={{
          background: 'radial-gradient(550px circle at 50% 50%, rgba(242,183,5,0.04), transparent 80%)'
        }}
      />

      {/* 2. Top Minimal Technological Utility Strip */}
      <div className="bg-neutral-950/95 border-b border-white/[0.05] py-2 px-4 text-[10px] uppercase tracking-[0.11em] text-zinc-400 transition-colors z-50 no-print flex flex-col gap-2.5">
        
        {/* Row 1: Social & Review Links */}
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-3.5 border-b border-white/[0.03] pb-2.5">
          {/* Social Icons & Google Share */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider mr-1">Nossas Redes:</span>
            
            {/* Instagram */}
            <a
              href="https://www.instagram.com/ageeletrica"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-pink-500/10 border border-white/[0.05] hover:border-pink-500/30 hover:text-pink-400 px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-wider text-zinc-400 cursor-pointer hover:-translate-y-0.5"
              title="Siga-nos no Instagram"
            >
              <Instagram className="w-3 h-3 text-current" /> Instagram
            </a>

            {/* Facebook */}
            <a
              href="https://www.facebook.com/ageeletrica"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-blue-500/10 border border-white/[0.05] hover:border-blue-500/30 hover:text-blue-400 px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-wider text-zinc-400 cursor-pointer hover:-translate-y-0.5"
              title="Curta nossa página no Facebook"
            >
              <Facebook className="w-3 h-3 text-current" /> Facebook
            </a>

            {/* TikTok - using Video icon with custom styling */}
            <a
              href="https://www.tiktok.com/@ageeletrica"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-cyan-500/10 border border-white/[0.05] hover:border-cyan-500/30 hover:text-cyan-400 px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-wider text-zinc-400 cursor-pointer hover:-translate-y-0.5"
              title="Siga-nos no TikTok"
            >
              <Video className="w-3 h-3 text-current" /> TikTok
            </a>

            {/* Google Share */}
            <a
              href="https://share.google/HMrZjcX19cXwmbKlY"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-[#f2b705]/10 border border-white/[0.05] hover:border-[#f2b705]/30 hover:text-[#f2b705] px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-wider text-zinc-400 cursor-pointer hover:-translate-y-0.5"
              title="Compartilhe no Google"
            >
              <Share2 className="w-3 h-3 text-current" /> Google Share
            </a>
          </div>

          {/* Special Highly Highlighted Google Review Button */}
          <div className="flex items-center justify-center">
            <a
              href="https://g.page/r/CZ7dgDYjCdoUEBM/review"
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2.5 bg-gradient-to-r from-[#f2b705]/10 to-[#f2b705]/20 hover:from-[#f2b705] hover:to-[#ffca03] border border-[#f2b705]/30 hover:border-[#f2b705] text-[#f2b705] hover:text-black px-4 py-2 rounded-full transition-all text-[9px] sm:text-[10px] font-display font-black tracking-widest uppercase cursor-pointer shadow-[0_0_15px_rgba(242,183,5,0.15)] hover:shadow-[0_0_25px_rgba(242,183,5,0.5)] transform hover:-translate-y-0.5 duration-300"
              title="Avaliar AGE Elétrica no Google"
            >
              <span className="flex items-center gap-0.5 animate-pulse">
                <Star className="w-3 h-3 fill-current text-amber-400 stroke-none" />
                <Star className="w-3 h-3 fill-current text-amber-400 stroke-none" />
                <Star className="w-3 h-3 fill-current text-amber-400 stroke-none" />
                <Star className="w-3 h-3 fill-current text-amber-400 stroke-none" />
                <Star className="w-3 h-3 fill-current text-amber-400 stroke-none" />
              </span>
              <span className="h-3.5 w-[1px] bg-white/20 group-hover:bg-black/20" />
              <span className="tracking-widest font-black">AVALIAR TRABALHO NO GOOGLE</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>

        {/* Row 2: Atendimento and utilities */}
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-5 font-mono text-[9px] md:text-[10px]">
            <span className="flex items-center gap-1.5 text-zinc-400 font-medium whitespace-nowrap">
              <Zap className="w-3 h-3 text-[#f2b705] animate-pulse" /> Atendimento 24h Natal/RN Metropolitano
            </span>
            <span className="hidden md:inline text-zinc-800">|</span>
            <span className="hidden md:inline text-zinc-500 font-normal">Normas NBR 5410, NR10, NR35</span>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3.5">
            <span className="text-[#f2b705] font-mono tracking-tight font-bold text-xs mr-1">{config.telefone}</span>
            
            <button
              onClick={onNavigateToAppTecnico}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-[#f2b705]/10 border border-white/[0.05] hover:border-[#f2b705]/30 hover:text-[#f2b705] px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-widest font-black uppercase cursor-pointer text-zinc-400 hover:-translate-y-0.5"
            >
              <Smartphone className="w-3 h-3 text-current" /> App Age Elétrica
            </button>

            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 bg-white/[0.02] hover:bg-[#f2b705]/10 border border-white/[0.05] hover:border-[#f2b705]/30 hover:text-[#f2b705] px-3 py-1.5 rounded-full transition-all text-[9.5px] font-mono tracking-widest font-black uppercase cursor-pointer text-zinc-400 hover:-translate-y-0.5"
            >
              <Key className="w-3 h-3 text-current" /> Terminal Age Elétrica
            </button>
          </div>
        </div>

      </div>

      {/* 3. High-End Capsule Floating Navigation Header */}
      <div className="sticky top-4 z-40 px-4 w-full flex flex-col items-center gap-2.5 no-print bg-transparent pointer-events-none">
        <header className="w-full max-w-5xl bg-neutral-950/75 backdrop-blur-xl border border-white/[0.06] rounded-full px-4 sm:px-6 py-2 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.95)] pointer-events-auto transition-all duration-300 hover:border-white/[0.12]">
          
          {/* Elegant Logo brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPublicTab('home')}>
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo AGE"
                className="max-h-8 sm:max-h-9 max-w-[130px] object-contain rounded-md border border-white/10"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMmI3MDUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAxMiAxNCAxMSAyMiAyMSAxMCAxMiAxMCAxMyAyIj48L3BvbHlnb24+PC9zdmc+';
                }}
              />
            ) : (
              <div className="p-1 bg-[#f2b705] text-black rounded-lg flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-black" strokeWidth={2.5} />
              </div>
            )}
            <div>
              <span className="font-black tracking-widest text-[9.5px] sm:text-[11px] text-white block uppercase">
                {config.nomeFantasia.split(' ')[0]} <span className="text-[#f2b705]">{config.nomeFantasia.split(' ').slice(1).join(' ')}</span>
              </span>
            </div>
          </div>

          {/* Minimal capsule tabs */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-[10px] font-bold uppercase tracking-widest font-display">
            <button
              onClick={() => setPublicTab('home')}
              className={`transition-all duration-300 px-3 py-1.5 rounded-full cursor-pointer ${publicTab === 'home' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Início
            </button>
            <button
              onClick={() => setPublicTab('servicos')}
              className={`transition-all duration-300 px-3 py-1.5 rounded-full cursor-pointer ${publicTab === 'servicos' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Serviços
            </button>
            <button
              onClick={() => setPublicTab('sobre')}
              className={`transition-all duration-300 px-3 py-1.5 rounded-full cursor-pointer ${publicTab === 'sobre' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Sobre
            </button>
            <button
              onClick={() => setPublicTab('contato')}
              className={`transition-all duration-300 px-3 py-1.5 rounded-full cursor-pointer ${publicTab === 'contato' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Contato
            </button>
          </nav>

          {/* Action action button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPublicTab('contato');
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }}
              className="px-3 sm:px-4.5 py-1.5 bg-gradient-to-r from-amber-500 to-[#f2b705] hover:from-amber-400 hover:to-[#ffca03] text-black text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest rounded-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(242,183,5,0.45)] hover:-translate-y-0.5 cursor-pointer font-display"
            >
              Orçamento Rápido
            </button>
          </div>
        </header>

        {/* Sleek Horizontal Tab Bar for Mobile viewports */}
        <nav className="md:hidden w-full max-w-[340px] bg-neutral-950/90 backdrop-blur-xl border border-white/[0.06] rounded-full p-1 flex justify-around items-center shadow-lg pointer-events-auto text-[8px] font-extrabold uppercase tracking-widest gap-0.5 font-display">
          <button
            onClick={() => setPublicTab('home')}
            className={`transition-all duration-200 py-1.5 px-2 rounded-full cursor-pointer ${publicTab === 'home' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Início
          </button>
          <button
            onClick={() => setPublicTab('servicos')}
            className={`transition-all duration-205 py-1.5 px-2 rounded-full cursor-pointer ${publicTab === 'servicos' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Serviços
          </button>
          <button
            onClick={() => setPublicTab('sobre')}
            className={`transition-all duration-205 py-1.5 px-2 rounded-full cursor-pointer ${publicTab === 'sobre' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Sobre
          </button>
          <button
            onClick={() => setPublicTab('contato')}
            className={`transition-all duration-200 py-1.5 px-2 rounded-full cursor-pointer ${publicTab === 'contato' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Contato
          </button>
        </nav>
      </div>

      {/* 4. Tab views controller */}
      <main className="grow relative">
        <AnimatePresence mode="wait">
          
          {/* TAB: HOME SCREEN */}
          {publicTab === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45 }}
              className="px-4 sm:px-6 md:px-12 py-8 space-y-32"
            >
              
              {/* 1. TOPO / HERO WITH AKSON PROFILE PIC */}
              <div className="max-w-6xl mx-auto pt-16 sm:pt-24 pb-12 relative">
                {/* Dramatic background light spots matching "Imersão do Mago" style */}
                <div className="absolute left-1/3 top-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-amber-500/[0.08] blur-[150px] pointer-events-none" />
                <div className="absolute right-0 top-1/3 w-[350px] h-[350px] rounded-full bg-cyan-500/[0.05] blur-[130px] pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 relative z-10">
                  {/* Hero text side */}
                  <div className="w-full lg:w-1/2 text-center lg:text-left space-y-8 lg:pr-4">
                    {/* Exquisite gold badge */}
                    <div className="inline-flex items-center gap-2.5 bg-[#f2b705]/[0.02] border border-[#f2b705]/15 text-[#f2b705] px-4.5 py-2.5 rounded-full text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase font-semibold backdrop-blur-sm shadow-[0_5px_15px_rgba(242,183,5,0.03)] select-none">
                      <Sparkles className="w-3.5 h-3.5 text-[#f2b705] fill-[#f2b705]/15 animate-pulse" /> AGE ELÉTRICA • SERVIÇOS DE ALTO PADRÃO
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight text-white uppercase leading-[1.05] font-display text-balance">
                      Seu eletricista <br />
                      <span className="text-zinc-300 font-light block mt-1 normal-case font-sans text-2xl sm:text-3xl md:text-4xl tracking-normal">de total confiança,</span> 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f2b705] via-amber-400 to-[#ffca03] drop-shadow-[0_0_30px_rgba(242,183,5,0.20)] font-black">
                        rápido e seguro
                      </span>
                    </h1>

                    <p className="text-zinc-400 font-normal lg:font-light text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 text-balance">
                      Serviços de alto padrão para residências, condomínios e comércios. Instalações elétricas inteligentes, manutenção detalhada sob a norma <span className="text-[#f2b705] font-mono text-xs font-semibold bg-[#f2b705]/5 border border-[#f2b705]/10 px-1.5 py-0.5 rounded">NBR 5410</span>, recarga Wallbox, câmeras de segurança e automação.
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4.5 z-20">
                      <button
                        onClick={() => {
                          setPublicTab('contato');
                          setTimeout(() => {
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                          }, 150);
                        }}
                        className="group w-full sm:w-auto px-9 py-5 bg-gradient-to-r from-[#f2b705] to-amber-500 hover:from-[#ffca03] hover:to-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_10px_35px_rgba(242,183,5,0.4)] hover:-translate-y-1 active:translate-y-0 cursor-pointer font-display flex items-center justify-center gap-2.5"
                      >
                        Solicitar orçamento <ArrowRight className="w-4 h-4 text-black font-semibold transition-transform group-hover:translate-x-1" />
                      </button>

                      <button
                        onClick={() => {
                          const servicesHeadingEl = document.getElementById('services-section');
                          if (servicesHeadingEl) {
                            servicesHeadingEl.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            setPublicTab('servicos');
                          }
                        }}
                        className="w-full sm:w-auto px-9 py-5 bg-[#030303] border border-white/[0.12] hover:border-white/40 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:-translate-y-1 active:translate-y-0 cursor-pointer backdrop-blur-md flex items-center justify-center gap-2"
                      >
                        Conhecer serviços
                      </button>
                    </div>
                  </div>

                  {/* Hero image profile side (Cutout style with high-end glows) */}
                  <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center relative">
                    {/* Exquisite glowing backlights centered behind professional silhouette */}
                    <div className="absolute w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] rounded-full bg-amber-500/[0.12] blur-[120px] pointer-events-none -translate-y-6" />
                    <div className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full bg-[#f2b705]/[0.08] blur-[100px] pointer-events-none translate-x-12 translate-y-6" />
                    <div className="absolute w-[250px] h-[250px] rounded-full bg-cyan-500/[0.04] blur-[90px] pointer-events-none -translate-x-12" />

                    <div className="relative z-10 w-full max-w-[380px] sm:max-w-[420px] flex flex-col justify-end items-center">
                      {/* Image container styled for cutout transparency with bottom fade-to-black mask */}
                      <div className="relative w-full h-[360px] sm:h-[460px] overflow-hidden flex items-end justify-center select-none">
                        <motion.img
                          src={config.bannerHero || defaultBannerImg}
                          alt="Akson Pereira"
                          className="w-auto h-full max-h-full object-contain filter contrast-[1.03] brightness-[1.02] drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] relative z-10 select-none transition-transform duration-500 hover:scale-[1.025]"
                          referrerPolicy="no-referrer"
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Smooth bottom linear fade-to-black layer: merges chest/torso crop naturally into body background */}
                        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#030303] via-[#030303]/75 to-transparent z-20 pointer-events-none" />
                        
                        {/* Side masks for seamless integration */}
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#030303]/10 to-transparent z-20 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#030303]/10 to-transparent z-20 pointer-events-none" />
                      </div>

                      {/* Live active tag situated elegantly floating to the side */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#030303]/85 border border-white/[0.08] px-4.5 py-2 rounded-full flex items-center gap-2 shadow-[0_15px_35px_rgba(0,0,0,0.9)] backdrop-blur-md">
                        <span className="w-2 h-2 bg-[#f2b705] rounded-full animate-ping" />
                        <span className="text-[9px] font-mono tracking-widest text-[#f2b705] font-extrabold uppercase whitespace-nowrap">AKSON PEREIRA • ONLINE</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SEÇÃO DE CHAMADA */}
              <div className="max-w-6xl mx-auto px-2">
                <div className="relative overflow-hidden rounded-[2rem] border border-[#f2b705]/20 bg-gradient-to-r from-neutral-950 via-[#0d0d0c] to-neutral-950 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_45px_rgba(0,0,0,0.8)] backdrop-blur-md">
                  {/* Subtle ambient light point inside call card */}
                  <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-[#f2b705]/[0.03] blur-3xl pointer-events-none" />
                  
                  <div className="space-y-1.5 text-center md:text-left z-10">
                    <span className="text-[9px] font-mono tracking-widest text-[#f2b705] font-black uppercase block">🔍 ATENDIMENTO IMEDIATO</span>
                    <h3 className="text-white font-display text-xl sm:text-2xl font-bold tracking-tight text-balance">
                      Precisando de eletricista? Fale com a AGE Elétrica e resolva seu problema com segurança.
                    </h3>
                    <p className="text-zinc-550 text-xs sm:text-sm font-light text-zinc-400">
                      Evite riscos de curtos ou sobrecargas elétricas. Nossos serviços possuem garantia e emissão de laudo de conformidade técnica.
                    </p>
                  </div>
                  
                  <a 
                    href={`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá AGE Elétrica! Vi o site e gostaria de solicitar um atendimento técnico elétrico emergencial / orçamento.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full md:w-auto px-6.5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer z-10 shrink-0 border border-emerald-450/20 font-display"
                  >
                    <MessageSquare className="w-4 h-4 fill-white text-white" /> Chamar no WhatsApp
                  </a>
                </div>
              </div>

              {/* 3. SERVIÇOS (PREMIUM CARD COMPOSITION) */}
              <div id="services-section" className="max-w-6xl mx-auto space-y-12 scroll-mt-28">
                <div className="text-center space-y-2 max-w-xl mx-auto">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/20 px-3.5 py-1.5 rounded-full inline-block font-black">
                    ⚡ SOLUÇÕES EM ENERGIA E SEGURANÇA
                  </span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-display">
                    NOSSOS SERVIÇOS
                  </h2>
                  <p className="text-zinc-500 text-xs sm:text-sm font-light text-zinc-400 leading-relaxed text-balance">
                    Cards modernos e inteligentes com ativação dinâmica. Clique em qualquer card de serviço para navegar diretamente no catálogo técnico estruturado!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Instalações elétricas",
                      desc: "Redimensionamento completo de fiação, novos pontos de energia e projetos de infraestrutura sob a norma NBR 5410.",
                      icon: Zap,
                      categoryFilter: "Residencial",
                      id: "inst_eletricas"
                    },
                    {
                      title: "Manutenção residencial",
                      desc: "Localização de curto-circuito, correção de rede instável e reaperto técnico de conexões para prevenir aquecimento.",
                      icon: Wrench,
                      categoryFilter: "Manutenção",
                      id: "manut_res"
                    },
                    {
                      title: "Instalação de chuveiro",
                      desc: "Adequação de condutores de alta potência, troca de resistências e dimensionamento correto do disjuntor de segurança.",
                      icon: Flame,
                      categoryFilter: "Reparo",
                      id: "chuveiro"
                    },
                    {
                      title: "Automação residencial",
                      desc: "Instalação inteligente de interruptores de iluminação, motores de portão, dimmer LED e centralização com Alexa/Google.",
                      icon: Cpu,
                      categoryFilter: "Automação",
                      id: "automacao"
                    },
                    {
                      title: "Câmeras CFTV",
                      desc: "Planejamento e instalação de câmeras HD, bicos blindados, fontes centralizadas e monitoramento ao vivo via smartphone.",
                      icon: Video,
                      categoryFilter: "Segurança",
                      id: "cftv"
                    },
                    {
                      title: "Instalação de Wallbox",
                      desc: "Infraestrutura dedicada de alta capacidade para veículos elétricos (WEG, BYD, Porsche) com proteção DPS e aterramento.",
                      icon: BatteryCharging,
                      categoryFilter: "Recarga veicular",
                      id: "wallbox_inst"
                    },
                    {
                      title: "Quadros de distribuição",
                      desc: "Montagem, cabeamento, identificação e instalação de protetores de surto IDR contra choques e DPS contra apagões.",
                      icon: Layers,
                      categoryFilter: "Manutenção",
                      id: "quadros"
                    },
                    {
                      title: "Iluminação e tomadas",
                      desc: "Substituição pontual de lâmpadas antigas por painéis de LED, instalação técnica de tomadas novas de 10A e 20A nas paredes.",
                      icon: Lightbulb,
                      categoryFilter: "Residencial",
                      id: "ilum_tomadas"
                    }
                  ].map((srv, idx) => {
                    const IconComponent = srv.icon;
                    return (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedCategory(srv.categoryFilter);
                          setPublicTab('servicos');
                          setTimeout(() => {
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }, 100);
                        }}
                        className="group bg-zinc-950/40 border border-white/[0.04] hover:border-[#f2b705]/20 p-6 rounded-2xl transition-all duration-350 hover:-translate-y-1 hover:shadow-[0_12px_45px_rgba(242,183,5,0.08)] relative overflow-hidden cursor-pointer flex flex-col justify-between"
                      >
                        {/* Decorative inner glass gloss */}
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#f2b705]/[0.015] to-transparent rounded-bl-full pointer-events-none" />

                        <div className="space-y-4">
                          <div className="w-10 h-10 rounded-xl bg-[#f2b705]/[0.02] group-hover:bg-[#f2b705]/10 border border-white/[0.05] group-hover:border-[#f2b705]/20 flex items-center justify-center transition-all duration-300">
                            <IconComponent className="w-5 h-5 text-[#f2b705] group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(242,183,5,0.35)] transition-all" />
                          </div>
                          
                          <h3 className="text-white font-display font-bold text-sm tracking-tight uppercase group-hover:text-[#f2b705] transition-colors duration-300">
                            {srv.title}
                          </h3>

                          <p className="text-zinc-500 group-hover:text-zinc-400 text-xs sm:text-[11px] leading-relaxed transition-colors">
                            {srv.desc}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/[0.03] mt-5 flex justify-between items-center text-[9px] font-mono text-zinc-500 font-extrabold uppercase tracking-wide group-hover:text-[#f2b705] transition-colors duration-300">
                          <span>VER DETALHES</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. SOBRE MIM */}
              <div className="max-w-6xl mx-auto rounded-[2.5rem] overflow-hidden border border-white/[0.05] bg-zinc-950/20 p-3 shadow-2xl backdrop-blur-md relative">
                <div className="absolute right-12 top-12 w-64 h-64 rounded-full bg-amber-500/[0.02] blur-[100px] pointer-events-none" />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-6 sm:p-12">
                  
                  {/* Left cutout frame */}
                  <div className="lg:col-span-5 relative flex justify-center items-center">
                    <div className="absolute w-56 h-56 rounded-full bg-[#f2b705]/5 blur-[70px] pointer-events-none" />
                    
                    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#000]/65 p-2 w-full max-w-[320px] aspect-square shadow-xl shadow-black">
                      <img
                        src={config.fotoSobre || defaultBannerImg}
                        alt="Akson Pereira - Eletricista Responsável pela AGE Elétrica em Natal"
                        className="w-full h-full object-cover rounded-2xl select-none"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  {/* Right text block */}
                  <div className="lg:col-span-7 space-y-6">
                    <span className="text-[9px] font-mono tracking-widest text-[#f2b705] bg-[#f2b705]/5 border border-[#f2b705]/20 px-3 py-1.5 rounded-full inline-block uppercase font-bold text-center">
                      👤 O PROFISSIONAL RESPONSÁVEL
                    </span>

                    <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none font-display text-balance">
                      Me chamo Akson Pereira, <span className="text-[#f2b705]">eletricista certificado</span>
                    </h2>

                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                      Me chamo Akson Pereira, técnico eletricista desde 2021. Sou cristão, casado, pai e profissional comprometido em resolver problemas elétricos com segurança, responsabilidade e qualidade.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {[
                        { title: "Atendimento profissional", desc: "Suporte atencioso, limpo e devidamente uniformizado.", icon: Zap },
                        { title: "Segurança em primeiro lugar", desc: "Uso rigoroso de EPIs e cumprimento pleno das normas.", icon: Shield },
                        { title: "Orçamento facilitado", desc: "Precificação transparente, detalhada e sem taxas surpresa.", icon: FileText },
                        { title: "Agendamento online", desc: "Reserve data e horário preferencial diretamente.", icon: Calendar }
                      ].map((selo, i) => {
                        const SeloIcon = selo.icon;
                        return (
                          <div key={i} className="p-4 bg-zinc-950/40 border border-white/[0.03] hover:border-[#f2b705]/10 rounded-xl flex gap-3 transition duration-300">
                            <SeloIcon className="w-5 h-5 text-[#f2b705] shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-white text-xs uppercase tracking-wide block font-display">{selo.title}</span>
                              <span className="text-zinc-500 text-[11px] block mt-0.5 leading-relaxed">{selo.desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* 5. COMO FUNCIONA (CRONOGRAMA EM ETAPAS) */}
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#f2b705] font-black uppercase">📋 ETAPAS TRANSPARENTES</span>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white font-display">COMO FUNCIONA?</h2>
                  <p className="text-zinc-500 text-xs sm:text-sm font-light text-zinc-400">
                    Você pode solicitar seu orçamento e fazer seu agendamento de forma 100% online diretamente por aqui!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { num: "01", title: "Escolha o serviço", desc: "Navegue pelas soluções ou clique em um serviço que corresponda à sua demanda em seu lar ou empresa." },
                    { num: "02", title: "Solicite o orçamento", desc: "Fácil e rápido: preencha as informações básicas na ficha detalhando as necessidades do serviço." },
                    { num: "03", title: "Agende pelo site", desc: "Estipulamos em parceria o dia e a hora para a realização presencial do atendimento técnico do eletricista." },
                    { num: "04", title: "Receba o atendimento", desc: "Akson realiza o diagnóstico ou a intervenção com máxima precisão e emite seu respectivo laudo técnico." }
                  ].map((step, i) => (
                    <div key={i} className="bg-zinc-950/30 p-7 rounded-2xl border border-white/[0.04] relative hover:border-[#f2b705]/10 transition-colors duration-300 flex flex-col justify-between gap-6">
                      <div className="w-10 h-10 rounded-full bg-[#f2b705]/10 border border-[#f2b705]/20 text-[#f2b705] font-mono font-bold flex items-center justify-center text-xs shadow-inner shadow-[#f2b705]/5 select-none">
                        {step.num}
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-zinc-500 font-mono text-[9px] block uppercase">PASSO {step.num}</span>
                        <h4 className="text-white font-display font-extrabold text-sm uppercase tracking-wide block">{step.title}</h4>
                        <p className="text-zinc-500 text-xs sm:text-[11px] leading-relaxed block text-zinc-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. DESTAQUE PARA AGENDAMENTO */}
              <div className="max-w-6xl mx-auto bg-gradient-to-r from-neutral-950 via-[#141208] to-neutral-950 border border-[#f2b705]/15 p-10 md:p-16 rounded-[2.5rem] text-center relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#f2b705]/[0.03] blur-[100px] pointer-events-none" />
                
                <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                  <span className="text-[9px] font-mono tracking-widest text-[#f2b705] font-black uppercase">📅 EXCLUSIVIDADE ONLINE</span>
                  <h3 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight font-display leading-none text-balance">
                    Agende seu atendimento <br className="hidden sm:inline" />pelo site
                  </h3>
                  <p className="text-zinc-400 text-xs sm:text-sm font-light text-zinc-350 leading-relaxed text-balance">
                    Mais praticidade para você solicitar serviços, orçamentos e acompanhar seu atendimento com agilidade e prioridade absoluta.
                  </p>
                  
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        setPublicTab('contato');
                        setTimeout(() => {
                          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                        }, 150);
                      }}
                      className="w-full sm:w-auto px-10 py-5 bg-[#f2b705] hover:bg-[#ffca03] text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(242,183,5,0.4)] hover:-translate-y-1 cursor-pointer font-display"
                    >
                      AGENDAR ATENDIMENTO
                    </button>
                  </div>
                </div>
              </div>

              {/* 7. WALLBOX E AUTOMAÇÃO (GREEN ECO INTEGRATION CARD) */}
              <div className="max-w-6xl mx-auto rounded-[2.5rem] bg-gradient-to-br from-neutral-900/30 via-neutral-950/15 to-emerald-950/[0.04] border border-emerald-500/20 p-8 sm:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-emerald-500/[0.012] pointer-events-none">
                  <Leaf className="w-64 h-64 rotate-45" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
                  <div className="lg:col-span-8 space-y-5">
                    <span className="text-[9px] font-mono tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-400/20 px-3.5 py-1.5 rounded-full inline-block font-bold uppercase font-display">
                      🍃 MOBILIDADE ELÉTRICA E AUTOMATIZAÇÕES
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white font-display text-balance">
                      Instalação de Wallbox e automação residencial
                    </h3>
                    <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                      Modernize sua residência com soluções inteligentes, seguras e eficientes. A AGE Elétrica instala suas tomadas de recarga completas com total proteção de surtos DPS e aterramento NBR.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-1">
                      <div className="p-4 bg-zinc-950/60 border border-emerald-500/15 rounded-xl text-center min-w-[130px]">
                        <span className="text-emerald-400 font-extrabold text-lg block leading-none font-mono">SEGURO</span>
                        <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider mt-1 block">Proteção DPS</span>
                      </div>
                      <div className="p-4 bg-zinc-950/60 border border-emerald-500/15 rounded-xl text-center min-w-[130px]">
                        <span className="text-[#f2b705] font-extrabold text-lg block leading-none font-mono">ZIGBEE</span>
                        <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider mt-1 block">Interruptores Smart</span>
                      </div>
                      <div className="p-4 bg-zinc-950/60 border border-emerald-500/15 rounded-xl text-center min-w-[130px]">
                        <span className="text-[#f2b705] font-extrabold text-lg block leading-none font-mono">EMISSÃO</span>
                        <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider mt-1 block">Laudo de Carga</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col justify-center space-y-4 lg:items-end w-full">
                    <button
                      onClick={() => {
                        setSelectedCategory("Recarga veicular");
                        setPublicTab('servicos');
                        setTimeout(() => {
                          window.scrollTo({ top: 350, behavior: 'smooth' });
                        }, 100);
                      }}
                      className="w-full lg:w-auto px-7 py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all cursor-pointer border border-emerald-400/20 font-display text-center"
                    >
                      SOLICITAR WALLBOX
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block text-center lg:text-right w-full">Especificações qualificadas do RN</span>
                  </div>
                </div>
              </div>

              {/* 8. CONTATO (ACTION DASHBOARD ACTION TILES) */}
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#f2b705] font-black uppercase">🤝 SUPORTE E CONTATO</span>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white font-display">FALE CONOSCO</h2>
                  <p className="text-zinc-500 text-xs sm:text-sm font-light text-zinc-400 mb-2">
                    Escolha de forma livre o canal ideal para falar com a equipe da AGE Elétrica.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* WhatsApp emerald green row */}
                  <a
                    href={`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá AGE Elétrica! Gostaria de falar com o Akson Pereira sobre um serviço elétrico no site.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group bg-zinc-950/40 hover:bg-emerald-950/20 border border-white/[0.04] hover:border-emerald-500/20 p-8 rounded-2xl flex flex-col items-center justify-between text-center gap-6 shadow-md shadow-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/5 group-hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 flex items-center justify-center transition-all">
                      <MessageSquare className="w-6 h-6 text-emerald-400 fill-emerald-400/10" />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-xs uppercase tracking-wider block group-hover:text-emerald-400 transition-colors">WhatsApp</h4>
                      <p className="text-zinc-500 text-[11px] mt-1 block">Tire dúvidas de reposições e fale direto no WhatsApp.</p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase px-4 py-1.5 bg-emerald-500/10 rounded-full">SOLICITAR NO WHATS</span>
                  </a>

                  {/* Orçamento amarelo dourado button */}
                  <div
                    onClick={() => {
                      setPublicTab('contato');
                      setTimeout(() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }, 150);
                    }}
                    className="group bg-zinc-950/40 hover:bg-amber-950/20 border border-white/[0.04] hover:border-[#f2b705]/20 p-8 rounded-2xl flex flex-col items-center justify-between text-center gap-6 shadow-md shadow-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(242,183,5,0.15)] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#f2b705]/5 group-hover:bg-[#f2b705]/20 text-[#f2b705] border border-[#f2b705]/10 flex items-center justify-center transition-all">
                      <Zap className="w-6 h-6 text-[#f2b705]" />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-xs uppercase tracking-wider block group-hover:text-[#f2b705] transition-colors">Solicitar Orçamento</h4>
                      <p className="text-zinc-500 text-[11px] mt-1 block">Preencha os dados e orce a solução completa.</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#f2b705] font-extrabold uppercase px-4 py-1.5 bg-[#f2b705]/10 rounded-full">PEDIR DETALHES</span>
                  </div>

                  {/* Agendar pelo site white outline row */}
                  <div
                    onClick={() => {
                      setPublicTab('contato');
                      setTimeout(() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }, 150);
                    }}
                    className="group bg-zinc-950/40 hover:bg-white/5 border border-white/[0.04] hover:border-white/20 p-8 rounded-2xl flex flex-col items-center justify-between text-center gap-6 shadow-md shadow-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(255,255,255,0.08)] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/5 group-hover:bg-white/10 text-white border border-white/5 flex items-center justify-center transition-all">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-xs uppercase tracking-wider block group-hover:text-zinc-300 transition-colors">Agendar pelo site</h4>
                      <p className="text-zinc-500 text-[11px] mt-1 block">Realize o agendamento formal e garanta seu horário.</p>
                    </div>
                    <span className="text-[10px] font-mono text-white font-extrabold uppercase px-4 py-1.5 bg-white/10 rounded-full">AGENDAR VISITA</span>
                  </div>

                  {/* Instagram gradient tile */}
                  <a
                    href="https://www.instagram.com/ageeletrica"
                    target="_blank"
                    rel="noreferrer"
                    className="group bg-zinc-950/40 hover:bg-neutral-900 border border-white/[0.04] hover:border-pink-500/20 p-8 rounded-2xl flex flex-col items-center justify-between text-center gap-6 shadow-md shadow-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_35px_rgba(219,39,119,0.15)] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center scale-95 group-hover:scale-100 transition-all duration-300 shadow-md">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-display font-bold text-xs uppercase tracking-wider block group-hover:text-zinc-300 transition-colors">Instagram</h4>
                      <p className="text-zinc-500 text-[11px] mt-1 block">Conheça nossos feedbacks e publicações técnicas.</p>
                    </div>
                    <span className="text-[10px] font-mono text-pink-400 font-extrabold uppercase px-4 py-1.5 bg-pink-500/10 rounded-full">IR AO INSTAGRAM</span>
                  </a>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB: SERVICES SECTION */}
          {publicTab === 'servicos' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="px-4 md:px-8 py-12 max-w-6xl mx-auto space-y-10"
            >
              <div className="text-center sm:text-left space-y-2">
                <span className="text-[9.5px] font-mono tracking-[0.2em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/30 px-3 py-1 rounded-full inline-block max-w-full font-bold">
                  ⚡ CATÁLOGO COMERCIAL COMPLETO
                </span>
                <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white font-display">
                  SOLUÇÕES EM <span className="text-[#f2b705]">ENERGIA</span>
                </h2>
                <p className="text-zinc-500 max-w-2xl text-xs sm:text-sm leading-relaxed">
                  Consulte nossa gama completa de serviços e homologações. Cada item inclui conformidade estrita com normas vigentes e seguro contra curtos-circuitos.
                </p>
              </div>

              {/* Filters Search Bar container element */}
              <div className="bg-neutral-900/[0.25] border border-white/[0.05] backdrop-blur-md rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search input bar */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por serviço ou especificação..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 outline-none rounded-xl py-2.5 px-4 pl-10 pr-10 text-xs text-zinc-200 transition-all font-sans uppercase tracking-wider"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Categories filtering list of buttons */}
                <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-2.5 rounded-lg text-[9.5px] font-bold uppercase tracking-widest cursor-pointer transition-all duration-200 ${selectedCategory === cat ? 'bg-[#f2b705] text-black font-extrabold shadow-md' : 'bg-[#111] text-zinc-400 border border-white/[0.05] hover:bg-white/[0.04] hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rendering list database services */}
              {filteredServices.length === 0 ? (
                <div className="bg-neutral-900/[0.15] rounded-3xl border border-white/[0.05] p-12 text-center text-zinc-550 space-y-4">
                  <HelpCircle className="w-12 h-12 text-[#f2b705] mx-auto animate-bounce" />
                  <div>
                    <span className="text-white font-bold block text-sm uppercase">Nenhum serviço catalogado localizado</span>
                    <span className="text-xs text-zinc-500 mt-1 block">Altere o termo pesquisado ou selecione outra categoria nas abas superiores.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service, idx) => {
                    const isEV = service.categoria.toLowerCase().includes('veículo') || service.categoria.toLowerCase().includes('wallbox') || service.nomeServico.toLowerCase().includes('wallbox') || service.nomeServico.toLowerCase().includes('carregador');
                    return (
                      <div
                        key={service.id}
                        className={`group bg-neutral-900/[0.15] border ${isEV ? 'border-emerald-500/20 hover:border-emerald-400/40' : 'border-white/[0.04] hover:border-[#f2b705]/20'} p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className={`text-[8.5px] font-mono tracking-[0.2em] uppercase px-2.5 py-0.5 rounded font-black ${isEV ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-400/30' : 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/20'}`}>
                              {service.categoria}
                            </span>
                            <span className="text-zinc-600 font-mono text-[10px]">INDEX-{idx+1}</span>
                          </div>
                          <h3 className="text-base font-extrabold text-white uppercase tracking-tight mb-2 group-hover:text-[#f2b705] transition-colors">{service.nomeServico}</h3>
                          <p className="text-zinc-500 text-xs leading-relaxed mb-6 line-clamp-3">{service.descricao}</p>
                        </div>

                        <div className="pt-4 border-t border-white/[0.03] flex justify-between items-center text-xs">
                          <div>
                            <span className="text-zinc-600 text-[8px] font-mono block uppercase">TEMPO MÉDIO</span>
                            <span className="text-white font-mono font-bold flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-[#f2b705]" /> {service.tempoMedio}
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedServiceForModal(service)}
                            className={`px-4 py-2 border text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${isEV ? 'bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 border-emerald-400/30 hover:border-emerald-400' : 'bg-white/[0.01] hover:bg-[#f2b705]/10 text-white hover:text-[#f2b705] border-white/10 hover:border-[#f2b705]'}`}
                          >
                            Orçamento
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ABOUT US SECTION */}
          {publicTab === 'sobre' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="px-4 md:px-8 py-12 max-w-5xl mx-auto space-y-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-[9.5px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-[#f2b705] bg-[#f2b705]/5 border border-[#f2b705]/20 px-3.5 py-1.5 rounded-full inline-block max-w-full uppercase font-bold text-center sm:text-left">
                    🛡️ CONSTITUIÇÃO DA ORGANIZAÇÃO
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none font-display">
                    Quem Somos Nós
                  </h2>
                  <p className="text-zinc-400 text-base leading-relaxed font-light">
                    A AGE Elétrica é consolidada por sua alta capacitação técnica. Unimos o rigor das normas técnicas e da eletricidade recomendada com a agilidade produtiva de atendimento a Natal/RN e bacias metropolitanas.
                  </p>
                  <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed">
                    Nossos eletricistas e técnicos parceiros são altamente capacitados, qualificados e certificados, ostentando credenciamento e treinamentos obrigatórios federais das normas regulamentadoras de risco NR10 e de trabalho em alturas NR35. Isto assegura que qualquer modificação estrutural de rede não traga futuros dores de cabeça regulatórios, físicos ou perdas securitárias.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-neutral-900/[0.15] border border-white/[0.04] p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#f2b705]/[0.02] rounded-full blur-xl" />
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f2b705] mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#f2b705]" /> DIRETRIZES FUNDAMENTAIS
                  </h3>
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <Zap className="text-[#f2b705] shrink-0 w-5 h-5 mt-0.5" />
                      <div>
                        <span className="font-bold text-white text-xs uppercase tracking-wider block">Plantão Emergencial</span>
                        <span className="text-zinc-500 text-xs mt-0.5 block leading-relaxed">Equipe de retaguarda imediata para solução de quedas de fase ao vivo.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="text-[#f2b705] shrink-0 w-5 h-5 mt-0.5" />
                      <div>
                        <span className="font-bold text-white text-xs uppercase tracking-wider block">Normas Unificadas</span>
                        <span className="text-zinc-500 text-xs mt-0.5 block leading-relaxed">Projetos rigorosamente modelados sob preceitos da NBR 5410 com laudo.</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Cpu className="text-emerald-400 shrink-0 w-5 h-5 mt-0.5" />
                      <div>
                        <span className="font-bold text-white text-xs uppercase tracking-wider block">Inovação e Mobilidade</span>
                        <span className="text-zinc-500 text-xs mt-0.5 block leading-relaxed">Dimensionamentos corretos de redes para super-wallbox com total segurança e proteção residencial.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Vision Values Grid segment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
                <div className="bg-neutral-900/[0.15] p-6.5 rounded-2xl border border-white/[0.04] space-y-2">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-widest text-xs">A Missão</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Instalar segurança e precisão. Minimizar riscos inerentes de acidentes elétricos nas redes de nossos queridos clientes com agilidade técnica exemplar.
                  </p>
                </div>
                <div className="bg-neutral-900/[0.15] p-6.5 rounded-2xl border border-white/[0.04] space-y-2">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-widest text-xs">A Visão</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Consolidar a AGE como o ecossistema referenciado no Rio Grande do Norte para carregamento sustentável e redes blindadas residenciais inteligentes.
                  </p>
                </div>
                <div className="bg-neutral-900/[0.15] p-6.5 rounded-2xl border border-white/[0.04] space-y-2">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-widest text-xs">Valores</h4>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Agilidade estrita, segurança corporativa inegociável, transparência em orçamentos, integridade de conduta e excelente tratamento técnico ao cliente.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: CONTACT & SOLICITATION FORM SECTION */}
          {publicTab === 'contato' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="px-4 md:px-8 py-12 max-w-6xl mx-auto space-y-12"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Channels side */}
                <div className="lg:col-span-5 flex flex-col space-y-6">
                  <div className="space-y-2">
                    <span className="text-[9.5px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-[#f2b705] bg-[#f2b705]/5 border border-[#f2b705]/20 px-3 py-1.5 rounded-full inline-block max-w-full uppercase font-bold text-center sm:text-left">
                      📍 CANAIS DIRETOS DE ENTRADA
                    </span>
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white font-display">
                      Estamos Online
                    </h2>
                    <p className="text-zinc-450 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                      Entre em contato com nossa central técnica de atendimento para agendar vistorias, tirar dúvidas ou acionar suporte de emergência.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-neutral-900/[0.15] p-4 rounded-xl border border-white/[0.04] transition hover:border-[#f2b705]/10">
                      <div className="p-2 bg-[#f2b705]/10 text-[#f2b705] rounded-lg">
                        <Phone className="w-5 h-5 text-[#f2b705]" />
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[8.5px] block font-mono uppercase tracking-wider">TELEFONE CENTRAL</span>
                        <span className="text-white font-mono text-sm font-bold">{config.telefone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-900/[0.15] p-4 rounded-xl border border-white/[0.04] transition hover:border-emerald-450/10">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-emerald-450" />
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[8.5px] block font-mono uppercase tracking-wider">WHATSAPP PRIORITÁRIO</span>
                        <span className="text-white font-mono text-sm font-bold">{config.whatsapp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-900/[0.15] p-4 rounded-xl border border-white/[0.04] transition hover:border-zinc-500/10">
                      <div className="p-2 bg-zinc-800/20 text-zinc-400 rounded-lg">
                        <Mail className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[8.5px] block font-mono uppercase tracking-wider">SUPORTE E ORÇAMENTOS</span>
                        <span className="text-white font-mono text-sm font-bold">{config.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-900/[0.15] p-4 rounded-xl border border-white/[0.04] transition hover:border-zinc-500/10">
                      <div className="p-2 bg-zinc-800/20 text-zinc-400 rounded-lg">
                        <MapPin className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <span className="text-zinc-500 text-[8.5px] block font-mono uppercase tracking-wider">SEDE DA OPERAÇÃO</span>
                        <span className="text-white text-xs font-bold leading-normal">{config.endereco} - {config.cidade}/{config.estado || 'RN'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#12110b] to-neutral-950 p-5 rounded-2xl border border-[#f2b705]/15 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black text-[#f2b705] tracking-widest uppercase font-mono">SUPORTE OPERACIONAL RN</span>
                    </div>
                    <span className="text-zinc-500 text-xs block leading-relaxed">
                      Atuamos prioritariamente na Grande Natal, abrangendo Ponta Negra, Lagoa Nova, Tirol, Candelária, Capim Macio, Parnamirim e demais bacias limítrofes do RN.
                    </span>
                  </div>
                </div>

                {/* Form layout */}
                <div className="lg:col-span-7 bg-neutral-900/[0.15] border border-white/[0.04] p-8 rounded-3xl relative shadow-2xl space-y-6">
                  {/* Selector Header inside Form */}
                  <div className="grid grid-cols-2 p-1.5 bg-black/45 rounded-xl border border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('agendamento')}
                      className={`py-2.5 px-3 text-[10px] tracking-widest uppercase font-mono font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${activeFormTab === 'agendamento' ? 'bg-[#f2b705] text-black shadow-md font-bold' : 'text-zinc-450 hover:text-white'}`}
                    >
                      <Calendar className="w-3.5 h-3.5" /> Agendar Visita (IA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFormTab('orcamento')}
                      className={`py-2.5 px-3 text-[10px] tracking-widest uppercase font-mono font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${activeFormTab === 'orcamento' ? 'bg-[#f2b705] text-black shadow-md' : 'text-zinc-450 hover:text-white'}`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Pedir Orçamento
                    </button>
                  </div>

                  {activeFormTab === 'agendamento' ? (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-[#f2b705] animate-pulse" /> Agendamento de Serviços com IA
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">Insira suas informações de contato e visita. Descreva livremente o problema elétrico no campo observações e nossa IA preencherá automaticamente as qualificações abaixo.</p>
                      </div>

                      {scheduleSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black/40 border border-[#f2b705]/20 p-8 rounded-2xl text-center flex flex-col items-center space-y-5"
                        >
                          <CheckCircle className="w-14 h-14 text-emerald-400 animate-bounce" />
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-white uppercase tracking-wider block">AGENDAMENTO ENVIADO COM SUCESSO!</h4>
                            <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                              A AGE Elétrica recebeu sua solicitação e em breve entrará em contato pelo WhatsApp informado. O código do protocolo é <span className="text-[#f2b705] font-bold font-mono">AGE-SCH-{scheduleSubmittedNum}</span>.
                            </p>
                          </div>

                          <div className="flex flex-col gap-3 w-full pt-2">
                            <a
                              href={getWhatsAppBookingLink(scheduleSubmittedNum, 'Cliente', 'Agendamento pela AGE Elétrica')}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(16,185,129,0.2)] border border-emerald-400/20"
                            >
                              <MessageSquare className="w-4 h-4 text-white fill-white" /> Validar no WhatsApp
                            </a>

                            {lastSubmittedSchedule && (
                              <button
                                onClick={() => generateAppointmentPDF(lastSubmittedSchedule, config)}
                                className="w-full bg-[#f2b705] hover:bg-amber-500 text-black font-extrabold py-3 px-5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(242,183,5,0.15)] border border-amber-600/30 font-sans uppercase tracking-wider"
                              >
                                <span className="text-sm">📄</span> Baixar PDF do Agendamento
                              </button>
                            )}

                            <button
                              onClick={() => setScheduleSuccess(false)}
                              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold py-3 px-5 rounded-xl transition text-xs cursor-pointer border border-white/[0.05]"
                            >
                              Novo Agendamento
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleScheduleSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">Nome Completo *</label>
                              <input
                                type="text"
                                required
                                value={scheduleForm.nome}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, nome: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">WhatsApp (Central de Contato) *</label>
                              <input
                                type="text"
                                required
                                placeholder="DDD + Número (Ex: 84999998888)"
                                value={scheduleForm.whatsapp}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, whatsapp: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2 space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Endereço de Realização com Ponto de Referência *</label>
                              <input
                                type="text"
                                required
                                placeholder="Rua, número, complemento e pontos de referência"
                                value={scheduleForm.endereco}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, endereco: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Bairro em Natal/RN *</label>
                              <input
                                type="text"
                                required
                                placeholder="Petrópolis, Ponta Negra, Lagoa Nova, etc."
                                value={scheduleForm.bairro}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, bairro: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Endereço de E-mail (Opcional)</label>
                              <input
                                type="email"
                                placeholder="Ex: seuemail@provedor.com"
                                value={scheduleForm.email}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white font-sans"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Especialidade / Serviço Técnico Solicitado *</label>
                              <select
                                required
                                value={scheduleForm.tipoServico}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, tipoServico: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                              >
                                <option value="">Selecione ou clique em Inteligência Artificial...</option>
                                {services.map(s => (
                                  <option key={s.id} value={s.nomeServico}>{s.nomeServico}</option>
                                ))}
                                <option value="Outro">Outro serviço técnico elétrico</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Data Desejada para o Atendimento *</label>
                              <input
                                type="date"
                                required
                                value={scheduleForm.dataDesejada}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, dataDesejada: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white font-mono"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Horário de Preferência *</label>
                              <select
                                required
                                value={scheduleForm.horarioDesejado}
                                onChange={(e) => setScheduleForm({ ...scheduleForm, horarioDesejado: e.target.value })}
                                className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                              >
                                <option value="Manhã (08:00 às 12:00)">Manhã (08:00 às 12:00)</option>
                                <option value="Tarde (13:00 às 18:00)">Tarde (13:00 às 18:00)</option>
                                <option value="Noite (Suporte Crítico)">Noite (Suporte Crítico)</option>
                                <option value="Qualquer Horário">Qualquer Horário (Indiferente)</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">Descreva seu Problema / Observações *</label>
                              <button
                                type="button"
                                onClick={handleAIClassification}
                                disabled={isClassifying}
                                className="px-3 py-1 bg-[#f2b705]/10 hover:bg-[#f2b705]/20 border border-[#f2b705]/30 text-[#f2b705] rounded-lg text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                              >
                                {isClassifying ? (
                                  <>
                                    <Loader className="w-3 h-3 animate-spin text-[#f2b705]" /> Classificando...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-[#f2b705]" /> Qualificar com IA
                                  </>
                                )}
                              </button>
                            </div>
                            <textarea
                              rows={3}
                              required
                              value={scheduleForm.observacoes}
                              onChange={(e) => setScheduleForm({ ...scheduleForm, observacoes: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3.5 text-xs text-white font-sans placeholder:text-zinc-700"
                              placeholder="Fale detalhadamente sobre o curto-circuito, tomadas paradas, troca de fiação ou instalação de ar condicionado para qualificarmos seu ticket..."
                            />
                          </div>

                          {classificationSuccess && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-[#f2b705]/10 border border-[#f2b705]/20 rounded-xl text-[11px] text-[#f2b705] flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4 shrink-0 text-[#f2b705]" />
                              <span>
                                ✨ <strong>IA AGE Qualificou com Sucesso:</strong> Demanda classificada como <strong>{scheduleForm.categoria}</strong> com Urgência <strong>{scheduleForm.urgencia}</strong>. O tipo correspondente foi pré-selecionado no formulário acima.
                              </span>
                            </motion.div>
                          )}

                          <button
                            type="submit"
                            className="w-full py-4 bg-[#f2b705] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#ffca03] transition-all shadow-[0_5px_20px_rgba(242,183,5,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                          >
                            Finalizar Agendamento Técnico <Zap className="w-3.5 h-3.5 fill-black text-black" />
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-bold uppercase tracking-tight text-white animate-pulse">Solicitar Orçamento Online</h3>
                        <p className="text-zinc-500 text-xs mt-1">Nossa equipe técnica fará um diagnóstico preliminar do seu caso para envio de proposta eletrônica.</p>
                      </div>

                      {contactSuccess ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-black/40 border border-[#f2b705]/20 p-8 rounded-2xl text-center flex flex-col items-center space-y-5"
                        >
                          <CheckCircle className="w-14 h-14 text-emerald-400 animate-bounce" />
                          <div className="space-y-2">
                            <h4 className="text-base font-bold text-white uppercase tracking-wider block">SOLICITAÇÃO PROTOCOLADA NO CLOUD!</h4>
                            <p className="text-zinc-450 text-xs text-zinc-400 max-w-md leading-relaxed">
                              Sua manifestação foi registrada no módulo de solicitações pendentes sob o protocolo permanente <strong className="text-[#f2b705]">AGE-SOL-{submittedNum}</strong>. Vamos analisar imediatamente.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                            <a
                              href={getWhatsAppSubmissionLink(submittedNum, 'Cliente', 'Solicitação pelo Site')}
                              target="_blank"
                              rel="noreferrer"
                              className="grow bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(16,185,129,0.2)] border border-[#f2b705]/20"
                            >
                              <MessageSquare className="w-4 h-4 text-white fill-white" /> Notificar em WhatsApp
                            </a>
                            <button
                              onClick={() => setContactSuccess(false)}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold py-3 px-5 rounded-xl transition text-xs cursor-pointer border border-white/[0.05]"
                            >
                              Nova Solicitação
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Seu Nome *</label>
                          <input
                            type="text"
                            required
                            value={contactForm.nome}
                            onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">WhatsApp com Código de Área *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 84999998888"
                            value={contactForm.whatsapp}
                            onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2 space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Endereço de Realização (Rua, n°)</label>
                          <input
                            type="text"
                            value={contactForm.endereco}
                            onChange={(e) => setContactForm({ ...contactForm, endereco: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Bairro</label>
                          <input
                            type="text"
                            value={contactForm.bairro}
                            onChange={(e) => setContactForm({ ...contactForm, bairro: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Cidade</label>
                          <input
                            type="text"
                            value={contactForm.cidade}
                            onChange={(e) => setContactForm({ ...contactForm, cidade: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Especialidade ou Serviço Desejado</label>
                          <select
                            value={contactForm.tipoServico}
                            onChange={(e) => setContactForm({ ...contactForm, tipoServico: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                          >
                            <option value="">Selecione na lista...</option>
                            {services.map(s => (
                              <option key={s.id} value={s.nomeServico}>{s.nomeServico}</option>
                            ))}
                            <option value="Outro">Outro serviço técnico elétrico</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Melhor Horário para o Contato ou Visita</label>
                        <select
                          value={contactForm.melhorHorario}
                          onChange={(e) => setContactForm({ ...contactForm, melhorHorario: e.target.value })}
                          className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3 text-xs text-white uppercase font-sans tracking-wide"
                        >
                          <option value="Manhã (08:00 às 12:00)">Manhã (08:00 às 12:00)</option>
                          <option value="Tarde (13:00 às 18:00)">Tarde (13:00 às 18:00)</option>
                          <option value="Noite (Suporte Crítico)">Noite (Suporte Crítico)</option>
                          <option value="Qualquer Horário">Qualquer Horário (Indiferente)</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Detalhes do Problema Elétrico ou Demanda</label>
                        <textarea
                          rows={4}
                          value={contactForm.descricaoProblema}
                          onChange={(e) => setContactForm({ ...contactForm, descricaoProblema: e.target.value })}
                          className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/30 focus:outline-none rounded-lg py-2.5 px-3.5 text-xs text-white font-sans uppercase placeholder:text-zinc-700"
                          placeholder="Fale se há curtos, fiação cheirando a queimado, queda de fase ou necessidade de dimensionamento de carregadores automotivos..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-4 bg-[#f2b705] text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#ffca03] transition-all shadow-[0_5px_20px_rgba(242,183,5,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Enviar Solicitação à AGE Elétrica <Zap className="w-3.5 h-3.5 fill-black text-black" />
                      </button>
                    </form>
                  )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: INTERACTIVE CLIENT PORTAL APPLICATION */}
          {false && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-8"
            >
              {/* Golden Badge and Header */}
              <div className="text-center pt-8 space-y-3 relative">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-80 h-32 bg-[#f2b705]/[0.05] blur-[80px] pointer-events-none" />
                <div className="inline-flex items-center gap-2 bg-[#f2b705]/[0.03] border border-[#f2b705]/15 text-[#f2b705] px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase font-semibold">
                  <Smartphone className="w-4 h-4 text-[#f2b705] animate-bounce" /> APLICATIVO DO CLIENTE AGE ELÉTRICA
                </div>
                <h2 className="text-4xl md:text-5xl font-extrabold uppercase text-white tracking-tight leading-none font-display">
                  Portal do Cliente
                </h2>
                <p className="text-zinc-400 text-sm max-w-lg mx-auto font-sans">
                  Acesse instantaneamente o acompanhamento de orçamentos, chamados, histórico financeiro e faturas de serviços solicitados.
                </p>
              </div>

              {/* Toast Alerts inside Area */}
              {clientActionSuccess && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center flex items-center justify-center gap-2 max-w-xl mx-auto animate-pulse">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{clientActionSuccess}</span>
                  <button onClick={() => setClientActionSuccess('')} className="ml-auto text-emerald-400 hover:text-white font-bold px-1 select-none">×</button>
                </div>
              )}

              {/* CORE CONDITIONAL: SIGNED OUT vs SIGNED IN */}
              {!loggedClient ? (
                <div className="max-w-md mx-auto bg-neutral-950 border border-white/[0.07] rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-6 relative">
                  {/* Subtle decorative glow */}
                  <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-[#f2b705]/[0.03] blur-2xl" />

                  {/* Toggle Mode */}
                  <div className="grid grid-cols-2 p-1 bg-neutral-900 rounded-xl border border-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(false);
                        setLoginError('');
                      }}
                      className={`py-2 px-3 text-xs uppercase font-extrabold rounded-lg transition-all cursor-pointer ${!isRegistering ? 'bg-[#f2b705] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Acessar Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegistering(true);
                        setLoginError('');
                      }}
                      className={`py-2 px-3 text-xs uppercase font-extrabold rounded-lg transition-all cursor-pointer ${isRegistering ? 'bg-[#f2b705] text-black shadow-md' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Novo Cadastro
                    </button>
                  </div>

                  {loginError && (
                    <div className="p-3.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                      ⚠️ {loginError}
                    </div>
                  )}

                  {/* SUB-FORM A: LOGIN WITH PHONE */}
                  {!isRegistering ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setLoginError('');
                        
                        if (!loginPhone.trim()) {
                          setLoginError('Por favor, digite seu WhatsApp ou Celular cadastrado.');
                          return;
                        }

                        // Sanitize input phone to compare digits only
                        const cleanDigits = loginPhone.replace(/\D/g, '');
                        if (cleanDigits.length < 8) {
                          setLoginError('Digite um celular válido com DDD.');
                          return;
                        }

                        // Try to find client with matching phone
                        const found = allClients.find(c => {
                          const cliTel = (c.telefone || '').replace(/\D/g, '');
                          const cliWa = (c.whatsapp || '').replace(/\D/g, '');
                          return (cliTel.endsWith(cleanDigits) || cleanDigits.endsWith(cliTel)) ||
                                 (cliWa.endsWith(cleanDigits) || cleanDigits.endsWith(cliWa));
                        });

                        if (found) {
                          updateLoggedClient(found);
                          setClientActionSuccess(`Bem-vindo de volta! Área do cliente de ${found.nomeCompleto} acessada com sucesso.`);
                          setLoginPhone('');
                        } else {
                          setLoginError('Seu celular não foi localizado em nossa base! Marque a aba "Novo Cadastro" ao lado para ativar seu perfil em segundos ou utilize o WhatsApp de suporte.');
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Número do seu Telefone / WhatsApp</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">📱</span>
                          <input
                            type="text"
                            required
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-12 focus:outline-none rounded-xl pl-10 pr-4 text-sm text-white font-mono placeholder:text-zinc-700"
                            placeholder="Ex: (84) 99999-9999"
                          />
                        </div>
                        <span className="text-[9px] text-zinc-500 block leading-tight">Digitar com o DDD do seu estado correspondente (Ex: 84 ou 21).</span>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-amber-500 to-[#f2b705] hover:from-amber-400 hover:to-[#ffca03] text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_5px_15px_rgba(242,183,5,0.15)] hover:shadow-[0_8px_25px_rgba(242,183,5,0.3)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        Entrar no Meu Painel <Key className="w-4 h-4 fill-black text-black" />
                      </button>

                      <div className="text-center pt-2">
                        <span className="text-[10px] text-zinc-500 block">Ou nos chame direto no suporte elétrico:</span>
                        <a 
                          href={`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[#f2b705] font-mono text-[11px] font-bold mt-1 inline-block hover:underline"
                        >
                          💬 WhatsApp Central AGE
                        </a>
                      </div>
                    </form>
                  ) : (
                    /* SUB-FORM B: FAST REGISTRATION AT APP */
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setLoginError('');

                        if (!regForm.nomeCompleto || !regForm.telefone) {
                          setLoginError('Nome Completo e Telefone/WhatsApp são campos indispensáveis.');
                          return;
                        }

                        // Sanitize and save
                        try {
                          const created = AgeEletricaDB.addClient({
                            nomeCompleto: regForm.nomeCompleto,
                            cpfCnpj: regForm.cpfCnpj,
                            telefone: regForm.telefone,
                            whatsapp: regForm.whatsapp || regForm.telefone,
                            email: regForm.email || `${regForm.nomeCompleto.replace(/\s+/g, '').toLowerCase()}@ageeletrica.com.br`,
                            enderecoCompleto: regForm.enderecoCompleto,
                            numero: regForm.numero,
                            complemento: regForm.complemento,
                            bairro: regForm.bairro,
                            cep: regForm.cep,
                            cidade: 'Natal',
                            estado: 'RN',
                            tipoCliente: regForm.tipoCliente,
                            observacoes: regForm.observacoes || 'Cadastrado no App AGE Elétrica'
                          });

                          updateLoggedClient(created);
                          setClientActionSuccess(`Parabéns, ${created.nomeCompleto}! Seu login e perfil comercial foram ativados com todo sucesso.`);
                          
                          // Reset form keys
                          setRegForm({
                            nomeCompleto: '',
                            cpfCnpj: '',
                            telefone: '',
                            whatsapp: '',
                            email: '',
                            enderecoCompleto: '',
                            numero: '',
                            complemento: '',
                            bairro: '',
                            cep: '',
                            tipoCliente: 'Residencial',
                            observacoes: ''
                          });
                        } catch (err: any) {
                          setLoginError(err?.message || 'Erro ao efetivar novo cadastro de cliente.');
                        }
                      }}
                      className="space-y-4"
                    >
                      <div className="space-y-1 bg-amber-500/5 p-3 rounded-xl border border-[#f2b705]/15 mb-2">
                        <span className="text-[9px] font-mono font-bold text-[#f2b705] uppercase block">🔑 CRIAÇÃO DE PERFIL COMERCIAL</span>
                        <span className="text-zinc-400 text-[10px] block leading-relaxed">Emita orçamentos personalizados, salve endereços para atendimento e garanta serviços em seu nome.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">Seu Nome Completo *</label>
                        <input
                          type="text"
                          required
                          value={regForm.nomeCompleto}
                          onChange={(e) => setRegForm({ ...regForm, nomeCompleto: e.target.value })}
                          className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                          placeholder="Ex: Alexandre Pereira"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">WhatsApp / Celular *</label>
                          <input
                            type="text"
                            required
                            value={regForm.telefone}
                            onChange={(e) => setRegForm({ ...regForm, telefone: e.target.value, whatsapp: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            placeholder="Ex: (84) 99999-9999"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">CPF ou CNPJ</label>
                          <input
                            type="text"
                            value={regForm.cpfCnpj}
                            onChange={(e) => setRegForm({ ...regForm, cpfCnpj: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            placeholder="Ex: 000.000.000-00"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Endereço de Correspondência</label>
                        <input
                          type="text"
                          value={regForm.enderecoCompleto}
                          onChange={(e) => setRegForm({ ...regForm, enderecoCompleto: e.target.value })}
                          className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                          placeholder="Ex: Avenida Engenheiro Roberto Freire, 100"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Bairro</label>
                          <input
                            type="text"
                            value={regForm.bairro}
                            onChange={(e) => setRegForm({ ...regForm, bairro: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            placeholder="Ponta Negra"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Tipo do Imóvel</label>
                          <select
                            value={regForm.tipoCliente}
                            onChange={(e: any) => setRegForm({ ...regForm, tipoCliente: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3 text-xs text-white"
                          >
                            <option value="Residencial">Residencial</option>
                            <option value="Comercial">Comercial</option>
                            <option value="Condomínio">Condomínio</option>
                            <option value="Industrial">Industrial</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-11 bg-[#f2b705] hover:bg-[#ffca03] text-black font-black uppercase text-xs tracking-widest rounded-xl transition-all shadow-[0_5px_15px_rgba(242,183,5,0.15)] cursor-pointer text-center flex items-center justify-center gap-2 mt-4"
                      >
                        Salvar e Acessar App <CheckCircle className="w-4 h-4 text-black font-bold" />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* ACTIVE CLIENT PROFILE DASHBOARD */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left sidebar - Actions / Details Profile */}
                  <div className="lg:col-span-4 flex flex-col space-y-6">
                    
                    {/* Welcome card */}
                    <div className="bg-neutral-950 border border-white/[0.07] p-6 rounded-3xl space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-[#f2b705]/[0.02] blur-xl pointer-events-none" />
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-[#f2b705] text-black font-black flex items-center justify-center text-sm shadow-[0_4px_10px_rgba(242,183,5,0.2)] select-none">
                          {loggedClient.nomeCompleto.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="grow">
                          <span className="text-[10px] font-mono tracking-widest text-[#f2b705] font-black uppercase block">CONECTADO</span>
                          <span className="text-white font-bold leading-normal block text-base truncate">{loggedClient.nomeCompleto}</span>
                          <span className="text-zinc-550 font-mono text-[9px] uppercase tracking-wide text-zinc-500">ID: {loggedClient.id}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 gap-4 text-center">
                        <div className="bg-neutral-900/40 p-2.5 rounded-xl border border-white/[0.02]">
                          <span className="text-zinc-500 text-[8px] block uppercase font-mono tracking-wider">TIPO DE IMÓVEL</span>
                          <span className="text-[#f2b705] text-[11px] font-bold block mt-0.5">{loggedClient.tipoCliente}</span>
                        </div>
                        <div className="bg-neutral-900/40 p-2.5 rounded-xl border border-white/[0.02]">
                          <span className="text-zinc-500 text-[8px] block uppercase font-mono tracking-wider">CIDADE / ESTADO</span>
                          <span className="text-white text-[11px] font-bold block mt-0.5">{loggedClient.cidade || 'Natal'}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          updateLoggedClient(null);
                          setClientActionSuccess('Sessão do cliente finalizada com segurança.');
                        }}
                        className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-zinc-400 hover:text-white border border-white/[0.06] hover:border-red-500/20 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Sair do Aplicativo
                      </button>
                    </div>

                    {/* Operational Tabs Selector list */}
                    <div className="bg-neutral-950 border border-white/[0.05] p-2.5 rounded-2xl flex flex-col space-y-1">
                      <button
                        type="button"
                        onClick={() => setCurrentClientTab('solicitacoes')}
                        className={`w-full py-3 px-4 rounded-xl text-left text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-between cursor-pointer ${currentClientTab === 'solicitacoes' ? 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/35' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span className="flex items-center gap-2">🔹 Chamados e Solicitações</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-zinc-500">
                          {allSolicitations.filter(s => {
                            const clWa = (loggedClient.whatsapp || '').replace(/\D/g, '');
                            const solWa = (s.whatsapp || '').replace(/\D/g, '');
                            return clWa.endsWith(solWa) || solWa.endsWith(clWa);
                          }).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentClientTab('orcamentos')}
                        className={`w-full py-3 px-4 rounded-xl text-left text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-between cursor-pointer ${currentClientTab === 'orcamentos' ? 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/35' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span className="flex items-center gap-2">💰 Meus Orçamentos</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-zinc-500">
                          {allBudgets.filter(b => b.clienteId === loggedClient.id).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentClientTab('agendamentos')}
                        className={`w-full py-3 px-4 rounded-xl text-left text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-between cursor-pointer ${currentClientTab === 'agendamentos' ? 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/35' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span className="flex items-center gap-2">📅 Agenda e Cronograma</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-zinc-500">
                          {allAppointments.filter(ap => ap.clienteId === loggedClient.id).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentClientTab('recibos')}
                        className={`w-full py-3 px-4 rounded-xl text-left text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-between cursor-pointer ${currentClientTab === 'recibos' ? 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/35' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span className="flex items-center gap-2">🧾 Meus Recibos</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 text-zinc-500">
                          {allReceipts.filter(r => r.clienteId === loggedClient.id).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCurrentClientTab('dados')}
                        className={`w-full py-3 px-4 rounded-xl text-left text-xs uppercase font-extrabold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${currentClientTab === 'dados' ? 'bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/35' : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'}`}
                      >
                        <span>⚙️ Meus Dados Cadastrais</span>
                      </button>
                    </div>

                    {/* Action Card: Fast Solicitation Request form within logged panel */}
                    <div className="bg-neutral-950 border border-white/[0.06] p-5 rounded-2xl space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-mono font-bold text-[#f2b705] uppercase block">🚨 NOVO CHAMADO EXPRESS</span>
                        <span className="text-zinc-450 text-[10.5px] block leading-snug">Está com pressa? Solicite um novo orçamento ou agendamento para este endereço!</span>
                      </div>

                      {newReqSuccess ? (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-center text-emerald-400 space-y-2">
                          <span className="text-[11px] font-bold block">Chamado enviado!</span>
                          <button
                            type="button"
                            onClick={() => setNewReqSuccess(false)}
                            className="bg-neutral-900 hover:bg-[#111] border border-white/[0.05] text-zinc-300 text-[9px] py-1 px-3 rounded uppercase font-bold cursor-pointer"
                          >
                            Pedir Outro
                          </button>
                        </div>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!newReqForm.descricao.trim()) {
                              alert('Por favor, informe detalhes da sua necessidade.');
                              return;
                            }

                            // Auto seed with actual customer details
                            AgeEletricaDB.addSolicitacao({
                              nome: loggedClient.nomeCompleto,
                              whatsapp: loggedClient.whatsapp || loggedClient.telefone || '',
                              endereco: loggedClient.enderecoCompleto || '',
                              bairro: loggedClient.bairro || '',
                              cidade: loggedClient.cidade || 'Natal',
                              tipoServico: newReqForm.categoria,
                              descricaoProblema: newReqForm.descricao,
                              foto: '',
                              melhorHorario: newReqForm.melhorHorario
                            });

                            setNewReqForm({ categoria: 'Outros', descricao: '', melhorHorario: 'Qualquer Horário' });
                            setNewReqSuccess(true);
                            setClientActionSuccess('Seu novo chamado técnico foi processado e adicionado à fila administrativa com sucesso.');
                          }}
                          className="space-y-3"
                        >
                          <div className="space-y-1">
                            <label className="text-[8.5px] uppercase font-bold text-zinc-500 block">Natureza do Serviço</label>
                            <select
                              value={newReqForm.categoria}
                              onChange={(e) => setNewReqForm({ ...newReqForm, categoria: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] h-9.5 text-xs text-zinc-300 rounded-lg px-2 focus:outline-none focus:border-[#f2b705]/40"
                            >
                              <option value="Reparo Técnico">Reparo / Manutenção Corretiva</option>
                              <option value="Instalações Elétricas">Instalação Residencial Nova</option>
                              <option value="Segurança / CFTV">Câmeras CFTV ou Alarmes</option>
                              <option value="Recarga Wallbox">Instalação de Wallbox (Carro Elétrico)</option>
                              <option value="Automação Residencial">Automação Inteligente</option>
                              <option value="Padrão COSERN">Padrão Cosern ou Entrada de Luz</option>
                              <option value="Outros">Outras demandas elétricas</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[8.5px] uppercase font-bold text-zinc-500 block">Detalhes da Execução ou Sintomas</label>
                            <textarea
                              rows={3}
                              value={newReqForm.descricao}
                              onChange={(e) => setNewReqForm({ ...newReqForm, descricao: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] text-xs text-white rounded-lg p-2 placeholder:text-zinc-650 focus:outline-none focus:border-[#f2b705]/45"
                              placeholder="Fale o que está acontecendo ou que tipo de instalação deseja realizar de forma sucinta..."
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full h-10 bg-gradient-to-r from-[#f2b705] to-amber-500 hover:from-[#ffca03] hover:to-amber-400 text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Registrar Chamado
                          </button>
                        </form>
                      )}
                    </div>

                  </div>

                  {/* Right - Central Tab dynamic panel contents */}
                  <div className="lg:col-span-8 bg-neutral-950 border border-white/[0.07] p-6 rounded-3xl shadow-[0_15px_45px_rgba(0,0,0,0.85)] max-w-full min-h-[460px]">
                    
                    {/* SUB-TAB: SOLICITACOES */}
                    {currentClientTab === 'solicitacoes' && (
                      <div className="space-y-6">
                        <div className="space-y-1 border-b border-white/[0.04] pb-4">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">HISTÓRICO OPERACIONAL</span>
                          <h2 className="text-white text-lg font-bold uppercase">Meus Chamados e Solicitações de Serviço</h2>
                        </div>

                        {/* Query actual solicitations from the seed DB matching client number */}
                        {allSolicitations.filter(s => {
                          const clWa = (loggedClient.whatsapp || '').replace(/\D/g, '');
                          const solWa = (s.whatsapp || '').replace(/\D/g, '');
                          return clWa.endsWith(solWa) || solWa.endsWith(clWa);
                        }).length === 0 ? (
                          <div className="py-12 text-center text-zinc-500 text-xs">
                            Nenhum chamado aberto nos registros com as informações do seu número. Faça um pedido emergencial no menu ao lado!
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allSolicitations.filter(s => {
                              const clWa = (loggedClient.whatsapp || '').replace(/\D/g, '');
                              const solWa = (s.whatsapp || '').replace(/\D/g, '');
                              return clWa.endsWith(solWa) || solWa.endsWith(clWa);
                            }).map((s, i) => (
                              <div key={s.id || i} className="p-4 bg-neutral-900/[0.4] rounded-2xl border border-white/[0.04] space-y-3 transition hover:border-white/[0.1]">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Protocolo: {s.id}</span>
                                    <span className="text-white text-xs font-bold font-sans uppercase">{s.tipoServico}</span>
                                  </div>
                                  <span className={`px-2.5 py-1 text-[8.5px] font-mono uppercase font-bold rounded-full ${
                                    s.status === 'Novo' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    s.status === 'Em atendimento' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                                    s.status === 'Convertido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'bg-zinc-800 text-zinc-400 text-[8px]'
                                  }`}>
                                    {s.status}
                                  </span>
                                </div>
                                
                                <p className="text-zinc-400 text-xs text-balance font-mono">
                                  {s.descricaoProblema}
                                </p>
                                
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] font-mono text-zinc-500 border-t border-white/[0.02] pt-2">
                                  <span>Data: {s.dataSolicitacao}</span>
                                  <span className="text-zinc-500">Agendar: {s.melhorHorario}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB: ORCAMENTOS & INTERACTIVE COMMERCIAL APPROVALS */}
                    {currentClientTab === 'orcamentos' && (
                      <div className="space-y-6">
                        <div className="space-y-1 border-b border-white/[0.04] pb-4">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">PROPOSTAS FORMAIS</span>
                          <h2 className="text-white text-lg font-bold uppercase font-display">Orçamentos e Projetos de Execução</h2>
                        </div>

                        {allBudgets.filter(b => b.clienteId === loggedClient.id).length === 0 ? (
                          <div className="py-12 text-center text-zinc-500 text-xs">
                            Nenhum orçamento particular emitido para seu código de cliente ainda. Entre em contato para geramento de vistoria técnica presencial!
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allBudgets.filter(b => b.clienteId === loggedClient.id).map((b, i) => (
                              <div key={b.id || i} className="p-4.5 bg-neutral-900/[0.3] rounded-2xl border border-white/[0.04] space-y-4 transition hover:border-[#f2b705]/10">
                                <div className="flex flex-wrap items-center justify-between gap-2.5">
                                  <div>
                                    <span className="text-[9px] font-mono text-[#f2b705] block">{b.numeroOrcamento}</span>
                                    <span className="text-white text-sm font-semibold font-sans">{b.descricaoCompleta}</span>
                                  </div>
                                  <span className={`px-2.5 py-1 text-[8.5px] font-mono uppercase font-black rounded-full ${
                                    b.status === 'Enviado' ? 'bg-amber-500/10 text-[#f2b705] border border-[#f2b705]/30 animate-pulse' :
                                    b.status === 'Aprovado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                    b.status === 'Recusado' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                    'bg-neutral-800 text-zinc-400'
                                  }`}>
                                    {b.status === 'Enviado' ? 'Aguardando sua Aprovação' : b.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-neutral-950/60 rounded-xl border border-white/[0.02] text-center text-xs">
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block font-mono uppercase">MÃO DE OBRA</span>
                                    <span className="text-white font-mono font-medium block mt-0.5">R$ {b.valorMaoObra?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block font-mono uppercase">MATERIAIS</span>
                                    <span className="text-white font-mono font-medium block mt-0.5">R$ {b.valorMateriais?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#f2b705] text-[8px] block font-mono uppercase font-bold text-[#f2b705]">TOTAL LÍQUIDO</span>
                                    <span className="text-[#f2b705] font-mono font-black block mt-0.5 text-sm">R$ {b.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block font-mono uppercase">PARCELAS</span>
                                    <span className="text-white font-sans font-medium block mt-0.5">{b.pagamentoCondicoes}</span>
                                  </div>
                                </div>

                                {/* Dynamic Interactive Buttons for customer to approve/reject on live database */}
                                {b.status === 'Enviado' && (
                                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-white/[0.02]">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const budgets = AgeEletricaDB.getBudgets();
                                        const idx = budgets.findIndex(x => x.id === b.id);
                                        if (idx !== -1) {
                                          budgets[idx].status = 'Aprovado';
                                          budgets[idx].dataAtualizacao = new Date().toISOString();
                                          AgeEletricaDB.saveBudgets(budgets);
                                          setClientActionSuccess(`Proposta comercial ${b.numeroOrcamento} aprovada com extremo sucesso! Entraremos em contato para agendamento dos serviços.`);
                                        }
                                      }}
                                      className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                                    >
                                      👍 Confirmar e Aprovar Orçamento
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const proceed = confirm('Deseja recusar esta proposta comercial formal da AGE Elétrica?');
                                        if (proceed) {
                                          const budgets = AgeEletricaDB.getBudgets();
                                          const idx = budgets.findIndex(x => x.id === b.id);
                                          if (idx !== -1) {
                                            budgets[idx].status = 'Recusado';
                                            budgets[idx].dataAtualizacao = new Date().toISOString();
                                            AgeEletricaDB.saveBudgets(budgets);
                                            setClientActionSuccess(`Proposta comercial ${b.numeroOrcamento} foi recusada e informada à administração.`);
                                          }
                                        }
                                      }}
                                      className="w-full sm:w-auto px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-zinc-400 hover:text-white border border-white/[0.05] text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all cursor-pointer"
                                    >
                                      Recusar...
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB: AGENDAMENTOS / EVENTS */}
                    {currentClientTab === 'agendamentos' && (
                      <div className="space-y-6">
                        <div className="space-y-1 border-b border-white/[0.04] pb-4">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">AGENDA DE ATENDIDIMENTO</span>
                          <h2 className="text-white text-lg font-bold uppercase font-display">Cronograma de Instalações e Vistorias</h2>
                        </div>

                        {allAppointments.filter(ap => ap.clienteId === loggedClient.id).length === 0 ? (
                          <div className="py-12 text-center text-zinc-500 text-xs">
                            Nenhum cronograma de serviço reservado em sua agenda no momento. Entre em contato para marcar a primeira vistoria de conformidade técnica!
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allAppointments.filter(ap => ap.clienteId === loggedClient.id).map((ap, i) => (
                              <div key={ap.id || i} className="p-4 bg-neutral-900/[0.25] rounded-2xl border border-white/[0.05] space-y-3 transition hover:border-[#f2b705]/15">
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-0.5 bg-[#f2b705]/10 text-[#f2b705] border border-[#f2b705]/20 text-[8.5px] font-mono uppercase font-bold rounded">
                                    {ap.tipo === 'vistoria' ? 'Vistoria Prévia' : 'Execução de Obra'}
                                  </span>
                                  <span className="text-[8.5px] font-mono text-zinc-500">Agendamento ID: {ap.id}</span>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-white text-xs font-semibold block">{ap.descritorServico}</span>
                                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                                    Técnico Líder Responsável: <strong className="text-zinc-300 font-bold">{ap.tecnicoResponsavel || 'Equipe Técnica AGE Elétrica'}</strong>
                                  </p>
                                </div>

                                <div className="p-3 bg-neutral-950/60 rounded-xl border border-white/[0.02] flex items-center justify-between text-xs font-mono">
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block uppercase text-zinc-650">DATA PROGRAMADA</span>
                                    <span className="text-[#f2b705] font-bold">{ap.dataAgendamento || ap.dataAgendada}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block uppercase text-zinc-650">HORÁRIO</span>
                                    <span className="text-white font-bold">{ap.horarioPrevisto || ap.horario || 'A combinar'}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 text-[8px] block uppercase text-zinc-650">ATIVIDADE ESTADO</span>
                                    <span className="text-emerald-400 font-bold uppercase">{ap.statusAtendimento || ap.status || 'Agendado'}</span>
                                  </div>
                                </div>

                                <div className="pt-2 flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      generateAppointmentPDF({
                                        nome: loggedClient.nomeCompleto,
                                        whatsapp: loggedClient.whatsapp,
                                        email: loggedClient.email,
                                        bairro: loggedClient.bairro || 'Não informado',
                                        endereco: loggedClient.enderecoCompleto || 'Não informado',
                                        tipoServico: ap.descritorServico || ap.descricaoAtendimento || 'Serviço Técnico',
                                        dataDesejada: ap.dataAgendamento || ap.dataAgendada || '',
                                        horarioDesejado: ap.horarioPrevisto || ap.horario || 'A combinar',
                                        observacoes: ap.descricaoAtendimento || ap.descritorServico || 'Nenhuma',
                                        protocolId: ap.id.replace('atend-', '').toUpperCase(),
                                        urgencia: 'Média',
                                        categoria: 'Serviço'
                                      }, config);
                                    }}
                                    className="bg-zinc-850 hover:bg-zinc-800 text-white font-bold py-1.5 px-3 rounded-lg text-[10px] uppercase font-mono flex items-center gap-1.5 cursor-pointer border border-zinc-700 transition"
                                  >
                                    📄 Comprovante PDF
                                  </button>

                                  {((ap.statusAtendimento || ap.status) === 'Concluído') && (
                                    <button
                                      onClick={() => {
                                        generateTechnicalReportPDF({
                                          id: ap.id,
                                          clienteId: loggedClient.id,
                                          orcamentoId: ap.orcamentoId || '',
                                          tecnicoResponsavel: ap.tecnicoResponsavel || 'Técnico AGE Elétrica',
                                          dataAgendada: ap.dataAgendamento || ap.dataAgendada || '',
                                          horario: ap.horarioPrevisto || ap.horario || '',
                                          status: ap.statusAtendimento || ap.status || 'Concluído',
                                          descricaoAtendimento: ap.descritorServico || ap.descricaoAtendimento || '',
                                          observacoesTecnicas: ap.observacoesTecnicas || 'Serviço concluído com 100% de conformidade técnica pela equipe de Engenharia AGE Elétrica.',
                                          fotosAntes: ap.fotosAntes || [],
                                          fotosDepois: ap.fotosDepois || [],
                                          assinaturaCliente: ap.assinaturaCliente || 'Assinado Eletronicamente',
                                          dataFinalizacao: ap.dataFinalizacao || new Date().toISOString()
                                        }, loggedClient, config);
                                      }}
                                      className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-extrabold py-1.5 px-3 rounded-lg text-[10px] uppercase font-mono flex items-center gap-1.5 cursor-pointer border border-emerald-500/30 transition"
                                    >
                                      📜 Laudo Técnico PDF
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB: RECIBOS & PAYMENT INVOICES */}
                    {currentClientTab === 'recibos' && (
                      <div className="space-y-6">
                        <div className="space-y-1 border-b border-white/[0.04] pb-4">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">HISTÓRICO FINANCEIRO</span>
                          <h2 className="text-white text-lg font-bold uppercase font-display">Recibos Técnicos de Serviço e Quitação</h2>
                        </div>

                        {allReceipts.filter(r => r.clienteId === loggedClient.id).length === 0 ? (
                          <div className="py-12 text-center text-zinc-500 text-xs">
                            Nenhum recibo quitado ou ordem de pagamento registrada em sua ficha financeira ainda.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {allReceipts.filter(r => r.clienteId === loggedClient.id).map((r, i) => (
                              <div key={r.id || i} className="p-4 bg-neutral-900/[0.2] rounded-2xl border border-white/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-[#f2b705]/10">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-white text-xs font-mono font-bold">{r.numeroRecibo}</span>
                                    <span className="text-[8.5px] font-mono text-zinc-550 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black">PAGO / QUITADO</span>
                                  </div>
                                  <span className="text-zinc-400 text-xs font-sans block">{r.referenteServico}</span>
                                  <span className="text-[9.5px] font-mono text-zinc-500 block">Emitido em: {r.dataEmissao}</span>
                                </div>

                                <div className="flex items-center gap-3.5 shrink-0 self-end sm:self-auto">
                                  <div className="text-right">
                                    <span className="text-zinc-500 text-[8px] block font-mono uppercase">VALOR PAGO</span>
                                    <span className="text-emerald-400 font-mono font-bold text-sm">R$ {r.valorTotalServico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedReceiptForModal(r)}
                                    className="px-4 py-2 hover:bg-white/[0.04] text-[#f2b705] hover:text-white border border-[#f2b705]/20 hover:border-white/20 text-[9.5px] font-mono tracking-wider font-extrabold uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    📄 Imprimir Recibo
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-TAB: PROFILES UPDATE DADOS */}
                    {currentClientTab === 'dados' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const clients = AgeEletricaDB.getClients();
                          const idx = clients.findIndex(c => c.id === loggedClient.id);
                          
                          if (idx !== -1) {
                            const updated: Cliente = {
                              ...clients[idx],
                              nomeCompleto: loggedClient.nomeCompleto,
                              cpfCnpj: loggedClient.cpfCnpj,
                              telefone: loggedClient.telefone,
                              whatsapp: loggedClient.whatsapp,
                              email: loggedClient.email,
                              enderecoCompleto: loggedClient.enderecoCompleto,
                              numero: loggedClient.numero,
                              complemento: loggedClient.complemento,
                              bairro: loggedClient.bairro,
                              cep: loggedClient.cep
                            };

                            clients[idx] = updated;
                            AgeEletricaDB.saveClients(clients);
                            updateLoggedClient(updated);
                            setClientActionSuccess('Dados de cadastro atualizados no servidor central com absoluto êxito.');
                          }
                        }}
                        className="space-y-6"
                      >
                        <div className="space-y-1 border-b border-white/[0.04] pb-4">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">CADASTRO DE PROFILE</span>
                          <h2 className="text-white text-lg font-bold uppercase font-display">Meus Dados Cadastrais Digitais</h2>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Nome Completo do Titular</label>
                          <input
                            type="text"
                            required
                            value={loggedClient.nomeCompleto}
                            onChange={(e) => updateLoggedClient({ ...loggedClient, nomeCompleto: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-[#f2b705] block">Celular / WhatsApp Cadastrado</label>
                            <input
                              type="text"
                              required
                              value={loggedClient.telefone}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, telefone: e.target.value, whatsapp: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Identificação CPF ou CNPJ</label>
                            <input
                              type="text"
                              value={loggedClient.cpfCnpj}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, cpfCnpj: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">E-mail para Correspondência de Nota Fiscal</label>
                            <input
                              type="email"
                              value={loggedClient.email}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, email: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white lowercase"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-450 text-zinc-500 block">Imóvel de Correspondência Perfil</label>
                            <select
                              value={loggedClient.tipoCliente}
                              onChange={(e: any) => updateLoggedClient({ ...loggedClient, tipoCliente: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3 text-xs text-white"
                            >
                              <option value="Residencial">Residencial</option>
                              <option value="Comercial">Comercial</option>
                              <option value="Condomínio">Condomínio</option>
                              <option value="Industrial">Industrial</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Endereço de Entrega Serviços</label>
                          <input
                            type="text"
                            value={loggedClient.enderecoCompleto}
                            onChange={(e) => updateLoggedClient({ ...loggedClient, enderecoCompleto: e.target.value })}
                            className="w-full bg-[#111] border border-white/[0.05] focus:border-[#f2b705]/40 h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Número</label>
                            <input
                              type="text"
                              value={loggedClient.numero}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, numero: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Complemento</label>
                            <input
                              type="text"
                              value={loggedClient.complemento || ''}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, complemento: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Bairro</label>
                            <input
                              type="text"
                              value={loggedClient.bairro}
                              onChange={(e) => updateLoggedClient({ ...loggedClient, bairro: e.target.value })}
                              className="w-full bg-[#111] border border-white/[0.05] h-10 focus:outline-none rounded-lg px-3.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-6 py-3 bg-[#f2b705] hover:bg-[#ffca03] text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_5px_15px_rgba(242,183,5,0.15)] cursor-pointer"
                        >
                          Salvar Alterações de Ficha
                        </button>
                      </form>
                    )}

                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. Floating Widgets removed by user request to keep only compositional site controls */}

      {/* 6. Centered Institutional Premium Footer */}
      <footer className="bg-neutral-950 border-t border-white/[0.04] py-16 px-6 text-xs text-zinc-500 z-10 relative">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-8">
          
          <div className="flex flex-col items-center gap-3">
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo AGE Elétrica - Natal/RN"
                className="max-h-10 max-w-[130px] object-contain rounded border border-white/10 select-none"
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMmI3MDUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAxMiAxNCAxMiAyMiAyMSAxMCAxMiAxMCAxMyAyIj48L3BvbHlnb24+PC9zdmc+';
                }}
              />
            ) : (
              <div className="p-1.5 bg-[#f2b705] text-black rounded-lg">
                <Zap className="w-5 h-5 fill-black text-black" />
              </div>
            )}
            <div className="mt-2">
              <span className="font-extrabold text-white text-sm uppercase tracking-widest block">{config.nomeFantasia}</span>
              <span className="text-[10px] text-zinc-600 block mt-1">© 2026 {config.nomeEmpresa}. Todos os direitos reservados.</span>
            </div>
          </div>

          {/* Core brand phrase */}
          <p className="text-[#f2b705] font-display font-medium text-sm sm:text-base tracking-normal max-w-xl text-balance">
            “AGE Elétrica — Energia, segurança e confiança para sua casa ou empresa.”
          </p>

          <div className="flex flex-wrap justify-center gap-5 uppercase font-bold text-[9.5px] tracking-widest text-[#f2b705]/75">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('home')}>Início</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('servicos')}>Serviços</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('sobre')}>Sobre</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('contato')}>Contato</span>
          </div>

          <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-600 space-y-0.5">
            <span className="block">CNPJ: {config.cnpj} • CREA Autorizado RN</span>
            <span className="block text-zinc-700">Desenvolvimento com Alta Performance e Estabilidade</span>
          </div>

        </div>
      </footer>

      {/* 7. Modal: Service Specs Detailed Deep Dive */}
      <AnimatePresence>
        {selectedServiceForModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-950 border border-white/[0.07] rounded-3xl p-8 max-w-lg w-full relative shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
            >
              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="absolute right-5 top-5 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#f2b705]" />
                <span className="bg-[#f2b705]/10 border border-[#f2b705]/30 text-[#f2b705] text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 rounded font-bold">
                  {selectedServiceForModal.categoria}
                </span>
              </div>

              <h3 className="text-2xl font-extrabold uppercase tracking-tight text-white mb-3 leading-tight">{selectedServiceForModal.nomeServico}</h3>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed mb-6">{selectedServiceForModal.descricao}</p>

              <div className="space-y-4 bg-neutral-900/40 p-5 rounded-2xl border border-white/[0.04] mb-6">
                <div>
                  <span className="text-zinc-650 text-zinc-500 font-mono text-[8.5px] block uppercase tracking-wider">TEMPO ESTIMADO DE EXECUÇÃO</span>
                  <p className="text-[#f2b705] text-xs font-bold flex items-center gap-1.5 font-mono mt-1">
                    <Clock className="w-4 h-4 text-[#f2b705]" /> {selectedServiceForModal.tempoMedio}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-650 text-zinc-500 font-mono text-[8.5px] block uppercase tracking-wider">OBSERVAÇÕES E DIRETRIZES REGULAMENTARES</span>
                  <p className="text-[#f2b705] text-xs font-mono bg-[#f2b705]/5 p-3 rounded border border-[#f2b705]/10 mt-1 leading-relaxed uppercase">
                    🛠️ {selectedServiceForModal.observacoesTecnicas}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-650 text-zinc-500 font-mono text-[8.5px] block uppercase tracking-wider">BENEFÍCIOS E COBERTURAS INCLUSAS</span>
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                    ✅ Garantia integral de conformidade contra superaquecimento de circuito, isolação técnica completa anti-chamas, aferição por voltímetro/amperímetro digital calibrado e laudo impresso ou em PDF.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const name = prompt('Por favor, informe seu nome:') || 'Cliente Interessado';
                    openWhatsAppDirect(name, selectedServiceForModal.nomeServico);
                    setSelectedServiceForModal(null);
                  }}
                  className="grow bg-[#f2b705] hover:bg-[#ffca03] text-black font-black uppercase tracking-widest py-3 px-4 rounded-xl text-center text-xs transition-colors cursor-pointer shadow-[0_5px_15px_rgba(242,183,5,0.15)]"
                >
                  Pedir no WhatsApp
                </button>
                <button
                  onClick={() => {
                    setContactForm(prev => ({
                      ...prev,
                      tipoServico: selectedServiceForModal.nomeServico,
                      descricaoProblema: `Gostaria de solicitar orçamento detalhado para o serviço de ${selectedServiceForModal.nomeServico}.`
                    }));
                    setPublicTab('contato');
                    setSelectedServiceForModal(null);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Preencher Formulário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Pristine Floating AI Assistant Client Chat Widget */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-80 sm:w-96 h-[500px] bg-[#090909]/95 border border-white/[0.08] backdrop-blur-xl rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col mb-4"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-neutral-900 to-black border-b border-white/[0.04] flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-[#f2b705]/10 rounded-xl flex items-center justify-center border border-[#f2b705]/20">
                    <Sparkles className="w-4 h-4 text-[#f2b705] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-black uppercase tracking-wider">Suporte Inteligente (IA)</h4>
                    <span className="text-[9px] text-[#f2b705] font-mono block">AGE ELÉTRICA ONLINE</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 px-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                {chatMessages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'bot' && (
                      <div className="w-6 h-6 rounded-lg bg-zinc-900 text-[#f2b705] flex items-center justify-center shrink-0 border border-white/[0.04]">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="max-w-[80%] flex flex-col gap-1.5">
                      <div
                        className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap selection:bg-[#f2b705]/30 ${
                          m.sender === 'user'
                            ? 'bg-[#f2b705] text-black font-semibold rounded-tr-none'
                            : m.isGreen
                            ? 'bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-tl-none'
                            : 'bg-zinc-900/60 text-zinc-200 border border-white/[0.03] rounded-tl-none'
                        }`}
                      >
                        {m.text}

                        {m.isWhatsApp && (
                          <div className="mt-3 pt-2.5 border-t border-white/[0.05]">
                            <a
                              href={`https://wa.me/55${config.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-lg text-[10px] font-mono uppercase font-black tracking-wider transition-all"
                            >
                              <MessageSquare className="w-3.5 h-3.5 fill-current" /> Falar com Especialista
                            </a>
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-zinc-500 font-mono self-end">
                        {m.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatTyping && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-6 h-6 rounded-lg bg-zinc-900 text-[#f2b705] flex items-center justify-center shrink-0 border border-white/[0.04]">
                      <Bot className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                    <div className="bg-zinc-900/40 text-zinc-400 border border-white/[0.03] p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader className="w-3 h-3 text-[#f2b705] animate-spin" />
                      <span className="text-[10px] font-mono uppercase tracking-wider">Analisando infraestrutura...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Questions */}
              <div className="px-4 py-2 border-t border-white/[0.03] bg-zinc-950/50 flex flex-wrap gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('Como funciona a instalação de Wallbox / carregadores de veículo? 🚗⚡')}
                  className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] rounded-full text-[9px] text-[#f2b705] transition-colors uppercase tracking-tight cursor-pointer font-bold"
                >
                  🚗 Instalação de Wallbox
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('Instalação e manutenção de Chuveiro Elétrico e Disjuntores. ⚡🚿')}
                  className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] rounded-full text-[9px] text-zinc-300 transition-colors uppercase tracking-tight cursor-pointer"
                >
                  ⚡ Chuveiro e Disjuntores
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('Automação residencial com Sonoff e Alexa. Por onde iniciar? 🏠💡')}
                  className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] rounded-full text-[9px] text-[#f2b705] transition-colors uppercase tracking-tight cursor-pointer font-bold"
                >
                  🏠 Automação Sonoff
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChatMessage('Como agendo um orçamento ou visita técnica pelo site? 🗓️📋')}
                  className="py-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/[0.05] rounded-full text-[9px] text-zinc-300 transition-colors uppercase tracking-tight cursor-pointer"
                >
                  🗓️ Agendar no Site
                </button>
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-neutral-900/60 border-t border-white/[0.04] flex gap-2">
                <input
                  type="text"
                  placeholder="Pergunte sobre serviços ou agendamento..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendChatMessage();
                  }}
                  className="flex-1 bg-[#111] border border-white/[0.05] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-[#f2b705]/40 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendChatMessage()}
                  className="w-8 h-8 rounded-xl bg-[#f2b705] hover:bg-[#ffca03] text-black flex items-center justify-center shrink-0 cursor-pointer shadow-md transition-transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle floating launcher button */}
        <button
          type="button"
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`relative group h-14 w-14 rounded-full bg-neutral-950 border text-white flex items-center justify-center transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.65)] hover:-translate-y-0.5 cursor-pointer hover:shadow-[#f2b705]/10 ${
            isChatOpen ? 'border-[#f2b705]/40 rotate-90' : 'border-[#f2b705]/20'
          }`}
        >
          {isChatOpen ? <X className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-[#f2b705] animate-pulse" />}

          {/* Badge saying 'IA' */}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 bg-[#f2b705] text-black text-[7.5px] font-black uppercase font-mono px-1.5 py-0.5 rounded-full scale-95 border border-black shadow">
              IA
            </span>
          )}
        </button>
      </div>

    </div>
  );
}
