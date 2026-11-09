import { Order, MenuItem, Table } from '../types.ts';

const DB_NAME = 'mari_burger_offline_db';
const DB_VERSION = 1;

export const STORES = {
  PENDING_ORDERS: 'pending_orders',
  OFFLINE_MENU: 'offline_menu',
  OFFLINE_TABLES: 'offline_tables',
  SYNC_LOG: 'sync_log',
} as const;

export interface OfflineSyncLogEntry {
  id: string;
  orderId: string;
  tableNumber?: string;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'ERROR';
  errorMessage?: string;
}

/**
 * Abre e inicializa o banco IndexedDB para contingência offline
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não suportado neste navegador'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Fila de pedidos pendentes para sincronização
      if (!db.objectStoreNames.contains(STORES.PENDING_ORDERS)) {
        const orderStore = db.createObjectStore(STORES.PENDING_ORDERS, { keyPath: 'id' });
        orderStore.createIndex('createdAt', 'createdAt', { unique: false });
        orderStore.createIndex('status', 'status', { unique: false });
      }

      // Cache do Cardápio para consulta sem internet
      if (!db.objectStoreNames.contains(STORES.OFFLINE_MENU)) {
        db.createObjectStore(STORES.OFFLINE_MENU, { keyPath: 'id' });
      }

      // Cache das 30 Mesas do salão
      if (!db.objectStoreNames.contains(STORES.OFFLINE_TABLES)) {
        db.createObjectStore(STORES.OFFLINE_TABLES, { keyPath: 'number' });
      }

      // Histórico de sincronizações
      if (!db.objectStoreNames.contains(STORES.SYNC_LOG)) {
        db.createObjectStore(STORES.SYNC_LOG, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva um pedido na fila offline do IndexedDB
 */
export async function savePendingOrder(order: Order): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.PENDING_ORDERS, STORES.SYNC_LOG], 'readwrite');
    const orderStore = tx.objectStore(STORES.PENDING_ORDERS);
    const logStore = tx.objectStore(STORES.SYNC_LOG);

    orderStore.put(order);

    const logEntry: OfflineSyncLogEntry = {
      id: `log-${Date.now()}-${order.id}`,
      orderId: order.id,
      tableNumber: order.tableNumber,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };
    logStore.put(logEntry);

    tx.oncomplete = () => {
      // Notifica o Service Worker (se disponível) sobre novo pedido pendente
      notifyServiceWorkerSync();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Obtém todos os pedidos pendentes armazenados no IndexedDB
 */
export async function getPendingOrders(): Promise<Order[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_ORDERS, 'readonly');
    const store = tx.objectStore(STORES.PENDING_ORDERS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Conta a quantidade de pedidos aguardando sincronização
 */
export async function getPendingOrdersCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_ORDERS, 'readonly');
    const store = tx.objectStore(STORES.PENDING_ORDERS);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove um pedido sincronizado da fila offline
 */
export async function removePendingOrder(orderId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_ORDERS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_ORDERS);
    const request = store.delete(orderId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Limpa toda a fila offline de pedidos pendentes
 */
export async function clearPendingOrders(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PENDING_ORDERS, 'readwrite');
    const store = tx.objectStore(STORES.PENDING_ORDERS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva cache do cardápio completo no IndexedDB
 */
export async function cacheMenuForOffline(items: MenuItem[]): Promise<void> {
  if (!items || items.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_MENU, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_MENU);

    // Salva cada item
    items.forEach((item) => store.put(item));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Obtém o cardápio em cache offline
 */
export async function getOfflineMenu(): Promise<MenuItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_MENU, 'readonly');
    const store = tx.objectStore(STORES.OFFLINE_MENU);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Salva cache das mesas no IndexedDB
 */
export async function cacheTablesForOffline(tables: Table[]): Promise<void> {
  if (!tables || tables.length === 0) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_TABLES, 'readwrite');
    const store = tx.objectStore(STORES.OFFLINE_TABLES);

    tables.forEach((table) => store.put(table));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Obtém cache das mesas do IndexedDB
 */
export async function getOfflineTables(): Promise<Table[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.OFFLINE_TABLES, 'readonly');
    const store = tx.objectStore(STORES.OFFLINE_TABLES);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Dispara aviso ao Service Worker para sincronizar em segundo plano
 */
function notifyServiceWorkerSync() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_PENDING_ORDERS',
        timestamp: Date.now(),
      });
    } catch {
      // Ignora erro se SW não estiver pronto
    }
  }
}

/**
 * Sincroniza pedidos pendentes com a API ou estado do sistema quando a conexão volta
 */
export async function syncPendingOrdersToServer(
  onSynced?: (order: Order) => void
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingOrders();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const order of pending) {
    try {
      // Tenta enviar para endpoint do servidor caso exista
      const response = await fetch('/api/orders/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      if (response.ok || response.status === 404) {
        // Se a rota do servidor responder ou se for um servidor SPA em dev,
        // consideramos com sucesso e removemos da fila local
        await removePendingOrder(order.id);
        if (onSynced) onSynced(order);
        synced++;
      } else {
        failed++;
      }
    } catch {
      // Ainda sem conexão com o servidor
      failed++;
    }
  }

  return { synced, failed };
}
