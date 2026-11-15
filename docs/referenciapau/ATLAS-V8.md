# Solar Shield — Atlas Integral v8 (guía completa en Markdown)

**Versión vigente: Atlas v8 · Consolidado de 68 páginas (`Solar-Shield-Atlas-integral-v8.pdf`) · Idioma base: `en`, respaldo completo `es` · Cero herencia de Plan B.**

Este documento reúne de forma estructurada todo el conocimiento técnico, visual, de UX, animación y precisión científica contenido en [Solar-Shield-Atlas-integral-v8.pdf](Solar-Shield-Atlas-integral-v8.pdf) (Capítulos 01 a 11) y lo indexa directamente con las **50 láminas curadas** en [`referencias/`](referencias/). Su propósito es que el equipo y los agentes lean la especificación completa sin parsear los `17,82 MB` del PDF, reservando el PDF para inspección de alta resolución cuando haga falta.

## Índice de capítulos del Atlas v8

| Cap. | Pág. PDF | Tema | Referencias visuales principales |
| --- | --- | --- | --- |
| 01 | 3 | Qué pasó con la muestra técnica | Prototipo descartado; ver reglas de autoridad abajo |
| 02 | 4–8 | Un solo inicio, capas, intro y carga | [`referencias/inicio/`](referencias/inicio/01-inicio-actualizado.png) y [`referencias/inicio/capas/`](referencias/inicio/capas/astronauta.png) |
| 03 | 9–11 | Mundo abierto por código y adaptación realista de Marte | Recetas procedurales + DEM real de Jezero (`data/terreno/jezero/`) |
| 04 | 12–21 | Familia de ocho estaciones modulares | [`referencias/estaciones/00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png) a [`08-refugio.png`](referencias/estaciones/08-refugio.png) |
| 04B | 22–36 | Ampliación v8: espacios completos y organización exterior | [`referencias/estaciones/`](referencias/estaciones/05b-almacen-logistica.png) (`02b`–`07c`), [`referencias/exterior/`](referencias/exterior/03-exterior-organizacion.png) |
| 05 | 37–40 | Assets individuales y reglas de reutilización | [`referencias/piezas/`](referencias/piezas/01-puerta-marco.png) (`01` a `10`) |
| 06 | 41–51 | Personajes humanos e Iris rover | [`referencias/personajes/`](referencias/personajes/00-familia-trajes.png) (`00` a `07`) |
| 07 | 52–56 | UI: botones, medidores, superficies y textos EN/ES | [`referencias/ui/`](referencias/ui/00-logo-actual.png) (`00` a `04`) |
| 08 | 57–60 | Flujo de interacción y especificación de animaciones | Secuencia de 11 pasos y tabla de tiempos UI/3D |
| 09 | 61–64 | Implementación en Three.js 0.160.0 + React 18 | Mapeo a `ui/src/`, caché de geometrías y contrato de assets |
| 10 | 65–67 | Revisión del reto NASA, precisión científica y prioridades | Tabla `P0 / P1 / P2` y límites obligatorios |
| 11 | 68 | Inventario, límites y siguiente revisión | Alcance documental vs aplicación |

---

## Cap. 01 — Muestra técnica previa y jerarquía de autoridad (pág. 3)

La captura del prototipo aislado de laboratorio en `docs/referenciapau/` mostró el menú HTML sin el contenido 3D a la derecha, pero sin error de consola ni estado WebGL adjunto no permite concluir una causa única en tiempo de ejecución. Ese código de muestra (`piezas-procedurales.js`) demuestra arquitectura de reutilización, **no apariencia aprobada**.

Orden de autoridad vigente para construir UI y escena 3D:
1. Decisiones explícitas del equipo y contratos reales del repositorio (`design/`, `engine/`, `missions/`, `data/`, `contracts/`).
2. [Guía maestra de construcción 3D procedural (`assets/GUIA-FABLE-V8.md`)](../../assets/GUIA-FABLE-V8.md).
3. Especificaciones escritas (`ATLAS-V8.md`, [`APLICACION.md`](APLICACION.md), [`AMPLIACION-ESPACIOS.md`](AMPLIACION-ESPACIOS.md), [`PLAN-IMPLEMENTACION-JEZERO.md`](PLAN-IMPLEMENTACION-JEZERO.md)).
4. Láminas curadas en [`referencias/`](referencias/) y PDF completo [`Solar-Shield-Atlas-integral-v8.pdf`](Solar-Shield-Atlas-integral-v8.pdf).

Ante cualquier contradicción entre un PNG generado y el texto técnico o las tablas de `engine/`/`design/`, **mandan el texto técnico y los contratos del código**.

---

## Cap. 02 — Pantalla de inicio única, intro y carga (págs. 4–8)

| Lámina | Archivo | Uso y límites |
| --- | --- | --- |
| Inicio actualizado (referencia principal) | [`referencias/inicio/01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png) | Composición objetivo: espacio índigo, niño flotando a la derecha, nave abajo derecha, marca + menú facetado a la izquierda. UI real siempre en DOM traducible EN/ES. |
| Inicio original | [`referencias/inicio/00-inicio-original.png`](referencias/inicio/00-inicio-original.png) | Composición base; se descarta la gran placa cian luminosa como estilo general de botones. |
| Intro en cuatro momentos | [`referencias/inicio/02-intro-cuatro-momentos.png`](referencias/inicio/02-intro-cuatro-momentos.png) | Presenta misión, observación, tripulación y autonomía sin ejecutar decisiones. Tiene botón omitir hacia el mismo briefing inicial. |
| Panel de carga | [`referencias/inicio/03-panel-carga.png`](referencias/inicio/03-panel-carga.png) | Ilustración ámbar, consejo corto y estado real de preparación. Usar indicador indeterminado si no hay progreso real medible; nunca fabricar porcentajes. |
| Recortes conceptuales de capas | [`astronauta.png`](referencias/inicio/capas/astronauta.png), [`nave.png`](referencias/inicio/capas/nave.png), [`planeta.png`](referencias/inicio/capas/planeta.png), [`asteroide.png`](referencias/inicio/capas/asteroide.png) | Guías de silueta y anclaje con transparencia; en la ruta 3D se reconstruyen con geometría y pivotes. |

