import {
  MenuItem,
  RestaurantConfig,
  StockItem,
  Table,
  Order,
  CashRegister,
  Expense,
  NeighborhoodFee,
  Employee,
  CompanyInfo,
  EmployeeRole,
  SystemPermission,
  QuickReplyShortcut,
  Customer,
} from '../types.ts';
import imgCheddar from '../assets/images/burger_cheddar_max_1793901189809.jpg';
import imgSmash from '../assets/images/burger_smash_duplo_1793901184390.jpg';
import imgRustic from '../assets/images/burger_rustic_fries_1793901184681.jpg';
import imgMari from '../assets/images/mari_avatar_1793901183869.jpg';

// Insumos de Estoque
export const DEFAULT_STOCK_ITEMS: StockItem[] = [
  { id: 'stk-pao', name: 'Pão Brioche Artesanal', unit: 'un', currentQuantity: 120, minQuantity: 30, cost: 2.20 },
  { id: 'stk-carne', name: 'Blend Bovino 160g (Fraldinha/Costela)', unit: 'un', currentQuantity: 95, minQuantity: 25, cost: 5.50 },
  { id: 'stk-smash', name: 'Blend Smash 90g', unit: 'un', currentQuantity: 110, minQuantity: 30, cost: 3.20 },
  { id: 'stk-cheddar', name: 'Cheddar Cremoso Especial', unit: 'kg', currentQuantity: 8.5, minQuantity: 2.5, cost: 42.00 },
  { id: 'stk-prato', name: 'Queijo Prato Fatiado', unit: 'kg', currentQuantity: 6.2, minQuantity: 2.0, cost: 38.00 },
  { id: 'stk-bacon', name: 'Bacon Fatiado Defumado', unit: 'kg', currentQuantity: 4.8, minQuantity: 1.5, cost: 48.00 },
  { id: 'stk-batata', name: 'Batata Rústica Pré-frita', unit: 'kg', currentQuantity: 18.0, minQuantity: 5.0, cost: 14.00 },
  { id: 'stk-refri', name: 'Refrigerante Lata 350ml', unit: 'un', currentQuantity: 72, minQuantity: 24, cost: 2.80 },
  { id: 'stk-cerveja', name: 'Cerveja Long Neck IPA', unit: 'un', currentQuantity: 48, minQuantity: 16, cost: 6.50 },
  { id: 'stk-sorvete', name: 'Sorvete Baunilha Artesanal', unit: 'kg', currentQuantity: 5.0, minQuantity: 2.0, cost: 28.00 },
];

// Cardápio do Restaurante
export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'burger-cheddar-max',
    name: 'Cheddar Max',
    category: 'burgers',
    description: '2 blends 160g suculentos, cheddar cremoso artesanal duplo e pão brioche tostado na manteiga de garrafa.',
    price: 38.90,
    imageUrl: imgCheddar,
    popular: true,
    active: true,
    recipe: [
      { stockItemId: 'stk-pao', quantity: 1 },
      { stockItemId: 'stk-carne', quantity: 2 },
      { stockItemId: 'stk-cheddar', quantity: 0.08 },
    ],
  },
  {
    id: 'burger-smash-duplo',
    name: 'Smash Duplo Defumado',
    category: 'burgers',
    description: 'Duplo smash 90g com crosta caramelizada, queijo prato derretido, tiras de bacon crocante e maionese secreta da Mari.',
    price: 32.90,
    imageUrl: imgSmash,
    popular: true,
    active: true,
    recipe: [
      { stockItemId: 'stk-pao', quantity: 1 },
      { stockItemId: 'stk-smash', quantity: 2 },
      { stockItemId: 'stk-prato', quantity: 0.05 },
      { stockItemId: 'stk-bacon', quantity: 0.04 },
    ],
  },
  {
    id: 'batata-rustica',
    name: 'Batata Rústica da Casa',
    category: 'sides',
    description: 'Batatas rústicas com alecrim fresco, páprica defumada, banhadas em cheddar cremoso e farofa crocante de bacon.',
    price: 28.90,
    imageUrl: imgRustic,
    popular: true,
    active: true,
    recipe: [
      { stockItemId: 'stk-batata', quantity: 0.35 },
      { stockItemId: 'stk-cheddar', quantity: 0.06 },
      { stockItemId: 'stk-bacon', quantity: 0.03 },
    ],
  },
  {
    id: 'coca-cola-lata',
    name: 'Coca-Cola Original 350ml',
    category: 'drinks',
    description: 'Refrigerante em lata bem gelada servida com copo e rodela de limão.',
    price: 6.90,
    popular: false,
    active: true,
    recipe: [{ stockItemId: 'stk-refri', quantity: 1 }],
  },
  {
    id: 'cerveja-ipa',
    name: 'Cerveja Artesanal IPA 355ml',
    category: 'drinks',
    description: 'Cerveja Indian Pale Ale aromática com notas cítricas, ideal para harmonizar com smash burgers.',
    price: 14.90,
    popular: false,
    active: true,
    recipe: [{ stockItemId: 'stk-cerveja', quantity: 1 }],
  },
  {
    id: 'milk-shake-brownie',
    name: 'Milkshake de Brownie & Nutella',
    category: 'desserts',
    description: 'Batido com sorvete de baunilha cremoso, pedaços de brownie quentinho e borda generosa de Nutella pura.',
    price: 22.90,
    popular: true,
    active: true,
    recipe: [{ stockItemId: 'stk-sorvete', quantity: 0.2 }],
  },
];

