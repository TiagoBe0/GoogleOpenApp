"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Activa o desactiva los avisos push en este navegador.
 *
 * **El permiso se pide solo cuando la persona toca el botón, nunca al cargar.**
 * Un pedido automático apenas entrás es la forma más rápida de que te lo
 * denieguen para siempre: el navegador recuerda el "no" y después no hay manera
 * de volver a preguntar. Además Chrome penaliza a los sitios que lo hacen.
 */

type Estado =
  | "cargando"
  | "no-soportado"
  | "sin-configurar"
  | "activo"
  | "inactivo"
  | "bloqueado";

/**
 * La clave VAPID viaja en base64url y el navegador la pide como bytes.
 *
 * El buffer se crea explícito y no con `Uint8Array.from`: desde TypeScript 5.7
 * ese devuelve `Uint8Array<ArrayBufferLike>`, que podría ser un
 * `SharedArrayBuffer`, y `applicationServerKey` solo acepta `ArrayBuffer`.
 */
function claveABytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export default function PushToggle() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [clave, setClave] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;

    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (vigente) setEstado("no-soportado");
        return;
      }

      // Sin claves VAPID en el servidor no tiene sentido ofrecer el botón:
      // activarlo fallaría y la persona no tiene forma de saber por qué.
      const res = await fetch("/api/push/subscribe").catch(() => null);
      const data = res?.ok ? await res.json().catch(() => null) : null;
      if (!data?.enabled) {
        if (vigente) setEstado("sin-configurar");
        return;
      }
      if (vigente) setClave(data.publicKey);

      if (Notification.permission === "denied") {
        if (vigente) setEstado("bloqueado");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (vigente) setEstado(sub ? "activo" : "inactivo");
    })();

    return () => {
      vigente = false;
    };
  }, []);

  const activar = useCallback(async () => {
    if (!clave) return;
    setOcupado(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        // Sin esto el navegador permitiría avisos sin contenido visible, que
        // Chrome directamente rechaza.
        userVisibleOnly: true,
        applicationServerKey: claveABytes(clave),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      // Si el servidor no la guardó, la suscripción del navegador queda
      // huérfana: se deshace para que el botón no mienta diciendo "activo".
      if (!res.ok) {
        await sub.unsubscribe().catch(() => {});
        setEstado("inactivo");
        return;
      }

      setEstado("activo");
    } catch {
      setEstado("inactivo");
    } finally {
      setOcupado(false);
    }
  }, [clave]);

  const desactivar = useCallback(async () => {
    setOcupado(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setEstado("inactivo");
    } finally {
      setOcupado(false);
    }
  }, []);

  // Nada que ofrecer: navegador viejo, servidor sin claves, o todavía cargando.
  if (estado === "cargando" || estado === "no-soportado" || estado === "sin-configurar") {
    return null;
  }

  if (estado === "bloqueado") {
    return (
      <p className="text-xs text-muted">
        Bloqueaste los avisos para este sitio. Para recibirlos, habilitalos en los
        permisos del navegador.
      </p>
    );
  }

  const activo = estado === "activo";

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={activo ? desactivar : activar}
        disabled={ocupado}
        className={
          activo
            ? "min-h-11 rounded-md border border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger disabled:opacity-50"
            : "min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:opacity-50"
        }
      >
        {ocupado ? "Un momento..." : activo ? "Desactivar avisos" : "Activar avisos"}
      </button>
      <p className="text-xs text-muted">
        {activo
          ? "Te avisamos en este dispositivo cuando se pida, confirme, mueva o cancele un turno."
          : "Recibí un aviso en este dispositivo cuando cambie algo en tus turnos."}
      </p>
    </div>
  );
}
