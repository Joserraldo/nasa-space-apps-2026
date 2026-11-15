import * as THREE from "three";
import type { Materiales } from "../../../escena/materiales";
import { crearIris, type Personaje } from "../../../escena/personajes";
import { caja, chaflan, grupo, parte, tronco } from "../../../escena/activos/piezasComunes";
import { crearFormaModulo } from "../../../escena/activos/modulos";
import { crearHabitat, crearTorreControl } from "../../../escena/activos/edificios";
import { alturaExterior, asiento, exteriorMarte, mate, pantallas, pared } from "./cabina";
import type { ArmarVineta } from "./escenario";
import { actor, conActores, manosAlPanel, piso, sentado } from "./vinetas";

/** Viñetas 2 a 4 de inicio/02 (HISTORIA §3), con los mismos modelos del juego que la 1. */

/** Satélite listo para soltar: cuerpo chaflanado con ojo cian, antena y dos alas de celdas índigo, sobre su base. */
function satelite(m: Materiales): THREE.Group {
  const ala = (s: number) => {
    const g = grupo("Sat_Wing", parte(m, "SuitBase", chaflan(1.5, 1.0, 0.06, 0.1), [0, 0, 0], "Wing_Frame"));
    for (let f = 0; f < 2; f++) for (let c = 0; c < 3; c++) g.add(parte(m, "Boots", caja(0.42, 0.4, 0.02), [(c - 1) * 0.46, (f - 0.5) * 0.45, 0.04], "Wing_Cell"));
    g.position.set(s * 1.55, 1.55, 0);
    g.rotation.x = -0.35;
    return g;
  };
  // Cuatro patas abiertas hasta la plataforma escalonada, como el satélite de la lámina.
  const patas = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => {
    const p = parte(m, "SuitBase", caja(0.12, 1.0, 0.12), [sx * 0.55, 0.75, sz * 0.4], "Sat_Leg");
    p.rotation.set(sz * -0.35, 0, sx * 0.35);
    return p;
  }));
  return grupo(
    "Intro_Satellite",
    parte(m, "SuitBase", chaflan(3.2, 0.2, 1.8, 0.3), [0, 0.1, 0], "Sat_Platform"),
    parte(m, "SuitBase", chaflan(2.4, 0.16, 1.3, 0.25), [0, 0.28, 0], "Sat_PlatformTop"),
    ...patas,
    parte(m, "SuitBase", chaflan(1.1, 1.1, 0.9, 0.22), [0, 1.65, 0], "Sat_Body"),
    parte(m, "Accent", tronco(0.3, 0.3, 0.06, 8).clone().rotateX(Math.PI / 2), [0, 1.65, 0.48], "Sat_Eye"),
    parte(m, "Emissive", tronco(0.2, 0.2, 0.04, 8).clone().rotateX(Math.PI / 2), [0, 1.65, 0.52], "Sat_EyeGlow"),
    parte(m, "SuitBase", tronco(0.04, 0.05, 0.6, 6), [0, 2.5, 0], "Sat_Mast"),
    parte(m, "SuitBase", new THREE.IcosahedronGeometry(0.13, 0), [0, 2.85, 0], "Sat_Tip"),
    parte(m, "SuitBase", caja(0.9, 0.08, 0.08), [-0.85, 1.75, 0], "Sat_ArmL"),
    parte(m, "SuitBase", caja(0.9, 0.08, 0.08), [0.85, 1.75, 0], "Sat_ArmR"),
    ala(-1),
    ala(1),
  );
}

/** Bahía del satélite detrás de la ventana: piso, fondo con una ventanita a Marte, paredes y luces de techo. */
function bahia(m: Materiales): THREE.Group {
  const fondo = pared(9, 3.6, [{ x: -2.6, y: 1.9, w: 1.9, h: 1.9, c: 0.35 }]);
  fondo.position.set(1.4, 0.6, -8.5);
  const lado = (x: number) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.6, 6), mate("lila"));
    p.position.set(x, 2.4, -5.6);
    return p;
  };
  const techo = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 6), new THREE.MeshBasicMaterial({ color: mate("lila").color }));
  techo.position.set(1.4, 4.2, -5.6);
  const suelo = new THREE.Mesh(new THREE.BoxGeometry(9, 0.2, 6), mate("traje-marfil"));
  suelo.position.set(1.4, 0.5, -5.6);
  return grupo(
    "Intro_Bay",
    fondo, lado(-3.1), lado(5.9), techo, suelo,
    // Luces de techo de la bahía: tiras cian.
    ...[-0.6, 2.6].map((x) => parte(m, "Emissive", caja(1.6, 0.04, 0.3), [x, 4.08, -4.2], "Bay_Light")),
  );
}

