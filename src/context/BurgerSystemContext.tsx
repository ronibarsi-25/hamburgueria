import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Table,
  Order,
  StockItem,
  CashRegister,
  Expense,
  NeighborhoodFee,
  OrderStatus,
  PaymentMethod,
  MenuItem,
  CartItem,
  CustomerDelivery,
  Employee,
  CompanyInfo,
  SystemPermission,
  AttendantAlert,
  DatabaseBackupPayload,
  BackupSnapshot,
  Customer,
} from '../types.ts';
import {
  DEFAULT_TABLES,
  DEFAULT_ORDERS,
  DEFAULT_STOCK_ITEMS,
  DEFAULT_CASH_REGISTER,
  DEFAULT_EXPENSES,
  DEFAULT_NEIGHBORHOOD_FEES,
  DEFAULT_MENU_ITEMS,
  DEFAULT_COMPANY_INFO,
  DEFAULT_EMPLOYEES,
  DEFAULT_ROLE_PERMISSIONS,
  DEFAULT_CUSTOMERS,
} from '../constants/defaults.ts';
import { soundFX } from '../utils/audio.ts';
import {
  savePendingOrder,
  cacheMenuForOffline,
  cacheTablesForOffline,
  getPendingOrdersCount,
  syncPendingOrdersToServer,
} from '../utils/indexedDB.ts';

interface CreateOrderParams {
  type: 'mesa' | 'delivery' | 'balcao';
  tableNumber?: string;
  customer?: CustomerDelivery;
  items: CartItem[];
  deliveryFee?: number;
  discount?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

interface BurgerSystemContextType {
  tables: Table[];
  orders: Order[];
  stockItems: StockItem[];
  menuItems: MenuItem[];
  employees: Employee[];
  companyInfo: CompanyInfo;
  cashRegister: CashRegister;
  expenses: Expense[];
  neighborhoodFees: NeighborhoodFee[];
  selectedTableForMenu: string | null;
  setSelectedTableForMenu: (tableNum: string | null) => void;