// 30 Mesas do Salão
export const DEFAULT_TABLES: Table[] = Array.from({ length: 30 }, (_, index) => {
  const tableNum = (index + 1).toString().padStart(2, '0');
  return {
    id: index + 1,
    number: tableNum,
    status: 'livre',
    peopleCount: 4,
  };
});

// Pedidos Iniciais de Exemplo
export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'CMD-101',
    displayNumber: 101,
    type: 'mesa',
    tableNumber: '04',
    items: [
      { id: 'item-101-1', menuItemId: 'burger-cheddar-max', name: 'Cheddar Max', price: 38.90, quantity: 2, category: 'burgers', notes: 'Ponto da carne: Ao ponto' },
      { id: 'item-101-2', menuItemId: 'batata-rustica', name: 'Batata Rústica da Casa', price: 28.90, quantity: 1, category: 'sides', notes: 'Cheddar e bacon bem quentes' },
      { id: 'item-101-3', menuItemId: 'coca-cola-lata', name: 'Coca-Cola Original 350ml', price: 6.90, quantity: 2, category: 'drinks' },
    ],
    subtotal: 113.60,
    deliveryFee: 0,
    discount: 0,
    total: 113.60,
    status: 'EM PREPARO',
    paymentStatus: 'PENDENTE',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    notes: 'Mesa 04 - Pedido rápido do Salão',
  },
  {
    id: 'CMD-102',
    displayNumber: 102,
    type: 'delivery',
    customer: {
      name: 'Lucas Martins',
      phone: '(31) 98765-4321',
      cep: '30130-000',
      address: 'Av. Afonso Pena',
      number: '1240',
      bairro: 'Centro',
      complement: 'Apt 502',
      reference: 'Próximo ao Conservatório',
    },
    items: [
      { id: 'item-102-1', menuItemId: 'burger-smash-duplo', name: 'Smash Duplo Defumado', price: 32.90, quantity: 1, category: 'burgers', notes: 'Sem maionese' },
      { id: 'item-102-2', menuItemId: 'milk-shake-brownie', name: 'Milkshake de Brownie & Nutella', price: 22.90, quantity: 1, category: 'desserts' },
    ],
    subtotal: 55.80,
    deliveryFee: 6.00,
    discount: 0,
    total: 61.80,
    status: 'PRONTO',
    paymentStatus: 'PAGO',
    paymentMethod: 'PIX',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    readyAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    notes: 'Entregar na portaria',
  },
];

// Dados da Empresa
export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  legalName: 'Mariana Burger Artesanal Ltda',
  fantasyName: 'Mari Burger Artesanal',
  cnpj: '38.452.901/0001-84',
  phone: '(31) 99876-5432',
  address: 'Rua dos Pinheiros, 742 - Savassi, Belo Horizonte - MG',
  wifiSsid: 'MariBurger_Clientes_5G',
  wifiPassword: 'burgersaboroso',
  pixKey: 'contato@mariburger.com.br',
  pixReceiverName: 'Mariana Burger Artesanal Ltda',
};

