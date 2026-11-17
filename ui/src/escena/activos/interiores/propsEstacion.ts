import * as THREE from "three";

/**
 * Props of the station rooms and the corridor, built in code (no external mesh), in the low poly station look:
 * white plastic, grey metal, purple trims, blue lights. Origin at the floor, centre of the piece, front toward
 * +z; sizes in metres for the kid (an adult suit is 1.6 m). The room fuses them by material.
 */

const plano = (name: string, color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, ...extra });
const BLANCO = plano("Prop_White", "#F2F0EC");
const GRIS = plano("Prop_Metal", "#B9B8C2");
const OSCURO = plano("Prop_Dark", "#2B2C38");
const MORADO = plano("Prop_Purple", "#7C5CC4");
const AZUL = plano("Prop_Blue", "#2F8EEA");
const ROJO = plano("Prop_Red", "#C8454A");
const VISOR = plano("Prop_Visor", "#123A78", { roughness: 0.2 });
const PANTALLA = new THREE.MeshBasicMaterial({ name: "Prop_Screen", color: "#5AB4FF" });
const FACETA = (m: THREE.MeshStandardMaterial) => {
  const c = m.clone();
  c.flatShading = true;
  return c;
};
const BLANCO_FACETA = FACETA(BLANCO);

type V3 = readonly [number, number, number];

function caja(w: number, h: number, d: number, mat: THREE.Material, p: V3, nombre: string, giro: V3 = [0, 0, 0]): THREE.Mesh {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  o.name = nombre;
  o.position.set(...p);
  o.rotation.set(...giro);
  o.castShadow = !(mat instanceof THREE.MeshBasicMaterial);
  o.receiveShadow = true;
  return o;
}
function cilindro(r: number, h: number, mat: THREE.Material, p: V3, nombre: string, giro: V3 = [0, 0, 0], lados = 10): THREE.Mesh {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, lados), mat);
  o.name = nombre;
  o.position.set(...p);
  o.rotation.set(...giro);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
function grupo(nombre: string, ...hijos: THREE.Object3D[]): THREE.Group {
  const g = new THREE.Group();
  g.name = nombre;
  g.add(...hijos);
  return g;
}

const VISOR_FACETA = FACETA(VISOR);
const MORADO_FACETA = FACETA(MORADO);

/**
 * Helmet: faceted white shell and a big curved navy visor over its front (a slice of a slightly larger sphere,
 * so the shell never pokes through it), centred at `p`.
 */
function cascoEn(p: V3, nombre: string, r = 0.2): THREE.Object3D[] {
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), BLANCO_FACETA);
  shell.name = `${nombre}_Shell`;
  shell.position.set(...p);
  shell.castShadow = true;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(r * 1.12, 12, 5, Math.PI / 2 - 0.95, 1.9, 1.15, 0.95), VISOR_FACETA);
  visor.name = `${nombre}_Visor`;
  visor.position.set(...p);
  return [shell, visor];
}

/** A limb segment: a low poly cylinder from `a` (top) going down `largo` m, tilted `inclina` rad out to the side. */
function tramo(r: number, largo: number, mat: THREE.Material, a: V3, inclina: number, nombre: string): THREE.Mesh {
  const o = cilindro(r, largo, mat, [a[0] + Math.sin(inclina) * largo / 2, a[1] - Math.cos(inclina) * largo / 2, a[2]], nombre, [0, 0, inclina], 7);
  return o;
}

/**
 * Spare suit standing on its own, after the low poly suits of the station look: purple, round limbs, a white V
 * plate and collar on the chest, white knee guards, cuffs and gloves, black boots, a white backpack and a round
 * helmet with a big navy visor. 1.6 m.
 */
