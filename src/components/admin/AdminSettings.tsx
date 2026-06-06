/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Building2,
  FileText,
  Save,
  Check,
  Smartphone,
  CreditCard,
  Notebook,
  Upload,
  Image
} from 'lucide-react';
import { NivelAcesso, ConfiguracaoEmpresa } from '../../types';

interface AdminSettingsProps {
  config: ConfiguracaoEmpresa;
  onSaveConfig: (data: ConfiguracaoEmpresa) => void;
  userRole: NivelAcesso;
}

export function AdminSettings({
  config,
  onSaveConfig,
  userRole
}: AdminSettingsProps) {
  // Form Fields mapped to config schema
  const [companyName, setCompanyName] = useState(config.nomeEmpresa);
  const [fName, setFName] = useState(config.nomeFantasia);
  const [cnpj, setCnpj] = useState(config.cnpj);
  const [address, setAddress] = useState(config.endereco);
  const [city, setCity] = useState(config.cidade);
  const [state, setState] = useState(config.estado);
  const [emailStr, setEmailStr] = useState(config.email);
  const [phoneStr, setPhoneStr] = useState(config.telefone || '');
  const [whatsappStr, setWhatsappStr] = useState(config.whatsapp);
  const [logoStr, setLogoStr] = useState(config.logo || '');
  const [logoPdfStr, setLogoPdfStr] = useState(config.logoPdf || '');
  const [logoPdfAgendamentoStr, setLogoPdfAgendamentoStr] = useState(config.logoPdfAgendamento || '');
  const [logoPdfLaudoStr, setLogoPdfLaudoStr] = useState(config.logoPdfLaudo || '');
  const [faviconStr, setFaviconStr] = useState(config.favicon || '');
  const [bannerHeroStr, setBannerHeroStr] = useState(config.bannerHero || '');
  const [fotoSobreStr, setFotoSobreStr] = useState(config.fotoSobre || '');
  const [pixStr, setPixStr] = useState(config.chavePix);
  const [bankStr, setBankStr] = useState(config.dadosBancarios);
  const [receiptText, setReceiptText] = useState(config.textoPadraoRecibo);
  const [signatureStr, setSignatureStr] = useState(config.assinaturaDigital);
  const [footerStr, setFooterStr] = useState(config.rodapePdf);
  const [adminName, setAdminName] = useState(config.nomeAdministrador || 'Akson Pereira');
  const [dragActive, setDragActive] = useState(false);
  const [dragPdfActive, setDragPdfActive] = useState(false);
  const [dragAgendamentoActive, setDragAgendamentoActive] = useState(false);
  const [dragLaudoActive, setDragLaudoActive] = useState(false);
  const [dragFaviconActive, setDragFaviconActive] = useState(false);
  const [dragBannerActive, setDragBannerActive] = useState(false);
  const [dragSobreActive, setDragSobreActive] = useState(false);

  // Non-blocking states (replaces window alerts)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Client-side automatic image compression and scaling optimizer to prevent storage quota and Firestore limits
  const compressAndResizeImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.85,
    maxUrlLength: number = 220000
  ): Promise<string> => {
    return new Promise((resolve) => {
      // SVGs don't need scaling or compression because they are XML vectors and very small.
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          resolve('');
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Scale proportion calculation
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          let currentWidth = width;
          let currentHeight = height;
          let currentQuality = quality;
          let dataUrl = '';

          // Let's iterate if necessary to find a clean balance between size and quality
          for (let iter = 0; iter < 4; iter++) {
            canvas.width = currentWidth;
            canvas.height = currentHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            // Render scaled image smoothly
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

            // Support transparency for PNG, WebP or GIF, otherwise use JPEG
            const isTransparentCompatible = file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/webp';
            
            let outputFormat = 'image/jpeg';
            if (isTransparentCompatible) {
              // Try to use image/webp because it supports alpha transparency AND quality compression.
              const testCanvas = document.createElement('canvas');
              testCanvas.width = 1;
              testCanvas.height = 1;
              const testUrl = testCanvas.toDataURL('image/webp');
              if (testUrl.indexOf('data:image/webp') === 0) {
                outputFormat = 'image/webp';
              } else {
                outputFormat = 'image/png'; // Fallback
              }
            }

            const encodeQuality = outputFormat === 'image/png' ? undefined : currentQuality;
            dataUrl = canvas.toDataURL(outputFormat, encodeQuality);

            // If it's small enough, or if we cannot compress/shrink further, stop
            if (dataUrl.length < maxUrlLength) {
              break;
            }

            // Otherwise, scale down by 15% and reduce quality by 15%
            currentWidth = Math.round(currentWidth * 0.85);
            currentHeight = Math.round(currentHeight * 0.85);
            currentQuality = Math.max(0.4, currentQuality - 0.15);
          }

          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, SVG, WebP)!');
      return;
    }
    try {
      // Max 200x200 px, quality 0.65, max string length 40,000 characters (~40KB)
      const compressed = await compressAndResizeImage(file, 200, 200, 0.65, 40000);
      if (compressed) {
        setLogoStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar logotipo.');
    }
  };

  const handleLogoPdfUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, SVG, WebP)!');
      return;
    }
    try {
      // Max 240x120 px, quality 0.60, max string length 40,000 characters (~40KB)
      const compressed = await compressAndResizeImage(file, 240, 120, 0.60, 40000);
      if (compressed) {
        setLogoPdfStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar logotipo para PDF.');
    }
  };

  const handleLogoPdfAgendamentoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, SVG, WebP)!');
      return;
    }
    try {
      const compressed = await compressAndResizeImage(file, 240, 120, 0.60, 40000);
      if (compressed) {
        setLogoPdfAgendamentoStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar logotipo para PDF do Agendamento.');
    }
  };

  const handleLogoPdfLaudoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, SVG, WebP)!');
      return;
    }
    try {
      const compressed = await compressAndResizeImage(file, 240, 120, 0.60, 40000);
      if (compressed) {
        setLogoPdfLaudoStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar logotipo para PDF do Laudo.');
    }
  };

  const handleFaviconUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, SVG, WebP, ICO)!');
      return;
    }
    try {
      // Max 48x48 px is extremely sufficient for small browser tab icons, max string length 8,000 characters (~8KB)
      const compressed = await compressAndResizeImage(file, 48, 48, 0.50, 8000);
      if (compressed) {
        setFaviconStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar logotipo do favicon.');
    }
  };

  const handleBannerHeroUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, WebP, SVG)!');
      return;
    }
    try {
      // Max 400x600 px for quick downloads and seamless responsive scaling, max string length 70,000 characters (~70KB)
      const compressed = await compressAndResizeImage(file, 400, 600, 0.50, 70000);
      if (compressed) {
        setBannerHeroStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar imagem do banner do site.');
    }
  };

  const handleFotoSobreUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, envie apenas arquivos de imagem válida (PNG, JPG, WebP, SVG)!');
      return;
    }
    try {
      // Max 300x300 px (rendered on a 150-250px UI frame), quality 0.55, max string length 50,000 characters (~50KB)
      const compressed = await compressAndResizeImage(file, 300, 300, 0.55, 50000);
      if (compressed) {
        setFotoSobreStr(compressed);
      }
    } catch (err) {
      setErrorMessage('Erro ao converter e otimizar a imagem do profissional (Sobre).');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  if (userRole !== 'Administrador') {
    return (
      <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/15 text-sm font-mono">
          🎛️
        </div>
        <h3 className="text-white text-base font-extrabold font-sans">Parâmetros Bloqueados</h3>
        <p className="text-zinc-500 text-xs leading-relaxed text-sans">
          Apenas um usuário com privilégio de <strong className="text-white">Administrador Geral</strong> da AGE Elétrica possui permissões para recalibrar chaves Pix, cadastros tributários e logomarcas institucionais do sistema.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !cnpj || !pixStr || !whatsappStr) {
      setErrorMessage('Preencha os campos corporativos essenciais (Razão Social, CNPJ, WhatsApp e Chave Pix)!');
      return;
    }

    const updatedConfig: ConfiguracaoEmpresa = {
      ...config,
      nomeEmpresa: companyName,
      nomeFantasia: fName,
      cnpj,
      endereco: address,
      cidade: city,
      estado: state,
      email: emailStr,
      telefone: phoneStr,
      whatsapp: whatsappStr,
      logo: logoStr,
      logoPdf: logoPdfStr,
      logoPdfAgendamento: logoPdfAgendamentoStr,
      logoPdfLaudo: logoPdfLaudoStr,
      favicon: faviconStr,
      bannerHero: bannerHeroStr,
      fotoSobre: fotoSobreStr,
      chavePix: pixStr,
      dadosBancarios: bankStr,
      textoPadraoRecibo: receiptText,
      assinaturaDigital: signatureStr,
      rodapePdf: footerStr,
      nomeAdministrador: adminName
    };

    try {
      onSaveConfig(updatedConfig);
      setErrorMessage(null);
      setSuccessMessage('Os novos parâmetros operacionais da AGE Elétrica foram salvos com sucesso e persistidos localmente!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      if (err.message === 'QUOTA_EXCEEDED') {
        setErrorMessage('Limite de armazenamento do navegador atingido! A imagem que você tentou salvar é muito pesada para o armazenamento local. Por favor, envie uma logo/banner menor ou use a opção de colar o link directo de imagem online.');
      } else {
        setErrorMessage('Erro ao persistir parâmetros: ' + err.message);
      }
    }
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
      <div>
        <h2 className="text-xl font-extrabold text-white">Configurações Gerais do Sistema</h2>
        <p className="text-zinc-500 text-xs">Mapeie dados fiscais corporativos, mude chaves Pix de recebimento de wallbox e edite rodapés de relatórios PDF.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        
        {/* Unit 1: Juridic Profile */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Building2 className="w-4 h-4 text-amber-500" /> Razão Social e Credenciamento Fiscal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Razão Social Oficial *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Nome Fantasia do Site *</label>
              <input
                type="text"
                required
                value={fName}
                onChange={(e) => setFName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">CNPJ Institucional / CFT *</label>
              <input
                type="text"
                required
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-zinc-400 block mb-1">Endereço Administrativo Sede *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Cidade Sede *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-805 rounded-xl py-2 px-3 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Estado / UF *</label>
              <input
                type="text"
                required
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                className="w-16 bg-zinc-900 border border-zinc-805 rounded-xl py-2 text-center text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="border-t border-zinc-900/60 pt-4">
            <label className="text-xs text-zinc-400 block mb-1 font-bold text-amber-500">Nome do Administrador Responsável (Geral) *</label>
            <input
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-bold"
              placeholder="Ex: Akson Pereira"
            />
            <span className="text-[10px] text-zinc-500 font-mono mt-1 block">※ Esse nome será refletido na sua credencial e na assinatura técnica da plataforma de serviço.</span>
          </div>

          <div className="border-t border-zinc-900 pt-4">
            <label className="text-xs text-zinc-400 block mb-2 font-bold text-amber-500">Logomarca do Site da Empresa</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('logo-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="logo-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste sua Logo aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Suporta PNG, JPG, SVG ou WebP (Máx. 2MB)</span>
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Opção Direta por Link (ou se preferir colar uma imagem existente):</span>
                  <input
                    type="text"
                    value={logoStr}
                    onChange={(e) => setLogoStr(e.target.value)}
                    placeholder="Cole aqui o link direto da imagem (URL) se já possuir online"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preview Unit */}
              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização da Logo</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-2 relative overflow-hidden">
                  {logoStr ? (
                    <img
                      src={logoStr}
                      alt="Sua Logo"
                      className="max-w-full max-h-full object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center justify-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[9px] text-zinc-600 font-bold uppercase">Raio Padrão</span>
                    </div>
                  )}
                </div>
                {logoStr && (
                  <button
                    type="button"
                    onClick={() => setLogoStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Remover e usar padrão
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold text-amber-500">Logomarca Exclusiva dos Documentos PDF (Orçamento e Recibo)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragPdfActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragPdfActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragPdfActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragPdfActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoPdfUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragPdfActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('logo-pdf-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="logo-pdf-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoPdfUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a Logo do PDF aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Esta imagem será impressa exclusivamente nos arquivos PDF de Orçamentos e Recibos</span>
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Opção Direta por Link (ou se preferir colar uma imagem existente):</span>
                  <input
                    type="text"
                    value={logoPdfStr}
                    onChange={(e) => setLogoPdfStr(e.target.value)}
                    placeholder="Cole aqui o link da imagem (ou deixe em branco para herdar a logo principal acima)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preview Unit */}
              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização PDF</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-2 relative overflow-hidden font-sans">
                  {logoPdfStr ? (
                    <img
                      src={logoPdfStr}
                      alt="Logo do PDF"
                      className="max-w-full max-h-full object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : logoStr ? (
                    <div className="text-zinc-600 flex flex-col items-center justify-center text-center">
                      <img src={logoStr} alt="Herdada do Site" className="max-w-[40px] max-h-[40px] opacity-40 object-contain mb-1" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-zinc-500 uppercase tracking-tight">Usando Logo do Site</span>
                    </div>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center justify-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[9px] text-zinc-650 font-bold uppercase">Raio Padrão</span>
                    </div>
                  )}
                </div>
                {logoPdfStr && (
                  <button
                    type="button"
                    onClick={() => setLogoPdfStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar a mesma do site
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold text-amber-500">Logomarca Exclusiva do PDF de Agendamento de Visita</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragAgendamentoActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragAgendamentoActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragAgendamentoActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragAgendamentoActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoPdfAgendamentoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragAgendamentoActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('logo-agendamento-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="logo-agendamento-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoPdfAgendamentoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a Logo do PDF de Agendamento aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Esta imagem será impressa exclusivamente nos arquivos PDF de Confirmação de Agendamentos</span>
                </div>

                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Opção Direta por Link (ou se preferir colar uma imagem existente):</span>
                  <input
                    type="text"
                    value={logoPdfAgendamentoStr}
                    onChange={(e) => setLogoPdfAgendamentoStr(e.target.value)}
                    placeholder="Cole aqui o link da imagem (ou deixe em branco para herdar a logo principal do site)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização Agendamento</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-2 relative overflow-hidden font-sans">
                  {logoPdfAgendamentoStr ? (
                    <img
                      src={logoPdfAgendamentoStr}
                      alt="Logo Agendamento"
                      className="max-w-full max-h-full object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : logoStr ? (
                    <div className="text-zinc-600 flex flex-col items-center justify-center text-center">
                      <img src={logoStr} alt="Herdada do Site" className="max-w-[40px] max-h-[40px] opacity-40 object-contain mb-1" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-zinc-500 uppercase tracking-tight">Usando Logo do Site</span>
                    </div>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center justify-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[9px] text-zinc-650 font-bold uppercase">Raio Padrão</span>
                    </div>
                  )}
                </div>
                {logoPdfAgendamentoStr && (
                  <button
                    type="button"
                    onClick={() => setLogoPdfAgendamentoStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar a mesma do site
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold text-amber-500">Logomarca Exclusiva do PDF do Laudo Técnico de Obra</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragLaudoActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragLaudoActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragLaudoActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragLaudoActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleLogoPdfLaudoUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragLaudoActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('logo-laudo-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="logo-laudo-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoPdfLaudoUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a Logo do PDF de Laudo aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Esta imagem será impressa exclusivamente nos arquivos PDF de Laudos Técnicos</span>
                </div>

                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Opção Direta por Link (ou se preferir colar uma imagem existente):</span>
                  <input
                    type="text"
                    value={logoPdfLaudoStr}
                    onChange={(e) => setLogoPdfLaudoStr(e.target.value)}
                    placeholder="Cole aqui o link da imagem (ou deixe em branco para herdar a logo principal do site)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização Laudo</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-2 relative overflow-hidden font-sans">
                  {logoPdfLaudoStr ? (
                    <img
                      src={logoPdfLaudoStr}
                      alt="Logo Laudo"
                      className="max-w-full max-h-full object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : logoStr ? (
                    <div className="text-zinc-600 flex flex-col items-center justify-center text-center">
                      <img src={logoStr} alt="Herdada do Site" className="max-w-[40px] max-h-[40px] opacity-40 object-contain mb-1" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-zinc-500 uppercase tracking-tight">Usando Logo do Site</span>
                    </div>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center justify-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[9px] text-zinc-650 font-bold uppercase">Raio Padrão</span>
                    </div>
                  )}
                </div>
                {logoPdfLaudoStr && (
                  <button
                    type="button"
                    onClick={() => setLogoPdfLaudoStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar a mesma do site
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-2 font-bold text-amber-500">Logomarca do Favicon (Ícone das Abas do Navegador)</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragFaviconActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragFaviconActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragFaviconActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragFaviconActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFaviconUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragFaviconActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('favicon-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="favicon-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFaviconUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a Logo do Favicon aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Esta imagem compacta será exibida como ícone do site nas abas do navegador</span>
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Opção Direta por Link (ou se preferir colar uma imagem existente):</span>
                  <input
                    type="text"
                    value={faviconStr}
                    onChange={(e) => setFaviconStr(e.target.value)}
                    placeholder="Cole aqui o link da imagem (ou deixe em branco para herdar a logo principal acima)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preview Unit */}
              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização Favicon</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-2 relative overflow-hidden font-sans">
                  {faviconStr ? (
                    <img
                      src={faviconStr}
                      alt="Logo do Favicon"
                      className="max-w-[48px] max-h-[48px] object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : logoStr ? (
                    <div className="text-zinc-600 flex flex-col items-center justify-center text-center">
                      <img src={logoStr} alt="Herdada do Site" className="max-w-[28px] max-h-[28px] opacity-40 object-contain mb-1" referrerPolicy="no-referrer" />
                      <span className="text-[8px] text-zinc-500 uppercase tracking-tight">Herdada do Site</span>
                    </div>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center justify-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[9px] text-zinc-650 font-bold uppercase">Padrão</span>
                    </div>
                  )}
                </div>
                {faviconStr && (
                  <button
                    type="button"
                    onClick={() => setFaviconStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar a mesma do site
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Banner Hero Custom Option with format constraints */}
          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-1 font-bold text-amber-500">Imagem de Banner Principal do Site (Hero Banner)</label>
            <span className="text-[10px] text-zinc-550 block mb-3 font-mono">
              ※ REQUISITO DE FORMATO: Para melhor visualização e evitar cortes, o banner do site deve ser em formato <span className="text-amber-500 font-bold">Paisagem/Horizontal (proporção de 16:9)</span>, com resolução ideal de <span className="text-white font-bold">1920x1080px</span> ou superior. Formatos aceitos: <span className="text-zinc-300">PNG, JPG, WebP ou SVG</span>.
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragBannerActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragBannerActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragBannerActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragBannerActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleBannerHeroUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragBannerActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('banner-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="banner-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBannerHeroUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a sua Imagem do Banner aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Foco Paisagem Horizontal (Proporção Recomendada: 16:9, Máx. 3MB)</span>
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Ou use um link direto de imagem online:</span>
                  <input
                    type="text"
                    value={bannerHeroStr}
                    onChange={(e) => setBannerHeroStr(e.target.value)}
                    placeholder="Cole aqui o link direto da imagem do banner (URL)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preview Unit */}
              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização do Banner</span>
                <div className="w-full aspect-[16/9] bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-1 relative overflow-hidden">
                  {bannerHeroStr ? (
                    <img
                      src={bannerHeroStr}
                      alt="Novo Banner Hero"
                      className="w-full h-full object-cover rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : (
                    <div className="text-zinc-650 flex flex-col items-center justify-center p-2 text-center">
                      <Image className="w-6 h-6 mb-1 text-zinc-700" />
                      <span className="text-[8.5px] text-zinc-600 font-bold uppercase block leading-tight">Imagem Padrão Ativa</span>
                      <span className="text-[8px] text-zinc-600 block mt-0.5 mt-1 leading-normal">(Eletricista Certificado AGE)</span>
                    </div>
                  )}
                </div>
                {bannerHeroStr && (
                  <button
                    type="button"
                    onClick={() => setBannerHeroStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar imagem padrão do sistema
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* About Section Profile Image Custom Option */}
          <div className="border-t border-zinc-900 pt-5">
            <label className="text-xs text-zinc-400 block mb-1 font-bold text-amber-500">Imagem de Perfil do Profissional (Seção Sobre)</label>
            <span className="text-[10px] text-zinc-550 block mb-3 font-mono">
              ※ REQUISITO DE FORMATO: Esta foto é exibida na seção "Sobre" do site. Formato recomendado: <span className="text-amber-500 font-bold">Quadrado ou Retângulo Vertical (proporção de 1:1 ou 3:4)</span>. Formatos aceitos: <span className="text-zinc-300">PNG, JPG, WebP ou SVG</span>.
            </span>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                {/* Drag and Drop Zone */}
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragSobreActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragSobreActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragSobreActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragSobreActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFotoSobreUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative flex flex-col items-center justify-center min-h-[110px] ${
                    dragSobreActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                  }`}
                  onClick={() => document.getElementById('sobre-file-picker')?.click()}
                >
                  <input
                    type="file"
                    id="sobre-file-picker"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFotoSobreUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Upload className="w-5 h-5 text-amber-500 mb-1.5" />
                  <span className="text-[11px] font-bold text-white block">Arraste a sua Imagem Profissional aqui ou Clique para Selecionar</span>
                  <span className="text-[9px] text-zinc-500 block mt-0.5">Foco Retrato/Quadrado (Proporção Recomendada: 1:1, Máx. 3MB)</span>
                </div>

                {/* Alternative URL Input */}
                <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                  <span className="block mb-1 font-sans text-xs text-zinc-400">Ou use um link direto de imagem online:</span>
                  <input
                    type="text"
                    value={fotoSobreStr}
                    onChange={(e) => setFotoSobreStr(e.target.value)}
                    placeholder="Cole aqui o link direto da foto do profissional (URL)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-3 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Preview Unit */}
              <div className="bg-zinc-900/55 rounded-xl border border-zinc-800 flex flex-col items-center justify-center p-4">
                <span className="text-[10px] text-zinc-500 font-mono uppercase mb-2 tracking-wider">Visualização Perfil</span>
                <div className="w-24 h-24 bg-black/40 rounded-lg border border-zinc-950 flex items-center justify-center p-1 relative overflow-hidden">
                  {fotoSobreStr ? (
                    <img
                      src={fotoSobreStr}
                      alt="Nova Foto Profissional"
                      className="w-full h-full object-cover rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlZjQ0NDQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48bGluZSB4MT0iMTgiIHkxPSI2IiB4Mj0iNiIgeTI9IjE4Ij48L2xpbmU+PGxpbmUgeDE9IjYiIHkxPSI2IiB4Mj0iMTgiIHkyPSIxOCI+PC9saW5lPjwvc3ZnPg==';
                      }}
                    />
                  ) : (
                    <div className="text-zinc-650 flex flex-col items-center justify-center p-2 text-center">
                      <Image className="w-5 h-5 mb-1 text-zinc-700" />
                      <span className="text-[7.5px] text-zinc-600 font-bold uppercase block leading-tight">Imagem Padrão Ativa</span>
                    </div>
                  )}
                </div>
                {fotoSobreStr && (
                  <button
                    type="button"
                    onClick={() => setFotoSobreStr('')}
                    className="mt-2 text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-0.5 px-2 rounded border border-red-500/20 transition"
                  >
                    Usar imagem padrão do sistema
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Unit 2: Operational Contacts */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Smartphone className="w-4 h-4 text-amber-500" /> Canais Oficiais de Atendimento ao Público
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">E-mail de Suporte Digital *</label>
              <input
                type="email"
                required
                value={emailStr}
                onChange={(e) => setEmailStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Telefone Comercial / Sede *</label>
              <input
                type="text"
                required
                value={phoneStr}
                onChange={(e) => setPhoneStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Celular de Envio WhatsApp (Formato API) *</label>
              <input
                type="text"
                required
                value={whatsappStr}
                onChange={(e) => setWhatsappStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                placeholder="Ex: 5511999999999"
              />
              <span className="text-[10px] text-zinc-550 font-mono block mt-1">※ Inclua o DDI (55) + DDD (Ex: 11) + número do celular sem hifens.</span>
            </div>
          </div>
        </div>

        {/* Unit 3: Financial defaults */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
            <CreditCard className="w-4 h-4 text-amber-500" /> Parâmetros Financeiros de Cobrança
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Chave Pix de Recebimento Corporativo *</label>
              <input
                type="text"
                required
                value={pixStr}
                onChange={(e) => setPixStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white font-mono"
                placeholder="Ex: CNPJ, celular ou chave aleatória"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Dados Bancários para DOC / TED alternativos</label>
              <input
                type="text"
                value={bankStr}
                onChange={(e) => setBankStr(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                placeholder="Ex: Inter (077) Ag: 0001 C/C: 123456-7"
              />
            </div>
          </div>
        </div>

        {/* Unit 4: PDF formatting defaults & terms */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2 border-b border-zinc-900 pb-3">
            <FileText className="w-4 h-4 text-amber-500" /> Layout dos Orçamentos e Termos Legais
          </h3>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Assinatura Digital de Referência (Diretoria)</label>
            <input
              type="text"
              value={signatureStr}
              onChange={(e) => setSignatureStr(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Texto Legal Padrão inserido nos Recibos</label>
            <textarea
              rows={3}
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1">Rodapé dos Documentos PDF A4</label>
            <input
              type="text"
              value={footerStr}
              onChange={(e) => setFooterStr(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Form save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold px-6 py-3 rounded-xl transition text-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> SALVAR PARÂMETROS GERAIS
          </button>
        </div>

      </form>

    </div>
  );
}
