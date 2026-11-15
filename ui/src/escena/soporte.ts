/** Comprobaciones del navegador. Archivo aparte para no cargar three solo por preguntar. */

/** ¿Este navegador puede dibujar la escena 3D? Si no, la pantalla usa la vista simple. */
export function hayGraficos3D(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function prefiereMenosMovimiento(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}