// Caixa Operacional
export const DEFAULT_CASH_REGISTER: CashRegister = {
  id: 'cx-hoje',
  isOpen: true,
  openedAt: new Date().toISOString(),
  initialBalance: 200.00,
  transactions: [
    {
      id: 'tx-init',
      type: 'SUPRIMENTO',
      amount: 200.00,
      description: 'Fundo de troco inicial do dia',
      timestamp: new Date().toISOString(),
    },
  ],
};

// Despesas Operacionais
export const DEFAULT_EXPENSES: Expense[] = [
  { id: 'exp-1', description: 'Reposição de Pão Brioche Fornecedor', category: 'FORNECEDOR', amount: 350.00, dueDate: new Date().toISOString().split('T')[0], status: 'PAGO', createdAt: new Date().toISOString() },
  { id: 'exp-2', description: 'Conta de Energia (Cemig)', category: 'ENERGIA_AGUA', amount: 480.00, dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], status: 'PENDENTE', createdAt: new Date().toISOString() },
  { id: 'exp-3', description: 'Embalagens Térmicas Delivery', category: 'FORNECEDOR', amount: 220.00, dueDate: new Date().toISOString().split('T')[0], status: 'PAGO', createdAt: new Date().toISOString() },
];

// Taxas por Bairro
export const DEFAULT_NEIGHBORHOOD_FEES: NeighborhoodFee[] = [
  { id: 'b-centro', name: 'Centro', fee: 5.00, estimatedMinutes: '20-30 min' },
  { id: 'b-savassi', name: 'Savassi', fee: 6.00, estimatedMinutes: '25-35 min' },
  { id: 'b-funcionarios', name: 'Funcionários', fee: 6.50, estimatedMinutes: '25-35 min' },
  { id: 'b-lourdes', name: 'Lourdes', fee: 7.00, estimatedMinutes: '30-40 min' },
  { id: 'b-sion', name: 'Sion', fee: 9.00, estimatedMinutes: '35-45 min' },
  { id: 'b-buritis', name: 'Buritis', fee: 12.00, estimatedMinutes: '45-55 min' },
];

// Clientes Cadastrados do Delivery (Busca por Telefone, CPF e Nome)
export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cli-1',
    name: 'Lucas Martins',
    phone: '(31) 98765-4321',
    cpf: '109.876.543-21',
    cep: '30130-000',
    address: 'Av. Afonso Pena',
    number: '1240',
    bairro: 'Centro',
    complement: 'Apt 502',
    reference: 'Próximo ao Conservatório',
    notes: 'Tocar o interfone e subir até o 5º andar',
    totalOrdersCount: 4,
    totalSpent: 247.20,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    lastOrderAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'cli-2',
    name: 'Mariana Silveira',
    phone: '(31) 99123-4567',
    cpf: '234.567.890-12',
    cep: '30140-071',
    address: 'Rua Sergipe',
    number: '880',
    bairro: 'Savassi',
    complement: 'Bloco B Apt 201',
    reference: 'Esquina com Fernandes Tourinho',
    notes: 'Deixar na portaria com o Seu José',
    totalOrdersCount: 7,
    totalSpent: 418.50,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    lastOrderAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'cli-3',
    name: 'Rafael Guimarães',
    phone: '(31) 97654-3210',
    cpf: '345.678.901-23',
    cep: '30180-100',
    address: 'Rua Gonçalves Dias',
    number: '1920',
    bairro: 'Lourdes',
    complement: 'Casa',
    reference: 'Portão preto ao lado da padaria',
    notes: 'Campainha com som baixo, pode mandar WhatsApp ao chegar',
    totalOrdersCount: 2,
    totalSpent: 122.90,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    lastOrderAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// Permissões do Sistema
