/** Muestras del bucle de render real; no crea otro requestAnimationFrame. */
import type { CuentaRender } from "./activos/terreno";

export interface MedicionRender extends CuentaRender {
  fpsPromedio: number | null;
  fpsMinimo: number | null;
}

export function crearMedidorRender(ventanaMs = 5000) {
  const marcas: number[] = [];
  let inicio = 0;
  let drawCalls = 0;
  let triangulos = 0;
  return {
    registrar(ahora: number, cuenta: CuentaRender) {
      marcas.push(ahora);
      while (inicio < marcas.length && ahora - marcas[inicio]! > ventanaMs) inicio++;
      // Compactar ocasionalmente; evitar desplazar toda la ventana en cada fotograma.
      if (inicio > 1024) { marcas.splice(0, inicio); inicio = 0; }
      drawCalls = cuenta.drawCalls;
      triangulos = cuenta.triangulos;
    },
    reiniciar() {
      marcas.length = 0;
      inicio = 0;
      drawCalls = triangulos = 0;
    },
    leer(): MedicionRender {
      const n = marcas.length - inicio;
      let fpsPromedio: number | null = null, fpsMinimo: number | null = null;
      if (n > 1) {
        const duracion = marcas[marcas.length - 1]! - marcas[inicio]!;
        let mayorHueco = 0;
        for (let i = inicio + 1; i < marcas.length; i++) mayorHueco = Math.max(mayorHueco, marcas[i]! - marcas[i - 1]!);
        if (duracion > 0) fpsPromedio = (n - 1) * 1000 / duracion;
        if (mayorHueco > 0) fpsMinimo = 1000 / mayorHueco;
      }
      return { fpsPromedio, fpsMinimo, drawCalls, triangulos };
    },
  };
}
