/**
 * Movimiento del niño e Iris en la base, sin React, DOM ni three (se prueba en Node).
 *
 * Consume las piezas ya escritas: `moverPersonaje` y `subpasos` de la física, `planearRuta` de la
 * navegación y `pasoGuia` de la guía. Lo nuevo es la lista de sólidos reales (las huellas que monta
 * `armado.ts`: círculos y cajas giradas) y el estado por fotograma. Caminar nunca toca recursos:
 * aquí no hay `GameState` ni motor.
 *
 * Por fotograma: acumular dt → `subpasos` → por cada paso fijo `moverPersonaje` contra los círculos,
 * la rampa, la plataforma y el límite de `TERRENO`, y después sacar al cuerpo de las cajas. El
 * llamador copia `jugador` e `iris` a los grupos de three; aquí no se reconstruye nada.
 */
import { moverPersonaje, PASO_FISICO, resolver, subpasos, type Circulo, type Cuerpo, type Terreno } from "./fisica";
import { pasoGuia, type Guia, type ModoGuia, type Punto } from "./guia";
import { planearRuta, type PuntoRuta } from "./navegacion";
import { INICIO_JUGADOR, TERRENO, lugar, type LugarId } from "./mundo";

/** Radio del niño en planta: el mismo que usa `planearRuta` por defecto. */
export const RADIO_JUGADOR = 0.38;
/** Radio en planta de Iris (chasis con ruedas). [E] */
export const RADIO_IRIS = 0.42;
/** Velocidad de marcha del niño, m/s. [E] */
export const VEL_JUGADOR = 2.8;
/** Giro máximo del cuerpo hacia donde camina, rad/s. */
const GIRO_JUGADOR = 12;
/**
 * Caminar fluido (A4): la velocidad se acerca a la pedida con una curva exponencial, rápida al principio y
 * suave al final. `ACELERACION` al arrancar o acelerar y `FRENADO` al soltar o frenar, en 1/s: a 9/s llega
 * al 90 % de la marcha en ~0,26 s; a 14/s frena al 10 % en ~0,16 s. El giro del cuerpo también se acerca
 * con curva (`GIRO_SUAVE`, 1/s), sin pasar de `GIRO_JUGADOR`. [E] Calibrado a mano en el juego.
 */
export const ACELERACION = 9;
export const FRENADO = 14;
const GIRO_SUAVE = 16;
/** Por debajo de esta rapidez, sin entrada, el niño queda quieto (m/s). */
const QUIETO = 0.05;

/**
 * Acerca la velocidad actual `(vx, vz)` a la pedida `(dx, dz)` en `h` segundos, con curva exponencial.
 * Escribe en `salida`. Frena con `FRENADO` cuando la pedida es más lenta que la actual (o cero).
 */
export function acercarVelocidad(vx: number, vz: number, dx: number, dz: number, h: number, salida: { x: number; z: number }): void {
  const frena = Math.hypot(dx, dz) < Math.hypot(vx, vz) - 1e-6;
  const a = 1 - Math.exp(-(frena ? FRENADO : ACELERACION) * h);
  let x = vx + (dx - vx) * a;
  let z = vz + (dz - vz) * a;
  if (dx === 0 && dz === 0 && Math.hypot(x, z) < QUIETO) x = z = 0;
  salida.x = x;
  salida.z = z;
}