export const ALL_SYSTEM_PERMISSIONS: {
  id: SystemPermission;
  label: string;
  description: string;
  badge: string;
}[] = [
  { id: 'mobile_comanda', label: 'Comanda Mobile', description: 'Acesso ao Garçom Pocket para celular (atendimento de mesa)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'tables', label: 'Salão & Mesas', description: 'Visualização e gestão das 30 mesas do salão', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'kds', label: 'Cozinha KDS', description: 'Fila de pedidos da cozinha e preparo em tempo real', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'cashier', label: 'Caixa & PDV', description: 'Abertura/fechamento, suprimento, sangria e PDV balcão', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'chat', label: 'WhatsApp da Mari', description: 'Atendimento automatizado e chat virtual', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { id: 'delivery', label: 'Delivery', description: 'Despacho de motoboys e pedidos para viagem', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { id: 'menu', label: 'Cardápio Digital', description: 'Visualização e edição do cardápio digital', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'stock', label: 'Estoque', description: 'Controle de insumos, ficha técnica e alertas de mínimo', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { id: 'finance', label: 'Financeiro & Despesas', description: 'Contas a pagar, fluxo de caixa e exportação CSV', badge: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { id: 'dashboard', label: 'Dashboard & Gráficos', description: 'Indicadores analíticos de vendas e produtos mais pedidos', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { id: 'qr', label: 'QR Codes das Mesas', description: 'Geração e impressão de plaquinhas QR das 30 mesas', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'settings', label: 'Configurações & Backup', description: 'Empresa, equipe, backup geral e parâmetros do sistema', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

// Permissões Padrão por Cargo
export const DEFAULT_ROLE_PERMISSIONS: Record<EmployeeRole, SystemPermission[]> = {
  gerente: [
    'chat',
    'menu',
    'tables',
    'kds',
    'delivery',
    'cashier',
    'stock',
    'finance',
    'dashboard',
    'qr',
    'settings',
    'mobile_comanda',
  ],
  caixa: ['cashier', 'delivery', 'tables', 'mobile_comanda'],
  atendente: ['chat', 'delivery', 'menu', 'mobile_comanda'],
  garcom: ['tables', 'mobile_comanda', 'qr', 'menu'],
  cozinheiro: ['kds', 'stock'],
};

// Funcionários Cadastrados
export const DEFAULT_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Carlos Oliveira (Gerente)',
    role: 'gerente',
    phone: '(31) 99111-2233',
    shift: 'integral',
    pin: '1234',
    status: 'ativo',
    permissions: DEFAULT_ROLE_PERMISSIONS.gerente,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-2',
    name: 'Beatriz Santos (Caixa)',
    role: 'caixa',
    phone: '(31) 99222-3344',
    shift: 'noite',
    pin: '2345',
    status: 'ativo',
    permissions: DEFAULT_ROLE_PERMISSIONS.caixa,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-3',
    name: 'Gabriel Souza (Garçom)',
    role: 'garcom',
    phone: '(31) 99333-4455',
    shift: 'noite',
    pin: '3456',
    status: 'ativo',
    permissions: DEFAULT_ROLE_PERMISSIONS.garcom,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'emp-4',
    name: 'Rodrigo Lima (Chef KDS)',
    role: 'cozinheiro',
    phone: '(31) 99444-5566',
    shift: 'noite',
    pin: '4567',
    status: 'ativo',
    permissions: DEFAULT_ROLE_PERMISSIONS.cozinheiro,
    createdAt: new Date().toISOString(),
  },
];

// Respostas Rápidas do Chat Mari
export const DEFAULT_QUICK_REPLIES: QuickReplyShortcut[] = [
  {
    id: 'qr-cardapio',
    shortcut: '/cardapio',
    title: 'Enviar Cardápio Digital',
    category: 'geral',
    triggers: 'cardapio, cardápio, menu, lanche, burgers',
    responseTemplate: 'Aqui está nosso cardápio completo com fotos, adicionais e combos: {menu_url}',
    enabled: true,
  },
  {
    id: 'qr-pix',
    shortcut: '/pix',
    title: 'Chave PIX e Instruções',
    category: 'pagamento',
    triggers: 'pix, pagar pix, chave pix, qr code',
    responseTemplate: 'Nossa chave PIX oficial é: {pix_key} ({pix_receiver}). Após a transferência, envie o comprovante por aqui!',
    enabled: true,
  },
  {
    id: 'qr-tempo',
    shortcut: '/tempo',
    title: 'Tempo Estimado de Entrega',
    category: 'geral',
    triggers: 'tempo, demora, previsão, quantos minutos',
    responseTemplate: 'Nosso tempo médio de preparo e entrega hoje está entre 35 a 45 minutos. Estamos acelerando seu pedido!',
    enabled: true,
  },
  {
    id: 'qr-ponto',
    shortcut: '/ponto',
    title: 'Ponto da Carne',
    category: 'ingredientes',
    triggers: 'ponto, carne, bem passado, mal passado',
    responseTemplate: 'Nossos burgers são servidos no ponto perfeito: rosado e suculento por dentro! Se preferir bem passado, basta nos avisar nas observações.',
    enabled: true,
  },
];

