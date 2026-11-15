# DISEÑO: dirección visual de Solar Shield (v8)

**Qué es:** el contrato de cómo se ve el juego. **Qué no es:** reglas de juego (ver [MECANICAS.md](MECANICAS.md)) ni código (ver [APLICACION.md](APLICACION.md)).
**Cómo usarlo:** antes de construir una pieza, buscá su sección aquí, abrí la lámina enlazada y replicala con fidelidad. Si algo no está aquí ni en la lámina, preguntá antes de inventarlo.

---

## 1. La idea visual en una frase

**Low-poly facetado, cálido y amable, sobre un Marte científicamente creíble.** Siluetas grandes con biseles marcados, materiales mate de color plano (sin texturas fotográficas), luz diurna amplia desde arriba a la izquierda, sombras suaves teñidas de lila y ciruela, y un único acento cian para lo que se puede tocar.

Referencias que fijan el tono, en este orden:

1. [`mundo/01-exterior-tercera-persona.png`](referencias/mundo/01-exterior-tercera-persona.png): la vista principal del juego (cámara, escala, HUD, interacción).
2. [`inicio/01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png): la portada.
3. [`personajes/00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png): la familia de trajes.
4. [`ui/03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png): la familia de controles.

> **Única desviación obligatoria de las láminas:** el cielo azul de `mundo/01` y `mundo/02` no es el cielo de Marte de día. Se reemplaza por el cielo de [MARTE.md](MARTE.md) §4. Todo lo demás de esas láminas (composición, terreno, edificios, HUD) se replica.

---

## 2. Paleta (tokens)

Los hex de la UI son objetivos de diseño fijados por el atlas. Los de personajes y entorno se **muestrearon de las láminas** y deben calibrarse en la cámara real del juego: un hex no garantiza el mismo color después de luz y tone mapping.

### 2.1 UI y marca (fijos)

| Token | Hex | Uso |
| --- | --- | --- |
| `marfil` | `#F3EEE5` | Tarjetas, botones base, placas del HUD. |
| `lila` | `#EEE5F1` | Diálogos anchos, hover. |
| `ciruela` | `#53306D` | Texto de contraste, sombras suaves de UI, superficie oscura alternativa. |
| `cian` | `#73D4E1` | Acento contenido, foco exterior de teclado, contorno del objeto interactivo. |
| `indigo-texto` | muestrear de `ui/03` | Texto principal sobre marfil. |
| `ambar` | muestrear de `inicio/03` | Solo pantalla de carga y señal puntual del refugio. |

### 2.2 Trajes y personajes (muestreados de `personajes/00-familia-trajes.png`, calibrar)

| Token | Hex aproximado | Dónde |
| --- | --- | --- |
| `traje-marfil` | `#FCE6D6` | Cuerpo de todos los trajes. |
| `teal` | `#47AAB5` | Cuello, guantes, acento de la Doctora y del niño. |
| `naranja` | `#F88536` | Acento de la Ingeniera (hombros, mochila, cinturón). |
| `ciruela-traje` | `#94478B` | Acento de la Meteoróloga. |
| `indigo-botas` | `#675B95` | Botas de todos. |

### 2.3 Entorno marciano (base de las láminas, corregida por MARTE.md)

| Token | Hex aproximado | Origen |
| --- | --- | --- |
| `regolito-claro` | `#FA8D6F` | Suelo iluminado (`mundo/01`). |
| `regolito-medio` | `#B76A78` | Suelo en media sombra. |
| `roca-basalto` | `#813E55` | Caras oscuras de roca. |
| `sombra-suelo` | `#F8B9B2` a lila | Sombras proyectadas: nunca negras, siempre teñidas de lila o ciruela. |
| `camino` | `#BDAFC4` | Baldosas lila grisáceo. |
| `montana-lejana` | `#8975C6` | Cordillera lejana desaturada hacia lila (perspectiva atmosférica). |
| `cielo-dia` | ver [MARTE.md](MARTE.md) §4 | Reemplaza el azul de la lámina. |

**Regla de proporción:** marfil y regolito dominan; lila y ciruela dan profundidad; el cian ocupa poco espacio y siempre significa "esto se puede usar o tiene foco". Nunca usar cian como decoración general.

---

## 3. Estilo de modelado, materiales y luz

### 3.1 Forma

- **Facetado con intención:** polígonos grandes y legibles. Normales planas (`flatShading`) en rocas, terreno, hojas, cascos y cabello. Biseles (chaflanes) en marcos, consolas, cajas y bordes de botones.
- **Siluetas esculpidas, no primitivas crudas:** un casco es una cúpula facetada con aro, no una esfera; una puerta es un marco extruido con chaflán, no una caja. Si una pieza se puede confundir con un cubo de prueba, no está terminada.
- **Esquinas recortadas** (octógono) como firma de la familia: botones, placas, retratos, ventanas, marcos de puerta y bases de equipos repiten el mismo chaflán a 45°.
- **Escala real:** `1 u = 1 m`. Puertas para un adulto con casco, el niño claramente más bajo que las adultas.

### 3.2 Materiales

- Mate, color plano, sin texturas fotográficas ni ruido. La variación sale de la geometría y la luz.
- Vidrio (visores, cúpulas, ventanas): transparente, ligeramente lila, con reflejo suave. **Nunca opaco**: la cara del personaje siempre se ve.
- Emisivos: solo pantallas activas, luces de estado y balizas de camino (cian). Pocos y pequeños.
- Slots de material compartidos: `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant` (detalle en [APLICACION.md](APLICACION.md) §3).

### 3.3 Luz y cámara

- Luz principal cálida, amplia, **desde arriba a la izquierda**. Relleno suave frío. Sombras suaves, teñidas de lila (nunca negras).
- Exterior de día: sol más débil y más blanco que en la Tierra, cielo que tiñe todo de cálido ([MARTE.md](MARTE.md) §5).
- Cámara de juego en tercera persona alta y por detrás del niño, ligera picada (ver `mundo/01`). Primera persona con guantes visibles en las esquinas inferiores (ver `mundo/02`). Las dos cámaras muestran el mismo mundo con las mismas reglas.
- Cuatro ambientes de luz de referencia, definidos por [`personajes/10-nino-luz-lectura.png`](referencias/personajes/10-nino-luz-lectura.png): **día en Marte**, **interior/laboratorio**, **atardecer exterior**, **alerta/refugio**. Todo personaje y material se valida en los cuatro.

---

## 4. Personajes

### 4.1 Familia común

Todos comparten la misma familia de traje ([`personajes/00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png)): **traje, casco, visor, guantes, botas, mochila y accesorios** (las 7 piezas de la fila superior de la lámina). La identidad la dan **cabeza, rostro, piel, cabello, gafas, color de acento, emblema y accesorios**, nunca solo un cambio de color.

> **Error conocido de la lámina 00:** repite el emblema de herramienta en todos los trajes. Cada rol lleva su propio emblema (herramienta para la Ingeniera, escudo para la Doctora, Sol para la Meteoróloga). El niño no hereda el emblema de la Ingeniera.

Jerarquía para animar por pivotes: `Root > Rig > Hips / Spine / Head / Arms / Legs`, más `Socket_Hand_R` (herramienta), `Socket_Back` (mochila) y `Socket_Tether` (cable, solo en la portada).

### 4.2 Fichas de identidad

| Personaje | Láminas | Identidad que se conserva | Acento y accesorio |
| --- | --- | --- | --- |
| **Niño astronauta** (protagonista, el jugador) | [`08` poses](referencias/personajes/08-nino-proporciones-poses.png), [`09` rostros](referencias/personajes/09-nino-rostros.png), [`10` luz](referencias/personajes/10-nino-luz-lectura.png), [`inicio/capas/astronauta`](referencias/inicio/capas/astronauta.png) | Cabello castaño oscuro, piel morena clara, rostro alegre. **Proporción infantil propia:** cabeza grande respecto al cuerpo, extremidades cortas. Prohibido escalar el cuerpo adulto. | Traje marfil, cuello y guantes teal, botas índigo, antena corta en el casco. Cable (tether) solo en la portada orbital. |
| **Ingeniera** (`ingeniera`) | [`01` poses](referencias/personajes/01-ingeniera-poses.png), [`02` rostros](referencias/personajes/02-ingeniera-rostros.png) | Adulta, cabello castaño rojizo a los hombros. | Naranja (hombros, mochila, cinturón). Tableta y llave en `Socket_Hand_R`. Emblema de herramienta. |
| **Doctora** (`doctora`) | [`03` poses](referencias/personajes/03-doctora-poses.png), [`04` rostros](referencias/personajes/04-doctora-rostros.png) | Adulta de piel morena, cabello oscuro recogido, **gafas octagonales**. | Teal. Bolso cruzado con **escudo** (nunca cruz roja). |
| **Meteoróloga** (`meteorologa`) | [`05` poses](referencias/personajes/05-meteorologa-poses.png), [`06` rostros](referencias/personajes/06-meteorologa-rostros.png) | Adulta, **cabello plateado** corto. | Ciruela. Símbolo del Sol, catalejo, tableta de lectura, maletín. No es la Ingeniera recoloreada. |
| **Matemático** (`matematico`) | Sin lámina propia | Humano, misma familia de traje. | Pendiente de lámina: no inventar rasgos hasta tenerla; usar retrato neutro de la familia. |
| **Iris** (`ia_base`) | [`mundo/01`](referencias/mundo/01-exterior-tercera-persona.png), [`mundo/02`](referencias/mundo/02-exterior-primera-persona.png), [`personajes/07`](referencias/personajes/07-tripulacion-mecanicas.png) | **Rover solar compacto de 4 ruedas:** cuerpo marfil en caja con chaflanes, pantalla frontal oscura con dos ojos cian, panel solar en el techo, antena corta, ruedas oscuras gruesas. No humanoide, no vuela. | Rover 3D en el mundo desde el bloque 2; en las tarjetas de diálogo, un retrato del mismo rover. Estado dañado visible: ojos con falla, pantalla con interferencia, color de alerta. |

En las láminas de estaciones aparecen figuritas humanas con rasgos distintos: **mandan siempre estas fichas**.

### 4.3 Poses y gestos (exactamente los de las láminas)

Cada ficha de cuerpo trae **frente, perfil y espalda** (turnaround para fijar volúmenes) y seis gestos:

| Personaje | Gestos de la lámina |
| --- | --- |
| Niño | idle, walk, wave, inspect, kneel, talk |
| Ingeniera | idle, walk, explain (señala una consola), inspect (tableta), repair (rodilla en el suelo, llave), confirm (pulgar arriba) |
| Doctora | idle, walk, listen, explain (tableta con escudo), check (tableta de dosis), reassure (mano abierta) |
| Meteoróloga | idle, walk, observe (catalejo), explain (tableta con Sol), alert (agachada junto a un sensor en trípode), verify (agachada con maletín) |

Gestos funcionales requeridos para el juego (se construyen combinando los anteriores): respirar en reposo, caminar, mirar con interés, explicar/señalar, inspeccionar, reparar, confirmar y recuperarse. **Un gesto nunca entrega recursos ni decide por el jugador.**

### 4.4 Rostros de diálogo

Ocho expresiones por personaje, mismas para todos: **neutral, happy, curious (niño) o thinking (adultas), concerned, talk/closed, talk/open, talk/round, blink**. Ojos, boca y visor legibles a tamaño de retrato. El retrato de la UI y el personaje 3D son la **misma identidad**: no se dibuja un avatar distinto para la interfaz. La información importante siempre va en texto; una cara preocupada no reemplaza una cifra con fuente.

---

## 5. Sistema de interfaz

Láminas: [`ui/03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png) (biblioteca completa), [`ui/02-botones-crew-map.png`](referencias/ui/02-botones-crew-map.png) (geometría exacta del botón), [`ui/01-dialogo-decision.png`](referencias/ui/01-dialogo-decision.png) (aplicada a un diálogo), [`ui/04-consulta-comparacion-fuente.png`](referencias/ui/04-consulta-comparacion-fuente.png) (consulta, comparación, fuente, confirmación), [`personajes/07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png) (las 4 tarjetas del ciclo de decisión), [`mundo/01`](referencias/mundo/01-exterior-tercera-persona.png) (HUD sobre el mundo).

### 5.1 Familia

Tarjetas marfil con **esquinas recortadas**, bisel bajo, sombra suave ciruela y texto índigo. Diálogo ancho en lila claro con retrato facetado a la izquierda. Costo inmediato y efecto posterior en **bloques separados**. La UI no tapa el mundo: placas compactas en los bordes.

### 5.2 Disposición del HUD en el mundo (de `mundo/01`)

| Zona | Contenido |
| --- | --- |
| Arriba derecha | Tres placas separadas: `Energy`, `Life support`, `Shielding`, cada una con icono (rayo, pulmones, escudo) y valor real. |
| Debajo de las placas | Chip de objetivo actual (círculo cian + texto, por ejemplo `Inspect the solar controller`). |
| Abajo izquierda | Botones `Crew` y `Map`. |
| Abajo centro | Aviso de interacción con tecla: `[E] Inspect controller`, solo cuando hay algo cerca. |
| Abajo derecha | Cambio de cámara: `[V] First person` / `[V] Third person`. |
| En el mundo | El objeto interactivo cercano lleva **contorno cian luminoso**. El decorado nunca lo lleva. |

### 5.3 Componentes y estados

| Componente | Conducta visual |
| --- | --- |
| Acción principal | Marfil, mayor peso y tamaño, verbo concreto (`Place panel`). Una por decisión. |
| Acción secundaria | Misma familia, menos peso (`Back`, `Ask another expert`, `Crew`, `Map`). |
| Estados | `normal` marfil · `hover` lila tenue · `pressed` menos sombra y relieve sin mover el layout · `focus` anillo exterior cian + trazo oscuro, **nunca recortado** · `disabled` atenuado legible + motivo escrito · `selected` check + texto persistente · `busy` mismo ancho + etiqueta de estado. |
| Medidor (`ResourcePlaque`) | Icono + etiqueta + valor real + capa aparte para delta y causa. Tres siempre separados. |
| Retrato (`ExpertPortrait`) | Retrato facetado + nombre + especialidad juntos (`Engineer / Power & repairs`, `Radiation doctor / Crew protection`, `Solar expert / Solar events`). |
| Fila de costo (`CostRow`) | `Costs now` con iconos y deltas negativos; `Later` con delta positivo verde. |
| Mensajes | Éxito con check, advertencia con triángulo, error con cruz, pendiente con reloj. Siempre con texto, no solo color. No son botones. |
| Tarjeta de fuente | Pequeña: tipo de evidencia, fecha e identificador **solo si existen en los datos**, enlace descriptivo. |
| Entrada de texto y voz | Campo con etiqueta persistente (`Ask your crew...`), interruptor de voz, botón `Send`. Voz opcional ([AUDIO.md](AUDIO.md) §6). |
| Superficie oscura | Ciruela, solo para énfasis puntual. La versión clara es la de siempre. |

Medidas mínimas: áreas táctiles de **44 x 44 px**, texto de lectura **18–20 px** escalable, espacio para que el español (más largo) no se corte.

---

## 6. Portada, intro y carga

Láminas: [`inicio/01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png) (canónica), [`inicio/00-inicio-original.png`](referencias/inicio/00-inicio-original.png) (composición base), capas en [`inicio/capas/`](referencias/inicio/capas/), [`inicio/02-intro-cuatro-momentos.png`](referencias/inicio/02-intro-cuatro-momentos.png), [`inicio/03-panel-carga.png`](referencias/inicio/03-panel-carga.png).

**Portada:** espacio índigo con estrellas discretas, el niño flotando a la derecha saludando, la nave anclada abajo a la derecha, planeta con anillo y asteroide lejanos, logo y menú a la izquierda. Composición por capas sobre un lienzo de referencia de `1536 x 1024` (cajas en % del lienzo):

| Capa | Caja `x,y,w,h` | Movimiento |
| --- | --- | --- |
| 0 Fondo | `0,0,100,100` | Quieto. Sin UI horneada. |
| 1 Asteroide / planeta | `39,7,10,13` / `79,15,16,14` | Deriva opcional de hasta 4 px en 8 s. |
| 2 Nave | `78,63,22,37` | Fija, recortada por el borde a propósito. |
| 3 Cable | Mochila a conector de la nave | Curva detrás del cuerpo, extremos anclados. |
| 4 Niño | `49,18,31,57` | Flota 6 px en 6 s, giro máximo 1°. |
| 5 Logo / subtítulo | `5,5,31,31` / `6,32,29,5` | Logo oficial ([`ui/00-logo-actual.png`](referencias/ui/00-logo-actual.png)); no redibujar el lettering. |
| 6 Menú | `5,40,36,36` | `Start mission` (principal), `Continue` (solo con guardado válido), `Settings`. |
| 7 Preferencias | Arriba derecha / abajo izquierda | Idioma, cuenta o invitado, sonido, fuentes y créditos. |

En 16:9 se conserva la altura y se redistribuye el ancho sin estirar al niño ni al logo. En móvil el menú pasa a columna. La placa cian grande del concepto original **no** es el estilo de los botones.

**Intro (4 viñetas omitibles):** una nueva misión, prepararse para observar, conocé a tu tripulación, tu turno (texto en [HISTORIA.md](HISTORIA.md) §3). Omitir lleva al mismo briefing. No muestra decisiones ya tomadas. Primera versión: tarjetas DOM sobre el fondo de la portada con iconos y el texto de cada viñeta; la ilustración completa solo si sobra tiempo ([FLUJO.md](FLUJO.md) §3).
**Carga:** ilustración ámbar, consejo corto e indicador **indeterminado** si no hay progreso medible. Nunca porcentajes inventados.

---

## 7. Estaciones, piezas y exterior (resumen visual)

El contenido de cada estación está en [ESCENAS.md](ESCENAS.md) §4. Reglas visuales comunes:

- **Una familia, ocho identidades:** suelo, paredes, marco, puerta, luces, cajas, consolas y bancos son los mismos en todas las salas. Cada estación se distingue por un elemento propio: cúpula triangulada (invernadero), cámara de experimentos (laboratorio), mesa de terreno y cúpula panorámica (control), cubierta de regolito (refugio).
- **Kit exterior:** reinterpretado en marfil, lila y cian. El amarillo y negro industrial de la lámina [`piezas/10`](referencias/piezas/10-kit-exterior-modular.png) no se adopta.
- **Corte abierto:** las salas se muestran en corte para que la cámara vea adentro, con circulación libre y piso despejado (cables por canaleta, nunca sueltos en el paso).
- **Objeto interactivo distinguible del decorado** (contorno cian al acercarse). La abundancia de props no puede volver confuso qué se puede usar.

---

## 8. Prohibido (lista única)

**En el mundo**
- Vegetación al aire libre en Marte (árboles, pasto, arbustos). Las plantas solo dentro del invernadero o jardineras interiores.
- Estatuas, humanoides de piedra, ruinas, templos, portales, arcos o construcciones de piedra.
- Cielo azul de día, cielo nocturno de fantasía, lagos o agua líquida en superficie.
- La mascota capibara o cualquier personaje, nombre o estética de franquicias existentes.
- Cruz roja en enfermería. Logos de NASA inventados.
- Esqueletos o humanos encapsulados en el laboratorio o la enfermería.
- El tema oscuro del prototipo descartado (`#0b1026`, `#1a2350`, `#323272`, `--hud: #141a2b`, `--life: #9be15d`), sus visores opacos y su velo oscuro.

**En la construcción**
- GLB, Blender, `GLTFLoader`, WebGPU, TSL, Drei, Rapier o cualquier librería npm además de `three`.
- Texto horneado en texturas o imágenes. Telemetría inventada en pantallas 3D.
- Usar una lámina como textura o fondo del juego (salvo el logo oficial).
- Escalar el adulto para hacer al niño. Recolorear un personaje para hacer otro.

**En la UI**
- Fundir los tres medidores o añadir una barra de salud.
- Porcentajes falsos, relojes que giran sin fin, sacudidas de pantalla, destellos rojos repetidos.
- Foco recortado por `clip-path`. Información comunicada solo con color.
