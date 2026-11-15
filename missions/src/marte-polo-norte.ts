import type { Mision } from "./jezero.js";

/**
 * Misión Marte polo norte: "Sin Sol, ¿de dónde sale la energía?". Solo datos; la lógica vive en engine/.
 * Propuesta en código para que la revise diseño (Camilo). Sale de la propuesta de datos
 * docs/ideas/mision-marte-polo-norte.md (rama feat/datos-mision-marte-polo-norte, §3–§9).
 * Las voces ya existen en agents/src/voces-polo-norte.ts.
 *
 * Fuentes de las cifras de NASA (todas vía data/, nunca copiadas como número aquí):
 * - Inclinación del eje 25,19° y año de 686,980 días: NASA NSSDC (fuente.nssdc).
 * - Tormenta 2024-05-20-marte: DONKI + RAD de Curiosity (fuente.radlab), medida en el cráter Gale, NO en el polo.
 * - Terreno: MOLA polar vía Mars Trek (fuente.marsTrek), data/terreno/marte-norte (PR #148).
 * Todos los demás números son valores de juego de la propuesta (§3, §7), no datos de NASA.
 *
 * Dependencia: data/terreno/marte-norte/marte-norte.json llega con el PR #148 (feat/datos-terreno-marte-norte).
 *
 * Huecos del tipo `Mision` (NO se cambió el tipo; queda para diseño o un issue `contrato`):
 * 1. Las 3 "zonas por latitud" de la propuesta (borde-sur, franja-media, junto-al-casquete) se mapean a sitios
 *    MOLA de #148 por latitud: crater-louth (70° N), crater-escorial (77° N), canon-chasma-boreale (83° N).
 *    agents/src/voces-polo-norte.ts usa los ids de zona: quien integre necesita esta tabla (ZONA_DE_SITIO).
 *    dunas-olympia-undae (81° N) queda fuera: la propuesta no tiene costo para un 4.º sitio.
 * 2. Paso 2 ("dar una vuelta más cargando": ⚡ +8 con retraso, 🫁 −4) no cabe: PasoMision no lleva decisión ni efecto.
 * 3. Noche polar (paso 7: panel_solar da 0 desde un tick) y factor de luz por zona (seno de la altura del Sol):
 *    no hay campo. Plan B de la propuesta §11: evento guionado aquí o tabla en design/. Texto ya listo: mision.polo_norte.noche.
 * 4. Ajustes de módulos del polo (invernadero ⚡ −4, reciclador +4 🫁 junto al casquete, batería sin +2 🛡️ y que
 *    guarde energía): viven en design/MODULOS, que hoy es uno solo para todos los sitios.
 * 5. EventoPolvo.descripcionKey es el literal "mala_suerte.tormenta_polvo": la escarcha usa esa causa del motor
 *    y su propio textoKey. Si la cadena de causas debe decir "escarcha", hace falta otra clave en el tipo.
 */
export const ZONA_DE_SITIO = {
  "crater-louth": "borde-sur",
  "crater-escorial": "franja-media",
  "canon-chasma-boreale": "junto-al-casquete",
} as const;

