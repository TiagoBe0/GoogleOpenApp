/*
 * Service worker de PsicoLink.
 *
 * Criterio central: esta app maneja datos de salud y sesiones autenticadas, así
 * que el service worker NO cachea HTML ni respuestas de API. Cachear una página
 * renderizada en el servidor significa poder devolverle a alguien la pantalla de
 * otra persona, o un turno que ya se canceló. Solo se cachean los estáticos de
 * Next, que llevan hash en el nombre y por lo tanto nunca cambian de contenido.
 *
 * Lo único que aporta offline es la pantalla de cortesía.
 */

const VERSION = "v1";
const STATIC_CACHE = `psicolink-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isImmutableAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(png|svg|ico|webp|woff2?)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo GET: un POST cacheado sería un turno reservado dos veces.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Datos de sesión y de pacientes: nunca tocan el cache.
  if (url.pathname.startsWith("/api/")) return;

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            // Las respuestas opacas o con error no se guardan: quedarían
            // pegadas y romperían la pantalla hasta el próximo deploy.
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Navegación: siempre a la red. Si no hay red, pantalla de cortesía.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
  }
});

/*
 * Avisos push.
 *
 * El contenido lo arma el servidor en src/lib/push-payloads.ts y viaja cifrado.
 * Acá solo se muestra: nada de pedir datos ni decidir texto, porque este código
 * corre sin sesión y no debe poder leer nada del usuario.
 */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    // Un push malformado no puede dejar al service worker sin mostrar nada:
    // se cae al aviso genérico de abajo.
  }

  const title = payload.title || "PsicoLink";
  const options = {
    body: payload.body || "Tenés una novedad en tus turnos.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    // Reemplaza el aviso anterior del mismo turno en vez de apilarse.
    tag: payload.tag || "psicolink",
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const target = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // Si la app ya está abierta, se la enfoca y se navega ahí. Abrir una
      // segunda ventana deja al usuario con dos sesiones de la misma app.
      for (const win of wins) {
        if (new URL(win.url).origin === target.origin && "focus" in win) {
          return win.focus().then((w) => (w.navigate ? w.navigate(target.href) : w));
        }
      }
      return self.clients.openWindow(target.href);
    }),
  );
});