// Configuração Padrão do Restaurante
export const DEFAULT_CONFIG: RestaurantConfig = {
  restaurantName: 'Mari Burger Artesanal',
  menuUrl: typeof window !== 'undefined' ? `${window.location.origin}?mesa=01` : 'http://localhost:3000/?mesa=01',
  phone: '5531998765432',
  neighborhoods: ['Centro', 'Savassi', 'Funcionários', 'Lourdes', 'Sion', 'Buritis'],
  openingHours: 'Terça a Domingo das 18:00 às 23:30',
  isStoreOpen: true,
  currentSimulatedTime: '20:30',
  humanHandoffText: 'Vou transferir você para nosso atendente humano no salão agora mesmo! 🛎️',
  featuredItems: DEFAULT_MENU_ITEMS,
  quickReplies: DEFAULT_QUICK_REPLIES,
  pixKey: 'contato@mariburger.com.br',
  pixReceiverName: 'Mariana Burger Artesanal Ltda',
};

// Aliases para compatibilidade total
export const DEFAULT_RESTAURANT_CONFIG = DEFAULT_CONFIG;
export const DEFAULT_COMPANY = DEFAULT_COMPANY_INFO;

// Cenários de Teste Rápido para o Chat
export const QUICK_SCENARIOS = [
  {
    id: 'sc-cardapio',
    label: '🍔 Ver Cardápio',
    description: 'Solicita o link do cardápio digital',
    message: 'Boa noite! Quero ver o cardápio e escolher meu burger.',
  },
  {
    id: 'sc-combo',
    label: '🍟 Pedir Cheddar Max',
    description: 'Pede sugestão do combo mais vendido',
    message: 'Quero um Cheddar Max com batata rústica e coca gelada!',
  },
  {
    id: 'sc-pix',
    label: '💰 Como pagar com PIX?',
    description: 'Pergunta chave PIX e dados bancários',
    message: 'Qual é a chave PIX de vocês para pagamento?',
  },
  {
    id: 'sc-humano',
    label: '🛎️ Falar com Atendente',
    description: 'Solicita transição para atendente humano',
    message: 'Preciso falar com o atendente agora sobre meu pedido.',
  },
  {
    id: 'sc-fechado',
    label: '⏰ Horário de Funcionamento',
    description: 'Verifica horários de entrega',
    message: 'Vocês estão abertos agora? Qual o horário de entrega?',
  },
];

// Gerador de System Prompt para IA / Assistente Mari
export const generateFullPrompt = (config: RestaurantConfig): string => {
  return `Você é a Mari, a inteligência artificial simpática, ágil e acolhedora da hamburgueria artesanal "${config.restaurantName}".
Seu objetivo é encantar clientes, tirar dúvidas sobre o cardápio, orientar pedidos e fornecer o link do cardápio digital oficial: ${config.menuUrl}.

DADOS DO ESTABELECIMENTO:
- Nome: ${config.restaurantName}
- Telefone/WhatsApp: ${config.phone}
- Horário de Funcionamento: ${config.openingHours}
- Status atual da loja: ${config.isStoreOpen ? 'ABERTA' : 'FECHADA'}
- Chave PIX: ${config.pixKey || 'contato@mariburger.com.br'} (${config.pixReceiverName || config.restaurantName})
- Bairros atendidos: ${config.neighborhoods.join(', ')}

DIRETRIZES DE ATENDIMENTO:
1. Seja sempre acolhedora, use emojis de comida de forma moderada (🍔, 🍟, 🥤, 🚀).
2. Se o cliente perguntar o cardápio, forneça sempre o link: ${config.menuUrl}.
3. Se perguntar sobre pagamento com PIX, informe a chave e solicite o envio do comprovante.
4. Se o cliente pedir para falar com uma pessoa, responda com cordialidade acionando: "${config.humanHandoffText}".
5. Nunca invente promoções que não constam no cardápio.`;
};
