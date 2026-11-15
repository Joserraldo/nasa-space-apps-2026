# Solar Shield: índice maestro de dirección visual (v8)

**Dueña:** María Paula (`Paulasaah`, rol ui) · **Vigente desde:** 14 nov 2026 · **Motor gráfico:** Three.js `^0.160.0` (`WebGLRenderer`) + React 18 · **Láminas:** 55 PNG curados en [`referencias/`](referencias/) (1024 px, paleta de 256 colores).

Esta carpeta es la **única fuente visual** del juego. Las láminas son **referencia para reconstruir en código** (geometría procedural en Three.js, CSS y DOM). Ninguna imagen se pone tal cual en el juego, salvo el logo oficial.

---

## 1. Qué leer según la tarea

Leé solo lo que tu tarea necesita. Cada documento es autónomo y enlaza sus láminas.

| Si vas a... | Leé primero | Después |
| --- | --- | --- |
| Entender el juego en 5 minutos | Este README (secciones 2 a 4) | [MECANICAS.md](MECANICAS.md) §1 |
| Construir cualquier cosa visual (3D o UI) | [DISEÑO.md](DISEÑO.md) | [APLICACION.md](APLICACION.md) |
| Construir terreno, cielo, luz o rocas | [MARTE.md](MARTE.md) | [DISEÑO.md](DISEÑO.md) §2–3 |
| Armar una pantalla o una estación | [ESCENAS.md](ESCENAS.md) (la ficha de esa escena) | [DISEÑO.md](DISEÑO.md) §5–6 |
| Conectar una acción al motor | [MECANICAS.md](MECANICAS.md) | [APLICACION.md](APLICACION.md) §6 |
| Modelar un personaje o a Iris | [DISEÑO.md](DISEÑO.md) §4 | [REFERENCIAS.md](REFERENCIAS.md) §3 |
| Buscar una lámina concreta | [REFERENCIAS.md](REFERENCIAS.md) | — |
| Revisar un PR visual | [APLICACION.md](APLICACION.md) §9 (puerta de aceptación) | [DISEÑO.md](DISEÑO.md) §8 (prohibido) |

## 2. Mapa de documentos

| Documento | Responde a |
| --- | --- |
| [DISEÑO.md](DISEÑO.md) | **Cómo se ve.** Paleta, materiales, luz, estilo low-poly facetado, personajes (poses, rostros, luz), Iris, sistema UI, inicio y lista de prohibiciones. |
| [MARTE.md](MARTE.md) | **Por qué se ve así en Marte.** Análisis físico real de Jezero (gravedad, atmósfera, polvo, cielo, luz, terreno, escala) traducido a reglas de estilo y parámetros de Three.js. |
| [ESCENAS.md](ESCENAS.md) | **Qué hay en cada lugar.** Pantallas, mundo abierto, mapa de la base con coordenadas reales, estaciones y su contenido. |
| [MECANICAS.md](MECANICAS.md) | **Qué hace el jugador y qué responde el juego.** Misión Jezero en 8 pasos, recursos, módulos, decisión, tormenta, Iris, telemetría, final e invariantes. |
| [APLICACION.md](APLICACION.md) | **Cómo se construye en código.** Arquitectura de `ui/src/escena/`, contrato procedural, kit de piezas, animaciones, rendimiento, bloques de entrega y puerta de aceptación. |
| [REFERENCIAS.md](REFERENCIAS.md) | **Catálogo de las 55 láminas.** Qué tomar, qué ignorar y dónde se usa cada una. |
| [`mapa-base-jezero.svg`](mapa-base-jezero.svg) | Plano cenital de la base dibujado con las coordenadas de `ui/src/escena/mundo.ts`. |
| [`catalogo-assets.json`](catalogo-assets.json) | Inventario de piezas maestras legible por máquina (fábrica, pivote, reutilización). |
| [`piezas-procedurales.js`](piezas-procedurales.js) | Esqueleto de medidas (`1 u = 1 m`). **No es arte aprobado**: sus siluetas son bloques. |

## 3. Orden de autoridad (cuando dos fuentes chocan)

1. **Contratos y código de otros roles:** `contracts/`, `engine/`, `design/`, `missions/`, `data/`, `agents/`. Ningún documento de esta carpeta cambia una regla, un costo o un tick.
2. **Decisiones del equipo:** `docs/decisiones/` y `docs/ORQUESTACION.md` (fechas, bloques, puertas).
3. **Texto de esta carpeta** (DISEÑO, MARTE, ESCENAS, MECANICAS, APLICACION).
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

## 5. Decisiones abiertas (no las cierra esta carpeta)

Registradas en `docs/ORQUESTACION.md` como pendientes de Santiago. Mientras no se cierren, se aplica lo indicado:

| Pregunta | Mientras tanto |
| --- | --- |
| ¿Iris se ve como rover de 4 ruedas? (en el contrato es la IA de la base, `iaBase` + equipo `ia_base`) | La dirección v8 propone rover. Se construye detrás de la interfaz `ModeloIris` para poder cambiar la forma sin tocar la lógica. |
| ¿Expertas en 3D o solo retratos 2D? | Retratos 2D en UI (bloque 4). Cuerpos 3D solo después del congelamiento. |
| ¿Se recortan las 8 estaciones completas? | Base compacta de Jezero primero; las 8 estaciones son ampliación posterior. |

## 6. Qué salió de esta carpeta y por qué

- `Solar-Shield-Atlas-integral-v8.pdf` (17,82 MB): su texto quedó repartido en estos documentos y sus imágenes útiles están en `referencias/` (incluidas 5 que faltaban: mundo en tercera y primera persona, y las tres láminas del niño). Queda fuera de git.
- `ATLAS-V8.md`, `AMPLIACION-ESPACIOS.md`, `PLAN-IMPLEMENTACION-JEZERO.md`, `revision-pdf-v8.json`, `Solar-Shield-Plan-Jezero.pdf` y `assets/GUIA-FABLE-V8.md`: fusionados aquí. El "estado local" del plan Jezero estaba desactualizado: aterrizaje, tormenta de 3 ticks, fin por telemetría y `elegirDilema` ya están en `develop`.
- Descartes que no vuelven: capibara, `v2`–`v5`, `v7`, `polyfork.ts`, GLB de `ui/public/models/`, entradas crudas de la ampliación y la primera versión del comedor (tenía árboles afuera).
