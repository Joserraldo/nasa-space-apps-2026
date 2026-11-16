import { describe, expect, it } from "vitest";
import { MAX_SUBPASOS, PASO_FISICO } from "./fisica";
import { BANCO, TERRENO, lugar, lugarCercano, type LugarId } from "./mundo";
import {
  RADIO_JUGADOR,
  TecladoMovimiento,
  VEL_JUGADOR,
  coberturaCaja,
  crearMovimiento,
  direccionMundo,
  distanciaCaja,
  empujarCaja,
  solidosDeHuellas,
  type Caja,
  type Solidos,
  type TipoEventoDestino,
} from "./movimientoBase";
import { solidosBase } from "./escena3d";
import { DISTANCIA_ESPERA } from "./guia";

const VACIO: Solidos = { circulos: [], cajas: [] };
const segundos = (m: ReturnType<typeof crearMovimiento>, s: number) => {
  for (let t = 0; t < s; t += 1 / 60) m.avanzar(1 / 60);
};

describe("cajas giradas (sin convertirlas en círculos)", () => {
  const k: Caja = { x: 0, z: 0, ancho: 4, fondo: 2, giro: 0 };

  it("empuja por la cara más cercana desde dentro y desde el borde", () => {
    const p = { x: 0.5, z: 0.9 };
    empujarCaja(p, 0.4, k);
    expect(p.z).toBeCloseTo(1.4);
    expect(p.x).toBeCloseTo(0.5);
    const q = { x: 2.2, z: 0 };
    empujarCaja(q, 0.4, k);
    expect(q.x).toBeCloseTo(2.4);
  });

  it("en la esquina empuja en diagonal desde el vértice, no desde un círculo inventado", () => {
    const p = { x: 2.1, z: 1.1 };
    empujarCaja(p, 0.4, k);
    expect(Math.hypot(p.x - 2, p.z - 1)).toBeCloseTo(0.4);
    expect(p.x).toBeGreaterThan(2);
    expect(p.z).toBeGreaterThan(1);
    // Un punto que un círculo circunscrito (r ≈ 2,24) echaría y la caja no: queda donde está.
    const libre = { x: 1.9, z: 1.5 };
    empujarCaja(libre, 0.4, k);
    expect(libre).toEqual({ x: 1.9, z: 1.5 });
  });

  it("respeta el giro igual que distanciaAHuella (rotation.y)", () => {
    const g: Caja = { ...k, giro: Math.PI / 2 };
    // Girada 90°: el ancho (4 m) corre por z.
    expect(distanciaCaja(0, 1.9, g)).toBe(0);
    expect(distanciaCaja(1.9, 0, g)).toBeCloseTo(0.9);
    const p = { x: 0.2, z: 1.9 };
    empujarCaja(p, 0.4, g);
    expect(distanciaCaja(p.x, p.z, g)).toBeCloseTo(0.4);
  });

  it("la cobertura de ruta contiene todo el contorno de la caja", () => {
    const g: Caja = { x: 3, z: -2, ancho: 6.8, fondo: 2.4, giro: 0.7 };
    const cob = coberturaCaja(g);
    const c = Math.cos(g.giro), s = Math.sin(g.giro);
    for (let i = 0; i <= 40; i++) {
      for (const [lx, lz] of [[-3.4 + (6.8 * i) / 40, -1.2], [-3.4 + (6.8 * i) / 40, 1.2], [-3.4, -1.2 + (2.4 * i) / 40], [3.4, -1.2 + (2.4 * i) / 40]] as const) {
        const x = g.x + c * lx + s * lz, z = g.z - s * lx + c * lz;
        expect(cob.some((k2) => Math.hypot(x - k2.x, z - k2.z) <= k2.r + 1e-9)).toBe(true);
      }
    }
    expect(Math.max(...cob.map((k2) => k2.r))).toBeLessThan(0.75);
  });
});

