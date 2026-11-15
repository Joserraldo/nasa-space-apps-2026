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
    "mision.jezero.polvo":
      "Dust covered the solar panels: they now give half the energy. Clean them on a spacewalk, or keep going with less power?",
    "mision.jezero.dilema.pregunta": "The storm is here. What do you do?",
    "mision.jezero.dilema.refugio":
      "Everyone to the shelter and switch off the greenhouse. The crew is safe, but tomorrow there is less food.",
    "mision.jezero.dilema.escudo": "Make the shield stronger. It protects the base, but it uses a lot of energy.",
    "mision.jezero.dilema.aguantar": "Wait it out. It costs almost nothing now, but the radiation keeps hitting the base.",
    "mision.jezero.ciencia.tormenta":
      "This storm is real. In May 2024 the Curiosity rover measured the radiation rising on the surface of Mars.",
    "mision.jezero.ciencia.terreno":
      "The height of the ground comes from real maps of Mars. How steep each place is was calculated by our team from those heights.",
    "mision.jezero.ciencia.panel": "Dust on solar panels blocks sunlight, so they make less electricity until someone cleans them.",
    "mision.jezero.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.jezero.ciencia.invernadero":
      "Plants can grow in space, but it is hard: they need a special closed chamber. On the Space Station, chile peppers grew for 137 days and gave 26 peppers.",
    "mision.jezero.ciencia.escudo":
      "On the way to Mars, the RAD instrument on the Curiosity rover measured almost 3 times more radiation than later on the surface of Mars.",
    "mision.jezero.ciencia.antena": "Radio messages travel at the speed of light, but Mars is so far away that they take minutes to reach Earth.",
    "mision.jezero.pregunta": "Why could the solar storm make Iris give wrong numbers?",
    "mision.jezero.pregunta.a": "Because it got very cold",
    "mision.jezero.pregunta.b": "Because radiation can scramble computer chips",
    "mision.jezero.pregunta.c": "Because dust got inside her",
    "mision.jezero.pregunta.explicacion":
      "Particles from the Sun can hit computer chips and change the data inside. That's why the crew checks before trusting a machine.",
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
    "mision.jezero.polvo":
      "El polvo cubrió los paneles solares: ahora dan la mitad de energía. ¿Los limpias en una salida al exterior, o sigues con menos energía?",
    "mision.jezero.dilema.pregunta": "La tormenta llegó. ¿Qué haces?",
    "mision.jezero.dilema.refugio":
      "Todos al refugio y apaguen el invernadero. La tripulación queda a salvo, pero mañana habrá menos comida.",
    "mision.jezero.dilema.escudo": "Haz el escudo más fuerte. Protege la base, pero gasta mucha energía.",
    "mision.jezero.dilema.aguantar": "Aguantar. Ahora casi no cuesta nada, pero la radiación sigue golpeando la base.",
    "mision.jezero.ciencia.tormenta":
      "Esta tormenta es real. En mayo de 2024, el rover Curiosity midió cómo subía la radiación en la superficie de Marte.",
    "mision.jezero.ciencia.terreno":
      "La altura del suelo sale de mapas reales de Marte. Qué tan inclinado es cada lugar lo calculó nuestro equipo a partir de esas alturas.",
    "mision.jezero.ciencia.panel": "El polvo sobre los paneles solares tapa la luz, así que dan menos electricidad hasta que alguien los limpia.",
    "mision.jezero.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.jezero.ciencia.invernadero":
      "Las plantas pueden crecer en el espacio, pero es difícil: necesitan una cámara cerrada especial. En la Estación Espacial crecieron chiles durante 137 días y dieron 26.",
    "mision.jezero.ciencia.escudo":
      "En el viaje a Marte, el instrumento RAD del rover Curiosity midió casi 3 veces más radiación que después en la superficie de Marte.",
    "mision.jezero.ciencia.antena": "Los mensajes de radio viajan a la velocidad de la luz, pero Marte está tan lejos que tardan minutos en llegar a la Tierra.",
    "mision.jezero.pregunta": "¿Por qué la tormenta solar pudo hacer que Iris diera números equivocados?",
    "mision.jezero.pregunta.a": "Porque hizo mucho frío",
    "mision.jezero.pregunta.b": "Porque la radiación puede desordenar los chips de una computadora",
    "mision.jezero.pregunta.c": "Porque le entró polvo",
    "mision.jezero.pregunta.explicacion":
      "Las partículas del Sol pueden golpear los chips de una computadora y cambiar los datos que tienen. Por eso la tripulación verifica antes de confiar en una máquina.",
  },
};

