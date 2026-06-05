/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Usuario,
  Cliente,
  Servico,
  Orcamento,
  ItemOrcamento,
  Recibo,
  Pagamento,
  Atendimento,
  ConfiguracaoEmpresa,
  SolicitacaoPublica
} from './types';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import logoSvg from './assets/logo.svg';

// Seed Services
export const DEFAULT_SERVICES: Servico[] = [
  {
    id: 'srv-1',
    nomeServico: 'Instalações residenciais e apartamentos',
    categoria: 'Residencial',
    descricao: 'Redimensionamento completo, projetos de fiação, identificação e reorganização de quadros elétricos em residências e apartamentos.',
    precoBase: 350.00,
    unidadeCobranca: 'serviço',
    tempoMedio: '4 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Instalação feita em conformidade com as normas técnicas de segurança NBR 5410 com condutores antichama.'
  },
  {
    id: 'srv-2',
    nomeServico: 'Reparos elétricos gerais',
    categoria: 'Reparo',
    descricao: 'Localização imediata e correção de curtos-circuitos, tomadas danificadas, fiação superaquecida e troca de disjuntores.',
    precoBase: 120.00,
    unidadeCobranca: 'visita',
    tempoMedio: '1.5 hora',
    status: 'Ativo',
    observacoesTecnicas: 'Isolamento de falhas, teste de continuidade e substituição de componentes danificados utilizando equipamentos calibrados.'
  },
  {
    id: 'srv-3',
    nomeServico: 'Manutenção preventiva',
    categoria: 'Manutenção',
    descricao: 'Revisão periódica do quadro de distribuição, reaperto geral de conexões para evitar pontos quentes, testes de fuga de corrente e bom funcionamento de IDR/DPS.',
    precoBase: 180.00,
    unidadeCobranca: 'serviço',
    tempoMedio: '2 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Varredura de circuitos, identificação visual de fiação antiga e testes dinâmicos de isolamento.'
  },
  {
    id: 'srv-4',
    nomeServico: 'Instalação de câmeras CFTV',
    categoria: 'Segurança',
    descricao: 'Posicionamento, cabeamento estruturado e instalação inteligente de câmeras de segurança CFTV (IP ou analógicas) com configuração no seu smartphone.',
    precoBase: 250.00,
    unidadeCobranca: 'serviço',
    tempoMedio: '3 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Utilização de fontes estabilizadas blindadas e conectores de alta qualidade evitando perdas de sinal.'
  },
  {
    id: 'srv-5',
    nomeServico: 'Instalação de carregador veicular Wallbox',
    categoria: 'Recarga veicular',
    descricao: 'Criação de infraestrutura dedicada e instalação completa de estações de carregamento rápido (Wallbox) ou portáteis de alta eficiência para veículos elétricos.',
    precoBase: 850.00,
    unidadeCobranca: 'serviço',
    tempoMedio: '4 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Dimensionamento correto de cabos condutores de alta isolação elétrica, disjuntores dedicados e DPS.'
  },
  {
    id: 'srv-6',
    nomeServico: 'Instalação de ar condicionado',
    categoria: 'Climatização',
    descricao: 'Alimentação elétrica dedicada direta do quadro geral para o ar condicionado (split), incluindo cabeamento adequado, canalização e disjuntor exclusivo.',
    precoBase: 220.00,
    unidadeCobranca: 'ponto',
    tempoMedio: '2 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Uso de fiação adequada para a potência correspondente de BTUs escolhida pelo cliente.'
  },
  {
    id: 'srv-7',
    nomeServico: 'Automação residencial',
    categoria: 'Automação',
    descricao: 'Deixe sua casa inteligente! Instalação de interruptores Wi-Fi/Zigbee, módulos para portão eletrônico, controle smart de lâmpadas LED e automotizores compatíveis com Alexa e Google Home.',
    precoBase: 300.00,
    unidadeCobranca: 'serviço',
    tempoMedio: '3 horas',
    status: 'Ativo',
    observacoesTecnicas: 'Vinculação com redes sem fio locais e aplicativos para controle remoto centralizado.'
  }
];

