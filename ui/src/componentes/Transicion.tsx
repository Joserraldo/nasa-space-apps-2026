import { useEffect, useRef, type ReactNode } from "react";
import "./transicion.css";

/**
 * Cambio de pantalla con un fundido corto (`--dur-aparecer`, sin animación con movimiento reducido)
 * y el foco en la pantalla nueva: su título, o su primer control si no tiene título. Si la pantalla
 * ya puso el foco en algo suyo (un panel que enfoca su acción), se respeta.
 */
export function Transicion({ clave, children }: { clave: string; children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = caja.current;
      if (!c || c.contains(document.activeElement)) return;
      const titulo = c.querySelector<HTMLElement>("h1, h2");
      const destino = titulo ?? c.querySelector<HTMLElement>("button:not([disabled]), a[href], input, [tabindex]:not([tabindex='-1'])");
      if (!destino) return;
      if (destino === titulo && !titulo.hasAttribute("tabindex")) titulo.setAttribute("tabindex", "-1");
      destino.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [clave]);
  return <div key={clave} ref={caja} className="transicion" data-pantalla={clave}>{children}</div>;
}
