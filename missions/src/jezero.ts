import type { BaseAction, Difficulty, Equipment, Expert, MissionGoal, Resource, Site } from "@solar-shield/contracts";

/**
 * Misión de la ruta dorada: cráter Jezero, Marte. Solo datos; la lógica vive en engine/.
 * Es la partida de demo del issue #41: 8 pasos en unos 2 minutos.
 */
export interface PasoMision {
  n: number;
  /** Clave i18n del título del paso. */
  tituloKey: string;
  /** Qué debe pasar para avanzar. */
  meta: "satelite_suelto" | "ruta_dibujada" | "sitio_elegido" | "modulos_colocados" | "tormenta_llega" | "consejo_opuesto" | "telemetria_enviada" | "fin";
}

/** Efecto de una opción sobre los medidores: el costo llega ya, el beneficio con retraso. */
export interface EfectoOpcion {
  inmediato: Partial<Record<Resource, number>>;
  retrasado: Partial<Record<Resource, number>>;
}

/**
 * Sitio candidato del paso 3. Los 3 criterios (plano, luz, blindaje) NO se copian aquí:
 * viven en data/terreno/<terrenoId>/<terrenoId>.json (Mars Trek, rol datos). Aquí solo
 * va el costo visible de aterrizar, que es un valor de juego, no un dato de NASA.
 */
export interface SitioCandidato {
  /** Id del sitio en data/terreno/<terrenoId>/<terrenoId>.json → sitios[].id */
  id: string;
  aterrizaje: EfectoOpcion;
  /** Clave i18n del "por qué cuesta esto" que ve el niño. */
  porQueKey: string;
}

/** Avería guionada de Iris: arranca averiada, se revela en un paso y la arregla un experto. */
export interface AveriaIris {
  equipo: Equipment;
  /** Paso de la ruta dorada en el que Iris da un número que no coincide con el medidor. */
  pasoRevelacion: number;
  /** Cuánto se equivoca Iris al leer el medidor (puntos sobre 100, siempre visible como error). */
  errorLectura: number;
  /** Medidor que Iris lee mal. */
  recursoMalLeido: Resource;
  /** Experto que la verifica y la repara. */
  reparaCon: Expert;
}

/** Cuándo termina la partida de demo. */
export interface FinMision {
  /** Gana cuando llega la telemetría a la Tierra (paso 7 → 8) sin ningún medidor en 0. */
  exitoCuando: "telemetria_llega";
  /** Pierde si cualquier medidor llega a 0 (regla general del motor). */
  falloCuando: "recurso_en_cero";
  /** Red de seguridad: si en este tick no ha pasado nada, se muestra el paso 8 igual. */
  tickLimite: number;
}

/**
 * Evento de mala suerte del paso 4b (propuesta #88, viene de la tarea "limpiar paneles" de ARES):
 * el polvo tapa los paneles y la energía que dan rinde menos hasta que alguien los limpia.
 * No sale en la semilla dorada, para que el video sea estable.
 */
export interface EventoPolvo {
  /** Clave de la causa que ya existe en el motor y en los textos de diseño. */
  descripcionKey: "mala_suerte.tormenta_polvo";
  equipo: Extract<Equipment, "panel_solar">;
  /** Fracción de la energía del panel que llega mientras hay polvo (0,5 = la mitad, propuesta #88). Valor de juego. */
  rendimientoPanel: number;
  /** Cómo se quita: una salida al exterior sobre el panel (cuesta blindaje y soporte vital, ver COSTOS_ACCION). */
  limpiar: BaseAction;
  /** Si no se limpia, el polvo sigue hasta el final de la misión. */
  duraHasta: "limpieza";
  enSemillaDorada: false;
  /** Experto que avisa y explica la decisión. */
  experto: Expert;
  textoKey: string;
}