// Seed Users
export const DEFAULT_USERS: Usuario[] = [
  {
    id: 'usr-1',
    nome: 'Akson Pereira',
    email: 'ageeletricasuporte@gmail.com', // Logged in user email is provided as ageeletricasuporte@gmail.com
    senhaHash: '1234',
    nivelAcesso: 'Administrador',
    telefone: '(84) 99888-7766',
    status: 'Ativo',
    dataCriacao: '2026-01-10T12:00:00Z',
    ultimoAcesso: '2026-06-04T04:20:00Z'
  },
  {
    id: 'usr-2',
    nome: 'Fernanda Lima',
    email: 'atendente@ageeletrica.com.br',
    senhaHash: 'atendente',
    nivelAcesso: 'Atendente',
    telefone: '(11) 98765-1234',
    status: 'Ativo',
    dataCriacao: '2026-02-15T14:30:00Z',
    ultimoAcesso: '2026-06-03T18:45:00Z'
  },
  {
    id: 'usr-3',
    nome: 'Carlos Silva (Eletricista)',
    email: 'tecnico@ageeletrica.com.br',
    senhaHash: 'tecnico',
    nivelAcesso: 'Tecnico/Eletricista',
    telefone: '(11) 97777-6655',
    status: 'Ativo',
    dataCriacao: '2026-03-01T08:00:00Z',
    ultimoAcesso: '2026-06-04T01:30:00Z'
  }
];

// Seed Clients
export const DEFAULT_CLIENTS: Cliente[] = [
  {
    id: 'cli-1',
    nomeCompleto: 'Dr. Roberto de Souza Santos',
    cpfCnpj: '123.456.789-00',
    telefone: '(11) 2233-4455',
    whatsapp: '(11) 91234-5678',
    email: 'roberto.santos@gmail.com',
    enderecoCompleto: 'Alameda das Flores',
    numero: '450',
    complemento: 'Apto 122 Bloco B',
    bairro: 'Jardins',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-000',
    tipoCliente: 'Residencial',
    observacoes: 'Cliente extremamente exigente. Chuveiro de alta potência liofilizado na suíte master.',
    dataCadastro: '2026-04-12T10:00:00Z',
    statusCliente: 'Ativo'
  },
  {
    id: 'cli-2',
    nomeCompleto: 'Supermercado Nova Esperança Ltda',
    cpfCnpj: '22.333.444/0001-55',
    telefone: '(11) 3300-8800',
    whatsapp: '(11) 92345-6789',
    email: 'financeiro@supernovaesperanca.com',
    enderecoCompleto: 'Avenida Celso Garcia',
    numero: '2100',
    complemento: 'Térreo - Galpão Comercial',
    bairro: 'Brás',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '03001-000',
    tipoCliente: 'Comercial',
    observacoes: 'Quadro elétrico trifásico com falha intermitente nos freezers. Necessita verificação urgente.',
    dataCadastro: '2026-04-20T15:20:00Z',
    statusCliente: 'Ativo'
  },
  {
    id: 'cli-3',
    nomeCompleto: 'Condomínio Residencial Bella Vista',
    cpfCnpj: '33.444.555/0001-66',
    telefone: '(11) 2900-5500',
    whatsapp: '(11) 93456-7890',
    email: 'bellavista.sindico@yahoo.com.br',
    enderecoCompleto: 'Rua das Oliveiras',
    numero: '85',
    complemento: 'Sindical / Entrada Principal',
    bairro: 'Morumbi',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05600-100',
    tipoCliente: 'Condomínio',
    observacoes: 'Instalação de carregadores veiculares Wallbox nas garagens subsolo das torres A e B.',
    dataCadastro: '2026-05-02T11:45:00Z',
    statusCliente: 'Ativo'
  },
  {
    id: 'cli-4',
    nomeCompleto: 'Mariana Peixoto Ramos',
    cpfCnpj: '444.555.666-88',
    telefone: '(11) 4412-8811',
    whatsapp: '(11) 94567-8901',
    email: 'mari.peixoto@outlook.com',
    enderecoCompleto: 'Rua Heitor Penteado',
    numero: '1240',
    complemento: 'Casa 3 Corredor lateral',
    bairro: 'Sumaré',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '05438-000',
    tipoCliente: 'Residencial',
    observacoes: 'Reforma elétrica geral do quadro antigo de disjuntores tipo NEMA para modelo padrão DIN.',
    dataCadastro: '2026-05-15T09:15:00Z',
    statusCliente: 'Ativo'
  }
];