### Capas de composición del inicio (`1536 x 1024`, relación `3:2`)

Preservar margen de lectura a la izquierda y protagonista a la derecha. Las coordenadas siguientes son cajas porcentuales aproximadas del lienzo de referencia:

| Orden / capa | Caja objetivo `x,y,w,h` (%) | Implementación y movimiento |
| --- | --- | --- |
| `0. Fondo` | `0,0,100,100` | Gradiente índigo y estrellas discretas sin UI horneada. Quieto por defecto. |
| `1. Decoración lejana` | Asteroide `39,7,10,13`; Planeta `79,15,16,14` | Mallas o capas con deriva opcional de hasta `4 px` en `8 s`. No pulsar estrellas de forma continua. |
| `2. Nave` | `78,63,22,37` | Anclada abajo a la derecha; recorte del borde intencional; pivote fijo. |
| `3. Tether / cable` | Entre mochila y conector de nave | Curva segmentada detrás del cuerpo y delante del fondo, extremos unidos a anclajes reales (`Socket_Tether`). Solo en el inicio orbital, nunca sobre Marte. |
| `4. Niño astronauta` | `49,18,31,57` | Cabeza visible, visor transparente real, mano levantada, flotación `6 px / 6 s` y giro máximo `1°`. Cuerpo y tether coordinados. |
| `5. Marca y subtítulo` | Logo `5,5,31,31`; subtítulo `6,32,29,5` | Conserva el recurso de logo oficial ([`referencias/ui/00-logo-actual.png`](referencias/ui/00-logo-actual.png)); no reescribir ni regenerar lettering. |
| `6. Menú` | `5,40,36,36` | Botones DOM/SVG facetados marfil: `Start mission`, `Continue` (solo con guardado válido) y `Settings`. |
| `7. Preferencias / créditos` | Arriba derecha / abajo izquierda | Idioma `EN/ES`, acceso opcional de cuenta/invitado, sonido, fuentes NASA y respaldo 2D. Orden de foco lógico independiente de capas decorativas. |
| `8. Ventanas y foco` | Sobre controles | Ajustes y fuentes con foco gestionado; capas decorativas con `aria-hidden="true"` y sin capturar puntero. |

**Reglas responsive y entrada única:**
- En `16:9`, preservar la altura del diseño y redistribuir espacio lateral sin estirar niño ni logo.
- En móvil, pasar el menú a flujo vertical, reducir decoración y no encoger textos ni controles por debajo del tamaño legible (`>= 44 x 44 CSS px`).
- Tiempos de entrada única: fondo en `180 ms`, marca en `240 ms`, niño en `320 ms`, menú desde `200 ms` con `45 ms` de escalonamiento entre botones y `220 ms` por control. Todas las acciones son clicables desde que aparecen; reentrar desde ajustes no repite la presentación.

---

## Cap. 03 — Mundo abierto construido con código y adaptación real de Marte (págs. 9–11)

El escenario es un **mundo abierto transitable** donde las estaciones conviven en el mismo mapa. El jugador explora en tercera o primera persona (`KeyV`), con alternativa 2D accesible equivalente y sin pasillos lineales obligatorios.

### Receta procedural por elemento abierto