/** Una salida del dilema: la acción que se ejecuta y, si hace falta, un efecto propio del dilema. */
export interface OpcionDilema {
  id: string;
  accion: BaseAction;
  /**
   * Efecto extra que el contrato todavía no expresa. Plan B del #88 §5: "apagar el invernadero"
   * no es una acción; se modela dentro de refugiarse como la comida que el invernadero deja de dar.
   */
  extra?: EfectoOpcion;
  /** Solo aplica `extra` si el jugador construyó este módulo. */
  extraSiTiene?: Equipment;
  /** Experto que defiende esta opción (o null si nadie la recomienda). */
  defiende: Expert | null;
  textoKey: string;
}

/** Dilema del paso 6 (propuesta #88): dos expertos se contradicen con la tormenta encima. Ninguna opción es gratis. */
export interface DilemaPaso6 {
  paso: 6;
  preguntaKey: string;
  opciones: OpcionDilema[];
}

/**
 * Tarjeta de ciencia (paso 8 y al colocar un módulo). Viene del "dato pegado a cada misión" de ARES (#88 §1).
 * Cada afirmación necesita fuente: `fuenteKey` apunta a una fuente que ya existe en data/i18n;
 * si es null, la tarjeta NO se muestra hasta que el rol datos la verifique (issue bloquea:datos).
 */
export interface TarjetaCiencia {
  id: string;
  /** Módulo al que acompaña, si aplica. */
  modulo?: Equipment;
  textoKey: string;
  fuenteKey: string | null;
}

/** Pregunta del paso 8 (el quiz de ARES): 3 opciones, nunca bloquea y siempre explica. */
export interface PreguntaFinal {
  preguntaKey: string;
  opcionesKeys: [string, string, string];
  correcta: 0 | 1 | 2;
  explicacionKey: string;
  fuenteKey: string | null;
}

export interface Mision {
  id: string;
  nombreKey: string;
  sitio: Site;
  objetivo: MissionGoal;
  dificultad: Difficulty;
  /** Id del evento curado en data/curated/. */
  tormentaId: string;
  /** Equipo que arranca averiado (Iris dañada en el paso 6). */
  averiaInicial: Equipment;
  /** Módulos que el jugador coloca en el paso 4 (elige 2 de estos). */
  modulosDisponibles: Equipment[];
  modulosAColocar: number;
  /** Tick en el que la tormenta se activa (la pausa automática la hace ui). */
  tickTormenta: number;
  pasos: PasoMision[];
  /** Carpeta en data/terreno/ con el mapa y los sitios candidatos. */
  terrenoId: string;
  /** Sitios del paso 3, en el orden en que ui los muestra. */
  sitiosCandidatos: SitioCandidato[];
  averiaIris: AveriaIris;
  fin: FinMision;
  eventoPolvo: EventoPolvo;
  dilemaPaso6: DilemaPaso6;
  tarjetasCiencia: TarjetaCiencia[];
  preguntaFinal: PreguntaFinal;
}

