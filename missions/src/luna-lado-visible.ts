import type { BaseAction, Equipment, Expert } from "@solar-shield/contracts";
import type { Mision } from "./jezero.js";

/**
 * Misión Luna, lado visible: "la noche larga". Solo datos; la lógica vive en engine/.
 * PROPUESTA para diseño (Camilo): sale de docs/ideas/mision-luna-lado-visible.md (rama
 * feat/datos-mision-luna-lado-visible, datos). Los costos son valores de juego de esa propuesta.
 *
 * La idea: la tormenta real de mayo de 2024 (Gannon) llegó cuando los 3 sitios Apolo estaban de
 * noche (NASA SVS 5187, PR #147). La Tierra está a ~1 tick, pero cada llamada gasta una batería
 * que no se recarga hasta el amanecer.
 *
 * HUECOS DEL TIPO `Mision` (no se cambió jezero.ts; se documentan para diseño y motor):
 * 1. `eventoPolvo` es obligatorio y está fijado a polvo sobre el panel. En la Luna casi no hay
 *    atmósfera: una tormenta de polvo sería un error de ciencia. Por eso esta constante es
 *    `Omit<Mision, "eventoPolvo">` y la mala suerte (antena averiada) va en AVERIA_ANTENA_LUNA_VISIBLE.
 * 2. No hay campo para "de noche el panel no da energía hasta el amanecer" (propuesta §2: `amanecerTick`).
 *    Hasta que motor/diseño lo definan, la noche no está modelada en datos.
 * 3. `fin.exitoCuando` solo admite "telemetria_llega"; la propuesta gana "al amanecer (paso 8)".
 * 4. `TarjetaCiencia.fuenteKey` admite una sola fuente; "una tormenta, tres lugares" necesita
 *    DONKI (Kp en la Tierra) + CRaTER + RAD. Se cita RadLab (CRaTER y RAD) y falta DONKI.
 * 5. No hay campo para el aviso "datos reales curados, no en vivo" de la tormenta: va en
 *    TEXTOS_LUNA_VISIBLE como `mision.lunaVisible.tormenta.aviso` para que ui lo use.
 */

/** Mala suerte del paso 4b (propuesta §7): se avería la antena. Avería de juego, sin cifra de NASA. */
export interface AveriaAntena {
  equipo: Extract<Equipment, "antena">;
  /** Mientras esté averiada, enviar_telemetria no responde (lo implementa motor). */
  bloquea: Extract<BaseAction["tipo"], "enviar_telemetria">;
  /** Formas de arreglarla: las dos tienen costo (COSTOS_ACCION de diseño). */
  arreglos: BaseAction[];
  enSemillaDorada: false;
  experto: Expert;
  textoKey: string;
}

export const AVERIA_ANTENA_LUNA_VISIBLE: AveriaAntena = {
  equipo: "antena",
  bloquea: "enviar_telemetria",
  arreglos: [
    { tipo: "salida_exterior", objetivo: "antena" },
    { tipo: "reparar", equipo: "antena" },
  ],
  enSemillaDorada: false,
  experto: "ingeniera",
  textoKey: "mision.lunaVisible.malaSuerte.antena",
};

/**
 * Fuentes citadas que todavía no están en data/i18n de develop (dependencias del PR):
 * - fuente.svs: PR #147 (luz del Sol en los sitios Apolo, NASA SVS 5187).
 */
export const FUENTES_PENDIENTES_LUNA_VISIBLE: readonly string[] = ["fuente.svs"];

