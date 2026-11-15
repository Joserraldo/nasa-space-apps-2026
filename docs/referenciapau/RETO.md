# RETO: qué pide NASA y cómo lo cumple Solar Shield

**Fuente:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/), pestaña Details, leída el 14 nov 2026 con el navegador (la página carga; `docs/reglas.md` todavía tiene la URL vieja, arreglo en el PR #150). Abajo va parafraseado: el texto completo está en el enlace.
**Para qué sirve:** que cada decisión de diseño, UI y escenario se pueda justificar contra el enunciado. **Si algo de esta carpeta choca con el reto, gana el reto** y se corrige el documento.

---

## 1. El reto en cinco líneas

1. Un juego o app interactivo donde **niños de 7 a 12 años** manejan una **base en la Luna o en Marte**.
2. Decisiones reales sobre **soporte vital, blindaje contra radiación, presupuesto de energía, producción de comida y retraso de comunicaciones**, y ver cómo se desarrollan a lo largo de una misión simulada.
3. **Ninguna decisión gratis:** cada una enseña algo verdadero de lo que enfrentan astronautas y planificadores.
4. Usar **datos abiertos reales de NASA** (DONKI, OSDR, misiones Artemis y de superficie de Marte), con la fuente visible y **sin presentar datos estáticos como en vivo**.
5. Un **prototipo que funcione** y deje claro el compromiso (trade-off): el niño se va entendiendo una restricción real del espacio profundo, no solo habiendo jugado.

## 2. Matriz de cumplimiento

Estado al 14 nov 2026: **Sí** = ya está en código en `develop`; **Parcial** = existe pero falta mostrarlo o cerrarlo; **No** = falta.

### 2.1 Objetivos obligatorios

| Pide el reto | Cómo lo cumple Solar Shield | Estado | Dónde |
| --- | --- | --- | --- |
| Niños de 7 a 12 años | Lenguaje simple, personajes por rol, frases cortas (prueba de frases cortas en `agents/`) | Sí | `CLAUDE.md`, [HISTORIA.md](HISTORIA.md) |
| Base en la Luna o en Marte | Nivel 1 Jezero jugable; niveles 2 a 5 en Marte, Luna y una nave (interpretación creativa de "outpost", que el reto permite) | Parcial (solo nivel 1 jugable) | [NIVELES.md](NIVELES.md) |
| Soporte vital | Recurso `soporte_vital` | Sí | [MECANICAS.md](MECANICAS.md) §2 |
| Blindaje contra radiación | Recurso `blindaje`, refugio, escudo, tormenta real | Sí | MECANICAS §3 |
| Presupuesto de energía | Recurso `energia`, costo de cada acción y módulo, consumo por tick | Sí | MECANICAS §2–§3 |
| **Producción de comida** | Invernadero dentro de soporte vital (simplificación educativa) | **Parcial**: si el niño no elige el invernadero, la comida casi no aparece | Ver §3, mejora 1 |
| **Retraso de comunicaciones** | Telemetría con respuesta a los 2 ticks; dato real de 3 a 22 minutos Marte–Tierra | Parcial: falta mostrarlo bien en pantalla (#137) | MECANICAS §3, paso 7 |
| Las decisiones se desarrollan a lo largo de la misión | Efectos con retraso, cola de efectos pendientes, cadena de causas al final | Sí (motor); Parcial (pantalla) | MECANICAS §4 |
| Ninguna decisión gratis | Regla de diseño: toda acción mueve al menos dos medidores; el dilema no tiene opción segura y gratuita | Sí | `design/src/recursos.ts`, MECANICAS §3.3 |
| Enseña algo verdadero | Tarjetas de ciencia con fuente verificada y pregunta final | Sí en datos; Parcial en pantalla (#137) | `missions/`, `data/` |
| Datos reales de NASA | Tormentas DONKI curadas, dosis RAD/Curiosity, terreno Mars Trek, OSDR, CSA, NSSDC | Sí | `data/`, `docs/science/fuentes.md` |
| Fuente visible en el juego | `TarjetaFuente`, aviso "proyecto no oficial" | Parcial: falta en todas las pantallas | DISEÑO §5.3 |
| No presentar estático como en vivo | Etiqueta "datos reales, no en vivo" | Sí como regla; validar en pantalla | MECANICAS §9 |
| Prototipo que funcione | Ruta dorada de 8 pasos, ganable y perdible, e2e en CI | Parcial: falta jugarla completa en pantalla (fase 0) | [FLUJO.md](FLUJO.md) §4 |

### 2.2 Consideraciones (opcionales, pero puntúan)

| Sugiere el reto | Cómo lo cumplimos | Estado | Dónde |
| --- | --- | --- | --- |
| Que sirva también para hermanos mayores, padres o aula | 4 dificultades (`facil` a `hardcore`) | Sí en motor; falta selector | NIVELES §4 |
| Lenguaje llano; explicar en contexto términos como dosis de radiación, microgravedad o sol | Glosario para niños ya en `develop` (`docs/science/glosario.md`, claves `datos.glosario.<palabra>.palabra` y `.def` en `data/i18n`); el PR #158 lo completa | **No en pantalla** | Ver §3, mejora 2 |
| Jugable en el navegador, sin descarga ni cuenta | Web en Cloudflare; cuenta opcional, se juega como invitado | Sí | `infra/`, #109 |
| Usar APIs y datos públicos de NASA | Ver arriba | Sí | `data/` |
| Atribuir las fuentes dentro del juego | `TarjetaFuente` en cada dato real | Parcial | DISEÑO §5.3 |
| Si no hay API en vivo, dataset curado embebido, sin fingir que es en vivo | Tormentas curadas en `data/curated/` | Sí | `data/` |
| Evitar una opción "segura" sin costo | Regla de diseño | Sí | MECANICAS §3.3 |
| **El pulido visual no reemplaza la precisión de la mecánica** | La mecánica se conecta primero (fase 0); el 3D va después y se recorta a 2D en P3 si pone en riesgo la ruta | Sí como regla | FLUJO §4 |
| No abrumar: 2 o 3 recursos centrales | Exactamente 3: energía, soporte vital, blindaje | Sí | MECANICAS §2 |
| **Destaca:** ligar la decisión de blindaje a datos actuales de clima espacial | La tormenta es real pero archivada | **No** | Ver §3, mejora 3 |
| **Destaca:** rejugabilidad, aprender del fracaso sin castigo | Semillas, misma semilla o nueva al final, perder muestra causas y no "Game Over" | Parcial: falta botón de nueva semilla y prueba de P3 | NIVELES §2, MECANICAS §3 |
| **Destaca:** explicación corta de qué datasets de NASA se usaron y por qué | `DATOS_USADOS_KEYS` (PR #158) y formulario de entrega | Parcial: falta en pantalla (#137) | `data/`, `pitch/` |

## 3. Mejoras que salen del reto (asignadas)

Ninguna cambia reglas de juego ni contratos. Todas están en los prompts de cada rol.

| # | Mejora | Por qué (del reto) | Quién | Prioridad |
| --- | --- | --- | --- | --- |
| 1 | **Comida visible en toda partida:** en el paso 4 la comparación siempre explica que el invernadero produce comida (aunque no se elija), y el final muestra siempre una tarjeta de comida (OSDR chiles o CSA) | La producción de comida es uno de los 5 objetivos | ui, pista M | P0 |
| 2 | **Términos explicados en contexto:** al tocar "dosis", "radiación", "blindaje", "microgravedad", etc., una explicación corta desde el glosario que ya existe (`datos.glosario.*`). Faltan en el glosario: **"sol" como día de Marte** (hoy "Sol" es la estrella y se presta a confusión), "telemetría" y "tick" | Consideración de lenguaje llano | ui (M monta, I hace el componente); datos agrega las palabras que faltan | P1 |
| 3 | **"Hoy en el Sol" (opcional, destaca; ya previsto como banner opcional en `docs/ORQUESTACION.md`):** una tarjeta "Today on the Sun" con DONKI en vivo, fecha y fuente, que se muestra **separada** de la tormenta de la misión y con respaldo archivado si falla la llamada | "Lo que destaca": ligar el blindaje a datos actuales | datos + infra (fuente y llamada desde el Worker, sin claves en el navegador), ui (tarjeta) | P2, solo si sobra tiempo |
| 4 | **Retraso de comunicaciones explicado:** en el paso 7, "la luz tarda de 3 a 22 minutos entre Marte y la Tierra" con su fuente y los ticks restantes | Retraso de comunicaciones es objetivo | ui, pista M (#137) | P0 |
| 5 | **Pantalla "qué datos de NASA usamos y por qué"** al final | "Lo que destaca": datasets trazables | ui, pista M (#137) | P0 |
| 6 | **Nueva semilla** en el final, además de repetir la misma | Rejugabilidad | ui, pista M; motor confirma la variabilidad (P3) | P1 |
| 7 | **Selector de dificultad** con una frase por nivel | Público más amplio (aula, familia) | ui, pista M; diseño aprueba | P2 |

## 4. Contraste con el resumen de misiones de Camilo (14 nov)

El resumen de Camilo coincide con el código en lo esencial (tres recursos, 8 pasos, cuatro sitios, cinco módulos, dilema de tres opciones, Iris dañada, retraso de comunicaciones). Lo actualizado y lo agregado aquí:

| Punto | Resumen de Camilo | Estado verificado | Qué cambia |
| --- | --- | --- | --- |
| Ganar Jezero | "No se puede ganar, falta #113" | #113 cerrado el 14 nov; se gana por telemetría | Prioridad pasa a jugarlo completo en pantalla |
| Voces de Luna polo sur | "PR #128 abierto" | Fusionado | — |
| Las 4 misiones nuevas | "Solo propuestas" | Además hay PRs con sus datos (#153–#156) | Fichas en [NIVELES.md](NIVELES.md) |
| Comida | Aparece como parte de soporte vital | El reto la pide como objetivo propio | Mejora 1 |
| Términos para niños | No mencionado | El reto pide explicarlos en contexto | Mejora 2 |
| Datos actuales de clima espacial | No mencionado | Es lo que el reto marca como destacado | Mejora 3 (opcional) |
| Pulido visual | No mencionado | El reto advierte que no reemplaza la mecánica | Regla de FLUJO §4: mecánica primero, 3D después |
| Dilemas de los niveles 2 y 4 | No mencionado | La Doctora defiende dos opciones | Decisión 4 de NIVELES §7 |

## 5. Criterios de juicio

`pitch/criterios.md` (José) relaciona los criterios de juicio de ediciones anteriores (los de 2026 siguen sin confirmar) con pasos de la ruta dorada: **Impacto** (decisiones con costo sin descarga ni cuenta), **Creatividad** (Iris que falla y enseña a verificar), **Validez** (tormenta DONKI con ID y fecha, terreno de Mars Trek, "datos reales curados, no en vivo"), **Relevancia** (ninguna opción gratis, rejugable por semilla) y **Presentación** (demo en EN y ES con **una decisión con costo antes de los 60 s**). Consecuencias para la UI:
- La intro se puede saltar y el primer costo visible (satélite y sitio) llega antes del minuto.
- La pantalla final sirve también para padres y docentes ("qué aprendimos hoy").
- Toda función que no apunte a un criterio es candidata a recorte.

## 6. Criterio de aceptación final (lo que el jurado tiene que ver)

Un niño juega la ruta dorada en el navegador, sin cuenta, en inglés o en español, y al terminar puede decir **qué sacrificó, por qué, y qué pasó por su decisión y qué por mala suerte**. En el camino vio energía, soporte vital y blindaje separados, la comida del invernadero, el retraso de la Tierra, una tormenta solar real con su fuente y a Iris equivocándose. Todo dato real tiene fuente y ninguno dice estar en vivo si no lo está.