// Seed Configuration
export const DEFAULT_CONFIG: ConfiguracaoEmpresa = {
  id: 'cfg-default',
  nomeEmpresa: 'AGE ELÉTRICA SERVIÇOS LTDA',
  nomeFantasia: 'AGE Elétrica',
  cnpj: '45.123.678/0001-90',
  telefone: '(84) 98765-4321',
  whatsapp: '(84) 98765-4321',
  email: 'contato@ageeletrica.com.br',
  endereco: 'Av. Engenheiro Roberto Freire, 1200 - Capim Macio',
  cidade: 'Natal',
  estado: 'RN',
  logo: logoSvg, // Elegant responsive SVG representation
  logoPdf: logoSvg, // Exclusivo para PDFs
  bannerHero: '', // Banner Hero do site público
  fotoSobre: '', // Foto da seção Sobre do site público
  corPrincipal: '#f59e0b', // Yellow Amber
  corSecundaria: '#0f172a', // Slate Dark gray
  chavePix: '45.123.678/0001-90',
  dadosBancarios: 'Banco Itaú - Agência 1234 - Conta Corrente 56789-0',
  textoPadraoOrcamento: 'Este orçamento foi elaborado com base nas informações fornecidas pelo cliente e poderá sofrer alterações caso sejam identificadas necessidades adicionais durante a execução do serviço. A AGE Elétrica trabalha com segurança, responsabilidade e compromisso técnico em todos os atendimentos.',
  textoPadraoRecibo: 'Declaramos para os devidos fins que recebemos o valor informado neste recibo, referente aos serviços elétricos prestados pela AGE Elétrica.',
  assinaturaDigital: 'Akson Pereira - Diretor Técnico AGE Elétrica',
  rodapePdf: 'AGE Elétrica | Instalações e Manutenção Elétrica de Alta Performance | CNPJ: 45.123.678/0001-90 | www.ageeletrica.com.br',
  nomeAdministrador: 'Akson Pereira'
};

// Seed Budgets / Orçamentos
export const DEFAULT_BUDGETS: Orcamento[] = [
  {
    id: 'orc-1',
    numeroOrcamento: 'AGE-ORC-0001',
    clienteId: 'cli-1',
    dataOrcamento: '2026-05-20',
    validadeOrcamento: '2026-06-20',
    responsavelOrcamento: 'Geraldo Fonseca',
    status: 'Finalizado',
    descricaoGeral: 'Instalação de Chuveiro Elétrico de alta performance 7800W na suíte máster com troca de disjuntor de proteção.',
    localServico: 'Alameda das Flores, 450 - Apto 122 Bloco B, Jardins - São Paulo/SP',
    formaPagamento: 'Pix',
    prazoExecucao: '1 dia',
    observacoes: 'Fiação pré-existente compatível de 6mm² de cobre. Ligação perfeita e barramento reapertado.',
    subtotal: 230.00,
    desconto: 30.00,
    valorTotal: 200.00,
    dataCriacao: '2026-05-20T10:00:00Z',
    dataAtualizacao: '2026-05-21T18:00:00Z'
  },
  {
    id: 'orc-2',
    numeroOrcamento: 'AGE-ORC-0002',
    clienteId: 'cli-3',
    dataOrcamento: '2026-05-28',
    validadeOrcamento: '2026-06-28',
    responsavelOrcamento: 'Geraldo Fonseca',
    status: 'Aprovado',
    descricaoGeral: 'Instalação de 2 estações de recarga rápida para veículos elétricos (Wallbox 22kW) incluindo passagem de cabos blindados de 10mm² do quadro geral subsolo até as vagas 43 e 44.',
    localServico: 'Rua das Oliveiras, 85, Morumbi - São Paulo/SP',
    formaPagamento: 'Cartão de crédito parcelado (3x)',
    prazoExecucao: '3 dias',
    observacoes: 'Instalação de DPS exclusivos e IDR classe A em caixa blindada de sobrepor.',
    subtotal: 2500.00,
    desconto: 100.00,
    valorTotal: 2400.00,
    dataCriacao: '2026-05-28T14:00:00Z',
    dataAtualizacao: '2026-05-30T11:00:00Z'
  },
  {
    id: 'orc-3',
    numeroOrcamento: 'AGE-ORC-0003',
    clienteId: 'cli-4',
    dataOrcamento: '2026-06-01',
    validadeOrcamento: '2026-06-15',
    responsavelOrcamento: 'Fernanda Lima',
    status: 'Enviado',
    descricaoGeral: 'Montagem completa de novo Quadro de Distribuição de Circuitos (QDC) de 24 disjuntores atualizados padrão DIN com proteção DR de fuga e DPS de surto.',
    localServico: 'Rua Heitor Penteado, 1240 - Sumaré - São Paulo/SP',
    formaPagamento: 'Transf. bancária / Pix',
    prazoExecucao: '2 dias',
    observacoes: 'Material não incluso, a ser fornecido com acompanhamento técnico da AGE.',
    subtotal: 1100.00,
    desconto: 50.00,
    valorTotal: 1050.00,
    dataCriacao: '2026-06-01T09:00:00Z',
    dataAtualizacao: '2026-06-01T10:30:00Z'
  }
];

