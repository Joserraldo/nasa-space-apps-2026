# missions/

Misiones del juego como datos (sitio, objetivo, eventos, tormenta real asociada). El motor las lee; aquí no hay lógica.

**Dueños:** Santiago (`kcitas`) y Camilo (`CamiloM21`), rol `diseno`. Instrucciones en `design/CLAUDE.md`.

Primera misión: **Jezero** (la de la ruta dorada, con la tormenta `2024-05-20-marte`). Las demás regiones esperan a que esa se juegue en pantalla.

## Jezero jugada en papel (ruta dorada)
Números de `design/src/recursos.ts` y `missions/src/jezero.ts`. Medidores: ⚡ energía / 🫁 soporte vital / 🛡️ blindaje. Consumo por tick en Jezero: −3 / −2 / −1.

| Paso | Qué hace el niño | ⚡ | 🫁 | 🛡️ |
|---|---|---|---|---|
| inicio | — | 70 | 80 | 60 |
| 1–2 | suelta el satélite y dibuja la ruta (gasta batería y señal del satélite, no de la base) | 70 | 80 | 60 |
| 3 | aterriza en `llanura-central` (−3 ⚡, −8 🛡️) | 67 | 80 | 52 |
| 4 | coloca panel solar y escudo (−6 ⚡ −3 🫁 cada uno) | 55 | 74 | 52 |
| tick 1 | consumo; llegan los beneficios (+14 ⚡; +14 🛡️ −3 ⚡) | 63 | 72 | 65 |
| 5 (tick 3) | llega la tormenta real del 20 may 2024; el motor la descuenta del blindaje | ↓ | ↓ | ↓↓ |
| 6 | Iris (averiada) dice un 🛡️ **20 puntos más alto** que el medidor; la Ingeniera lo verifica y la repara | | | |
| 7 | envía telemetría (−5 ⚡ −1 🫁 ya; +6 🛡️ llega **2 ticks** después: retraso de comunicaciones Marte) | | | |
| 8 | **fin**: gana cuando la telemetría llega sin ningún medidor en 0; pierde si alguno llega a 0. Si nada pasa, termina en el tick 10 | | | |

Otras opciones del paso 3 (ninguna gratis, ninguna domina): `cerca-de-perseverance` (−6 ⚡ −4 🛡️, luego +3 🫁), `pie-de-la-pared-sur` (−10 ⚡ −2 🫁, luego +5 🛡️), `sobre-el-borde-oeste` (−12 ⚡ −4 🫁, luego +8 ⚡). Los 3 criterios de cada sitio vienen de `data/terreno/jezero/jezero.json` (NASA Mars Trek).
