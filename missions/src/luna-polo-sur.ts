import type { Mision } from "./jezero.js";

/**
 * Misión 2 (PROPUESTA para diseño): polo sur de la Luna. "El agua se esconde en la oscuridad y la energía vive en la luz."
 * Solo datos; la lógica vive en engine/. Fuente de la idea: docs/ideas/mision-luna-polo-sur.md (rama
 * feat/datos-mision-luna-polo-sur, rol datos). Las voces viven en agents/src/voces-luna-polo-sur.ts.
 *
 * Todos los costos son valores de juego (0-100), no datos de NASA. Arranque, consumo y retraso de 1 tick
 * ya están en design/src/recursos.ts (luna_polo_sur).
 *
 * DEPENDENCIAS de otros PR:
 * - #126 (data/terreno/luna-polo-sur/): los 4 ids de sitio son cráteres reales de Moon Trek de ese PR.
 *   La propuesta usaba nombres inventados (cresta-soleada, borde-del-crater-oscuro, llanura-entre-crateres,
 *   macizo-alto); aquí cada rol se asigna al cráter de #126 que mejor lo cumple según sus datos medidos.
 * - #95 (data/ciencia/luna.json, clave fuente.crater): la tarjeta de la tormenta cita por ahora fuente.radlab
 *   (CRaTER se consulta por NASA OSDR RadLab); cambiar a fuente.crater cuando #95 entre a develop.
 *
 * Estado de integración con `Mision` (eventoPolvo es opcional; quedan pendientes para diseño/motor):
 * 1. La mala suerte es un micrometeorito, con la clave existente en design/i18n.
 *    La descripción está corregida; su efecto sobre el panel requiere implementación del motor.
 * 2. Paso 2 con decisión (pasada baja / alta del satélite): `PasoMision` no tiene opciones.
 * 3. Criterio 🧊 "hielo cerca" del sitio que sube `reciclador_agua` y panel a la mitad en sitio oscuro:
 *    `SitioCandidato` no tiene efecto por módulo (pedido a motor en la propuesta §9).
 * 4. `salida_exterior` da ⚡ retrasado; la expedición al hielo debería dar 🫁. Se modela con `extra` (plan B #88 §5).
 */
