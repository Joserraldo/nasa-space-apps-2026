# Decisiones del proyecto visual

Registro de decisiones tomadas. Cada una dice quién la tomó, cuándo y por qué.
Para cambiar una, se agrega una nueva que la reemplaza; no se borra la anterior.

---

## DV-01. Campaña principal de 5 capítulos en Marte

- **Fecha:** 2026-11-25 · **Decide:** María Paula (dueña de ui e historia)
- **Qué:** la campaña principal es la de `DISENO-JUEGO.md` §4.1 (El viaje, Llegada
  a Jezero, Comida para todos, La gran tormenta de polvo, Silencio con la Tierra,
  y el final con la llegada de las familias). Premisa: preparar la colonia para
  las familias que llegan en 100 soles.
- **Misiones lunares:** quedan **aparte**, como misiones extra fuera de la campaña
  principal (opción A de `DISENO-JUEGO.md` §4.3).
- **Pendiente fuera de este repo:** comunicarlo al equipo del juego (diseño:
  Camilo; orquestación: Santiago), porque cambia `NIVELES.md` del repo del juego.

## DV-02. La tripulación tiene nombre

- **Fecha:** 2026-11-25 · **Decide:** María Paula
- **Qué:** se reemplaza "llamarlas por su rol" (D7 del repo del juego). Nombres
  cortos, de dos sílabas, pronunciables igual en inglés y en español, sin
  referencias a franquicias:

| Rol | Nombre | Por qué funciona |
|---|---|---|
| Ingeniera | **Tess** | Corto, suena firme y práctico |
| Doctora de radiación | **Nia** | Suave, cercano, fácil para 7 años |
| Meteoróloga solar | **Vera** | Recuerda "ver" y "verano"; dramático sin ser raro |
| Matemático | **Teo** | Corto, amigable |
| IA de la base | **Iris** | Se mantiene |

- Los nombres **no se verificaron contra marcas registradas**; antes de publicar
  conviene una búsqueda rápida. En el juego se presentan con su rol la primera
  vez: "Tess, the engineer".

## DV-03. Stack visual híbrido: Three.js para todo, Blender solo para personajes

- **Fecha:** 2026-11-25 · **Decide:** María Paula, con la recomendación técnica de abajo
- **Contexto:** la D6 del repo del juego prohibía Blender y GLB; María Paula
  indicó ignorar esa restricción y usar Blender **solo si es muy necesario**.
- **Evidencia (evaluación de `mars-base-three`, 2026-11-25):**
  - Resultado actual: colonia completa con exterior, 9 salas, polo norte con
    rover, caminata con joystick. Buen punto de partida funcional.
  - Por qué no se parece a las referencias, medido en el código:
    - Geometría: 531 `BoxGeometry` y 341 `CylinderGeometry` sin bisel; las
      referencias se leen por chaflanes, paneles en relieve y molduras.
    - Luz: sin postproceso (0 `EffectComposer`, 0 bloom, 0 oclusión ambiental);
      las referencias dependen de AO, bloom en tiras LED y contraste blanco/negro/cian.
    - Paleta: beige y marrón en todo, la luz naranja del exterior tiñe los interiores.
    - Materiales: unas 252 instancias de material creadas en el código; impide fusionar e instanciar.
    - Personajes: cápsulas lisas y trajes realistas; las referencias usan cabezas
      facetadas grandes y ropa en bloques (estilo A).
    - Interiores colocados a mano, no sobre una rejilla: la cámara de "Tech Lab"
      muestra el invernadero y la de "Dormitory" arranca pegada a una pared.
    - Mantenibilidad: unas 24.400 líneas, archivos de hasta 1.547 líneas, sin git.
  - Rendimiento medido en la vista exterior: 263 llamadas de dibujo y unos
    530.000 triángulos por fotograma (dentro del presupuesto). Los FPS no se
    pudieron medir porque el panel del navegador estaba oculto.
- **Conclusión:** la distancia con las referencias es de **técnica**, no de
  herramienta. Bisel, paleta única, AO, bloom y kit modular sobre rejilla se
  logran con Three.js. Donde Blender sí marca diferencia es en **personajes
  deformables**: pesos automáticos de piel, modificadores y animación por keyframes.
