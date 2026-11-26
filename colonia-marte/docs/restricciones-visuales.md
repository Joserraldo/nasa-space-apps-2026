# Restricciones visuales

Una línea por restricción, con fecha. Se relee antes de cada ronda visual.
Lo que el usuario rechaza se anota aquí; una restricción repetida es un fallo del flujo.

Formato: `AAAA-MM-DD | pieza | restricción`

- 2026-11-25 | general | No usar ni imitar modelos concretos de los asset packs de referencia; solo el estilo (paleta, formas, luz).
- 2026-11-25 | spike comedor | Luz: "fallan un poquito" (aprobado en general). Revisar en T5.1 exposición de la lámpara anular, sombras de contacto y calidez. Precisar con María Paula.
- 2026-11-25 | personaje base T6.1 | Rechazado: cabeza chica con proporción adulta realista. Estilo A exige cabeza grande (1/4 a 1/5 de la altura) y facetada, estrechándose hacia la barbilla.
- 2026-11-25 | personaje base T6.1 | Rechazado: pelo plano tipo gorra. Debe ser masa voluminosa de 3 a 6 bloques grandes (coleta, moño, flequillo...).
- 2026-11-25 | personaje base T6.1 | Rechazado: franja de ojos que sobresale de la cara y parece bigote. Va embutida en la cara, a la altura de los ojos.
- 2026-11-25 | personaje base T6.1 | Rechazado: piernas tubulares largas, manos muñón, bordes en zigzag en las mangas, sin cuello alto ni insignia.
- 2026-11-25 | terreno WS2 | Rechazado: Jezero que se lee como plano liso con horizonte recto. Debe percibirse relieve y el borde del cráter.
- 2026-11-25 | ambientes WS2 | Rechazado: noche con suelo totalmente negro; polo con muy poco hielo.
- 2026-11-25 | kit interior | Rechazado: geometría extra (brazos de techo de 2 m, capitel de 4 brazos) agregada solo para pasar el validador.
- 2026-11-25 | personajes T6.1/T6.2 | Rechazado: anatomía no respetada (cuerpo armado con primitivas, sin topología anatómica). Malla continua en quads con loops en articulaciones, siguiendo la guía `_work/ref-anatomia/source/lowpoly_male_base_mesh-TPOSE.fbx` y fiel a las referencias de `docs/referencias/`.
- 2026-11-25 | Base A y Tess C4 | María Paula aprobó el cuerpo: conservar la topología, el rig y las proporciones.
- 2026-11-25 | Base A y Tess C5 | Corregir solo cara oscura sin rasgos, pelo tipo casco y botas que se leen como taco; mantener los ojos embutidos y la altura de cabeza. Tess: pelo castaño y rodete alto.
- 2026-11-25 | personajes femeninos después de C5 | Rechazado: «no se parece en nada» y «no sé por qué le estás añadiendo tantos cuadrados». Validar el parecido visual al lado de la referencia femenina `v1-t045.20`: cara de planos amplios y dos ojos oscuros, flequillo cobrizo y mechones largos. Para el estudio femenino se puede adaptar el cuerpo de `human-v1.zip` y usar `low-poly-female.zip` como guía de la cara.
- 2026-11-25 | estudio femenino (tripulante roja) | Rechazado: «siguen fallando cosas», «no se parece en nada». Diferencias medidas por el revisor: proporciones realistas y esbeltas en vez de juguete (cabeza chica, piernas largas, brazos finos, manos con dedos realistas); mechón asimétrico que cae sobre un ojo y frente tapada ausentes; ojos de párpado entornado reemplazados por óvalos; hombreras, botas y puños poco voluminosos.
- 2026-11-25 | Tess Q1 | Rechazado: pelo como casquete fino con rodete chico (falta el mechón diagonal grande sobre la frente y un costado, y el rodete grande); cara redonda, oscura, ojos de dormida; mono de maniquí con brazos finos; botas cortas con puño bajo. Se trabaja por partes con visto bueno en cada una.
- 2026-11-25 | personajes (estrategia) | Decisión de María Paula: usar los modelos de Quaternius como vienen; las alteraciones de malla (proporciones, pelo, cara) los empeoran. Permitido: recolorear con la paleta e intercambiar partes entre modelos de los packs. Prohibido: editar o esculpir la geometría.
- 2026-11-25 | exterior T3.1 | Rechazado: «se ve muy ficticio y los colores no me gustan». Edificios ocre/beige (la referencia v3-t054.60 es blanco y gris claro con gris oscuro y emisivos cian), cápsulas hexagonales con todos los paneles encendidos (en la referencia solo brillan los bordes y 1-2 ventanas), torre con vidrio verde, suelo salmón plano y uniforme, poco detalle (faltan tuberías con anillos cian, válvulas, rejillas, ventanas cian en los túneles).
- 2026-11-25 | cápsulas hexagonales MB-01 | Rechazado por María Paula: ventanas hexagonales iluminadas. Las cápsulas van de un solo color, sin emisivos (sin ventanas encendidas ni bordes luminosos); la lectura viene del facetado y la sombra.
- 2026-11-26 | CH-06 traje EVA | Rechazado por María Paula: «eso no parece traje de astronauta ni jetpack». El Spacesuit de Quaternius es una armadura sci-fi con casco tipo piloto. CH-06 necesita traje voluminoso, casco redondo con visor y mochila de soporte vital.
- 2026-11-26 | cápsulas MB-01 y domo MB-04 | Aprobado por María Paula: paneles de vidrio (M_glass) con interior visible. Se mantiene sin emisivos: nada de ventanas encendidas ni bordes luminosos.
- 2026-11-25 | UI infantil, primera versión | Rechazado por María Paula: «no se ve profesional, está terrible, busca más referencias que se vea más estético profesional». Que sea para niños no implica estética básica ni dibujos planos improvisados.
- 2026-11-25 | UI infantil, segunda versión | Rechazado por María Paula: «se ve cero profesional, busca referencias de UI». Un fondo 3D y gradientes no demuestran calidad de interfaz.
- 2026-11-26 | UI v3 HUD de juego | Aprobado por María Paula: cards oscuras con chaflán y línea continua, detalles discretos (regla, corchete, pestañas), Iris dentro de su card con medidor de arcos, mapa radar sin grilla de puntos.
- 2026-11-26 | UI v3 menú de pausa | Aprobado por María Paula: slab diagonal claro con tres opciones grandes escalonadas, barra oscura en la activa, PAUSED grande y card de misión sobre la escena desenfocada.
- 2026-11-26 | UI v3 diálogo de tripulación v1 | Rechazado por María Paula: «no me gustó el diálogo». Dirección pedida (referencia propia): una sola barra horizontal con esquinas cortadas, retrato sin card propia, línea divisoria, nombre en acento y rol en tipo oración, texto corto, tres respuestas con contorno e íconos grandes. «Usa más íconos, a los niños les gusta y entienden mejor».
- 2026-11-26 | T5.2 NW-14 refugio | Rechazado por María Paula: «se ve muy negro». Medido: brillo medio 74 contra 120 de la referencia, 49 % de píxeles oscuros contra 17 %. Las salas siguen a su referencia en brillo (±15) con un máximo de 25 % de píxeles oscuros; el refugio se distingue por tanques, puerta y ámbar de emergencia, no por estar a oscuras.
- 2026-11-26 | UI crew dialogue | María Paula pidió generar una mejor versión del diálogo de crew de la captura adjunta: "no me gusta". Revisar solo la conversación; conservar el resto del HUD y la escena. Propuesta nueva con retrato integrado, texto corto y tres respuestas grandes con iconos, pendiente de revisión.