| Elemento | Construcción en Three.js `0.160.0` | Regla técnica |
| --- | --- | --- |
| Terreno | `BufferGeometry` triangulada con altura calculada y zonas transitables | Semilla decorativa separada del RNG de misión; distinguir altura real del DEM de relieves decorativos. |
| Rocas y montañas | `IcosahedronGeometry` / buffers deformados con normales facetadas (`flatShading: true`) | Variar giro, escala y material por instancia; usar `InstancedMesh` para rocas repetidas sin sombras individuales en gravilla. |
| Caminos | Baldosas, rampas bajas y conexiones sobre anclajes `mundo.ts` | Dos recorridos en bucle y atajos; accesos despejados sin bloquear el flujo. |
| Paneles solares | Base, soporte, eje independiente (`head_axis_separate`), bastidor y celdas | Rotar el pivote del eje; prohibido reconstruir geometría en cada frame. |
| Plantas (solo interior) | Hoja maestra con volumen facetado, tallo, jardinera y frutos | Crecimiento visual únicamente desde estado autorizado por `engine/`. |
| Habitáculos | Suelo, paredes múltiplo de `1 m`, marco `ExtrudeGeometry` con bisel, puerta y techo/cúpula | Piezas comunes con caché compartida y props exclusivos por configuración. |
| Astronauta y tripulación | Casco, visor transparente separado, torso, mochila y extremidades articuladas por pivote | Proporciones infantiles propias para el niño; nunca reescalar al adulto. |
| Cables / tuberías | Curvas o buffers segmentados con extremos anclados | Actualizar atributos existentes si se mueven; no crear tubos nuevos en `requestAnimationFrame`. |

### Adaptación realista de Marte según datos NASA (conservando estética low-poly v8)

- **Identidad estética intacta:** siluetas low-poly con aristas biseladas, materiales mate cálidos (marfil `#F3EEE5`, lila `#EEE5F1`, ciruela `#53306D`, acentos cian `#73D4E1` y teal contenidos) y luz amplia diurna cálida desde arriba izquierda con sombras suaves lila/ciruela.
- **Entorno marciano con base científica (`data/terreno/jezero/`):**
  - El escenario se ubica en el cráter **Jezero**, usando el modelo digital de elevación medido de **NASA Mars Trek** (`elevacion.bin`, mezcla MOLA/NASA + HRSC/ESA-DLR, rejilla `280 x 280`, `~289 m/px`, rango de elevación `-3093 m` a `-501 m` en `76,9–78,3° E / 17,7–19,1° N`) y contexto de relieve/CTX (`sombreado.jpg`, `ctx/*.png`).
  - La física desacoplada en `ui/src/escena/fisica.ts` conserva la gravedad superficial real de Marte (`GRAVEDAD_MARTE = 3.73 m/s²`, NASA NSSDC Mars Fact Sheet).
  - La superficie exterior representa **regolito férrico oxidado, polvo fino, crestas de cráter y afloramientos basálticos facetados** bajo una atmósfera marciana diurna polvorienta cálida dentro de la paleta pastel v8 (prohibido el cielo azul nocturno de fantasía).
  - **Cero vegetación exterior y cero estructuras pétreas fantásticas:** en Marte la vida vegetal solo sobrevive presurizada dentro del domo del Invernadero o cubículos cerrados; quedan estrictamente prohibidos árboles al aire libre, pasto exterior, capibaras, estatuas, templos o ruinas.

---

## Cap. 04 y 04B — Estaciones modulares y organización exterior (págs. 12–36)

### Galería de estaciones y ampliación espacial

Vista general de despiece: [`referencias/estaciones/00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png)

| Estación / sector | Lámina base | Ampliación v8 (`04B`) | Piezas comunes y función específica |
| --- | --- | --- | --- |
| Esclusa y llegada | [`01-esclusa.png`](referencias/estaciones/01-esclusa.png) | — | Marco, hojas deslizantes con pivotes laterales, rack de cascos, indicador de presión, rampa. |
| Control de misión | [`02-control-mision.png`](referencias/estaciones/02-control-mision.png) | [`02b-control-operaciones.png`](referencias/estaciones/02b-control-operaciones.png) | Mesa de terreno central, consolas en ángulo con circulación trasera, cúpula, enlace pendiente real (no inventar telemetría). |
| Invernadero e hidroponía | [`03-invernadero.png`](referencias/estaciones/03-invernadero.png) | [`03b-invernadero-cultivos.png`](referencias/estaciones/03b-invernadero-cultivos.png) | Ventanas trianguladas, jardineras y bandejas repetibles (hoja, fruto, semillero), tanque y tubería; comunica alimentación dentro de soporte vital. |
| Laboratorio de muestras | [`04-laboratorio.png`](referencias/estaciones/04-laboratorio.png) | [`04b-laboratorio-investigacion.png`](referencias/estaciones/04b-laboratorio-investigacion.png) | Bancos, vitrina/cámara de experimento **de planta o roca** (sin esqueleto ni humano encapsulado), microscopio y consola. |
| Ingeniería, energía y almacén | [`05-ingenieria.png`](referencias/estaciones/05-ingenieria.png) | [`05b-almacen-logistica.png`](referencias/estaciones/05b-almacen-logistica.png) | Panel solar orientable en eje, baterías, banco de trabajo, dock de Iris y anexo de almacén (estantería por bahías, cajas, canisters, recepción). |
| Enfermería y atención | [`06-enfermeria.png`](referencias/estaciones/06-enfermeria.png) | [`06b-enfermeria-atencion.png`](referencias/estaciones/06b-enfermeria-atencion.png) | Camilla, carrito, botiquín **con emblema de escudo de la Doctora** (prohibida cruz roja), consola y tanque. Sin barra clínica separada. |
| Descanso, comedor y espacio común | [`07-descanso-comedor.png`](referencias/estaciones/07-descanso-comedor.png) | [`07b-comedor-descanso-marte.png`](referencias/estaciones/07b-comedor-descanso-marte.png) · [`07c-espacio-comun.png`](referencias/estaciones/07c-espacio-comun.png) | Mesas, bancos, raciones, literas, área común central de orientación (`07c`) con jardinera interior y suelo marciano árido al exterior (`07b`, sin árboles fuera). |
| Refugio solar | [`08-refugio.png`](referencias/estaciones/08-refugio.png) | — | Puerta, bancos, tanques, consola y cubierta de regolito con acento ámbar puntual. La protección la decide `engine/`, no caminar bajo un arco. |

### Organización exterior y conectores (`referencias/exterior/`)

- **Corredores y conexiones:** [`referencias/exterior/01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png) — cruces con múltiples salidas y canales de servicio ordenados sin cables sueltos que obstruyan el piso.
- **Kit de entorno y cultivos protegidos:** [`referencias/exterior/02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png) — rocas naturales pequeñas e independientes de las plantas protegidas.
- **Organización de la base abierta:** [`referencias/exterior/03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) — claro central legible con dos circuitos en bucle y atajos; separa plataforma de llegada/vehículo de zona de cultivo. Almacén y espacio común son ampliaciones visuales de `taller` y `habitat`: no añaden nuevos `LugarId` ni contratos sin decisión de equipo.