export function traje(): THREE.Group {
  const lado = [-1, 1].flatMap((s) => {
    const guante = new THREE.Mesh(new THREE.IcosahedronGeometry(0.065, 0), BLANCO_FACETA);
    guante.name = "Suit_Glove";
    guante.position.set(s * 0.33, 0.68, 0.02);
    const hombro = new THREE.Mesh(new THREE.IcosahedronGeometry(0.095, 0), MORADO_FACETA);
    hombro.name = "Suit_Shoulder";
    hombro.position.set(s * 0.24, 1.2, 0);
    return [
      caja(0.15, 0.1, 0.25, OSCURO, [s * 0.1, 0.05, 0.03], "Suit_Boot"),
      tramo(0.075, 0.34, MORADO, [s * 0.1, 0.44, 0], 0, "Suit_Shin"),
      cilindro(0.083, 0.1, BLANCO, [s * 0.1, 0.33, 0], "Suit_KneeGuard", [0, 0, 0], 7),
      tramo(0.088, 0.36, MORADO, [s * 0.1, 0.8, 0], 0, "Suit_Thigh"),
      hombro,
      tramo(0.062, 0.28, MORADO, [s * 0.26, 1.18, 0], s * 0.12, "Suit_UpperArm"),
      tramo(0.058, 0.26, MORADO, [s * 0.295, 0.92, 0.01], s * 0.08, "Suit_Forearm"),
      cilindro(0.064, 0.06, BLANCO, [s * 0.312, 0.73, 0.015], "Suit_Cuff", [0, 0, s * 0.08], 7),
      guante,
      // One arm of the white V plate on the chest.
      caja(0.07, 0.24, 0.03, BLANCO, [s * 0.075, 1.07, 0.135], "Suit_ChestV", [0, 0, s * 0.5]),
    ];
  });
  const torso = cilindro(0.2, 0.46, MORADO, [0, 1.0, 0], "Suit_Torso", [0, 0, 0], 8);
  torso.scale.z = 0.7;
  return grupo(
    "traje",
    ...lado,
    torso,
    caja(0.34, 0.14, 0.22, MORADO, [0, 0.77, 0], "Suit_Hips"),
    cilindro(0.16, 0.06, BLANCO, [0, 1.25, 0], "Suit_Collar", [0, 0, 0], 8),
    caja(0.32, 0.4, 0.13, BLANCO, [0, 1.02, -0.19], "Suit_Pack"),
    caja(0.12, 0.05, 0.02, AZUL, [0, 0.9, 0.145], "Suit_Light"),
    ...cascoEn([0, 1.43, 0.01], "Suit_Helmet"),
  );
}

/** Wall shelf with two helmets; back edge on z = 0, the shelf grows toward +z. */
export function repisaCascos(): THREE.Group {
  return grupo(
    "repisaCascos",
    caja(1.5, 0.05, 0.45, BLANCO, [0, 1.3, 0.22], "Shelf_Board"),
    caja(0.05, 0.3, 0.4, GRIS, [-0.6, 1.15, 0.2], "Shelf_Bracket"),
    caja(0.05, 0.3, 0.4, GRIS, [0.6, 1.15, 0.2], "Shelf_Bracket"),
    caja(1.5, 0.04, 0.03, MORADO, [0, 1.3, 0.45], "Shelf_Trim"),
    ...cascoEn([-0.35, 1.52, 0.22], "Shelf_HelmetA"),
    ...cascoEn([0.35, 1.52, 0.22], "Shelf_HelmetB"),
  );
}

/** Cargo crate, 0.8 m: grey with purple straps. */
export function cajaBandas(): THREE.Group {
  return grupo("cajaBandas",
    caja(0.8, 0.8, 0.8, GRIS, [0, 0.4, 0], "Crate_Body"),
    caja(0.07, 0.82, 0.82, MORADO, [-0.2, 0.4, 0], "Crate_Strap"),
    caja(0.07, 0.82, 0.82, MORADO, [0.2, 0.4, 0], "Crate_Strap"));
}

/** Vented crate, 0.8 m: grey with four dark vents on top and a purple light. */
export function cajaRejilla(): THREE.Group {
  const rejillas = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => caja(0.24, 0.02, 0.24, OSCURO, [a! * 0.17, 0.805, b! * 0.17], `Crate_Vent_${i}`));
  return grupo("cajaRejilla", caja(0.8, 0.8, 0.8, GRIS, [0, 0.4, 0], "Crate_Body"), ...rejillas,
    caja(0.3, 0.06, 0.02, MORADO, [0, 0.25, 0.41], "Crate_Light"));
}

