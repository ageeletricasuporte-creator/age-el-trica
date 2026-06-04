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
  Leaf
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

  // Mouse Glow Position Tracking State for dynamic tech backdrop
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  React.useEffect(() => {
    // Fetch initial dataset
    setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
    setConfig(AgeEletricaDB.getConfig());

    // Sync database updates dynamically
    const unsubscribe = AgeEletricaDB.subscribe(() => {
      setServices(AgeEletricaDB.getServices().filter(s => s.status === 'Ativo'));
      setConfig(AgeEletricaDB.getConfig());
    });

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      unsubscribe();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<Servico | null>(null);

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
        className="pointer-events-none fixed inset-0 z-30 transition duration-300 opacity-25 md:opacity-45"
        style={{
          background: `radial-gradient(550px circle at ${mousePos.x}px ${mousePos.y}px, rgba(242,183,5,0.06), transparent 80%)`
        }}
      />

      {/* 2. Top Minimal Technological Utility Strip */}
      <div className="bg-neutral-950/90 border-b border-white/[0.04] py-1.5 px-6 text-[10px] uppercase tracking-[0.15em] text-zinc-500 hover:text-zinc-400 transition-colors z-50 no-print">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-5 font-mono">
            <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
              <Zap className="w-3 h-3 text-[#f2b705] animate-pulse" /> Atendimento 24h Natal/RN Metropolitano
            </span>
            <span className="hidden md:inline text-zinc-800">|</span>
            <span className="hidden md:inline text-zinc-500 font-normal">Normas de Instalações Elétricas (NBR 5410, NR10, NR35)</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#f2b705] font-mono tracking-tight font-bold">{config.telefone}</span>
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 bg-white/[0.01] hover:bg-[#f2b705]/10 border border-white/[0.05] hover:border-[#f2b705]/30 hover:text-[#f2b705] px-3.5 py-1 rounded-full transition-all text-[9px] font-mono tracking-widest cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5 text-[#f2b705]" /> INTRA/ADMIN
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
                className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 object-contain rounded-md border border-white/10"
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
          <nav className="hidden md:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
            <button
              onClick={() => setPublicTab('home')}
              className={`transition-all duration-300 px-4 py-2 rounded-full cursor-pointer ${publicTab === 'home' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Início
            </button>
            <button
              onClick={() => setPublicTab('servicos')}
              className={`transition-all duration-300 px-4 py-2 rounded-full cursor-pointer ${publicTab === 'servicos' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Catálogo
            </button>
            <button
              onClick={() => setPublicTab('sobre')}
              className={`transition-all duration-300 px-4 py-2 rounded-full cursor-pointer ${publicTab === 'sobre' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Sobre Nós
            </button>
            <button
              onClick={() => setPublicTab('contato')}
              className={`transition-all duration-300 px-4 py-2 rounded-full cursor-pointer ${publicTab === 'contato' ? 'text-[#f2b705] bg-white/[0.05] border border-white/[0.08]' : 'text-zinc-400 hover:text-white'}`}
            >
              Contato
            </button>
          </nav>

          {/* Action action button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToRequest}
              className="px-3 sm:px-4.5 py-1.5 bg-gradient-to-r from-amber-500 to-[#f2b705] text-black text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-widest rounded-full transition-all duration-350 hover:shadow-[0_0_20px_rgba(242,183,5,0.45)] hover:scale-[1.02] cursor-pointer"
            >
              Orçamento Rápido
            </button>
          </div>
        </header>

        {/* Sleek Horizontal Tab Bar for Mobile viewports */}
        <nav className="md:hidden w-full max-w-sm bg-neutral-950/90 backdrop-blur-xl border border-white/[0.06] rounded-full p-1 flex justify-around items-center shadow-lg pointer-events-auto text-[8.5px] font-extrabold uppercase tracking-widest gap-0.5">
          <button
            onClick={() => setPublicTab('home')}
            className={`transition-all duration-200 py-1.5 px-2.5 rounded-full cursor-pointer ${publicTab === 'home' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Início
          </button>
          <button
            onClick={() => setPublicTab('servicos')}
            className={`transition-all duration-200 py-1.5 px-2.5 rounded-full cursor-pointer ${publicTab === 'servicos' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Catálogo
          </button>
          <button
            onClick={() => setPublicTab('sobre')}
            className={`transition-all duration-200 py-1.5 px-2.5 rounded-full cursor-pointer ${publicTab === 'sobre' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Sobre
          </button>
          <button
            onClick={() => setPublicTab('contato')}
            className={`transition-all duration-200 py-1.5 px-2.5 rounded-full cursor-pointer ${publicTab === 'contato' ? 'text-[#f2b705] bg-white/[0.06]' : 'text-zinc-400 hover:text-white'}`}
          >
            Contato
          </button>
        </nav>
      </div>

      {/* 4. Tab views controller */}
      <main className="grow">
        <AnimatePresence mode="wait">
          
          {/* TAB: HOME SCREEN */}
          {publicTab === 'home' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="px-4 md:px-8 py-6 space-y-24"
            >
              {/* BRAND HERO HIGHLIGHTS: Clean, wide-spaced centerpiece inspired by Tesla/Linear styling */}
              <div className="max-w-6xl mx-auto pt-24 pb-8 text-center relative flex flex-col items-center">
                
                {/* Glow behind title */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full bg-[#f2b705]/[0.05] blur-[120px] pointer-events-none" />

                {/* Sub-header badge outline */}
                <div className="mb-8 select-none">
                  <div className="inline-flex items-center gap-2 bg-[#f2b705]/[0.03] border border-[#f2b705]/20 text-[#f2b705] px-5 py-2.5 rounded-full text-[9px] font-mono tracking-[0.25em] uppercase font-bold backdrop-blur-sm shadow-[0_4px_15px_rgba(242,183,5,0.05)]">
                    <Sparkles className="w-3.5 h-3.5 text-[#f2b705] fill-[#f2b705]/20" /> SEU ELETRICISTA AMIGO
                  </div>
                </div>

                {/* Main Hero giant title */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[100px] font-black tracking-tighter text-white mb-6 uppercase select-none leading-none">
                  SEU ELETRICISTA <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f2b705] via-amber-400 to-amber-500 drop-shadow-[0_0_50px_rgba(242,183,5,0.2)]">AMIGO</span>
                </h1>

                {/* Tagline sentence */}
                <p className="text-zinc-400 font-light text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed mb-10 text-center">
                  Oferecemos instalações residenciais e apartamentos, reparos elétricos rápidos, manutenção preventiva técnica, câmeras de segurança CFTV, carregadores Wallbox, ar condicionado e automação residencial, com total segurança e compromisso para você e seu lar.
                </p>

                {/* Horizontal list specifications */}
                <div className="flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-5 gap-y-2 text-zinc-500 font-mono text-[9px] sm:text-[9.5px] uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-12 border-t border-b border-white/[0.03] py-4 w-full max-w-3xl px-4 text-center">
                  <span>RESIDÊNCIAS & APARTAMENTOS</span>
                  <span className="hidden sm:inline text-[#f2b705]/40 font-bold">•</span>
                  <span>CARREGADOR INSTALADO WALLBOX</span>
                  <span className="hidden sm:inline text-[#f2b705]/40 font-bold">•</span>
                  <span>SEGURANÇA CFTV</span>
                  <span className="hidden sm:inline text-[#f2b705]/40 font-bold">•</span>
                  <span>AUTOMACÃO SMART HOME</span>
                </div>

                {/* Hero Button Action Groups aligning side-by-side */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full sm:w-auto z-10">
                  <button
                    onClick={onNavigateToRequest}
                    className="w-full sm:w-auto px-10 py-5 bg-[#f2b705] hover:bg-[#ffca03] text-black text-xs font-black uppercase tracking-widest rounded-xl shadow-[0_8px_30px_rgba(242,183,5,0.25)] hover:shadow-[0_8px_40px_rgba(242,183,5,0.5)] transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Solicitar Orçamento <ArrowRight className="w-4 h-4 text-black font-semibold" />
                  </button>

                  <button
                    onClick={() => setPublicTab('servicos')}
                    className="w-full sm:w-auto px-10 py-5 bg-neutral-900/60 border border-white/[0.06] hover:border-[#f2b705]/40 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
                  >
                    Conhecer Serviços
                  </button>
                </div>

                {/* Floating metrics grid under hero */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 w-full max-w-5xl">
                  <div className="bg-neutral-900/[0.25] backdrop-blur-md border border-white/[0.04] p-5 rounded-2xl text-center">
                    <span className="text-3xl font-extrabold text-white block mb-0.5 font-mono">24h</span>
                    <span className="text-zinc-500 font-mono tracking-wider uppercase text-[8.5px]">Suporte de Emergência</span>
                  </div>
                  <div className="bg-neutral-900/[0.25] backdrop-blur-md border border-white/[0.04] p-5 rounded-2xl text-center">
                    <span className="text-3xl font-extrabold text-[#f2b705] block mb-0.5 font-mono">100%</span>
                    <span className="text-zinc-500 font-mono tracking-wider uppercase text-[8.5px]">Nacionais de Segurança</span>
                  </div>
                  <div className="bg-neutral-900/[0.25] backdrop-blur-md border border-white/[0.04] p-5 rounded-2xl text-center">
                    <span className="text-3xl font-extrabold text-white block mb-0.5 font-mono">+1.500</span>
                    <span className="text-zinc-500 font-mono tracking-wider uppercase text-[8.5px]">Visitas Executadas</span>
                  </div>
                  <div className="bg-neutral-900/[0.25] backdrop-blur-md border border-white/[0.04] p-5 rounded-2xl text-center">
                    <span className="text-3xl font-extrabold text-emerald-400 block mb-0.5 font-mono">0 CARBON</span>
                    <span className="text-zinc-500 font-mono tracking-wider uppercase text-[8.5px]">Foco Ambiental Wallbox</span>
                  </div>
                </div>

              </div>

              {/* BRAND IMAGE BANNER COMPOSITION: Presenting existing electrician portfolio image */}
              <div className="max-w-6xl mx-auto rounded-3xl overflow-hidden border border-white/[0.05] bg-neutral-900/[0.15] p-3 shadow-2xl backdrop-blur-xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center p-6 md:p-12">
                  
                  {/* Left component: Styled frame of electrician */}
                  <div className="lg:col-span-5 relative group flex justify-center items-center">
                    {/* Golden accent node */}
                    <div className="absolute w-64 h-64 rounded-full bg-[#f2b705]/10 blur-[80px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
                    
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#000]/60 p-2 text-center w-full">
                      <img
                        src={config.bannerHero || defaultBannerImg}
                        alt="Eletricista Certificado AGE Elétrica"
                        className="w-full max-h-[350px] object-cover rounded-xl transition-all duration-700 select-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Right side: Core information block */}
                  <div className="lg:col-span-7 space-y-6">
                    <span className="text-[9px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/30 px-3 py-1.5 rounded-full inline-block max-w-full font-bold text-center">
                      ⚡ RESPONSABILIDADE SOCIAL E CONFORMIDADE
                    </span>
                    
                    <h2 className="text-3.5xl sm:text-5xl font-extrabold text-white uppercase tracking-tight leading-none">
                      SERVIÇO TÉCNICO QUE PROTEGE SEU FAMILIAR E PATRIMÔNIO
                    </h2>
                    
                    <p className="text-zinc-405 text-sm leading-relaxed text-zinc-400">
                      Na <strong>AGE Elétrica</strong>, cada disjuntor conectado ou ramal blindado segue estritamente o manual da norma técnica brasileira NBR 5410. Garantimos que sua estrutura comercial ou residencial não sofra superaquecimentos, minimizando preventivamente riscos de curtos-circuitos repentinos.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] hover:border-[#f2b705]/10 rounded-xl flex gap-3 transition">
                        <Shield className="w-5 h-5 text-[#f2b705] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white text-xs uppercase block">Eletricistas Certificados</span>
                          <span className="text-zinc-500 text-[11px] block mt-0.5">Treinamento constante e homologação oficial das principais normas de segurança.</span>
                        </div>
                      </div>

                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] hover:border-[#f2b705]/10 rounded-xl flex gap-3 transition">
                        <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white text-xs uppercase block">Parceria Sustentável</span>
                          <span className="text-zinc-500 text-[11px] block mt-0.5">Líderes no estado em instalação segura de carregadores verdes Wallbox.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4 items-center">
                      <button
                        onClick={onNavigateToRequest}
                        className="px-6 py-3 bg-[#f2b705]/5 hover:bg-[#f2b705]/10 border border-[#f2b705]/30 hover:border-[#f2b705] text-[#f2b705] text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 cursor-pointer"
                      >
                        Agendar Vistoria Técnica
                      </button>
                      <button
                        onClick={() => setPublicTab('sobre')}
                        className="text-zinc-500 hover:text-white transition text-xs font-bold uppercase tracking-wider pl-2 cursor-pointer"
                      >
                        Saiba mais sobre nós →
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* QUICK SERVICES PRESETS LIST: Grid layout cards displaying premier services */}
              <div className="max-w-6xl mx-auto space-y-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.04] pb-6">
                  <div>
                    <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">SERVIÇOS DE VANGUARDA</h2>
                    <p className="text-zinc-500 text-xs sm:text-sm mt-1">Materiais homologados de alta durabilidade para máxima segurança</p>
                  </div>
                  <button
                    onClick={() => setPublicTab('servicos')}
                    className="text-[#f2b705] hover:text-[#ffca03] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition"
                  >
                    Ver Tudo com {services.length} Serviços <ArrowRight className="w-4 h-4 text-[#f2b705]" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.slice(0, 6).map((service, idx) => (
                    <div
                      key={service.id}
                      className="group bg-neutral-900/[0.15] border border-white/[0.04] hover:border-[#f2b705]/20 p-7 rounded-2xl transition-all duration-350 flex flex-col justify-between hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.85)] relative overflow-hidden"
                    >
                      {/* Interactive focus gold glow corner */}
                      <div className="absolute top-0 right-0 w-[80px] h-[80px] bg-[#f2b705]/[0.01] group-hover:bg-[#f2b705]/[0.03] transition-colors rounded-bl-full pointer-events-none" />

                      <div>
                        <div className="flex justify-between items-center mb-5">
                          <span className="text-[9px] font-mono tracking-[0.2em] text-[#f2b705] uppercase bg-[#f2b705]/10 border border-[#f2b705]/20 px-2.5 py-1 rounded font-black">
                            {service.categoria}
                          </span>
                          <span className="text-zinc-600 group-hover:text-[#f2b705]/40 transition-colors text-[9.5px] font-mono">CODE-{service.id.toUpperCase()}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-white tracking-tight mb-2 uppercase group-hover:text-[#f2b705] transition-colors">{service.nomeServico}</h3>
                        <p className="text-zinc-500 text-xs leading-relaxed mb-6 block line-clamp-3 group-hover:text-zinc-400 transition-colors">{service.descricao}</p>
                      </div>

                      <div className="pt-4 border-t border-white/[0.03] flex justify-between items-center">
                        <div>
                          <span className="text-[8.5px] text-zinc-600 font-mono block uppercase">TEMPO DE EXECUÇÃO</span>
                          <span className="text-[10px] font-mono font-bold text-white flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-[#f2b705]" /> {service.tempoMedio}
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedServiceForModal(service)}
                          className="text-[#f2b705] hover:text-[#ffca03] text-[9.5px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/[0.03] px-3.5 py-2.5 rounded-lg transition-colors border border-transparent hover:border-white/[0.04]"
                        >
                          Mais Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GREEN ENERGY WALLBOX DEEP COMPOSITION: Stylized as highly professional tech product bento with emerald points */}
              <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-neutral-900/40 via-neutral-950/20 to-emerald-950/[0.03] border border-emerald-500/20 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-emerald-500/[0.015] pointer-events-none">
                  <Leaf className="w-56 h-56 rotate-45" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
                  <div className="lg:col-span-8 space-y-4">
                    <span className="text-[9px] font-mono tracking-[0.2em] sm:tracking-[0.25em] text-emerald-400 bg-emerald-500/10 border border-emerald-400/30 px-3.5 py-1.5 rounded-full inline-block max-w-full font-bold uppercase">
                      🍃 MOBILIDADE ELÉTRICA SUSTENTÁVEL
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tighter text-white">
                      Instalação de Wallbox Homologada BYD, WEG, Porsche & Volvo
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
                      A AGE Elétrica é lider no Rio Grande do Norte em dimensionamento de circuitos para veículos elétricos. Desenvolvemos o cálculo da rede nominal, instalamos aterramentos isolados blindados para evitar ruídos de corrente, adaptamos disjuntores inteligentes classe A e emitimos correspondente laudo de parametrização.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="p-4 bg-black/40 border border-emerald-500/10 rounded-xl text-center min-w-[120px]">
                        <span className="text-emerald-400 font-extrabold text-xl block leading-none">Class A</span>
                        <span className="text-zinc-650 text-[9px] uppercase font-mono tracking-wider mt-1 block text-zinc-500">Disjuntores FI</span>
                      </div>
                      <div className="p-4 bg-black/40 border border-emerald-500/10 rounded-xl text-center min-w-[120px]">
                        <span className="text-[#f2b705] font-extrabold text-xl block leading-none">Até 22kW</span>
                        <span className="text-zinc-650 text-[9px] uppercase font-mono tracking-wider mt-1 block text-zinc-500">Carga Ultrarrápida</span>
                      </div>
                      <div className="p-4 bg-black/40 border border-emerald-500/10 rounded-xl text-center min-w-[120px]">
                        <span className="text-[#f2b705] font-extrabold text-xl block leading-none">100% OK</span>
                        <span className="text-zinc-650 text-[9px] uppercase font-mono tracking-wider mt-1 block text-zinc-500">Laudo Técnico RN</span>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 flex flex-col justify-center space-y-4 lg:items-end">
                    <button
                      onClick={() => {
                        const s = services.find(x => x.id === 'srv-14') || services[0];
                        setSelectedServiceForModal(s);
                      }}
                      className="px-6.5 py-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all cursor-pointer border border-emerald-400/20"
                    >
                      Solicitar Orçamento Wallbox
                    </button>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block text-center lg:text-right">Compatível com condomínios fechados e residências</span>
                  </div>
                </div>
              </div>

              {/* METHODOLOGY OF OPERATION: Standard 1-4 step map redesigned for tech vibe */}
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">METODOLOGIA CRONOMETRADA</h2>
                  <p className="text-zinc-500 text-xs sm:text-sm mt-1">Garantia absoluta de eficiência, controle e prestação de contas digital</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-neutral-900/[0.15] p-7 rounded-2xl border border-white/[0.04] relative">
                    <div className="w-8 h-8 rounded-full bg-[#f2b705]/10 border border-[#f2b705]/40 text-[#f2b705] font-mono font-bold flex items-center justify-center text-xs mb-5">
                      01
                    </div>
                    <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-2 block">Abertura Digital</h4>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Você insere sua intenção no site ou solicita via WhatsApp e nosso sistema centraliza e gera o protocolo instantâneo.</p>
                  </div>

                  <div className="bg-neutral-900/[0.15] p-7 rounded-2xl border border-white/[0.04] relative">
                    <div className="w-8 h-8 rounded-full bg-[#f2b705]/10 border border-[#f2b705]/40 text-[#f2b705] font-mono font-bold flex items-center justify-center text-xs mb-5">
                      02
                    </div>
                    <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-2 block">Orçamento Técnico</h4>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Nossa equipe técnica analisa o caso e formata uma discriminação estruturada de custos, peças homologadas e prazos.</p>
                  </div>

                  <div className="bg-neutral-900/[0.15] p-7 rounded-2xl border border-white/[0.04] relative">
                    <div className="w-8 h-8 rounded-full bg-[#f2b705]/10 border border-[#f2b705]/40 text-[#f2b705] font-mono font-bold flex items-center justify-center text-xs mb-5">
                      03
                    </div>
                    <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-2 block">Execução e NR10</h4>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Nossa equipe em escala técnica realiza a intervenção equipada com EPIs e medidores calibrados de frequências e cargas.</p>
                  </div>

                  <div className="bg-neutral-900/[0.15] p-7 rounded-2xl border border-white/[0.04] relative">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 font-mono font-bold flex items-center justify-center text-xs mb-5">
                      04
                    </div>
                    <h4 className="text-white font-extrabold text-xs uppercase tracking-widest mb-2 block">Laudo e Emissão</h4>
                    <p className="text-zinc-500 text-[11px] leading-relaxed">Testamos a rede ao vivo sob estresse, emitimos recibo digital de garantia e asseguramos conformidade integral.</p>
                  </div>
                </div>
              </div>

              {/* SOCIAL PROOF SECTION: Stylized testimonial review cards */}
              <div className="max-w-6xl mx-auto space-y-12">
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-white">RECONHECIMENTO REGIONAL</h2>
                  <p className="text-zinc-500 text-xs sm:text-sm mt-1">Opinião de quem confiou nossos técnicos eletricistas em Natal e região metropolitana</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {testimonials.map((test, index) => (
                    <div 
                      key={index}
                      className="bg-neutral-900/[0.15] border border-white/[0.04] rounded-2xl p-6.5 flex flex-col justify-between relative hover:border-white/[0.1] transition-all"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-1">
                          {[...Array(test.rating)].map((_, i) => (
                            <Sparkles key={i} className="w-3.5 h-3.5 text-[#f2b705] fill-[#f2b705]" />
                          ))}
                        </div>
                        <p className="text-zinc-400 text-[12.5px] leading-relaxed italic">
                          "{test.text}"
                        </p>
                      </div>

                      <div className="pt-6 border-t border-white/[0.03] mt-6 flex justify-between items-center bg-transparent">
                        <div>
                          <span className="font-extrabold text-xs text-white block uppercase">{test.author}</span>
                          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{test.role} • {test.location}</span>
                        </div>
                        <span className="text-[8.5px] text-[#f2b705] bg-[#f2b705]/5 px-2 py-0.5 rounded uppercase font-bold font-mono">
                          {test.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* IMPACT CALL TO ACTION: Futuristic bottom segment */}
              <div className="max-w-6xl mx-auto bg-gradient-to-r from-neutral-950 via-[#141208] to-neutral-950 border border-white/[0.05] p-10 md:p-16 rounded-3xl text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#f2b705]/[0.04] blur-[90px] pointer-events-none" />
                
                <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                  <h3 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter uppercase leading-none">
                    PRONTO PARA SOLICITAR <br />UM TÉCNICO ELETRICISTA DA <span className="text-[#f2b705]">AGE ELÉTRICA</span>?
                  </h3>
                  <p className="text-zinc-400 text-sm leading-relaxed font-light">
                    Evite perigos de fios expostos ou dimensionamentos errôneos. Deixe nossa equipe de especialistas resolver seu caso rapidamente. Preencha agora e agende uma vistoria prioritária.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button
                      onClick={onNavigateToRequest}
                      className="w-full sm:w-auto px-8 py-4.5 bg-[#f2b705] text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(242,183,5,0.4)] hover:scale-103 cursor-pointer"
                    >
                      SOLICITAR AGORA
                    </button>
                    <button
                      onClick={() => openWhatsAppDirect('Interessado', 'Suporte Imediato Especial')}
                      className="w-full sm:w-auto px-8 py-4.5 bg-neutral-900 border border-white/[0.06] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-850 hover:text-[#f2b705] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> WHATSAPP CORPORATIVO
                    </button>
                  </div>
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
                <h1 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white">
                  SOLUÇÕES EM <span className="text-[#f2b705]">ENERGIA</span>
                </h1>
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
                  <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">
                    Quem Somos Nós
                  </h1>
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
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                      Estamos Online
                    </h1>
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
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-tight text-white">Solicitar Orçamento Online</h3>
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
                          className="grow bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_5px_15px_rgba(16,185,129,0.2)] border border-emerald-400/20"
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
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 5. Floating Widgets removed by user request to keep only compositional site controls */}

      {/* 6. Clean Institutional Footer */}
      <footer className="bg-neutral-950 border-t border-white/[0.04] py-12 px-6 text-xs text-zinc-500 z-10 relative">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          
          <div className="flex items-center gap-3">
            {config.logo ? (
              <img
                src={config.logo}
                alt="Logo AGE"
                className="w-7 h-7 object-contain rounded border border-white/10 select-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmMmI3MDUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cG9seWdvbiBwb2ludHM9IjEzIDIgMyAxNCAxMiAxNCAxMSAyMiAyMSAxMCAxMiAxMCAxMyAyIj48L3BvbHlnb24+PC9zdmc+';
                }}
              />
            ) : (
              <Zap className="w-5 h-5 text-[#f2b705]" />
            )}
            <div>
              <span className="font-extrabold text-white text-xs block uppercase tracking-widest">{config.nomeFantasia}</span>
              <span className="text-[10px] text-zinc-600 block mt-0.5">© 2026 {config.nomeEmpresa}. Todos os direitos reservados.</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 uppercase font-bold text-[9.5px] tracking-widest text-[10px]">
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('home')}>Início</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('servicos')}>Catálogo</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('sobre')}>Diretrizes</span>
            <span className="text-zinc-800">•</span>
            <span className="hover:text-white cursor-pointer transition-colors" onClick={() => setPublicTab('contato')}>Contato</span>
          </div>

          <div className="text-center md:text-right font-mono text-[9px] uppercase tracking-wider text-zinc-600 space-y-0.5">
            <span className="block">CNPJ: {config.cnpj} • CREA Autorizado RN</span>
            <span className="block text-zinc-700">Desenvolvimento em Alta Performance e Estabilidade</span>
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

    </div>
  );
}
