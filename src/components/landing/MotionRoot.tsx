"use client";

import { useEffect } from "react";

/**
 * Motor de movimiento de la landing, uno solo para toda la página:
 *
 * - `data-reveal`: aparece al entrar en pantalla (agrega `is-in`).
 * - `data-speed`: parallax vertical. Escribe `--py` según cuánto se alejó el
 *   elemento del centro de la pantalla; el CSS decide cómo usarlo.
 * - `--mx` / `--my` en `<html>`: posición del mouse de -1 a 1, para inclinar.
 *
 * El CSS solo esconde lo que tiene `data-reveal` cuando `<html>` lleva
 * `mm-motion`, que se pone acá. Sin JS, o con movimiento reducido, todo se ve
 * quieto y completo.
 */
export default function MotionRoot() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("mm-motion");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            reveal.unobserve(e.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-speed]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const mid = window.innerHeight / 2;
      for (const el of layers) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
        const offset = (r.top + r.height / 2 - mid) * Number(el.dataset.speed);
        el.style.setProperty("--py", `${offset.toFixed(1)}px`);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      root.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      root.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      reveal.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pointermove", onPointer);
      root.classList.remove("mm-motion");
    };
  }, []);

  return null;
}
