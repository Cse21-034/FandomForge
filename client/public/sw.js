// FandomForge Service Worker v2 — reliable install + offline support
const CACHE = "fandomforge-v2";
const PRECACHE = [
  "/",
  "/browse",
  "/auth",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// ── Install: pre-cache shell ─────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      // Use individual adds so one failure doesn't kill everything
      return Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
    })
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  // Take control of all open pages immediately
  self.clients.claim();
});

// ── Fetch: smart caching strategy ───────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API calls: network only, never cache
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(request));
    return;
  }

  // External resources (Cloudinary, Stripe, fonts, etc): network only
  if (url.origin !== self.location.origin) {
    e.respondWith(fetch(request).catch(() => new Response("", { status: 408 })));
    return;
  }

  // HTML navigation requests: network-first, fallback to cache, then offline shell
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((res) => {
          // Cache a fresh copy
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
          return res;
        })
        .catch(() => {
          // Offline: serve cached page or root shell
          return caches.match(request).then(
            (cached) => cached || caches.match("/") || new Response("<h1>Offline</h1>", {
              headers: { "Content-Type": "text/html" }
            })
          );
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): cache-first
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((res) => {
        // Only cache successful same-origin responses
        if (res.ok && res.type !== "opaque") {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => {
        // Return empty response for failed asset loads
        return new Response("", { status: 408 });
      });
    })
  );
});

// ── Push notifications ───────────────────────────────────────────────
self.addEventListener("push", (e) => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: "FandomForge", body: e.data.text() }; }
  
  self.registration.showNotification(data.title || "FandomForge", {
    body: data.body || "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  });
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});