export const MISION_LUNA_POLO_SUR = {
  id: "luna-polo-sur",
  nombreKey: "mision.luna.nombre",
  sitio: "luna_polo_sur",
  objetivo: "explorar",
  dificultad: "media",
  // Ya en develop: data/curated/2017-09-10-x82.json (DONKI FLR X8.2 → CME 2650 km/s → SEP; RAD en Marte ×2,3).
  tormentaId: "2017-09-10-x82",
  averiaInicial: "ia_base",
  // Sin antena: con ≈1,3 s de retraso Luna–Tierra (384 400 km, NSSDC) casi no aporta (propuesta §4).
  modulosDisponibles: ["panel_solar", "bateria", "reciclador_agua", "escudo", "invernadero"],
  modulosAColocar: 2,
  tickTormenta: 3,
  pasos: [
    { n: 1, tituloKey: "mision.luna.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.luna.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.luna.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.luna.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.luna.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.luna.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.luna.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.luna.paso8", meta: "fin" },
  ],
  terrenoId: "luna-polo-sur",
  /*
   * Costos de la propuesta §3; el rol de cada sitio sale de los datos medidos en #126 (luz LOLA/Mazarico 2011,
   * sombra permanente y señal de hielo de Moon Trek, pendiente del DEM LOLA 30 m). Ningún sitio domina:
   * - nobile: el que más sol recibe y sin señal de hielo cerca (propuesta "cresta soleada").
   * - shackleton: la mayor señal de hielo y casi sin sol (propuesta "borde del cráter oscuro").
   * - faustini: el más plano, pero en sombra permanente (propuesta "llanura entre cráteres").
   * - malapert: sol en alto, el más empinado y sin hielo (propuesta "macizo alto"). AJUSTE: el retrasado de ⚡
   *   pasa de +4 a +8 porque con +4 faustini lo dominaba en los tres medidores.
   */
  sitiosCandidatos: [
    {
      id: "nobile",
      aterrizaje: { inmediato: { energia: -3, soporte_vital: -6 }, retrasado: { energia: 6 } },
      porQueKey: "mision.luna.sitio.nobile.porque",
    },
    {
      id: "shackleton",
      aterrizaje: { inmediato: { energia: -8, blindaje: -4 }, retrasado: { soporte_vital: 6 } },
      porQueKey: "mision.luna.sitio.shackleton.porque",
    },
    {
      id: "faustini",
      aterrizaje: { inmediato: { energia: -4, soporte_vital: -2 }, retrasado: { blindaje: 3 } },
      porQueKey: "mision.luna.sitio.faustini.porque",
    },
    {
      id: "malapert",
      aterrizaje: { inmediato: { energia: -10, soporte_vital: -3 }, retrasado: { energia: 8, blindaje: 2 } },
      porQueKey: "mision.luna.sitio.malapert.porque",
    },
  ],
  // Igual que Jezero (propuesta §6): Iris lee el blindaje 20 puntos de más y la Ingeniera la repara.
  averiaIris: {
    equipo: "ia_base",
    pasoRevelacion: 6,
    errorLectura: 20,
    recursoMalLeido: "blindaje",
    reparaCon: "ingeniera",
  },
  fin: {
    exitoCuando: "telemetria_llega",
    falloCuando: "recurso_en_cero",
    tickLimite: 10,
  },
  // Micrometeorito (propuesta §7): el tipo ya acepta esta causa; el efecto sobre el panel lo pone el motor.
  eventoPolvo: {
    descripcionKey: "mala_suerte.micrometeorito",
    equipo: "panel_solar",
    rendimientoPanel: 0.5,
    limpiar: { tipo: "reparar", equipo: "panel_solar" },
    duraHasta: "limpieza",
    enSemillaDorada: false,
    experto: "ingeniera",
    textoKey: "mision.luna.malasuerte.micrometeorito",
  },
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.luna.dilema.pregunta",
    opciones: [
      {
        id: "volver_al_refugio",
        accion: { tipo: "refugiarse" },
        defiende: "doctora",
        textoKey: "mision.luna.dilema.refugio",
      },
      {
        id: "terminar_expedicion",
        accion: { tipo: "salida_exterior", objetivo: "reciclador_agua" },
        // HUECO 4: la expedición trae hielo (🫁), no ⚡. Anula el ⚡+15 de COSTOS_ACCION.salida_exterior y da 🫁+15.
        extra: { inmediato: {}, retrasado: { energia: -15, soporte_vital: 15 } },
        defiende: "ingeniera",
        textoKey: "mision.luna.dilema.expedicion",
      },
      {
        id: "subir_escudo",
        accion: { tipo: "subir_escudo", nivel: 2 },
        defiende: null,
        textoKey: "mision.luna.dilema.escudo",
      },
    ],
  },
  tarjetasCiencia: [
    // CRaTER (LRO, EN ÓRBITA, no en el suelo) vía NASA OSDR RadLab. Pasar a fuente.crater cuando entre #95.
    { id: "tormenta_en_orbita", textoKey: "mision.luna.ciencia.tormenta", fuenteKey: "fuente.radlab" },
    // Terreno del polo sur: DEM LOLA en Moon Trek (#126).
    { id: "sitio_terreno", textoKey: "mision.luna.ciencia.terreno", fuenteKey: "fuente.moonTrek" },
    // Irradiancia 1361,0 W/m², igual que la Tierra [V NSSDC moonfact].
    { id: "panel_sol", modulo: "panel_solar", textoKey: "mision.luna.ciencia.panel", fuenteKey: "fuente.nssdcMoon" },
    // Periodo sinódico 29,53 días [V NSSDC moonfact].
    { id: "bateria_noche", modulo: "bateria", textoKey: "mision.luna.ciencia.bateria", fuenteKey: "fuente.nssdcMoon" },
    // [V] NASA Science: hielo de agua en regiones en sombra permanente (#159, LISTA).
    { id: "hielo_sombra", modulo: "reciclador_agua", textoKey: "mision.luna.ciencia.reciclador", fuenteKey: "fuente.nasa.hieloLuna" },
    // Dosis de superficie de Chang'e-4/LND: CNSA, no NASA (Zhang et al. 2020); casi sin aire: 3e-15 bar [V NSSDC].
    { id: "escudo_sin_aire", modulo: "escudo", textoKey: "mision.luna.ciencia.escudo", fuenteKey: "fuente.dosis.lunaIss" },
    // Mismo dato verificado que Jezero (chiles en la Estación Espacial, NASA OSDR).
    { id: "plantas", modulo: "invernadero", textoKey: "mision.luna.ciencia.invernadero", fuenteKey: "fuente.osdr" },
  ],
  // Propuesta §8: RAD (Curiosity) midió ×2,3 en Marte con la misma tormenta (data/curated/2017-09-10-x82.json).
  preguntaFinal: {
    preguntaKey: "mision.luna.pregunta",
    opcionesKeys: ["mision.luna.pregunta.a", "mision.luna.pregunta.b", "mision.luna.pregunta.c"],
    correcta: 0,
    explicacionKey: "mision.luna.pregunta.explicacion",
    fuenteKey: "fuente.radlab",
  },
} satisfies Mision;
