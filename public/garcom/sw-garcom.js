// Service Worker para Garçom Pocket (Mobile Comanda)
// Persistência com IndexedDB e Contingência Offline

const CACHE_NAME = 'mari-garcom-v1';
const DB_NAME = 'mari_burger_offline_db';
const DB_VERSION = 1;
const STORE_PENDING_ORDERS = 'pending_orders';

const PRECACHE_ASSETS = [
  '/garcom/index.html',
  '/garcom/manifest-garcom.json',
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Sincronização de pedidos pendentes via IndexedDB
async function syncOfflineOrders() {
  if (!self.indexedDB) return;
  try {
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PENDING_ORDERS)) return;

      const tx = db.transaction([STORE_PENDING_ORDERS], 'readonly');
      const store = tx.objectStore(STORE_PENDING_ORDERS);
      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const orders = getAllReq.result || [];
        for (const order of orders) {
          try {
            const res = await fetch('/api/orders/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(order),
            });
            if (res.ok) {
              const delTx = db.transaction([STORE_PENDING_ORDERS], 'readwrite');
              delTx.objectStore(STORE_PENDING_ORDERS).delete(order.id);
            }
          } catch {
            // Continua na fila
          }
        }
      };
    };
  } catch (err) {
    console.warn('[Garcom SW] Erro sync IndexedDB:', err);
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_PENDING_ORDERS') {
    event.waitUntil(syncOfflineOrders());
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => caches.match('/garcom/index.html') || caches.match('/index.html'));
    })
  );
});
