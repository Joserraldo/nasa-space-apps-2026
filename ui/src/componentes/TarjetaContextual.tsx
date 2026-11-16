import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { TarjetaContextual as Presentacion } from "./base/TarjetaContextual.js";

/**
 * Tarjeta contextual (PLAN-JUGABILIDAD §1 y E1; MECANICAS §4 y §6).
 *
 * - Nace de un evento del mundo (llegar a un anclaje, `[E]`, hablar con la tripulación) y no está
 *   fija en la pantalla: cerrada no se dibuja.
 * - Una a la vez: `useTarjetaUnica` guarda una sola tarjeta abierta; abrir otra reemplaza a la anterior.
 * - Se cierra al decidir o con `Back`/Esc. Abrirla y cerrarla nunca cobra: la tarjeta no conoce el motor.
 * - No toca el reloj: la pausa previa se conserva.
 *
 * El aspecto, la entrada y la salida, y el foco que entra y vuelve son de la primitiva del frente F
 * (`base/TarjetaContextual.tsx`, F2). Aquí solo se agrega lo del flujo: Esc cierra sin decidir y, si el contenido cambia, el foco no se pierde.
 */
export function TarjetaContextual({ abierta, onCerrar, contenido, ...resto }: ComponentProps<typeof Presentacion> & {
  /** Cerrar sin decidir (Esc o `Back`): no cambia nada del juego. */
  onCerrar: () => void;
  /**
   * Qué muestra la tarjeta (por ejemplo, el módulo elegido). Si cambia con la tarjeta abierta y el foco
   * se perdió con el control que lo cambió, el foco vuelve a la tarjeta.
   */
  contenido?: string | undefined;
}) {
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;

  useEffect(() => {
    if (!abierta) return;
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); cerrar.current(); }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierta]);

  useEffect(() => {
    if (!abierta) return;
    const activo = document.activeElement;
    if (!activo || activo === document.body) document.querySelector<HTMLElement>('[role="dialog"].tc[data-fase="abierta"]')?.focus({ preventScroll: true });
  }, [abierta, contenido]);

  return <Presentacion abierta={abierta} {...resto} />;
}

/**
 * Una sola tarjeta abierta a la vez: abrir reemplaza; cerrar deja la pantalla libre. `mostrada` es la
 * última que se abrió, para que la tarjeta conserve su contenido mientras dura la salida.
 */
export function useTarjetaUnica<T>() {
  const [abierta, setAbierta] = useState<T | null>(null);
  const ultima = useRef<T | null>(null);
  if (abierta !== null) ultima.current = abierta;
  const abrir = useCallback((t: T) => setAbierta(t), []);
  const cerrar = useCallback(() => setAbierta(null), []);
  return { abierta, mostrada: abierta ?? ultima.current, abrir, cerrar } as const;
}
