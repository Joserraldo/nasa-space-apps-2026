# Plan de jugabilidad para seis personas: misión interactiva en mundo abierto

**Para:** José, Santiago, María Paula y las tres personas de los frentes B, C y D. Cada frente de §4 se
puede pegar entero como encargo para el agente de esa persona (ver §7).
**Base:** `origin/develop` desde #330 (rescate integrado) y #331 (e2e estables en CI).
**Fecha:** 16 nov 2026. `[V]` = comprobado en el código, en captura o en la fuente; `[NV]` = no comprobado.

**Objetivo:** que un niño de 7 a 10 años juegue la misión de Jezero en un mundo abierto que se siente vivo
(camina, salta con la gravedad de Marte, entra a las salas, habla con la tripulación y se sorprende),
aprende ciencia real y no pasa la partida leyendo tarjetas fijas.

---

## 0. Diagnóstico: todos los problemas identificados y quién los resuelve

| # | Problema | Estado | Dueño |
| --- | --- | --- | --- |
| 1 | El mapa son 10 números sobre un cuadro naranja; los nombres solo en la lista | `[V]` captura `e6-base-mapa` | C |
| 2 | La distribución de la base no se parece a la organización de referencia (`exterior/03`) | `[V]` comparando capturas con la lámina | C (posiciones) + D (mallas) |
| 3 | El destino no se marca en el mundo: `vista.lugarObjetivo` se calcula y la escena no lo lee | `[V]` `MundoBase.tsx:125` | C (marcador) + A (dato) |
| 4 | Tarjetas fijas que tapan el mundo (E5: lista de módulos y panel siempre abiertos) | `[V]` captura de María Paula | E + F |
| 5 | Al caminar el movimiento no se siente fluido | `[NV]` causa: fps o locomoción | A |
| 6 | No se puede saltar ni se siente la gravedad de Marte | `[V]` sin salto en el código | A |
| 7 | La cámara 1.ª/3.ª persona no está en el menú (solo `V` y un botón del HUD) | `[V]` | E |
| 8 | Iris habla en una franja inferior; `Burbuja` existe sin CSS | `[V]` `Dialogos.tsx:16` | B (líneas) + A (anclaje) + F (estilo) |
| 9 | No se puede hablar con un tripulante acercándose | `[V]` `tripulacionBase.ts:60-72` | A (cercanía) + B (conversación) + E (`[E] Talk`) |
| 10 | Doctora y Meteoróloga no están en la escena | `[V]` `tripulacionBase.ts:29-31` | A |
| 11 | Se usan 4 de 14 gestos; las animaciones se sienten genéricas | `[V]` `personajes/animaciones.ts` | A |
| 12 | Los retratos 2D son el SVG viejo, no los personajes de la alternativa B | `[V]` `componentes/base/Retrato.tsx` | F |
| 13 | No hay salas: las puertas son decorado | `[V]` | D (geometría) + A (entrar y salir) |
| 14 | El paso 4 es una lista superpuesta, no se construye caminando | `[V]` `PantallaModulos.tsx` | A (flujo) + E (tarjeta) |
| 15 | Iris pide reparación en el turno 0; la avería es del paso 6 | `[V]` síntoma, `[NV]` causa | A |
| 16 | No hay ciclo de día y noche (solo los ambientes `dia` y `atardecer`) | `[V]` `escena/cielo.ts:15` | D (luz) + A (regla) |
| 17 | La escena es pesada: 17-26 fps sin GPU en calidad `media` | `[V]` medido con SwiftShader | D |
| 18 | En celular vertical la cámara muestra mucho cielo | `[V]` captura `e6-base-390x844` | A |
| 19 | Emojis en `componentes/Dialogos.tsx:7` | `[V]` | E |
| 20 | Solo Jezero se juega; el motor no recibe la misión como parámetro (#152) | `[V]` | A (P2) |
| 21 | Recurso en 0 y telemetría en el mismo tick (`engine/src/acciones.ts:330`) | `[V]` | A (P2, decisión de diseño) |
| 22 | La cámara se mira arrastrando con el mouse; se pide mirar con solo mover el mouse (y con los dedos en celular) | `[V]` ESCENAS §3.5 dice "arrastrar" | A |
| 23 | La cámara hace zooms raros al caminar o al usar el mapa | Reportado por María Paula; `[NV]` causa | A |
| 24 | La sombra del personaje se ve con fallas (glitch) | Reportado por María Paula; `[NV]` causa | D |
| 25 | Acercarse a un edificio no permite entrar a la sala ni cambia a la vista interior | `[V]` (ver #13) | A (entrar) + D (interior) |
| 26 | Las pantallas de entrada (portada, carga, órbita, "listo para explorar") no siguen la lámina nueva de flujo | Lámina nueva `inicio/04` | F (visual) + E (flujo) |

---

## 1. La experiencia que se busca

**El bucle de cada paso, sin pasar por un menú:**
1. Iris dice adónde ir: globo sobre el rover y el rover que avanza o señala.
2. El destino se ve: haz de luz, ruta en el piso y flecha en el borde; el mapa marca lo mismo.
3. El niño camina, salta, explora; si quiere, toca el lugar en el mapa y camina solo.
4. Al llegar, alguien reacciona: la experta gira, lo mira, saluda y explica con gestos propios.
5. `[E] Talk`, `[E] Build`, `[E] Enter`: recién ahí aparece la tarjeta de decisión.
6. La consecuencia se ve en el mundo (el módulo se instala, la antena gira, Iris falla con interferencia).
   El motor ya aplicó el cambio; la animación solo lo muestra.
7. La tripulación comenta lo que el niño eligió, y Iris propone el siguiente destino.

**Sorpresa y curiosidad con ciencia real.** Cada momento de asombro sale de algo que pasa de verdad en
Marte y lleva su fuente:

| Dato | Estado |
| --- | --- |
| Gravedad media 3,73 m/s², 0,380 de la terrestre (ecuatorial 3,69) | `[V]` NASA NSSDC, Mars Fact Sheet, leído el 16 nov 2026 |
| Día marciano (sol) de 24,6597 h | `[V]` misma ficha |
| Temperatura media de unos −59 °C | `[V]` misma ficha |
| Atardeceres azulados, remolinos de polvo, Fobos y Deimos en el cielo, retraso de la señal con la Tierra, tormentas globales, MOXIE (oxígeno a partir de CO2), análogos de base como Mars Dune Alpha | `[NV]` cada uno se muestra solo con una fuente verificada por el frente B y el rol de datos |

**Física que se va a revisar.** El salto usa `GRAVEDAD_MARTE` de `ui/src/escena/fisica.ts` (con su
fuente). Con la misma velocidad de despegue `v`, la altura es `h = v²/2g` y el tiempo en el aire `t = 2v/g`:
en Marte el niño salta **1/0,380 ≈ 2,6 veces** más alto y está 2,6 veces más tiempo en el aire que en la
Tierra. La velocidad de despegue es una suposición de juego y se declara como tal. Ninguna cifra de balance
se etiqueta "según NASA" (MECANICAS §9).

**La UI aparece cuando hace falta** (frentes E y F):

| Elemento | Cuándo |
| --- | --- |
| Recursos, chip de objetivo, globo de Iris | Al entrar a la base |
| `[E]` con verbo | Solo con algo al alcance |
| `Map` | Con el primer objetivo |
| `Crew` | Después de la primera conversación en el mundo (en el respaldo 2D, siempre) |
| Velocidad del reloj | Después de colocar los módulos |
| Tarjeta de decisión, fuente, dilema | Solo dentro del paso 5 del bucle; una a la vez; se cierra al decidir |

`Pause` y el menú siempre visibles (accesibilidad).

---

## 2. Bloque 0, todos juntos (30 a 45 minutos, antes de separarse)

| Quién | Qué deja cerrado |
| --- | --- |
| A (José) | **Ganchos de sistemas** en `escena3d.ts`: `montar(ctx)`, `actualizar(dt, ctx)` y `dispose()`, para que C y D sumen marcadores y ciclo de día sin editar `escena3d.ts`. Extrae `AJUSTE_CALIDAD` a `escena/calidad.ts` (pasa al frente D). Actualiza el encabezado de `frontera.ts` con los dueños nuevos |
| A + B | El contrato de conversación con la tripulación en `agents/`: el modelo clasifica en JSON estricto, el código responde, nunca inventa números (`CLAUDE.md`) |
| C + D | Las posiciones salen de `mundo.ts` (C); la forma de cada edificio, de `activos/` (D). Nadie copia coordenadas en dos lugares |
| E + F | La API de la tarjeta contextual (`<TarjetaContextual>`: de dónde aparece, cuándo se cierra, una a la vez) |
| A | Arranca la propuesta de misión interactiva (A3), que todos leen antes del bloque 2 |

El contrato de frontera escena/pantalla ya existe: `ui/src/escena/frontera.ts` (Interactivo, `objetivo`,
`iris`, `globo`, `hablando`, `sala`, retratos). Hoy solo `onInteractivo` emite lugares; el resto se acepta
y todavía no cambia la escena.

---

## 3. Archivos: un archivo, un escritor

| Frente | Dueño de |
| --- | --- |
| A José | `engine/`, `missions/`, `ui/src/juego/**`, `ui/src/pantallas/lugares.ts`, y en `ui/src/escena/`: `escena3d.ts`, `EscenaBase.tsx`, `frontera.ts`, `movimientoBase.ts`, `fisica.ts`, `navegacion.ts`, `entradaTactil.ts`, `tripulacionBase.ts`, `coreografia.ts` (nuevo), `salas.ts` (nuevo) y `personajes/animaciones.ts` |
| B | `agents/**`, `infra/worker/**` |
| C | `ui/src/escena/mundo.ts`, `escena/activos/caminos.ts`, `escena/marcadores.ts` (nuevo), `componentes/Mapa.tsx`, `componentes/Mapa.css`, `pantallas/PantallaSitio.tsx`, `pantallas/sitio.css`, `docs/referenciapau/mapa-base-jezero.svg` |
| D | `ui/src/escena/activos/**` (salvo `caminos.ts`), `escena/armado.ts`, `escena/cielo.ts`, `escena/calidad.ts`, `escena/cicloDia.ts` (nuevo), y la malla de los personajes (`personajes/cuerpo.ts`, `cabeza.ts`, `malla.ts`, `rostro.ts`, `superficie.ts`, `iris.ts`) **coordinado con María Paula**, que los hizo |
| E Santiago | `ui/src/App.tsx`, los `.tsx` de `pantallas/` (salvo `lugares.ts` y `PantallaSitio.tsx`), los `.tsx` de `componentes/` (salvo `base/` y `Mapa.tsx`), `tests/e2e/**`, `.github/workflows/**` |
| F María Paula | `ui/src/componentes/base/**`, todos los `.css` de `ui/src` (salvo `Mapa.css` y `sitio.css`), `tests/capturas/**`, `ui/public/retratos/**` |

**i18n** (`ui/i18n/en.json`, `es.json`): todos agregan, nadie borra claves ajenas. Cada frente usa su
prefijo (`agentes.*` B, `ui.mapa.*` C, etc.). Inglés primero, español después.

---

## 4. Los seis frentes

### Frente A — José: misiones, mecánicas, movimiento y animación (el más difícil)

**Meta:** la misión se juega en el mundo; caminar, saltar y la tripulación se sienten vivos.

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| A0 | P0 | Bloque 0 (§2): ganchos de sistemas, `calidad.ts`, encabezado de `frontera.ts` | C y D montan un sistema de prueba sin tocar `escena3d.ts` |
| A1 | P0 | **Iris averiada en el turno 0** (#15): encontrar la causa. Hechos: `lugares.ts:64` usa `estado.iaBase === "danada"`; el motor daña a Iris en `engine/src/ia.ts:36-38` solo con señal de tormenta y blindaje < `BLINDAJE_DANA_IA` (20 en `media`, `design/src/ia.ts:23`), y la captura muestra blindaje 52 | Al entrar a la base el objetivo es el del paso 4; prueba que lo fija |
| A2 | P0 | **Cadena de objetivos:** `guiaIrisLugar` y `briefingIris` alimentan `objetivo`, `iris` y `globo` de la escena y el chip del HUD. Deja de pasar `lugarObjetivo` a `vistaEscena`. En la escena: el globo anclado sobre quien habla, e Iris que avanza delante del niño y señala con su cara (`caraIrisModelo`) | Prueba de las props por paso; captura de Iris señalando con el globo; e2e "seguir a Iris" del paso 4 al 8 sin abrir `Crew` (con E) |
| A3 | P0 | **Propuesta de misión interactiva** (`docs/referenciapau/MISION-INTERACTIVA.md`, una página): qué hace el niño en el mundo en cada paso, qué lo sorprende, qué aprende y qué lo engancha a seguir. Revisan Santiago y María Paula antes del bloque 2 | Propuesta aprobada |
| A4 | P0 | **Caminar fluido** (#5): primero medir con `medir: true` (`escena3d.ts:45`, `medicion()` en `:786`) en 1440x900 con GPU real. Si los fps están bien: aceleración y frenado con curva, giro suavizado, ciclo de pasos según la velocidad (sin pies que patinan), cámara con amortiguación | Video o tira de capturas, y fps medidos antes y después |
| A5 | P0 | **Salto y gravedad de Marte** (#6): `Space` y botón táctil de 48 px. Física en `fisica.ts` con `GRAVEDAD_MARTE`; velocidad de despegue declarada como suposición; anticipación, aire y aterrizaje. Saltar nunca da ni quita recursos | Pruebas: altura y tiempo en el aire simulados coinciden con `v²/2g` y `2v/g`; la proporción Marte/Tierra es 1/0,380 |
| A6 | P0 | Doctora y Meteoróloga en su estación; acercarse a cualquier tripulante emite `Interactivo` de tipo `actor` | Las tres expertas en la captura; prueba del aviso |
| A7 | P0 | **Animaciones que no son genéricas** (#11), en `coreografia.ts`: función pura `(vista, hablando, eventos, cercanía) → gesto por actor` con los 14 gestos. Principios de juegos de mundo abierto: anticipación y continuidad, movimiento secundario, reposos con variaciones, mirar al niño y al objetivo, cambio de peso, arranque y frenado. Referencias de sensación (no de recursos): *A Short Hike*, *Astroneer*, *Animal Crossing* | Prueba de la tabla; ningún actor queda quieto mientras habla |
| A8 | P0 | **Entrar a las salas** (#25), `salas.ts`: al acercarse a la puerta de un edificio aparece `[E] Enter`; fundido y cambio a la vista interior (escena propia con sus colisiones, cámara dentro del corredor como en `exterior/01-corredores-conexiones.png`); `[E] Exit` vuelve afuera, junto a la misma puerta. Geometría del frente D | Entrar, caminar y salir del taller sin perder el `GameState`; e2e |
| A9 | P1 | El paso 4 en el mundo: hablar con la Ingeniera y `[E] Build` en un anclaje vacío (tarjeta del frente E) | Los 2 módulos se colocan caminando; la ruta dorada sigue en verde |
| A10 | P1 | Encuadre de la cámara en celular vertical (#18) | Captura 390x844 con el niño y el mundo, no medio cielo |
| A11 | P2 | Motor con la misión como parámetro (#152, #20) y la decisión de #21 | Issue cerrado con diseño |
| A12 | P0 | **Mirar con el mouse sin arrastrar** (#22): Pointer Lock al hacer clic una vez en el mundo, con aviso ("Click to look around · Esc for the menu"). Abrir una tarjeta o el menú suelta el puntero solo. En celular, mirar con un dedo en la mitad derecha (ya existe en `entradaTactil.ts`: comprobarlo en el juego real). Ver la decisión en §8 | e2e de que abrir una tarjeta suelta el puntero; captura del aviso; prueba táctil en emulación |
| A13 | P0 | **Zooms raros de la cámara** (#23): reproducir (caminar junto a edificios, elegir un destino en el mapa), registrar la distancia cámara-niño por fotograma y corregir. Causas probables `[NV]`: el choque de la cámara con paredes que la acerca de golpe, o la transición al cambiar de destino. Sin saltos de distancia que el jugador no pidió | Prueba de que la distancia no salta entre fotogramas salvo choque; video antes y después |

### Frente B — tripulación viva, IA y jugador de prueba

**Meta:** hablar con la tripulación se siente como hablar con personas que recuerdan lo que hiciste.
Todo se conecta. **Esta persona juega en el lugar del niño de 7 a 10 años.**

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| B0 | P0 | Contrato de conversación con A (§2) | Tipos en `agents/` con pruebas |
| B1 | P0 | Líneas cortas para el globo: bienvenida de Iris y 1 o 2 líneas por paso y por nivel de Iris (`tutorial`, `pistas`, `danada`, `offline`). Tono de ciencia divertida, sin miedo | Claves en EN y ES; ninguna línea pasa de 2 renglones en 390 px |
| B2 | P0 | La tripulación **recuerda y reacciona**: líneas que nombran lo que el niño eligió (las causas del motor). Personalidades: la Ingeniera práctica, la Doctora tranquila, la Meteoróloga curiosa | Prueba: con dos partidas distintas, la tripulación comenta cosas distintas |
| B3 | P0 | Conversación en el mundo: `Ask your crew...` y voz opcional → clasificador en JSON estricto → responde la experta con datos del motor. Si el modelo cae, quedan los botones. El modelo nunca ve el estado completo ni inventa cifras | Pruebas del clasificador con entradas de niños; respaldo sin modelo |
| B4 | P1 | Momentos de curiosidad: 8 a 10 datos reales de Marte (§1) dichos por quien corresponde en el momento justo (la Meteoróloga en la tormenta, la Doctora con la radiación, Iris con el retraso de la señal). Cada dato con fuente verificada | Tabla de datos con fuente y estado `[V]` |
| B5 | P0 | **Jugador de prueba**, en cada encuentro: juega 10 minutos como un niño de 7 a 10 años, con un guion, y escribe `docs/referenciapau/DIARIO-JUGADOR.md`: dónde se perdió, dónde se aburrió y qué lo sorprendió. Abre un issue para el dueño de cada problema | Diario actualizado en cada encuentro |
| B6 | P1 | Los niveles de Iris se notan en su comportamiento (con A) | Captura de cada nivel |

### Frente C — mapa, distribución del escenario y navegación

**Meta:** la base está organizada como una base real en Marte y como la lámina de referencia; el mapa se
lee de un vistazo y el niño siempre sabe adónde ir.

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| C1 | P0 | **Referencias reales** (`docs/referenciapau/REFERENCIAS-BASE.md`, con enlaces): conceptos de base de NASA, análogos (Mars Dune Alpha/CHAPEA, MDRS) y la lámina `exterior/03-exterior-organizacion.png`. Qué es real y por qué (por ejemplo, dónde va la plataforma de aterrizaje respecto del hábitat), cada afirmación con su fuente | Documento con fuentes verificadas |
| C2 | P0 | **Redistribuir la base** (#2) en `mundo.ts` para que el exterior quede **como `exterior/03-exterior-organizacion.png`** (ESCENAS §3.3); el mapa (C3) dibuja esa misma distribución: plataforma con nave arriba a la izquierda, energía a la izquierda, cúpula de control al centro con corredores, invernadero geodésico arriba a la derecha, laboratorio y enfermería a la derecha, comedor y descanso abajo, refugio de regolito abajo a la izquierda, dos caminos en anillo con balizas. **Sin `LugarId` nuevos**: los sectores extra son salas o decorado (un lugar nuevo exige contrato con agentes) | Captura cenital junto a la lámina, aprobada por María Paula; rutas y colisiones siguen en verde |
| C3 | P0 | **Mapa nuevo** (#1), según ESCENAS §3.4: plano dibujado con la familia v8, placas con icono y nombre corto en vez de números, caminos, módulos construidos frente a anclajes vacíos, el niño con su rumbo, el objetivo en cian con pulso. Tocar un lugar fija el destino y el niño camina. Si está dentro de una sala, el mapa lo dice | Capturas en los 4 tamaños aprobadas por María Paula |
| C4 | P0 | **Destino en el mundo** (#3), `marcadores.ts` montado con el gancho de A0: haz cian en el objetivo, ruta en el piso con `planearRuta` y flecha en el borde cuando queda fuera de cuadro. Sin estado de React por fotograma | Capturas con el objetivo dentro y fuera de cuadro; presupuesto de draw calls en verde |
| C5 | P1 | E4: pines de sitio con icono y nombre; mapa de Jezero fiel al relieve (con su fuente) | Capturas 1440x900 y 844x390 |
| C6 | P2 | Brújula arriba con la dirección del objetivo | Captura |

### Frente D — mallas, fidelidad, luz, día y noche, detalle y rendimiento

**Meta:** cada objeto se reconoce y se ve como en las láminas; la luz cuenta la hora del día; Marte se siente
real y la escena corre fluida.

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| D1 | P0 | **Fidelidad de mallas** contra `estaciones/`, `exterior/` y `mundo/01`: módulos (escudo, antena, reciclador), hábitats, corredores, edificios de la distribución de C2. Las 7 comprobaciones de ESCENAS §4.3 | Pares lámina/captura aprobados por María Paula |
| D2 | P0 | **Sombras y luz:** arreglar la sombra del personaje que falla (#24: probar el sesgo de sombra, que la cámara de sombra siga al niño y el tamaño del mapa de sombra); calidad de sombra por nivel; sombra de contacto de los personajes (que no floten); reglas de luz de MARTE.md | Video sin parpadeo de sombra al caminar; capturas en `alta`, `media` y `baja` |
| D3 | P0 | **Día y noche** (#16), `cicloDia.ts` montado con el gancho de A0: el sol dura 24,6597 h (NSSDC). En Jezero la luz pasa de día a tarde y al atardecer azulado al final de la misión. **No hay noche jugable** salvo que el motor modele que el panel no da energía de noche (regla de A con diseño): la imagen no puede contradecir a Iris cuando dice "sin sol no hay energía" | Tira de capturas por turno; la regla escrita con A |
| D4 | P0 | **Rendimiento** (#17): ≥ 30 fps en `media` en una laptop común; presupuesto por vista de 80 draw calls y 80 000 triángulos (prueba de `escena3d.test.ts`). Hoy `baja` (sin sombras, 0,75 de resolución) da 46 a 55 fps sin GPU; `media`, 17 a 26 | fps medidos antes y después con `medir: true` |
| D5 | P0 | **Interiores** (#25): corredor de conexión como `exterior/01-corredores-conexiones.png` (ventanas al invernadero, puertas laterales, piso con luces guía) y después las salas: taller (estación 05: dock de Iris, banco, panel en eje) y hábitat (06 a 08). Cada sala es su propia vista | La sala entra en el presupuesto; A la conecta; par lámina/captura aprobado por María Paula |
| D6 | P1 | Detalles que asombran, solo de ambiente: remolinos de polvo a lo lejos, Fobos y Deimos, polvo con viento, la nave en la plataforma. Cada fenómeno con fuente verificada por B y datos (§1) | Capturas; tabla de fuentes |
| D7 | P2 | La tormenta en el cielo y la luz, leída del estado del motor | Capturas antes y durante |

### Frente E — Santiago: UI de flujo, tarjetas que aparecen, HUD y menú

**Meta:** ninguna tarjeta fija; la interfaz aparece cuando el juego la necesita y se va al decidir.

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| E0 | P0 | Fusionar #331 (CI en verde) | `develop` con la e2e en verde |
| E1 | P0 | **Tarjetas contextuales** (#4): nacen de un evento del mundo (llegar, `[E]`, una novedad del motor), una a la vez, al costado o como hoja inferior, y se cierran al decidir. E5 deja de tener la lista y el panel fijos: aparecen al hablar con la Ingeniera o al usar un anclaje | Captura de E5 con el mundo libre; e2e de abrir y cerrar |
| E2 | P0 | **Una sola vía para el `[E]`** con `onInteractivo`: `Talk` abre el diálogo con `hablando`, `Build` abre la tarjeta del módulo, `Enter`/`Exit` cambia `sala`. Un solo manejador de teclado | Prueba por tipo; acercarse nunca cobra (invariante 1) |
| E3 | P0 | **HUD progresivo** según la tabla de §1 | e2e: al entrar a la base no se ve `Crew`; aparece después de la primera conversación |
| E4 | P0 | **Menú** (#7): cámara 1.ª/3.ª persona (se guarda en ajustes; `V` y el botón siguen), calidad gráfica, sonido e idioma | e2e: cambiar la cámara desde el menú conserva la partida (invariante 4) |
| E5 | P1 | Diálogo de la tripulación e Iris como globo o franja (estilo de F, anclaje de A) | Capturas en los 4 tamaños |
| E6 | P1 | e2e nuevas: seguir a Iris, construir caminando y que saltar no cobre (pausar el reloj antes de caminar: en CI no hay GPU) | Suite en verde en CI |
| E7 | P2 | Quitar los emojis de `Dialogos.tsx:7` (#19) | grep sin emojis en `ui/src` |
| E8 | P1 | **Flujo de entrada** (#26) según `inicio/04-flujo-entrada-carga-orbita-explorar.png`: portada, carga con consejo, llegada en órbita ("Arriving at Jezero", con `Skip`) y **"Ready to explore"** antes de la base: "Your crew is ready", `Explore the base` y `Show controls` (mouse, teclas, salto, `E`, `V`; en celular, los gestos) | e2e del recorrido de entrada; capturas en los 4 tamaños |

### Frente F — María Paula: UI visual, personajes B en la interfaz y fidelidad

**Meta:** las caras de la tripulación son las de la alternativa B en toda la interfaz; las tarjetas
aparecen y se van con gracia; todo respeta las láminas.

| # | Prio | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| F1 | P0 | **Retratos B** (#12): `tests/capturas/retratos.mjs` escribe `ui/public/retratos/<actor>-<cara>.png` con `rutaRetrato` y las caras de `frontera.ts`; `Retrato.tsx` usa el PNG y queda el SVG como respaldo | Capturas de portada, intro, carga, diálogo, tormenta y final con las caras nuevas |
| F2 | P0 | Diseño de las tarjetas contextuales y sus transiciones (120 a 200 ms, sin movimiento con `prefers-reduced-motion`), en escritorio y celular | Capturas en los 4 tamaños |
| F3 | P0 | **Autoridad de referencia:** aprueba el boceto del mapa (C3), la distribución (C2) y las mallas (D1) contra las láminas | Aprobación escrita en cada PR |
| F4 | P1 | Estilo del globo, del aviso `[E]` y del botón de salto táctil | Capturas |
| F5 | P1 | Revisión de capturas en cada encuentro, en los 4 tamaños | Lista de diferencias para cada dueño |
| F6 | P1 | **Pantallas de entrada** (#26): composición y orden de `inicio/04` (fondo espacial facetado, tarjetas marfil, insignia de sección). **El personaje es el niño de la alternativa B, no la capibara de la lámina**: la capibara está descartada (DISEÑO.md:274, HISTORIA.md:100, README.md:86); la carga sigue `inicio/03-panel-carga.png` | Capturas en los 4 tamaños aprobadas |

### Referencias de cada frente (en `docs/referenciapau/referencias/`)

| Frente | Láminas |
| --- | --- |
| A, D | Interior: `exterior/01-corredores-conexiones.png` y `estaciones/01` a `08` (con sus `b` y `c`) |
| C, D | Exterior: **`exterior/03-exterior-organizacion.png`** (así tiene que quedar la base), `exterior/02-kit-entorno-cultivos.png`, `mundo/01` y `mundo/02` |
| E, F | Entrada: **`inicio/04-flujo-entrada-carga-orbita-explorar.png`** (composición y orden; personaje: el niño B), `inicio/01`, `inicio/02` y `inicio/03`. Decisión y tripulación: `ui/01`, `ui/04` y `personajes/07` |
| A, B, F | Personajes: `personajes/` (alternativa B) |

---

## 5. Orden en paralelo y encuentros

| Bloque | A José | B | C | D | E Santiago | F María Paula |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | A0, empieza A3 | B0 | acuerdo con D | acuerdo con C | E0, acuerdo con F | acuerdo con E |
| 1 | A1, A2, A4, A5, A12, A13 | B1, B2, B5 | C1, C2 | D1, D2, D4 | E1, E2 | F1, F2 |
| 2 | A6, A7, A8, A3 aprobada | B3, B5 | C3, C4 | D3, D5 | E3, E4, E8 | F3, F4, F6 |
| 3 | A9, A10 | B4, B6, B5 | C5 | D6, D7 | E5, E6, E7 | F5 |

**Dependencias:** C4 y D3 necesitan A0. B3 necesita B0. A9 necesita E1. E5 necesita el anclaje de A (A2) y
el estilo de F (F4). D5 y A8 avanzan juntos.

**Encuentro al final de cada bloque:** cada uno fusiona sus PR en `develop`. Después, B juega 10 minutos
como un niño (B5) y todos miran el diario. Si en algún momento el niño no sabe adónde ir ni qué hacer, el
bloque no terminó aunque las pruebas pasen.

---

## 6. Reglas que no se negocian

- **El motor manda:** caminar, saltar, entrar a una sala o terminar una animación nunca da ni quita recursos
  (MECANICAS §5). La animación va después del cambio del motor.
- **Ciencia con fuente:** toda cifra o fenómeno real lleva su fuente; las suposiciones de juego se declaran.
  Separar evento observado, predicción, medición y regla de juego (MECANICAS §9).
- **Sin GLB ni librerías nuevas** además de three (DISEÑO §8). Presupuesto por vista: ≤ 80 draw calls y
  ≤ 80 000 triángulos; cada sala es su propia vista.
- **Bilingüe:** inglés primero, español después, siempre por i18n. Público de 7 a 10 años: frases cortas,
  nada de miedo, nada de franquicias.
- **Git:** rama `feat/<slug>-<tema>` o `fix/<slug>-<tema>` desde `origin/develop`; PR pequeño hacia
  `develop`; nunca empujar a `develop` ni a `main` (despliega). El equipo fusiona con squash: después de cada
  fusión, la rama nueva sale otra vez de `origin/develop`.
- **Antes de cada PR:** `npm run typecheck && npx vitest run && npm run build -w ui`, las e2e
  (`E2E_BASE_URL=http://localhost:5210 npx playwright test`) y capturas en 1440x900, 1024x683, 844x390 y
  390x844 (`node tests/capturas/capturar.mjs ui/capturas/<tema> http://localhost:5210`).
- **Informe de cada tarea:** qué se verificó (comando y resultado), qué no y qué está bloqueado. "Las pruebas
  pasan" no es "se juega": abrir el juego y comprobarlo.

## 7. Cómo dárselo a tu agente

Pegale al agente de Claude Code: §0, §1, §3, §6 y **la sección de tu frente** de §4, más esta instrucción:

> Lee `CLAUDE.md`, `docs/referenciapau/MECANICAS.md`, `ESCENAS.md`, `NIVELES.md` y
> `ui/src/escena/frontera.ts`. Trabaja solo en los archivos de tu frente (§3). Si necesitás algo de otro
> frente, abrí un issue con `bloquea:<frente>` y seguí con otra tarea. Verificá cada afirmación antes de
> darla por hecha.

## 8. Decisiones de este plan y por qué

| Decisión | Por qué |
| --- | --- |
| José se queda con flujo, mecánicas, movimiento y animación | Es lo más difícil y está todo acoplado: el gesto depende del paso de la misión y del movimiento |
| Ganchos de sistemas en `escena3d.ts` (A0) | Seis personas y un archivo central: los marcadores (C) y el día (D) se suman sin editar el archivo de A |
| Sin `LugarId` nuevos al redistribuir | Un lugar nuevo cambia el tipo que comparten agentes y UI; los sectores extra entran como salas (`SalaId`) o decorado |
| Sin noche jugable en Jezero por ahora | Una noche visual con el panel dando energía contradice lo que enseña Iris; la noche entra cuando el motor la modele |
| Retratos pre-renderizados desde los personajes B | Una sola identidad 2D/3D (DISEÑO §4.4) sin cargar three en la portada |
| `baja` dibuja a 0,75 de resolución | Medido: la base sube de 34 a ~50 fps sin GPU; es el nivel al que cae la escena cuando no rinde |
| Mirar con el mouse con Pointer Lock tras un clic | El navegador solo bloquea el puntero después de un gesto del usuario; sin bloqueo el cursor choca con el borde de la pantalla y no se puede girar 360°. Es el estándar de los juegos web. Abrir una tarjeta o el menú suelta el puntero para que el niño pueda hacer clic |
| La lámina `inicio/04` vale por composición, no por personaje | La capibara está descartada en DISEÑO, HISTORIA y README; el protagonista es el niño de la alternativa B |