/** Gira con curva hacia `deseado` (rad), sin pasar de `max` en este paso. */
function girarSuave(actual: number, deseado: number, h: number, max: number): number {
  const d = ((((deseado - actual + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  const paso = d * (1 - Math.exp(-GIRO_SUAVE * h));
  return actual + Math.max(-max, Math.min(max, paso));
}
/** Cerca de un punto de la ruta se pasa al siguiente. */
const LLEGADA_RUTA = 0.18;
/** Si en este tiempo la ruta no acerca al jugador al menos `AVANCE_MIN`, se abandona. */
const MS_ATASCO = 1500;
const AVANCE_MIN = 0.05;
/** Búsqueda del punto libre más cercano a un punto de uso tapado por un módulo construido. */
const BUSQUEDA_LIBRE = { paso: 0.2, max: 3, angulos: 24 } as const;
/** Lado de la celda con que se cubre una caja para la ruta (cobertura conservadora). */
const CELDA_RUTA = 1;

/** Caja en planta: `ancho` en x local, `fondo` en z local, girada `giro` rad como `rotation.y`. */
export interface Caja {
  readonly x: number;
  readonly z: number;
  readonly ancho: number;
  readonly fondo: number;
  readonly giro: number;
}

export interface Solidos {
  readonly circulos: readonly Circulo[];
  readonly cajas: readonly Caja[];
}

/** Huella en planta tal como la publican `huellasBase`, `huellasModulos` y `huellasRocas`. */
export type HuellaPlanta = { readonly x: number; readonly z: number } & ({ readonly r: number } | { readonly ancho: number; readonly fondo: number; readonly giro: number });

/** Separa huellas en círculos y cajas, sin aproximar una caja por un círculo. */
export function solidosDeHuellas(huellas: readonly HuellaPlanta[]): Solidos {
  const circulos: Circulo[] = [];
  const cajas: Caja[] = [];
  for (const h of huellas) {
    if ("r" in h) circulos.push({ x: h.x, z: h.z, r: h.r });
    else cajas.push({ x: h.x, z: h.z, ancho: h.ancho, fondo: h.fondo, giro: h.giro });
  }
  return { circulos, cajas };
}

/** Saca el punto de una caja girada (con radio). Deslizar sale solo: se empuja por la normal. */
export function empujarCaja(p: { x: number; z: number }, radio: number, k: Caja): void {
  const c = Math.cos(k.giro), s = Math.sin(k.giro);
  const dx = p.x - k.x, dz = p.z - k.z;
  // A ejes locales de la caja (inversa de rotation.y, como `distanciaAHuella`).
  let lx = c * dx - s * dz;
  let lz = s * dx + c * dz;
  const hx = k.ancho / 2, hz = k.fondo / 2;
  const qx = Math.max(-hx, Math.min(hx, lx));
  const qz = Math.max(-hz, Math.min(hz, lz));
  const ex = lx - qx, ez = lz - qz;
  const d = Math.hypot(ex, ez);
  if (d >= radio) return;
  if (d > 1e-9) {
    // Fuera de la caja pero dentro del radio: lado o esquina, se empuja desde el punto más cercano.
    lx = qx + (ex / d) * radio;
    lz = qz + (ez / d) * radio;
  } else {
    // Dentro: sale por la cara más cercana.
    const px = hx - Math.abs(lx), pz = hz - Math.abs(lz);
    if (px < pz) lx = (lx < 0 ? -1 : 1) * (hx + radio);
    else lz = (lz < 0 ? -1 : 1) * (hz + radio);
  }
  p.x = k.x + c * lx + s * lz;
  p.z = k.z - s * lx + c * lz;
}

/** Distancia del punto al borde de la caja (0 dentro). */
export function distanciaCaja(x: number, z: number, k: Caja): number {
  const c = Math.cos(k.giro), s = Math.sin(k.giro);
  const dx = x - k.x, dz = z - k.z;
  const lx = c * dx - s * dz, lz = s * dx + c * dz;
  return Math.hypot(Math.max(0, Math.abs(lx) - k.ancho / 2), Math.max(0, Math.abs(lz) - k.fondo / 2));
}

/**
 * Celdas del borde de una caja, cada una cubierta por el círculo que la circunscribe. La unión
 * cubre todo el contorno de la caja (sobra a lo sumo ~0,2 m), así una ruta que no toca ningún
 * círculo tampoco toca la caja. Solo para `planearRuta`, que solo entiende círculos y cápsulas;
 * el movimiento choca contra la caja exacta.
 */
export function coberturaCaja(k: Caja): Circulo[] {
  const nx = Math.max(1, Math.ceil(k.ancho / CELDA_RUTA));
  const nz = Math.max(1, Math.ceil(k.fondo / CELDA_RUTA));
  const wx = k.ancho / nx, wz = k.fondo / nz;
  const r = Math.hypot(wx, wz) / 2;
  const c = Math.cos(k.giro), s = Math.sin(k.giro);
  const salida: Circulo[] = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      if (i !== 0 && j !== 0 && i !== nx - 1 && j !== nz - 1) continue;
      const lx = -k.ancho / 2 + wx * (i + 0.5);
      const lz = -k.fondo / 2 + wz * (j + 0.5);
      salida.push({ x: k.x + c * lx + s * lz, z: k.z - s * lx + c * lz, r });
    }
  }
  return salida;
}

/** Terreno de movimiento: rampa, plataforma y límite de `TERRENO`, con los círculos reales. */
export function terrenoMovimiento(s: Solidos): Terreno {
  return { limite: TERRENO.limite, rampas: TERRENO.rampas, plataformas: TERRENO.plataformas, capsulas: [], circulos: s.circulos };
}

/** Terreno para `planearRuta`: los círculos reales más la cobertura de cada caja. */
export function terrenoRuta(s: Solidos): Terreno {
  return { ...terrenoMovimiento(s), circulos: [...s.circulos, ...s.cajas.flatMap(coberturaCaja)] };
}

/** Saca un punto de todos los sólidos (círculos, cajas y límite). Sin asignaciones. */
export function resolverSolidos(p: { x: number; z: number }, radio: number, t: Terreno, cajas: readonly Caja[]): void {
  for (let i = 0; i < 3; i++) {
    for (const k of cajas) empujarCaja(p, radio, k);
    resolver(p, radio, t);
  }
}

function libreEn(p: Punto, radio: number, t: Terreno): boolean {
  const q = { x: p.x, z: p.z };
  resolver(q, radio, t);
  return Math.hypot(q.x - p.x, q.z - p.z) <= 1e-7;
}

/** El punto libre más cercano (anillos crecientes); null si no hay ninguno en `BUSQUEDA_LIBRE.max`. */
export function puntoLibreCercano(p: Punto, radio: number, t: Terreno): Punto | null {
  if (libreEn(p, radio, t)) return { x: p.x, z: p.z };
  const { paso, max, angulos } = BUSQUEDA_LIBRE;
  for (let d = paso; d <= max + 1e-9; d += paso) {
    for (let k = 0; k < angulos; k++) {
      const a = (k / angulos) * Math.PI * 2;
      const q = { x: p.x + Math.sin(a) * d, z: p.z + Math.cos(a) * d };
      if (libreEn(q, radio, t)) return q;
    }
  }
  return null;
}

/** Ángulo `actual` girado hacia `deseado` como mucho `max` rad (por el lado corto). */
export function girarHacia(actual: number, deseado: number, max: number): number {
  const d = ((((deseado - actual + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return actual + Math.max(-max, Math.min(max, d));
}

/**
 * Dirección en el mundo de una entrada relativa a la cámara: `adelante` y `derecha` en [-1, 1],
 * `yaw` = hacia dónde mira la cámara (0 = hacia −Z). Escribe en `salida` (sin asignar) y la limita a 1.
 */
export function direccionMundo(adelante: number, derecha: number, yaw: number, salida: { x: number; z: number }): void {
  // Adelante de la cámara: (−sin yaw, −cos yaw). Derecha: (cos yaw, −sin yaw).
  let x = -Math.sin(yaw) * adelante + Math.cos(yaw) * derecha;
  let z = -Math.cos(yaw) * adelante - Math.sin(yaw) * derecha;
  const l = Math.hypot(x, z);
  if (l > 1) {
    x /= l;
    z /= l;
  }
  salida.x = x;
  salida.z = z;
}

export type TipoEventoDestino = "llego" | "cancelado" | "sin_ruta";

export interface OpcionesMovimiento {
  /** La ruta terminó: llegó, la canceló una entrada manual o no hay camino. */
  alDestino?: (tipo: TipoEventoDestino, lugar: LugarId) => void;
  /** Posición inicial de Iris (por defecto, a un costado del jugador). */
  iris?: Punto;
  /** Posición inicial del jugador (por defecto `INICIO_JUGADOR`). */
  inicio?: Punto;
  /** Rumbo inicial (0 = hacia +Z). Por defecto mira hacia la base (−Z). */
  rumbo?: number;
}

export interface Movimiento {
  /** Cuerpo del jugador (x, z, y y caída). Se reemplaza en cada paso: leerlo, no guardarlo. */
  readonly jugador: Cuerpo;
  /** Rumbo del cuerpo del jugador (0 = hacia +Z, como `rotation.y`). */
  readonly rumbo: number;
  /** Rapidez real del último paso, m/s (0 = quieto). */
  readonly velocidad: number;
  readonly iris: Guia;
  /** Rapidez real de Iris en el último paso, m/s (la de la guía puede no avanzar contra un sólido). */
  readonly velocidadIris: number;
  readonly destino: LugarId | null;
  readonly bloqueado: boolean;
  /** Ruta en curso (vacía sin destino). */
  readonly ruta: readonly PuntoRuta[];
  /** Cambia los sólidos (al construir o quitar un módulo, o al llegar el terreno). */
  fijarSolidos(s: Solidos): void;
  /** Entrada manual en el mundo (vector de largo ≤ 1). Distinta de cero cancela la ruta. Bloqueado: se ignora. */
  fijarEntrada(x: number, z: number): void;
  /** Bloqueado: nadie camina ni avanza la ruta (queda en pausa); se suelta la entrada. */
  fijarBloqueado(b: boolean): void;
  /** Elige un destino y planea la ruta. `null` la suelta sin evento. Sin ruta emite `sin_ruta`. */
  irA(destino: LugarId | null): void;
  /**
   * Lugar al que Iris rueda delante del niño aunque él no tenga ruta (la guía de la misión, A2). Si se
   * queda atrás, Iris espera y lo mira (`pasoGuia`). Un destino del niño (`irA`) manda sobre este.
   */
  guiarIrisA(lugar: LugarId | null): void;
  /** Gira el cuerpo sin moverlo (primera persona: el cuerpo mira con la cámara). */
  fijarRumbo(r: number): void;
  /** Avanza el reloj real `dt` segundos; los saltos largos se recortan con `subpasos`. */
  avanzar(dt: number, reducido?: boolean): void;
}

export function crearMovimiento(solidos: Solidos, o: OpcionesMovimiento = {}): Movimiento {
  let tMov = terrenoMovimiento(solidos);
  let tRuta: Terreno | null = null;
  let cajas = solidos.cajas;
  const inicio = o.inicio ?? INICIO_JUGADOR;
  let jugador: Cuerpo = { x: inicio.x, z: inicio.z, y: 0, vy: 0, apoyado: true };
  let rumbo = o.rumbo ?? Math.PI;
  let velocidad = 0;
  /** Velocidad suavizada del niño (m/s, en el mundo): la que de verdad lo mueve. */
  const vel = { x: 0, z: 0 };
  let velocidadIris = 0;
  const pi = o.iris ?? { x: inicio.x + 1.3, z: inicio.z + 0.4 };
  let iris: Guia = { x: pi.x, z: pi.z, rumbo, modo: "acompana" as ModoGuia, vel: 0 };
  let acumulado = 0;
  let entradaX = 0, entradaZ = 0;
  let bloqueado = false;
  let destino: LugarId | null = null;
  let guiaIris: LugarId | null = null;
  let ruta: PuntoRuta[] = [];
  let indice = 0;
  let mejorDist = Infinity;
  let msSinAvance = 0;
  // Objetos reutilizados por los pasos (la física y la guía sí crean los suyos).
  const jugadorGuia = { x: 0, z: 0, rumbo: 0 };
  const destinoGuia = { x: 0, z: 0, mx: 0, mz: 0 };
  const resolverIris = (p: Punto) => resolverSolidos(p, RADIO_IRIS, tMov, cajas);

  const rutaTerreno = () => (tRuta ??= terrenoRuta({ circulos: tMov.circulos, cajas }));

  const terminar = (tipo: TipoEventoDestino) => {
    const l = destino;
    destino = null;
    ruta = [];
    indice = 0;
    if (l) o.alDestino?.(tipo, l);
  };

  function planear(l: LugarId): boolean {
    const t = rutaTerreno();
    const meta = puntoLibreCercano(lugar(l), RADIO_JUGADOR, t);
    const desde = puntoLibreCercano(jugador, RADIO_JUGADOR, t);
    if (!meta || !desde) return false;
    if (Math.hypot(meta.x - jugador.x, meta.z - jugador.z) <= LLEGADA_RUTA) {
      ruta = [meta];
    } else {
      const r = planearRuta(desde, meta, t, RADIO_JUGADOR);
      if (!r.length) return false;
      ruta = r;
    }
    indice = 0;
    mejorDist = Infinity;
    msSinAvance = 0;
    return true;
  }

  function pasoFijo(h: number, reducido: boolean): void {
    let vx = 0, vz = 0;
    if (!bloqueado) {
      if (destino && ruta.length) {
        let obj = ruta[indice]!;
        let d = Math.hypot(obj.x - jugador.x, obj.z - jugador.z);
        while (d <= LLEGADA_RUTA && indice < ruta.length - 1) {
          indice++;
          obj = ruta[indice]!;
          d = Math.hypot(obj.x - jugador.x, obj.z - jugador.z);
          mejorDist = Infinity;
        }
        if (d <= LLEGADA_RUTA && indice === ruta.length - 1) {
          // Al llegar mira al modelo del lugar (la consola, el módulo o el edificio).
          const l = lugar(destino);
          rumbo = Math.atan2(l.mx - jugador.x, l.mz - jugador.z);
          // Llega al punto de uso exacto: sin inercia que lo pase de largo ni lo haga girar.
          vel.x = vel.z = 0;
          terminar("llego");
        } else {
          // Frena en el último tramo para no pasarse del punto de uso.
          const v = indice === ruta.length - 1 ? Math.min(VEL_JUGADOR, Math.max(0.6, d * 4)) : VEL_JUGADOR;
          vx = ((obj.x - jugador.x) / d) * v;
          vz = ((obj.z - jugador.z) / d) * v;
          if (d < mejorDist - AVANCE_MIN) {
            mejorDist = d;
            msSinAvance = 0;
          } else if ((msSinAvance += h * 1000) > MS_ATASCO) {
            vx = vz = 0;
            terminar("sin_ruta");
          }
        }
      } else {
        vx = entradaX * VEL_JUGADOR;
        vz = entradaZ * VEL_JUGADOR;
      }
    }

    // Con movimiento reducido o bloqueado, sin curva: arranca y para en seco.
    if (reducido || bloqueado) {
      vel.x = vx;
      vel.z = vz;
    } else acercarVelocidad(vel.x, vel.z, vx, vz, h, vel);
    vx = vel.x;
    vz = vel.z;
    const x0 = jugador.x, z0 = jugador.z;
    if (vx !== 0 || vz !== 0 || !jugador.apoyado) {
      jugador = moverPersonaje(jugador, vx, vz, h, tMov, RADIO_JUGADOR);
      resolverSolidos(jugador, RADIO_JUGADOR, tMov, cajas);
    }
    const mx = jugador.x - x0, mz = jugador.z - z0;
    const recorrido = Math.hypot(mx, mz);
    velocidad = recorrido / h;
    if (vx !== 0 || vz !== 0) {
      // Mira hacia donde desliza si avanza de verdad; contra una pared, hacia donde se lo pide
      // (los empujones del contacto no lo hacen girar).
      const avanza = recorrido > 0.3 * Math.hypot(vx, vz) * h;
      const deseado = avanza ? Math.atan2(mx, mz) : Math.atan2(vx, vz);
      rumbo = reducido ? deseado : girarSuave(rumbo, deseado, h, GIRO_JUGADOR * h);
    }

    if (!bloqueado) {
      jugadorGuia.x = jugador.x;
      jugadorGuia.z = jugador.z;
      jugadorGuia.rumbo = rumbo;
      let dg: typeof destinoGuia | null = null;
      const haciaIris = destino ?? guiaIris;
      if (haciaIris) {
        const l = lugar(haciaIris);
        destinoGuia.x = l.x;
        destinoGuia.z = l.z;
        destinoGuia.mx = l.mx;
        destinoGuia.mz = l.mz;
        dg = destinoGuia;
      }
      const ix = iris.x, iz = iris.z;
      iris = pasoGuia(iris, jugadorGuia, dg, h, resolverIris);
      velocidadIris = Math.hypot(iris.x - ix, iris.z - iz) / h;
    } else {
      velocidadIris = 0;
    }
  }

  return {
    get jugador() {
      return jugador;
    },
    get rumbo() {
      return rumbo;
    },
    get velocidad() {
      return velocidad;
    },
    get iris() {
      return iris;
    },
    get velocidadIris() {
      return velocidadIris;
    },
    get destino() {
      return destino;
    },
    get bloqueado() {
      return bloqueado;
    },
    get ruta() {
      return ruta;
    },
    fijarSolidos(s) {
      tMov = terrenoMovimiento(s);
      cajas = s.cajas;
      tRuta = null;
      // Un módulo recién construido puede caer encima: sale por el borde más cercano.
      resolverSolidos(jugador, RADIO_JUGADOR, tMov, cajas);
      resolverIris(iris);
      if (destino && !planear(destino)) terminar("sin_ruta");
    },
    fijarEntrada(x, z) {
      const l = Math.hypot(x, z);
      if (bloqueado || !(l > 1e-3) || !Number.isFinite(l)) {
        entradaX = entradaZ = 0;
        return;
      }
      entradaX = l > 1 ? x / l : x;
      entradaZ = l > 1 ? z / l : z;
      if (destino) terminar("cancelado");
    },
    fijarBloqueado(b) {
      bloqueado = b;
      if (b) entradaX = entradaZ = 0;
    },
    irA(l) {
      if (l === destino) return;
      if (l === null) {
        destino = null;
        ruta = [];
        return;
      }
      destino = l;
      if (!planear(l)) terminar("sin_ruta");
    },
    guiarIrisA(l) {
      guiaIris = l;
    },
    fijarRumbo(r) {
      rumbo = r;
    },
    avanzar(dt, reducido = false) {
      const { pasos, resto } = subpasos(acumulado, dt);
      acumulado = resto;
      if (pasos === 0) return;
      for (let i = 0; i < pasos; i++) pasoFijo(PASO_FISICO, reducido);
    },
  };
}

/** Teclas de marcha (por `KeyboardEvent.code`, independiente de la distribución del teclado). */
const TECLAS: Readonly<Record<string, "adelante" | "atras" | "izquierda" | "derecha">> = {
  KeyW: "adelante", ArrowUp: "adelante",
  KeyS: "atras", ArrowDown: "atras",
  KeyA: "izquierda", ArrowLeft: "izquierda",
  KeyD: "derecha", ArrowRight: "derecha",
};

/** Estado de las teclas de marcha. Sin DOM: el montaje le pasa `code` en keydown/keyup. */
export class TecladoMovimiento {
  private adelante = false;
  private atras = false;
  private izquierda = false;
  private derecha = false;

  /** true si la tecla es de marcha (y quedó registrada). */
  presionar(code: string): boolean {
    const t = TECLAS[code];
    if (!t) return false;
    this[t] = true;
    return true;
  }

  soltar(code: string): boolean {
    const t = TECLAS[code];
    if (!t) return false;
    this[t] = false;
    return true;
  }

  /** Pérdida de foco, pestaña oculta, bloqueo o desmontaje: nada queda apretado. */
  soltarTodo(): void {
    this.adelante = this.atras = this.izquierda = this.derecha = false;
  }

  get activo(): boolean {
    return this.adelante || this.atras || this.izquierda || this.derecha;
  }

  /** +1 adelante, −1 atrás. */
  get eje(): number {
    return (this.adelante ? 1 : 0) - (this.atras ? 1 : 0);
  }

  /** +1 derecha, −1 izquierda. */
  get lado(): number {
    return (this.derecha ? 1 : 0) - (this.izquierda ? 1 : 0);
  }
}