**Siete comprobaciones antes de integrar estaciones y exteriores:**
1. Paleta marfil/lila/ciruela/cian fiel bajo iluminación diurna de cámara de juego.
2. Entradas, pasillos y controles alcanzables y legibles sin bloqueos.
3. Muebles, sillas, rocas y tuberías fuera del paso peatonal y de cámara.
4. Posibilidad de consultar, salir y cambiar de estación sin circuito obligatorio.
5. Objetos interactivos claramente distinguibles del decorado estático.
6. Distinción explícita entre cultivo protegido, dato científico y regla de juego.
7. Ausencia total de estatuas, ruinas, templos, portales o construcciones de piedra fantasiosas.

---

## Cap. 05 — Assets individuales y nueve familias modulares (págs. 36–40)

Las nueve familias reutilizables compartidas entre salas y exterior son: **Estantería** (montante, travesaño, balda, fondo opcional), **Contenedor** (caja base, tapa, asa/cierre, canister), **Puesto de trabajo** (mesa, pantalla, soporte, silla), **Corredor** (suelo `1 m`, costilla, pared, cristal, puerta y conector T/cruce), **Cultivo** (hoja maestra, tallo, fruto, plántula, bandeja), **Mobiliario** (banco, mesa, armario, camilla, carrito), **Servicios** (tubo, codo, T, canaleta, enchufe, luminaria), **Envolvente exterior** (casco, puerta, rampa, techo, ventana, cúpula) y **Terreno** (suelo, rocas pequeñas, montículos y camino).