- **Decisión:**

| Qué | Herramienta |
|---|---|
| Arquitectura, salas, mobiliario, props, edificios, vehículos, Iris (rover rígido), terreno, cielo | **Three.js procedural** (TypeScript), con un kit de primitivas biseladas |
| Oclusión ambiental | `n8ao` en tiempo real + AO por vértice precalculada en un paso de build con `three-mesh-bvh` |
| Personajes humanos estilo A (tripulación, jugador, astronauta EVA) | **Blender headless (`bpy`)** → GLB con esqueleto y animaciones. `mars-base-three` ya tiene un `kid_astronaut.blend` |
| Lightmaps horneados | **No** por defecto. Solo si la AO en tiempo real no alcanza en el gate de la sala piloto |

- **Reutilizar de `mars-base-three`:** controlador de modos de navegación,
  joystick virtual, optimizador para celular, ideas de contenido de las 9 salas,
  terreno y rover polar. Se migran al nuevo kit modular; no se sigue ese código tal cual.

## DV-04. Todo es modular

- **Fecha:** 2026-11-25 · **Decide:** María Paula
- **Qué:** arquitectura en capas, de átomo a escena (ver
  `ESPECIFICACION-TECNICA.md` §2). Cada asset es una función pura registrada por
  su ID del inventario; las salas y la colonia se arman con datos (JSON) sobre
  una rejilla, no a mano.

## DV-05. Las referencias se conservan

- **Fecha:** 2026-11-25 · **Decide:** María Paula
- **Qué:** `docs/referencias/` (96 fotogramas nítidos de los 3 videos) se
  conserva y se versiona. Nadie lo borra ni lo regenera.

## DV-06. Color del suelo de Jezero

- **Fecha:** 2026-11-25 · **Decide:** María Paula
- **Qué:** suelo iluminado `regolito-claro #FA8D6F` y suelo en media sombra
  `regolito-medio #B76A78`, del canon visual del juego (`DISEÑO.md` §2.3). Reemplazan
  al `oxide #543A44` provisional de WS1. Es un color de estilo del juego, no una
  medición colorimétrica de NASA.

## DV-07. Revisión del suelo de Jezero: rojo óxido oscuro y piedra estilizada (reemplaza DV-06)

- **Fecha:** 2026-11-25 · **Decide:** María Paula
- **Contexto:** en las pruebas de entorno y del piloto exterior (`T3.1`), el salmón
  saturado (`#FA8D6F` / `#B76A78`) se leyó artificial, plano y tiñó los edificios por
  rebote hemisférico. María Paula pidió pasar el suelo a un rojo óxido oscuro y menos
  saturado con lectura de piedra estilizada.
- **Medición sRGB sobre fotogramas originales (`3840×2160`, zonas iluminadas sin hielo):**
  - En `v3/v3-t079.90.jpg` `[150, 975, 95, 85]` se mide `#673C45` (`rgb(103, 60, 69)`) y en `[2560, 320, 220, 160]` `#6C5456`; en `v3/v3-t104.90.jpg` `[3155, 780, 85, 85]` se mide `#60353C` (`rgb(96, 53, 60)`). Tras las pasadas S2 (`#82463E` / `#542B28`) y S3 (`#7A4C46` / `#4F302D`, donde `G >= B` inclinaba al ladrillo), la pasada S4 restablece la relación física granate de las muestras originales (`R > B >= G`) con **`oxide = #734F4F`** (`regolithPreview = #734F4F`) y **`regolithShade = #4C3233`**, logrando en la vista de juego (`/exterior-pilot?view=2&clean=1`) saturación HSV entre `0,22` y `0,32` y rocas ligeramente más oscuras con saturación `<= 0,45` (sin volver al salmón `#FA8D6F` ni a gris plano).
- **Qué:** `M_terrain` sombrea afloramientos estratificados de bordes orgánicos irregulares parcialmente cubiertos por grandes mantos de regolito suelto (sin retícula tipo baldosa ni manchas grises), con mayor relieve escalonado cercano y mayor densidad y tamaño de rocas `MT-*` cerca de la colonia y la cámara. El bioma polar (`AMB-07`) y la noche (`AMB-08`) mantienen su comportamiento intacto.
