# Misión interactiva de Jezero (propuesta A3)

**Estado:** propuesta del Frente A (José), para que la aprueben Santiago y María Paula antes del bloque 2
(PLAN-JUGABILIDAD §4, A3). Las reglas no cambian: los pasos, costos y tiempos son los de `MISION_JEZERO` y
MECANICAS §3. Esto define **qué hace el niño en el mundo**, no números nuevos.

**La idea en una línea:** cada paso se juega caminando. Iris dice adónde ir, el niño llega, alguien
reacciona, `[E]` abre la única tarjeta de decisión, el motor aplica y el mundo lo muestra.

**Reglas que no se rompen:** caminar, saltar, entrar o mirar una animación nunca da ni quita recursos
(MECANICAS §5). Todo lo que el niño puede hacer caminando también se puede hacer con el mapa (`Map` lleva
solo) y con el teclado; en el respaldo 2D sigue la misma partida. Un dato de Marte se muestra solo con su
fuente; `[V]` verificado, `[NV]` todavía no y no se usa hasta que B o datos lo verifiquen.

## Paso a paso

| Paso | Qué hace en el mundo | Qué lo sorprende | Qué aprende | Qué lo engancha |
| --- | --- | --- | --- | --- |
| 1 Satélite | Desde la nave suelta el satélite (E3, sin caminar) | El satélite gira y despliega paneles | La órbita da batería y señal, y se gastan | Ve Jezero desde arriba: "ahí vamos a vivir" |
| 2 Ruta | Traza la ruta sobre Jezero | Cada tramo baja la batería en vivo | Mirar desde el espacio también cuesta energía | La ruta termina en el cráter: quiere bajar |
| 3 Sitio | Compara 4 sitios y aterriza (E4) | Ningún sitio es perfecto | Elegir es renunciar a algo; Jezero fue un lago con un delta `[V]` (MARTE §2) | El sitio elegido cambia lo que tendrá después |
| 4 Módulos | **Entra a la base caminando.** Iris (globo y rover que avanza) lo lleva al taller; la Ingeniera gira, saluda y explica. `[E] Build` en dos anclajes vacíos (A9) | Al saltar, en Marte sube unas 2,6 veces más alto que en la Tierra con el mismo impulso (gravedad 0,380 de la terrestre `[V]` NSSDC; el impulso es suposición de juego, A5) | Cada módulo cuesta energía ahora y rinde después | Ve su módulo instalarse en el mundo y queda "pendiente" el beneficio |
| 5 Tormenta | Iris lo lleva al sensor; la Meteoróloga señala el cielo. Llega la alerta y la tarjeta de fuente | Una tormenta solar real (mayo 2024) `[V]` `data/curated/2024-05-20-marte.json`; la dosis se midió en Gale, no en Jezero (MARTE §8) | El Sol también es clima; los datos tienen fuente y se pueden revisar (`View source`) | El cielo y la luz cambian: algo va a pasar |
| 6 Dilema | La Ingeniera y la Doctora le dan consejos opuestos. **Iris se equivoca:** su número de blindaje no coincide con el medidor | Iris, la que lo guiaba, falla con interferencia (cara de error, temblor) | Comparar con el medidor real y con una experta antes de obedecer a una IA (MECANICAS §3.4) | Arreglar a Iris en el taller con la Ingeniera: vuelve a guiarlo |
| 7 Telemetría | Camina a la consola de enlace (`mesa`) y envía la telemetría | La respuesta no llega al instante: tarda turnos | Las señales entre planetas tardan; el retraso real en minutos `[NV]` hasta tener fuente | La antena gira y el HUD cuenta los turnos que faltan (del motor, no inventados) |
| 8 Fin | La tripulación lo rodea y comenta lo que eligió | Su base sobrevivió (o no) por **sus** decisiones, separadas de la mala suerte | Causa y consecuencia (`resumenPartida`) | Pregunta final y la invitación a otra misión |

## Momentos de asombro que dependen de otros frentes

| Momento | Paso | Quién | Fuente |
| --- | --- | --- | --- |
| Luz de la tarde y atardecer azulado al final | 7, 8 | D3 | `[NV]` hasta que B o datos la verifiquen |
| Remolinos de polvo a lo lejos | 3 a 6 | D6 | `[NV]` |
| La tripulación habla con gestos propios (14 gestos) | 4 a 8 | A7 con B | — |
| Entrar al taller por el corredor | 4, 6 | A8, D5 | lámina `exterior/01` |

## Qué decide esta propuesta (para aprobar)

1. El paso 4 se juega en el mundo (A9): la lista de módulos del panel queda como respaldo 2D y para teclado.
2. El globo de Iris es una frase corta; el diálogo completo sigue en `Crew` (A2, #345).
3. La avería de Iris se ve en el paso 6, nunca antes (A1, #340).
4. El salto es para explorar y sorprender, no da acceso a nada que cambie recursos.

**Sin decidir:** si `Crew` aparece recién después de la primera conversación en el mundo (PLAN §1) o desde
el inicio. Lo decide E con F.