| Pieza | Referencia PNG | Fábrica / pivote | Regla de reutilización |
| --- | --- | --- | --- |
| Puerta marco | [`referencias/piezas/01-puerta-marco.png`](referencias/piezas/01-puerta-marco.png) | `door` · `base_center` | Hueco y biseles compartidos; hoja móvil con pivote lateral separado. |
| Consola | [`referencias/piezas/02-consola.png`](referencias/piezas/02-consola.png) | `consoleUnit` · `floor_center` | Carcasa y pantalla separadas; nunca hornear telemetría falsa ni texto en textura. |
| Caja | [`referencias/piezas/03-caja.png`](referencias/piezas/03-caja.png) | `crate` · `floor_center` | Geometría maestra con variantes de escala, giro, acento e instanciación. |
| Panel solar | [`referencias/piezas/04-panel-solar.png`](referencias/piezas/04-panel-solar.png) | `solarPanel` · `base_center; head_axis_separate` | Gira en eje físico sin generar energía visualmente por fuera del motor. |
| Jardinera | [`referencias/piezas/05-jardinera.png`](referencias/piezas/05-jardinera.png) | `planter` / `plant` / `leaf` · `base_center` | Maceta compartida; variación determinista por semilla decorativa. |
| Depósito | [`referencias/piezas/06-deposito.png`](referencias/piezas/06-deposito.png) | `tank` · `base_center` | Cuerpo, tapas y nivel; nivel solo cambia con estado autorizado. |
| Banco | [`referencias/piezas/07-banco.png`](referencias/piezas/07-banco.png) | `bench` · `floor_center` | Base y cojines repetibles entre salas; sentarse no altera recursos. |
| Antena | [`referencias/piezas/08-antena.png`](referencias/piezas/08-antena.png) | `antenna` · `base_center` | Base, mástil, plato y eje; enlace Tierra depende de ticks reales. |
| Kit interior y logística | [`referencias/piezas/09-kit-interior-logistica.png`](referencias/piezas/09-kit-interior-logistica.png) | Biblioteca interior compartida | Bahías, recipientes, herramientas y muebles instanciados por configuración. |
| Kit exterior modular | [`referencias/piezas/10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png) | Envolventes y conectores | Reinterpretado en familia marfil/lila/cian (no amarillo/negro industrial). |

---

## Cap. 06 — Personajes: mismo traje, identidades distintas (págs. 41–51)

Lámina conceptual de familia de trajes: [`referencias/personajes/00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png) · Lámina de mecánicas de tripulación: [`referencias/personajes/07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png).

**Reglas de identidad y jerarquía:**
- **Protagonista humano (niño astronauta):** proporciones infantiles propias (cabeza/cuerpo y extremidades distintos; **prohibido reescalar al adulto**). Traje marfil, cuello/guantes teal/cian, botas índigo, visor transparente real (nunca opaco); `Socket_Tether` activo solo en el inicio orbital.
- **Tripulación experta (siempre personas humanas, nunca robots):** aunque sus respuestas se apoyan en agentes (`@solar-shield/agents`), su representación en retratos 2D y modelos 3D es humana. **Importante:** `00-familia-trajes.png` copió erróneamente el emblema de herramienta en todos los trajes; mandan las fichas individuales siguientes:

| Personaje | Referencias | Identidad y accesorios obligatorios |
| --- | --- | --- |
| Ingeniera (`ingeniera`) | [`01-ingeniera-poses.png`](referencias/personajes/01-ingeniera-poses.png), [`02-ingeniera-rostros.png`](referencias/personajes/02-ingeniera-rostros.png) | Adulta, cabello castaño rojizo, acentos **naranja**, herramienta/tableta en `Socket_Hand_R`. |
| Doctora (`doctora`) | [`03-doctora-poses.png`](referencias/personajes/03-doctora-poses.png), [`04-doctora-rostros.png`](referencias/personajes/04-doctora-rostros.png) | Adulta morena, gafas octagonales, acentos **teal**, bolso con escudo propio de rol (sin cruz roja). |
| Meteoróloga (`meteorologa`) | [`05-meteorologa-poses.png`](referencias/personajes/05-meteorologa-poses.png), [`06-meteorologa-rostros.png`](referencias/personajes/06-meteorologa-rostros.png) | Adulta, cabello **plateado**, acentos **ciruela**, dispositivo de lectura solar; no recolorear el cuerpo de la Ingeniera. |
| Matemático (`matematico`) | Retrato humano del rol (`ui/`) | Conserva representación humana en consultas/traje cuando participa en el flujo. |
| **Iris (`ia_base`)** | En escena (`ui/src/escena/activos/iris.ts`) | **Rover solar compacto de 4 ruedas** con pivotes independientes, panel en techo y pantalla frontal con ojos animados en canvas. **Es el enrutador (`tutorial` -> `pistas` -> `offline`) que se daña por radiación (`danada`) cuando el jugador ya puede tomar decisiones**, requiriendo verificación con la Ingeniera (`verificarIris`). Nunca humanoide ni dron volador. |

**Jerarquía y clips requeridos:**
- `Root > Rig > Hips/Spine/Head/Arms/Legs`, `Socket_Hand_R` (herramienta), `Socket_Back` (mochila) y `Socket_Tether` (solo inicio). Visor en superficie transparente (`Glass`) separada, sin doble capa coincidente.
- Gestos requeridos: respiración en reposo (`idle`), caminar, mirar/interesar, explicar/señalar, inspeccionar, reparar, confirmar y recuperación. En Three.js procedural se animan rotaciones de grupos con pivote y curvas compartidas.

---

## Cap. 07 — UI: botones, medidores, paleta y textos EN/ES (págs. 52–56)

Referencias visuales en [`referencias/ui/`](referencias/ui/00-logo-actual.png):
- Logo oficial: [`00-logo-actual.png`](referencias/ui/00-logo-actual.png)
- Diálogo y decisión aplicados: [`01-dialogo-decision.png`](referencias/ui/01-dialogo-decision.png)
- Botones Crew / Map: [`02-botones-crew-map.png`](referencias/ui/02-botones-crew-map.png)
- Catálogo completo de variantes facetadas: [`03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png)
- Consulta, comparación, fuente y confirmación: [`04-consulta-comparacion-fuente.png`](referencias/ui/04-consulta-comparacion-fuente.png)