// Seed Budget Items
export const DEFAULT_BUDGET_ITEMS: ItemOrcamento[] = [
  {
    id: 'item-1',
    orcamentoId: 'orc-1',
    servicoId: 'srv-1',
    descricaoItem: 'Instalação de chuveiro elétrico na suíte principal',
    quantidade: 1,
    unidade: 'serviço',
    valorUnitario: 150.00,
    valorTotal: 150.00,
    observacaoItem: 'Ducha Lorenzetti Advanced Turbofresh 220V'
  },
  {
    id: 'item-2',
    orcamentoId: 'orc-1',
    servicoId: 'srv-2',
    descricaoItem: 'Substituição de disjuntor monopolar antigo no QDC da casa',
    quantidade: 1,
    unidade: 'ponto',
    valorUnitario: 80.00,
    valorTotal: 80.00,
    observacaoItem: 'Substituição por disjuntor bipolar 40A Siemens DIN'
  },
  {
    id: 'item-3',
    orcamentoId: 'orc-2',
    servicoId: 'srv-14',
    descricaoItem: 'Instalação física e elétrica de estação Wallbox 22kW',
    quantidade: 2,
    unidade: 'serviço',
    valorUnitario: 950.00,
    valorTotal: 1900.00,
    observacaoItem: 'Equipamentos fornecidos pelo condomínio (marca WEG)'
  },
  {
    id: 'item-4',
    orcamentoId: 'orc-2',
    servicoId: 'srv-10',
    descricaoItem: 'Instalação de DPS de proteção contra surtos no circuito dos carregadores',
    quantidade: 2,
    unidade: 'ponto',
    valorUnitario: 120.00,
    valorTotal: 240.00,
    observacaoItem: 'DPS 275V Clamper'
  },
  {
    id: 'item-5',
    orcamentoId: 'orc-2',
    servicoId: 'srv-11',
    descricaoItem: 'Instalação de IDR para prevenção de choques adicionais',
    quantidade: 2,
    unidade: 'serviço',
    valorUnitario: 180.00,
    valorTotal: 360.00,
    observacaoItem: 'IDR Tetrapolar 40A 30mA Siemens'
  },
  {
    id: 'item-6',
    orcamentoId: 'orc-3',
    servicoId: 'srv-8',
    descricaoItem: 'Montagem completa de QDC residencial atualizado',
    quantidade: 1,
    unidade: 'serviço',
    valorUnitario: 650.00,
    valorTotal: 650.00,
    observacaoItem: 'Até 24 disjuntores residenciais'
  },
  {
    id: 'item-7',
    orcamentoId: 'orc-3',
    servicoId: 'srv-12',
    descricaoItem: 'Revisão elétrica preventiva com reaperto geral',
    quantidade: 1,
    unidade: 'visita',
    valorUnitario: 250.00,
    valorTotal: 250.00,
    observacaoItem: 'Varredura térmica nas tomadas de maior carga'
  },
  {
    id: 'item-8',
    orcamentoId: 'orc-3',
    servicoId: 'srv-11',
    descricaoItem: 'Instalação de DR geral',
    quantidade: 1,
    unidade: 'serviço',
    valorUnitario: 180.00,
    valorTotal: 180.00,
    observacaoItem: 'Dispositivo bipolar'
  }
];

// Seed Receipts / Recibos
export const DEFAULT_RECEIPTS: Recibo[] = [
  {
    id: 'rec-1',
    numeroRecibo: 'AGE-REC-0001',
    clienteId: 'cli-1',
    orcamentoId: 'orc-1',
    dataEmissao: '2026-05-21',
    valorRecebido: 200.00,
    formaPagamento: 'Pix',
    referenteServico: 'Serviço de instalação de chuveiro elétrico e troca de disjuntor de segurança',
    responsavelRecebimento: 'Geraldo Fonseca',
    observacoes: 'Garantia legal de 90 dias concedida a contar desta data.',
    status: 'Pago',
    assinaturaResponsavel: 'Geraldo Fonseca - AGE Elétrica',
    dataCriacao: '2026-05-21T18:10:00Z'
  }
];

// Seed Payments
export const DEFAULT_PAYMENTS: Pagamento[] = [
  {
    id: 'pag-1',
    clienteId: 'cli-1',
    orcamentoId: 'orc-1',
    reciboId: 'rec-1',
    valor: 200.00,
    formaPagamento: 'Pix',
    dataPagamento: '2026-05-21',
    status: 'Confirmado',
    comprovante: 'comprovante_pix_01239.pdf',
    observacoes: 'Recebido em conta jurídica Itaú.'
  }
];

