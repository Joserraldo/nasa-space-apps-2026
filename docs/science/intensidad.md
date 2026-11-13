# Escala de `intensidad` (0–1) — escala del equipo, no es una medición

El contrato `SpaceWeatherEvent` pide una `intensidad` entre 0 y 1 para el motor. La calcula `data/src/intensidad.ts` con reglas fijas a partir de valores **reales** de DONKI. No es una magnitud física: en la tarjeta se dice "valor del juego calculado a partir de…".

| Fase | Dato real de DONKI | Regla | Ejemplos |
|---|---|---|---|
| FLR (fulguración) | clase GOES (`classType`), que es el flujo pico de rayos X en W/m² (A=1e-8, B=1e-7, C=1e-6, M=1e-5, X=1e-4) | `(log10(flujo) + 6) / 3`, recortado a [0, 1] | C1 → 0 · M1 → 0,33 · X1 → 0,67 · X8.7 → 0,98 · X10 o más → 1 |
| CME | velocidad del análisis "most accurate" (km/s) | `(v − 300) / 2200`, recortado | 300 → 0 · 870 → 0,26 · 2500 → 1 |
| GST | Kp máximo (lo aporta NOAA y **mide la Tierra**) | `Kp / 9` | Kp 9 → 1 |
| SEP | DONKI no da magnitud | no aporta | — |

**Evento:** el máximo de sus fases, redondeado a 2 decimales. **Tipo principal:** la CME si existe (es lo que viaja hasta la base); si no, la fase más intensa.

**Por qué así:** la escala GOES ya es logarítmica, y una escala lineal en flujo haría invisibles todas las fulguraciones menores que X. Los extremos (C1, X10, 300 y 2500 km/s) cubren el rango que aparece en DONKI desde 2010. La severidad del juego (cuánto daño hace) la decide el **motor** a partir de esta cifra; no es tarea de datos.
