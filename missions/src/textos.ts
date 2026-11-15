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
 * Textos de la misión Luna polo sur (propuesta, docs/ideas/mision-luna-polo-sur.md). Inglés base, español después.
 * Ninguna cifra sin fuente: las de las tarjetas están citadas en missions/src/luna-polo-sur.ts.
 */
export const TEXTOS_LUNA_POLO_SUR: Record<Idioma, Record<string, string>> = {
  en: {
    "mision.luna.nombre": "Moon South Pole",
    "mision.luna.paso1": "Arrive at the Moon",
    "mision.luna.paso2": "Look for the shadows",
    "mision.luna.paso3": "Pick a landing spot",
    "mision.luna.paso4": "Build your base",
    "mision.luna.paso5": "A real solar storm is coming!",
    "mision.luna.paso6": "The ice trip: go on or go back?",
    "mision.luna.paso7": "Call Earth",
    "mision.luna.paso8": "What happened and why",
    "mision.luna.sitio.nobile.porque":
      "Lots of sunlight for the panels, but the ice is far away. Bringing water costs energy and time.",
    "mision.luna.sitio.shackleton.porque":
      "The Sun almost never shines here (about 1% of the time) and the ground is steep.",
    "mision.luna.sitio.faustini.porque":
      "The flattest place to land, but it's always in shadow.",
    "mision.luna.sitio.malapert.porque":
      "It gets more sun than the other craters (about 13% of the time), and from here you can see Earth almost half the time. But it is very steep.",
    "mision.luna.malasuerte.micrometeorito":
      "A tiny space rock hit a solar panel! Now it gives half the energy. This was bad luck, not your choice. Fix it, or keep going?",
    "mision.luna.dilema.pregunta": "The storm is here and your crew is halfway to the ice. What do you do?",
    "mision.luna.dilema.refugio":
      "Everyone back to the shelter now. The crew is safe, but no ice arrives and water keeps going down.",
    "mision.luna.dilema.expedicion":
      "Finish the trip and bring the ice. You get water, but the crew is outside during the storm.",
    "mision.luna.dilema.escudo": "Make the shield stronger and wait. It protects the base, but uses a lot of energy.",
    "mision.luna.ciencia.tormenta":
      "This storm is real. In September 2017, a NASA spacecraft flying around the Moon (not on the ground) measured one of the highest radiation values in our data.",
    "mision.luna.ciencia.terreno":
      "The height of the ground comes from real maps of the Moon's south pole. How steep each place is was calculated by our team from those heights.",
    "mision.luna.ciencia.panel": "The Moon gets the same amount of sunlight as Earth.",
    "mision.luna.ciencia.bateria":
      "One day and one night on the Moon together last about 29 and a half Earth days. Batteries keep energy for the dark.",
    "mision.luna.ciencia.reciclador": "Near the Moon's poles, some dark craters keep water ice that never sees the Sun.",
    "mision.luna.ciencia.escudo":
      "The Moon has almost no air to cover the ground. China's Chang'e-4 lander measured the radiation on the Moon's surface.",
    "mision.luna.ciencia.invernadero":
      "Plants can grow in space, but it is hard: they need a special closed chamber. On the Space Station, chile peppers grew for 137 days and gave 26 peppers.",
    "mision.luna.pregunta": "In September 2017, how much did radiation go up on Mars?",
    "mision.luna.pregunta.a": "About 2 times",
    "mision.luna.pregunta.b": "About 20 times",
    "mision.luna.pregunta.c": "About 200 times",
    "mision.luna.pregunta.explicacion":
      "On Mars, the RAD instrument on the Curiosity rover measured about 2 times more than on a calm day. Near the Moon, a NASA spacecraft in orbit measured one of the highest values in our data. Same storm, different places. Real curated data, not live.",
  },
  es: {
    "mision.luna.nombre": "Polo sur de la Luna",
    "mision.luna.paso1": "Llegar a la Luna",
    "mision.luna.paso2": "Busca las sombras",
    "mision.luna.paso3": "Elige dónde aterrizar",
    "mision.luna.paso4": "Arma tu base",
    "mision.luna.paso5": "¡Viene una tormenta solar real!",
    "mision.luna.paso6": "El viaje al hielo: ¿seguir o volver?",
    "mision.luna.paso7": "Llama a la Tierra",
    "mision.luna.paso8": "Qué pasó y por qué",
    "mision.luna.sitio.nobile.porque":
      "Mucho sol para los paneles, pero el hielo está lejos. Traer agua cuesta energía y tiempo.",
    "mision.luna.sitio.shackleton.porque":
      "Aquí casi nunca llega el Sol (cerca del 1 % del tiempo) y el suelo está inclinado.",
    "mision.luna.sitio.faustini.porque":
      "El lugar más plano para aterrizar, pero siempre está en sombra.",
    "mision.luna.sitio.malapert.porque":
      "Recibe más sol que los otros cráteres (cerca del 13 % del tiempo) y desde aquí se ve la Tierra casi la mitad del tiempo. Pero es muy empinado.",
    "mision.luna.malasuerte.micrometeorito":
      "¡Una piedrita del espacio golpeó un panel solar! Ahora da la mitad de energía. Esto fue mala suerte, no tu decisión. ¿Lo reparas o sigues así?",
    "mision.luna.dilema.pregunta": "La tormenta llegó y tu tripulación va a medio camino del hielo. ¿Qué haces?",
    "mision.luna.dilema.refugio":
      "Todos de vuelta al refugio ya. La tripulación queda a salvo, pero no llega hielo y el agua sigue bajando.",
    "mision.luna.dilema.expedicion":
      "Terminar el viaje y traer el hielo. Consigues agua, pero la tripulación queda afuera durante la tormenta.",
    "mision.luna.dilema.escudo": "Haz el escudo más fuerte y espera. Protege la base, pero gasta mucha energía.",
    "mision.luna.ciencia.tormenta":
      "Esta tormenta es real. En septiembre de 2017, una nave de NASA que vuela alrededor de la Luna (no en el suelo) midió uno de los valores de radiación más altos de nuestros datos.",
    "mision.luna.ciencia.terreno":
      "La altura del suelo sale de mapas reales del polo sur de la Luna. Qué tan inclinado es cada lugar lo calculó nuestro equipo a partir de esas alturas.",
    "mision.luna.ciencia.panel": "A la Luna le llega la misma cantidad de luz del Sol que a la Tierra.",
    "mision.luna.ciencia.bateria":
      "Un día y una noche en la Luna duran juntos unos 29 días y medio de la Tierra. Las baterías guardan energía para la oscuridad.",
    "mision.luna.ciencia.reciclador": "Cerca de los polos de la Luna, algunos cráteres oscuros guardan hielo de agua que nunca ve el Sol.",
    "mision.luna.ciencia.escudo":
      "La Luna casi no tiene aire que cubra el suelo. El módulo chino Chang'e-4 midió la radiación en la superficie de la Luna.",
    "mision.luna.ciencia.invernadero":
      "Las plantas pueden crecer en el espacio, pero es difícil: necesitan una cámara cerrada especial. En la Estación Espacial crecieron chiles durante 137 días y dieron 26.",
    "mision.luna.pregunta": "En septiembre de 2017, ¿cuánto subió la radiación en Marte?",
    "mision.luna.pregunta.a": "Unas 2 veces",
    "mision.luna.pregunta.b": "Unas 20 veces",
    "mision.luna.pregunta.c": "Unas 200 veces",
    "mision.luna.pregunta.explicacion":
      "En Marte, el instrumento RAD del rover Curiosity midió unas 2 veces más que en un día tranquilo. Cerca de la Luna, una nave de NASA en órbita midió uno de los valores más altos de nuestros datos. Misma tormenta, lugares distintos. Datos reales curados, no en vivo.",
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
    "mision.polo_norte.ciencia.panel": "In winter the Sun sits low and panels make less electricity. Tilting them toward the Sun helps, as NASA's Spirit rover did.",
    "mision.polo_norte.ciencia.bateria": "A lander's solar panels charge its batteries while the Sun shines. In the polar winter there is no Sun to charge them.",
    "mision.polo_norte.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.polo_norte.ciencia.escudo":
      "On the way to Mars, the RAD instrument on the Curiosity rover measured almost 3 times more radiation than later on the surface of Mars.",
    "mision.polo_norte.ciencia.invernadero":
      "Plants can grow in space, but it is hard: they need a special closed chamber. On the Space Station, chile peppers grew for 137 days and gave 26 peppers.",
    "mision.polo_norte.ciencia.hielo": "The ice cap that stays all year at Mars' north pole is mostly water ice.",
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
    "mision.polo_norte.ciencia.panel": "En invierno el Sol queda bajo y los paneles dan menos electricidad. Inclinarlos hacia el Sol ayuda, como hizo el róver Spirit de la NASA.",
    "mision.polo_norte.ciencia.bateria": "Los paneles de una sonda cargan sus baterías mientras brilla el Sol. En el invierno polar no hay Sol para cargarlas.",
    "mision.polo_norte.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.polo_norte.ciencia.escudo":
      "En el viaje a Marte, el instrumento RAD del rover Curiosity midió casi 3 veces más radiación que después en la superficie de Marte.",
    "mision.polo_norte.ciencia.invernadero":
      "Las plantas pueden crecer en el espacio, pero es difícil: necesitan una cámara cerrada especial. En la Estación Espacial crecieron chiles durante 137 días y dieron 26.",
    "mision.polo_norte.ciencia.hielo": "El casquete que dura todo el año en el polo norte de Marte es sobre todo hielo de agua.",
    "mision.polo_norte.pregunta": "Sin Sol en el polo: ¿de dónde sale la energía?",
    "mision.polo_norte.pregunta.a": "Del hielo",
    "mision.polo_norte.pregunta.b": "De la batería que cargamos antes",
    "mision.polo_norte.pregunta.c": "De la tormenta",
    "mision.polo_norte.pregunta.explicacion":
      "Los paneles solo funcionan con luz del Sol. Lo que guardamos antes de la noche mantiene la base.",
  },
};