describe("movimiento del jugador", () => {
  it("no sale del límite del mapa", () => {
    const m = crearMovimiento(VACIO);
    m.fijarEntrada(1, 0);
    segundos(m, 12);
    expect(Math.hypot(m.jugador.x, m.jugador.z)).toBeLessThanOrEqual(TERRENO.limite - RADIO_JUGADOR + 1e-6);
    expect(Math.hypot(m.jugador.x, m.jugador.z)).toBeGreaterThan(TERRENO.limite - RADIO_JUGADOR - 0.05);
  });

  it("desliza a lo largo de una pared en vez de pararse", () => {
    const pared: Caja = { x: 0, z: 0, ancho: 10, fondo: 1, giro: 0 };
    const m = crearMovimiento({ circulos: [], cajas: [pared] }, { inicio: { x: -3, z: 1.5 } });
    // Empuja contra la pared (−z) y en diagonal hacia +x.
    m.fijarEntrada(0.6, -0.8);
    segundos(m, 1.5);
    expect(m.jugador.z).toBeCloseTo(0.5 + RADIO_JUGADOR, 2);
    expect(m.jugador.x).toBeGreaterThan(-3 + 1.5 * VEL_JUGADOR * 0.5);
  });

  it("rodea la esquina de una caja sin meterse dentro", () => {
    const k: Caja = { x: 0, z: 0, ancho: 2, fondo: 2, giro: 0.4 };
    const m = crearMovimiento({ circulos: [], cajas: [k] }, { inicio: { x: -0.3, z: 3 } });
    m.fijarEntrada(0, -1);
    let minimo = Infinity;
    for (let t = 0; t < 4; t += 1 / 60) {
      m.avanzar(1 / 60);
      minimo = Math.min(minimo, distanciaCaja(m.jugador.x, m.jugador.z, k));
    }
    expect(minimo).toBeGreaterThan(RADIO_JUGADOR - 1e-3);
    // Pasó al otro lado deslizando por la esquina.
    expect(m.jugador.z).toBeLessThan(-1);
  });

  it("sube la rampa del banco hasta la plataforma y no sube el borde alto de costado", () => {
    const m = crearMovimiento(VACIO, { inicio: { x: (BANCO.x0 + BANCO.x1) / 2, z: BANCO.zBajo - 0.6 } });
    m.fijarEntrada(0, 1);
    segundos(m, 1.6);
    expect(m.jugador.z).toBeGreaterThan(BANCO.zAlto);
    expect(m.jugador.z).toBeLessThan(BANCO.zFondo);
    expect(m.jugador.y).toBeCloseTo(BANCO.alto, 5);

    const lado = crearMovimiento(VACIO, { inicio: { x: BANCO.x1 + 1, z: (BANCO.zAlto + 8) / 2 } });
    lado.fijarEntrada(-1, 0);
    segundos(lado, 2);
    expect(lado.jugador.x).toBeGreaterThanOrEqual(BANCO.x1 - 1e-6);
    expect(lado.jugador.y).toBe(0);
  });

  it("un dt largo (pestaña oculta) se recorta: no hay salto", () => {
    const m = crearMovimiento(VACIO);
    m.fijarEntrada(0, -1);
    const z0 = m.jugador.z;
    m.avanzar(30);
    expect(z0 - m.jugador.z).toBeLessThanOrEqual(MAX_SUBPASOS * PASO_FISICO * VEL_JUGADOR + 1e-9);
    m.avanzar(Number.NaN);
    expect(Number.isFinite(m.jugador.z)).toBe(true);
  });

  it("bloqueado no camina y suelta la entrada; al desbloquear sigue quieto", () => {
    const m = crearMovimiento(VACIO);
    m.fijarEntrada(0, -1);
    m.fijarBloqueado(true);
    const { x, z } = m.jugador;
    segundos(m, 1);
    expect(m.jugador.x).toBe(x);
    expect(m.jugador.z).toBe(z);
    m.fijarEntrada(0, -1);
    segundos(m, 0.5);
    expect(m.jugador.z).toBe(z);
    m.fijarBloqueado(false);
    segundos(m, 0.5);
    expect(m.jugador.z).toBe(z);
    expect(m.velocidad).toBe(0);
  });

  it("mira hacia donde camina", () => {
    const m = crearMovimiento(VACIO);
    m.fijarEntrada(1, 0);
    segundos(m, 0.5);
    expect(Math.cos(m.rumbo - Math.PI / 2)).toBeGreaterThan(0.99);
  });
});

