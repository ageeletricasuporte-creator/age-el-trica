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

const logoSvgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="yellowLightningGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f2b705" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <!-- Premium Dark Solid Background representing high-durability electrical work -->
  <rect width="512" height="512" rx="0" fill="#000000" />
  
  <g transform="translate(54, 0)">
    <!-- Main Group "AGE" stylized and italicized -->
    <g transform="skewX(-14)">
      <!-- Letter 'A' (white) -->
      <path d="M 50,300 L 120,140 H 180 L 250,300 H 200 L 185,260 H 115 L 100,300 Z M 125,225 H 175 L 150,175 Z" fill="#ffffff" />
      
      <!-- Letter 'G' (white) -->
      <path d="M 370,140 H 290 V 300 H 370 V 235 H 330 V 253 H 352 V 282 H 308 V 158 H 370 Z" fill="#ffffff" />
      
      <!-- Letter 'E' (white) -->
      <path d="M 385,140 H 460 V 158 H 403 V 212 H 450 V 230 H 403 V 282 H 460 V 300 H 385 Z" fill="#ffffff" />
      
      <!-- Overlay Lightning Bolt (Yellow, glowing, centered) - Skewed alongside letters for perfect alignment -->
      <polygon points="230,70 290,70 220,195 295,195 180,350 215,215 170,215" fill="url(#yellowLightningGrad)" filter="url(#softGlow)" stroke="#000000" stroke-width="12" stroke-linejoin="round" />
    </g>
  </g>
  
  <!-- Subtitle text 'ELÉTRICA' in gold, spaced across the logo width, perfectly centered at x=256 -->
  <text x="256" y="395" fill="#f2b705" font-family="'Inter', 'Space Grotesk', system-ui, sans-serif" font-size="28" font-weight="900" letter-spacing="18" text-anchor="middle">ELÉTRICA</text>
