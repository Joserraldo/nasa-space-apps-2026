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
    "mision.outpost.ciencia.bateria": "A battery saves energy now so you can use it later, like during a storm.",
    "mision.outpost.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.outpost.ciencia.escudo": "In space there is no ground to hide behind. The more stuff around you, the more it protects you.",
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
    "mision.outpost.ciencia.bateria": "Una batería guarda energía ahora para usarla después, por ejemplo durante una tormenta.",
    "mision.outpost.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.outpost.ciencia.escudo": "En el espacio no hay suelo para esconderse. Mientras más cosas tengas alrededor, más te protegen.",
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