/** 02 / Prepare to observe: el niño de espaldas toca la pantalla de la consola; por la ventana, el satélite listo. */
export const vineta2: ArmarVineta = (m) => {
  const g = new THREE.Group();
  const fondo = pared(24, 4.2, [{ x: 1.4, y: 2.05, w: 4.4, h: 2.2, c: 0.45 }]);
  fondo.position.z = -2.4;
  const sat = satelite(m);
  sat.position.set(2.0, 0.6, -5.6);
  sat.rotation.y = -0.2;
  // Consola baja con la pantalla inclinada hacia el niño, como el panel de la lámina.
  const pantalla = grupo(
    "Intro_TiltScreen",
    parte(m, "SuitBase", chaflan(1.3, 0.75, 0.1, 0.14), [0, 0, 0], "Tilt_Frame"),
    parte(m, "Emissive", chaflan(1.12, 0.58, 0.02, 0.1), [0, 0, 0.06], "Tilt_Glow"),
    parte(m, "Boots", chaflan(1.04, 0.5, 0.02, 0.09), [0, 0, 0.07], "Tilt_Face"),
    ...[[-0.2, 0.1, 0.5], [0.3, 0.1, 0.3], [-0.2, -0.1, 0.5], [0.3, -0.1, 0.3]].map(([x, y, w]) => parte(m, "Emissive", caja(w!, 0.1, 0.02), [x!, y!, 0.085], "Tilt_Block")),
  );
  pantalla.position.set(0, 1.0, 0);
  pantalla.rotation.x = -0.75;
  const consola = grupo("Intro_LowConsole", parte(m, "SuitBase", chaflan(1.7, 0.85, 0.8, 0.16), [0, 0.43, 0], "Low_Body"), pantalla);
  // La consola queda delante y a la derecha del niño, mirándolo: el guante derecho llega a la pantalla.
  const [kx, kz, giro] = [-0.95, 1.2, 1.85];
  const [fx, fz, dx, dz] = [Math.sin(giro), Math.cos(giro), -Math.cos(giro), Math.sin(giro)];
  consola.position.set(kx + 0.42 * fx + 0.1 * dx, 0.38, kz + 0.42 * fz + 0.1 * dz);
  consola.scale.setScalar(0.68);
  consola.rotation.y = giro + Math.PI;
  g.add(
    piso(26, 10),
    fondo,
    exteriorMarte(m, { cielo: "espacio", suelo: -1.6, semilla: 5 }),
    bahia(m),
    sat,
    consola,
    pantallas(m, 2, -2.3, 3.0, 0).translateZ(-2.15),
    // Luces de la cabina sobre la ventana.
    ...[0.2, 2.6].map((x) => parte(m, "Emissive", chaflan(1.0, 0.14, 0.04, 0.05), [x, 3.4, -2.15], "Cabin_Light")),
  );
  // Tarima del puesto (la consola y el niño quedan a la altura de la lámina).
  g.add(parte(m, "SuitBase", chaflan(2.6, 1.8, 0.45, 0.3).clone().rotateX(-Math.PI / 2).translate(0, 0.225, 0), [kx + 0.3, 0, kz], "Station_Step"));
  // El niño de espaldas, con el guante derecho apoyado en la pantalla.
  const nino = actor("nino", [kx, 0.45, kz], giro, "reposo", (pj) => {
    pj.huesos.brazoD.rotation.set(-1.25, 0, -0.3);
    pj.huesos.antebrazoD.rotation.x = -0.1;
    pj.huesos.cabeza.rotation.y = -0.2;
  });
  return conActores(g, { desde: [-0.75, 1.3, 3.3], hacia: [0.4, 1.25, 0], fov: 46 }, [nino]);
};

