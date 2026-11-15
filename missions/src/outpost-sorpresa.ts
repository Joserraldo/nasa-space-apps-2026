import type { Mision } from "./jezero.js";

/**
 * Misión "outpost sorpresa" (PLAN §2.5): la sorpresa es que no hay suelo. El puesto avanzado es una
 * nave en el espacio profundo, camino a la Luna. Solo datos; la lógica vive en engine/.
 * Propuesta de datos: docs/ideas/mision-outpost-sorpresa.md (rama feat/datos-mision-outpost-sorpresa, #99).
 * Voces: agents/src/voces-outpost.ts (rama feat/agentes-voces-outpost-sorpresa).
 *
 * Todos los costos y beneficios de este archivo son VALORES DE JUEGO (0-100), no datos de NASA.
 * Los que no salen de la propuesta están marcados "POR AJUSTAR (diseño)".
 *
 * Huecos del tipo `Mision` (no se cambió el tipo; se anotan para que diseño y motor decidan):
 * 1. `PasoMision.meta` solo tiene las metas de Jezero. El paso 1 (la sorpresa) y el 2 (orientar la nave)
 *    reutilizan "satelite_suelto" y "ruta_dibujada": ui tiene que dibujarlos distinto.
 * 2. `SitioCandidato.id` apunta a data/terreno/<terrenoId>/; la nave no tiene terreno. Las 3 zonas
 *    (cabina, centro, fondo) son valores de juego y `terrenoId` nombra una carpeta que NO existe.
 *    Motor debe aceptar `sitio_elegido` sin terreno (propuesta §10).
 * 3. `EventoPolvo.descripcionKey` es el literal "mala_suerte.tormenta_polvo". El micrometeorito (§7)
 *    usa la misma mecánica (panel a la mitad, salida exterior), pero la causa que escribe el motor
 *    diría "tormenta de polvo". Hace falta un evento de mala suerte genérico con
 *    `descripcionKey: "mala_suerte.micrometeorito"` (esa clave ya existe en design/i18n).
 * 4. `OpcionDilema.extraSiTiene` solo mira módulos, no la zona: "refugiarse cuesta más en la cabina"
 *    (§6) no se puede expresar.
 * 5. No hay forma de dar beneficios de módulo por misión: `bateria` sigue con +2 🛡️ (DD-07) y `antena`
 *    con +4 🛡️ en design/src/recursos.ts, aunque la propuesta §3 los quiere sin blindaje.
 * 6. Tampoco hay campo para el retraso de comunicaciones: RETRASO_COMUNICACIONES.outpost_sorpresa es 3
 *    ticks y la propuesta §4 pide 1 (la luz Tierra-Luna tarda ~1,3 s). Lo decide diseño en recursos.ts.
 */
