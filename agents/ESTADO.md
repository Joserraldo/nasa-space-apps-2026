# Estado — José (agentes, infra, integración del frontend)
**Actualizado:** 14 nov 2026, 22:48 · **Rama:** feat/ui-integracion-ajustes · **PR:** hacia feat/ui-escenarios

## Hecho (esta iteración)
- Contrato de ajustes del jugador en `ui/src/juego/ajustes.ts` (FLUJO §3): idioma, sonido, movimiento reducido y calidad en localStorage, con valores por defecto si falla; 5 tests.
- Antes: `VistaEscena` (#181) y eventos de feedback (#182); #151 fusionado; CI en feat/ui-escenarios; #129 y #131 rebasados.

## Qué sigue
- Props de `EscenaBase`: propuesta en #190, esperando OK de Daniel.
- Cuando entre #181: merge de feat/ui-escenarios en #182 y #186, quedándome con el ESTADO más nuevo (sugerencia de Santiago).
- Ola 2 (cuando María Paula suba su trabajo): borrar la bienvenida oscura de App.tsx y pantallas/.

## Bloqueos
- `LugarObjetivo` usa `DestinoIris` de agents hasta que Camilo publique `LugarId` en `escena/mundo.ts`.

Tokens: verde
