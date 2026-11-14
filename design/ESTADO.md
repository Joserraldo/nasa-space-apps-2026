# Estado — diseño de juego y misiones
**Actualizado:** 13 nov 2026, noche · **Rama:** `feat/diseno-camilo-jezero` (Camilo) · **PR:** ver rama · **Responsables:** Santiago y Camilo
**Tokens:** 🟢

## Hecho (últimas iteraciones)
- Camilo: misión Jezero completa como datos (`missions/src/jezero.ts`): 4 sitios candidatos (ids de `data/terreno/jezero`) con costo visible de aterrizaje, avería guionada de Iris (paso 6, lee 🛡️ +20, la repara la Ingeniera) y condición de fin.
- Textos de la misión en `en`/`es` (`missions/src/textos.ts`), partida en papel en `missions/README.md`, tests en `missions/src/jezero.test.ts`.
- Santiago: `ENERGIA_POR_CANTIDAD` (PR #84).

## Qué sigue
- Motor (Jaime) debe leer `sitiosCandidatos[].aterrizaje`, `averiaIris` y `fin` → pedir con issue `bloquea:motor`.
- Mazo de eventos (≈70/30) y umbrales de dificultad adaptativa.

## Bloqueos
- No se pudieron correr los tests en la máquina de Camilo (Node/npm no disponible en la terminal): revisar CI del PR.