/** 03 / Meet your crew: Ingeniera, Doctora y Meteoróloga en la mesa redonda, el niño de espaldas e Iris al lado. */
export const vineta3: ArmarVineta = (m) => {
  const g = new THREE.Group();
  const fondo = pared(26, 4.4, [-3.4, 0, 3.4].map((x) => ({ x, y: 2.1, w: 2.6, h: 1.4, c: 0.3 })));
  fondo.position.z = -2.8;
  const maceta = (x: number) => grupo(
    "Intro_Planter",
    parte(m, "SuitBase", chaflan(0.9, 0.6, 0.6, 0.12), [x, 0.3, -2.2], "Planter_Box"),
    ...[-0.25, 0, 0.25].map((dx, i) => parte(m, "Plant", new THREE.IcosahedronGeometry(0.22 + i * 0.03, 0), [x + dx, 0.75 + (i % 2) * 0.12, -2.2], "Planter_Leaf")),
  );
  const luz = parte(m, "Emissive", tronco(0.85, 0.85, 0.06, 12), [0, 2.85, -1.3], "Ceiling_Ring");
  g.add(
    piso(26, 10),
    fondo,
    exteriorMarte(m, { cielo: "atardecer", suelo: -2.6, semilla: 9 }),
    maceta(-2.9),
    maceta(2.9),
    parte(m, "SuitBase", tronco(1.1, 1.1, 0.14, 12), [0, 2.95, -1.3], "Ceiling_Disc"),
    parte(m, "SuitBase", tronco(0.3, 0.3, 1.2, 8), [0, 3.6, -1.3], "Ceiling_Stem"),
    luz,
    // Mesa redonda: pie, tapa marfil y el holograma cian del centro.
    parte(m, "SuitBase", tronco(0.8, 0.95, 0.65, 12), [0, 0.33, -0.6], "Table_Base"),
    parte(m, "SuitBase", tronco(1.3, 1.2, 0.16, 12), [0, 0.72, -0.6], "Table_Top"),
    parte(m, "Emissive", tronco(1.0, 1.0, 0.02, 12), [0, 0.81, -0.6], "Table_Holo"),
  );
  const iris = crearIris();
  iris.grupo.position.set(1.75, 0, -0.35);
  iris.grupo.rotation.y = -0.5;
  g.add(iris.grupo);
  // Guantes sobre la mesa: la Doctora con los dos; Ingeniera y Meteoróloga con uno, el otro explica.
  const manoD = (pj: Personaje) => { pj.huesos.brazoD.rotation.set(-0.55, 0, -0.1); pj.huesos.antebrazoD.rotation.x = -0.75; };
  const manoI = (pj: Personaje) => { pj.huesos.brazoI.rotation.set(-0.55, 0, 0.1); pj.huesos.antebrazoI.rotation.x = -0.75; };
  const sillas: [number, number, number][] = [[-1.2, -1.25, 0.6], [0, -1.85, 0], [1.2, -1.25, -0.6]];
  for (const [x, z, giro] of sillas) {
    const silla = asiento(m);
    silla.scale.setScalar(1.15);
    silla.position.set(x - 0.14 * Math.sin(giro), 0, z - 0.14 * Math.cos(giro));
    silla.rotation.y = giro;
    g.add(silla);
  }
  const crew = [
    actor("ingeniera", [-1.2, 0.35, -1.25], 0.6, "explicar", (pj) => { sentado(pj); manoD(pj); }),
    actor("doctora", [0, 0.35, -1.85], 0, "reposo", (pj) => { sentado(pj); manoD(pj); manoI(pj); }),
    actor("meteorologa", [1.2, 0.35, -1.25], -0.6, "explicar", (pj) => { sentado(pj); manoD(pj); pj.huesos.brazoI.rotation.set(-0.7, 0, 0.5); pj.huesos.antebrazoI.rotation.set(-0.9, 0, -0.3); }),
    actor("nino", [-1.55, 0.1, 0.45], 2.3, "reposo"),
  ];
  return conActores(g, { desde: [0, 1.6, 2.6], hacia: [0, 1.2, -0.8], fov: 54 }, crew, {
    animar: (t, quieto) => iris.animar(quieto ? 0.4 : t, { quieto, cara: "feliz" }),
    liberar: () => iris.liberar(),
  });
};

/** Icono plano de medidor (rayo, hoja, escudo) en el color de su token, como los de la HUD. */
function icono(forma: [number, number][], token: "icono-energia" | "icono-vida" | "icono-escudo"): THREE.Mesh {
  const malla = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(forma.map(([x, y]) => new THREE.Vector2(x, y)))), new THREE.MeshBasicMaterial({ color: mate(token).color }));
  return malla;
}
const RAYO: [number, number][] = [[0.04, 0.2], [-0.1, -0.02], [0, -0.02], [-0.05, -0.2], [0.1, 0.04], [0, 0.04], [0.06, 0.2]];
const HOJA: [number, number][] = [[-0.14, -0.16], [-0.12, 0.04], [-0.02, 0.15], [0.15, 0.18], [0.13, 0.0], [0.03, -0.12]];
const ESCUDO: [number, number][] = [[0, 0.18], [0.15, 0.12], [0.13, -0.04], [0, -0.18], [-0.13, -0.04], [-0.15, 0.12]];