describe("rutas e Iris sobre los sólidos reales", () => {
  const solidos = solidosBase({ panel_solar: "funcionando", escudo: "funcionando" }, []);

  const ir = (l: LugarId, s = solidos) => {
    const eventos: TipoEventoDestino[] = [];
    const m = crearMovimiento(s, { alDestino: (t) => eventos.push(t) });
    m.irA(l);
    return { m, eventos };
  };

  for (const l of ["mesa", "taller", "panel_solar", "escudo", "habitat", "invernadero", "antena"] as const) {
    it(`la ruta a ${l} llega a su radio de uso sin atravesar sólidos`, () => {
      const { m, eventos } = ir(l);
      expect(m.ruta.length).toBeGreaterThan(0);
      let minimo = Infinity;
      for (let t = 0; t < 25 && !eventos.length; t += 1 / 60) {
        m.avanzar(1 / 60);
        for (const k of solidos.cajas) minimo = Math.min(minimo, distanciaCaja(m.jugador.x, m.jugador.z, k));
        for (const c of solidos.circulos) minimo = Math.min(minimo, Math.hypot(m.jugador.x - c.x, m.jugador.z - c.z) - c.r);
      }
      expect(eventos).toEqual(["llego"]);
      expect(minimo).toBeGreaterThan(RADIO_JUGADOR - 1e-3);
      expect(lugarCercano(m.jugador.x, m.jugador.z)).toBe(l);
      expect(m.destino).toBeNull();
    });
  }

  it("Iris acompaña sin atravesar sólidos y su rapidez es la real", () => {
    const { m } = ir("panel_solar");
    let maxIris = 0;
    for (let t = 0; t < 8; t += 1 / 60) {
      m.avanzar(1 / 60);
      for (const k of solidos.cajas) expect(distanciaCaja(m.iris.x, m.iris.z, k)).toBeGreaterThan(0.4);
      maxIris = Math.max(maxIris, m.velocidadIris);
    }
    expect(maxIris).toBeGreaterThan(0.5);
    // Guía hasta el panel: termina cerca de su puesto, a un costado del punto de uso.
    expect(Math.hypot(m.iris.x - lugar("panel_solar").x, m.iris.z - lugar("panel_solar").z)).toBeLessThan(2.5);
  });

  it("A2: Iris rueda delante del niño hacia el objetivo sin moverlo, y lo espera si se queda atrás", () => {
    const m = crearMovimiento(solidos);
    const inicio = { x: m.jugador.x, z: m.jugador.z };
    const taller = lugar("taller");
    const distIris = () => Math.hypot(m.iris.x - taller.x, m.iris.z - taller.z);
    const antes = distIris();
    m.guiarIrisA("taller");
    segundos(m, 6);
    // El niño no se movió: Iris no camina por él (no tiene ruta ni destino propio).
    expect(m.jugador.x).toBeCloseTo(inicio.x, 6);
    expect(m.jugador.z).toBeCloseTo(inicio.z, 6);
    expect(m.destino).toBeNull();
    // Iris avanzó hacia el taller, pero sin alejarse más de la distancia de espera (más su margen).
    expect(distIris()).toBeLessThan(antes);
    expect(Math.hypot(m.iris.x - inicio.x, m.iris.z - inicio.z)).toBeLessThan(DISTANCIA_ESPERA + 1);
    expect(["guia", "espera", "llego"]).toContain(m.iris.modo);
    // Sin guía vuelve a acompañar.
    m.guiarIrisA(null);
    segundos(m, 3);
    expect(m.iris.modo).toBe("acompana");
  });

  it("la entrada manual cancela la ruta y emite cancelado una sola vez", () => {
    const { m, eventos } = ir("antena");
    segundos(m, 0.3);
    m.fijarEntrada(-1, 0);
    m.fijarEntrada(-1, 0);
    segundos(m, 0.3);
    expect(eventos).toEqual(["cancelado"]);
    expect(m.destino).toBeNull();
  });

  it("bloqueado pausa la ruta sin cancelarla", () => {
    const { m, eventos } = ir("taller");
    segundos(m, 0.3);
    m.fijarBloqueado(true);
    const x = m.jugador.x;
    segundos(m, 1);
    expect(m.jugador.x).toBe(x);
    expect(m.destino).toBe("taller");
    m.fijarBloqueado(false);
    segundos(m, 10);
    expect(eventos).toEqual(["llego"]);
  });

  it("sin camino emite sin_ruta", () => {
    // Un anillo de cajas encierra al jugador.
    const cajas: Caja[] = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return { x: Math.sin(a) * 2.5, z: 3.4 + Math.cos(a) * 2.5, ancho: 1.6, fondo: 0.4, giro: a + Math.PI / 2 };
    });
    const { m, eventos } = ir("antena", { circulos: [], cajas });
    expect(eventos).toEqual(["sin_ruta"]);
    expect(m.destino).toBeNull();
  });

  it("solo los módulos construidos son sólidos", () => {
    const sinNada = solidosBase({}, []);
    const conPanel = solidosBase({ panel_solar: "funcionando" }, []);
    const enPanel = { x: lugar("panel_solar").mx, z: lugar("panel_solar").mz };
    const dentro = (s: Solidos) => s.cajas.some((k) => distanciaCaja(enPanel.x, enPanel.z, k) === 0);
    expect(dentro(sinNada)).toBe(false);
    expect(dentro(conPanel)).toBe(true);
    expect(dentro(solidosBase({ panel_solar: "instalando" }, []))).toBe(true);
    expect(dentro(solidosBase({ panel_solar: "ausente" }, []))).toBe(false);
  });

  it("caminar no toca nada fuera del movimiento (no hay recursos aquí)", () => {
    const m = crearMovimiento(solidos);
    expect(Object.keys(m).some((k) => /energ|vital|blind|recurso/i.test(k))).toBe(false);
  });
});