// Seed Appointments / Atendimentos (Agenda)
export const DEFAULT_APPOINTMENTS: Atendimento[] = [
  {
    id: 'ate-1',
    clienteId: 'cli-1',
    orcamentoId: 'orc-1',
    tecnicoResponsavel: 'Carlos Silva (Eletricista)',
    dataAgendada: '2026-05-21',
    horario: '14:00',
    status: 'Concluído',
    descricaoAtendimento: 'Instalação de chuveiro térmico Lorenzetti Advanced na residência do Dr. Roberto de Souza Santos.',
    observacoesTecnicas: 'Pressurizador ativo funcionando. Fiação de 6mm conectada a conector cerâmico reforçado. Disjuntor trocado.',
    fotosAntes: ['https://images.unsplash.com/photo-1621905252507-b354bc25edac?w=400&auto=format&fit=crop&q=60'],
    fotosDepois: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=60'],
    assinaturaCliente: 'Roberto S. Santos',
    dataFinalizacao: '2026-05-21T15:30:00Z'
  },
  {
    id: 'ate-2',
    clienteId: 'cli-3',
    orcamentoId: 'orc-2',
    tecnicoResponsavel: 'Carlos Silva (Eletricista)',
    dataAgendada: '2026-06-08',
    horario: '09:00',
    status: 'Agendado',
    descricaoAtendimento: 'Montagem de infraestrutura e início da passagem dos condutores elétricos na garagem do Morumbi.',
    observacoesTecnicas: 'Separar eletroduto de PVC rígido paralelo e braçadeiras reforçadas.',
    fotosAntes: [],
    fotosDepois: [],
    assinaturaCliente: '',
    dataFinalizacao: ''
  },
  {
    id: 'ate-3',
    clienteId: 'cli-2',
    orcamentoId: '',
    tecnicoResponsavel: 'Carlos Silva (Eletricista)',
    dataAgendada: '2026-06-04',
    horario: '15:30',
    status: 'Em andamento',
    descricaoAtendimento: 'Visita emergencial para avaliar aquecimento excessivo e desarmamento automático de disjuntor principal dos condensadores e freezers do mercado.',
    observacoesTecnicas: 'Levar cabo reserva flexível de 16mm e disjuntor tripolar de 63A Curva C comercial.',
    fotosAntes: [],
    fotosDepois: [],
    assinaturaCliente: '',
    dataFinalizacao: ''
  }
];

// Seed Public Requests / Solicitações
export const DEFAULT_SOLICITATIONS: SolicitacaoPublica[] = [
  {
    id: 'sol-1',
    nome: 'Giselle Moura Antunes',
    whatsapp: '(11) 98012-3456',
    endereco: 'Rua Bela Cintra, 2040',
    bairro: 'Consolação',
    cidade: 'São Paulo',
    tipoServico: 'Instalação de Chuveiro Elétrico',
    descricaoProblema: 'Comprei uma ducha nova e preciso que faça a instalação correta e troque o fio que parece ser meio fino demais.',
    foto: '',
    melhorHorario: 'Manhã (08:00 às 12:00)',
    dataSolicitacao: '2026-06-03 16:30',
    status: 'Novo'
  },
  {
    id: 'sol-2',
    nome: 'Dra. Gisela Albuquerque',
    whatsapp: '(84) 99122-3844',
    endereco: 'Rua Potengi, 450',
    bairro: 'Petrópolis',
    cidade: 'Natal',
    tipoServico: 'Instalação de carregador veicular Wallbox',
    descricaoProblema: 'Comprei um novo carro elétrico e necessito fazer a instalação técnica e infraestrutura dedicada para o Wallbox na minha vaga de garagem.',
    foto: '',
    melhorHorario: 'Tarde (13:00 às 18:00)',
    dataSolicitacao: '2026-06-04 02:15',
    status: 'Em atendimento'
  }
];

// Safe Storage Utility to bypass iframe/third-party cookie/localstorage restrictions on mobile viewports
const isStorageAvailable = (() => {
  try {
    const x = '__storage_test__';
    localStorage.setItem(x, x);
    localStorage.removeItem(x);
    return true;
  } catch (e) {
    return false;
  }
})();

const memoryFallbackStorage: Record<string, string> = {};

export class SafeStorage {
  public static getItem(key: string): string | null {
    if (isStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        // Fallback below
      }
    }
    return memoryFallbackStorage[key] || null;
  }

  public static setItem(key: string, value: string): void {
    if (isStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        // Fallback below
      }
    }
    memoryFallbackStorage[key] = value;
  }
}

