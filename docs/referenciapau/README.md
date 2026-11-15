# Solar Shield: índice maestro de dirección visual (v8)

**Dueña:** María Paula (`Paulasaah`, rol ui) · **Vigente desde:** 14 nov 2026 · **Motor gráfico:** Three.js `^0.160.0` (`WebGLRenderer`) + React 18 · **Láminas:** 55 PNG curados en [`referencias/`](referencias/) (1024 px, paleta de 256 colores).

Esta carpeta es la **única fuente visual** del juego. Las láminas son **referencia para reconstruir en código** (geometría procedural en Three.js, CSS y DOM). Ninguna imagen se pone tal cual en el juego, salvo el logo oficial.

---

## 1. Qué leer según la tarea

Leé solo lo que tu tarea necesita. Cada documento es autónomo y enlaza sus láminas.

| Si vas a... | Leé primero | Después |
| --- | --- | --- |
| Comprobar que algo cumple el reto de NASA | [RETO.md](RETO.md) | [NIVELES.md](NIVELES.md) |
| **Saber qué se construye primero y quién lo hace** | [FLUJO.md](FLUJO.md) | [`docs/prompts/ARRANQUE.md`](../prompts/ARRANQUE.md) |
| Entender el juego en 5 minutos | [HISTORIA.md](HISTORIA.md) (premisa, personajes, dónde empieza, conexiones) | Este README (secciones 3 y 4) |
| Construir cualquier cosa visual (3D o UI) | [DISEÑO.md](DISEÑO.md) | [APLICACION.md](APLICACION.md) |
| Construir terreno, cielo, luz o rocas | [MARTE.md](MARTE.md) | [DISEÑO.md](DISEÑO.md) §2–3 |
| Trabajar en un nivel o misión (cualquiera de los 5) | [NIVELES.md](NIVELES.md) | [MECANICAS.md](MECANICAS.md) |
| Música, efectos, lectura en voz alta o entrada de voz | [AUDIO.md](AUDIO.md) (va al final) | [FLUJO.md](FLUJO.md) §4 |
| Escribir textos, diálogos o la intro | [HISTORIA.md](HISTORIA.md) | [MECANICAS.md](MECANICAS.md) §3 |
| Armar una pantalla o una estación | [ESCENAS.md](ESCENAS.md) (la ficha de esa escena) | [DISEÑO.md](DISEÑO.md) §5–6 |
| Conectar una acción al motor | [MECANICAS.md](MECANICAS.md) | [APLICACION.md](APLICACION.md) §6 |
| Modelar un personaje o a Iris | [DISEÑO.md](DISEÑO.md) §4 | [REFERENCIAS.md](REFERENCIAS.md) §3 |
| Buscar una lámina concreta | [REFERENCIAS.md](REFERENCIAS.md) | — |
| Revisar un PR visual | [APLICACION.md](APLICACION.md) §10 (puerta de aceptación) | [DISEÑO.md](DISEÑO.md) §8 (prohibido) |

## 2. Mapa de documentos

