/**
 * Estrellas reales en el cielo nocturno de Jezero (Etapa A). Se cargan la primera vez que hace falta
 * (el juego no tiene noche jugable: solo la vista previa con `?momento=noche` las pide).
 *
 * Datos: `public/texturas/cielo/estrellas.json`, los 1500 picos más brillantes del mapa NASA SVS 4851
 * "Deep Star Maps 2020" (dominio público, ver `public/texturas/FUENTES.md`). Columnas x, y, z, brillo
 * (0-1, logarítmico), r, g, b. Se dibujan como puntos nítidos, nunca como foto de fondo.
 *
 * Marco del archivo (verificado contra Sirio, Canopus, α Centauri, Arturo, Vega, Rigel y Betelgeuse):
 * ecuatorial J2000 con y = sen(dec) y atan2(z, x) = 270° − AR.
 *
 * Orientación en Marte:
 * - Polo norte de Marte: AR 317,269°, dec 54,433° (IAU WGCCRE 2015, Archinal et al. 2018). [V]
 * - Latitud de Jezero: 18,4° N. [V]
 * - Norte de la escena: −z (convención de juego, el hábitat queda hacia el norte). Hora sideral fija. [E]
 */
import * as THREE from "three";
import type { Cielo } from "./cielo";
import { RADIO_DOMO } from "./cielo";

/** Polo norte de Marte en ecuatoriales J2000 (grados). */
export const POLO_MARTE = { ar: 317.269, dec: 54.433 } as const;
/** Latitud de Jezero (grados). */
export const LATITUD_JEZERO = 18.4;
/** Ángulo sidéreo de la noche de juego (grados): deja la Vía Láctea y Orión repartidos en el cielo visible. [E] */
export const ANGULO_SIDEREO = 140;
/** Picos del mapa a menos de este ángulo son la misma estrella repartida en varios píxeles (grados). */
export const FUSION_GRADOS = 0.6;

type Fila = readonly number[];

/** Vector del archivo → ecuatorial estándar (X hacia AR 0, Y hacia AR 90°, Z al norte celeste). */
export function aEcuatorial(e: Fila): THREE.Vector3 {
  return new THREE.Vector3(-e[2]!, -e[0]!, e[1]!);
}

/** Ecuatorial estándar desde AR y dec en grados. */
export function desdeArDec(ar: number, dec: number): THREE.Vector3 {
  const a = THREE.MathUtils.degToRad(ar), d = THREE.MathUtils.degToRad(dec);
  return new THREE.Vector3(Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d));
}

/** Une los picos repetidos de una misma estrella (se queda con el más brillante). */
export function fusionar(filas: readonly Fila[], grados = FUSION_GRADOS): Fila[] {
  const lim = Math.cos(THREE.MathUtils.degToRad(grados));
  const quedan: Fila[] = [];
  for (const e of [...filas].sort((a, b) => b[3]! - a[3]!)) {
    if (!quedan.some((f) => f[0]! * e[0]! + f[1]! * e[1]! + f[2]! * e[2]! > lim)) quedan.push(e);
  }
  return quedan;
}

/**
 * Matriz ecuatorial → escena para un observador en Marte: arriba = cénit, −z = norte, +x = este.
 * El cénit está a `latitud` del ecuador de Marte, girado `sidereo` alrededor de su polo.
 */
export function matrizCielo(latitud = LATITUD_JEZERO, sidereo = ANGULO_SIDEREO): THREE.Matrix3 {
  const polo = desdeArDec(POLO_MARTE.ar, POLO_MARTE.dec);
  const u = new THREE.Vector3(0, 0, 1).cross(polo).normalize();
  const v = polo.clone().cross(u);
  const s = THREE.MathUtils.degToRad(sidereo), f = THREE.MathUtils.degToRad(latitud);
  const ecuador = u.clone().multiplyScalar(Math.cos(s)).addScaledVector(v, Math.sin(s));
  const cenit = ecuador.clone().multiplyScalar(Math.cos(f)).addScaledVector(polo, Math.sin(f));
  const norte = ecuador.clone().multiplyScalar(-Math.sin(f)).addScaledVector(polo, Math.cos(f));
  const este = norte.clone().cross(cenit);
  // Filas: componente de escena = producto con (este, cénit, −norte).
  const sur = norte.clone().negate();
  return new THREE.Matrix3().set(este.x, este.y, este.z, cenit.x, cenit.y, cenit.z, sur.x, sur.y, sur.z);
}

/** Punto suave y redondo para que las estrellas se lean como puntos, no cuadrados. */
function texturaPunto(): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 32;
  const ctx = lienzo.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(lienzo);
}

/** Tres tamaños por brillo real (píxeles de pantalla). [E] */
const NIVELES = [
  { desde: 0.8, tamano: 4.2 },
  { desde: 0.45, tamano: 2.8 },
  { desde: 0, tamano: 1.8 },
] as const;

const pedidos = new WeakMap<THREE.Group, Promise<void>>();

/** Llena `cielo.estrellas` una sola vez por cielo (asíncrono). Sin datos, el cielo nocturno sigue sin estrellas. */
export function cargarEstrellas(cielo: Pick<Cielo, "estrellas">): Promise<void> {
  const hecho = pedidos.get(cielo.estrellas);
  if (hecho) return hecho;
  const base = (import.meta.env?.BASE_URL as string | undefined) ?? "/";
  const pedido = fetch(`${base}texturas/cielo/estrellas.json`)
    .then((r) => r.json() as Promise<{ estrellas: number[][] }>)
    .then(({ estrellas }) => {
      const filas = fusionar(estrellas);
      const m = matrizCielo();
      const punto = texturaPunto();
      const radio = RADIO_DOMO * 0.9;
      const p = new THREE.Vector3();
      NIVELES.forEach((nivel, i) => {
        const hasta = i === 0 ? Infinity : NIVELES[i - 1]!.desde;
        const sel = filas.filter((e) => e[3]! >= nivel.desde && e[3]! < hasta);
        const pos = new Float32Array(sel.length * 3), col = new Float32Array(sel.length * 3);
        sel.forEach((e, k) => {
          p.copy(aEcuatorial(e)).applyMatrix3(m).normalize().multiplyScalar(radio);
          pos.set([p.x, p.y, p.z], k * 3);
          const b = 0.5 + 0.5 * e[3]!;
          col.set([(0.55 + 0.45 * e[4]!) * b, (0.55 + 0.45 * e[5]!) * b, (0.55 + 0.45 * e[6]!) * b], k * 3);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({
          size: nivel.tamano, sizeAttenuation: false, map: punto, vertexColors: true,
          transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: 0,
        });
        const puntos = new THREE.Points(geo, mat);
        puntos.name = `Sky_Stars_${i}`;
        puntos.frustumCulled = false;
        puntos.renderOrder = -1;
        // La opacidad sigue a `estrellas.userData.opacidad` (la fija `Cielo.pintar`).
        puntos.onBeforeRender = () => {
          mat.opacity = (cielo.estrellas.userData.opacidad as number | undefined) ?? 0;
        };
        cielo.estrellas.add(puntos);
      });
    })
    .catch((e: unknown) => {
      console.warn("[estrellas] sin datos de estrellas", e);
    });
  pedidos.set(cielo.estrellas, pedido);
  return pedido;
}
