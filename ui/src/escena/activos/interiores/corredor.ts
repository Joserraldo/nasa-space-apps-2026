/**
 * Interior: corredor de conexión (D5), como la lámina `exterior/01-corredores-conexiones.png`.
 * Sección octogonal con costillas, piso índigo con baldosas octogonales y luces guía, tiras cian en el
 * techo, rejillas en los paneles bajos, ventana al invernadero (izquierda), puerta lateral (derecha) y
 * puerta doble al fondo. Cada sala es su propia vista: aquí solo la geometría, la zona caminable y el punto
 * de entrada; la escena, la cámara y las puertas las conecta el frente A (A8). No toca recursos.
 *
 * Ejes: el corredor va a lo largo de z, de z = 0 (puerta del fondo) a z = `largo` (entrada); piso en y = 0.
 */
import * as THREE from "three";
import { geometriaBase, type Materiales } from "../../materiales";
import { caja, grupo, parte } from "../piezasComunes";
import { tinte } from "./comun";


/** Medidas interiores del corredor (m). [E] proporciones de la lámina. */
/** `chaflanBajo`: paneles bajos cortos, como en la lámina, para que el piso plano sea ancho. */
export const CORREDOR_INTERIOR = { ancho: 3.2, alto: 2.8, chaflan: 0.8, chaflanBajo: 0.45, largo: 12, paso: 2, grosor: 0.16 } as const;

/** Zona donde se puede caminar (rectángulo en x–z) y punto de entrada mirando al fondo (-z). */
export function zonaCorredor(largo: number = CORREDOR_INTERIOR.largo) {
  return {
    caminable: { x0: -0.85, x1: 0.85, z0: 0.7, z1: largo - 0.4 },
    entrada: { x: 0, z: largo - 1, rumbo: Math.PI },
  } as const;
}

/** Vértices del octógono interior (sentido antihorario visto desde +z), piso en y = 0. */
export function octogonoInterior(): [number, number][] {
  const { ancho: w, alto: h, chaflan: c, chaflanBajo: b } = CORREDOR_INTERIOR;
  const x = w / 2;
  return [[-x + b, 0], [x - b, 0], [x, b], [x, h - c], [x - c, h], [-x + c, h], [-x, h - c], [-x, b]];
}

/** Las 8 caras de la sección: grupo colocado en el centro de cada lado, con x local a lo largo del lado
 * y la normal local +y apuntando hacia adentro del corredor. */
function caras(): { pos: [number, number]; giro: number; largo: number; nombre: string }[] {
  const nombres = ["Floor", "LowR", "WallR", "HighR", "Ceiling", "HighL", "WallL", "LowL"];
  const p = octogonoInterior();
  return p.map(([x1, y1], i) => {
    const [x2, y2] = p[(i + 1) % p.length]!;
    return { pos: [(x1 + x2) / 2, (y1 + y2) / 2], giro: Math.atan2(y2 - y1, x2 - x1), largo: Math.hypot(x2 - x1, y2 - y1), nombre: nombres[i]! };
  });
}

/** Puerta doble cerrada en el plano local x–y, frente hacia +z local: marco, hojas malva y franjas cian. */
function puerta(m: Materiales, nombre: string): THREE.Group {
  return grupo(
    nombre,
    parte(m, "SuitBase", caja(0.2, 2.2, 0.12), [-0.75, 1.1, 0.06], `${nombre}_JambL`),
    parte(m, "SuitBase", caja(0.2, 2.2, 0.12), [0.75, 1.1, 0.06], `${nombre}_JambR`),
    parte(m, "SuitBase", caja(1.7, 0.22, 0.12), [0, 2.2, 0.06], `${nombre}_Lintel`),
    parte(m, "Rock", tinte("hoja", caja(1.3, 2.05, 0.05), "indigo-botas", "lila", 0.4), [0, 1.03, 0.03], `${nombre}_Leaf`),
    parte(m, "SuitBase", caja(0.04, 2.05, 0.07), [0, 1.03, 0.04], `${nombre}_Seam`),
    parte(m, "Emissive", caja(0.1, 0.6, 0.03), [-0.98, 1.3, 0.08], `${nombre}_StripL`),
    parte(m, "Emissive", caja(0.1, 0.6, 0.03), [0.98, 1.3, 0.08], `${nombre}_StripR`),
    parte(m, "Emissive", caja(0.6, 0.08, 0.03), [0, 2.42, 0.08], `${nombre}_StripTop`),
  );
}