describe("entrada", () => {
  it("la dirección es relativa a la cámara", () => {
    const d = { x: 0, z: 0 };
    direccionMundo(1, 0, 0, d);
    expect(d.x).toBeCloseTo(0);
    expect(d.z).toBeCloseTo(-1);
    direccionMundo(0, 1, 0, d);
    expect(d.x).toBeCloseTo(1);
    direccionMundo(1, 0, Math.PI / 2, d);
    expect(d.x).toBeCloseTo(-1);
    direccionMundo(1, 1, 0, d);
    expect(Math.hypot(d.x, d.z)).toBeCloseTo(1);
  });

  it("las teclas se sueltan todas al perder el foco", () => {
    const t = new TecladoMovimiento();
    expect(t.presionar("KeyW")).toBe(true);
    expect(t.presionar("ArrowLeft")).toBe(true);
    expect(t.presionar("KeyE")).toBe(false);
    expect([t.eje, t.lado]).toEqual([1, -1]);
    t.soltarTodo();
    expect(t.activo).toBe(false);
    expect([t.eje, t.lado]).toEqual([0, 0]);
  });

  it("solidosDeHuellas no cambia la forma de ninguna huella", () => {
    const s = solidosDeHuellas([{ id: "a", x: 1, z: 2, r: 0.5 }, { id: "b", x: 0, z: 0, ancho: 2, fondo: 1, giro: 0.3 }] as never);
    expect(s.circulos).toEqual([{ x: 1, z: 2, r: 0.5 }]);
    expect(s.cajas).toEqual([{ x: 0, z: 0, ancho: 2, fondo: 1, giro: 0.3 }]);
  });
});
