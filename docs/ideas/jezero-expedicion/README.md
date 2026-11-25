# Jezero: la primera expedición — rediseño de la introducción y el aprendizaje

**Estado:** propuesta completa para revisión de Santiago. **No se implementó nada.** No se tocó código, `ui/`, `assets/`, `missions/` ni `contracts/`; no hay commits, push ni merges. Todo son archivos nuevos en esta carpeta.
**Fecha:** 18 nov 2026 · **Autor:** Claude (dirección técnica, arquitectura, experiencia, especificación, auditoría).

## Documentos

| | Documento | Qué responde |
|---|---|---|
| A | [Diagnóstico](A-diagnostico.md) | Qué hay de verdad, qué funciona, qué falta, qué está desconectado. Incluye la matriz de mecánicas y mis mediciones del motor |
| B | [Diseño de Jezero](B-diseno-jezero.md) | La expedición completa, momento por momento, ritmo y tres edades |
| C | [Guion narrativo](C-guion-narrativo.md) | Líneas de Iris y las especialistas, en inglés original |
| D | [Mapa de aprendizaje](D-mapa-aprendizaje.md) | Qué se aprende, cuándo y con qué acción |
| E | [Tabla de progresión](E-tabla-progresion.md) | Eventos, estados, decisiones, consecuencias, condiciones (con números del motor) |
| F | [Especificación técnica](F-especificacion-tecnica.md) | Qué existe, qué se conecta y qué es nuevo |
| G | [Plan de implementación](G-plan-implementacion.md) | 9 entregas pequeñas con pruebas y criterios |
| H | [Plan de QA](H-plan-qa.md) | Escenarios para Codex |

## Resumen en una página

**La idea.** Jezero es "tu primera expedición": un niño llega a un cráter que fue un lago, monta una base pequeña y tiene que contarle a la Tierra que su tripulación sobrevivió a una tormenta solar real. Es **exactamente lo que el motor ya premia**; no se añade ninguna meta ni regla.

