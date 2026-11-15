import { alturaSuelo, ESCALON_MAX, resolver, type Terreno } from "./fisica.js";

export interface PuntoRuta {
  x: number;
  z: number;
}

const PASO = 0.5;
const MUESTREO = 0.2;
const RADIO_BUSQUEDA = 24;
const MAX_NODOS = 30_000;

function puntoLibre(p: PuntoRuta, radio: number, terreno: Terreno): boolean {
  if (Math.hypot(p.x, p.z) > terreno.limite - radio + 1e-9) return false;
  const corregido = { ...p };
  resolver(corregido, radio, terreno);
  return Math.hypot(corregido.x - p.x, corregido.z - p.z) <= 1e-7;
}

/** Valida trayectoria continua: obstáculos y subida física permitida en cada muestra. */
function tramoLibre(a: PuntoRuta, b: PuntoRuta, radio: number, terreno: Terreno): boolean {
  const distancia = Math.hypot(b.x - a.x, b.z - a.z);
  const pasos = Math.max(1, Math.ceil(distancia / MUESTREO));
  let alturaAnterior = alturaSuelo(a.x, a.z, terreno);
  for (let i = 0; i <= pasos; i++) {
    const f = i / pasos;
    const p = { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
    if (!puntoLibre(p, radio, terreno)) return false;
    const altura = alturaSuelo(p.x, p.z, terreno);
    if (altura - alturaAnterior > ESCALON_MAX + 1e-8) return false;
    alturaAnterior = altura;
  }
  return true;
}

function clave(ix: number, iz: number): string {
  return `${ix},${iz}`;
}

function distancia(a: PuntoRuta, b: PuntoRuta): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Busca ruta 2D determinista, evitando obstáculos y respetando escalones y rampas. */
export function planearRuta(
  inicio: PuntoRuta,
  destino: PuntoRuta,
  terreno: Terreno,
  radio = 0.38,
): PuntoRuta[] {
  if (!Number.isFinite(radio) || radio < 0 || !puntoLibre(inicio, radio, terreno) || !puntoLibre(destino, radio, terreno)) return [];
  if (tramoLibre(inicio, destino, radio, terreno)) return [{ ...destino }];

  const abiertos = new Set<string>();
  const puntos = new Map<string, PuntoRuta>();
  const padres = new Map<string, string>();
  const costos = new Map<string, number>();
  const estimados = new Map<string, number>();
  const inicioKey = clave(0, 0);
  puntos.set(inicioKey, { ...inicio });
  costos.set(inicioKey, 0);
  estimados.set(inicioKey, distancia(inicio, destino));
  abiertos.add(inicioKey);

  let finalKey: string | undefined;
  let procesados = 0;
  const vecinos = [
    [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1],
  ] as const;

  while (abiertos.size && procesados < MAX_NODOS) {
    let actualKey: string | undefined;
    let mejorF = Infinity;
    // Orden lexicográfico hace desempate estable aunque Set mantenga orden de inserción.
    for (const key of abiertos) {
      const f = estimados.get(key)!;
      if (f < mejorF || (f === mejorF && (actualKey === undefined || key < actualKey))) {
        actualKey = key;
        mejorF = f;
      }
    }
    if (actualKey === undefined) break;
    abiertos.delete(actualKey);
    procesados++;
    const actual = puntos.get(actualKey)!;
    if (tramoLibre(actual, destino, radio, terreno)) {
      finalKey = actualKey;
      break;
    }

    const [ix = 0, iz = 0] = actualKey.split(",").map(Number);
    for (const [dx, dz] of vecinos) {
      const nx = ix + dx;
      const nz = iz + dz;
      const siguiente = { x: inicio.x + nx * PASO, z: inicio.z + nz * PASO };
      if (distancia(inicio, siguiente) > RADIO_BUSQUEDA || !puntoLibre(siguiente, radio, terreno)) continue;
      if (!tramoLibre(actual, siguiente, radio, terreno)) continue;
      const siguienteKey = clave(nx, nz);
      const tentativo = costos.get(actualKey)! + distancia(actual, siguiente);
      if (tentativo >= (costos.get(siguienteKey) ?? Infinity)) continue;
      puntos.set(siguienteKey, siguiente);
      padres.set(siguienteKey, actualKey);
      costos.set(siguienteKey, tentativo);
      estimados.set(siguienteKey, tentativo + distancia(siguiente, destino));
      abiertos.add(siguienteKey);
    }
  }
  if (finalKey === undefined) return [];

  const ruta: PuntoRuta[] = [];
  for (let key = finalKey; key !== inicioKey; key = padres.get(key)!) ruta.push(puntos.get(key)!);
  ruta.reverse();
  ruta.push({ ...destino });

  // Quita nodos intermedios solo si el segmento recto cumple misma validación completa.
  const simplificada: PuntoRuta[] = [];
  let desde = inicio;
  let i = 0;
  while (i < ruta.length) {
    let mejor = i;
    for (let j = ruta.length - 1; j >= i; j--) {
      const cand = ruta[j];
      if (cand && tramoLibre(desde, cand, radio, terreno)) {
        mejor = j;
        break;
      }
    }
    const elegido = ruta[mejor]!;
    simplificada.push(elegido);
    desde = elegido;
    i = mejor + 1;
  }
  return simplificada;
}