</svg>`;

// Standard robust Base64 encoder for browser and Node contexts supporting unicode
const encodeBase64 = (str: string) => {
  try {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(str)));
    }
    return 'data:image/svg+xml;base64,' + Buffer.from(str).toString('base64');
  } catch (e) {
    return 'data:image/svg+xml;base64,';
  }
};

export const PREMIUM_LOGO_BASE64 = encodeBase64(logoSvgContent);

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
export const DEFAULT_CLIENTS: Cliente[] = [];

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
  logo: PREMIUM_LOGO_BASE64, // Elegant responsive SVG representation
  logoPdf: PREMIUM_LOGO_BASE64, // Exclusivo para PDFs
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
export const DEFAULT_BUDGETS: Orcamento[] = [];

// Seed Budget Items
export const DEFAULT_BUDGET_ITEMS: ItemOrcamento[] = [];

// Seed Receipts / Recibos
export const DEFAULT_RECEIPTS: Recibo[] = [];

// Seed Payments
export const DEFAULT_PAYMENTS: Pagamento[] = [];

// Seed Appointments / Atendimentos (Agenda)
export const DEFAULT_APPOINTMENTS: Atendimento[] = [];

// Seed Public Requests / Solicitações
export const DEFAULT_SOLICITATIONS: SolicitacaoPublica[] = [];

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

  public static updateBrowserFavicon(): void {
    if (typeof window === 'undefined') return;
    try {
      const storedConfig = SafeStorage.getItem('config');
      if (storedConfig) {
        const conf = JSON.parse(storedConfig);
        if (conf && conf.favicon) {
          const links = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
          if (links.length > 0) {
            links.forEach(link => {
              link.setAttribute("href", conf.favicon);
            });
          } else {
            const link = document.createElement('link');
            link.rel = 'icon';
            link.href = conf.favicon;
            document.head.appendChild(link);
          }
        }
      }
    } catch (e) {
      console.error('Error updating favicon dynamically:', e);
    }
  }

  private static notifySubscribers(): void {
    this.updateBrowserFavicon();
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
      if (!SafeStorage.getItem('users')) SafeStorage.setItem('users', JSON.stringify(DEFAULT_USERS));
      if (!SafeStorage.getItem('services')) SafeStorage.setItem('services', JSON.stringify(DEFAULT_SERVICES));
      if (!SafeStorage.getItem('clients')) SafeStorage.setItem('clients', JSON.stringify(DEFAULT_CLIENTS));
      if (!SafeStorage.getItem('config')) SafeStorage.setItem('config', JSON.stringify(DEFAULT_CONFIG));
      if (!SafeStorage.getItem('budgets')) SafeStorage.setItem('budgets', JSON.stringify(DEFAULT_BUDGETS));
      if (!SafeStorage.getItem('budget_items')) SafeStorage.setItem('budget_items', JSON.stringify(DEFAULT_BUDGET_ITEMS));
      if (!SafeStorage.getItem('receipts')) SafeStorage.setItem('receipts', JSON.stringify(DEFAULT_RECEIPTS));
      if (!SafeStorage.getItem('payments')) SafeStorage.setItem('payments', JSON.stringify(DEFAULT_PAYMENTS));
      if (!SafeStorage.getItem('appointments')) SafeStorage.setItem('appointments', JSON.stringify(DEFAULT_APPOINTMENTS));
      if (!SafeStorage.getItem('solicitations')) SafeStorage.setItem('solicitations', JSON.stringify(DEFAULT_SOLICITATIONS));
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
          if (!conf.logo) {
            conf.logo = PREMIUM_LOGO_BASE64;
            conf.logoPdf = PREMIUM_LOGO_BASE64;
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
    this.updateBrowserFavicon();
  }

  private static async checkAndSeedFirestore() {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      console.warn(`[Firestore Offline Warning] Device reports offline state. Skipping cloud synchronization check.`);
      return;
    }
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
        // Force update cloud logo if empty or different from the premium logo on cloud config
        const cloudConfigData = configDoc.data();
        if (cloudConfigData && !cloudConfigData.logo) {
          console.log('Force updating empty cloud config with premium PREMIUM_LOGO_BASE64...');
          await setDoc(configRef, { logo: PREMIUM_LOGO_BASE64, logoPdf: PREMIUM_LOGO_BASE64 }, { merge: true });
        }

        // Auto-register backendApiUrl in Firestore if accessed on Cloud Run instance
        if (typeof window !== 'undefined') {
          try {
            const host = window.location.hostname;
            const isVercel = host.endsWith('vercel.app') || host.includes('vercel') || host.includes('github.io');
            const isCustomDomain = host.endsWith('ageeletrica.com') || host.endsWith('ageeletrica.com.br');
            const isStaticDev = window.location.port === '5173';
            
            if (host && !isVercel && !isCustomDomain && !isStaticDev) {
              const currentOrigin = window.location.origin;
              if (cloudConfigData && (!cloudConfigData.backendApiUrl || cloudConfigData.backendApiUrl !== currentOrigin)) {
                console.log(`Auto-registering backend API URL inside Cloud Config: ${currentOrigin}`);
                await setDoc(configRef, { backendApiUrl: currentOrigin }, { merge: true });
              }
            }
          } catch (err: any) {
            const errMsg = err instanceof Error ? err.message : String(err);
            if (errMsg.toLowerCase().includes('offline')) {
              console.warn('Network issue auto-registering backend API:', errMsg);
            } else {
              console.error('Error auto-registering backend API URL in Firestore:', err);
            }
          }
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
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err);
          if (errMsg.toLowerCase().includes('offline')) {
            console.warn('Network issue during cloud admin password migration:', errMsg);
          } else {
            console.error('Error migrating cloud admin password:', err);
          }
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
    } catch (e: any) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const isOfflineMsg = errMsg.toLowerCase().includes('offline') || 
                          errMsg.toLowerCase().includes('fetch') || 
                          errMsg.toLowerCase().includes('network') || 
                          errMsg.toLowerCase().includes('could not reach') ||
                          errMsg.toLowerCase().includes('unavailable') ||
                          errMsg.toLowerCase().includes('failed to get document') ||
                          errMsg.toLowerCase().includes('client is offline');
      if (isOfflineMsg) {
        console.warn(`[Firestore Offline Warning] Cloud check was skipped because the client is offline/disconnected. Seamless local storage fallback is active.`);
      } else {
        console.error('Error during cloud check and seeding:', e);
      }
    }
  }

  private static async syncListToFirestoreBypass<T extends { id: string }>(
    collectionName: string,
    newList: T[]
  ) {
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
      console.error(`Error in syncListToFirestoreBypass for ${collectionName}:`, error);
    }
  }

  private static async syncConfigToFirestoreBypass(data: ConfiguracaoEmpresa) {
    try {
      await setDoc(doc(db, 'config', 'cfg-default'), data);
    } catch (error) {
      console.error('Error in syncConfigToFirestoreBypass:', error);
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
      if (colInfo.isSingle) {
        // Listen specifically to 'cfg-default' for config to avoid sorting and rollback issues with multiple documents
        const docRef = doc(db, colInfo.name, 'cfg-default');
        onSnapshot(docRef, (docSnap) => {
          if (!docSnap.exists()) {
            const localConfigStr = SafeStorage.getItem(colInfo.name);
            if (localConfigStr) {
              try {
                const localConfig = JSON.parse(localConfigStr);
                if (localConfig && localConfig.id) {
                  console.warn(`[RESCUE] Config document does not exist in Firestore, but local storage has configuration. Restoring to cloud.`);
                  this.syncConfigToFirestoreBypass(localConfig);
                  return;
                }
              } catch (parseError) {
                console.error(`[RESCUE] Error parsing local config:`, parseError);
              }
            }
            return;
          }
          this.syncingCloud = true;
          try {
            const docData = docSnap.data();
            if (docData) {
              SafeStorage.setItem(colInfo.name, JSON.stringify(docData));
            }
            this.notifySubscribers();
          } catch (e) {
            console.error(`Error onSnapshot sync for document ${colInfo.name}/cfg-default:`, e);
          } finally {
            this.syncingCloud = false;
          }
        }, (error) => {
          try {
            handleFirestoreError(error, OperationType.GET, `${colInfo.name}/cfg-default`);
          } catch (e) {
            console.error(`Subscription error handled for document ${colInfo.name}/cfg-default:`, e);
          }
        });
      } else {
        onSnapshot(collection(db, colInfo.name), (snapshot) => {
          this.syncingCloud = true;
          try {
            if (snapshot.empty) {
              const localDataStr = SafeStorage.getItem(colInfo.name);
              if (localDataStr) {
                try {
                  const localData = JSON.parse(localDataStr);
                  if (Array.isArray(localData) && localData.length > 0) {
                    console.warn(`[RESCUE] Collection ${colInfo.name} is empty in Firestore, but local storage contains ${localData.length} records. Re-uploading to restore user data.`);
                    this.syncListToFirestoreBypass(colInfo.name, localData);
                    return;
                  }
                } catch (parseError) {
                  console.error(`[RESCUE] Error parsing local storage data for ${colInfo.name}:`, parseError);
                }
              }
            }
            const listData = snapshot.empty ? [] : snapshot.docs.map(d => d.data());
            SafeStorage.setItem(colInfo.name, JSON.stringify(listData));
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
      }
    });
  }

  private static async syncListToFirestore<T extends { id: string }>(
    collectionName: string,
    newList: T[]
  ) {
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