| Documento | Responde a |
| --- | --- |
| [FLUJO.md](FLUJO.md) | **Quién programa qué y en qué orden.** Reparto del frontend por persona con sus archivos (personajes, escenario, ubicación, integración, interfaz, audio), rama `feat/ui-escenarios`, contratos, división de assets, fases y validación. |
| [NIVELES.md](NIVELES.md) | **Todos los niveles.** Las 5 misiones con su ficha, el orden de la campaña, la dificultad, los niveles de Iris y lo que falta decidir. Prioridad 1. |
| [HISTORIA.md](HISTORIA.md) | **Qué se cuenta.** Lore canónico, personajes y su personalidad, dónde empieza el juego, la misión de Jezero como historia, mapa de conexiones y resumen de la campaña. |
| [DISEÑO.md](DISEÑO.md) | **Cómo se ve.** Paleta, materiales, luz, estilo low-poly facetado, personajes (poses, rostros, luz), Iris, sistema UI, inicio y lista de prohibiciones. |
| [MARTE.md](MARTE.md) | **Por qué se ve así en Marte.** Análisis físico real de Jezero (gravedad, atmósfera, polvo, cielo, luz, terreno, escala) traducido a reglas de estilo y parámetros de Three.js. |
| [ESCENAS.md](ESCENAS.md) | **Qué hay en cada lugar.** Pantallas, mundo abierto, mapa de la base con coordenadas reales, estaciones y su contenido. |
| [MECANICAS.md](MECANICAS.md) | **Qué hace el jugador y qué responde el juego.** Misión Jezero en 8 pasos, recursos, módulos, decisión, tormenta, Iris, telemetría, final e invariantes. |
| [APLICACION.md](APLICACION.md) | **Cómo se construye en código.** Arquitectura de `ui/src/escena/`, contrato procedural, kit de piezas, animaciones, rendimiento, bloques de entrega y puerta de aceptación. |
| [RETO.md](RETO.md) | **Qué pide NASA.** El enunciado oficial frente a lo que hace el juego, estado de cada requisito, mejoras asignadas, criterios de juicio y contraste con el resumen de Camilo. |
| [AUDIO.md](AUDIO.md) | **Cómo suena.** Música, efectos, lectura en voz alta y entrada de voz. Última fase. |
| [REFERENCIAS.md](REFERENCIAS.md) | **Catálogo de las 55 láminas.** Qué tomar, qué ignorar y dónde se usa cada una. |
| [`mapa-base-jezero.svg`](mapa-base-jezero.svg) | Plano cenital de la base dibujado con las coordenadas de `ui/src/escena/mundo.ts`. |
| [`catalogo-assets.json`](catalogo-assets.json) | Inventario de piezas maestras legible por máquina (fábrica, pivote, reutilización). |
| [`piezas-procedurales.js`](piezas-procedurales.js) | Esqueleto de medidas (`1 u = 1 m`). **No es arte aprobado**: sus siluetas son bloques. |

## 3. Orden de autoridad (cuando dos fuentes chocan)

0. **El enunciado oficial del reto** ([RETO.md](RETO.md)).
1. **Contratos y código de otros roles:** `contracts/`, `engine/`, `design/`, `missions/`, `data/`, `agents/`. Ningún documento de esta carpeta cambia una regla, un costo o un tick.
2. **Decisiones del equipo:** `docs/decisiones/` y `docs/ORQUESTACION.md` (fechas, bloques, puertas).
3. **Texto de esta carpeta** (RETO, FLUJO, NIVELES, HISTORIA, DISEÑO, MARTE, ESCENAS, MECANICAS, APLICACION, AUDIO). Los documentos de `develop` escritos antes del 14 nov siguen valiendo en lo suyo (reglas, datos, voces, pitch) y ya tienen notas "Actualización 14 nov" donde la dirección visual los cambió. Lo que **no** es canon es la dirección visual vieja: atlas v2–v5 y v7, el prototipo `docs/referencias/3d/`, PixiJS para la escena, GLB y "retratos 2D en lugar de personajes".
4. **Láminas** de `referencias/`. Guían silueta, paleta, composición, proporción y pose. Si una lámina contradice el texto, **manda el texto**. Cada contradicción conocida está anotada en [REFERENCIAS.md](REFERENCIAS.md).

## 4. Diez reglas que no se negocian