### Paleta de referencia y regla de medidores
- **Marfil `#F3EEE5`** (tarjetas y botones base), **Lila `#EEE5F1`** (diálogos y hover), **Ciruela `#53306D`** (texto de contraste, sombras suaves y alternativa oscura puntual), **Cian `#73D4E1`** (acento contenido y foco exterior de teclado).
- **Tres medidores separados siempre:** **Energía**, **Soporte vital** y **Blindaje**. Prohibido fundirlos en una sola barra o inventar una barra de salud clínica independiente.
- **Dimensiones mínimas:** áreas táctiles `>= 44 x 44 CSS px`; texto principal `18–20 px` escalable; anillo de foco exterior cian + trazo oscuro **nunca recortado** por `clip-path`.

### Conducta de componentes clave
- **Acción principal (`Place panel` / `Instalar panel`):** una por decisión, mayor peso visual.
- **Acción secundaria (`Back`, `Ask another expert`, `Crew`, `Map`):** menor peso, superficie visible en cancelar.
- **Estados diferenciados:** `normal` (marfil), `hover` (lila tenue), `pressed` (reduce sombra y relieve sin mover el layout), `focus` (anillo exterior visible), `disabled` (atenuado legible + motivo explícito), `selected` (marca persistente + texto), `busy` (mismo ancho, etiqueta de estado, bloqueo de doble envío).
- **Mensajes y fuentes:** éxito con check, advertencia con triángulo, error con cruz, pendiente con reloj (texto además del color). La tarjeta de fuente muestra identificador, fecha y distinción dato real/regla solo si existen en los datos.

### Textos canónicos EN / ES (`ui/i18n/en.json` base y `es.json`)

| EN (idioma base) | ES | Significado operativo |
| --- | --- | --- |
| `Continue` | `Continuar` | Avanza explicación o abre comparación; nunca ejecuta ni cobra acción. |
| `Ask another expert` | `Consultar a otra experta` | Conserva propuesta y contrasta prioridades entre expertas. |
| `Costs now / Later` | `Costo ahora / Después` | Separa débito inmediato del efecto diferido; sustituir `Later` por plazo real cuando el motor lo informe. |
| `Place panel / Back` | `Instalar panel / Volver` | Confirma una sola vez / cancela antes de confirmar sin gasto. |
| `Benefit pending` | `Beneficio pendiente` | Efecto aún en cola; no sumar antes del tick del motor. |
| `Reply pending` | `Respuesta pendiente` | Telemetría enviada; muestra ticks restantes reales. |
| `Archived data / View source` | `Datos históricos / Ver fuente` | Indica procedencia histórica sin aparentar datos en vivo. |

*(Los ejemplos `70/80/60` y `28/20/12` y `-6 energía / -3 soporte vital -> +14 después` de las láminas son ilustrativos: la UI real lee siempre los saldos y plazos reales de `@solar-shield/engine`.)*

---

## Cap. 08 — Flujo de interacción y tabla de animaciones (págs. 57–60)

### Ciclo completo de decisión en 11 pasos (mundo abierto, sin candados entre salas)

| Paso | Lo que ve y hace el jugador | Criterio de transición |
| --- | --- | --- |
| `0. Inicio` | Logo actual, iniciar, continuar (solo con guardado válido), ajustes `EN/ES`, acceso opcional cuenta/invitado, sonido, fuentes, créditos. | `Start mission` abre presentación o briefing; `Continue` restaura estado completo. |
| `1. Intro y carga` | Intro omitible en 4 momentos + carga real con consejo e indicador honesto. | Omitir lleva al mismo briefing; fallo permite reintentar conservando estado. |
| `2. Briefing` | Objetivo claro en Jezero, controles, tres recursos e Iris presente. | Se entiende objetivo y consulta sin manual externo. |
| `3. Órbita y mapa` | Suelta satélite, traza ruta y compara sitios candidatos con sus criterios y deltas. | Cada confirmación ejecuta acción admitida en motor. |
| `4. Llegada y módulos` | Coloca los dos módulos permitidos viendo costo y beneficio antes de confirmar. | Invernadero explica comida dentro de soporte vital y consumo eléctrico. |
| `5. Explorar e inspeccionar` | Camina o usa lista de lugares, alterna cámara (`KeyV`) e inspecciona controlador/invernadero/refugio. | Mismas reglas en ambas cámaras y respaldo 2D; mirar no construye ni blinda. |
| `6. Consultar` | Elige experta humana o escribe pregunta; recibe consejo, prioridad y fuente. | Pulsar retrato solo selecciona/consulta. |
| `7. Comparar y verificar` | Ve `ahora / después`, alternativas y fuente; detecta falla de Iris (`ia_base === "danada"`). | `Back` cancela sin gasto; el motor manda sobre la IA. |
| `8. Confirmar y observar` | Confirma una vez; costo aplicado al instante y beneficio queda pendiente por ticks. | Registra causa; al cumplirse el plazo vincula efecto con decisión. |
| `9. Tormenta` | Evento histórico con fuente; expertas contrastan prioridades (`elegirDilema()`); pausa automática. | Todo resguardo tiene tradeoff real; cero urgencia artificial de lectura. |
| `10. Comunicaciones` | Envía telemetría, paga costo y observa ticks restantes en `telemetriaPendiente`. | Espera por ticks de motor; siguen disponibles acciones locales. |
| `11. Cierre` | Resultado (`exito` / `fallo`), cadena decisión -> efecto, tarjetas ciencia y pregunta final. | Distingue azar y decisión; permite repetir semilla o probar nueva. |

