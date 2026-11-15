import type { Expresion } from "./cabeza.js";
import { HUESOS, type Personaje } from "./personaje.js";

/**
 * Gestos de la tripulación (DISEÑO §4.3). Cada gesto es una función pura del tiempo: no guarda
 * estado, así que se puede saltar a cualquier instante (capturas, pruebas) y mezclar con `peso`.
 *
 * Ejes en reposo: los brazos cuelgan hacia -Y. Girar en X negativo los lleva al frente; en el
 * brazo derecho, Z negativo lo abre hacia fuera (en el izquierdo, Z positivo).
 */

export type Gesto =
  | "reposo"
  | "caminar"
  | "saludar"
  | "hablar"
  | "escuchar"
  | "explicar"
  | "inspeccionar"
  | "arrodillarse"
  | "confirmar"
  | "tranquilizar"
  | "reparar"
  | "observar"
  | "alertar"
  | "verificar";

export const GESTOS: Gesto[] = [
  "reposo",
  "caminar",
  "saludar",
  "hablar",
  "escuchar",
  "explicar",
  "inspeccionar",
  "arrodillarse",
  "confirmar",
  "tranquilizar",
  "reparar",
  "observar",
  "alertar",
  "verificar",
];

export interface OpcionesGesto {
  /** Sin vaivenes ni rebotes: deja la pose clave quieta (prefers-reduced-motion). */
  quieto?: boolean | undefined;
  /** Expresión base cuando el gesto no impone una. */
  expresion?: Expresion | undefined;
}

const HABLA: Expresion[] = ["hablaCerrada", "hablaAbierta", "hablaRedonda", "hablaAbierta", "hablaCerrada", "hablaRedonda"];

/** Parpadeo breve cada pocos segundos, desfasado por personaje para que no parpadeen a la vez. */
function parpadea(t: number, desfase: number): boolean {
  const ciclo = (t + desfase) % 3.7;
  return ciclo > 3.56;
}