1. **La referencia manda.** Se replica con fidelidad la silueta, paleta, proporción y composición de la lámina. No se reinterpreta ni se "mejora" a gusto.
2. **Todo se construye con código.** Three.js procedural para el mundo y DOM/CSS/SVG para la UI. Sin GLB, sin Blender, sin pegar las láminas como textura, sin WebGPU, sin otra librería además de `three` ([D6](../decisiones/D6-estilo-visual.md)).
3. **Marte es Marte.** Afuera solo regolito, roca, polvo y equipo humano. Cero vegetación exterior, cero ruinas, estatuas, templos o arcos de piedra. Las plantas viven dentro del invernadero presurizado ([MARTE.md](MARTE.md)).
4. **El motor manda.** Ninguna animación, malla o clic cobra, entrega o adelanta recursos. La escena dibuja lo que `GameState` ya decidió ([MECANICAS.md](MECANICAS.md) §5).
5. **Tres medidores separados:** energía, soporte vital y blindaje. Nunca una barra de salud.
6. **Personas humanas.** El niño y las expertas son humanos en 2D y 3D. El niño tiene proporciones infantiles propias, no es un adulto escalado.
7. **Texto siempre en DOM e i18n.** El inglés es el idioma base y el español el segundo. Nada de texto horneado en texturas ni imágenes.
8. **Datos NASA con fuente y sin "en vivo".** Medición, modelo y regla de juego se distinguen siempre.
9. **Accesible siempre:** teclado, foco visible, `prefers-reduced-motion`, áreas de 44 x 44 px y respaldo 2D equivalente.
10. **Presupuesto:** menos de 80 draw calls y 80 000 triángulos por vista, DPR máximo 1,5.

## 5. Decisiones de #157, aprobadas por Santiago (14 nov)

Estaban pendientes en `docs/ORQUESTACION.md`. Ui las resolvió según las láminas; Santiago las aprobó el 14 nov:

| Pregunta | Qué se aplica |
| --- | --- |
| ¿Iris se ve como rover de 4 ruedas? (en el contrato es la IA de la base, `iaBase` + equipo `ia_base`) | **Decidido por ui según la referencia:** rover 3D en el mundo desde el bloque 2 (`mundo/01`, `inicio/02`), y en las tarjetas de diálogo un retrato del mismo rover. Sigue siendo la IA de la base (`iaBase`, D2). Aprobado por Santiago (14 nov). |
| ¿Expertas en 3D o solo retratos 2D? | **Decidido por ui según la referencia:** personas 3D en el mundo (la Ingeniera aparece junto al niño en `mundo/01`) y retrato del mismo modelo en las tarjetas de diálogo. La Ingeniera entra en el bloque 2 (aprobado por Santiago, 14 nov); la Doctora y la Meteoróloga si el presupuesto alcanza, si no, después de P4. |
| ¿Se recortan las 8 estaciones completas? | Base compacta de Jezero primero; las 8 estaciones son ampliación posterior. |
| ¿Cuándo entran las otras 4 misiones? | No aparecen en la UI hasta que el motor lea varias misiones (#152) y diseño las apruebe ([NIVELES.md](NIVELES.md) §7–8). |
| Estilo y render; nombres de la tripulación | [D6](../decisiones/D6-estilo-visual.md) (Three.js procedural + DOM) y [D7](../decisiones/D7-tripulantes.md) (por su rol), ambas aprobadas por Santiago (14 nov). |

## 6. Qué salió de esta carpeta y por qué

- `Solar-Shield-Atlas-integral-v8.pdf` (17,82 MB): su texto quedó repartido en estos documentos y sus imágenes útiles están en `referencias/` (incluidas 5 que faltaban: mundo en tercera y primera persona, y las tres láminas del niño). Queda fuera de git.
- `ATLAS-V8.md`, `AMPLIACION-ESPACIOS.md`, `PLAN-IMPLEMENTACION-JEZERO.md`, `revision-pdf-v8.json`, `Solar-Shield-Plan-Jezero.pdf` y `assets/GUIA-FABLE-V8.md`: fusionados aquí. El "estado local" del plan Jezero estaba desactualizado: aterrizaje, tormenta de 3 ticks, fin por telemetría y `elegirDilema` ya están en `develop`.
- Descartes que no vuelven: capibara, `v2`–`v5`, `v7`, `polyfork.ts`, GLB de `ui/public/models/`, entradas crudas de la ampliación y la primera versión del comedor (tenía árboles afuera).