/** Corredor de conexión completo (sin fusionar: `armado` o la vista de la sala lo fusionan por material). */
export function crearCorredorInterior(m: Materiales, largo: number = CORREDOR_INTERIOR.largo): THREE.Group {
  const { grosor: g, paso, alto } = CORREDOR_INTERIOR;
  const raiz = grupo("Interior_Corridor");
  const zm = largo / 2;
  // Bahía de la ventana (izquierda) y de la puerta lateral (derecha), a 4 m de la entrada.
  const bahia = { z0: largo - 5.4, z1: largo - 3.4 };

  for (const c of caras()) {
    const cara = grupo(`Corridor_${c.nombre}`);
    cara.position.set(c.pos[0], c.pos[1], 0);
    cara.rotation.z = c.giro;
    const panel = (z0: number, z1: number) => {
      const geo = caja(c.largo + 0.02, g, z1 - z0);
      const p = c.nombre === "Floor"
        ? parte(m, "Rock", tinte("piso", geo, "indigo-botas", "roca-basalto", 0.35), [0, -g / 2, (z0 + z1) / 2], "Corridor_FloorSlab")
        : parte(m, "SuitBase", geo, [0, -g / 2, (z0 + z1) / 2], `Corridor_${c.nombre}Panel`);
      cara.add(p);
    };
    if (c.nombre === "WallL" || c.nombre === "WallR" || c.nombre === "LowR") {
      // Hueco de la ventana al invernadero (izquierda) y del nicho de la puerta lateral (derecha).
      panel(0, bahia.z0);
      panel(bahia.z1, largo);
    } else panel(0, largo);
    // Rejillas oscuras en los paneles bajos (lámina: ranuras en el zócalo).
    if (c.nombre === "LowL" || c.nombre === "LowR") {
      for (let z = 0.8; z < largo - 0.4; z += 0.32) {
        if (c.nombre === "LowR" && z > bahia.z0 - 0.1 && z < bahia.z1 + 0.1) continue;
        cara.add(parte(m, "Boots", caja(0.34, 0.02, 0.09), [0.12, 0.01, z], "Corridor_Vent"));
      }
    }
    // Paneles de luz cálida en el techo.
    if (c.nombre === "Ceiling") {
      for (let z = 1; z < largo; z += paso) cara.add(parte(m, "Rock", tinte("luz-techo", caja(1.0, 0.03, 0.5), "marfil", "ambar", 0.35), [0, 0.015, z], "Corridor_CeilingLight"));
    }
    raiz.add(cara);
  }

  // Tiras cian en las dos juntas del techo, de punta a punta.
  const [, , , , techoR, techoL] = octogonoInterior();
  for (const [x, y] of [techoR!, techoL!]) raiz.add(parte(m, "Emissive", caja(0.08, 0.08, largo - 0.2), [x * 0.97, y - 0.06, zm], "Corridor_CyanStrip"));

  // Costillas cada `paso` m: marco octogonal un poco hacia adentro de las paredes.
  const anillo = geometriaBase("int-corredor-costilla", () => {
    const fuera = octogonoInterior().map(([x, y]) => new THREE.Vector2(x * 1.04, y * 1.02 - 0.05));
    const dentro = octogonoInterior().map(([x, y]) => new THREE.Vector2(x * 0.93, y * 0.95 + 0.07)).reverse();
    const s = new THREE.Shape(fuera);
    s.holes.push(new THREE.Path(dentro));
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: false });
    geo.translate(0, 0, -0.11);
    return geo;
  });
  for (let z = paso; z < largo - 0.5; z += paso) {
    if (z > bahia.z0 - 0.2 && z < bahia.z1 + 0.2) continue;
    raiz.add(parte(m, "SuitBase", anillo, [0, 0, z], "Corridor_Rib"));
  }

  // Piso: baldosas octogonales claras a los lados y luces guía ámbar al centro.
  const baldosa = tinte("baldosa", geometriaBase("int-baldosa", () => new THREE.CircleGeometry(0.32, 8).rotateX(-Math.PI / 2)), "indigo-botas", "lila", 0.45);
  const guia = tinte("guia", caja(0.34, 0.02, 0.2), "ambar", "marfil", 0.35);
  for (let z = 1; z < largo - 0.3; z += 1.6) for (const x of [-0.95, 0.95]) raiz.add(parte(m, "Rock", baldosa, [x, 0.004, z], "Corridor_Tile"));
  for (let z = 0.9; z < largo - 0.5; z += 1.2) raiz.add(parte(m, "Rock", guia, [0, 0.01, z], "Corridor_GuideLight"));

  // Fondo: tapa del corredor con la puerta doble.
  const tapa = geometriaBase("int-corredor-tapa", () => new THREE.ShapeGeometry(new THREE.Shape(octogonoInterior().map(([x, y]) => new THREE.Vector2(x, y)))));
  raiz.add(parte(m, "SuitBase", tapa, [0, 0, 0], "Corridor_EndWall"));
  const fondo = puerta(m, "Corridor_EndDoor");
  fondo.position.set(0, 0, 0.01);
  raiz.add(fondo);

  // Puerta lateral derecha (al taller o al hábitat: la elige A8), al fondo de un nicho de 0,6 m, mirando a -x.
  const xn = CORREDOR_INTERIOR.ancho / 2, fondoNicho = 0.6, altoNicho = alto - CORREDOR_INTERIOR.chaflan;
  const zn = (bahia.z0 + bahia.z1) / 2, ln = bahia.z1 - bahia.z0;
  const anchoNicho = fondoNicho + CORREDOR_INTERIOR.chaflanBajo;
  // Lados del nicho: solo lo que queda fuera del perfil del corredor (bajo el panel bajo y la pared quitados).
  const ladoNicho = geometriaBase("int-corredor-lado-nicho", () => {
    const xc = xn - CORREDOR_INTERIOR.chaflanBajo, xf = xn + fondoNicho;
    const forma = new THREE.Shape([[xc, 0], [xf, 0], [xf, altoNicho], [xn, altoNicho], [xn, CORREDOR_INTERIOR.chaflanBajo]].map(([x, y]) => new THREE.Vector2(x, y)));
    return new THREE.ExtrudeGeometry(forma, { depth: g, bevelEnabled: false });
  });
  raiz.add(
    parte(m, "Rock", tinte("piso", caja(anchoNicho, g, ln), "indigo-botas", "roca-basalto", 0.35), [xn - CORREDOR_INTERIOR.chaflanBajo + anchoNicho / 2, -g / 2, zn], "Corridor_NicheFloor"),
    parte(m, "SuitBase", ladoNicho, [0, 0, bahia.z0 - g], "Corridor_NicheWallA"),
    parte(m, "SuitBase", ladoNicho, [0, 0, bahia.z1], "Corridor_NicheWallB"),
    parte(m, "SuitBase", caja(fondoNicho + 0.02, g, ln), [xn + fondoNicho / 2, altoNicho + g / 2, zn], "Corridor_NicheCeiling"),
    parte(m, "SuitBase", caja(g, altoNicho, ln), [xn + fondoNicho + g / 2, altoNicho / 2, zn], "Corridor_NicheBack"),
  );
  const lateral = puerta(m, "Corridor_SideDoor");
  lateral.position.set(xn + fondoNicho - 0.01, 0, zn);
  lateral.rotation.y = -Math.PI / 2;
  lateral.scale.setScalar(0.82);
  raiz.add(lateral);

  // Ventana al invernadero: marco, vidrio y, detrás, jardineras con cultivos (solo dentro del invernadero).
  const xv = -CORREDOR_INTERIOR.ancho / 2;
  const zv = (bahia.z0 + bahia.z1) / 2, lv = bahia.z1 - bahia.z0;
  const { chaflan, chaflanBajo } = CORREDOR_INTERIOR;
  raiz.add(
    parte(m, "SuitBase", caja(0.22, 0.16, lv + 0.2), [xv - 0.02, chaflanBajo + 0.35, zv], "Corridor_WindowSill"),
    parte(m, "SuitBase", caja(0.22, 0.16, lv + 0.2), [xv - 0.02, alto - chaflan, zv], "Corridor_WindowHead"),
    parte(m, "Glass", caja(0.03, alto - chaflan - chaflanBajo - 0.35, lv), [xv - 0.05, (alto - chaflan + chaflanBajo + 0.35) / 2, zv], "Corridor_WindowGlass"),
    // Antepecho bajo la ventana, para cerrar el hueco entre el panel bajo y el alféizar.
    parte(m, "SuitBase", caja(g, 0.35, lv), [xv - g / 2, chaflanBajo + 0.175, zv], "Corridor_WindowApron"),
    parte(m, "SuitBase", caja(0.2, 0.05, lv + 3), [xv - 2, -0.02, zv], "Greenhouse_Floor"),
    parte(m, "SuitBase", caja(0.2, 3.2, lv + 3), [xv - 3.6, 1.6, zv], "Greenhouse_BackWall"),
  );
  const hoja = geometriaBase("int-cultivo", () => new THREE.IcosahedronGeometry(0.28, 0));
  for (const dz of [-0.6, 0.6]) {
    raiz.add(parte(m, "SuitBase", caja(0.9, 0.6, 1.0), [xv - 1.4, 0.3, zv + dz], "Greenhouse_Planter"));
    for (const k of [-0.25, 0.25]) {
      const h = parte(m, "Plant", hoja, [xv - 1.4 + k, 0.82, zv + dz], "Greenhouse_Crop");
      h.scale.set(1, 1.3, 1);
      raiz.add(h);
    }
  }
  return raiz;
}
