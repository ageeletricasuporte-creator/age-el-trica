import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  RefreshCw,
  LogOut,
  AlertCircle,
  CheckCircle,
  Maximize2,
  User,
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  authenticateGmail,
  getGmailToken,
  setGmailToken,
  listGmailMessages,
  sendGmailMessage,
  GmailMessage
} from '../../lib/gmailService';
import { Cliente, ConfiguracaoEmpresa } from '../../types';

interface AdminGmailProps {
  clients: Cliente[];
  config: ConfiguracaoEmpresa;
}

export function AdminGmail({ clients, config }: AdminGmailProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selected email for viewing details
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null);

  // Compose State
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingCompose, setSendingCompose] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Sync token from memory cache on startup
  useEffect(() => {
    const token = getGmailToken();
    if (token) {
      setIsConnected(true);
      fetchInbox(token);
    }
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const { accessToken } = await authenticateGmail();
      setIsConnected(true);
      fetchInbox(accessToken);
    } catch (err: any) {
      console.error('Gmail Authorization error:', err);
      setError(err.message || 'Falha ao autenticar com o Google Gmail.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setGmailToken(null);
    setIsConnected(false);
    setMessages([]);
    setSelectedMessage(null);
  };

  const fetchInbox = async (tokenOverride?: string) => {
    const token = tokenOverride || getGmailToken();
    if (!token) return;

    setLoadingEmails(true);
    setError(null);
    try {
      const msgs = await listGmailMessages(12);
      setMessages(msgs);
    } catch (err: any) {
      console.error('Fetch inbox error:', err);
      // If unauthorized, token might have expired, reset connection
      if (err.message?.includes('401') || err.message?.includes('unauthorized') || err.message?.includes('Token')) {
        handleDisconnect();
        setError('Sessão do Google expirou. Por favor, reconecte sua conta.');
      } else {
        setError('Não foi possível carregar a caixa de entrada do Gmail.');
      }
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      setError('Por favor, informe o destinatário.');
      return;
    }
    if (!composeSubject.trim()) {
      setError('Por favor, informe o assunto do e-mail.');
      return;
    }
    if (!composeBody.trim()) {
      setError('O corpo do e-mail não pode ficar em branco.');
      return;
    }

    setSendingCompose(true);
    setError(null);
    setSendSuccess(false);

    try {
      // Build clean HTML layout with AGE Elétrica branding
      const formattedHtml = `
        <div style="background-color: #0c0c0c; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 40px 30px; border-radius: 16px; border-top: 6px solid #f2b705; max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #f2b705; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 5px 0;">${config.nomeFantasia}</h1>
            <span style="color: #888; font-size: 11px; font-weight: bold; text-transform: uppercase;">Central Elétrica Comercial</span>
          </div>
          <div style="background-color: #141414; padding: 25px; border-radius: 12px; border: 1px solid #222; margin-bottom: 25px; font-size: 14px; line-height: 1.6; color: #dfdfdf;">
            ${composeBody.replace(/\n/g, '<br />')}
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #222; color: #666; font-size: 11px;">
            Este e-mail corporativo foi autenticado e disparado pela central da <strong>${config.nomeEmpresa}</strong>.<br />
            Telefone de Suporte: ${config.telefone} | WhatsApp: ${config.whatsapp}<br />
            Endereço: ${config.endereco}
          </div>
        </div>
      `;

      await sendGmailMessage(composeTo, composeSubject, formattedHtml);
      setSendSuccess(true);
      setComposeSubject('');
      setComposeBody('');
      // Refresh inbox to see sync
      fetchInbox();
    } catch (err: any) {
      console.error('Send message error:', err);
      setError(err.message || 'Erro ao disparar mensagem.');
    } finally {
      setSendingCompose(false);
    }
  };

  const handleSelectClient = (clientEmail: string) => {
    setComposeTo(clientEmail);
  };

  return (
    <div className="space-y-6">
      {/* Tab Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-500 animate-pulse" /> Integração com Gmail Corporativo
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Utilize seus acessos autorizados do Google Workspace para gerenciar de forma 100% nativa o envio de laudos técnicos, confirmações e históricos de e-mails da <strong className="text-white">AGE Elétrica</strong>.
          </p>
        </div>

        {isConnected && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchInbox()}
              disabled={loadingEmails}
              className="bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-white rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-500 ${loadingEmails ? 'animate-spin' : ''}`} />
              {loadingEmails ? 'Atualizando...' : 'Atualizar Caixa'}
            </button>
            <button
              onClick={handleDisconnect}
              className="bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Desconectar Conta
            </button>
          </div>
        )}
      </div>

      {/* Global Errors Alert */}
      {error && (
        <div className="bg-red-500/15 border-l-4 border-red-500 text-red-200 text-xs p-4 rounded-r-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-red-400">Falha na Operação:</span>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Connection State */}
      {!isConnected ? (
        <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-905 rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-[#f2b705]/10 border-2 border-[#f2b705]/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Mail className="w-8 h-8 text-[#f2b705]" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-extrabold text-white uppercase tracking-wider">
              Conecte sua Caixa de Entrada Gmail
            </h3>
            <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
              Para liberar o disparo profissional, visualização de conversas e responder dúvidas técnicas diretamente pela ferramenta corporativa, autorize a autenticação segura do Google.
            </p>
          </div>

          <div className="bg-zinc-900/60 rounded-xl p-4 max-w-md mx-auto border border-zinc-850/40 text-left space-y-2">
            <div className="flex gap-2 items-start text-[11px] text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Envio de Laudos e confirmações com seu email pessoal ou administrativo.</span>
            </div>
            <div className="flex gap-2 items-start text-[11px] text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Sem limites de SMTP e sem perigo de cair na caixa de spam como servidores virtuais.</span>
            </div>
            <div className="flex gap-2 items-start text-[11px] text-zinc-400">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Segurança SSL blindada por infraestrutura direta via Google OAuth API.</span>
            </div>
          </div>

          <div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="gsi-material-button text-black bg-white hover:bg-neutral-50 border border-neutral-200 transition font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#4285F4]" />
              ) : (
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
              )}
              <span className="text-zinc-900 font-extrabold uppercase tracking-wide text-[11px]">
                {isConnecting ? 'Autenticando...' : 'Conectar Gmail da AGE Elétrica'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Block: Inbox email history list */}
          <div className="lg:col-span-7 bg-zinc-950 border border-zinc-905 rounded-2xl p-5 shadow-xl min-h-[580px] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-black">
                  Caixa de Entrada Vinculada
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {messages.length} mensagens sincronizadas
              </span>
            </div>

            {loadingEmails ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
                <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
                <p className="text-xs text-zinc-400 font-mono">Lendo dados de e-mail do Google...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Mail className="w-8 h-8 text-zinc-700 block mb-2" />
                <h4 className="text-zinc-400 text-xs font-bold uppercase">Caixa de entrada vazia</h4>
                <p className="text-zinc-500 text-[10px] max-w-xs leading-normal">
                  Não localizamos mensagens nesta caixa de entrada. Clique em Atualizar no canto superior.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[500px] flex-1 pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMessage(m)}
                    className="bg-zinc-900/40 border border-zinc-900 hover:border-amber-500/40 hover:bg-zinc-900/80 transition rounded-xl p-3.5 cursor-pointer text-left relative group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono text-amber-500 font-bold block">
                          De: {m.senderName || m.senderEmail}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-amber-400 transition">
                          {m.subject || '(Sem Assunto)'}
                        </h4>
                      </div>
                      <span className="text-[9px] text-zinc-650 shrink-0 font-mono mt-0.5">
                        {m.date.split(',')[1]?.split(' ')[1] || m.date.slice(0, 15)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-mono truncate mt-1.5 leading-normal">
                      {m.snippet}
                    </p>
                    <div className="absolute right-3.5 bottom-3 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[9px] text-amber-500 font-bold uppercase tracking-wider">
                      Ler <Maximize2 className="w-2.5 h-2.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Block: Direct email dispatch Suite */}
          <div className="lg:col-span-5 bg-zinc-950 border border-zinc-905 rounded-2xl p-5 shadow-xl">
            <div className="border-b border-zinc-900 pb-4 mb-4">
              <h3 className="text-xs uppercase tracking-wider text-zinc-300 font-black flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-amber-500" /> Nova Mensagem Corporativa
              </h3>
            </div>

            {sendSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl mb-4 flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] text-emerald-200 font-bold">
                  E-mail enviado com total sucesso de forma nativa!
                </span>
              </div>
            )}

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Client Autocomplete Select Dropdown */}
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1 font-bold uppercase tracking-wide">
                  Selecione um Cliente cadastrado
                </label>
                <select
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white"
                >
                  <option value="">-- Escolher destinatário registrado --</option>
                  {clients.filter(c => c.email).map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.nomeCompleto.toUpperCase()} ({c.email})
                    </option>
                  ))}
                </select>
                <div className="text-[9px] text-zinc-550 mt-1 flex items-start gap-1">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>Selecione para autopreencher o campo de destino abaixo.</span>
                </div>
              </div>

              {/* Destination email */}
              <div>
                <label className="text-[10px] text-zinc-450 block mb-1 font-bold uppercase tracking-wide">
                  E-mail do Destinatário
                </label>
                <input
                  type="email"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white font-mono"
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-[10px] text-zinc-450 block mb-1 font-bold uppercase tracking-wide">
                  Assunto do E-mail
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Orçamento de Serviço Técnico - AGE Elétrica"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                  required
                />
              </div>

              {/* Email Body Message */}
              <div>
                <label className="text-[10px] text-zinc-450 block mb-1 font-bold uppercase tracking-wide">
                  Corpo da Mensagem (Texto Simples ou Parágrafos)
                </label>
                <textarea
                  rows={8}
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Escreva aqui os detalhes profissionais da sua mensagem..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white leading-relaxed focus:border-amber-500 transition"
                  required
                ></textarea>
                <span className="text-[9px] font-mono text-zinc-600 block mt-1">
                  ※ Rodapé oficial com links e CNPJ da AGE Elétrica será adicionado automaticamente.
                </span>
              </div>

              <button
                type="submit"
                disabled={sendingCompose}
                className="w-full bg-[#f2b705] hover:bg-[#d9a304] text-black font-extrabold uppercase tracking-widest py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                {sendingCompose ? 'Enviando...' : 'Disparar E-mail Gmail'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Selected Email Reader Detailed View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-2xl w-full flex flex-col max-h-[85vh] shadow-2xl relative">
            {/* Modal header */}
            <div className="p-5 border-b border-zinc-900 flex justify-between items-start">
              <div>
                <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider block">
                  De: {selectedMessage.senderName} ({selectedMessage.senderEmail})
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1 leading-snug">
                  {selectedMessage.subject || '(Sem Assunto)'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg p-1.5 text-xs transition cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-left">
              <span className="inline-block text-[9px] font-mono text-zinc-600 bg-zinc-900 py-1 px-2.5 rounded-md">
                Data Oficial: {selectedMessage.date}
              </span>
              
              <div 
                className="text-xs text-zinc-300 leading-relaxed font-sans prose prose-invert bg-zinc-900/20 p-4 rounded-xl border border-zinc-900 whitespace-pre-wrap max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-900 flex justify-end gap-2">
              <button
                onClick={() => {
                  setComposeTo(selectedMessage.senderEmail);
                  setComposeSubject(`Re: ${selectedMessage.subject}`);
                  setSelectedMessage(null);
                  // Focus compose to email is handled implicitly since form is rendered
                }}
                className="bg-zinc-900 border border-zinc-800 hover:border-amber-500 text-white rounded-xl py-2 px-4.5 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                Responder de Volta <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