**Secuencia obligatoria de estado al actuar:**
`Explorar -> inspeccionar -> consultar -> comparar -> verificar fuente -> confirmar -> motor valida/aplica una sola vez -> HUD actualiza saldo real -> adaptador emite feedback una vez por secuencia/tick -> escena y UI animan`.

### Tabla maestra de animaciones UI y escena

Curvas globales: entrada `cubic-bezier(.2,.8,.2,1)` · salida `cubic-bezier(.4,0,1,1)`. Usar CSS para estados, Web Animations API sobre nodos wrapper separados (`position-wrapper` y `feedback-wrapper` sin competir por `transform`) para efectos únicos y rotaciones de pivotes `Group` en Three.js.

| Disparador | Movimiento y duración | Regla de control y accesibilidad |
| --- | --- | --- |
| Botón aparece | Opacidad `0 -> 1`, `Y 8 -> 0 px`, `220 ms` | Una vez al entrar; cancelar al desmontar. |
| Hover (puntero fino) | `Y -2 px`, tinte/sombra leve, `120 ms` (sale en `100 ms`) | No equivale a selección. |
| Presionar | `Y +1 px`, escala `.985`, sombra menor, `70 ms` | Teclado activa una sola vez; soltar fuera cancela. |
| Foco | Anillo oscuro + cian inmediato (`0 ms`) | Siempre visible y fuera de `clip-path`. |
| Seleccionar opción | Check y borde persistentes, `140 ms` | Nunca cobra recursos al seleccionar. |
| Deshabilitar / procesar | Color y etiqueta, `100 ms` | Tamaño estable, sin pulsos infinitos ni porcentajes falsos. |
| Abrir diálogo / comparación | Opacidad + `Y 12 -> 0 px`, `220 ms` | **Pausa y foco entran al instante de abrir**, no al acabar la animación. |
| Cerrar panel | Opacidad + `Y 0 -> 8 px`, `140 ms` | Bloquear clic trasero al salir y devolver foco al origen; `Escape` cancela. |
| Nueva línea de diálogo | Fundido `120 ms` | Texto completo inmediato; parpadeo de retrato `100 ms` cada `4–7 s`. |
| Gasto confirmado | Saldo cambia al instante; delta negativo sube `10 px` en `700 ms`; relleno `280 ms` | Número y `aria-valuenow` reales inmediatamente. |
| Daño por evento | Delta con causa, realce local `180 ms`, rastro `450 ms` | Sin sacudir pantalla ni flash rojo estroboscópico. |
| Beneficio recibido | Delta positivo `700 ms`, check `160 ms`, relleno `280 ms` | Disparar únicamente al aplicarse el efecto en motor, nunca al pulsar confirmar ni al acabar un clip. |
| Recurso bajo | Icono + texto persistente al cruzar umbral | Señal única al cruzar umbral, sin alarma repetida cada tick. |
| Pendiente | Reloj estático + texto en `120 ms` al cambiar tick | No girar reloj sin fin ni fingir cuenta por segundos. |
| Módulo instalando / operativo | Instalando `400 ms`; luz/check operativo `240 ms` | Reconciliar siempre desde estado real; no declara operativo antes que el motor. |
| Fuente / tooltip | Fundido `120 ms` | Operable por teclado y restaura foco al cerrar. |
| Cambiar cámara (`KeyV`) | Interpolación `300 ms` sin atravesar paredes | En `prefers-reduced-motion`: corte directo conservando orientación. |
| Tormenta / resultado | Alerta `240 ms` + música opcional autorizada | Solo tras evento real del motor; prohibido estrobo o muerte narrativa. |

**Con `prefers-reduced-motion: reduce` (obligatorio en CSS y JS):** eliminar deriva, giros flotantes, desplazamientos de cámara/tarjetas y escalados; fundidos instantáneos o directos; conservar cambios reales de saldo, etiquetas y anillo de foco; pausar audio/loop cuando `document.hidden` sea verdadero (`visibilitychange`).

---

## Cap. 09 — Implementación técnica Three.js `0.160.0` + React 18 (págs. 61–64)

