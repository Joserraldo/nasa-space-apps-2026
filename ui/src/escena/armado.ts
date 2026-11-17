/**
 * Armado de la escena exterior de Jezero, sin renderer ni DOM (así se mide y se prueba sin WebGL).
 *
 * Monta cielo de día, cordillera lejana, terreno con un claro llano en el centro, rocas (pequeñas
 * lejos, grandes en el borde del claro), los cinco anclajes de módulo con su sólido / andamio /
 * vivos, hábitat, torre de control y corredores, consolas y cajas del kit, y la red de caminos
 * adoquinados de los circuitos A y B con balizas instanciadas. La escena solo lee `VistaEscena`: nunca `GameState` ni el motor.
 *
 * Presupuesto (APLICACION §8): las piezas del kit se fusionan por material (`fusionar`) y las
 * repetidas se instancian, así cada familia cuesta 1 llamada por material (+1 de sombra).
 */
import * as THREE from "three";
import { crearCielo, direccionSolActual, type Calidad, type Cielo } from "./cielo";
import type { Materiales } from "./materiales";
import { liberarEscena, liberarMateriales } from "./liberar";
import type { VistaEscena } from "./vista";
import { MODULOS_BASE, TIEMPOS_MODULO_MS, type ModuloBase } from "./activos/modulos";
import { DECORADO, armarKit, armarEdificios, distanciaAHuella, huellasBase } from "./activos/baseExterior";
import { huellasModulos } from "./activos/modulosArmados";
import type { Huella } from "./activos/piezasComunes";
import { aplicarEstado, armarAnclajes, armarModulo, type ModuloArmado } from "./activos/modulosArmados";
export { PLAZA, CAMINO, CAMINOS, BALIZAS, geometriaCaminos, posicionesBalizas } from "./activos/caminos";
import { chocaConBase, posicionesBalizas, sobreCamino } from "./activos/caminos";
import { LUGARES } from "./mundo";
import { crearTripulacionBase, type TripulacionBase } from "./tripulacionBase";
export { fusionar } from "./activos/fusionar";
import {
  ESCALA_VERTICAL_POR_DEFECTO,
  PASO_POR_DEFECTO,
  TAMANO_MUNDO_POR_DEFECTO,
  aplanarClaro,
  crearGravilla,
  crearMontanas,
  leerDem,
  rocasBasalticas,
  submuestrear,
  type OpcionesMalla,
  type Rejilla,
  type TransformacionRoca,
} from "./activos/terreno";
import { anguloEnZona, funcionRelieve, geometriaRelieve, mascaraZona } from "./activos/relieve";
import { coloresRespaldo, crearMaterialesSuelo, type MaterialesSuelo } from "./activos/sueloMarte";
import { conVariante, gruposRocas, instanciarPorVariante, piedritas } from "./activos/rocasMarte";

// ---------------------------------------------------------------------------------------------
// Datos del DEM y del claro
// ---------------------------------------------------------------------------------------------

/** Copia de `data/terreno/jezero/jezero.json` (campo `dem`); un test comprueba que coinciden. */
export const DEM_JEZERO = { ancho: 280, alto: 280, metrosPorPixel: 289 } as const;

export const MALLA_JEZERO: OpcionesMalla = {
  metrosPorPixel: DEM_JEZERO.metrosPorPixel * PASO_POR_DEFECTO,
  escalaVertical: ESCALA_VERTICAL_POR_DEFECTO,
  tamañoMundo: TAMANO_MUNDO_POR_DEFECTO,
};

/** Rejilla submuestreada del DEM de Jezero (`elevacion.bin`, Int16LE). */
export function rejillaJezero(buffer: ArrayBuffer): Rejilla {
  const { ancho, alto } = DEM_JEZERO;
  return submuestrear(leerDem(buffer, ancho, alto), ancho, alto, PASO_POR_DEFECTO);
}

/**
 * Claro llano: incluye la base jugable y todo el decorado (`DECORADO`, a menos de 31 m). El terreno se aplana hasta
 * `radio` (con margen de una celda del DEM, ~4,3 u) y sube suave hasta `borde`. [E]
 */
export const CLARO = { radio: 34, borde: 46 } as const;
/**
 * Bloques sueltos en el borde del claro. Referencia (regla 11): `occupy-mars-2`, bloques de 1 a 3 m
 * repartidos por el llano en el plano medio, nunca tapando la vista. Por eso la escala máxima baja de
 * 2,6 (lámina `mundo/01`, dirección descartada) a 1,8. [E]
 */
