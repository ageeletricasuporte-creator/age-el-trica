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
  Truck
} from 'lucide-react';
import { Servico, ConfiguracaoEmpresa } from '../types';
import { AgeEletricaDB } from '../dataSeed';
import defaultBannerImg from '../assets/images/electrician_hero_1780581241012.png';

interface PublicSiteProps {
  onNavigateToAdmin: () => void;
  onNavigateToRequest: () => void;
  publicTab: 'home' | 'servicos' | 'sobre' | 'contato';
  setPublicTab: (tab: 'home' | 'servicos' | 'sobre' | 'contato') => void;
}

export function PublicSite({
  onNavigateToAdmin,
  onNavigateToRequest,
  publicTab,
  setPublicTab
}: PublicSiteProps) {
  const [services, setServices] = React.useState<Servico[]>([]);
  const [config, setConfig] = React.useState<ConfiguracaoEmpresa>(() => AgeEletricaDB.getConfig());

  React.useEffect(() => {
    // Initial fetch
    setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
    setConfig(AgeEletricaDB.getConfig());

    // Subscribe to database changes from Firestore sync
    const unsubscribe = AgeEletricaDB.subscribe(() => {
      setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
      setConfig(AgeEletricaDB.getConfig());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Servico | null>(null);

  // Form states
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

  // Categories
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

    // Save as public solicitation
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

    // Reset form
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

  return (
    <div className="min-h-screen bg-[#030303] text-[#ffffff] font-sans flex flex-col selection:bg-[#f2b705] selection:text-black relative overflow-hidden tech-grid">
      
      {/* Background High-Tech Ambient Glowing Points / Pontos de Luz */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-amber-500/[0.04] blur-[150px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[40vw] h-[40vw] rounded-full bg-amber-500/[0.05] blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-amber-400/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[5%] w-[40vw] h-[40vw] rounded-full bg-yellow-500/[0.03] blur-[150px] pointer-events-none animate-pulse duration-[10000ms]" />
      <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-amber-600/[0.04] blur-[160px] pointer-events-none animate-pulse duration-[12000ms]" />
      <div className="absolute top-[15%] left-[45%] w-[150px] h-[150px] rounded-full bg-amber-500/[0.08] blur-[60px] pointer-events-none animate-ping duration-[6000ms]" />

      {/* Upper Technical Banner */}
      <div className="bg-[#080808]/60 border-b border-white/5 py-2 px-4 text-[10px] uppercase tracking-[0.1em] text-white/40 no-print z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4 font-semibold">
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#f2b705] animate-pulse" /> Atendimento 24 Horas para Emergências</span>
            <span className="hidden md:inline text-white/10">|</span>
            <span className="hidden md:inline font-mono">{config.endereco} - {config.cidade}/{config.estado}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#f2b705] font-black tracking-tight">{config.telefone}</span>
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 hover:border-[#f2b705]/40 hover:bg-[#f2b705]/5 hover:text-[#f2b705] px-3 py-1 rounded-full transition text-[9px] font-mono tracking-widest cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5 text-[#f2b705]" /> ÁREA ADMINISTRATIVA
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header - Floating Glassmorphic Pill matching reference style */}
      <div className="sticky top-0 z-40 px-4 py-4 w-full flex justify-center no-print bg-transparent pointer-events-none">
        <header className="w-full max-w-7xl bg-neutral-950/40 backdrop-blur-xl border border-white/[0.06] rounded-full px-6 py-2 flex justify-between items-center shadow-2xl shadow-black/80 pointer-events-auto transition-all duration-300">
          {/* Logo Brand Custom */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setPublicTab('home')}>
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo"
                className="w-7 h-7 object-contain rounded-md border border-white/10"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMmI3MDUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAxMiAxNCAxMSAyMiAyMSAxMCAxMiAxMCAxMyAyIj48L3BvbHlnb24+PC9zdmc+';
                }}
              />
            ) : (
              <div className="p-1.5 bg-[#f2b705] text-black rounded-full flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 fill-black" strokeWidth={2.5} />
              </div>
            )}
            <div>
              <span className="font-extrabold tracking-tight text-xs text-white block uppercase">
                {config.nomeFantasia.split(' ')[0]} <span className="text-[#f2b705]">{config.nomeFantasia.split(' ').slice(1).join(' ')}</span>
              </span>
            </div>
          </div>

          {/* Nav links styled precisely as custom selected pill blocks in reference */}
          <nav className="hidden md:flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
            <button
              onClick={() => setPublicTab('home')}
              className={`transition-all duration-200 px-4 py-1.5 rounded-lg cursor-pointer ${publicTab === 'home' ? 'text-[#f2b705] bg-[#1a1405] border border-[#f2b705]/20 font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              Início
            </button>
            <button
              onClick={() => setPublicTab('servicos')}
              className={`transition-all duration-200 px-4 py-1.5 rounded-lg cursor-pointer ${publicTab === 'servicos' ? 'text-[#f2b705] bg-[#1a1405] border border-[#f2b705]/20 font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              Serviços
            </button>
            <button
              onClick={() => setPublicTab('sobre')}
              className={`transition-all duration-200 px-4 py-1.5 rounded-lg cursor-pointer ${publicTab === 'sobre' ? 'text-[#f2b705] bg-[#1a1405] border border-[#f2b705]/20 font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              Sobre
            </button>
            <button
              onClick={() => setPublicTab('contato')}
              className={`transition-all duration-200 px-4 py-1.5 rounded-lg cursor-pointer ${publicTab === 'contato' ? 'text-[#f2b705] bg-[#1a1405] border border-[#f2b705]/20 font-bold' : 'text-zinc-400 hover:text-white'}`}
            >
              Contato
            </button>
          </nav>

          {/* Action Call Button - Sleek Amber/Gold Border Outline */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRequest}
              className="px-5 py-2 border border-[#f2b705]/50 hover:border-[#f2b705] bg-transparent text-[#f2b705] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 hover:bg-[#f2b705]/5 cursor-pointer"
            >
              Solicitar Orçamento
            </button>
          </div>
        </header>
      </div>

      {/* Main Container Content */}
      <main className="grow">
        <AnimatePresence mode="wait">
          
          {/* TAB: HOME */}
          {publicTab === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-6"
            >
              {/* MAIN HERO: Exact Centered Minimalist Mockup design from reference screenshot */}
              <div className="max-w-6xl mx-auto pt-20 pb-16 px-4 flex flex-col justify-center items-center pointer-events-auto text-center relative">
                
                {/* Embedded Point of Light behind Hero Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-[#f2b705]/[0.08] blur-[100px] pointer-events-none" />

                {/* Sub-header Badge outline */}
                <div className="mb-6 flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-[#f2b705]/5 border border-[#f2b705]/20 text-[#f2b705] px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase font-bold backdrop-blur-sm">
                    <Zap className="w-3.5 h-3.5 text-[#f2b705]" /> Serviços Elétricos Profissionais
                  </div>
                </div>

                {/* Giant Heading with active glowing font shadow */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase select-none">
                  AGE <span className="text-[#f2b705] drop-shadow-[0_0_35px_rgba(242,183,5,0.7)] select-none transition-all duration-300">Elétrica</span>
                </h1>

                {/* Tagline Paragraph with highlighted keywords */}
                <p className="text-lg sm:text-2xl font-light text-zinc-300 max-w-3xl leading-relaxed mb-6">
                  Serviços elétricos profissionais com <span className="font-semibold text-white">segurança</span>, <span className="font-semibold text-white">agilidade</span> e <span className="font-semibold text-white">qualidade</span>.
                </p>

                {/* Categories inline list with dots */}
                <div className="flex flex-wrap justify-center items-center gap-2 text-zinc-500 font-mono text-[11px] uppercase tracking-widest mb-12">
                  <span>Residencial</span>
                  <span className="text-[#f2b705] font-bold">•</span>
                  <span>Comercial</span>
                  <span className="text-[#f2b705] font-bold">•</span>
                  <span>Industrial</span>
                  <span className="text-[#f2b705] font-bold">•</span>
                  <span>Predial</span>
                </div>

                {/* Center Row of Floating Minimalist Actions / Group of 3 Buttons aligned side-by-side */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto relative z-10">
                  <button
                    onClick={onNavigateToRequest}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-[#f2b705] hover:from-[#ffc107] hover:to-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-lg shadow-[0_4px_25px_rgba(242,183,5,0.35)] hover:shadow-[0_4px_35px_rgba(242,183,5,0.6)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Solicitar Orçamento <span className="text-sm font-medium">&gt;</span>
                  </button>

                  <button
                    onClick={() => openWhatsAppDirect('Visitante', 'Serviço Elétrico Geral')}
                    className="w-full sm:w-auto px-8 py-4 bg-transparent border border-zinc-800 hover:border-[#f2b705]/40 text-zinc-300 hover:text-[#f2b705] hover:bg-[#f2b705]/5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Falar no WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      const element = document.getElementById('services-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        setPublicTab('servicos');
                      }
                    }}
                    className="w-full sm:w-auto text-zinc-500 hover:text-white transition bg-transparent hover:underline hover:underline-offset-4 text-xs font-extrabold uppercase tracking-widest px-4 py-3 cursor-pointer"
                  >
                    Conhecer Serviços
                  </button>
                </div>

                {/* Elegant scroll indicator leading to a gold dot at the bottom center */}
                <div className="flex flex-col items-center justify-center mt-20">
                  <div className="w-[1px] h-12 bg-gradient-to-b from-[#f2b705]/50 to-transparent relative animate-bounce">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#f2b705] rounded-full shadow-[0_0_10px_#f2b705]" />
                  </div>
                </div>

              </div>

              {/* BRAND PRESENCE BANNER: High-Tech Presentation of the generated Professional Electrician visual */}
              <div id="services-section" className="max-w-7xl mx-auto mb-24 relative rounded-3xl overflow-hidden border border-white/[0.08] bg-zinc-950/20 backdrop-blur-md p-1 sm:p-2 shadow-2xl pointer-events-auto">
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full bg-amber-500/[0.06] blur-[80px] pointer-events-none animate-pulse duration-[7000ms]" />
                <div className="absolute bottom-[-25%] left-[5%] w-80 h-80 rounded-full bg-yellow-500/[0.04] blur-[90px] pointer-events-none" />
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-12 relative z-10">
                  {/* Left Column: Reference Image with glowing outlines and status nodes */}
                  <div className="lg:col-span-5 relative group flex justify-center items-center">
                    
                    {/* Glowing yellow point of light background */}
                    <div className="absolute w-72 h-72 rounded-full bg-[#f2b705]/15 blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700" />
                    
                    {/* Decorative corner brackets */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#f2b705]/40" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#f2b705]/40" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#f2b705]/40" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#f2b705]/40" />

                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-2">
                      <img
                        src={config.bannerHero || defaultBannerImg}
                        alt="Eletricista Certificado AGE Elétrica"
                        className="w-full max-h-[380px] object-cover rounded-xl transition-all duration-700 hover:scale-[1.02]"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Floating Team Active Status Tag */}
                      <div className="absolute bottom-4 left-4 bg-zinc-950/95 backdrop-blur-md border border-white/10 px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider text-green-400 block leading-tight">SUPORTE TÉCNICO ATIVO</span>
                          <span className="text-[9px] text-zinc-400 block">Akson Pereira & Engenharia</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Title Description in Minimal / Glassmorphic Tech presentation */}
                  <div className="lg:col-span-7 flex flex-col space-y-6">
                    <span className="text-[9.5px] font-mono tracking-[0.2em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/20 px-3.5 py-1 rounded-full w-max font-bold">
                      ⚡ REFERÊNCIA EM ENGENHARIA ELÉTRICA
                    </span>
                    
                    <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none">
                      NOSSO COMPROMISSO <br/>
                      <span className="text-[#f2b705] drop-shadow-[0_0_15px_rgba(242,183,5,0.2)]">É A SUA SEGURANÇA</span>
                    </h2>
                    
                    <p className="text-sm text-zinc-450 leading-relaxed max-w-xl">
                      A AGE Elétrica destaca-se pela alta competência operacional. Cada projeto, instalação de Wallbox ou manutenção predial segue rigorosamente os padrões de segurança das normas federais (NBR 5410, NR10 e NR35), garantindo alta performance de circuitos e proteção absoluta do seu imóvel.
                    </p>

                    {/* Integrated mini technical highlights inside banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white/[0.02] border border-white/[0.05] hover:border-[#f2b705]/10 p-4 rounded-xl flex items-start gap-3 transition duration-305">
                        <Shield className="w-5 h-5 text-[#f2b705] mt-1 shrink-0" />
                        <div>
                          <span className="font-extrabold text-white text-xs uppercase block">Normas de Engenharia</span>
                          <span className="text-xs text-zinc-500">Instalações dimensionadas de forma correta e sem riscos físicos.</span>
                        </div>
                      </div>
                      
                      <div className="bg-white/[0.02] border border-white/[0.05] hover:border-[#f2b705]/10 p-4 rounded-xl flex items-start gap-3 transition duration-305">
                        <Sparkles className="w-5 h-5 text-[#f2b705] mt-1 shrink-0" />
                        <div>
                          <span className="font-extrabold text-white text-xs uppercase block">Automação & Wallbox</span>
                          <span className="text-xs text-zinc-500">Credenciados para homologação rápida de pontos de carga de veículos.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <button
                        onClick={onNavigateToRequest}
                        className="px-6 py-3 bg-[#f2b705]/5 hover:bg-[#f2b705]/10 border border-[#f2b705]/30 hover:border-[#f2b705] text-[#f2b705] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300"
                      >
                        Agendar Atendimento Técnico
                      </button>
                      <button
                        onClick={() => setPublicTab('sobre')}
                        className="text-zinc-500 hover:text-white transition text-xs font-bold uppercase tracking-widest pl-2 cursor-pointer"
                      >
                        Saiba mais sobre nós →
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Quick Services Carousel-style grid */}
              <div className="max-w-7xl mx-auto mb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-white uppercase">Nossos Serviços Especializados</h2>
                    <p className="text-white/40 mt-1.5 text-xs sm:text-sm">Conformidade total, materiais garantidos e excelente acabamento</p>
                  </div>
                  <button
                    onClick={() => setPublicTab('servicos')}
                    className="text-[#f2b705] hover:text-[#ffc107] text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition underline decoration-[#f2b705]/30 underline-offset-4"
                  >
                    Ver catálogo completo com os {services.length} serviços <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.slice(0, 6).map((service, idx) => (
                    <div
                      key={service.id}
                      className="bg-[#0a0a0a]/60 backdrop-blur-md border border-white/5 hover:border-[#f2b705]/20 p-6 rounded-2xl transition-all hover:-translate-y-1 relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Custom electrical category indicator */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[9px] font-mono tracking-[0.15em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/20 px-2.5 py-0.5 rounded font-black">
                            {service.categoria}
                          </span>
                          <span className="text-white/20 text-[10px] font-mono">#{idx+1}</span>
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight mb-2">{service.nomeServico}</h3>
                        <p className="text-white/40 text-xs mb-4 line-clamp-3 leading-relaxed">{service.descricao}</p>
                      </div>
 
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-[#f2b705]/70 font-mono block uppercase">TEMPO MÉDIO</span>
                          <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-sm">
                            <Clock className="w-3.5 h-3.5 text-[#f2b705]" /> {service.tempoMedio}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedServiceForModal(service)}
                          className="text-[#f2b705] hover:text-[#ffc107] hover:bg-white/5 text-xs font-black uppercase tracking-wider px-3 py-2 rounded transition-colors"
                        >
                          Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra banner detailing electric car setup */}
              <div className="max-w-7xl mx-auto bg-zinc-950/25 border border-[#f2b705]/20 backdrop-blur-md rounded-3xl p-8 mb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-[#f2b705]/5 pointer-events-none">
                  <Zap className="w-48 h-48 scroll-smooth" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8 flex flex-col space-y-4">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/20 px-3 py-1 rounded-full w-max font-bold">
                      TECNOLOGIA SUSTENTÁVEL
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">Instalação de Wallbox WEG, BYD e Porsche</h3>
                    <p className="text-white/50 text-sm leading-relaxed">
                      A AGE Elétrica é homologada e certificada para instalar carregadores de alta potência. Provemos dimensionamento de circuitos, instalação de aterramento blindado exclusivo, cabeamento de bitola adequada e disjuntores inteligentes classe A.
                    </p>
                    <div className="flex gap-4 pt-2">
                      <div className="bg-[#111] border border-white/5 p-4 rounded-xl text-center">
                        <span className="text-[#f2b705] font-black text-xl block leading-none">100%</span>
                        <span className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1 block">NBR 5410 Assegurado</span>
                      </div>
                      <div className="bg-[#111] border border-white/5 p-4 rounded-xl text-center">
                        <span className="text-[#f2b705] font-black text-xl block leading-none">Até 22kW</span>
                        <span className="text-white/40 text-[10px] uppercase font-mono tracking-wider mt-1 block">Trifásico Homologado</span>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 flex flex-col justify-center space-y-4 lg:items-end">
                    <button
                      onClick={() => {
                        const s = services.find(x => x.id === 'srv-14') || services[0];
                        setSelectedServiceForModal(s);
                      }}
                      className="px-6 py-3.5 bg-[#f2b705] text-black text-xs font-black uppercase tracking-tighter rounded-full shadow-[0_0_15px_rgba(242,183,5,0.2)] hover:bg-[#ffc107] transition-all"
                    >
                      Solicitar Orçamento Wallbox
                    </button>
                    <span className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Suporte completo para condomínios e indústrias</span>
                  </div>
                </div>
              </div>

              {/* Steps or Methodology */}
              <div className="max-w-7xl mx-auto mb-20">
                <div className="text-center max-w-2xl mx-auto mb-12">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Como Funciona Nosso Atendimento?</h2>
                  <p className="text-white/40 mt-2 text-xs sm:text-sm">Organização e rastreabilidade técnica do início ao fim</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-zinc-950/20 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-center relative">
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#f2b705] text-black font-black flex items-center justify-center text-xs">1</span>
                    <h4 className="text-white font-extrabold mb-2 mt-4 text-xs uppercase tracking-wider">Solicitação Inicial</h4>
                    <p className="text-white/40 text-xs leading-relaxed">Entre em contato pelo formulário ou WhatsApp informando seu problema.</p>
                  </div>
                  <div className="bg-zinc-950/20 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-center relative">
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#f2b705] text-black font-black flex items-center justify-center text-xs">2</span>
                    <h4 className="text-white font-extrabold mb-2 mt-4 text-xs uppercase tracking-wider">Envio de Orçamento</h4>
                    <p className="text-white/40 text-xs leading-relaxed">Nossa equipe emite o orçamento formalizado digitalmente com todos os itens descritos.</p>
                  </div>
                  <div className="bg-zinc-950/20 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-center relative">
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#f2b705] text-black font-black flex items-center justify-center text-xs">3</span>
                    <h4 className="text-white font-extrabold mb-2 mt-4 text-xs uppercase tracking-wider">Execução Rápida</h4>
                    <p className="text-white/40 text-xs leading-relaxed">Eletricista qualificado escala o atendimento munido de EPIs e ferramentas profissionais.</p>
                  </div>
                  <div className="bg-zinc-950/20 backdrop-blur-md p-6 rounded-2xl border border-white/5 text-center relative">
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#f2b705] text-black font-black flex items-center justify-center text-xs">4</span>
                    <h4 className="text-white font-extrabold mb-2 mt-4 text-xs uppercase tracking-wider">Entrega e Garantia</h4>
                    <p className="text-white/40 text-xs leading-relaxed">Realização de testes, emissão de recibo digital de garantia e assinatura de conformidade.</p>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB: SERVICES */}
          {publicTab === 'servicos' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-12 max-w-7xl mx-auto"
            >
              <div className="mb-10 text-center sm:text-left">
                <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-2">
                  Nosso Catálogo de <span className="text-[#f2b705]">Serviços Elétricos</span>
                </h1>
                <p className="text-white/40 max-w-2xl text-xs sm:text-sm leading-relaxed">
                  Disponibilizamos 16 categorias completas de serviços técnicos residenciais, comerciais e industriais. Clique em qualquer serviço para ver seu embasamento regulatório.
                </p>
              </div>

              {/* Filters / Search Row */}
              <div className="bg-zinc-950/25 border border-white/[0.08] backdrop-blur-md rounded-2xl p-5 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search box */}
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-white/35 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por serviços elétricos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-xl py-2 px-3 pl-9 pr-4 text-xs text-white transition-all font-sans"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category pills */}
                <div className="flex flex-wrap gap-2 justify-center w-full md:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all duration-150 ${selectedCategory === cat ? 'bg-[#f2b705] text-black shadow-md' : 'bg-[#111] text-white/50 border border-white/5 hover:bg-white/5 hover:text-white'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Services Grid representation */}
              {filteredServices.length === 0 ? (
                <div className="bg-zinc-950/20 rounded-2xl border border-white/[0.08] backdrop-blur-md p-12 text-center text-white/40">
                  <HelpCircle className="w-12 h-12 text-[#f2b705] mx-auto mb-4 animate-bounce" />
                  <span className="text-white font-bold block mb-1">Nenhum serviço localizado</span>
                  <span>Tente modificar os termos pesquisados ou filtre por uma categoria diferente.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service, idx) => (
                    <div
                      key={service.id}
                      className="bg-zinc-950/20 backdrop-blur-md border border-white/[0.06] hover:border-[#f2b705]/20 p-6 rounded-2xl transition hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="bg-[#f2b705]/10 border border-[#f2b705]/20 text-[#f2b705] text-[9px] font-mono tracking-[0.15em] uppercase px-2.5 py-0.5 rounded font-black">
                            {service.categoria}
                          </span>
                          <span className="text-white/20 font-mono text-xs">SRV-{idx+10}</span>
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight mb-2">{service.nomeServico}</h3>
                        <p className="text-white/40 text-xs leading-relaxed mb-6 line-clamp-3">{service.descricao}</p>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-white/30 text-[9px] font-mono block uppercase">TEMPO DE EXECUÇÃO</span>
                          <span className="text-white font-mono font-bold flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#f2b705]" /> {service.tempoMedio}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedServiceForModal(service)}
                          className="px-4 py-2 bg-white/[0.03] backdrop-blur-sm border border-white/10 hover:border-[#f2b705]/40 text-white hover:text-[#f2b705] text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(242,183,5,0.15)] cursor-pointer"
                        >
                          Orçamento
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB: ABOUT (SOBRE) */}
          {publicTab === 'sobre' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-12 max-w-7xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
                <div className="lg:col-span-7 space-y-6">
                  <span className="text-[9px] font-mono tracking-[0.15em] text-[#f2b705] bg-[#f2b705]/10 border border-[#f2b705]/20 px-3.5 py-1.5 rounded-full w-max block uppercase font-bold">NOSSAS DIRETRIZES INSTITUCIONAIS</span>
                  <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-none">Sobre a AGE Elétrica</h1>
                  <p className="text-base sm:text-lg text-white/80 leading-relaxed font-light">
                    A AGE Elétrica nasceu com o propósito de oferecer soluções elétricas seguras, modernas e profissionais para residências, empresas e comércios. Trabalhamos com responsabilidade técnica, organização e compromisso com a segurança dos nossos clientes.
                  </p>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Nossa equipe é formada exclusivamente por técnicos de profunda experiência, todos credenciados com treinamentos em NR10 (Segurança em Instalações e Serviços em Eletricidade) e NR35 (Trabalho em Altura). Esse diferencial garante conformidade máxima ao executar instalações de carregadores automotivos Wallbox, montagem de painéis, adequações gerais e reparos críticos de emergência.
                  </p>
                </div>
                <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-[#f2b705]/5 rounded-full blur-xl" />
                  <h3 className="text-lg font-extrabold uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#f2b705]" /> Por que a AGE Elétrica?
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Zap className="text-[#f2b705] shrink-0 w-5 h-5" />
                      <div>
                        <span className="font-extrabold text-white text-xs uppercase tracking-tight block">Suporte Emergencial 24h</span>
                        <span className="text-white/40 text-xs mt-0.5 block leading-normal">Eletricistas estrategicamente posicionados de prontidão</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Shield className="text-[#f2b705] shrink-0 w-5 h-5" />
                      <div>
                        <span className="font-extrabold text-white text-xs uppercase tracking-tight block">Conformidade e Segurança</span>
                        <span className="text-white/40 text-xs mt-0.5 block leading-normal">Cumprimento integral da NBR 5410 com laudo técnico</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <TrendingUp className="text-[#f2b705] shrink-0 w-5 h-5" />
                      <div>
                        <span className="font-extrabold text-white text-xs uppercase tracking-tight block">Tecnologia de Vanguarda</span>
                        <span className="text-white/40 text-xs mt-0.5 block leading-normal">Parcerias com fabricantes para carregamento de veículos e automações</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mission Vision Values Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 hover:border-[#f2b705]/20 transition-colors">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-wider text-base mb-2">Nossa Missão</h4>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Entregar engenharia e serviços elétricos eficientes, duradouros e altamente seguros, minimizando riscos de incêndio ou perdas operacionais em residências e indústrias.
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 hover:border-[#f2b705]/20 transition-colors">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-wider text-base mb-2">Nossa Visão</h4>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Ser a principal referência técnica em soluções de mobilidade elétrica (Wallbox) e readequações de quadros de forças em Natal e região (RN) pela competência técnica demonstrada.
                  </p>
                </div>
                <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 hover:border-[#f2b705]/20 transition-colors">
                  <h4 className="text-[#f2b705] font-black uppercase tracking-wider text-base mb-2">Nossos Valores</h4>
                  <p className="text-white/50 text-xs leading-relaxed">
                    Segurança inegociável, ética corporativa, transparência no faturamento dos orçamentos, rigor técnico de engenharia e total rapidez de atendimento.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: CONTACT (CONTATO) */}
          {publicTab === 'contato' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="px-4 py-12 max-w-7xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-5 flex flex-col space-y-6">
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-2 font-black uppercase tracking-tighter">Fale Conosco</h1>
                    <p className="text-white/40 text-xs sm:text-sm leading-relaxed">Entre em contato para agendar um suporte técnico ou solicitar assistência imediata.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <div className="p-2 bg-[#f2b705]/10 text-[#f2b705] rounded-lg">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white/30 text-[9px] block font-mono">TELEFONE</span>
                        <span className="text-white font-mono text-sm font-bold">{config.telefone}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <div className="p-2 bg-[#f2b705]/10 text-[#f2b705] rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white/30 text-[9px] block font-mono uppercase">WHATSAPP</span>
                        <span className="text-white font-mono text-sm font-bold">{config.whatsapp}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <div className="p-2 bg-[#f2b705]/10 text-[#f2b705] rounded-lg">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white/30 text-[9px] block font-mono uppercase">EMAIL CORPORATIVO</span>
                        <span className="text-white font-mono text-sm font-bold">{config.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                      <div className="p-2 bg-[#f2b705]/10 text-[#f2b705] rounded-lg">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-white/30 text-[9px] block font-mono uppercase">ENDEREÇO DA OPERAÇÃO</span>
                        <span className="text-white font-sans text-xs font-bold">{config.endereco} - {config.cidade}/{config.estado || 'RN'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Active range text badges */}
                  <div className="bg-[#f2b705]/5 border border-[#f2b705]/20 p-5 rounded-2xl">
                    <div className="flex gap-2 items-center mb-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-black tracking-wider text-[#f2b705] uppercase">ÁREAS ATENDIDAS</span>
                    </div>
                    <span className="text-white/50 text-xs leading-relaxed">Atendimento somente Natal / RN e região metropolitana.</span>
                  </div>
                </div>

                {/* Submit solicitation form */}
                <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl relative shadow-2xl">
                  <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">Solicitar Orçamento Online</h3>
                  <p className="text-white/40 text-xs mb-6">Insira seus dados para receber um retorno imediato com laudo prévio.</p>

                  {contactSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#111] border border-[#f2b705]/30 p-8 rounded-2xl text-center flex flex-col items-center"
                    >
                      <CheckCircle className="w-16 h-16 text-[#f2b705] mb-4 animate-bounce" />
                      <h4 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Solicitação Protocolada!</h4>
                      <p className="text-white/60 text-xs mb-6 max-w-md leading-relaxed">
                        A equipe da AGE Elétrica já foi notificada no módulo de solicitações pendentes sob o protocolo <strong className="text-[#f2b705]">AGE-SOL-{submittedNum}</strong>. Vamos analisar e falar via WhatsApp!
                      </p>

                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <a
                          href={getWhatsAppSubmissionLink(submittedNum, 'Cliente', 'Solicitação Geral')}
                          target="_blank"
                          rel="noreferrer"
                          className="grow bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4 fill-white text-white" /> Confirmar no WhatsApp
                        </a>
                        <button
                          onClick={() => setContactSuccess(false)}
                          className="bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 px-4 rounded-xl transition text-sm"
                        >
                          Novo Envio
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Nome Completo *</label>
                          <input
                            type="text"
                            required
                            value={contactForm.nome}
                            onChange={(e) => setContactForm({ ...contactForm, nome: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">WhatsApp (com DDD) *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: 11999998888"
                            value={contactForm.whatsapp}
                            onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Logradouro / Endereço Completo</label>
                          <input
                            type="text"
                            value={contactForm.endereco}
                            onChange={(e) => setContactForm({ ...contactForm, endereco: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Bairro</label>
                          <input
                            type="text"
                            value={contactForm.bairro}
                            onChange={(e) => setContactForm({ ...contactForm, bairro: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Cidade</label>
                          <input
                            type="text"
                            value={contactForm.cidade}
                            onChange={(e) => setContactForm({ ...contactForm, cidade: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Tipo de Serviço Desejado</label>
                          <select
                            value={contactForm.tipoServico}
                            onChange={(e) => setContactForm({ ...contactForm, tipoServico: e.target.value })}
                            className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                          >
                            <option value="">Selecione...</option>
                            {services.map(s => (
                              <option key={s.id} value={s.nomeServico}>{s.nomeServico}</option>
                            ))}
                            <option value="Outro">Outro serviço elétrico</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Melhor Horário para Visita Técnica</label>
                        <select
                          value={contactForm.melhorHorario}
                          onChange={(e) => setContactForm({ ...contactForm, melhorHorario: e.target.value })}
                          className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans"
                        >
                          <option value="Manhã (08:00 às 12:00)">Manhã (08:00 às 12:00)</option>
                          <option value="Tarde (13:00 às 18:00)">Tarde (13:00 às 18:00)</option>
                          <option value="Noite (Emergência)">Noite (Emergência)</option>
                          <option value="Qualquer Horário">Qualquer Horário</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider text-white/40 block mb-1.5">Descrição do Problema ou Observações</label>
                        <textarea
                          rows={4}
                          value={contactForm.descricaoProblema}
                          onChange={(e) => setContactForm({ ...contactForm, descricaoProblema: e.target.value })}
                          className="w-full bg-[#111] border border-white/5 focus:border-[#f2b705]/50 outline-none rounded-lg py-2 px-3 text-xs text-white uppercase tracking-wider font-sans focus:outline-none"
                          placeholder="Fale brevemente do seu chuveiro, fiação, curto-circuito ou wallbox..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3.5 bg-[#f2b705] text-black text-xs font-black uppercase tracking-tighter rounded-full shadow-[0_0_15px_rgba(242,183,5,0.25)] hover:bg-[#ffc107] transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        Enviar Solicitação à AGE Elétrica <Zap className="w-4 h-4 fill-black text-black" />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Floating Widget WhatsApp lower-right */}
      <div className="fixed bottom-6 right-6 z-50 no-print">
        <button
          onClick={() => openWhatsAppDirect('Interessado', 'Atendimento Imediato')}
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group cursor-pointer"
          title="Falar no WhatsApp"
        >
          <MessageSquare className="w-7 h-7 fill-white text-white" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out font-bold text-xs pl-0 group-hover:pl-2 whitespace-nowrap">
            Suporte Técnico
          </span>
        </button>
      </div>

      {/* Public Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 py-12 px-4 text-xs text-white/40 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo"
                className="w-8 h-8 object-contain rounded border border-white/10"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMmI3MDUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAxMiAxNCAxMSAyMiAy1AxMCAxMiAxMCAxMyAyIj48L3BvbHlnb24+PC9zdmc+';
                }}
              />
            ) : (
              <Zap className="w-5 h-5 text-[#f2b705]" />
            )}
            <div>
              <span className="font-bold text-white text-sm block uppercase tracking-wider">{config.nomeFantasia}</span>
              <span className="text-[10px]">© 2026 {config.nomeEmpresa}. Todos os direitos reservados.</span>
            </div>
          </div>
          <div className="flex gap-4 uppercase font-bold text-[10px] tracking-wider text-white/60">
            <span className="hover:text-white cursor-pointer" onClick={() => setPublicTab('home')}>Início</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setPublicTab('servicos')}>Serviços</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setPublicTab('sobre')}>Sobre</span>
            <span>•</span>
            <span className="hover:text-white cursor-pointer" onClick={() => setPublicTab('contato')}>Contato</span>
          </div>
          <div className="text-right font-mono text-[9px] uppercase tracking-wider text-white/30">
            <span>CNPJ: {config.cnpj} • Engenharia Regulamentada NBR 5410</span>
          </div>
        </div>
      </footer>

      {/* Service deep dive modal */}
      <AnimatePresence>
        {selectedServiceForModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 max-w-xl w-full relative shadow-2xl"
            >
              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-white/5 text-white/50 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[#f2b705]" />
                <span className="bg-[#f2b705]/10 border border-[#f2b705]/20 text-[#f2b705] text-[9px] uppercase font-mono tracking-[0.15em] px-2.5 py-0.5 rounded font-black">
                  {selectedServiceForModal.categoria}
                </span>
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">{selectedServiceForModal.nomeServico}</h3>
              <p className="text-white/65 text-xs sm:text-sm leading-relaxed mb-6">{selectedServiceForModal.descricao}</p>

              <div className="space-y-4 bg-[#111] p-5 rounded-2xl border border-white/5 mb-6">
                <div>
                  <span className="text-white/30 font-mono text-[9px] block uppercase">TEMPO MÉDIO DE EXECUÇÃO</span>
                  <p className="text-[#f2b705] text-xs font-bold flex items-center gap-1.5 font-mono mt-1">
                    <Clock className="w-4 h-4 text-[#f2b705]" /> {selectedServiceForModal.tempoMedio}
                  </p>
                </div>

                <div>
                  <span className="text-white/30 font-mono text-[9px] block uppercase">DIRETRIZES TÉCNICAS E NORMAS</span>
                  <p className="text-[#f2b705] text-xs font-mono bg-[#f2b705]/5 p-3 rounded border border-[#f2b705]/10 mt-1 leading-relaxed">
                    ⚙️ {selectedServiceForModal.observacoesTecnicas}
                  </p>
                </div>

                <div>
                  <span className="text-white/30 font-mono text-[9px] block uppercase">BENEFÍCIOS COBERTOS</span>
                  <p className="text-white/60 text-xs mt-1 leading-relaxed">
                    ✅ Garantia legal completa de conformidade com a norma NBR 5410, isolamento antichamas, aferição de correntes por aparelhos digitais calibrados e descarte correto de resíduos conforme a legislação.
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
                  className="grow bg-[#f2b705] hover:bg-[#ffc107] text-black font-black uppercase tracking-tighter py-3 px-4 rounded-full text-center text-xs transition-all cursor-pointer"
                >
                  Solicitar este Serviço no WhatsApp
                </button>
                <button
                  onClick={() => {
                    setContactForm(prev => ({
                      ...prev,
                      tipoServico: selectedServiceForModal.nomeServico,
                      descricaoProblema: `Desejo orçamento detalhado para o serviço de ${selectedServiceForModal.nomeServico}.`
                    }));
                    setPublicTab('contato');
                    setSelectedServiceForModal(null);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-full text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Usar Form Site
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