/**
 * Textos de la misión Marte polo norte (propuesta de datos §8, recortados para niños).
 * Regla: la tormenta se midió en el cráter Gale, nunca "aquí en el polo". Sin cifras inventadas.
 */
export const TEXTOS_MARTE_POLO_NORTE: Record<Idioma, Record<string, string>> = {
  en: {
    "mision.polo_norte.nombre": "North Pole Base, Mars",
    "mision.polo_norte.paso1": "Release the satellite over the pole",
    "mision.polo_norte.paso2": "Charge the battery before landing?",
    "mision.polo_norte.paso3": "Pick a place. Closer to the pole: more ice, less Sun",
    "mision.polo_norte.paso4": "Build two modules",
    "mision.polo_norte.paso5": "A real solar storm is coming!",
    "mision.polo_norte.paso6": "Use the battery or save it?",
    "mision.polo_norte.paso7": "Night falls: send data to Earth",
    "mision.polo_norte.paso8": "What happened and why",
    "mision.polo_norte.sitio.crater-louth.porque": "Lots of Sun for the panels, but the ice is far away.",
    "mision.polo_norte.sitio.crater-escorial.porque": "Your supply drop lands here. Not much Sun, not much ice.",
    "mision.polo_norte.sitio.canon-chasma-boreale.porque": "The ice is right next to you, but the panels barely work.",
    "mision.polo_norte.escarcha":
      "Frost on the panels! They make half the energy. Clean them on a spacewalk, or keep going with less power?",
    "mision.polo_norte.dilema.pregunta": "Use the battery for the shield, or save it for the dark?",
    "mision.polo_norte.dilema.refugio": "Everyone to the shelter. The battery is saved, but the crew uses more air and supplies.",
    "mision.polo_norte.dilema.escudo": "Power up the shield. It protects the base, but the battery will be low when night comes.",
    "mision.polo_norte.dilema.guardar": "Save the battery for the night. The energy stays, but the radiation keeps hitting the base.",
    "mision.polo_norte.noche": "The polar night begins. The Sun won't rise for a long time.",
    "mision.polo_norte.tormenta.donde":
      "A real storm from May 20, 2024. The Curiosity rover measured it in Gale Crater, far from the pole.",
    "mision.polo_norte.tiempo": "In the game, seasons go fast. A real year on Mars is almost two Earth years.",
    "mision.polo_norte.ciencia.eje": "Mars is tilted, like Earth. That's why near the pole there are days with no Sun at all.",
    "mision.polo_norte.ciencia.terreno":
      "The height of the ground comes from real maps of Mars. How steep each place is was calculated by our team from those heights.",
    "mision.polo_norte.ciencia.panel": "When the Sun is low in the sky, solar panels make less electricity.",
    "mision.polo_norte.ciencia.bateria": "Solar energy must be saved while the Sun shines.",
    "mision.polo_norte.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.polo_norte.ciencia.escudo":
      "On the way to Mars, the RAD instrument on the Curiosity rover measured almost 3 times more radiation than later on the surface of Mars.",
    "mision.polo_norte.ciencia.invernadero":
      "Plants can grow in space, but it is hard: they need a special closed chamber. On the Space Station, chile peppers grew for 137 days and gave 26 peppers.",
    "mision.polo_norte.ciencia.hielo": "The ice cap at Mars' north pole is mostly water ice.",
    "mision.polo_norte.pregunta": "No Sun at the pole: where does the energy come from?",
    "mision.polo_norte.pregunta.a": "From the ice",
    "mision.polo_norte.pregunta.b": "From the battery we charged before",
    "mision.polo_norte.pregunta.c": "From the storm",
    "mision.polo_norte.pregunta.explicacion":
      "The panels only work with sunlight. What we saved before the night keeps the base going.",
  },
  es: {
    "mision.polo_norte.nombre": "Base del Polo Norte, Marte",
    "mision.polo_norte.paso1": "Suelta el satélite sobre el polo",
    "mision.polo_norte.paso2": "¿Cargamos la batería antes de bajar?",
    "mision.polo_norte.paso3": "Elige un lugar. Más cerca del polo: más hielo, menos Sol",
    "mision.polo_norte.paso4": "Construye dos módulos",
    "mision.polo_norte.paso5": "¡Llega una tormenta solar real!",
    "mision.polo_norte.paso6": "¿Usamos la batería o la guardamos?",
    "mision.polo_norte.paso7": "Llega la noche: envía datos a la Tierra",
    "mision.polo_norte.paso8": "Qué pasó y por qué",
    "mision.polo_norte.sitio.crater-louth.porque": "Mucho Sol para los paneles, pero el hielo queda lejos.",
    "mision.polo_norte.sitio.crater-escorial.porque": "Aquí cae tu carga de provisiones. Ni mucho Sol ni mucho hielo.",
    "mision.polo_norte.sitio.canon-chasma-boreale.porque": "El hielo está al lado, pero los paneles casi no funcionan.",
    "mision.polo_norte.escarcha":
      "¡Escarcha en los paneles! Dan la mitad de energía. ¿Los limpias en una salida al exterior, o sigues con menos energía?",
    "mision.polo_norte.dilema.pregunta": "¿Usamos la batería para el escudo o la guardamos para la oscuridad?",
    "mision.polo_norte.dilema.refugio": "Todos al refugio. La batería se guarda, pero la tripulación gasta más aire y provisiones.",
    "mision.polo_norte.dilema.escudo": "Sube el escudo. Protege la base, pero la batería quedará baja cuando llegue la noche.",
    "mision.polo_norte.dilema.guardar": "Guarda la batería para la noche. La energía se queda, pero la radiación sigue golpeando la base.",
    "mision.polo_norte.noche": "Empieza la noche polar. El Sol no saldrá en mucho tiempo.",
    "mision.polo_norte.tormenta.donde":
      "Una tormenta real del 20 de mayo de 2024. El rover Curiosity la midió en el cráter Gale, lejos del polo.",
    "mision.polo_norte.tiempo": "En el juego las estaciones pasan rápido. Un año de verdad en Marte dura casi dos años de la Tierra.",
    "mision.polo_norte.ciencia.eje": "Marte está inclinado, como la Tierra. Por eso cerca del polo hay días sin nada de Sol.",
    "mision.polo_norte.ciencia.terreno":
      "La altura del suelo sale de mapas reales de Marte. Qué tan inclinado es cada lugar lo calculó nuestro equipo a partir de esas alturas.",
    "mision.polo_norte.ciencia.panel": "Cuando el Sol está bajito en el cielo, los paneles solares dan menos electricidad.",
    "mision.polo_norte.ciencia.bateria": "La energía del Sol hay que guardarla mientras brilla.",
    "mision.polo_norte.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.polo_norte.ciencia.escudo":
      "En el viaje a Marte, el instrumento RAD del rover Curiosity midió casi 3 veces más radiación que después en la superficie de Marte.",
    "mision.polo_norte.ciencia.invernadero":
      "Las plantas pueden crecer en el espacio, pero es difícil: necesitan una cámara cerrada especial. En la Estación Espacial crecieron chiles durante 137 días y dieron 26.",
    "mision.polo_norte.ciencia.hielo": "El casquete del polo norte de Marte es sobre todo hielo de agua.",
    "mision.polo_norte.pregunta": "Sin Sol en el polo: ¿de dónde sale la energía?",
    "mision.polo_norte.pregunta.a": "Del hielo",
    "mision.polo_norte.pregunta.b": "De la batería que cargamos antes",
    "mision.polo_norte.pregunta.c": "De la tormenta",
    "mision.polo_norte.pregunta.explicacion":
      "Los paneles solo funcionan con luz del Sol. Lo que guardamos antes de la noche mantiene la base.",
  },
};
