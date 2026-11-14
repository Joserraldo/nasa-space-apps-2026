/**
 * Textos de la misión Jezero. Inglés es la base; español, la segunda lengua.
 * Solo datos: ui los mezcla con su i18n. Público: 7 a 12 años.
 */
export type Idioma = "en" | "es";

export const TEXTOS_JEZERO: Record<Idioma, Record<string, string>> = {
  en: {
    "mision.jezero.nombre": "Base in Jezero Crater, Mars",
    "mision.jezero.paso1": "Release the satellite",
    "mision.jezero.paso2": "Draw the satellite's path",
    "mision.jezero.paso3": "Pick a landing spot",
    "mision.jezero.paso4": "Build two modules",
    "mision.jezero.paso5": "A real solar storm is coming!",
    "mision.jezero.paso6": "Two experts disagree",
    "mision.jezero.paso7": "Send data to Earth",
    "mision.jezero.paso8": "What happened and why",
    "mision.jezero.sitio.llanura-central.porque":
      "Flat and sunny, so landing is cheap. But it's wide open: less protection from radiation.",
    "mision.jezero.sitio.cerca-de-perseverance.porque":
      "A bit harder to land. The Perseverance rover nearby can help relay messages later.",
    "mision.jezero.sitio.pie-de-la-pared-sur.porque":
      "Bumpy landing that uses lots of energy. The crater walls will shield you later.",
    "mision.jezero.sitio.sobre-el-borde-oeste.porque":
      "Very hard to reach. Up high there are no shadows, so your solar panels will pay you back.",
  },
  es: {
    "mision.jezero.nombre": "Base en el cráter Jezero, Marte",
    "mision.jezero.paso1": "Suelta el satélite",
    "mision.jezero.paso2": "Dibuja la ruta del satélite",
    "mision.jezero.paso3": "Elige dónde aterrizar",
    "mision.jezero.paso4": "Construye dos módulos",
    "mision.jezero.paso5": "¡Llega una tormenta solar real!",
    "mision.jezero.paso6": "Dos expertos no están de acuerdo",
    "mision.jezero.paso7": "Envía datos a la Tierra",
    "mision.jezero.paso8": "Qué pasó y por qué",
    "mision.jezero.sitio.llanura-central.porque":
      "Plano y con sol, así que aterrizar es barato. Pero está muy abierto: menos protección contra la radiación.",
    "mision.jezero.sitio.cerca-de-perseverance.porque":
      "Aterrizar cuesta un poco más. El rover Perseverance está cerca y luego puede ayudar a pasar mensajes.",
    "mision.jezero.sitio.pie-de-la-pared-sur.porque":
      "Aterrizaje movido que gasta mucha energía. Después, las paredes del cráter te protegen.",
    "mision.jezero.sitio.sobre-el-borde-oeste.porque":
      "Muy difícil de alcanzar. Allá arriba no hay sombras, así que tus paneles solares te lo devuelven.",
  },
};