// Database Management Class
export class AgeEletricaDB {
  private static initKey = 'age_eletrica_db_initialized';
  private static subscribers: (() => void)[] = [];
  private static syncingCloud = false;
  private static listenersInitialized = false;

  public static subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private static notifySubscribers(): void {
    this.subscribers.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Subscriber notification error:', e);
      }
    });
  }

  public static initialize(): void {
    const isInitializedLocally = SafeStorage.getItem(this.initKey);
    if (!isInitializedLocally) {
      SafeStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
      SafeStorage.setItem('services', JSON.stringify(DEFAULT_SERVICES));
      SafeStorage.setItem('clients', JSON.stringify(DEFAULT_CLIENTS));
      SafeStorage.setItem('config', JSON.stringify(DEFAULT_CONFIG));
      SafeStorage.setItem('budgets', JSON.stringify(DEFAULT_BUDGETS));
      SafeStorage.setItem('budget_items', JSON.stringify(DEFAULT_BUDGET_ITEMS));
      SafeStorage.setItem('receipts', JSON.stringify(DEFAULT_RECEIPTS));
      SafeStorage.setItem('payments', JSON.stringify(DEFAULT_PAYMENTS));
      SafeStorage.setItem('appointments', JSON.stringify(DEFAULT_APPOINTMENTS));
      SafeStorage.setItem('solicitations', JSON.stringify(DEFAULT_SOLICITATIONS));
      SafeStorage.setItem(this.initKey, 'true');
    } else {
      // Ensure admin user ageeletricasuporte@gmail.com has correct default or migrated password
      try {
        const storedUsers = SafeStorage.getItem('users');
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          let modified = false;
          const updatedUsers = users.map((u: any) => {
            if (u.email && u.email.toLowerCase() === 'ageeletricasuporte@gmail.com') {
              if (u.senhaHash === 'Admin@123') {
                u.senhaHash = '1234';
                modified = true;
              }
              if (u.nome !== 'Akson Pereira') {
                u.nome = 'Akson Pereira';
                modified = true;
              }
            }
            return u;
          });
          if (modified) {
            SafeStorage.setItem('users', JSON.stringify(updatedUsers));
          }
        }

        // Also force update config location constraints (Natal / RN) if still set to São Paulo
        const storedConfig = SafeStorage.getItem('config');
        if (storedConfig) {
          const conf = JSON.parse(storedConfig);
          let modified = false;
          if (conf.cidade === 'São Paulo' || !conf.nomeAdministrador) {
            conf.cidade = 'Natal';
            conf.estado = 'RN';
            conf.endereco = 'Av. Engenheiro Roberto Freire, 1200 - Capim Macio';
            conf.nomeAdministrador = 'Akson Pereira';
            conf.assinaturaDigital = 'Akson Pereira - Diretor Técnico AGE Elétrica';
            modified = true;
          }
          if (!conf.logo || conf.logo === "" || conf.logo.includes("svg") === false) {
            conf.logo = logoSvg;
            conf.logoPdf = logoSvg;
            modified = true;
          }
          if (modified) {
            SafeStorage.setItem('config', JSON.stringify(conf));
          }
        }
      } catch (e) {
        console.error('Error during admin password migration:', e);
      }
    }

    // Connect to Firestore sync
    this.initFirebaseSync();
  }

  private static async checkAndSeedFirestore() {
    try {
      const configRef = doc(db, 'config', 'cfg-default');
      const configDoc = await getDoc(configRef);
      if (!configDoc.exists()) {
        console.log('Firestore empty. Seeding local default dataset to cloud...');
        await setDoc(configRef, DEFAULT_CONFIG);

        const seedCol = async (collectionName: string, items: any[]) => {
          for (const item of items) {
            await setDoc(doc(db, collectionName, item.id), item);
          }
        };

        await seedCol('users', DEFAULT_USERS);
        await seedCol('services', DEFAULT_SERVICES);
        await seedCol('clients', DEFAULT_CLIENTS);
        await seedCol('budgets', DEFAULT_BUDGETS);
        await seedCol('budget_items', DEFAULT_BUDGET_ITEMS);
        await seedCol('receipts', DEFAULT_RECEIPTS);
        await seedCol('payments', DEFAULT_PAYMENTS);
        await seedCol('appointments', DEFAULT_APPOINTMENTS);
        await seedCol('solicitations', DEFAULT_SOLICITATIONS);
        console.log('Firebase Cloud database populated successfully!');
      } else {
        // Force update cloud logo if empty or non-svg on cloud config
        const cloudConfigData = configDoc.data();
        if (cloudConfigData && (!cloudConfigData.logo || cloudConfigData.logo === "" || !cloudConfigData.logo.includes("svg"))) {
          console.log('Force updating cloud config with initial logoSvg...');
          await setDoc(configRef, { logo: logoSvg, logoPdf: logoSvg }, { merge: true });
        }

        // Migrate cloud admin user's password from Admin@123 to 1234
        try {
          const userDocRef = doc(db, 'users', 'usr-1');
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData && userData.senhaHash === 'Admin@123') {
              console.log('Migrating cloud user usr-1 password to 1234...');
              await setDoc(userDocRef, { senhaHash: '1234' }, { merge: true });
            }
          }
        } catch (err) {
          console.error('Error migrating cloud admin password:', err);
        }

        // Force update cloud services count/IDs if they contain old services (or length is not 7)
        const servicesSnapshot = await getDocs(collection(db, 'services'));
        const hasOldServices = servicesSnapshot.docs.length !== 7 || servicesSnapshot.docs.some(doc => doc.id === 'srv-11' || doc.id === 'srv-16');
        if (hasOldServices) {
          console.log('Syncing old cloud services list with updated 7 residential focus items...');
          for (const d of servicesSnapshot.docs) {
            await deleteDoc(doc(db, 'services', d.id));
          }
          for (const item of DEFAULT_SERVICES) {
            await setDoc(doc(db, 'services', item.id), item);
          }
          SafeStorage.setItem('services', JSON.stringify(DEFAULT_SERVICES));
          console.log('Cloud services corrected with updated 7 items!');
        }
      }
    } catch (e) {
      console.error('Error during cloud check and seeding:', e);
    }
  }

  private static initFirebaseSync() {
    if (this.listenersInitialized) return;
    this.listenersInitialized = true;

    this.checkAndSeedFirestore();

    const collectionsToSync = [
      { name: 'users', isSingle: false },
      { name: 'services', isSingle: false },
      { name: 'clients', isSingle: false },
      { name: 'budgets', isSingle: false },
      { name: 'budget_items', isSingle: false },
      { name: 'receipts', isSingle: false },
      { name: 'payments', isSingle: false },
      { name: 'appointments', isSingle: false },
      { name: 'solicitations', isSingle: false },
      { name: 'config', isSingle: true }
    ];

    collectionsToSync.forEach(colInfo => {
      onSnapshot(collection(db, colInfo.name), (snapshot) => {
        if (snapshot.empty) return;
        this.syncingCloud = true;
        try {
          if (colInfo.isSingle) {
            const docData = snapshot.docs[0]?.data();
            if (docData) {
              SafeStorage.setItem(colInfo.name, JSON.stringify(docData));
            }
          } else {
            const listData = snapshot.docs.map(d => d.data());
            SafeStorage.setItem(colInfo.name, JSON.stringify(listData));
          }
          this.notifySubscribers();
        } catch (e) {
          console.error(`Error onSnapshot sync for ${colInfo.name}:`, e);
        } finally {
          this.syncingCloud = false;
        }
      }, (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, colInfo.name);
        } catch (e) {
          console.error(`Subscription error handled for ${colInfo.name}:`, e);
        }
      });
    });
  }

  private static async syncListToFirestore<T extends { id: string }>(
    collectionName: string,
    newList: T[]
  ) {
    if (this.syncingCloud) return;
    try {
      const docIdsInNewList = new Set(newList.map(item => item.id));
      for (const item of newList) {
        await setDoc(doc(db, collectionName, item.id), item);
      }
      const snapshot = await getDocs(collection(db, collectionName));
      for (const d of snapshot.docs) {
        if (!docIdsInNewList.has(d.id)) {
          await deleteDoc(doc(db, collectionName, d.id));
        }
      }
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, collectionName);
      } catch (e) {
        console.error(`Error syncing list to cloud for ${collectionName}:`, e);
      }
    }
  }

  private static async syncConfigToFirestore(data: ConfiguracaoEmpresa) {
    if (this.syncingCloud) return;
    try {
      await setDoc(doc(db, 'config', 'cfg-default'), data);
    } catch (error) {
      try {
        handleFirestoreError(error, OperationType.WRITE, 'config');
      } catch (e) {
        console.error('Error syncing config to cloud:', e);
      }
    }
  }

  // Generic Get & Set
  public static get<T>(key: string, defaultValue: T): T {
    this.initialize();
    const data = SafeStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  }

  public static set(key: string, value: any): void {
    try {
      SafeStorage.setItem(key, JSON.stringify(value));
    } catch (e: any) {
      if (
        e.name === 'QuotaExceededError' ||
        e.code === 22 ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e.message?.includes('exceeded the quota')
      ) {
        console.error('LocalStorage quota exceeded!');
        throw new Error('QUOTA_EXCEEDED');
      }
      throw e;
    }
  }

  // Specialized operations
  public static getUsers(): Usuario[] { return this.get<Usuario[]>('users', DEFAULT_USERS); }
  public static saveUsers(data: Usuario[]) {
    this.set('users', data);
    this.syncListToFirestore('users', data);
  }

  public static getServices(): Servico[] { return this.get<Servico[]>('services', DEFAULT_SERVICES); }
  public static saveServices(data: Servico[]) {
    this.set('services', data);
    this.syncListToFirestore('services', data);
  }

  public static getClients(): Cliente[] { return this.get<Cliente[]>('clients', DEFAULT_CLIENTS); }
  public static saveClients(data: Cliente[]) {
    this.set('clients', data);
    this.syncListToFirestore('clients', data);
  }

  public static getConfig(): ConfiguracaoEmpresa { return this.get<ConfiguracaoEmpresa>('config', DEFAULT_CONFIG); }
  public static saveConfig(data: ConfiguracaoEmpresa) {
    this.set('config', data);
    this.syncConfigToFirestore(data);
  }

  public static getBudgets(): Orcamento[] { return this.get<Orcamento[]>('budgets', DEFAULT_BUDGETS); }
  public static saveBudgets(data: Orcamento[]) {
    this.set('budgets', data);
    this.syncListToFirestore('budgets', data);
  }

  public static getBudgetItems(): ItemOrcamento[] { return this.get<ItemOrcamento[]>('budget_items', DEFAULT_BUDGET_ITEMS); }
  public static saveBudgetItems(data: ItemOrcamento[]) {
    this.set('budget_items', data);
    this.syncListToFirestore('budget_items', data);
  }

  public static getReceipts(): Recibo[] { return this.get<Recibo[]>('receipts', DEFAULT_RECEIPTS); }
  public static saveReceipts(data: Recibo[]) {
    this.set('receipts', data);
    this.syncListToFirestore('receipts', data);
  }

  public static getPayments(): Pagamento[] { return this.get<Pagamento[]>('payments', DEFAULT_PAYMENTS); }
  public static savePayments(data: Pagamento[]) {
    this.set('payments', data);
    this.syncListToFirestore('payments', data);
  }

  public static getAppointments(): Atendimento[] { return this.get<Atendimento[]>('appointments', DEFAULT_APPOINTMENTS); }
  public static saveAppointments(data: Atendimento[]) {
    this.set('appointments', data);
    this.syncListToFirestore('appointments', data);
  }

  public static getSolicitations(): SolicitacaoPublica[] { return this.get<SolicitacaoPublica[]>('solicitations', DEFAULT_SOLICITATIONS); }
  public static saveSolicitations(data: SolicitacaoPublica[]) {
    this.set('solicitations', data);
    this.syncListToFirestore('solicitations', data);
  }

  // Helpers to add records and auto-increment numbers
  public static addSolicitacao(solicitacao: Omit<SolicitacaoPublica, 'id' | 'dataSolicitacao' | 'status'>): SolicitacaoPublica {
    const list = this.getSolicitations();
    const newRecord: SolicitacaoPublica = {
      ...solicitacao,
      id: `sol-${Date.now()}`,
      dataSolicitacao: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Novo'
    };
    list.unshift(newRecord);
    this.saveSolicitations(list);
    return newRecord;
  }

  public static addClient(client: Omit<Cliente, 'id' | 'dataCadastro' | 'statusCliente'>): Cliente {
    const list = this.getClients();
    const newRecord: Cliente = {
      ...client,
      id: `cli-${Date.now()}`,
      dataCadastro: new Date().toISOString(),
      statusCliente: 'Ativo'
    };
    list.unshift(newRecord);
    this.saveClients(list);
    return newRecord;
  }

  public static generateNextOrcamentoNumber(): string {
    const list = this.getBudgets();
    let maxNum = 0;
    const regex = /AGE-ORC-(\d+)/;
    list.forEach(b => {
      const match = b.numeroOrcamento.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `AGE-ORC-${nextNum.toString().padStart(4, '0')}`;
  }

  public static generateNextReciboNumber(): string {
    const list = this.getReceipts();
    let maxNum = 0;
    const regex = /AGE-REC-(\d+)/;
    list.forEach(r => {
      const match = r.numeroRecibo.match(regex);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `AGE-REC-${nextNum.toString().padStart(4, '0')}`;
  }
}
