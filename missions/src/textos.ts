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
 * Textos de la misión Luna lado visible (propuesta docs/ideas/mision-luna-lado-visible.md).
 * Inglés es la base; español, la segunda lengua. Fuentes de cada cifra: luna-lado-visible.ts.
 */
export const TEXTOS_LUNA_VISIBLE: Record<Idioma, Record<string, string>> = {
  en: {
    "mision.lunaVisible.nombre": "Moon Base: The Long Night",
    "mision.lunaVisible.paso1": "Earth is right above you! It never moves far from that spot.",
    "mision.lunaVisible.paso2": "It's night down there. Draw a path for the lander.",
    "mision.lunaVisible.paso3": "Pick a place to land. Each one is good at something different.",
    "mision.lunaVisible.paso4": "Build 2 modules. Remember: no sunlight until morning!",
    "mision.lunaVisible.paso5": "A real solar storm from May 2024 is coming!",
    "mision.lunaVisible.paso6": "The crew doesn't agree. What do we do?",
    "mision.lunaVisible.paso7": "Call Earth! On the Moon, the answer comes in about one second.",
    "mision.lunaVisible.paso8": "Sunrise! You made it through the night.",
    "mision.lunaVisible.sitio.llanura-tranquilidad.porque":
      "Flat and the Sun comes up here first, but there is nothing around to block the storm. Apollo 11 landed here!",
    "mision.lunaVisible.sitio.tierras-altas-descartes.porque":
      "Bumpy hills, a bit of everything. Earth is almost straight above you. Apollo 16 landed here!",
    "mision.lunaVisible.sitio.borde-rima-hadley.porque":
      "Big mountains block part of the sky, but landing is harder and the Sun comes up last. Apollo 15 landed here!",
    "mision.lunaVisible.malaSuerte.antena": "Oh no, the antenna broke! We can't talk to Earth until someone fixes it.",
    "mision.lunaVisible.tormenta.aviso": "Real data from May 2024 (curated, not live): a big storm hit Earth and the Moon.",
    "mision.lunaVisible.tormenta.crater":
      "A NASA spacecraft in orbit around the Moon, not on the ground, measured about 200 times more radiation than on a normal day.",
    "mision.lunaVisible.dilema.pregunta": "The storm is here and the Sun won't rise for days. What do we use the battery for?",
    "mision.lunaVisible.dilema.refugio": "Go to the shelter. The crew is safer, but it uses air, water and some energy.",
    "mision.lunaVisible.dilema.escudo": "Put the shield up. It protects the base, but it drains the battery, and it won't recharge tonight.",
    "mision.lunaVisible.dilema.ahorrar": "Save the battery for the night. You keep energy, but the radiation keeps hitting the base.",
    "mision.lunaVisible.dilema.tierra": "Ask Earth for advice. The answer comes fast, but calling uses energy now.",
    "mision.lunaVisible.ciencia.tresLugares":
      "The same storm from May 2024: on Earth it reached Kp 9 (a number measured on Earth). In orbit around the Moon, not on the ground, radiation went up about 200 times. On Mars, almost nothing changed. Same storm, different places!",
    "mision.lunaVisible.ciencia.nocheTormenta":
      "When this storm arrived, it was night at all three Apollo sites. The Sun rose there again about 4 to 6 days later.",
    "mision.lunaVisible.ciencia.terreno":
      "The height of the ground comes from real maps of the Moon. How steep each place is was calculated by our team from those heights.",
    "mision.lunaVisible.ciencia.noche": "A night on the Moon lasts about 15 Earth days, and it gets colder than −170 °C.",
    "mision.lunaVisible.ciencia.panel":
      "The Moon gets as much sunlight as Earth, but only during its long day. At night, solar panels make nothing.",
    "mision.lunaVisible.ciencia.regolito": "Moon dust and rocks (regolith) piled on top of a base can help block radiation.",
    "mision.lunaVisible.ciencia.antena": "The Moon is so close that a radio message reaches Earth in about 1.3 seconds.",
    "mision.lunaVisible.ciencia.reciclador": "Astronauts recycle water again and again. Water doesn't appear out of nowhere.",
    "mision.lunaVisible.pregunta": "Why can you get help from Earth almost right away on the Moon, but not on Mars?",
    "mision.lunaVisible.pregunta.a": "The Moon is much closer, so messages arrive in about a second.",
    "mision.lunaVisible.pregunta.b": "Earth only listens to the Moon.",
    "mision.lunaVisible.pregunta.c": "Radios on Mars are older.",
    "mision.lunaVisible.pregunta.explicacion":
      "Messages travel at the speed of light. From the Moon that takes about 1.3 seconds; from Mars, 3 to 22 minutes.",
  },
  es: {
    "mision.lunaVisible.nombre": "Base lunar: la noche larga",
    "mision.lunaVisible.paso1": "¡La Tierra está justo arriba! Casi nunca se mueve de ahí.",
    "mision.lunaVisible.paso2": "Allá abajo es de noche. Dibuja el camino del módulo.",
    "mision.lunaVisible.paso3": "Elige dónde aterrizar. Cada lugar es bueno en algo distinto.",
    "mision.lunaVisible.paso4": "Construye 2 módulos. Recuerda: ¡no hay sol hasta la mañana!",
    "mision.lunaVisible.paso5": "¡Llega una tormenta solar real de mayo de 2024!",
    "mision.lunaVisible.paso6": "La tripulación no se pone de acuerdo. ¿Qué hacemos?",
    "mision.lunaVisible.paso7": "¡Llama a la Tierra! Desde la Luna, la respuesta llega en un segundo, más o menos.",
    "mision.lunaVisible.paso8": "¡Amanece! Aguantaron toda la noche.",
    "mision.lunaVisible.sitio.llanura-tranquilidad.porque":
      "Plano y aquí sale el sol primero, pero no hay nada alrededor que tape la tormenta. ¡Aquí aterrizó el Apolo 11!",
    "mision.lunaVisible.sitio.tierras-altas-descartes.porque":
      "Lomas con baches, un poco de todo. La Tierra queda casi encima. ¡Aquí aterrizó el Apolo 16!",
    "mision.lunaVisible.sitio.borde-rima-hadley.porque":
      "Grandes montañas tapan parte del cielo, pero aterrizar es más difícil y el sol sale de último. ¡Aquí aterrizó el Apolo 15!",
    "mision.lunaVisible.malaSuerte.antena": "¡Oh, no, se dañó la antena! No podemos hablar con la Tierra hasta que alguien la arregle.",
    "mision.lunaVisible.tormenta.aviso": "Datos reales de mayo de 2024 (curados, no en vivo): una gran tormenta llegó a la Tierra y a la Luna.",
    "mision.lunaVisible.tormenta.crater":
      "Una nave de NASA en órbita alrededor de la Luna, no en el suelo, midió unas 200 veces más radiación que en un día normal.",
    "mision.lunaVisible.dilema.pregunta": "La tormenta llegó y el sol no sale en varios días. ¿Para qué usamos la batería?",
    "mision.lunaVisible.dilema.refugio": "Ir al refugio. La tripulación está más segura, pero gasta aire, agua y algo de energía.",
    "mision.lunaVisible.dilema.escudo": "Subir el escudo. Protege la base, pero vacía la batería, y esta noche no se recarga.",
    "mision.lunaVisible.dilema.ahorrar": "Guardar la batería para la noche. Conservas energía, pero la radiación sigue golpeando la base.",
    "mision.lunaVisible.dilema.tierra": "Pedir consejo a la Tierra. La respuesta llega rápido, pero llamar gasta energía ya.",
    "mision.lunaVisible.ciencia.tresLugares":
      "La misma tormenta de mayo de 2024: en la Tierra llegó a Kp 9 (un número que se mide en la Tierra). En órbita alrededor de la Luna, no en el suelo, la radiación subió unas 200 veces. En Marte casi no cambió nada. ¡Misma tormenta, lugares distintos!",
    "mision.lunaVisible.ciencia.nocheTormenta":
      "Cuando llegó esta tormenta, era de noche en los tres sitios Apolo. Allí el sol volvió a salir entre 4 y 6 días después.",
    "mision.lunaVisible.ciencia.terreno":
      "La altura del suelo sale de mapas reales de la Luna. Qué tan inclinado es cada lugar lo calculó nuestro equipo a partir de esas alturas.",
    "mision.lunaVisible.ciencia.noche": "Una noche en la Luna dura unos 15 días de la Tierra y hace más frío que −170 °C.",
    "mision.lunaVisible.ciencia.panel":
      "A la Luna llega tanta luz del Sol como a la Tierra, pero solo durante su día largo. De noche, los paneles solares no dan nada.",
    "mision.lunaVisible.ciencia.regolito": "El polvo y las piedras de la Luna (regolito) apilados encima de una base ayudan a frenar la radiación.",
    "mision.lunaVisible.ciencia.antena": "La Luna está tan cerca que un mensaje de radio llega a la Tierra en unos 1,3 segundos.",
    "mision.lunaVisible.ciencia.reciclador": "Los astronautas reciclan el agua una y otra vez. El agua no aparece de la nada.",
    "mision.lunaVisible.pregunta": "¿Por qué desde la Luna recibes ayuda de la Tierra casi al instante y desde Marte no?",
    "mision.lunaVisible.pregunta.a": "La Luna está mucho más cerca: los mensajes llegan en un segundo, más o menos.",
    "mision.lunaVisible.pregunta.b": "La Tierra solo escucha a la Luna.",
    "mision.lunaVisible.pregunta.c": "Las radios de Marte son más viejas.",
    "mision.lunaVisible.pregunta.explicacion":
      "Los mensajes viajan a la velocidad de la luz. Desde la Luna tardan unos 1,3 segundos; desde Marte, de 3 a 22 minutos.",
  },
};
