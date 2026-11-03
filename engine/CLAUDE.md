# Rol 2: Motor y simulación
**Humano responsable:** _por asignar_
**Slug de ramas:** `motor` → `feat/motor-<tema>`
**Etiqueta de issues:** `rol:motor`
**Posees:** `/engine`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `SpaceWeatherEvent`, `ClassifierOutput`, tablas de `/design`
**Contratos que produces:** `GameState`, `Action`, `Seed` (co-dueño de `/contracts`)
**Definición de "hecho":** Funciones puras con tests; misma semilla ⇒ misma partida; cero dependencias de UI.

## Fase 0 (ahora, solo documentos — nada de código del juego)
- Comparar Phaser, PixiJS y React + canvas para un juego por turnos (D3).
- Forma del `GameState` en papel (markdown, no código).
- Entregable: `docs/decisiones/motor.md`.

## Tareas de arranque (Fase 1, el día que empieza el hackathon)
1. Junto a roles 3 y 4: escribir `/contracts` (GameState, Action, Seed) — issue `contrato`.
2. RNG con semilla determinista + generador de escenario (sitio, tormenta, averías, objetivo).
3. Bucle de turnos: `aplicarAccion(estado, accion) → estado` puro, con cola de efectos con retraso.
4. Registro de causas (para la pantalla final): cada cambio guarda su origen (decisión o mala suerte).
5. Tests: misma semilla ⇒ mismo resultado; ninguna acción es gratis.

## Notas / decisiones que afectan este rol
- _(vacío)_