/** Panel de los tres medidores: marco marfil, cara índigo y tres placas con borde cian. Sin cifras. */
function panelMedidores(m: Materiales): THREE.Group {
  const g = grupo(
    "Intro_Gauges",
    parte(m, "SuitBase", chaflan(2.1, 1.0, 0.14, 0.18), [0, 0, 0], "Gauges_Frame"),
    parte(m, "Emissive", chaflan(1.9, 0.82, 0.02, 0.15), [0, 0, 0.075], "Gauges_Rim"),
    parte(m, "Boots", chaflan(1.82, 0.74, 0.02, 0.14), [0, 0, 0.085], "Gauges_Face"),
  );
  ([[RAYO, "icono-energia"], [HOJA, "icono-vida"], [ESCUDO, "icono-escudo"]] as const).forEach(([forma, token], i) => {
    const x = (i - 1) * 0.58;
    g.add(parte(m, "Emissive", chaflan(0.5, 0.5, 0.02, 0.1), [x, 0, 0.1], "Gauge_Rim"));
    g.add(parte(m, "Boots", chaflan(0.44, 0.44, 0.02, 0.09), [x, 0, 0.11], "Gauge_Tile"));
    const ic = icono(forma as [number, number][], token);
    ic.position.set(x, 0, 0.125);
    g.add(ic);
  });
  return g;
}

/** Módulo de aterrizaje de la lámina: cápsula facetada con ventanita cian sobre cuatro patas abiertas. */
function aterrizador(m: Materiales): THREE.Group {
  const patas = [0, 1, 2, 3].flatMap((i) => {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    const pata = parte(m, "SuitBase", caja(0.12, 1.1, 0.12), [Math.sin(a) * 0.95, 0.5, Math.cos(a) * 0.95], "Lander_Leg");
    pata.rotation.set(Math.cos(a) * 0.45, 0, -Math.sin(a) * 0.45);
    return [pata, parte(m, "Boots", tronco(0.22, 0.26, 0.08, 8), [Math.sin(a) * 1.2, 0.04, Math.cos(a) * 1.2], "Lander_Pad")];
  });
  return grupo(
    "Intro_Lander",
    ...patas,
    parte(m, "SuitBase", tronco(0.55, 0.95, 1.3, 8), [0, 1.55, 0], "Lander_Body"),
    parte(m, "Accent", tronco(0.97, 0.97, 0.12, 8), [0, 0.95, 0], "Lander_Band"),
    parte(m, "SuitBase", tronco(0.2, 0.55, 0.35, 8), [0, 2.38, 0], "Lander_Top"),
    parte(m, "Emissive", chaflan(0.36, 0.3, 0.04, 0.08), [0, 1.6, 0.78], "Lander_Window"),
  );
}

/** 04 / Your turn: el niño en primer plano mira la base posible por la ventana; a la derecha, los tres medidores. */
export const vineta4: ArmarVineta = (m) => {
  const g = new THREE.Group();
  const fondo = pared(24, 4.6, [{ x: 0.9, y: 2.45, w: 6.4, h: 2.6, c: 0.5 }]);
  fondo.position.z = -2.4;
  const suelo = -0.6;
  const base = new THREE.Group();
  const poner = (o: THREE.Object3D, x: number, z: number, e: number, giro = 0) => {
    o.position.set(x, alturaExterior(suelo, z) + 0.6, z);
    o.scale.setScalar(e);
    o.rotation.y = giro;
    base.add(o);
  };
  poner(crearTorreControl(m), 2.2, -20, 0.8, -0.3);
  poner(crearHabitat(m), 10.5, -21, 0.7, -0.3);
  poner(crearFormaModulo(m, "invernadero"), 6.0, -16, 1.0);
  poner(crearFormaModulo(m, "invernadero"), 9.3, -17, 0.9);
  poner(crearFormaModulo(m, "panel_solar"), -1.2, -15, 0.85, 0.15);
  poner(crearFormaModulo(m, "antena"), -1.6, -22, 1.0, 0.5);
  poner(aterrizador(m), -4.6, -17, 1.1, 0.3);
  const medidores = panelMedidores(m);
  medidores.position.set(0.95, 0.82, 1.7);
  medidores.scale.setScalar(0.8);
  medidores.rotation.set(-0.25, -0.15, 0);
  g.add(
    piso(26, 10),
    fondo,
    exteriorMarte(m, { cielo: "dia", suelo, semilla: 21, rocas: 24 }),
    base,
    medidores,
    parte(m, "SuitBase", caja(2.0, 0.6, 0.6), [1.0, 0.3, 1.5], "Gauges_Desk"),
  );
  // De perfil a tres cuartos, con los ojos abiertos y la boca abierta de entusiasmo, mirando hacia la ventana.
  const nino = actor("nino", [-0.7, 0.72, 2.95], 1.05, "reposo", (pj) => { manosAlPanel(pj); pj.huesos.cabeza.rotation.y = 0.25; }, "hablaAbierta");
  return conActores(g, { desde: [0.1, 1.6, 4.5], hacia: [0.4, 1.35, 0], fov: 46 }, [nino]);
};