export const MISION_OUTPOST_SORPRESA: Mision = {
  id: "outpost-sorpresa",
  nombreKey: "mision.outpost.nombre",
  sitio: "outpost_sorpresa",
  objetivo: "reportar_tierra",
  dificultad: "media",
  // Gannon: cadena DONKI completa con SEP (partículas), la fase que importa en una nave. Curada en data/curated/.
  tormentaId: "2024-05-10-gannon",
  averiaInicial: "ia_base",
  // Sin invernadero: no cabe una huerta en una nave pequeña (decisión de diseño, no dato). Propuesta §3.
  modulosDisponibles: ["panel_solar", "bateria", "reciclador_agua", "escudo", "antena"],
  modulosAColocar: 2,
  tickTormenta: 3,
  pasos: [
    // Hueco 1: paso 1 es la sorpresa ("no hay suelo") y paso 2 orientar la nave; reutilizan metas de Jezero.
    { n: 1, tituloKey: "mision.outpost.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.outpost.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.outpost.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.outpost.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.outpost.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.outpost.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.outpost.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.outpost.paso8", meta: "fin" },
  ],
  // Hueco 2: esta carpeta no existe en data/terreno/. Las zonas son de juego.
  terrenoId: "outpost-sorpresa",
  /*
   * Zonas de la nave (propuesta §2). El costo inmediato sale de la propuesta (cabina 🛡️-8, centro 🫁-6,
   * fondo ⚡-6); el beneficio con retraso es POR AJUSTAR (diseño), puesto para que ninguna domine:
   * - cabina: mucho espacio y cerca de controles, paredes delgadas → pierde blindaje, gana soporte vital.
   * - centro: rodeada de bolsas de provisiones → protege, pero sin espacio para trabajar ni comer.
   * - fondo: junto al escudo térmico → protege, pero lejos de los controles: cada orden cuesta energía.
   * La idea del refugio central y del fondo protegido viene de una página de NASA fuera de la lista
   * oficial (pendiente de aprobación de datos), así que estas zonas no llevan tarjeta de fuente.
   */
  sitiosCandidatos: [
    {
      id: "cabina",
      aterrizaje: { inmediato: { blindaje: -8 }, retrasado: { soporte_vital: 3 } },
      porQueKey: "mision.outpost.zona.cabina.porque",
    },
    {
      id: "centro",
      aterrizaje: { inmediato: { soporte_vital: -6 }, retrasado: { blindaje: 5 } },
      porQueKey: "mision.outpost.zona.centro.porque",
    },
    {
      id: "fondo",
      aterrizaje: { inmediato: { energia: -6 }, retrasado: { blindaje: 5, soporte_vital: 2 } },
      porQueKey: "mision.outpost.zona.fondo.porque",
    },
  ],
  averiaIris: {
    equipo: "ia_base",
    pasoRevelacion: 6,
    // Mismo error que en Jezero (valor de juego).
    errorLectura: 20,
    recursoMalLeido: "blindaje",
    // Propuesta §6: el niño aprende a verificar con la Doctora.
    reparaCon: "doctora",
  },
  fin: {
    exitoCuando: "telemetria_llega",
    falloCuando: "recurso_en_cero",
    tickLimite: 10,
  },
  /*
   * Hueco 3: es el micrometeorito (§7), no polvo. Misma mecánica: el panel rinde la mitad y se arregla
   * con una salida exterior (🛡️ -12 🫁 -5 en COSTOS_ACCION). Evento de juego, sin cifras de NASA.
   */
  eventoPolvo: {
    descripcionKey: "mala_suerte.tormenta_polvo",
    equipo: "panel_solar",
    rendimientoPanel: 0.5,
    limpiar: { tipo: "salida_exterior", objetivo: "panel_solar" },
    duraHasta: "limpieza",
    enSemillaDorada: false,
    experto: "ingeniera",
    textoKey: "mision.outpost.micrometeorito",
  },
  /*
   * Dilema del refugio (§6). Ninguna salida es gratis:
   * - refugiarse: COSTOS_ACCION ya cobra 🫁 -6 ⚡ -3 (las provisiones quedan tapadas y nadie trabaja).
   *   Hueco 4: "cuesta más en la cabina" no se puede expresar.
   * - subir_escudo nivel 2: ⚡ -16.
   * - esperar: poco ahora, pero la tormenta sigue bajando el blindaje.
   */
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.outpost.dilema.pregunta",
    opciones: [
      {
        id: "refugio_con_provisiones",
        accion: { tipo: "refugiarse" },
        defiende: "doctora",
        textoKey: "mision.outpost.dilema.refugio",
      },
      {
        id: "subir_escudo",
        accion: { tipo: "subir_escudo", nivel: 2 },
        defiende: "ingeniera",
        textoKey: "mision.outpost.dilema.escudo",
      },
      {
        id: "aguantar",
        accion: { tipo: "esperar" },
        defiende: null,
        textoKey: "mision.outpost.dilema.aguantar",
      },
    ],
  },
  tarjetasCiencia: [
    // HERA dentro de Orion en Artemis I (RadLab, data/ciencia/artemis.json): casi todos los días fueron tranquilos.
    { id: "orion_medidor", textoKey: "mision.outpost.ciencia.orion", fuenteKey: "fuente.radlab" },
    // Cadena DONKI de Gannon (data/curated/2024-05-10-gannon.json). El Kp 9 es de la Tierra: no se menciona aquí.
    { id: "tormenta_real", textoKey: "mision.outpost.ciencia.tormenta", fuenteKey: "fuente.donki" },
    // CRaTER en órbita lunar, ×206 con fondo tranquilo. DEPENDE del PR #95 (data/ciencia/luna.json).
    { id: "tormenta_crater", textoKey: "mision.outpost.ciencia.crater", fuenteKey: "fuente.radlab" },
    // Sin cifra; POR VERIFICAR: no hay fuente en data/i18n para "la nave vive de la luz del Sol".
    { id: "panel_sol", modulo: "panel_solar", textoKey: "mision.outpost.ciencia.panel", fuenteKey: null },
    // Sin cifra; POR VERIFICAR: sin fuente en data/i18n.
    { id: "bateria_guarda", modulo: "bateria", textoKey: "mision.outpost.ciencia.bateria", fuenteKey: null },
    // Misma afirmación que en Jezero, ya verificada por datos.
    { id: "agua_reciclada", modulo: "reciclador_agua", textoKey: "mision.outpost.ciencia.reciclador", fuenteKey: "fuente.nasa.agua" },
    // POR VERIFICAR: la página de NASA del refugio de Orion está fuera de la lista oficial (pendiente de datos).
    { id: "masa_protege", modulo: "escudo", textoKey: "mision.outpost.ciencia.escudo", fuenteKey: null },
    // POR VERIFICAR: ~1,3 s sale de la ficha lunar de NSSDC; en data/i18n solo está fuente.nssdc (ficha de Marte).
    { id: "mensajes_luna", modulo: "antena", textoKey: "mision.outpost.ciencia.antena", fuenteKey: null },
  ],
  /*
   * RAD (Curiosity): 1,84 ± 0,3 mSv/día en el viaje y 0,64 ± 0,12 en la superficie (Reitz et al. 2016).
   * 0,64 ya está en data/ciencia/radiacion.json; 1,84 (`marte-crucero`) DEPENDE del PR #95.
   * "Casi 3 veces" es cálculo nuestro (1,84 / 0,64 = 2,9). Nunca se mezcla con µGy/h.
   */
  preguntaFinal: {
    preguntaKey: "mision.outpost.pregunta",
    opcionesKeys: ["mision.outpost.pregunta.a", "mision.outpost.pregunta.b", "mision.outpost.pregunta.c"],
    correcta: 0,
    explicacionKey: "mision.outpost.pregunta.explicacion",
    fuenteKey: "fuente.dosis.marte",
  },
};
