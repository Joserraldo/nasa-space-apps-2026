import { useEffect, useRef, useState } from "react";
import { hayGraficos3D, prefiereMenosMovimiento } from "../../../escena/soporte";

/**
 * Lienzo 3D de una viñeta de la intro. Carga three aparte (import dinámico) y, si no hay WebGL o
 * falla, avisa con `onFallo` para que la intro muestre la tarjeta DOM de respaldo. Con
 * prefers-reduced-motion dibuja la pose clave quieta. Libera todo al cambiar de viñeta o desmontar.
 */
export function Vineta3D({ n, onFallo }: { n: number; onFallo(): void }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [lista, setLista] = useState(false);
  const fallo = useRef(onFallo);
  fallo.current = onFallo;

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    if (!hayGraficos3D()) { fallo.current(); return; }
    let vivo = true;
    let liberar = () => {};
    setLista(false);
    void import("./montar")
      .then(({ montarIntro }) => {
        if (!vivo) return;
        const esc = montarIntro(canvas, n, prefiereMenosMovimiento());
        const medir = () => esc.redimensionar(canvas.clientWidth, canvas.clientHeight);
        const obs = new ResizeObserver(medir);
        obs.observe(canvas);
        medir();
        const perdido = (e: Event) => { e.preventDefault(); fallo.current(); };
        canvas.addEventListener("webglcontextlost", perdido);
        liberar = () => { obs.disconnect(); canvas.removeEventListener("webglcontextlost", perdido); esc.liberar(); };
        setLista(true);
      })
      .catch(() => { if (vivo) fallo.current(); });
    return () => { vivo = false; liberar(); };
  }, [n]);

  return <canvas ref={lienzo} className={`intro3d-lienzo${lista ? " lista" : ""}`} aria-hidden="true" />;
}
