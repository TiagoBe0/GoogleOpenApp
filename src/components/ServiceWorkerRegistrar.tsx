"use client";

import { useEffect } from "react";

/**
 * Registra el service worker que hace instalable la app.
 *
 * No renderiza nada. Va montado en el layout raíz para que el registro ocurra
 * una sola vez por sesión de navegador, no en cada navegación.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // En desarrollo el service worker sirve estáticos viejos desde el cache y
    // hace parecer que un cambio no se aplicó. Solo se registra en producción.
    if (process.env.NODE_ENV !== "production") return;

    // Tras "load" para no competir por ancho de banda con el primer render.
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Que falle el registro no puede romper la app: sin service worker
        // sigue andando todo, solo se pierde la instalación y el offline.
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
