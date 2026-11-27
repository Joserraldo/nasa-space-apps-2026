import type { Mision } from "./jezero.js";

/**
 * C1 "El viaje" (docs/PLAN-INTEGRACION-COLONIA.md §5.1; campaña DV-01): la nave va camino a Marte.
 * Reemplaza en la campaña a `outpost-sorpresa`, que viaja a la Luna. Solo datos; la lógica vive en engine/.
 *
 * Dos decisiones distintas:
 * - `decisionInicial` (intro): refugio o escudo. Se pregunta una sola vez; el motor la aplica al llegar la tormenta.
 * - `dilemaPaso6` (en la tormenta): con la energía justa, qué sostener y qué sacrificar.
 *
 * Reutiliza el sitio `outpost_sorpresa` (recursos, consumo y fondo de dosis `marte-crucero`), así que
 * contracts/ no cambia. La tormenta es la de mayo de 2024 medida cerca de la Tierra (DONKI): se presenta
 * como tormenta real del archivo, no como algo medido en esta nave.
 *
 * Todos los costos, beneficios y el límite de dosis son VALORES DE JUEGO, no datos de NASA.
 * El balance está probado con varias estrategias en engine/src/viaje-marte.test.ts.
 */
export const MISION_VIAJE_MARTE = {
  id: "viaje-marte",
  nombreKey: "mision.viaje.nombre",
  sitio: "outpost_sorpresa",
  objetivo: "reportar_tierra",
  dificultad: "facil",
  tormentaId: "2024-05-10-gannon",
  averiaInicial: "ia_base",
  // Sin invernadero: la huerta se estrena en C3.
  modulosDisponibles: ["panel_solar", "bateria", "reciclador_agua", "escudo", "antena"],
  modulosAColocar: 2,
  // En la nave cada módulo rinde distinto que en Jezero (valores de juego, salen de la simulación de balance).
  modulos: {
    panel_solar: { energia: 27 },
    bateria: { energia: 21, blindaje: 3 },
    reciclador_agua: { soporte_vital: 21, energia: -1 },
    escudo: { blindaje: 18, soporte_vital: 4 },
    antena: { blindaje: 8, soporte_vital: 8 },
  },
  tickTormenta: 3,
  retrasoComunicacionesTicks: 2,
  pasos: [
    // Como en outpost: los pasos 1 y 2 reutilizan las metas de Jezero con textos propios.
    { n: 1, tituloKey: "mision.viaje.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.viaje.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.viaje.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.viaje.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.viaje.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.viaje.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.viaje.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.viaje.paso8", meta: "fin" },
  ],
  // Zonas de la nave: sin terreno. Ninguna domina a otra.
  sitiosCandidatos: [
    {
      id: "cabina",
      aterrizaje: { inmediato: { blindaje: -5 }, retrasado: { soporte_vital: 3 } },
      porQueKey: "mision.viaje.zona.cabina.porque",
    },
    {
      id: "centro",
      aterrizaje: { inmediato: { soporte_vital: -6 }, retrasado: { blindaje: 5 } },
      porQueKey: "mision.viaje.zona.centro.porque",
    },
    {
      id: "fondo",
      aterrizaje: { inmediato: { energia: -6 }, retrasado: { blindaje: 5, soporte_vital: 2 } },
      porQueKey: "mision.viaje.zona.fondo.porque",
    },
  ],
  averiaIris: {
    equipo: "ia_base",
    pasoRevelacion: 6,
    errorLectura: 20,
    recursoMalLeido: "blindaje",
    reparaCon: "doctora",
  },
  fin: {
    exitoCuando: "telemetria_tras_tormenta",
    falloCuando: "recurso_en_cero",
    tickLimite: 10,
  },
  // Valor de juego: sin plan ante la tormenta la tripulación supera este presupuesto de radiación.
  limiteDosisMSv: 10,
  decisionInicial: {
    preguntaKey: "mision.viaje.plan.pregunta",
    opciones: [
      {
        id: "refugio",
        accion: { tipo: "refugiarse" },
        // Las bolsas de agua y comida quedan tapando a la tripulación: cuesta alcanzarlas.
        extra: { inmediato: {}, retrasado: { soporte_vital: -18 } },
        extraCausaKey: "causa.viaje.provisiones",
        defiende: "doctora",
        textoKey: "mision.viaje.plan.refugio",
      },
      {
        id: "escudo",
        accion: { tipo: "subir_escudo", nivel: 2 },
        extra: { inmediato: {}, retrasado: { blindaje: 14 } },
        extraCausaKey: "causa.viaje.escudo_firme",
        defiende: "ingeniera",
        textoKey: "mision.viaje.plan.escudo",
      },
    ],
  },
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.viaje.dilema.pregunta",
    opciones: [
      {
        id: "energia_al_aire",
        accion: { tipo: "redistribuir_energia", hacia: "soporte_vital", cantidad: 5 },
        extra: { inmediato: {}, retrasado: { soporte_vital: 14 } },
        extraCausaKey: "causa.viaje.filtros",
        defiende: "doctora",
        textoKey: "mision.viaje.dilema.aire",
      },
      {
        id: "energia_a_paredes",
        accion: { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: 5 },
        defiende: "ingeniera",
        textoKey: "mision.viaje.dilema.paredes",
      },
      {
        id: "guardar_energia",
        accion: { tipo: "esperar" },
        // Con los equipos apagados el aire se renueva menos y las paredes quedan sin refuerzo.
        extra: { inmediato: { soporte_vital: -22, blindaje: -14 }, retrasado: {} },
        extraCausaKey: "causa.viaje.apagado",
        defiende: null,
        textoKey: "mision.viaje.dilema.guardar",
      },
    ],
  },
  tarjetasCiencia: [
    // Cadena DONKI de mayo de 2024 (data/curated/2024-05-10-gannon.json), observada desde cerca de la Tierra.
    { id: "tormenta_real", textoKey: "mision.viaje.ciencia.tormenta", fuenteKey: "fuente.donki" },
    // RAD: 1,84 mSv/día en el crucero a Marte y 0,64 en la superficie (data/ciencia/radiacion.json).
    { id: "dosis_viaje", textoKey: "mision.viaje.ciencia.dosis", fuenteKey: "fuente.dosis.marte" },
    { id: "panel_sol", modulo: "panel_solar", textoKey: "mision.viaje.ciencia.panel", fuenteKey: "fuente.nasa.orionPaneles" },
    { id: "bateria_guarda", modulo: "bateria", textoKey: "mision.viaje.ciencia.bateria", fuenteKey: "fuente.nasa.baterias" },
    { id: "agua_reciclada", modulo: "reciclador_agua", textoKey: "mision.viaje.ciencia.reciclador", fuenteKey: "fuente.nasa.agua" },
    { id: "masa_protege", modulo: "escudo", textoKey: "mision.viaje.ciencia.escudo", fuenteKey: "fuente.nasa.orionRefugio" },
    { id: "mensajes_tardan", modulo: "antena", textoKey: "mision.viaje.ciencia.antena", fuenteKey: "fuente.nssdc" },
  ],
  preguntaFinal: {
    preguntaKey: "mision.viaje.pregunta",
    opcionesKeys: ["mision.viaje.pregunta.a", "mision.viaje.pregunta.b", "mision.viaje.pregunta.c"],
    correcta: 0,
    explicacionKey: "mision.viaje.pregunta.explicacion",
    fuenteKey: "fuente.dosis.marte",
  },
} satisfies Mision;
