# NIVELES: las 5 misiones, la dificultad y los niveles de Iris

**Qué es:** la especificación de **todos los niveles del juego** en un solo lugar, para que la UI, el escenario y las misiones se construyan sobre lo mismo. **Prioridad 1 del equipo:** que esta página esté completa y aprobada antes de ampliar el juego.
**Quién decide:** las reglas y los números son de diseño (Camilo) con aprobación de Santiago; el motor (Jaime) los ejecuta. Esta página **resume lo que ya está en código o en PRs** y marca qué falta decidir. No crea reglas nuevas.
**Fuentes leídas el 14 nov 2026:** `missions/src/jezero.ts` y `design/src/recursos.ts` en `origin/develop`; `missions/src/<mision>.ts` en las ramas de los PRs #153, #154, #155 y #156.

---

## 1. Qué es un "nivel" en Solar Shield

Hay tres ejes. No se mezclan.

| Eje | Qué cambia | Dónde vive |
| --- | --- | --- |
| **Misión** (5) | Lugar, historia, sitios, módulos, tormenta real, dilema, mala suerte | `missions/` |
| **Dificultad** (4) | Cuánto tardan las consecuencias, si se ocultan, usos del Matemático, probabilidad de mala suerte | `design/src/recursos.ts` |
| **Nivel de Iris** (4) | Cuánto te ayuda la IA de la base durante la partida | `GameState.iaBase`, lo mueve el motor |

## 2. Orden de la campaña (propuesta para aprobar)

Cada misión enseña una idea nueva sobre la anterior. El orden coincide con el resumen de diseño de Camilo.

| Nivel | Misión | Idea que enseña | Por qué va en este lugar |
| --- | --- | --- | --- |
| 1 | **Marte, cráter Jezero** | Decidir con recursos limitados y verificar antes de confiar | Introduce todo: sitios, módulos, tormenta, Iris que falla, telemetría. Es la ruta dorada. |
| 2 | **Marte, polo norte** | Sin Sol, la energía hay que guardarla | Mismo planeta y misma tormenta que Jezero: lo único nuevo es la luz y la batería. |
| 3 | **Luna, polo sur** | Explorar (hielo) o protegerse | Cambia de cuerpo celeste: sin atmósfera, retraso corto, otra tormenta real. |
| 4 | **Luna, lado visible** | Almacenar energía importa tanto como producirla | Noche larga durante la tormenta: combina lo del nivel 2 con la Luna del nivel 3. |
| 5 | **Outpost sorpresa** | Cómo se protege a los astronautas en un viaje | Rompe la regla: no hay suelo. Solo tiene sentido después de conocer las bases. |