export const ROCAS_GRANDES = { n: 14, semilla: 9, radioMin: 15, radio: 28, escalaMin: 1.0, escalaMax: 1.8 } as const;

/** Radio en planta de una roca (la roca maestra mide hasta 1,2 u de radio por unidad de escala). */
export function radioRoca(r: TransformacionRoca): number {
  return Math.max(r.escala[0], r.escala[2]) * 1.2;
}

/** Radio en planta máximo de una roca grande (escala máxima con su variación de ±20 %). */
const RADIO_MAX_ROCA_GRANDE = ROCAS_GRANDES.escalaMax * 1.2 * 1.2;

/** Huellas de módulos y base: fijas, se calculan una sola vez (cada intento de roca las consulta). */
let huellasCacheadas: Huella[] | null = null;
function huellasFijasDeBase(): Huella[] {
  return (huellasCacheadas ??= [...huellasModulos(), ...huellasBase()]);
}

/**
 * Las rocas grandes no caen sobre la torre, las cápsulas, sus corredores, el resto del decorado,
 * los módulos ni las piezas del kit (con el radio máximo de una roca grande de margen).
 */
export function rocaGrandeLibre(x: number, z: number): boolean {
  if (DECORADO.some((d) => Math.hypot(x - d.x, z - d.z) < d.radio + 2)) return false;
  if (huellasFijasDeBase().some((h) => distanciaAHuella(h, x, z) < RADIO_MAX_ROCA_GRANDE)) return false;
  return !(z < -10 && Math.abs(x) < 20) && Math.hypot(x, z - 9) > 5;
}

/**
 * Rocas grandes del borde del claro sobre la rejilla ya aplanada (posición en planta fija por
 * semilla). Se descarta la que pisaría a otra ya puesta (con 0,3 m de aire).
 */
export function rocasGrandes(claro: Rejilla): TransformacionRoca[] {
  const hecha = rocasGrandesPorRejilla.get(claro);
  if (hecha) return hecha;
  const g = ROCAS_GRANDES;
  const todas = rocasBasalticas(g.semilla, g.n, claro, MALLA_JEZERO, {
    radioMin: g.radioMin, radio: g.radio, escalaMin: g.escalaMin, escalaMax: g.escalaMax,
    excluir: (x, z) => !rocaGrandeLibre(x, z),
  });
  const puestas: TransformacionRoca[] = [];
  for (const r of todas) {
    const [x, , z] = r.posicion;
    if (puestas.every((p) => Math.hypot(x - p.posicion[0], z - p.posicion[2]) > radioRoca(r) + radioRoca(p) + 0.3)) puestas.push(r);
  }
  rocasGrandesPorRejilla.set(claro, puestas);
  return puestas;
}
/** `rocasGrandes` por rejilla: la escena y `huellasRocas` piden las mismas y no se recalculan. */
const rocasGrandesPorRejilla = new WeakMap<Rejilla, TransformacionRoca[]>();

/**
 * Piedras sueltas de primer plano, bajas. Referencia (regla 11): `occupy-mars-2`, primer plano abierto con
 * piedras chicas sobre el regolito; nada alto entre la cámara y el horizonte. Las dos rocas altas de la
 * lámina `mundo/01` (dirección descartada) se quitaron porque tapaban la vista. Fuera de caminos, plaza,
 * banco, sólidos de `TERRENO` y del radio de uso de cada lugar (`rocaPrimerPlanoLibre`). [E]
 */
export const ROCAS_PRIMER_PLANO: readonly TransformacionRoca[] = [
  { posicion: [-4.2, 0, 2.1], escala: [0.5, 0.55, 0.48], rotacion: [0.05, 0.3, 0] },
  { posicion: [7.2, 0, 3.4], escala: [0.5, 0.5, 0.5], rotacion: [0, 1.4, 0.03] },
];

/** Formas de las piedras de primer plano: bloque partido y laja. */
const VARIANTES_PRIMER_PLANO = [0, 1] as const;

/** Huella en planta de una roca de primer plano. */
export const radioRocaPrimerPlano = radioRoca;

/** Huellas en planta de las rocas de primer plano y de las grandes (sobre la rejilla del claro). */
export function huellasRocas(claro: Rejilla): Huella[] {
  const huella = (prefijo: string) => (r: TransformacionRoca, i: number): Huella =>
    ({ id: `${prefijo}:${i}`, x: r.posicion[0], z: r.posicion[2], r: radioRoca(r) });
  return [...ROCAS_PRIMER_PLANO.map(huella("roca_primer_plano")), ...rocasGrandes(claro).map(huella("roca_grande"))];
}

