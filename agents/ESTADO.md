# Estado — José (agentes, infra, integración del frontend)
**Actualizado:** 14 nov 2026, 22:55 · **Ramas:** feat/ui-integracion-{vista,eventos,ajustes} · **PRs:** #181, #182, #186 hacia feat/ui-escenarios

## Hecho
- Contratos del frontend (FLUJO §3): `VistaEscena` (#181), eventos de feedback (#182) y ajustes del jugador (#186), cada uno con 5 tests.
- Props de `EscenaBase`: propuesta en #190 para Daniel.
- Antes: #151 fusionado; CI en feat/ui-escenarios; #129 y #131 rebasados.

## Qué sigue
- OK de Daniel en #190 y fijar el tipo.
- Ola 2 (cuando María Paula suba su trabajo): borrar la bienvenida oscura de App.tsx y pantallas/.
- #156 (Luna lado visible) volver a combinar con develop después de #155.

## Bloqueos
- `LugarObjetivo` usa `DestinoIris` de agents hasta que Camilo publique `LugarId` en `escena/mundo.ts`.

Tokens: verde