/** Storage cube, 0.8 m: white with a purple band and a blue status light. */
export function cajaAlmacen(): THREE.Group {
  return grupo("cajaAlmacen",
    caja(0.8, 0.8, 0.8, BLANCO, [0, 0.4, 0], "Store_Body"),
    caja(0.82, 0.08, 0.82, MORADO, [0, 0.55, 0], "Store_Band"),
    caja(0.16, 0.06, 0.02, AZUL, [0, 0.3, 0.41], "Store_Light"));
}

/** Table, 2.5 x 1.25 m and 0.82 m high: white top on a dark rim and legs. */
function mesa(): THREE.Object3D[] {
  const patas = [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => caja(0.08, 0.76, 0.08, OSCURO, [a! * 1.15, 0.38, b! * 0.55], `Table_Leg_${i}`));
  return [
    ...patas,
    caja(2.56, 0.05, 1.31, OSCURO, [0, 0.76, 0], "Table_Rim"),
    caja(2.44, 0.04, 1.19, BLANCO, [0, 0.8, 0], "Table_Top"),
    caja(2.3, 0.05, 0.05, OSCURO, [0, 0.2, 0], "Table_Bar"),
  ];
}

/** Mess table of the habitat. */
export const mesaComedor = () => grupo("mesaComedor", ...mesa());

/** Workbench of the engineering room: the table with a drill lying on it. */
export function mesaTaller(): THREE.Group {
  return grupo(
    "mesaTaller",
    ...mesa(),
    // Drill: body, chuck and purple grip.
    caja(0.32, 0.14, 0.12, GRIS, [-0.5, 0.89, -0.2], "Drill_Body"),
    cilindro(0.035, 0.18, OSCURO, [-0.27, 0.89, -0.2], "Drill_Bit", [0, 0, Math.PI / 2], 6),
    caja(0.09, 0.08, 0.2, MORADO, [-0.6, 0.86, -0.08], "Drill_Grip"),
  );
}

/** Gas tank lying on two saddles, 1.6 m long along x, with a coloured band (blue O2, purple H2). */
export function tanqueGas(banda: "o2" | "h2"): THREE.Group {
  const color = banda === "o2" ? AZUL : MORADO;
  const eje: V3 = [0, 0, Math.PI / 2];
  return grupo(
    `tanque_${banda}`,
    cilindro(0.36, 1.5, BLANCO, [0, 0.5, 0], "Tank_Body", eje, 12),
    cilindro(0.3, 0.12, GRIS, [-0.8, 0.5, 0], "Tank_Cap", eje, 12),
    cilindro(0.3, 0.12, GRIS, [0.8, 0.5, 0], "Tank_Cap", eje, 12),
    cilindro(0.37, 0.3, color, [0, 0.5, 0], "Tank_Band", eje, 12),
    cilindro(0.05, 0.14, OSCURO, [0.5, 0.92, 0], "Tank_Valve", [0, 0, 0], 6),
    caja(0.16, 0.16, 0.7, OSCURO, [-0.5, 0.08, 0], "Tank_Saddle"),
    caja(0.16, 0.16, 0.7, OSCURO, [0.5, 0.08, 0], "Tank_Saddle"),
  );
}
export const tanqueO2 = () => tanqueGas("o2");
export const tanqueH2 = () => tanqueGas("h2");

/** Robot arm on a round base, bent over toward +z: about 1.3 m high. */
export function brazoRobot(): THREE.Group {
  const codo = new THREE.Group();
  codo.position.set(0, 0.95, 0.12);
  codo.rotation.x = 0.9;
  codo.add(
    caja(0.1, 0.5, 0.1, BLANCO, [0, 0.25, 0], "Arm_Upper"),
    caja(0.16, 0.06, 0.06, OSCURO, [0, 0.52, 0], "Arm_Wrist"),
    caja(0.03, 0.12, 0.05, OSCURO, [-0.06, 0.6, 0], "Arm_Finger"),
    caja(0.03, 0.12, 0.05, OSCURO, [0.06, 0.6, 0], "Arm_Finger"),
  );
  return grupo(
    "brazoRobot",
    cilindro(0.24, 0.12, OSCURO, [0, 0.06, 0], "Arm_Base", [0, 0, 0], 12),
    cilindro(0.15, 0.2, BLANCO, [0, 0.22, 0], "Arm_Turret", [0, 0, 0], 10),
    caja(0.12, 0.7, 0.12, BLANCO, [0, 0.62, 0.05], "Arm_Lower", [0.15, 0, 0]),
    cilindro(0.09, 0.16, MORADO, [0, 0.95, 0.12], "Arm_Elbow", [0, 0, Math.PI / 2], 8),
    codo,
  );
}

