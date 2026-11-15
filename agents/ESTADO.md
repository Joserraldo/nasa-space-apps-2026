# Estado — rol 3 (Agentes expertos)
**Actualizado:** 14 nov 2026, 19:20 · **Rama:** feat/agentes-iris-acompana · **PR:** sin abrir

## Hecho (esta iteración)
- Propuesta `docs/ideas/iris-companera-v8.md` (6 mecánicas, destino por paso).
- `agents/src/iris-acompana.ts`: `guiaIrisLugar` (destino, ruta, experto, gesto, cara) y `briefingIris`; claves `agentes.iris.acompana.*` y `agentes.iris.lugar.*` en en/es; 22 tests; tabla en README.
- Antes: voces de Marte polo norte (#97) en `feat/agentes-voces-marte-polo-norte`.

## Qué sigue
- Que Camilo apruebe las reglas y María Paula la representación; abrir PR hacia develop.
- Si lo aprueban: issue `contrato` para mover `DestinoIris`/`LugarId` a `contracts/`.
- Voces Luna polo sur (#98), outpost (#99) y Luna lado visible (#100).

## Bloqueos
- `DestinoIris` es copia de `LugarId` de la rama local de ui v8: si ui cambia un id, hay que copiarlo.