/** La roca de radio `radio` en (x, z) no pisa caminos, plaza, banco, sólidos, lugares ni decorado. */
export function rocaPrimerPlanoLibre(x: number, z: number, radio: number): boolean {
  if (chocaConBase(x, z, radio) || sobreCamino(x, z, radio)) return false;
  if (LUGARES.some((l) => Math.hypot(x - l.x, z - l.z) < l.radio)) return false;
  if (DECORADO.some((d) => Math.hypot(x - d.x, z - d.z) < d.radio + radio)) return false;
  return !posicionesBalizas().some(([bx, bz]) => Math.hypot(x - bx, z - bz) < radio + 0.3);
}

// ---------------------------------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------------------------------

export interface EscenaArmada {
  escena: THREE.Scene;
  tripulacion: TripulacionBase;
  cielo: Cielo;
  modulos: Readonly<Record<ModuloBase, ModuloArmado>>;
  /** Grupo del terreno y las rocas (vacío hasta `ponerTerreno`). */
  terreno: THREE.Group;
  /** Materiales del suelo y las rocas de Marte (Etapa BC). */
  suelo: MaterialesSuelo;
  /** Suelo y rocas con texturas y shader propio (true) o con color de vértice (false, calidad baja). */
  usarSueloDetallado(detallado: boolean): void;
  /** Reconcilia los módulos con la vista (sin reconstruir mallas: solo visibilidad). */
  aplicarVista(vista: VistaEscena): void;
  /** Pone (o reemplaza) el terreno de Jezero con el claro aplanado y las rocas. */
  ponerTerreno(rejilla: Rejilla): void;
  /** Marca un pulso corto en un módulo (evento de avería). */
  pulsar(id: ModuloBase, ahoraMs: number): void;
  /** Avanza animaciones; sin asignaciones. Con `movimientoReducido`: estados finales sin bamboleo. */
  animar(ahoraMs: number, movimientoReducido: boolean): void;
  /** Quita el cielo y libera geometrías propias. Materiales y caché son del dueño (no se tocan). */
  liberar(): void;
}

/**
 * Arma la escena completa. `vista` null = todos los módulos ausentes (solo anclajes).
 * `rejilla` opcional: en el navegador el DEM llega después (`ponerTerreno`); en los tests, ya.
 */