**Desbloqueo propuesto:** el nivel 1 siempre está abierto; cada nivel se abre al terminar el anterior (ganando o perdiendo, porque perder también enseña). El progreso se guarda con la cuenta opcional o en el navegador (#108). **Decisión de diseño pendiente.**

## 3. Ficha de cada misión

Todas comparten la estructura de 8 pasos de `MISION_JEZERO` (satélite, ruta, sitio, 2 módulos, tormenta, dilema con Iris dañada, telemetría, final). Los costos son **valores de juego**, no datos de NASA.

### Nivel 1 · Marte, cráter Jezero (`jezero-dorada`) · JUGABLE

| Campo | Valor |
| --- | --- |
| Estado | En `develop`. Se gana por telemetría (#113 cerrado). Pendiente #114. |
| Objetivo / dificultad | `explorar` / `media` |
| Tormenta real | `2024-05-20-marte` (medida por RAD/Curiosity en el cráter Gale) |
| Sitios (4) | llanura-central · cerca-de-perseverance · pie-de-la-pared-sur · sobre-el-borde-oeste |
| Módulos (elige 2 de 5) | panel_solar · reciclador_agua · escudo · invernadero · antena |
| Iris dañada (paso 6) | Lee **blindaje** con +20 de error; repara la Ingeniera |
| Dilema | refugio y apagar invernadero (Doctora) · subir escudo nivel 2 (Ingeniera) · aguantar |
| Mala suerte guionada | Polvo en paneles (fuera de la semilla de demo) |
| Fin | Gana cuando llega la telemetría; pierde con un recurso en 0; tope tick 10 |
| Escenario | [ESCENAS.md](ESCENAS.md) §3 y [MARTE.md](MARTE.md). Láminas completas. |

### Nivel 2 · Marte, polo norte (`marte-polo-norte`) · PROPUESTA (#97, #153)

| Campo | Valor |
| --- | --- |
| Estado | Datos en el PR #153; voces fusionadas (#127); terreno en el PR #148. No jugable: el motor solo lee Jezero (#152). |
| Objetivo / dificultad | `explorar` / `media` (copiados de Jezero, **por decidir**) |
| Tormenta real | `2024-05-20-marte` (la misma de Jezero, vista desde otra base) |
| Sitios (3, por latitud) | crater-louth (borde sur, más Sol) · crater-escorial (franja media) · canon-chasma-boreale (junto al casquete, hielo cerca) |
| Módulos (elige 2 de 5) | panel_solar · **bateria** · reciclador_agua · escudo · invernadero |
| Iris dañada | Lee **energía** con +20 ("la batería está llena") |
| Dilema | refugiarse (Doctora) · escudo con batería, nivel 1 (Doctora) · guardar batería (Ingeniera) |
| Mala suerte | Escarcha en los paneles |
| Novedad sin modelar | Noche polar desde el paso 7 (panel da 0) y luz según la latitud |
| Escenario | Marte con luz baja y escarcha. **Sin lámina.** |

### Nivel 3 · Luna, polo sur (`luna-polo-sur`) · PROPUESTA (#98, #154)

| Campo | Valor |
| --- | --- |
| Estado | Datos en el PR #154; voces fusionadas (#128); terreno en el PR #126. No jugable (#152). |
| Objetivo / dificultad | `explorar` / `media` |
| Tormenta real | `2017-09-10-x82` (medida en órbita lunar por CRaTER) |
| Sitios (4, cráteres reales) | nobile (más Sol, sin hielo) · shackleton (más hielo, casi sin Sol) · faustini (plano, sombra permanente) · malapert (Sol alto, empinado) |
| Módulos (elige 2 de 5) | panel_solar · bateria · reciclador_agua · escudo · invernadero (sin antena: el retraso Luna–Tierra es de ~1,3 s) |
| Iris dañada | Lee **blindaje** con +20 |
| Dilema | volver al refugio (Doctora) · terminar la expedición al hielo (Ingeniera) · subir escudo nivel 2 |
| Mala suerte | Micrometeorito |
| Escenario | Luna: cielo negro, sombras duras, regolito gris (§5). **Sin lámina.** |

### Nivel 4 · Luna, lado visible (`luna-lado-visible`) · PROPUESTA (#100, #156)

| Campo | Valor |
| --- | --- |
| Estado | Datos en el PR #156; voces en el PR #131; luz #147 y blindaje #160 abiertos. No jugable (#152). |
| Objetivo / dificultad | `reportar_tierra` / por decidir |
| Tormenta real | `2024-05-10-gannon` (llegó de noche a los 3 sitios Apolo) |
| Sitios (3, Apolo) | llanura-tranquilidad (Apolo 11) · tierras-altas-descartes (Apolo 16) · borde-rima-hadley (Apolo 15) |
| Módulos (elige 2 de 5) | bateria · panel_solar · escudo · antena · reciclador_agua |
| Iris dañada | Lee **blindaje** con +20 |
| Dilema (4 opciones) | refugio (Doctora) · subir escudo nivel 2 (Doctora) · ahorrar batería (Ingeniera) · preguntar a la Tierra |
| Mala suerte | Antena averiada (no hay polvo en la Luna) |
| Novedad sin modelar | La noche (el panel no da energía hasta el amanecer) y ganar al amanecer |
| Escenario | Luna de noche con la Tierra en el cielo (§5). **Sin lámina.** |

### Nivel 5 · Outpost sorpresa (`outpost-sorpresa`) · PROPUESTA (#99, #155)

| Campo | Valor |
| --- | --- |
| Estado | Datos en el PR #155; voces en el PR #129. No jugable (#152). |
| Objetivo / dificultad | `reportar_tierra` / `media` |
| Tormenta real | `2024-05-10-gannon` (con partículas, la fase que importa en una nave) |
| "Sitios" (3 zonas de la nave) | cabina (espacio, paredes delgadas) · centro (rodeado de provisiones, protege) · fondo (junto al escudo térmico, lejos de los controles) |
| Módulos (elige 2 de 5) | panel_solar · bateria · reciclador_agua · escudo · antena (sin invernadero: no cabe en la nave) |
| Dilema | refugio con provisiones (Doctora) · subir escudo nivel 2 (Ingeniera) · aguantar |
| Mala suerte | Micrometeorito |
| Pasos distintos | Paso 1 es la sorpresa ("no hay suelo") y paso 2 es orientar la nave |
| Escenario | Solo interiores de la nave con la familia de corredores v8. **Sin lámina.** |

## 4. Dificultad (ya en código, `design/src/recursos.ts`)

| Dificultad | Retraso de consecuencias (ticks) | ¿Se ocultan? | Usos del Matemático | Mala suerte por tick |
| --- | --- | --- | --- | --- |
| `facil` | 1 | no | ilimitados | 5 % |
| `media` | 1–2 | no | 6 | 10 % |
| `dificil` | 2–3 | no | 3 | 18 % |
| `hardcore` | 2–3 | **sí** | 1 | 25 % |

Hoy todas las misiones usan `media`. Si se ofrece elegir dificultad, la UI muestra estas cuatro con una frase corta cada una; el efecto lo aplica el motor.

## 5. Niveles de Iris (ya en el contrato, `iaBase`)

| Nivel | Qué hace Iris | Cómo se ve |
| --- | --- | --- |
| `tutorial` | Nombra el lugar y la experta y traza la ruta (Iris compañera, #149) | Ojos abiertos, atentos; el rover avanza delante del niño |
| `pistas` | Solo mira hacia el área, sin nombre ni ruta | Ojos tranquilos; el rover gira hacia el lugar |
| `danada` | La radiación la daña: da un número equivocado y pide reparación | Pantalla con interferencia, cara `error`, gesto `pedir_reparacion` |
| `offline` | No ayuda; el niño decide solo | Pantalla apagada; el rover queda en su dock del taller |

El motor mueve a Iris entre niveles según el rendimiento del niño; la avería del paso 6 la pone en `danada` y la Ingeniera la repara.

## 6. Escenarios de los niveles 2 a 5

No hay láminas v8 para la Luna, el polo norte ni el interior de la nave. **No se construyen hasta tener lámina aprobada por María Paula.** Cuando existan, mantienen la familia v8 y respetan la física real del lugar:

| Lugar | Datos físicos ([NSSDC Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), verificado 14 nov) | Consecuencia visual |
| --- | --- | --- |
| Luna (niveles 3 y 4) | Gravedad 1,62 m/s²; prácticamente sin atmósfera (3 x 10⁻¹⁵ bar); día solar de 29,53 días terrestres; de 95 K a 390 K en el ecuador | Cielo **negro** también de día, sombras duras y negras, regolito gris, la Tierra visible desde el lado visible, sin polvo flotando. |
| Marte polo norte (nivel 2) | Mismas leyes que [MARTE.md](MARTE.md), Sol bajo y escarcha estacional | Luz rasante y larga, escarcha blanca en superficies. |
| Nave del outpost (nivel 5) | Sin terreno | Solo interiores: cabina, centro y fondo, con corredores y módulos v8. |

## 7. Qué falta decidir (orden de prioridad)

| # | Decisión | Quién | Bloquea |
| --- | --- | --- | --- |
| 1 | Aprobar el orden de la campaña y el desbloqueo (§2) | Camilo + Santiago | Selector de niveles en la UI |
| 2 | Huecos del tipo `Mision` (#152): evento de mala suerte genérico, metas por misión, efectos por zona o sitio, `MODULOS` por misión, retraso por misión, fin alternativo, varias fuentes por tarjeta | Camilo + Jaime | Niveles 2 a 5 jugables |
| 3 | Motor que recibe la misión como parámetro (#152) | Jaime | Niveles 2 a 5 jugables |
| 4 | **Dilemas sin consejo opuesto:** en los niveles 2 y 4 la Doctora defiende dos opciones y el paso 6 se llama "consejo opuesto". Revisar quién defiende cada opción | Camilo | Coherencia de la historia |
| 5 | Objetivo, dificultad y tope de ticks de los niveles 2 y 4 (copiados de Jezero) | Camilo | Balance |
| 6 | Fuentes `null` (POR VERIFICAR) de las tarjetas de los niveles 2 a 5 | Daniel | Tarjetas de ciencia |
| 7 | Láminas de la Luna, el polo norte y la nave | María Paula | Escenarios 2 a 5 |

## 8. Prioridades de construcción

1. **Definir y aprobar todos los niveles** (esta página, decisiones 1 a 6 de §7).
2. **Nivel 1 jugable completo** en pantalla (ruta dorada, P2 a P4).
3. Motor multi-misión y huecos del tipo (#152).
4. Niveles 2 a 5, uno por vez en el orden de §2, cada uno solo cuando su código, su motor y su lámina estén listos.

Mientras el punto 3 no esté hecho, la UI no muestra un selector de niveles ni presenta como jugable ninguna misión distinta de Jezero.
