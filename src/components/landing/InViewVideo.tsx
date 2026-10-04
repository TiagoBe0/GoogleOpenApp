"use client";

import { useEffect, useRef } from "react";

/**
 * Video mudo en loop que solo se reproduce mientras está en pantalla. Con seis
 * en la grilla, reproducirlos todos a la vez gasta datos del celular y batería
 * para videos que nadie está mirando. Con `preload="none"` no se descarga nada
 * hasta que aparece.
 */
export default function InViewVideo({ src, poster, className }: { src: string; poster: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={className}
    />
  );
}