| Capa / módulo `ui/src/` | Responsabilidad exacta según Atlas v8 |
| --- | --- |
| `ui/src/escena/materiales.ts` | Caché compartida de geometrías base inmutables (`Map<string, BufferGeometry>`) y slots definidos (`SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`); clona únicamente `Accent` cuando cambia el rol. |
| `ui/src/escena/liberar.ts` | Libera instancias con dueño explícito respetando cachés compartidas frente al doble montaje de React 18 `StrictMode`. |
| `ui/src/escena/escena3d.ts` y `EscenaBase.tsx` | Un único `WebGLRenderer` (`ACESFilmicToneMapping`), `setPixelRatio(Math.min(dpr, 1.5))` (`1` en baja), degradación `3D completo -> 3D liviano -> respaldo 2D`, tope `< 80` draw calls y `< 80 000` triángulos por vista, `visibilitychange`, recuperación de `webglcontextlost`, cero asignaciones por frame. |
| `ui/src/escena/vista.ts` | Derivador puro y determinista desde `GameState` hacia presencia/estado visual; nunca calcula costos ni ticks. |
| `ui/src/escena/mundo.ts` y `fisica.ts` | Anclajes reales (`1 u = 1 m`), gravedad de Marte `3.73 m/s²` y colliders separados de mallas artísticas. |
| `ui/src/componentes/Hud.tsx` | Tres placas `ResourcePlaque` independientes (`energía`, `soporte vital`, `blindaje`) con capa separada de delta/causa por tick. |
| `Dialogos.tsx`, `Tripulacion.tsx`, `Acciones.tsx`, `ColocarModulos.tsx`, `Tormenta.tsx` | Unificación gradual en átomos/compuestos v8 (`FacetButton`, `ExpertPortrait`, `DialogueCard`, `CostRow`, `PendingEffect`, `DecisionCard`) sin romper contratos ni reglas existentes. |

**Contrato de nomenclatura procedural (`1 u = 1 m`, `Y` arriba):** `Station_Greenhouse`, `Door_Frame_A`, `Door_Leaf_L/R`, `Socket_Entry`, `Socket_Console`, `Collider_*`, pivotes base-centro en estáticos y bisagra/eje real en partes móviles (`head_axis_separate`). Uso obligatorio de `InstancedMesh` para repetidos estáticos con mapa `instanceId -> assetId/lugar`.

---

## Cap. 10 y 11 — Precisión científica NASA y prioridades P0 / P1 / P2 (págs. 65–68)

### Cinco reglas científicas no negociables en la UI
1. **Separar medición, modelo y juego:** distinguir evento observado, predicción ENLIL, medición instrumental y regla de juego. **Nunca etiquetar puntos del balance del juego como "según NASA".**
2. **Gale vs. Jezero:** explicitar que la dosis medida de tormenta (`RAD/Curiosity`, mayo 2024) proviene del cráter **Gale** y se usa como referencia educativa en un entrenamiento ambientado en **Jezero**; no afirmar medición local de RAD en Jezero.
3. **Kp es terrestre:** no presentar el índice `Kp` como dosis en Marte ni mezclar dosis absorbida (`Gy`) con dosis equivalente (`Sv`) sin fuente verificada por el responsable de datos.
4. **Invernadero como simplificación educativa:** aclarar que el cultivo/alimento se modela dentro de `soporte_vital` y su costo eléctrico, sin pretender simulación agrícola realista continua desde la animación.
5. **Blindaje de juego:** no confundir una barra de blindaje ni entrar físicamente a una malla con protección dosimétrica humana validada.
6. *(Atribución obligatoria visible)*: mostrar fuente, fecha de consulta, `"datos reales, no en vivo"` y `"proyecto no oficial, no avalado por NASA"` (`ui.aviso.nasa` + `<TarjetaFuente />`).

### Checklist de prioridades del reto (`P0 -> P1 -> P2`)

| Prioridad | Objetivo concreto | Criterio de cierre |
| --- | --- | --- |
| `P0` | Reconfirmar Details/Resources oficiales del reto. | Clasificar requisitos vs sugerencias con enlace y fecha. |
| `P0` | Unificar consulta, comparación, confirmación y rechazo/cancelación en toda acción. | Decisión completa con cobro único visible y cancelación limpia antes de confirmar. |
| `P0` | Cerrar semántica de invernadero, comida en soporte vital y extras del dilema. | Tabla acordada y explicación coherente sin fórmulas nuevas en UI. |
| `P0` | Mostrar retrasos reales, costo inmediato, efecto pendiente y cadena de causas. | Telemetría pendiente y efectos vinculables a su decisión en cierre. |
| `P0` | Validar contexto científico y tarjetas de fuente en demo. | Identificador, fecha, lugar/instrumento y distinción real/modelo/juego. |
| `P0` | Prueba de recorrido completo con persona externa al equipo. | Jugador explica qué sacrificó y por qué; observaciones sin datos personales de menores. |
| `P1` | Auditoría de teclado, contraste, `EN/ES`, móvil y respaldo 2D. | Recorrido equivalente con foco restaurado y controles `>= 44 px`. |
| `P1` | Separar demo fija (`partidaDorada`), nueva semilla y continuación con guardado válido. | Repetición reproducible y restauración íntegra si se habilita. |
| `P1` | Preparar demo pública, créditos, declaración de IA (`docs/ia-uso.md`) y entrega. | Checklist de entrega verificado con infra y orquestación. |
| `P2` | Ampliar las 8 estaciones completas, cuerpos 3D de las 3 expertas, voz y tema oscuro alternativo. | Solo después de cerrar el flujo central y tras congelamiento. |
