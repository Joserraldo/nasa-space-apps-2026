import { useEffect, useRef } from "react";
import { prefiereMenosMovimiento } from "../../../escena/soporte.js";
import { arrancar, type CrearIlustracion } from "./lienzo.js";

/**
 * Lienzo transparente con una ilustración 3D de inicio. Decorativo (aria-hidden) y sin clics: el menú
 * DOM va encima. Cada montaje crea su propio lienzo (el contexto WebGL se suelta al desmontar). Si
 * WebGL falla al arrancar, avisa con `onFallo` para que la pantalla muestre su respaldo DOM.
 */
export function Ilustracion3D({ crear, className, onFallo }: { crear: CrearIlustracion; className?: string; onFallo?: (() => void) | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const caja = ref.current;
    if (!caja) return;
    const lienzo = document.createElement("canvas");
    caja.append(lienzo);
    let desmontar: (() => void) | undefined;
    // Arranca un momento después de pintar el DOM: crear la escena y compilar los shaders bloquea un
    // instante, y el menú o el panel tienen que responder antes. En StrictMode no se crea dos veces.
    const espera = window.setTimeout(() => {
      try {
        desmontar = arrancar(lienzo, crear, prefiereMenosMovimiento());
      } catch {
        onFallo?.();
      }
    }, 60);
    return () => {
      window.clearTimeout(espera);
      desmontar?.();
      lienzo.remove();
    };
  }, [crear, onFallo]);
  return <div ref={ref} className={className} aria-hidden="true" />;
}
