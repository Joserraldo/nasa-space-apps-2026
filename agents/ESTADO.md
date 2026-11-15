# Estado — José (agentes, infra, integración del frontend)
**Actualizado:** 14 nov 2026, 22:25 · **Rama:** feat/ui-integracion-eventos · **PR:** hacia feat/ui-escenarios

## Hecho (esta iteración)
- Contrato de eventos de feedback en `ui/src/juego/eventos.ts` (FLUJO §3): `eventosDeTick(antes, despues)` sobre `novedades()`, con id estable; 5 tests.
- Antes: contrato `VistaEscena` (#181); #151 fusionado; CI en feat/ui-escenarios; #129 y #131 rebasados.

## Qué sigue
- Ajustes del jugador (idioma, sonido, movimiento reducido, calidad) en localStorage; props de `EscenaBase` con Daniel.
- Ola 2 (cuando María Paula suba su trabajo): borrar la bienvenida oscura de App.tsx y pantallas/.

## Bloqueos
- `LugarObjetivo` usa `DestinoIris` de agents hasta que Camilo publique `LugarId` en `escena/mundo.ts`.

Tokens: verde
