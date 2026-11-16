import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Tarjeta contextual (PLAN-JUGABILIDAD §1 y E1; MECANICAS §4 y §6).
 *
 * - Nace de un evento del mundo (llegar a un anclaje, `[E]`, hablar con la tripulación) y no está
 *   fija en la pantalla: cerrada no se dibuja.
 * - Una a la vez: `useTarjetaUnica` guarda una sola tarjeta abierta; abrir otra reemplaza a la anterior.
 * - Se cierra al decidir o con `Back`/Esc. Abrirla y cerrarla nunca cobra: la tarjeta no conoce el motor.
 * - Foco: al abrir entra al primer control de la tarjeta y al cerrar vuelve a donde estaba (invariante 3).
 *   No toca el reloj: la pausa previa se conserva.
 *
 * El aspecto lo da la clase que pase quien la usa (los estilos son del frente F).
 */
export function TarjetaContextual({ abierta, etiquetaId, onCerrar, className, children }: {
  abierta: boolean;
  /** `id` del título de la tarjeta, para `aria-labelledby`. */
  etiquetaId: string;
  /** Cerrar sin decidir (Esc o `Back`): no cambia nada del juego. */
  onCerrar: () => void;
  className?: string;
  children: ReactNode;
}) {
  const caja = useRef<HTMLElement>(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierta) return;
    const origen = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const primero = caja.current?.querySelector<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    (primero ?? caja.current)?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); cerrar.current(); }
    }
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("keydown", tecla);
      if (origen?.isConnected) origen.focus();
    };
  }, [abierta]);

  if (!abierta) return null;
  return (
    <aside ref={caja} role="dialog" aria-modal="false" aria-labelledby={etiquetaId} tabIndex={-1}
      className={className} data-tarjeta="contextual">
      {children}
    </aside>
  );
}

/** Una sola tarjeta abierta a la vez: abrir reemplaza; cerrar deja la pantalla libre. */
export function useTarjetaUnica<T>() {
  const [abierta, setAbierta] = useState<T | null>(null);
  const abrir = useCallback((t: T) => setAbierta(t), []);
  const cerrar = useCallback(() => setAbierta(null), []);
  return { abierta, abrir, cerrar } as const;
}
