/* =====================================================
   PAÜ SHIFT SYSTEM - SERVICE WORKER
   Progressive Web App + Offline Support + Cache Strategy
   ===================================================== */

const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `pau-shift-${CACHE_VERSION}`;

// Cache stratejileri
const CACHE_STRATEGIES = {
    // Static assets - uzun süre cache'le
    STATIC: [
        '/css/style.css',
        '/css/admin.css',
        '/img/logo.png',
        '/img/logo.ico'
    ],
    
    // JS bundles - cache ama kontrol et
    BUNDLES: [],
    
    // API endpoints - network first, fallback cache
    API_ENDPOINTS: [
        '/api/auth/me',
        '/api/units',
        '/api/staff',
        '/api/week-data',
        '/api/templates',
        '/api/tasks'
    ]
};

// Install - cache'i oluştur
self.addEventListener('install', event => {
    console.log('[SW] Installing service worker...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(CACHE_STRATEGIES.STATIC);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('[SW] Install failed:', err))
    );
});

// Activate - eski cache'leri temizle
self.addEventListener('activate', event => {
    console.log('[SW] Activating service worker...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('pau-shift-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - akıllı cache stratejisi
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Sadece same-origin istekleri handle et
    if (url.origin !== location.origin) {
        return;
    }
    
    // API istekleri - Network First
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Static assets - Cache First
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // JS/CSS bundles - Stale While Revalidate
    if (url.pathname.match(/\.(js|css)$/)) {
        event.respondWith(staleWhileRevalidateStrategy(request));
        return;
    }
    
    // HTML pages - Network First
    if (url.pathname.match(/\.(html?)$/)) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Default: Network only
    event.respondWith(fetch(request));
});

/* =====================================================
   CACHE STRATEGIES
   ===================================================== */

// Network First - API calls için ideal
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Başarılı response'u cache'le
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        // Network başarısız - cache'den dön
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Cache'de de yok - offline page
        return new Response(
            JSON.stringify({ 
                error: 'Offline - No cached data available',
                message: 'İnternet bağlantısı gerekli'
            }),
            { 
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Cache First - Static assets için ideal
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache and network failed:', request.url);
        return new Response('', { status: 404 });
    }
}

// Stale While Revalidate - JS/CSS için ideal
async function staleWhileRevalidateStrategy(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then(c => c.put(request, networkResponse.clone()));
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

/* =====================================================
   HELPER FUNCTIONS
   ===================================================== */

function isStaticAsset(pathname) {
    return CACHE_STRATEGIES.STATIC.some(asset => pathname.includes(asset));
}

// Background sync için (gelecekte)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-shifts') {
        event.waitUntil(syncShiftData());
    }
});

async function syncShiftData() {
    // Offline yapılan değişiklikleri senkronize et
    console.log('[SW] Syncing offline changes...');
    // TODO: IndexedDB'den offline değişiklikleri al ve API'ye gönder
}

// Push notifications için (gelecekte)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Yeni shift bildirimi',
        icon: '/img/logo.png',
        badge: '/img/logo.ico',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification('PAÜ Shift System', options)
    );
});

console.log('[SW] Service Worker loaded - Version:', CACHE_VERSION);
