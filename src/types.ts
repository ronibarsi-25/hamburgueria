export interface StockItem {
  id: string;
  name: string;
  unit: 'un' | 'kg' | 'g' | 'l' | 'ml';
  currentQuantity: number;
  minQuantity: number;
  cost: number;
}

export interface RecipeItem {
  stockItemId: string;
  quantity: number;
}

export interface MenuItem {
  id: string;
  name: string;
  category: 'burgers' | 'sides' | 'drinks' | 'desserts';
  description: string;
  price: number;
  imageUrl?: string;
  popular?: boolean;
  active?: boolean;
  recipe?: RecipeItem[];
}

export type EmployeeRole = 'atendente' | 'garcom' | 'cozinheiro' | 'caixa' | 'gerente';

export type SystemPermission =
  | 'chat'
  | 'menu'
  | 'tables'
  | 'kds'
  | 'delivery'
  | 'cashier'
  | 'stock'
  | 'finance'
  | 'dashboard'
  | 'qr'
  | 'settings'
  | 'mobile_comanda';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  shift: 'manha' | 'noite' | 'integral';
  pin: string;
  status: 'ativo' | 'folga' | 'inativo';
  permissions: SystemPermission[];
  createdAt: string;
}

export interface CompanyInfo {
  legalName: string;
  fantasyName: string;
  cnpj: string;
  phone: string;
  address: string;
  wifiSsid: string;
  wifiPassword: string;
  pixKey: string;
  pixReceiverName: string;
}

export interface QuickReplyShortcut {
  id: string;
  shortcut: string;
  title: string;
  category: 'pagamento' | 'ingredientes' | 'geral';
  triggers: string;
  responseTemplate: string;
  enabled: boolean;
}

export interface RestaurantConfig {
  restaurantName: string;
  menuUrl: string;
  phone: string;
  neighborhoods: string[];
  openingHours: string;
  isStoreOpen: boolean;
  currentSimulatedTime: string;
  humanHandoffText: string;
  featuredItems: MenuItem[];
  quickReplies: QuickReplyShortcut[];
  pixKey?: string;
  pixReceiverName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export type TableStatus = 'livre' | 'ocupada' | 'conta';

export interface Table {
  id: number;
  number: string; // "01", "02", ... "30"
  status: TableStatus;
  currentOrderId?: string;
  openedAt?: string;
  peopleCount?: number;
  notes?: string;
}

export type OrderType = 'mesa' | 'delivery' | 'balcao';
export type OrderStatus = 'NOVO' | 'EM PREPARO' | 'PRONTO' | 'SAIU_ENTREGA' | 'ENTREGUE' | 'FINALIZADO';
export type PaymentStatus = 'PENDENTE' | 'PAGO';
export type PaymentMethod = 'PIX' | 'DINHEIRO' | 'CREDITO' | 'DEBITO' | 'FIADO';

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  category: string;
}

export interface CustomerDelivery {
  name: string;
  phone: string;
  cpf?: string;
  cep?: string;
  address: string;
  number: string;
  bairro: string;
  complement?: string;
  reference?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  cep?: string;
  address: string;
  number: string;
  bairro: string;
  complement?: string;
  reference?: string;
  notes?: string;
  totalOrdersCount?: number;
  totalSpent?: number;
  createdAt: string;
  lastOrderAt?: string;
}

export interface Order {
  id: string; // e.g. "CMD-101"
  displayNumber: number;
  type: OrderType;
  tableNumber?: string;
  customer?: CustomerDelivery;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  pixCode?: string;
  createdAt: string;
  preparedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  notes?: string;
  splitCount?: number;
}

export interface CashTransaction {
  id: string;
  type: 'VENDA' | 'SANGRIA' | 'SUPRIMENTO' | 'DESPESA';
  amount: number;
  paymentMethod?: PaymentMethod;
  description: string;
  timestamp: string;
  orderId?: string;
}

export interface CashRegister {
  id: string;
  isOpen: boolean;
  openedAt?: string;
  closedAt?: string;
  initialBalance: number;
  transactions: CashTransaction[];
}

export interface Expense {
  id: string;
  description: string;
  category: 'FORNECEDOR' | 'ALUGUEL' | 'ENERGIA_AGUA' | 'FUNCIONARIOS' | 'MARKETING' | 'OUTROS';
  amount: number;
  dueDate: string;
  status: 'PAGO' | 'PENDENTE';
  createdAt: string;
}

export interface NeighborhoodFee {
  id: string;
  name: string;
  fee: number;
  estimatedMinutes: string;
}

export interface AttendantAlert {
  id: string;
  orderId: string;
  displayNumber: number;
  tableNumber?: string;
  customerName?: string;
  type: OrderType;
  itemsSummary: string;
  timestamp: string;
}

export interface DatabaseBackupPayload {
  version: string;
  system: string;
  timestamp: string;
  data: {
    tables: Table[];
    orders: Order[];
    stockItems: StockItem[];
    menuItems: MenuItem[];
    employees: Employee[];
    companyInfo: CompanyInfo;
    cashRegister: CashRegister;
    expenses: Expense[];
    neighborhoodFees: NeighborhoodFee[];
    customers?: Customer[];
    restaurantConfig?: RestaurantConfig;
  };
  meta: {
    totalOrders: number;
    totalRevenue: number;
    totalStockItems: number;
    activeEmployees: number;
    tablesCount: number;
    checksum?: string;
  };
}

export interface BackupSnapshot {
  id: string;
  label: string;
  timestamp: string;
  sizeBytes: number;
  ordersCount: number;
  totalRevenue: number;
  itemsCount: number;
  payload: DatabaseBackupPayload;
  source: 'manual' | 'auto' | 'pre-restore';
}

export interface ServerBackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  ordersCount?: number;
  totalRevenue?: number;
}

