# Estado — José (agentes, infra, integración del frontend)
**Actualizado:** 14 nov 2026, 22:10 · **Rama:** feat/ui-integracion-vista · **PR:** hacia feat/ui-escenarios

## Hecho (esta iteración)
- Contrato `VistaEscena` en `ui/src/escena/vista.ts` (FLUJO §3) con 5 tests: módulos ausente/instalando/funcionando/averiado, Iris, tormenta, lugar objetivo y fase. La avería guionada de Iris no se ve hasta `averiaRevelada`.
- Antes: #151 fusionado; CI ya corre en feat/ui-escenarios; #129 y #131 rebasados sobre develop, CI verde.

## Qué sigue
- Eventos de feedback desde `novedades()` con id estable; ajustes del jugador; props de `EscenaBase` con Daniel.
- Ola 2 (cuando María Paula suba su trabajo): borrar la bienvenida oscura de App.tsx y pantallas/.

## Bloqueos
- `LugarObjetivo` usa `DestinoIris` de agents hasta que Camilo publique `LugarId` en `escena/mundo.ts`.

Tokens: verde
