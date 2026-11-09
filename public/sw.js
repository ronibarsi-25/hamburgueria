// Service Worker para Mari Burger Artesanal
// Persistência com IndexedDB e Contingência Offline

const CACHE_NAME = 'mari-burger-v1';
const DB_NAME = 'mari_burger_offline_db';
const DB_VERSION = 1;
const STORE_PENDING_ORDERS = 'pending_orders';
const STORE_SYNC_LOG = 'sync_log';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/garcom/index.html',
  '/garcom/manifest-garcom.json',
];

// Instalação: Pré-cache dos arquivos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Alguns recursos não puderam ser pré-cacheados:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper para abrir IndexedDB dentro do Service Worker
function openSWIndexedDB() {
  return new Promise((resolve, reject) => {
    if (!self.indexedDB) {
      return reject(new Error('IndexedDB indisponível no Service Worker'));
    }
    const request = self.indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_PENDING_ORDERS)) {
        db.createObjectStore(STORE_PENDING_ORDERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_LOG)) {
        db.createObjectStore(STORE_SYNC_LOG, { keyPath: 'id' });
      }
    };
  });
}

// Sincronização de pedidos pendentes armazenados no IndexedDB
async function syncOfflineOrders() {
  try {
    const db = await openSWIndexedDB();
    const tx = db.transaction([STORE_PENDING_ORDERS], 'readonly');
    const store = tx.objectStore(STORE_PENDING_ORDERS);
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = async () => {
      const pendingOrders = getAllRequest.result || [];
      if (pendingOrders.length === 0) return;

      console.log(`[SW Sync] Iniciando envio de ${pendingOrders.length} pedido(s) pendente(s)...`);

      for (const order of pendingOrders) {
        try {
          const response = await fetch('/api/orders/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
          });

          if (response.ok || response.status === 404) {
            // Remove do IndexedDB após envio bem-sucedido
            const deleteTx = db.transaction([STORE_PENDING_ORDERS], 'readwrite');
            deleteTx.objectStore(STORE_PENDING_ORDERS).delete(order.id);

            // Avisa todas as abas abertas (Salão, KDS, Comanda)
            const clients = await self.clients.matchAll();
            for (const client of clients) {
              client.postMessage({
                type: 'ORDER_SYNCED_SUCCESS',
                orderId: order.id,
                tableNumber: order.tableNumber,
                timestamp: Date.now(),
              });
            }
          }
        } catch (fetchError) {
          console.warn(`[SW Sync] Falha ao enviar pedido ${order.id}, continuará na fila:`, fetchError);
        }
      }
    };
  } catch (dbError) {
    console.error('[SW Sync] Erro ao acessar IndexedDB:', dbError);
  }
}

// Background Sync Event (API nativa de Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Mensagens vindas do React
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_PENDING_ORDERS') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Interceptação de Requisições de Rede (Fetch)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições não-GET exceto /api/orders/sync que tem contingência
  if (event.request.method !== 'GET') {
    if (url.pathname === '/api/orders/sync') {
      event.respondWith(
        fetch(event.request).catch(async () => {
          // Se estiver offline ao chamar a API direta de sync, responde aviso
          return new Response(
            JSON.stringify({
              offline: true,
              success: true,
              message: 'Pedido mantido no IndexedDB para sincronização automática quando a rede voltar.',
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        })
      );
    }
    return;
  }

  // Requisição de navegação HTML (SPA): Network first com fallback para cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/index.html') || caches.match(event.request);
      })
    );
    return;
  }

  // Requisições estáticas (JS, CSS, imagens, fontes): Cache first com revalidação
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Busca versão atualizada em background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback genérico offline se for imagem
        if (event.request.destination === 'image') {
          return new Response(
            '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#292524"/><text x="50%" y="50%" fill="#78716c" dominant-baseline="middle" text-anchor="middle">Offline</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});