export const MISION_MARTE_POLO_NORTE: Mision = {
  id: "marte-polo-norte",
  nombreKey: "mision.polo_norte.nombre",
  sitio: "marte_polo_norte",
  // POR DECIDIR (diseño): la propuesta no fija objetivo ni dificultad; se copian de Jezero.
  objetivo: "explorar",
  dificultad: "media",
  // La misma tormenta que Jezero (propuesta §6): el niño ve el mismo evento desde otra base.
  tormentaId: "2024-05-20-marte",
  averiaInicial: "ia_base",
  modulosDisponibles: ["panel_solar", "bateria", "reciclador_agua", "escudo", "invernadero"],
  modulosAColocar: 2,
  // Valor de juego copiado de Jezero; la propuesta no lo fija.
  tickTormenta: 3,
  pasos: [
    { n: 1, tituloKey: "mision.polo_norte.paso1", meta: "satelite_suelto" },
    // Hueco 2: la decisión "cargar o bajar ya" no tiene meta propia; se usa la de la ruta del satélite.
    { n: 2, tituloKey: "mision.polo_norte.paso2", meta: "ruta_dibujada" },
    { n: 3, tituloKey: "mision.polo_norte.paso3", meta: "sitio_elegido" },
    { n: 4, tituloKey: "mision.polo_norte.paso4", meta: "modulos_colocados" },
    { n: 5, tituloKey: "mision.polo_norte.paso5", meta: "tormenta_llega" },
    { n: 6, tituloKey: "mision.polo_norte.paso6", meta: "consejo_opuesto" },
    // Hueco 3: aquí empieza la noche polar (texto mision.polo_norte.noche), sin campo en el tipo.
    { n: 7, tituloKey: "mision.polo_norte.paso7", meta: "telemetria_enviada" },
    { n: 8, tituloKey: "mision.polo_norte.paso8", meta: "fin" },
  ],
  terrenoId: "marte-norte",
  /*
   * Costos de la propuesta §3 (valores de juego). Ninguno es gratis ni domina a otro:
   * - crater-louth (borde-sur): más Sol, que devuelve energía, pero el hielo queda lejos (🫁).
   * - crater-escorial (franja-media): cae la carga de provisiones (🫁 con retraso); ni mucho Sol ni mucho hielo.
   * - canon-chasma-boreale (junto-al-casquete): el hielo al lado (más 🫁), pero los paneles casi no rinden (⚡).
   */
  sitiosCandidatos: [
    {
      id: "crater-louth",
      aterrizaje: { inmediato: { energia: -3, soporte_vital: -4 }, retrasado: { energia: 6 } },
      porQueKey: "mision.polo_norte.sitio.crater-louth.porque",
    },
    {
      id: "crater-escorial",
      aterrizaje: { inmediato: { energia: -5 }, retrasado: { soporte_vital: 4 } },
      porQueKey: "mision.polo_norte.sitio.crater-escorial.porque",
    },
    {
      id: "canon-chasma-boreale",
      aterrizaje: { inmediato: { energia: -8 }, retrasado: { soporte_vital: 8 } },
      porQueKey: "mision.polo_norte.sitio.canon-chasma-boreale.porque",
    },
  ],
  // Propuesta §7: Iris dice que la batería está llena; lee ⚡ con +20 de error.
  averiaIris: {
    equipo: "ia_base",
    pasoRevelacion: 6,
    errorLectura: 20,
    recursoMalLeido: "energia",
    reparaCon: "ingeniera",
  },
  fin: {
    exitoCuando: "telemetria_llega",
    falloCuando: "recurso_en_cero",
    tickLimite: 10, // copiado de Jezero
  },
  // Paso 4b (propuesta §5): escarcha en los paneles. Que la escarcha tape paneles es escenario de juego, no dato.
  eventoPolvo: {
    descripcionKey: "mala_suerte.tormenta_polvo", // hueco 5
    equipo: "panel_solar",
    rendimientoPanel: 0.5,
    limpiar: { tipo: "salida_exterior", objetivo: "panel_solar" },
    duraHasta: "limpieza",
    enSemillaDorada: false,
    experto: "ingeniera",
    textoKey: "mision.polo_norte.escarcha",
  },
  // Dilema de la batería (propuesta §7). Los costos salen de design/COSTOS_ACCION; ninguno es gratis.
  dilemaPaso6: {
    paso: 6,
    preguntaKey: "mision.polo_norte.dilema.pregunta",
    opciones: [
      {
        id: "refugiarse",
        accion: { tipo: "refugiarse" },
        defiende: "doctora", // "plan B" de la Doctora en la propuesta
        textoKey: "mision.polo_norte.dilema.refugio",
      },
      {
        id: "escudo_con_bateria",
        accion: { tipo: "subir_escudo", nivel: 1 },
        defiende: "doctora",
        textoKey: "mision.polo_norte.dilema.escudo",
      },
      {
        id: "guardar_bateria",
        accion: { tipo: "esperar" },
        defiende: "ingeniera",
        textoKey: "mision.polo_norte.dilema.guardar",
      },
    ],
  },
  tarjetasCiencia: [
    // RAD midió la tormenta en el cráter Gale, no en el polo (data/curated/2024-05-20-marte.json).
    { id: "tormenta_en_gale", textoKey: "mision.polo_norte.tormenta.donde", fuenteKey: "fuente.radlab" },
    // Inclinación 25,19° [V] NSSDC; la altura del Sol por latitud es cálculo del equipo (data/src/region.ts).
    { id: "eje_inclinado", textoKey: "mision.polo_norte.ciencia.eje", fuenteKey: "fuente.nssdc" },
    // Año de 686,980 días / 365,256 = 1,88 [V] NSSDC.
    { id: "tiempo_comprimido", textoKey: "mision.polo_norte.tiempo", fuenteKey: "fuente.nssdc" },
    // Terreno MOLA polar (PR #148).
    { id: "sitio_terreno", textoKey: "mision.polo_norte.ciencia.terreno", fuenteKey: "fuente.marsTrek" },
    // [V] NASA JPL, Spirit inclinado al norte en invierno (#159, docs/science/tarjetas-misiones.md).
    { id: "sol_bajo", modulo: "panel_solar", textoKey: "mision.polo_norte.ciencia.panel", fuenteKey: "fuente.jpl.spiritInclinacion" },
    // [V] NASA, Phoenix en el polo norte: sin Sol en invierno no carga las baterías (#159).
    { id: "guardar_energia", modulo: "bateria", textoKey: "mision.polo_norte.ciencia.bateria", fuenteKey: "fuente.nasa.phoenix" },
    // Mismas afirmaciones ya verificadas para Jezero (docs/science/tarjetas-mision1.md).
    { id: "agua_reciclada", modulo: "reciclador_agua", textoKey: "mision.polo_norte.ciencia.reciclador", fuenteKey: "fuente.nasa.agua" },
    { id: "escudo_regolito", modulo: "escudo", textoKey: "mision.polo_norte.ciencia.escudo", fuenteKey: "fuente.dosis.marte" },
    { id: "plantas", modulo: "invernadero", textoKey: "mision.polo_norte.ciencia.invernadero", fuenteKey: "fuente.osdr" },
    // [V] NASA JPL: el casquete residual del norte es sobre todo hielo de agua (#159; el estacional tiene CO₂).
    { id: "hielo_de_agua", textoKey: "mision.polo_norte.ciencia.hielo", fuenteKey: "fuente.jpl.casqueteMarte" },
  ],
  preguntaFinal: {
    preguntaKey: "mision.polo_norte.pregunta",
    opcionesKeys: ["mision.polo_norte.pregunta.a", "mision.polo_norte.pregunta.b", "mision.polo_norte.pregunta.c"],
    correcta: 1,
    explicacionKey: "mision.polo_norte.pregunta.explicacion",
    // POR VERIFICAR: la explicación es causa y efecto del juego; la propuesta no le asigna fuente.
    fuenteKey: null,
  },
};