  // Actions
  createOrder: (params: CreateOrderParams) => Order;
  createBalcaoSale: (items: CartItem[], paymentMethod: PaymentMethod, amountPaid?: number, change?: number, notes?: string) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addItemToOrder: (orderId: string, item: MenuItem, quantity: number, notes?: string) => void;
  transferTable: (fromTableNumber: string, toTableNumber: string) => boolean;
  applyOrderDiscount: (orderId: string, discount: number) => void;
  splitOrderBill: (orderId: string, splitCount: number) => void;
  requestTableBill: (tableNumber: string) => void;
  processOrderPayment: (orderId: string, paymentMethod: PaymentMethod, amountPaid?: number, change?: number) => void;
  openCashRegister: (initialBalance: number) => void;
  closeCashRegister: () => void;
  addCashTransaction: (type: 'SANGRIA' | 'SUPRIMENTO' | 'DESPESA', amount: number, description: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  toggleExpenseStatus: (id: string) => void;
  deleteExpense: (id: string) => void;
  updateStockQuantity: (stockItemId: string, delta: number) => void;
  updateNeighborhoodFees: (fees: NeighborhoodFee[]) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (item: MenuItem) => void;
  deleteMenuItem: (itemId: string) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (employeeId: string) => void;
  updateCompanyInfo: (info: CompanyInfo) => void;
  resetAllData: () => void;

  // Active Operator & Permission Control
  currentEmployee: Employee | null;
  setCurrentEmployeeId: (id: string | null) => void;
  hasPermission: (permission: SystemPermission) => boolean;
  toggleEmployeePermission: (employeeId: string, permission: SystemPermission) => void;
  updateEmployeePermissions: (employeeId: string, permissions: SystemPermission[]) => void;

  // Attendant Ready Alerts
  attendantAlert: AttendantAlert | null;
  notifyAttendantOrderReady: (order: Order) => void;
  dismissAttendantAlert: () => void;

  // Database Backup & Restore
  exportDatabaseBackup: () => DatabaseBackupPayload;
  importDatabaseBackup: (payload: DatabaseBackupPayload) => { success: boolean; message: string };
  snapshots: BackupSnapshot[];
  createLocalSnapshot: (label?: string, source?: 'manual' | 'auto' | 'pre-restore') => BackupSnapshot;
  restoreLocalSnapshot: (snapshotId: string) => boolean;
  deleteLocalSnapshot: (snapshotId: string) => void;

  // Offline Persistence & IndexedDB
  isOnline: boolean;
  pendingOfflineCount: number;
  syncOfflineQueue: () => Promise<{ synced: number; failed: number }>;

  // Tables Management (Incluir ou Deletar Mesas)
  addTable: (params?: { number?: string; peopleCount?: number }) => Table;
  deleteTable: (tableNumber: string) => { success: boolean; message: string };

  // Delivery Customers Management (Cadastro e Busca por Telefone, CPF e Nome)
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (customerOrId: Customer | string, updates?: Partial<Customer>) => void;
  deleteCustomer: (customerId: string) => void;
  findCustomers: (query: string) => Customer[];
}

const BurgerSystemContext = createContext<BurgerSystemContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TABLES: 'mari_burger_tables_v2',
  ORDERS: 'mari_burger_orders_v2',
  STOCK: 'mari_burger_stock_v2',
  MENU: 'mari_burger_menu_v2',
  EMPLOYEES: 'mari_burger_employees_v2',
  COMPANY: 'mari_burger_company_v2',
  CASH: 'mari_burger_cash_v2',
  EXPENSES: 'mari_burger_expenses_v2',
  FEES: 'mari_burger_fees_v2',
  SNAPSHOTS: 'mari_burger_snapshots_v2',
  CUSTOMERS: 'mari_burger_customers_v2',
};

export const BurgerSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL parameters for table QR scan, e.g. /?mesa=05 or /m/05
  const getInitialTable = (): string | null => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const mesaParam = urlParams.get('mesa') || urlParams.get('m');
    if (mesaParam) {
      return mesaParam.padStart(2, '0');
    }
    const path = window.location.pathname;
    const match = path.match(/\/m\/(\d+)/i);
    if (match && match[1]) {
      return match[1].padStart(2, '0');
    }
    return null;
  };

  const [selectedTableForMenu, setSelectedTableForMenu] = useState<string | null>(getInitialTable);

  const [tables, setTables] = useState<Table[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TABLES);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_TABLES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_ORDERS;
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STOCK);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_STOCK_ITEMS;
  });

  const [cashRegister, setCashRegister] = useState<CashRegister>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CASH);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_CASH_REGISTER;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_EXPENSES;
  });

  const [neighborhoodFees, setNeighborhoodFees] = useState<NeighborhoodFee[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEES);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_NEIGHBORHOOD_FEES;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MENU);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_MENU_ITEMS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
      if (data) {
        const parsed: Employee[] = JSON.parse(data);
        return parsed.map((emp) => ({
          ...emp,
          permissions:
            emp.permissions && Array.isArray(emp.permissions) && emp.permissions.length > 0
              ? emp.permissions
              : DEFAULT_ROLE_PERMISSIONS[emp.role] || ['menu', 'tables'],
        }));
      }
    } catch {
      // Ignore
    }
    return DEFAULT_EMPLOYEES;
  });

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('mari_burger_active_emp_id') || 'emp-5';
    } catch {
      return 'emp-5';
    }
  });

  useEffect(() => {
    try {
      if (currentEmployeeId) {
        localStorage.setItem('mari_burger_active_emp_id', currentEmployeeId);
      } else {
        localStorage.removeItem('mari_burger_active_emp_id');
      }
    } catch {
      // Ignore
    }
  }, [currentEmployeeId]);

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPANY);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_COMPANY_INFO;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (data) return JSON.parse(data);
    } catch {
      // Ignore
    }
    return DEFAULT_CUSTOMERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch {
      // Ignore
    }
  }, [customers]);

  const [attendantAlert, setAttendantAlert] = useState<AttendantAlert | null>(null);

  const notifyAttendantOrderReady = (order: Order) => {
    soundFX.playOrderReadyAlert();
    const itemsSummary = order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const alert: AttendantAlert = {
      id: `alert-${Date.now()}`,
      orderId: order.id,
      displayNumber: order.displayNumber,
      tableNumber: order.tableNumber,
      customerName: order.customer?.name,
      type: order.type,
      itemsSummary,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAttendantAlert(alert);
  };

  const dismissAttendantAlert = () => {
    setAttendantAlert(null);
  };

  // Offline Persistence & IndexedDB State
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  const refreshPendingCount = async () => {
    try {
      const count = await getPendingOrdersCount();
      setPendingOfflineCount(count);
    } catch {
      // Ignore
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const result = await syncPendingOrdersToServer();
      await refreshPendingCount();
      return result;
    } catch {
      return { synced: 0, failed: 0 };
    }
  };

  // Listen to network status and SW messages
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    refreshPendingCount();

    // Listen to messages from Service Worker (e.g. background sync completed)
    if ('serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'ORDER_SYNCED_SUCCESS') {
          refreshPendingCount();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cache cardápio and mesas into IndexedDB whenever they change
  useEffect(() => {
    cacheMenuForOffline(menuItems).catch(() => {});
  }, [menuItems]);

  useEffect(() => {
    cacheTablesForOffline(tables).catch(() => {});
  }, [tables]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify(tables));
    } catch {
      // Ignore
    }
  }, [tables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {
      // Ignore
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(stockItems));
    } catch {
      // Ignore
    }
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(menuItems));
    } catch {
      // Ignore
    }
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    } catch {
      // Ignore
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(companyInfo));
    } catch {
      // Ignore
    }
  }, [companyInfo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CASH, JSON.stringify(cashRegister));
    } catch {
      // Ignore
    }
  }, [cashRegister]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch {
      // Ignore
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(neighborhoodFees));
    } catch {
      // Ignore
    }
  }, [neighborhoodFees]);

  // Helper to deduct stock based on items
  const deductStockForItems = (items: Array<{ menuItemId: string; quantity: number }>) => {
    setStockItems((prevStock) => {
      const stockMap = new Map(prevStock.map((s) => [s.id, { ...s }]));

      items.forEach((item) => {
        const menuItem = menuItems.find((m) => m.id === item.menuItemId) || DEFAULT_MENU_ITEMS.find((m) => m.id === item.menuItemId);
        if (menuItem && menuItem.recipe) {
          menuItem.recipe.forEach((rec) => {
            const stockEntry = stockMap.get(rec.stockItemId);
            if (stockEntry) {
              const amountToDeduct = rec.quantity * item.quantity;
              stockEntry.currentQuantity = Math.max(0, Number((stockEntry.currentQuantity - amountToDeduct).toFixed(2)));
            }
          });
        }
      });

      return Array.from(stockMap.values());
    });
  };

  // Create new order
  const createOrder = (params: CreateOrderParams): Order => {
    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.displayNumber)) + 1 : 101;
    const orderId = `CMD-${nextNumber}`;

    const orderItems = params.items.map((cartItem, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      menuItemId: cartItem.menuItem.id,
      name: cartItem.menuItem.name,
      price: cartItem.menuItem.price,
      quantity: cartItem.quantity,
      notes: cartItem.notes,
      category: cartItem.menuItem.category,
    }));

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const deliveryFee = params.deliveryFee || 0;
    const discount = params.discount || 0;
    const total = Math.max(0, subtotal + deliveryFee - discount);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Generate simulated dynamic PIX copy paste string
    const simulatedPix = `00020126580014br.gov.bcb.pix0136financeiro@minhahamburgueria.com.br520400005303986540${total.toFixed(2)}5802BR5925HAMBURGUERIA ARTESANAL6009SAO PAULO62070503***6304${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: orderId,
      displayNumber: nextNumber,
      type: params.type,
      tableNumber: params.tableNumber,
      customer: params.customer,
      items: orderItems,
      subtotal,
      deliveryFee,
      discount,
      total,
      status: 'NOVO',
      paymentStatus: params.paymentMethod ? 'PAGO' : 'PENDENTE',
      paymentMethod: params.paymentMethod,
      pixCode: simulatedPix,
      createdAt: now.toISOString(),
      notes: params.notes,
    };

    // 1. Deduct stock automatically
    deductStockForItems(orderItems);

    // 2. Play kitchen bell sound
    soundFX.playKitchenBell();

    // 3. If mesa order, update table to ocupada
    if (params.type === 'mesa' && params.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === params.tableNumber
            ? {
                ...t,
                status: 'ocupada',
                currentOrderId: orderId,
                openedAt: t.openedAt || timeFormatted,
                peopleCount: t.peopleCount || 2,
              }
            : t
        )
      );
    }

    // 3.5 If delivery order, auto-register or update customer in CRM
    if (params.type === 'delivery' && params.customer) {
      const custDelivery = params.customer;
      const cleanPhone = custDelivery.phone.replace(/\D/g, '');
      const cleanCpf = (custDelivery.cpf || '').replace(/\D/g, '');

      setCustomers((prev) => {
        const existingIdx = prev.findIndex((c) => {
          const matchPhone = cleanPhone.length > 0 && c.phone.replace(/\D/g, '') === cleanPhone;
          const matchCpf = cleanCpf.length > 0 && (c.cpf || '').replace(/\D/g, '') === cleanCpf;
          return matchPhone || matchCpf;
        });

        if (existingIdx >= 0) {
          const updated = [...prev];
          const curr = updated[existingIdx];
          updated[existingIdx] = {
            ...curr,
            name: custDelivery.name || curr.name,
            phone: custDelivery.phone || curr.phone,
            cpf: custDelivery.cpf || curr.cpf,
            cep: custDelivery.cep || curr.cep,
            address: custDelivery.address || curr.address,
            number: custDelivery.number || curr.number,
            bairro: custDelivery.bairro || curr.bairro,
            complement: custDelivery.complement || curr.complement,
            reference: custDelivery.reference || curr.reference,
            totalOrdersCount: (curr.totalOrdersCount || 0) + 1,
            totalSpent: (curr.totalSpent || 0) + total,
            lastOrderAt: now.toISOString(),
          };
          return updated;
        } else {
          const newCust: Customer = {
            id: `cli-${Date.now()}`,
            name: custDelivery.name,
            phone: custDelivery.phone,
            cpf: custDelivery.cpf,
            cep: custDelivery.cep,
            address: custDelivery.address,
            number: custDelivery.number,
            bairro: custDelivery.bairro,
            complement: custDelivery.complement,
            reference: custDelivery.reference,
            totalOrdersCount: 1,
            totalSpent: total,
            createdAt: now.toISOString(),
            lastOrderAt: now.toISOString(),
          };
          return [newCust, ...prev];
        }
      });
    }

    setOrders((prev) => [newOrder, ...prev]);

    // 4. Persiste no IndexedDB para contingência offline imediata
    savePendingOrder(newOrder)
      .then(() => refreshPendingCount())
      .catch((err) => console.warn('[IndexedDB] Erro ao persistir pedido:', err));

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const nowIso = new Date().toISOString();
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const updated = {
          ...order,
          status,
          preparedAt: status === 'EM PREPARO' && !order.preparedAt ? nowIso : order.preparedAt,
          readyAt: status === 'PRONTO' && !order.readyAt ? nowIso : order.readyAt,
          deliveredAt: (status === 'ENTREGUE' || status === 'FINALIZADO') && !order.deliveredAt ? nowIso : order.deliveredAt,
        };
        if (status === 'PRONTO') {
          setTimeout(() => notifyAttendantOrderReady(updated), 50);
        }
        return updated;
      })
    );
  };

  const addItemToOrder = (orderId: string, item: MenuItem, quantity: number, notes?: string) => {
    deductStockForItems([{ menuItemId: item.id, quantity }]);
    soundFX.playKitchenBell();

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        const newItem = {
          id: `item-${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
          notes,
          category: item.category,
        };

        const newItems = [...order.items, newItem];
        const newSubtotal = newItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
        const newTotal = Math.max(0, newSubtotal + order.deliveryFee - order.discount);

        return {
          ...order,
          items: newItems,
          subtotal: newSubtotal,
          total: newTotal,
          status: 'NOVO', // Reset to novo so kitchen notices additional items
        };
      })
    );
  };

  const transferTable = (fromTableNumber: string, toTableNumber: string): boolean => {
    const targetTable = tables.find((t) => t.number === toTableNumber);
    if (!targetTable || targetTable.status === 'ocupada') {
      return false;
    }

    const sourceTable = tables.find((t) => t.number === fromTableNumber);
    if (!sourceTable || !sourceTable.currentOrderId) {
      return false;
    }

    const orderId = sourceTable.currentOrderId;

    // Update order
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, tableNumber: toTableNumber } : o))
    );

    // Update tables
    setTables((prev) =>
      prev.map((t) => {
        if (t.number === fromTableNumber) {
          return {
            ...t,
            status: 'livre',
            currentOrderId: undefined,
            openedAt: undefined,
            peopleCount: undefined,
          };
        }
        if (t.number === toTableNumber) {
          return {
            ...t,
            status: 'ocupada',
            currentOrderId: orderId,
            openedAt: sourceTable.openedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            peopleCount: sourceTable.peopleCount || 2,
          };
        }
        return t;
      })
    );

    return true;
  };

  const applyOrderDiscount = (orderId: string, discount: number) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const validDiscount = Math.max(0, Math.min(order.subtotal, discount));
        return {
          ...order,
          discount: validDiscount,
          total: Math.max(0, order.subtotal + order.deliveryFee - validDiscount),
        };
      })
    );
  };

  const splitOrderBill = (orderId: string, splitCount: number) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, splitCount: Math.max(1, splitCount) } : order))
    );
  };

  const requestTableBill = (tableNumber: string) => {
    setTables((prev) =>
      prev.map((t) => (t.number === tableNumber ? { ...t, status: 'conta' } : t))
    );
  };

  const processOrderPayment = (
    orderId: string,
    paymentMethod: PaymentMethod,
    amountPaid?: number,
    change?: number
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    soundFX.playCashRegister();

    // 1. Update order payment status
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          paymentStatus: 'PAGO',
          paymentMethod,
          status: 'FINALIZADO',
          deliveredAt: order.deliveredAt || new Date().toISOString(),
        };
      })
    );

    // 2. Add transaction to Cash Register
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'VENDA' as const,
      amount: targetOrder.total,
      paymentMethod,
      description: targetOrder.tableNumber
        ? `Mesa ${targetOrder.tableNumber} - ${paymentMethod}`
        : `Delivery #${targetOrder.displayNumber} - ${paymentMethod}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderId: targetOrder.id,
    };

    setCashRegister((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    // 3. If it was a table, release table to 'livre'
    if (targetOrder.tableNumber) {
      setTables((prev) =>
        prev.map((t) =>
          t.number === targetOrder.tableNumber
            ? {
                ...t,
                status: 'livre',
                currentOrderId: undefined,
                openedAt: undefined,
                peopleCount: undefined,
                notes: undefined,
              }
            : t
        )
      );
    }
  };

  const openCashRegister = (initialBalance: number) => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const initTx = {
      id: `tx-${Date.now()}`,
      type: 'SUPRIMENTO' as const,
      amount: initialBalance,
      description: 'Abertura de Caixa (Troco Inicial)',
      timestamp: now,
    };

    setCashRegister({
      id: `cx-${Date.now()}`,
      isOpen: true,
      openedAt: now,
      initialBalance,
      transactions: [initTx],
    });
  };

  const closeCashRegister = () => {
    setCashRegister((prev) => ({
      ...prev,
      isOpen: false,
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  };

  const addCashTransaction = (
    type: 'SANGRIA' | 'SUPRIMENTO' | 'DESPESA',
    amount: number,
    description: string
  ) => {
    const newTx = {
      id: `tx-${Date.now()}`,
      type,
      amount,
      description,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCashRegister((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const toggleExpenseStatus = (id: string) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: e.status === 'PAGO' ? 'PENDENTE' : 'PAGO' } : e))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateStockQuantity = (stockItemId: string, delta: number) => {
    setStockItems((prev) =>
      prev.map((item) =>
        item.id === stockItemId
          ? { ...item, currentQuantity: Math.max(0, Number((item.currentQuantity + delta).toFixed(2))) }
          : item
      )
    );
  };

  const updateNeighborhoodFees = (fees: NeighborhoodFee[]) => {
    setNeighborhoodFees(fees);
  };

  const createBalcaoSale = (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    amountPaid?: number,
    change?: number,
    notes?: string
  ): Order => {
    const nextNumber = orders.length > 0 ? Math.max(...orders.map((o) => o.displayNumber)) + 1 : 101;
    const orderId = `CMD-${nextNumber}`;

    const orderItems = items.map((cartItem, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      menuItemId: cartItem.menuItem.id,
      name: cartItem.menuItem.name,
      price: cartItem.menuItem.price,
      quantity: cartItem.quantity,
      notes: cartItem.notes,
      category: cartItem.menuItem.category,
    }));

    const subtotal = orderItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const total = subtotal;
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: orderId,
      displayNumber: nextNumber,
      type: 'balcao',
      items: orderItems,
      subtotal,
      deliveryFee: 0,
      discount: 0,
      total,
      status: 'PRONTO',
      paymentStatus: 'PAGO',
      paymentMethod,
      createdAt: now.toISOString(),
      preparedAt: now.toISOString(),
      readyAt: now.toISOString(),
      deliveredAt: now.toISOString(),
      notes: notes || 'Venda Balcão / PDV Direto',
    };

    // 1. Deduct stock automatically
    deductStockForItems(orderItems);

    // 2. Play cash register sound
    soundFX.playCashRegister();

    // 3. Add transaction directly to Cash Register
    const newTx = {
      id: `tx-${Date.now()}`,
      type: 'VENDA' as const,
      amount: total,
      paymentMethod,
      description: `Balcão / PDV #${nextNumber} - ${paymentMethod}`,
      timestamp: timeFormatted,
      orderId,
    };

    setCashRegister((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));

    // 4. Save order to list
    setOrders((prev) => [newOrder, ...prev]);

    return newOrder;
  };

  const addMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => [item, ...prev]);
  };

  const updateMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => prev.map((m) => (m.id === item.id ? item : m)));
  };

  const deleteMenuItem = (itemId: string) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== itemId));
  };

  // Tables Management (Incluir ou Deletar Mesas)
  const addTable = (params?: { number?: string; peopleCount?: number }): Table => {
    let nextNum = params?.number?.trim();
    if (!nextNum) {
      const numericTables = tables
        .map((t) => parseInt(t.number, 10))
        .filter((n) => !isNaN(n));
      const maxNum = numericTables.length > 0 ? Math.max(...numericTables) : tables.length;
      nextNum = (maxNum + 1).toString().padStart(2, '0');
    } else {
      nextNum = nextNum.padStart(2, '0');
    }

    if (tables.some((t) => t.number === nextNum)) {
      throw new Error(`A Mesa ${nextNum} já está cadastrada.`);
    }

    const nextId = tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1;
    const newTable: Table = {
      id: nextId,
      number: nextNum,
      status: 'livre',
      peopleCount: params?.peopleCount || 4,
    };

    setTables((prev) => [...prev, newTable]);
    return newTable;
  };

  const deleteTable = (tableNumber: string): { success: boolean; message: string } => {
    const table = tables.find((t) => t.number === tableNumber);
    if (!table) {
      return { success: false, message: `Mesa ${tableNumber} não encontrada.` };
    }

    if (table.status !== 'livre' || table.currentOrderId) {
      return {
        success: false,
        message: `Não é possível excluir a Mesa ${tableNumber} porque ela está ocupada ou com comanda aberta. Finalize a conta antes.`,
      };
    }

    const hasActiveOrder = orders.some(
      (o) => o.tableNumber === tableNumber && o.status !== 'FINALIZADO'
    );
    if (hasActiveOrder) {
      return {
        success: false,
        message: `A Mesa ${tableNumber} possui pedido em andamento no KDS ou salão.`,
      };
    }

    setTables((prev) => prev.filter((t) => t.number !== tableNumber));
    if (selectedTableForMenu === tableNumber) {
      setSelectedTableForMenu(null);
    }
    return { success: true, message: `Mesa ${tableNumber} excluída com sucesso.` };
  };

  // Customer Management (Cadastro e Busca por Telefone, CPF e Nome)
  const addCustomer = (customerData: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalOrdersCount: customerData.totalOrdersCount || 0,
      totalSpent: customerData.totalSpent || 0,
    };
    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  const updateCustomer = (customerOrId: Customer | string, updates?: Partial<Customer>) => {
    if (typeof customerOrId === 'string' && updates) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerOrId ? { ...c, ...updates } : c))
      );
    } else if (typeof customerOrId === 'object') {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customerOrId.id ? customerOrId : c))
      );
    }
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const findCustomers = (query: string): Customer[] => {
    if (!query || !query.trim()) return customers;
    const clean = query.toLowerCase().trim();
    const cleanDigits = query.replace(/\D/g, '');

    return customers.filter((c) => {
      const matchName = c.name.toLowerCase().includes(clean);
      const cPhone = c.phone.replace(/\D/g, '');
      const matchPhone = cleanDigits.length > 0 && cPhone.includes(cleanDigits);
      const cCpf = (c.cpf || '').replace(/\D/g, '');
      const matchCpf = cleanDigits.length > 0 && cCpf.includes(cleanDigits);
      const matchBairro = c.bairro.toLowerCase().includes(clean);
      const matchAddress = c.address.toLowerCase().includes(clean);
      return matchName || matchPhone || matchCpf || matchBairro || matchAddress;
    });
  };

  const currentEmployee = employees.find((e) => e.id === currentEmployeeId) || null;

  const hasPermission = (permission: SystemPermission): boolean => {
    if (!currentEmployee) return true; // Master/unrestricted mode
    if (currentEmployee.role === 'gerente') return true;
    if (!currentEmployee.permissions || currentEmployee.permissions.length === 0) {
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[currentEmployee.role] || [];
      if (permission === 'dashboard') return defaultPerms.includes('dashboard') || defaultPerms.includes('finance');
      return defaultPerms.includes(permission);
    }
    if (permission === 'dashboard' && currentEmployee.permissions.includes('finance')) {
      return true;
    }
    return currentEmployee.permissions.includes(permission);
  };

  const toggleEmployeePermission = (employeeId: string, permission: SystemPermission) => {
    setEmployees((prev) =>
      prev.map((e) => {
        if (e.id !== employeeId) return e;
        const currentPerms =
          e.permissions && e.permissions.length > 0
            ? e.permissions
            : DEFAULT_ROLE_PERMISSIONS[e.role] || [];
        const has = currentPerms.includes(permission);
        const updatedPerms = has
          ? currentPerms.filter((p) => p !== permission)
          : [...currentPerms, permission];
        return { ...e, permissions: updatedPerms };
      })
    );
  };

  const updateEmployeePermissions = (employeeId: string, permissions: SystemPermission[]) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employeeId ? { ...e, permissions } : e))
    );
  };

  const addEmployee = (employee: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...employee,
      permissions:
        employee.permissions && employee.permissions.length > 0
          ? employee.permissions
          : DEFAULT_ROLE_PERMISSIONS[employee.role] || ['menu', 'tables'],
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [...prev, newEmp]);
  };

  const updateEmployee = (employee: Employee) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === employee.id
          ? {
              ...employee,
              permissions:
                employee.permissions && employee.permissions.length > 0
                  ? employee.permissions
                  : e.permissions || DEFAULT_ROLE_PERMISSIONS[employee.role] || [],
            }
          : e
      )
    );
  };

  const deleteEmployee = (employeeId: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== employeeId));
    if (currentEmployeeId === employeeId) {
      setCurrentEmployeeId(null);
    }
  };

  const updateCompanyInfo = (info: CompanyInfo) => {
    setCompanyInfo(info);
  };

  // Database Backup & Restore Systems
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SNAPSHOTS);
      if (stored) return JSON.parse(stored);
    } catch {
      // Ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SNAPSHOTS, JSON.stringify(snapshots));
    } catch {
      // Ignore
    }
  }, [snapshots]);

  const exportDatabaseBackup = (): DatabaseBackupPayload => {
    let storedConfig = undefined;
    try {
      const cfg = localStorage.getItem('mari_restaurant_config');
      if (cfg) storedConfig = JSON.parse(cfg);
    } catch {
      // Ignore
    }

    const payload: DatabaseBackupPayload = {
      version: '2.0.0',
      system: 'Mari Hamburgueria Gestão Integrada',
      timestamp: new Date().toISOString(),
      data: {
        tables,
        orders,
        stockItems,
        menuItems,
        employees,
        companyInfo,
        cashRegister,
        expenses,
        neighborhoodFees,
        customers,
        restaurantConfig: storedConfig,
      },
      meta: {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((acc, o) => acc + (o.paymentStatus === 'PAGO' ? o.total : 0), 0),
        totalStockItems: stockItems.length,
        activeEmployees: employees.length,
        tablesCount: tables.length,
        checksum: `CHK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      },
    };
    return payload;
  };

  const createLocalSnapshot = (
    label?: string,
    source: 'manual' | 'auto' | 'pre-restore' = 'manual'
  ): BackupSnapshot => {
    const payload = exportDatabaseBackup();
    const serialized = JSON.stringify(payload);
    const sizeBytes = new Blob([serialized]).size;
    const now = new Date();
    const snap: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      label:
        label ||
        `Snapshot ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: now.toISOString(),
      sizeBytes,
      ordersCount: payload.data.orders.length,
      totalRevenue: payload.meta.totalRevenue,
      itemsCount: payload.data.menuItems.length,
      payload,
      source,
    };

    setSnapshots((prev) => [snap, ...prev.slice(0, 19)]);
    return snap;
  };

  const importDatabaseBackup = (payload: DatabaseBackupPayload): { success: boolean; message: string } => {
    try {
      if (!payload || !payload.data) {
        return { success: false, message: 'Arquivo de backup inválido ou corrompido.' };
      }

      // Automatically create safety recovery snapshot of current state
      createLocalSnapshot('Backup Automático Pré-Restauração', 'pre-restore');

      const d = payload.data;
      if (d.tables && Array.isArray(d.tables)) setTables(d.tables);
      if (d.orders && Array.isArray(d.orders)) setOrders(d.orders);
      if (d.stockItems && Array.isArray(d.stockItems)) setStockItems(d.stockItems);
      if (d.menuItems && Array.isArray(d.menuItems)) setMenuItems(d.menuItems);
      if (d.employees && Array.isArray(d.employees)) setEmployees(d.employees);
      if (d.companyInfo && typeof d.companyInfo === 'object') setCompanyInfo(d.companyInfo);
      if (d.cashRegister && typeof d.cashRegister === 'object') setCashRegister(d.cashRegister);
      if (d.expenses && Array.isArray(d.expenses)) setExpenses(d.expenses);
      if (d.neighborhoodFees && Array.isArray(d.neighborhoodFees)) setNeighborhoodFees(d.neighborhoodFees);
      if (d.customers && Array.isArray(d.customers)) setCustomers(d.customers);
      if (d.restaurantConfig && typeof d.restaurantConfig === 'object') {
        try {
          localStorage.setItem('mari_restaurant_config', JSON.stringify(d.restaurantConfig));
        } catch {
          // Ignore
        }
      }

      soundFX.playCashRegister();
      return {
        success: true,
        message: `Banco de dados restaurado com sucesso! ${d.orders?.length || 0} pedidos e ${d.menuItems?.length || 0} produtos recuperados.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha desconhecida';
      return { success: false, message: `Erro ao restaurar banco de dados: ${msg}` };
    }
  };

  const restoreLocalSnapshot = (snapshotId: string): boolean => {
    const snap = snapshots.find((s) => s.id === snapshotId);
    if (!snap) return false;
    const res = importDatabaseBackup(snap.payload);
    return res.success;
  };

  const deleteLocalSnapshot = (snapshotId: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
  };

  const resetAllData = () => {
    if (window.confirm('Tem certeza que deseja restaurar todos os dados da hamburgueria (mesas, estoque, cardápio, caixa e despesas)?')) {
      setTables(DEFAULT_TABLES);
      setOrders(DEFAULT_ORDERS);
      setStockItems(DEFAULT_STOCK_ITEMS);
      setMenuItems(DEFAULT_MENU_ITEMS);
      setEmployees(DEFAULT_EMPLOYEES);
      setCompanyInfo(DEFAULT_COMPANY_INFO);
      setCashRegister(DEFAULT_CASH_REGISTER);
      setExpenses(DEFAULT_EXPENSES);
      setNeighborhoodFees(DEFAULT_NEIGHBORHOOD_FEES);
      setSelectedTableForMenu(null);
      setCurrentEmployeeId('emp-5');
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <BurgerSystemContext.Provider
      value={{
        tables,
        orders,
        stockItems,
        menuItems,
        employees,
        companyInfo,
        cashRegister,
        expenses,
        neighborhoodFees,
        selectedTableForMenu,
        setSelectedTableForMenu,
        createOrder,
        createBalcaoSale,
        updateOrderStatus,
        addItemToOrder,
        transferTable,
        applyOrderDiscount,
        splitOrderBill,
        requestTableBill,
        processOrderPayment,
        openCashRegister,
        closeCashRegister,
        addCashTransaction,
        addExpense,
        toggleExpenseStatus,
        deleteExpense,
        updateStockQuantity,
        updateNeighborhoodFees,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        updateCompanyInfo,
        resetAllData,
        currentEmployee,
        setCurrentEmployeeId,
        hasPermission,
        toggleEmployeePermission,
        updateEmployeePermissions,
        attendantAlert,
        notifyAttendantOrderReady,
        dismissAttendantAlert,
        exportDatabaseBackup,
        importDatabaseBackup,
        snapshots,
        createLocalSnapshot,
        restoreLocalSnapshot,
        deleteLocalSnapshot,
        isOnline,
        pendingOfflineCount,
        syncOfflineQueue,
        addTable,
        deleteTable,
        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        findCustomers,
      }}
    >
      {children}
    </BurgerSystemContext.Provider>
  );
};

export const useBurgerSystem = () => {
  const context = useContext(BurgerSystemContext);
  if (!context) {
    throw new Error('useBurgerSystem must be used within a BurgerSystemProvider');
  }
  return context;
};
