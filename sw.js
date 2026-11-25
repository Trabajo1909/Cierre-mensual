// Cierre mensual · Service worker: guarda la app para que abra aunque no haya internet.
// Súbelo a GitHub junto a index.html, con el nombre exacto sw.js (en la misma carpeta).
const APP = "cierre-app-v1";

self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(APP).then(c => c.addAll(["./", "./index.html"]).catch(() => {}))); });
self.addEventListener("activate", e => { e.waitUntil(self.clients.claim()); });

self.addEventListener("fetch", e => {
  const req = e.request; if(req.method !== "GET") return;
  const url = new URL(req.url);
  // Lo de Supabase (datos, archivos, sesión) lo maneja la app; aquí no se toca
  if(/supabase\.co$/.test(url.hostname) || url.hostname === "cierre-offline") return;
  const esApp = url.origin === self.location.origin;
  const esLibreria = /cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com/.test(url.hostname);
  if(esApp){
    // La app: primero de internet (para tener la versión más nueva); sin internet, la copia guardada
    e.respondWith(fetch(req).then(r => { if(r.ok){ const cp = r.clone(); caches.open(APP).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req).then(r => r || caches.match("./index.html"))));
  } else if(esLibreria){
    // Librerías (PDF, Excel, letras): de la copia si ya están; si no, se bajan y se guardan
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(n => { if(n.ok || n.type === "opaque"){ const cp = n.clone(); caches.open(APP).then(c => c.put(req, cp)); } return n; })));
  }
});
