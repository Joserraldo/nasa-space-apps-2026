# Estudio: qué pasa cuando el jugador obedece a Iris dañada (D16, investigación)

**Estado:** investigación. **No decide cambios de balance ni de implementación.** Medido sobre `origin/feat/agentes-p04-aviso-tormenta` (`4a949ad`, motor con P0.1–P0.6 y agentes con P0.4–P0.5), semilla dorada, sitio `cerca-de-perseverance`, en el momento en que llega la tormenta (turno 3). Script reproducible: `iris-obediencia-entrega0.test.ts.txt`. **Medición del autor (AUT)**, no independiente.

## 1. Qué le recomienda Iris (las cuatro formas de falla, `agents/src/iris.ts`)
| Forma | Líneas de Iris | ¿Trae acción? | ¿El motor la acepta al llegar la tormenta? |
|---|---|---|---|
| `numero_falso` (siempre la 1.ª) | "Shield at **{valor}**%. Everything is perfect, commander!" + "We could turn the shield down to save energy. Trust me. Probably." | **No** | — |
| `accion_peligrosa` | "Idea! Send all the energy to life support. The plants will love it." | `redistribuir_energia` hacia soporte vital, cantidad 50 | **No: `puedeAplicar` = `recursos_insuficientes` (energía)** en **0 de 64** estados de tormenta probados (energía máxima observada 54; la acción exige más de 54) |
| `experto_equivocado` | "For this problem, call {matemático}…" | No | — (el Matemático no está disponible en Jezero) |
| `silencio` | "Rebooting… I forgot what I was saying." | No | — |

**Valores en el caso dorado:** medidor de blindaje = **57**; Iris dice **77** (error de misión +20). Con módulos `reciclador_agua + invernadero`: medidor 43, Iris dice 63.

## 2. Qué ocurre si el jugador obedece (resultados medidos)
| Caso | Estado al llegar la tormenta | Qué hace | Resultado | Dosis final |
|---|---|---|---|---|
| **Creer la lectura falsa y no actuar** (panel + escudo) | E49 V71 B57 ☢1,38 | No protege; envía telemetría | **Pierde** (turno 5, dosis) | 4,19 |
| Creer y no actuar (reciclador + invernadero) | E34 V93 B43 ☢1,55 | idem | **Pierde** (turno 5, dosis) | 4,71 |
| **Corregir en el mismo turno** (refugio) | idem | Refugio | **Gana** (turno 6) | 2,25 / 2,49 |
| **Corregir un turno tarde** (refugio en el turno 4) | idem | Refugio | **Gana**, con menos margen | 3,16 / 3,56 |
| Reparar a Iris y esperar (sin proteger) | idem | Reparar (⚡−10 🫁−4) | **Pierde** (dosis) | 4,09 / 4,51 |
| Reparar a Iris **y** refugio (mismo turno), con panel | E49… | Ambas | **Gana** (E12 final) | 2,17 |
| Reparar a Iris **y** refugio, sin generación | E34… | Ambas | **Pierde** (⚡ llega a 0) | 2,35 |
| `accion_peligrosa` | — | — | **No es ejecutable** | — |

## 3. Lectura (hechos y límites)
- **Obedecer a Iris no ejecuta nada.** La mentira (`numero_falso`) solo produce daño por **omisión**: el niño cree que el escudo está bien y no protege. La acción "peligrosa" **está bloqueada por el propio motor** en todos los estados de tormenta probados, así que el niño ve "no alcanza la energía" y nada ocurre. La consecuencia observable de obedecer es hoy **cero en el caso de la acción** y **indirecta en el caso del número**.
- **El consejo no tiene acción correspondiente.** "Turn the shield down to save energy" no existe como acción del contrato (no hay forma de bajar el blindaje); el niño no puede obedecerlo literalmente.
- **Oportunidad de detectar el error: siempre presente.** El HUD muestra el medidor de blindaje (57) y Iris dice 77: la discrepancia es visible. La Ingeniera la nombra con los dos valores (`verificarIris`).
- **Recuperación: amplia.** Corregir un turno tarde aún gana en ambos pares probados (con dosis 3,2–3,6, cerca del límite de 4). Un segundo turno de retraso **no se midió**.
- **Verificar/reparar a Iris tiene un costo real que puede costar la partida:** ⚡−10 🫁−4. Sin generación, reparar y protegerse en el mismo turno deja la energía en 0. Es una tensión verdadera entre "verificar" y "proteger", pero **no está explicada** al niño.
- **Iris no es necesaria para ganar:** todas las victorias medidas ocurren con Iris todavía dañada (`ia:danada`).
- **Cuándo aparece la falla:** solo si el niño **le pregunta a Iris** (`conversar`). Un niño que nunca le habla a Iris jamás ve la falla.

## 4. Implicaciones para el diseño (sin decidir implementación)
1. La lección actual es "comprueba el número", no "obedecer a Iris tiene consecuencias". Si se quiere que obedecer cueste algo observable, hay que definir **una acción que Iris pueda proponer y que el motor acepte** (hoy no existe en la tormenta). Esto toca `agents/` y, según el caso, el balance: **no se decide aquí**.
2. El texto `agentes.iris.verificar.accion_peligrosa` ("take energy from the shield… radiation gets in") describe una causalidad que el motor no tiene (`redistribuir_energia` no toca el blindaje) y la acción que acompaña **no se puede ejecutar**. Debe corregirse aunque no se decida lo demás (cambio de texto/contenido).
3. Lo que sí se puede hacer sin tocar reglas: que la lectura cierta previa (S0–S1 de SPEC_V2 §2) establezca el hábito, y que la discrepancia se muestre **al lado del medidor** en el mismo cuadro.
4. **Pendiente de decisión (D16, ahora como resultado de investigación):** ¿se quiere una consecuencia observable de obedecer? Si sí, se necesita una propuesta (mi opción más simple, sin cambiar valores: que la lectura falsa dispare una pista en la Ingeniera cuando el niño "se relaja" y la dosis sube; es solo UI/agents y **no se implementó ni se midió**).

## 5. Limitaciones
Una sola semilla (la dorada) en el estudio de la acción peligrosa más 4 semillas en el barrido de ejecutabilidad (64 estados); no se probó la rotación de formas con otras semillas; no se midió el efecto de que el niño ignore a Iris por completo más allá de lo anterior; los resultados de "creer" asumen telemetría enviada tras la tormenta.
