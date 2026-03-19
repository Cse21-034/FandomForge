// FandomForge Service Worker — copy to client/public/sw.js
const CACHE = "fandomforge-v1";
const PRECACHE = ["/", "/browse", "/auth", "/manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  // API: always network
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(e.request));
    return;
  }
  // External (Cloudinary, Stripe, etc): network only
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Static + pages: cache first, fallback network, fallback offline shell
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // ✅ clone BEFORE anything else touches the body
        if (e.request.method === "GET" && res.status === 200) {
          const toCache = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, toCache));
        }
        return res;
      });
    }).catch(() => {
      if (e.request.mode === "navigate") return caches.match("/");
    })
  );
});

// Push notifications
self.addEventListener("push", e => {
  if (!e.data) return;
  const d = e.data.json();
  self.registration.showNotification(d.title || "FandomForge", {
    body:  d.body  || "You have a new notification",
    icon:  "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data:  { url: d.url || "/" },
  });
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || "/"));
});