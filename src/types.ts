/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type NivelAcesso = 'Administrador' | 'Atendente' | 'Tecnico/Eletricista';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash: string; // Plaintext representation for simulation
  nivelAcesso: NivelAcesso;
  telefone: string;
  status: 'Ativo' | 'Inativo';
  dataCriacao: string;
  ultimoAcesso: string;
  precisaMudarSenha?: boolean; // Se true, solicita alteração de senha no primeiro acesso
}

export type TipoCliente = 'Residencial' | 'Comercial' | 'Industrial' | 'Condomínio';

export interface Cliente {
  id: string;
  nomeCompleto: string;
  cpfCnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  enderecoCompleto: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  tipoCliente: TipoCliente;
  observacoes: string;
  dataCadastro: string;
  statusCliente: 'Ativo' | 'Inativo';
}

export type UnidadeCobranca = 'serviço' | 'hora' | 'metro' | 'ponto' | 'visita' | 'diária';

export interface Servico {
  id: string;
  nomeServico: string;
  categoria: string;
  descricao: string;
  precoBase: number;
  unidadeCobranca: UnidadeCobranca;
  tempoMedio: string;
  status: 'Ativo' | 'Inativo';
  observacoesTecnicas: string;
}

export type StatusOrcamento = 'Em análise' | 'Enviado' | 'Aprovado' | 'Recusado' | 'Cancelado' | 'Finalizado';

export interface Orcamento {
  id: string;
  numeroOrcamento: string; // Ex: AGE-ORC-0001
  clienteId: string;
  dataOrcamento: string;
  validadeOrcamento: string;
  responsavelOrcamento: string;
  status: StatusOrcamento;
  descricaoGeral: string;
  localServico: string;
  formaPagamento: string;
  prazoExecucao: string;
  observacoes: string;
  subtotal: number;
  desconto: number;
  valorTotal: number;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface ItemOrcamento {
  id: string;
  orcamentoId: string;
  servicoId: string;
  descricaoItem: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
  observacaoItem: string;
}

export type StatusRecibo = 'Pago' | 'Parcial' | 'Cancelado';

export interface Recibo {
  id: string;
  numeroRecibo: string; // Ex: AGE-REC-0001
  clienteId: string;
  orcamentoId: string;
  dataEmissao: string;
  valorRecebido: number;
  formaPagamento: string;
  referenteServico: string;
  responsavelRecebimento: string;
  observacoes: string;
  status: StatusRecibo;
  assinaturaResponsavel: string;
  dataCriacao: string;
}

export interface Pagamento {
  id: string;
  clienteId: string;
  orcamentoId: string;
  reciboId: string;
  valor: number;
  formaPagamento: string;
  dataPagamento: string;
  status: 'Confirmado' | 'Pendente' | 'Cancelado';
  comprovante: string; // Base64 or mock filename
  observacoes: string;
}

export type StatusAtendimento = 'Agendado' | 'Em andamento' | 'Concluído' | 'Cancelado' | 'Reagendado';

export interface Atendimento {
  id: string;
  clienteId: string;
  orcamentoId: string;
  tecnicoResponsavel: string;
  dataAgendada: string;
  horario: string;
  status: StatusAtendimento;
  descricaoAtendimento: string;
  observacoesTecnicas: string;
  fotosAntes: string[]; // Base64 or mock path
  fotosDepois: string[]; // Base64 or mock path
  assinaturaCliente: string; // Base64 or styled digital signature
  dataFinalizacao: string;
}

export interface ConfiguracaoEmpresa {
  id: string;
  nomeEmpresa: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  email: string;
  endereco: string;
  cidade: string;
  estado: string;
  logo: string; // SVG or URL base64
  logoPdf?: string; // Exclusivo para PDFs (Orçamento e Recibo)
  logoPdfAgendamento?: string; // Exclusivo para o PDF de Agendamento de Visita
  logoPdfLaudo?: string; // Exclusivo para o PDF do Laudo Técnico de Obra
  backendApiUrl?: string; // URL do servidor backend para integrar chats e orçamentos em sites externos (Vercel, GitHub Pages)
  favicon?: string; // Logomarca do Favicon (abas do navegador)
  bannerHero?: string; // Banner Hero do site público
  fotoSobre?: string; // Foto da seção Sobre do site público
  corPrincipal: string; // Hex
  corSecundaria: string; // Hex
  chavePix: string;
  dadosBancarios: string;
  textoPadraoOrcamento: string;
  textoPadraoRecibo: string;
  assinaturaDigital: string;
  rodapePdf: string;
  nomeAdministrador?: string;
}

export type StatusSolicitacao = 'Novo' | 'Em atendimento' | 'Convertido em orçamento' | 'Recusado' | 'Finalizado';

export interface SolicitacaoPublica {
  id: string;
  nome: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
  cidade: string;
  tipoServico: string;
  descricaoProblema: string;
  foto: string; // Mock upload
  melhorHorario: string;
  dataSolicitacao: string;
  status: StatusSolicitacao;
}