export const MISION_LUNA_VISIBLE: Omit<Mision, "eventoPolvo"> = {
  id: "luna-lado-visible",
  nombreKey: "mision.lunaVisible.nombre",
  sitio: "luna_lado_visible",
  objetivo: "reportar_tierra",
  // POR DECIDIR (diseño): la propuesta no fija dificultad; se deja la de Jezero.
  dificultad: "media",
  // Ya curada: data/curated/2024-05-10-gannon.json (DONKI).
  tormentaId: "2024-05-10-gannon",
  averiaInicial: "ia_base",
  // Sin invernadero: 14 días sin luz (propuesta §4; plantas con lámparas = NO VERIFICADO).
  modulosDisponibles: ["bateria", "panel_solar", "escudo", "antena", "reciclador_agua"],
  modulosAColocar: 2,
  // Valor de juego: el mismo tick de Jezero (la propuesta no da otro).
  tickTormenta: 3,
  pasos: [
    { n: 1, tituloKey: "mision.lunaVisible.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.lunaVisible.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.lunaVisible.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.lunaVisible.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.lunaVisible.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.lunaVisible.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.lunaVisible.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.lunaVisible.paso8", meta: "fin" },
  ],
  // data/terreno/luna-visible/luna-visible.json (Moon Trek, en develop).
  terrenoId: "luna-visible",
  /*
   * Costos de la propuesta §3 (valores de juego). Ningún sitio domina:
   * - llanura-tranquilidad: plano y amanece primero, pero campo abierto (pierde blindaje).
   * - tierras-altas-descartes: término medio; la Tierra casi encima (+ soporte vital con retraso).
   * - borde-rima-hadley: aterrizaje caro, amanece de último, pero las montañas tapan cielo.
   * Diferencia con Jezero: ningún sitio devuelve energía con retraso, porque es de noche en todos.
   */
  sitiosCandidatos: [
    {
      id: "llanura-tranquilidad",
      aterrizaje: { inmediato: { energia: -3, blindaje: -8 }, retrasado: {} },
      porQueKey: "mision.lunaVisible.sitio.llanura-tranquilidad.porque",
    },
    {
      id: "tierras-altas-descartes",
      aterrizaje: { inmediato: { energia: -6, blindaje: -4 }, retrasado: { soporte_vital: 2 } },
      porQueKey: "mision.lunaVisible.sitio.tierras-altas-descartes.porque",
    },
    {
      id: "borde-rima-hadley",
      aterrizaje: { inmediato: { energia: -10, soporte_vital: -2 }, retrasado: { blindaje: 6 } },
      porQueKey: "mision.lunaVisible.sitio.borde-rima-hadley.porque",
    },
  ],
  // Como en Jezero (propuesta §6): Iris lee el blindaje 20 puntos mal; el medidor real se ve.
  averiaIris: {
    equipo: "ia_base",
    pasoRevelacion: 6,
    errorLectura: 20,
    recursoMalLeido: "blindaje",
    reparaCon: "ingeniera",
  },
  // Hueco 3: la propuesta gana al amanecer (paso 8); el tipo solo admite la llegada de la telemetría.
  fin: {
    exitoCuando: "telemetria_llega",
    falloCuando: "recurso_en_cero",
    tickLimite: 10,
  },
  // Dilema de la batería (propuesta §6). Los costos de cada acción viven en COSTOS_ACCION (diseño).
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.lunaVisible.dilema.pregunta",
    opciones: [
      // Cuesta soporte vital y algo de energía (refugiarse).
      { id: "refugio", accion: { tipo: "refugiarse" }, defiende: "doctora", textoKey: "mision.lunaVisible.dilema.refugio" },
      // Cuesta mucha energía de una batería que no se recarga esta noche.
      { id: "subir_escudo", accion: { tipo: "subir_escudo", nivel: 2 }, defiende: "doctora", textoKey: "mision.lunaVisible.dilema.escudo" },
      // Cuesta blindaje: la tormenta sigue golpeando la base.
      { id: "ahorrar_bateria", accion: { tipo: "esperar" }, defiende: "ingeniera", textoKey: "mision.lunaVisible.dilema.ahorrar" },
      // Cuesta energía ya (enviar_telemetria); la respuesta llega en 1 tick. Nadie la recomienda.
      { id: "preguntar_tierra", accion: { tipo: "enviar_telemetria" }, defiende: null, textoKey: "mision.lunaVisible.dilema.tierra" },
    ],
  },
  tarjetasCiencia: [
    // CRaTER (LRO) en órbita, no en el suelo: ×206 con fondo tranquilo. Dato en data/ciencia/luna.json (PR #95, abierto).
    { id: "tormenta_orbita_lunar", textoKey: "mision.lunaVisible.tormenta.crater", fuenteKey: "fuente.radlab" },
    // Hueco 4: Kp 9 viene de DONKI y Marte ×1,0 de RAD; el tipo solo deja citar una fuente.
    { id: "tres_lugares", textoKey: "mision.lunaVisible.ciencia.tresLugares", fuenteKey: "fuente.radlab" },
    // Hora del amanecer: cálculo del equipo sobre NASA SVS 5187 (PR #147, horizonte plano).
    { id: "noche_en_tormenta", textoKey: "mision.lunaVisible.ciencia.nocheTormenta", fuenteKey: "fuente.svs" },
    { id: "sitio_terreno", textoKey: "mision.lunaVisible.ciencia.terreno", fuenteKey: "fuente.moonTrek" },
    // POR VERIFICAR: NSSDC Moon fact sheet; falta `fuente.nssdcMoon` en data (fuente.nssdc es la de Marte). Oculta.
    { id: "noche_larga", modulo: "bateria", textoKey: "mision.lunaVisible.ciencia.noche", fuenteKey: null },
    // POR VERIFICAR: 1361,0 W/m² (NSSDC Moon). Oculta hasta que exista `fuente.nssdcMoon`.
    { id: "luz_del_sol", modulo: "panel_solar", textoKey: "mision.lunaVisible.ciencia.panel", fuenteKey: null },
    // Zhang et al. 2020 (Chang'e-4, CNSA, no NASA): las bases bajo regolito tienen más blindaje.
    { id: "escudo_regolito", modulo: "escudo", textoKey: "mision.lunaVisible.ciencia.regolito", fuenteKey: "fuente.dosis.lunaIss" },
    // POR VERIFICAR: ≈1,3 s = 384 400 km (NSSDC Moon) / c. Oculta hasta que exista `fuente.nssdcMoon`.
    { id: "mensajes_rapidos", modulo: "antena", textoKey: "mision.lunaVisible.ciencia.antena", fuenteKey: null },
    // Misma fuente que la tarjeta de Jezero (sin cifra).
    { id: "agua_reciclada", modulo: "reciclador_agua", textoKey: "mision.lunaVisible.ciencia.reciclador", fuenteKey: "fuente.nasa.agua" },
  ],
  preguntaFinal: {
    preguntaKey: "mision.lunaVisible.pregunta",
    opcionesKeys: ["mision.lunaVisible.pregunta.a", "mision.lunaVisible.pregunta.b", "mision.lunaVisible.pregunta.c"],
    correcta: 0,
    explicacionKey: "mision.lunaVisible.pregunta.explicacion",
    // POR VERIFICAR: el 1,3 s sale de NSSDC Moon (falta `fuente.nssdcMoon`); el 3–22 min, de fuente.nssdc (Marte).
    fuenteKey: null,
  },
};