/** Swivel chair, blue seat and tall back; it faces +z. */
export function silla(): THREE.Group {
  return grupo(
    "silla",
    cilindro(0.28, 0.05, OSCURO, [0, 0.03, 0], "Chair_Foot", [0, 0, 0], 8),
    cilindro(0.04, 0.4, GRIS, [0, 0.25, 0], "Chair_Post", [0, 0, 0], 6),
    caja(0.52, 0.09, 0.5, AZUL, [0, 0.48, 0], "Chair_Seat"),
    caja(0.52, 0.62, 0.08, AZUL, [0, 0.84, -0.22], "Chair_Back"),
    caja(0.06, 0.06, 0.4, BLANCO, [-0.27, 0.66, 0], "Chair_Arm"),
    caja(0.06, 0.06, 0.4, BLANCO, [0.27, 0.66, 0], "Chair_Arm"),
  );
}

/** First aid box for a wall: back on z = 0, at 1.1 m, red with a white cross. */
export function botiquin(): THREE.Group {
  return grupo(
    "botiquin",
    caja(0.5, 0.4, 0.18, ROJO, [0, 1.1, 0.09], "Aid_Box"),
    caja(0.22, 0.06, 0.02, BLANCO, [0, 1.1, 0.19], "Aid_CrossH"),
    caja(0.06, 0.22, 0.02, BLANCO, [0, 1.1, 0.19], "Aid_CrossV"),
  );
}

/** Operations console, 2.4 m wide: white desk, keyboard, raised panel with four screens. */
export function consolaPantallas(): THREE.Group {
  const pantallas = [-0.84, -0.28, 0.28, 0.84].flatMap((x, i) => [
    caja(0.5, 0.38, 0.03, VISOR, [x, 1.08, -0.21], `Console_Frame_${i}`),
    caja(0.44, 0.32, 0.01, PANTALLA, [x, 1.08, -0.19], `Console_Screen_${i}`),
  ]);
  return grupo(
    "consolaPantallas",
    caja(2.4, 0.75, 0.7, BLANCO, [0, 0.375, 0], "Console_Desk"),
    caja(2.44, 0.04, 0.74, GRIS, [0, 0.77, 0], "Console_Top"),
    caja(2.0, 0.03, 0.24, OSCURO, [0, 0.8, 0.12], "Console_Keys"),
    caja(2.4, 0.6, 0.12, BLANCO, [0, 1.08, -0.29], "Console_Panel"),
    caja(2.4, 0.04, 0.02, AZUL, [0, 1.36, -0.22], "Console_Light"),
    ...pantallas,
  );
}

/** Fire extinguisher on its wall bracket: back on z = -0.12, 0.6 m tall, base at the origin. */
export function matafuego(): THREE.Group {
  return grupo(
    "matafuego",
    caja(0.16, 0.36, 0.03, GRIS, [0, 0.3, -0.11], "Ext_Bracket"),
    cilindro(0.09, 0.46, ROJO, [0, 0.23, 0], "Ext_Body", [0, 0, 0], 10),
    cilindro(0.05, 0.08, OSCURO, [0, 0.5, 0], "Ext_Valve", [0, 0, 0], 8),
    caja(0.14, 0.03, 0.04, OSCURO, [0.03, 0.56, 0], "Ext_Handle"),
    caja(0.025, 0.36, 0.025, OSCURO, [0.1, 0.3, 0.03], "Ext_Hose"),
  );
}