export function armarEscena(
  materiales: Materiales,
  vista: VistaEscena | null,
  rejilla: Rejilla | null = null,
  calidad: Calidad = "alta",
): EscenaArmada {
  const escena = new THREE.Scene();
  escena.name = "Exterior_Jezero";
  const tripulacion = crearTripulacionBase();
  escena.add(tripulacion.grupo);
  const cielo = crearCielo(escena, "dia", calidad);
  const terreno = new THREE.Group();
  terreno.name = "Terrain_Group";
  const base = new THREE.Group();
  base.name = "Base";
  const modulos = Object.fromEntries(MODULOS_BASE.map((id) => [id, armarModulo(materiales, id)])) as Record<ModuloBase, ModuloArmado>;
  const suelo = crearMaterialesSuelo();
  let detallado = true;
  const materialRoca = () => (detallado ? suelo.roca.detallado : suelo.roca.simple);
  base.add(armarAnclajes(materiales), armarKit(materiales), armarEdificios(materiales), ...MODULOS_BASE.map((id) => modulos[id].raiz));
  // Fuera de la zona de la Etapa BC el horizonte sigue siendo la cordillera de `develop`.
  escena.add(terreno, base, crearMontanas(materiales, undefined, (a) => anguloEnZona(a, 0.05)));
  // Con suelo detallado los caminos se dibujan en el suelo (`caminosSuelo.ts`); las losas quedan para calidad baja.
  const kitCaminos = base.getObjectByName("Kit_Paths")!;
  kitCaminos.visible = !detallado;
  const pares: [THREE.Material, THREE.Material][] = [
    [suelo.terreno.simple, suelo.terreno.detallado],
    [suelo.roca.simple, suelo.roca.detallado],
  ];
  const aplicarMaterialSuelo = (raiz: THREE.Object3D) =>
    raiz.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      for (const [simple, det] of pares) if (o.material === simple || o.material === det) o.material = detallado ? det : simple;
    });

  const armada: EscenaArmada = {
    escena,
    tripulacion,
    cielo,
    modulos,
    terreno,
    suelo,
    usarSueloDetallado(d) {
      detallado = d;
      kitCaminos.visible = !d;
      aplicarMaterialSuelo(terreno);
    },
    aplicarVista(v) {
      tripulacion.aplicarVista(v);
      for (const id of MODULOS_BASE) aplicarEstado(modulos[id], v.modulos[id]);
    },
    ponerTerreno(r) {
      for (const hijo of [...terreno.children]) {
        terreno.remove(hijo);
        liberarEscena(hijo);
      }
      const claro = aplanarClaro(r, MALLA_JEZERO, CLARO.radio, CLARO.borde);
      const altura = funcionRelieve(claro.rejilla, MALLA_JEZERO);
      const sol = direccionSolActual();
      const malla = new THREE.Mesh(geometriaRelieve(altura, claro.altura, coloresRespaldo(), [sol.x, sol.y, sol.z]), detallado ? suelo.terreno.detallado : suelo.terreno.simple);
      malla.name = "Terrain_Jezero";
      malla.receiveShadow = true;
      malla.castShadow = false;
      const rocaMat = materialRoca();
      // Toda roca se apoya en la función de altura (con el microrrelieve del claro): ninguna flota ni se hunde de más.
      const apoyar = <T extends TransformacionRoca>(r: T): T => ({ ...r, posicion: [r.posicion[0], altura(r.posicion[0], r.posicion[2]), r.posicion[2]] });
      // Primer plano y borde del claro (chocan) y grupos cercanos comparten las variantes: 1 malla por variante.
      const primerPlano = conVariante(ROCAS_PRIMER_PLANO, VARIANTES_PRIMER_PLANO).map(apoyar);
      const bordeClaro = conVariante(rocasGrandes(claro.rejilla)).map(apoyar);
      // Grupos de rocas solo dentro de la zona (regla 10).
      const fueraDeZona = (x: number, z: number) => mascaraZona(x, z) < 0.6;
      const grupos = [...gruposRocas(altura, "cerca", fueraDeZona), ...gruposRocas(altura, "lejos", fueraDeZona)];
      const cerca = instanciarPorVariante([...primerPlano, ...bordeClaro, ...grupos.filter((g) => g.detalle === "cerca")], "cerca", rocaMat, "Rocks_Near");
      const lejos = instanciarPorVariante(grupos.filter((g) => g.detalle === "lejos"), "lejos", rocaMat, "Rocks_Clusters_Far");
      const ocupado = [...huellasFijasDeBase(), ...huellasRocas(claro.rejilla)];
      const enBase = (x: number, z: number) => chocaConBase(x, z, 0.3) || sobreCamino(x, z, 0.2) || ocupado.some((h) => distanciaAHuella(h, x, z) < 0.3);
      // Piedritas en muchas escalas: alrededor de cada bloque y al pie de las paredes, fuera del círculo caminable.
      const sueltas = piedritas(altura, [...bordeClaro, ...grupos], (x, z) => fueraDeZona(x, z) || Math.hypot(x, z) < 33 || enBase(x, z));
      const gravilla = crearGravilla(materiales, { malla, rejilla: claro.rejilla, opciones: MALLA_JEZERO }, { excluir: enBase, altura }, sueltas);
      gravilla.material = rocaMat;
      terreno.add(malla, cerca, lejos, gravilla);
      terreno.position.y = -claro.altura;
    },
    pulsar(id, ahora) {
      modulos[id].pulso = ahora;
    },
    animar(ahora, reducido) {
      tripulacion.animar(ahora, reducido);
      for (const id of MODULOS_BASE) {
        const mod = modulos[id];
        if (mod.inicio < 0) mod.inicio = ahora;
        const dt = ahora - mod.inicio;
        // Instalando: el andamio crece en 400 ms. Operativo: la luz aparece en 240 ms.
        const kA = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.instalando);
        mod.andamio.scale.set(1, Math.max(0.001, kA), 1);
        const kV = reducido ? 1 : Math.min(1, dt / TIEMPOS_MODULO_MS.operativo);
        const bamboleo = reducido ? 1 : 1 + 0.15 * Math.sin(ahora / 320);
        mod.vivos.scale.setScalar(Math.max(0.001, kV * bamboleo));
        // Pulso de avería: un leve latido de 400 ms (nunca sacudidas, APLICACION §7).
        const dp = ahora - mod.pulso;
        const latido = !reducido && dp >= 0 && dp < 400 ? 1 + 0.05 * Math.sin((dp / 400) * Math.PI) : 1;
        mod.raiz.scale.setScalar(latido);
      }
    },
    liberar() {
      tripulacion.liberar();
      cielo.quitar();
      liberarEscena(escena);
      liberarMateriales(suelo.todos);
    },
  };
  if (vista) armada.aplicarVista(vista);
  if (rejilla) armada.ponerTerreno(rejilla);
  return armada;
}
