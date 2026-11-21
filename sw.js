// Service worker de Rutina (versión publicada en GitHub Pages).
//
// Qué hace: guarda la app (un solo HTML + manifest + íconos) para que abra en
// el gimnasio sin señal. Primero el caché, y la red solo si falta algo.
//
// Qué NO hace: tocar los datos. Sesiones, series, fotos y respaldos viven en
// IndexedDB, localStorage y el .json del usuario; este archivo no los lee ni
// los borra. Al cambiar de versión solo se borran los cachés «rutina-app-*».
//
// Versión nueva: armar-pages.py cambia VERSION en cada publicación. El SW
// nuevo se instala y ESPERA; la app muestra «Hay una versión nueva» y solo
// cuando el usuario toca «Actualizar» le pide que tome el control.

const VERSION = "2255a8d207";
const CACHE = "rutina-app-" + VERSION;
const ARCHIVOS = ["./", "index.html", "manifest.webmanifest", "icono-192.png", "icono-512.png", "icono-maskable-512.png", "icono.svg", "icono-apple.png"];

self.addEventListener("install", (ev) => {
  // cache: "reload" salta el caché HTTP de GitHub Pages (10 min): así la versión
  // nueva se guarda entera y no mezclada con la anterior.
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: "reload" })))));
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k.startsWith("rutina-app-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (ev) => {
  if (ev.data === "actualizar") self.skipWaiting();
  else if (ev.data === "version" && ev.source) ev.source.postMessage({ tipo: "version", version: VERSION });
});

self.addEventListener("fetch", (ev) => {
  const r = ev.request;
  if (r.method !== "GET" || new URL(r.url).origin !== self.location.origin) return;
  if (r.mode === "navigate") {
    // Cualquier navegación dentro del alcance abre la app guardada (con ?parámetros incluidos).
    ev.respondWith(caches.match("index.html", { cacheName: CACHE }).then((h) => h || fetch(r)));
    return;
  }
  ev.respondWith(caches.match(r, { cacheName: CACHE, ignoreSearch: true }).then((h) => h || fetch(r)));
});