export const MISION_JEZERO: Mision = {
  id: "jezero-dorada",
  nombreKey: "mision.jezero.nombre",
  sitio: "marte_jezero",
  objetivo: "explorar",
  dificultad: "media",
  tormentaId: "2024-05-20-marte",
  averiaInicial: "ia_base",
  modulosDisponibles: ["panel_solar", "reciclador_agua", "escudo", "invernadero", "antena"],
  modulosAColocar: 2,
  tickTormenta: 3,
  pasos: [
    { n: 1, tituloKey: "mision.jezero.paso1", meta: "satelite_suelto" },
    { n: 2, tituloKey: "mision.jezero.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.jezero.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.jezero.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.jezero.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.jezero.paso6", meta: "consejo_opuesto" },
    { n: 7, tituloKey: "mision.jezero.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.jezero.paso8", meta: "fin" },
  ],
  terrenoId: "jezero",
  /*
   * Ningún sitio es gratis ni domina a los demás:
   * - llanura-central: el mejor puntaje y el aterrizaje más barato, pero a campo abierto (pierde blindaje).
   * - cerca-de-perseverance: término medio; el rover hace de antena de relevo (+ soporte vital con retraso).
   * - pie-de-la-pared-sur: aterrizaje difícil (energía), pero las paredes del cráter protegen.
   * - sobre-el-borde-oeste: carísimo de alcanzar, pero el sol sin sombras devuelve energía después.
   */
  sitiosCandidatos: [
    {
      id: "llanura-central",
      aterrizaje: { inmediato: { energia: -3, blindaje: -8 }, retrasado: {} },
      porQueKey: "mision.jezero.sitio.llanura-central.porque",
    },
    {
      id: "cerca-de-perseverance",
      aterrizaje: { inmediato: { energia: -6, blindaje: -4 }, retrasado: { soporte_vital: 3 } },
      porQueKey: "mision.jezero.sitio.cerca-de-perseverance.porque",
    },
    {
      id: "pie-de-la-pared-sur",
      aterrizaje: { inmediato: { energia: -10, soporte_vital: -2 }, retrasado: { blindaje: 5 } },
      porQueKey: "mision.jezero.sitio.pie-de-la-pared-sur.porque",
    },
    {
      id: "sobre-el-borde-oeste",
      aterrizaje: { inmediato: { energia: -12, soporte_vital: -4 }, retrasado: { energia: 8 } },
      porQueKey: "mision.jezero.sitio.sobre-el-borde-oeste.porque",
    },
  ],
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
  eventoPolvo: {
    descripcionKey: "mala_suerte.tormenta_polvo",
    equipo: "panel_solar",
    rendimientoPanel: 0.5,
    limpiar: { tipo: "salida_exterior", objetivo: "panel_solar" },
    duraHasta: "limpieza",
    enSemillaDorada: false,
    experto: "ingeniera",
    textoKey: "mision.jezero.polvo",
  },
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.jezero.dilema.pregunta",
    opciones: [
      {
        id: "refugio_y_apagar_invernadero",
        accion: { tipo: "refugiarse" },
        // Lo que se pierde es justo lo que el invernadero da al construirse (MODULOS.invernadero.soporte_vital = 10).
        extra: { inmediato: {}, retrasado: { soporte_vital: -10 } },
        extraSiTiene: "invernadero",
        defiende: "doctora",
        textoKey: "mision.jezero.dilema.refugio",
      },
      {
        id: "subir_escudo",
        accion: { tipo: "subir_escudo", nivel: 2 },
        defiende: "ingeniera",
        textoKey: "mision.jezero.dilema.escudo",
      },
      {
        id: "aguantar",
        accion: { tipo: "esperar" },
        defiende: null,
        textoKey: "mision.jezero.dilema.aguantar",
      },
    ],
  },
  tarjetasCiencia: [
    // Con fuente: la tormenta de la demo la midió el instrumento RAD de Curiosity en Marte (data/curated/2024-05-20-marte.json).
    { id: "tormenta_medida", textoKey: "mision.jezero.ciencia.tormenta", fuenteKey: "fuente.radlab" },
    // Con fuente: terreno de Jezero (Mars Trek); la inclinación es derivada por el equipo (docs/science/terreno.md).
    { id: "sitio_terreno", textoKey: "mision.jezero.ciencia.terreno", fuenteKey: "fuente.marsTrek" },
    // Sin fuente en el repo todavía: las pide diseño a datos.
    { id: "panel_polvo", modulo: "panel_solar", textoKey: "mision.jezero.ciencia.panel", fuenteKey: null },
    { id: "agua_reciclada", modulo: "reciclador_agua", textoKey: "mision.jezero.ciencia.reciclador", fuenteKey: null },
    { id: "plantas", modulo: "invernadero", textoKey: "mision.jezero.ciencia.invernadero", fuenteKey: null },
    { id: "escudo_regolito", modulo: "escudo", textoKey: "mision.jezero.ciencia.escudo", fuenteKey: null },
    { id: "mensajes_tardan", modulo: "antena", textoKey: "mision.jezero.ciencia.antena", fuenteKey: null },
  ],
  preguntaFinal: {
    preguntaKey: "mision.jezero.pregunta",
    opcionesKeys: ["mision.jezero.pregunta.a", "mision.jezero.pregunta.b", "mision.jezero.pregunta.c"],
    correcta: 1,
    explicacionKey: "mision.jezero.pregunta.explicacion",
    fuenteKey: null,
  },
};