/**
 * Textos de la misión "outpost sorpresa" (la nave camino a la Luna). Inglés base, español segunda lengua.
 * Las cifras con fuente están citadas en missions/src/outpost-sorpresa.ts.
 */
export const TEXTOS_OUTPOST_SORPRESA: Record<Idioma, Record<string, string>> = {
  en: {
    "mision.outpost.nombre": "Surprise Outpost: the deep-space ship",
    "mision.outpost.paso1": "Surprise! There is no ground here",
    "mision.outpost.paso2": "Point the ship",
    "mision.outpost.paso3": "Pick where the crew lives",
    "mision.outpost.paso4": "Build two modules",
    "mision.outpost.paso5": "A real solar storm is coming!",
    "mision.outpost.paso6": "Two experts disagree",
    "mision.outpost.paso7": "Send data to Earth",
    "mision.outpost.paso8": "What happened and why",
    "mision.outpost.zona.cabina.porque": "Cabin: lots of room and close to the controls, but thin walls.",
    "mision.outpost.zona.centro.porque": "Middle: packed with supply bags that protect you, but very little room.",
    "mision.outpost.zona.fondo.porque": "Bottom: next to the heat shield, well protected, but far from the controls.",
    "mision.outpost.micrometeorito":
      "A tiny space rock hit a solar panel! It now makes only half the power. Fix it on a spacewalk, or keep going with less power?",
    "mision.outpost.dilema.pregunta": "The storm is here. What do you do?",
    "mision.outpost.dilema.refugio":
      "Build the shelter now: stack the water and food bags around the crew. You are safer, but the supplies are hard to reach.",
    "mision.outpost.dilema.escudo": "Make the shield stronger. It protects the ship, but it uses a lot of energy.",
    "mision.outpost.dilema.aguantar": "Wait it out. It costs almost nothing now, but the radiation keeps hitting the ship.",
    "mision.outpost.ciencia.orion":
      "A real spaceship, Orion, carried a radiation meter around the Moon in 2022. Most days were calm.",
    "mision.outpost.ciencia.tormenta":
      "This storm is real. In May 2024 the Sun shot out a big flare, then a cloud of particles traveled through space.",
    "mision.outpost.ciencia.crater":
      "In orbit around the Moon, a NASA instrument measured about 206 times more radiation than before this storm. It was not on your ship.",
    "mision.outpost.ciencia.panel": "Far from any planet, the ship gets its power from sunlight.",
    "mision.outpost.ciencia.bateria": "A battery stores energy while the solar panels get sunlight, and gives it back when the panels are in shade.",
    "mision.outpost.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.outpost.ciencia.escudo": "On Orion, astronauts can build a shelter from the bags of supplies and water on board. The more stuff around you, the more it protects you.",
    "mision.outpost.ciencia.antena": "From near the Moon, a radio message reaches Earth in about one second.",
    "mision.outpost.pregunta":
      "An instrument called RAD, on the Curiosity rover, measured radiation on the way to Mars and on the ground of Mars. Where did it measure more each day?",
    "mision.outpost.pregunta.a": "On the way, inside the spaceship",
    "mision.outpost.pregunta.b": "On the ground of Mars",
    "mision.outpost.pregunta.c": "The same in both",
    "mision.outpost.pregunta.explicacion":
      "On the way: about 1.84 mSv per day. On the ground: about 0.64. Almost 3 times as much in space!",
  },
  es: {
    "mision.outpost.nombre": "Puesto sorpresa: la nave del espacio profundo",
    "mision.outpost.paso1": "¡Sorpresa! Aquí no hay suelo",
    "mision.outpost.paso2": "Orienta la nave",
    "mision.outpost.paso3": "Elige dónde vive la tripulación",
    "mision.outpost.paso4": "Construye dos módulos",
    "mision.outpost.paso5": "¡Llega una tormenta solar real!",
    "mision.outpost.paso6": "Dos expertos no están de acuerdo",
    "mision.outpost.paso7": "Envía datos a la Tierra",
    "mision.outpost.paso8": "Qué pasó y por qué",
    "mision.outpost.zona.cabina.porque": "Cabina: mucho espacio y cerca de los controles, pero paredes delgadas.",
    "mision.outpost.zona.centro.porque": "Centro: lleno de bolsas de provisiones que te protegen, pero casi sin espacio.",
    "mision.outpost.zona.fondo.porque": "Fondo: junto al escudo térmico, bien protegido, pero lejos de los controles.",
    "mision.outpost.micrometeorito":
      "¡Una piedrita espacial golpeó un panel solar! Ahora da solo la mitad de energía. ¿Lo arreglas en una salida al exterior, o sigues con menos energía?",
    "mision.outpost.dilema.pregunta": "La tormenta llegó. ¿Qué haces?",
    "mision.outpost.dilema.refugio":
      "Arma el refugio ya: apila las bolsas de agua y comida alrededor de la tripulación. Quedan más protegidos, pero las provisiones quedan difíciles de alcanzar.",
    "mision.outpost.dilema.escudo": "Haz el escudo más fuerte. Protege la nave, pero gasta mucha energía.",
    "mision.outpost.dilema.aguantar": "Aguantar. Ahora casi no cuesta nada, pero la radiación sigue golpeando la nave.",
    "mision.outpost.ciencia.orion":
      "Una nave real, Orion, llevó un medidor de radiación alrededor de la Luna en 2022. Casi todos los días fueron tranquilos.",
    "mision.outpost.ciencia.tormenta":
      "Esta tormenta es real. En mayo de 2024 el Sol lanzó una gran llamarada y después una nube de partículas viajó por el espacio.",
    "mision.outpost.ciencia.crater":
      "En órbita alrededor de la Luna, un instrumento de NASA midió unas 206 veces más radiación que antes de esta tormenta. No fue en tu nave.",
    "mision.outpost.ciencia.panel": "Lejos de cualquier planeta, la nave saca su energía de la luz del Sol.",
    "mision.outpost.ciencia.bateria": "Una batería guarda energía mientras los paneles reciben sol, y la devuelve cuando los paneles quedan a la sombra.",
    "mision.outpost.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.outpost.ciencia.escudo": "En Orion, los astronautas pueden armar un refugio con las bolsas de provisiones y agua. Mientras más cosas tengas alrededor, más te protegen.",
    "mision.outpost.ciencia.antena": "Desde cerca de la Luna, un mensaje de radio llega a la Tierra en más o menos un segundo.",
    "mision.outpost.pregunta":
      "Un instrumento llamado RAD, en el rover Curiosity, midió la radiación en el viaje a Marte y en el suelo de Marte. ¿Dónde midió más cada día?",
    "mision.outpost.pregunta.a": "En el viaje, dentro de la nave",
    "mision.outpost.pregunta.b": "En el suelo de Marte",
    "mision.outpost.pregunta.c": "Igual en los dos",
    "mision.outpost.pregunta.explicacion":
      "En el viaje: unos 1,84 mSv por día. En el suelo: unos 0,64. ¡Casi 3 veces más en el espacio!",
  },
};