export function animar(pj: Personaje, gesto: Gesto, t: number, o: OpcionesGesto = {}): void {
  const h = pj.huesos;
  if(o.quieto)t=0;
  const original=gesto;
  if(gesto==="reparar"||gesto==="alertar")gesto="arrodillarse";
  if(gesto==="verificar")gesto="inspeccionar";
  for(const n of ["tableta","llave","catalejo"] as const)h[n].scale.setScalar(0);
  if(original==="reparar"&&pj.id==="ingeniera")h.llave.scale.setScalar(1);
  else if(original==="observar"&&pj.id==="meteorologa")h.catalejo.scale.setScalar(1);
  else if(gesto==="inspeccionar")h.tableta.scale.setScalar(1);
  for (const n of HUESOS) h[n].rotation.set(0, 0, 0);
  h.pelvis.position.y = pj.reposoPelvis;

  const vivo = o.quieto ? 0 : 1;
  const desfase = pj.id.length * 0.83;
  const respira = Math.sin(t * 1.7 + desfase) * vivo;
  let expresion: Expresion = o.expresion ?? "neutral";

  // Base viva común: respiración y brazos que no cuelgan rígidos.
  h.torso.rotation.x = respira * 0.012;
  h.brazoI.rotation.z = 0.02 + respira * 0.012;
  h.brazoD.rotation.z = -0.02 - respira * 0.012;
  h.cabeza.rotation.y = Math.sin(t * 0.45 + desfase) * 0.07 * vivo;

  switch (gesto) {
    case "observar":
      h.brazoD.rotation.x=-1.25;h.antebrazoD.rotation.x=-0.35;
      h.brazoI.rotation.x=-0.8;h.antebrazoI.rotation.x=-0.8;
      h.cabeza.rotation.x=-0.05;expresion="pensando";break;
    case "reposo":
      break;

    case "caminar": {
      const f = t * 6.2;
      const paso = Math.sin(f);
      // El muslo va al frente con X negativo; la rodilla flexiona mientras la pierna pasa hacia delante.
      h.musloI.rotation.x = -paso * 0.4;
      h.musloD.rotation.x = paso * 0.4;
      h.espinillaI.rotation.x = Math.max(0, Math.cos(f)) * 0.7 + 0.04;
      h.espinillaD.rotation.x = Math.max(0, -Math.cos(f)) * 0.7 + 0.04;
      h.pieI.rotation.x = Math.max(0, paso) * -0.22;
      h.pieD.rotation.x = Math.max(0, -paso) * -0.22;
      // Brazos en contrafase con las piernas.
      h.brazoI.rotation.x = paso * 0.42;
      h.brazoD.rotation.x = -paso * 0.42;
      h.antebrazoI.rotation.x = -0.28 - Math.max(0, -paso) * 0.25;
      h.antebrazoD.rotation.x = -0.28 - Math.max(0, paso) * 0.25;
      h.torso.rotation.y = paso * 0.07;
      h.torso.rotation.x = 0.05;
      h.cabeza.rotation.y = -paso * 0.04;
      h.pelvis.position.y = pj.reposoPelvis + Math.abs(Math.cos(f)) * 0.008 - 0.004;
      break;
    }

    case "saludar": {
      const vaiven = Math.sin(t * 7.5) * 0.3 * vivo;
      h.brazoD.rotation.z = -1.3;
      h.antebrazoD.rotation.z = -1.25 + vaiven;
      h.manoD.rotation.z = vaiven * 0.5;
      h.cabeza.rotation.z = -0.07;
      h.torso.rotation.z = -0.02;
      expresion = "feliz";
      break;
    }

    case "hablar": {
      const ritmo = Math.sin(t * 3.1);
      h.brazoI.rotation.set(-0.3, 0, 0.22);
      h.antebrazoI.rotation.x = -1.0 + ritmo * 0.16 * vivo;
      h.brazoD.rotation.x = -0.12;
      h.antebrazoD.rotation.x = -0.5;
      h.cabeza.rotation.x = Math.sin(t * 2.3) * 0.04 * vivo;
      expresion = o.quieto ? "hablaAbierta" : HABLA[Math.floor(t * 7) % HABLA.length]!;
      break;
    }

    case "escuchar": {
      h.cabeza.rotation.z = 0.1;
      h.cabeza.rotation.x = 0.05 + Math.max(0, Math.sin(t * 1.4)) * 0.06 * vivo;
      h.brazoI.rotation.x = -0.2;
      h.antebrazoI.rotation.set(-1.25, 0, -0.5);
      h.brazoD.rotation.x = -0.18;
      h.antebrazoD.rotation.set(-1.2, 0, 0.5);
      break;
    }

    case "explicar": {
      const senala = Math.sin(t * 2.2) * 0.06 * vivo;
      h.brazoI.rotation.set(-0.85 + senala, 0, 0.3);
      h.antebrazoI.rotation.x = -0.35;
      h.manoI.rotation.x = -0.2;
      h.brazoD.rotation.x = -0.2;
      h.antebrazoD.rotation.set(-1.2, 0, 0.35);
      h.cabeza.rotation.y = 0.22;
      h.torso.rotation.y = 0.1;
      expresion = o.quieto ? "hablaAbierta" : HABLA[Math.floor(t * 5) % HABLA.length]!;
      break;
    }

    case "inspeccionar": {
      h.brazoI.rotation.set(-0.42, 0, -0.1);
      h.antebrazoI.rotation.set(-1.3, 0, -0.32);
      h.brazoD.rotation.set(-0.42, 0, 0.1);
      h.antebrazoD.rotation.set(-1.3, 0, 0.32);
      h.cabeza.rotation.x = 0.26 + Math.sin(t * 1.1) * 0.03 * vivo;
      h.cabeza.rotation.y = 0;
      h.torso.rotation.x = 0.06;
      expresion = "pensando";
      break;
    }

    case "arrodillarse": {
      // Rodilla derecha al suelo, pierna izquierda adelantada. La pelvis baja lo que mide el muslo.
      const p = pj.proporciones;
      const muslo = p.cadera[1] - p.articulacionRodilla[1];
      const espinilla = p.articulacionRodilla[1] - p.tobillo[1];
      h.pelvis.position.y = pj.reposoPelvis - (p.cadera[1] - muslo - 0.035);
      h.musloD.rotation.x = 0.12;
      h.espinillaD.rotation.x = 1.45;
      h.pieD.rotation.x = 0.55;
      // La pierna de delante sube la rodilla lo justo para que la espinilla quede vertical y el pie apoye.
      const alturaCadera = muslo + 0.035;
      const sube = Math.asin(Math.max(-1, Math.min(1, (espinilla + p.tobillo[1] - alturaCadera) / muslo)));
      h.musloI.rotation.x = -(Math.PI / 2 + sube);
      h.espinillaI.rotation.x = Math.PI / 2 + sube;
      h.torso.rotation.x = 0.16;
      h.brazoD.rotation.x = -0.75 + Math.sin(t * 5) * 0.06 * vivo;
      h.antebrazoD.rotation.x = -0.75;
      h.brazoI.rotation.x = -0.35;
      h.antebrazoI.rotation.x = -0.9;
      h.cabeza.rotation.x = 0.16;
      h.cabeza.rotation.y = 0;
      expresion = "pensando";
      break;
    }

    case "confirmar": {
      h.brazoD.rotation.set(-0.35, 0, -0.35);
      h.antebrazoD.rotation.set(-1.75, 0, 0);
      h.manoD.rotation.z = 0.3;
      h.cabeza.rotation.z = -0.05;
      h.pelvis.position.y = pj.reposoPelvis + Math.max(0, Math.sin(t * 4)) * 0.004 * vivo;
      expresion = "feliz";
      break;
    }

    case "tranquilizar": {
      h.brazoI.rotation.set(-0.55, 0, 0.5);
      h.antebrazoI.rotation.set(-0.7, 0, 0);
      h.manoI.rotation.x = -0.35;
      h.brazoD.rotation.x = -0.25;
      h.antebrazoD.rotation.set(-1.35, 0, 0.6);
      h.cabeza.rotation.z = 0.06;
      expresion = "feliz";
      break;
    }
  }

  const impuesta = expresion !== "neutral" && expresion !== (o.expresion ?? "neutral");
  if (!o.quieto && !impuesta && parpadea(t, desfase)) expresion = "parpadeo";
  else if (!o.quieto && expresion === "feliz" && parpadea(t, desfase + 1.3)) expresion = "parpadeo";
  pj.expresion(expresion);
}
