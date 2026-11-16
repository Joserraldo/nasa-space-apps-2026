import { useEffect, useId, useReducer, useRef, type ReactNode } from "react";
import "./facetas.css";
import "./tarjetas.css";

/**
 * Tarjeta contextual (PLAN-JUGABILIDAD §1 y §4, tarea F2; láminas mundo/04 "Decision: world stays
 * visible", mundo/03 "Portrait: paused decision" y ui/01 abajo). Nace de un evento del mundo y se va al
 * decidir. Es solo presentación: quién la abre, cuándo se cierra y que haya una sola a la vez lo decide
 * la pantalla (frente E, tarea E1). Aquí se resuelve cómo se ve, de dónde entra y cómo sale.
 *
 * - `lado`: placa marfil en el borde derecho, debajo del HUD; el mundo sigue a la vista.
 * - `hoja`: hoja inferior a todo el ancho, como en el celular vertical.
 * - `auto` (por defecto): `hoja` en pantallas angostas y verticales, `lado` en el resto (lo decide el CSS).
 *
 * Entra en 180 ms (`--dur-realce`) y sale en 140 ms (`--dur-cerrar`). Con movimiento reducido aparece y
 * se va sin desplazarse. Al abrir lleva el foco a la tarjeta y al cerrarse lo devuelve adonde estaba.
 * No cobra ni decide nada: los botones que recibe en `acciones` son de la pantalla.
 */
export type OrigenTarjeta = "auto" | "lado" | "hoja";

/** `saliendo`: sigue montada mientras dura la animación de salida. */
export type FaseTarjeta = "cerrada" | "abierta" | "saliendo";
export type EventoTarjeta = "abrir" | "cerrar" | "fin";

/**
 * Máquina de la tarjeta. `fin` es el final de una animación: solo cierra si estaba saliendo (el final
 * de la entrada no la cierra). Con movimiento reducido no hay salida animada: se cierra enseguida.
 */
export function faseTarjeta(fase: FaseTarjeta, evento: EventoTarjeta, reducido: boolean): FaseTarjeta {
  if (evento === "abrir") return "abierta";
  if (evento === "cerrar") return fase === "abierta" ? (reducido ? "cerrada" : "saliendo") : fase;
  return fase === "saliendo" ? "cerrada" : fase;
}

/** Respaldo por si el navegador no avisa el final de la salida (pestaña oculta, animación cortada). */
const SALIDA_MAXIMA_MS = 400;

function movimientoReducido(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function TarjetaContextual({ abierta, titulo, figura, bajada, extra, acciones, children, origen = "auto", enfocar = true, onCerrada, className }: {
  abierta: boolean;
  /** Encabezado (h2), ya traducido. Es el nombre accesible del diálogo. */
  titulo: ReactNode;
  /** Retrato u objeto a la izquierda del título (decorativo: el texto va al lado). */
  figura?: ReactNode;
  /** Línea corta bajo el título ("More power needs resources now."). */
  bajada?: ReactNode;
  /** Chip a la derecha del título (por ejemplo, "Paused"). */
  extra?: ReactNode;
  /** Botones de la decisión: el primero es la acción principal y ocupa el ancho que sobra. */
  acciones?: ReactNode;
  children?: ReactNode;
  origen?: OrigenTarjeta;
  /** Lleva el foco a la tarjeta al abrir y lo devuelve al cerrar. */
  enfocar?: boolean;
  /** Avisa cuando la tarjeta ya se fue (terminó la salida). */
  onCerrada?: (() => void) | undefined;
  className?: string | undefined;
}) {
  const id = useId();
  const [fase, despachar] = useReducer((f: FaseTarjeta, a: { e: EventoTarjeta; reducido: boolean }) => faseTarjeta(f, a.e, a.reducido), abierta ? "abierta" : "cerrada");
  const mandar = (e: EventoTarjeta) => despachar({ e, reducido: movimientoReducido() });
  const caja = useRef<HTMLElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  const mostrada = useRef(false);

  useEffect(() => { mandar(abierta ? "abrir" : "cerrar"); }, [abierta]);

  useEffect(() => {
    if (fase !== "saliendo") return;
    const t = window.setTimeout(() => mandar("fin"), SALIDA_MAXIMA_MS);
    return () => window.clearTimeout(t);
  }, [fase]);

  useEffect(() => {
    if (fase === "abierta" && !mostrada.current) {
      mostrada.current = true;
      if (!enfocar) return;
      previo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      caja.current?.focus({ preventScroll: true });
    } else if (fase === "cerrada" && mostrada.current) {
      mostrada.current = false;
      // Solo devuelve el foco si se perdió con la tarjeta (no lo saca de donde el niño lo haya puesto).
      const activo = document.activeElement;
      if (enfocar && (!activo || activo === document.body) && previo.current?.isConnected) previo.current.focus({ preventScroll: true });
      previo.current = null;
      onCerrada?.();
    }
  }, [fase, enfocar, onCerrada]);

  if (fase === "cerrada") return null;
  return (
    <section ref={caja} role="dialog" aria-modal="false" aria-labelledby={id} tabIndex={-1}
      className={`fc tc${className ? ` ${className}` : ""}`} data-origen={origen} data-fase={fase}
      onAnimationEnd={(e) => { if (e.target === e.currentTarget) mandar("fin"); }}>
      <div className="fc-cara tc-cara">
        <header className="tc-cab">
          {figura && <div className="tc-figura" aria-hidden="true">{figura}</div>}
          <div className="tc-titulos">
            <h2 id={id} className="tc-titulo">{titulo}</h2>
            {bajada && <p className="tc-bajada">{bajada}</p>}
          </div>
          {extra && <div className="tc-extra">{extra}</div>}
        </header>
        {children && <div className="tc-cuerpo">{children}</div>}
        {acciones && <div className="tc-acciones">{acciones}</div>}
      </div>
    </section>
  );
}