**Lo que encontré (lo más importante):**
1. **La tormenta llega sin preparación.** Al entrar en la base el reloj corre solo y la tormenta llega ~12 s después. El pronóstico (P0.4) solo habla si el niño pregunta.
2. **La radiación es una regla invisible.** El motor ya puede hacer perder por dosis (límite 4 mSv, valor de juego), pero **la interfaz no muestra la dosis**. Hoy se puede perder por algo que el niño no ve.
3. **Iris nunca gana confianza antes de fallar,** y el panel Crew parece mostrar "Iris is damaged" desde el principio (deducido del código; hay que confirmarlo en navegador).
4. **El dilema puede tener una respuesta obvia.** En mis corridas el refugio ganó 4 de 4. Necesito un barrido completo antes de afirmar nada.
5. **Los P0.1–P0.6 no están en `develop` ni en la rama experimental.** Son una pila de PR (#443–#450) y una corrección (QA-445) en ramas distintas.

**La propuesta, en tres frases.** (1) Reordenar la *presentación* para que la tormenta se anuncie al empezar el paso 4 con el reloj parado, y el niño decida cuándo arranca el reloj ("el círculo de la tripulación"): sin tocar el motor. (2) Mostrar la dosis con un dosímetro que presenta la Doctora, para que perder enseñe. (3) Que Iris gane la confianza con una lectura cierta antes de fallar, y que la derrota termine con la causa exacta y una pista de qué probar.

**Lo que necesita de verdad construcción nueva:** solo tres piezas (dosímetro, textos de Iris y de reacción, pista de reintento). Todo lo demás existe y se conecta.

## Decisiones que necesito de Santiago

| # | Decisión | Mi recomendación | Si dices "no" |
|---|---|---|---|
| **D1** | ¿Aprobar el **dosímetro** (un valor que ya existe, no un recurso nuevo)? | **Sí.** Sin él se pierde por una regla oculta | La derrota por dosis se explica solo con texto al final. Se queda el problema de A §5 |
| **D2** | ¿Aprobar el **Momento D** (alerta al empezar el paso 4 y reloj parado hasta "Start the clock")? | **Sí.** Es el cambio con más efecto y no toca el motor | La tormenta sigue llegando a ~12 s; solo se mejoraría el texto |
| **D3** | ¿El **Matemático** entra en Jezero? | **No.** Tres expertas e Iris ya son suficientes para un niño de 7 años; no tiene lámina | Habría que definirlo con Paula (visual) y marcar `disponible: true` (decisión de Camilo/Jaime) |
| **D4** | ¿Los **pasos 1–2** (satélite) quedan sin decisión (solo mirar)? | **Sí por ahora.** Existe `ajustar_orbita` en el motor pero no UI | Habría que diseñar y construir una pantalla nueva (alcance mayor) |
| **D5** | **Orden de fusión** de la pila P0 (#443→#450 y QA-445) | Primero la pila de motor (#443–#445) y QA-445; luego agentes (P0.4–P0.5). Cualquier entrega de G depende de ella | Se pueden hacer las entregas 1, 3 y 6 sobre `develop` solo en parte |
| **D6** | `NIVELES.md` §2 propone una **campaña ordenada** con desbloqueo | Léela como "orden **sugerido**", no como compuerta: así las cuatro misiones siguen independientes | Habría que cambiar el requisito de independencia |

Nada más requiere aprobación para empezar la entrega 0.

## Identidad de las cinco misiones

Tabla de identidad. Salió de leer `missions/src/*.ts` y `NIVELES.md`, **no de lo que supongo**. No diseño las otras cuatro: solo aseguro que lo que enseña Jezero sea reutilizable sin quitarles identidad.

| Misión | Identidad | Objetivo propio | Desafío principal | Aprendizaje propio |
|---|---|---|---|---|
| **Jezero** | Introducción | Sobrevivir una tormenta real y avisar a la Tierra (`explorar`) | Preparar y elegir entre refugio y escudo, con Iris que falla | **Fundamentos** (ver D §3) |
| **Polo Norte de Marte** | Independiente | `explorar` | "Sin Sol, ¿de dónde sale la energía?": batería, noche polar (no implementada aún) | La energía hay que guardarla. Iris lee mal la **energía**; la tormenta se midió en Gale, **no en el polo** |
| **Polo Sur Lunar** | Independiente | `explorar` | "El agua se esconde en la oscuridad y la energía vive en la luz": hielo contra sol | Sin atmósfera, micrometeoritos; la expedición al hielo cuesta |
| **Cara visible lunar** | Independiente | `reportar_tierra` | "La noche larga": cada llamada gasta batería que no se recarga hasta el amanecer | Almacenar importa tanto como producir; una tormenta, tres lugares. **No certificada** (falta el tick de amanecer) |
| **Outpost** | Independiente | `reportar_tierra` | "La sorpresa es que no hay suelo": una nave en el espacio profundo | Cómo se protege a los astronautas en el viaje; sin invernadero, 3 ticks de retraso |

**Cómo Jezero no les quita identidad:**
- Jezero enseña **habilidades** (leer medidores, costos con retraso, consultar, verificar, enviar a tiempo), no **reglas de lugar**. Cada misión posterior cambia el contexto, no las habilidades.
- Todas comparten el esqueleto de 8 pasos del código. Las voces y las escenas propias de cada una ya existen (`agents/src/voces-*.ts`, textos de `missions/`).
- **Ninguna depende de haber jugado Jezero.** La rama experimental ya ofrece las cinco desde un selector. El tutorial no se esconde en pasos exclusivos de Jezero: las piezas (`círculo`, `dosímetro`, `pista`) se construyen leyendo **`mision`**, no `MISION_JEZERO` (condición de aceptación de F §0), de modo que cualquier misión puede reutilizarlas o no.
- **Riesgo:** un niño que empiece por otra misión se salta la dramatización de los fundamentos. Mitigación propuesta, sin campaña ni desbloqueos: un par de líneas de Iris por **habilidad nueva** en la primera partida de cada niño (bandera local, sin cuenta), no por misión.

## Autoauditoría contra los 10 criterios del brief

| # | Criterio | Cómo se cumple | Dónde |
|---|---|---|---|
| 1 | Coherencia narrativa | Expedición con objetivo, conflicto, cierre; cada momento tiene causa | B §2–§4 |
| 2 | Mecánica en contexto adecuado | Cada mecánica entra como respuesta a una pregunta de la historia | D §1 |
| 3 | El jugador entiende por qué actúa | La alerta de D da el motivo antes de colocar módulos | B §5 |
| 4 | Decisiones con consecuencias comprensibles | Costos del motor, dosímetro, "Decision recorded" | E §2 |
| 5 | Iris y especialistas diferenciados | Tres preguntas distintas; Iris orienta y calla en la tormenta | B §2, §8 |
| 6 | Tormenta con preparación y resolución | Momento D + final con causas y pista | B §4–§5 |
| 7 | Aprendizaje sin leer instrucciones largas | Una línea por intervención; capas 2 y 3 a pedido | B §7, C |
| 8 | La derrota enseña sin castigar arbitrariamente | Causa exacta, dosímetro visible, pista | E §3, F N1, N3 |
| 9 | Cinco misiones independientes | Habilidades reutilizables, sin campaña | README, F §0 |
| 10 | Implementable con la arquitectura actual | Motor sin cambios; 3 piezas nuevas, el resto conexión | F |

**Dónde la propuesta es más débil (para que lo cuestiones):**
- El dilema podría ser **demasiado obvio** (refugio siempre gana en mi muestra). Es lo más importante que debe medir la entrega 0.
- No hay forma de medir **aprendizaje real** sin niños; los seis perfiles de QA son conductas simuladas.
- Dos supuestos (spoiler de Iris en Crew; Crew oculto) vienen de leer código, no de verlo en pantalla.
- El Momento D mueve una decisión de orden de fases que es de Paula; no sé en qué estado está su trabajo más allá de `ui/ESTADO.md` del 15 de nov.

## Límites cumplidos
Conserva las cinco misiones · no elimina mecánicas · no añade recursos · no cambia reglas científicas ni números · no inventa progresión · no propone reescribir arquitectura · no duplica lógica entre `engine/`, `missions/` y `ui/` · no modifica `ui/` ni `assets/` · DeepSeek y Codex solo en los papeles que el brief les asigna · todo texto visible en inglés primero, español después.

## Siguiente paso
Espero tu revisión de las decisiones D1–D6. No avanzo a ninguna entrega sin tu aprobación.
