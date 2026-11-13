# data/

Pipeline DONKI/OSDR, mocks (`data/mock`) y JSON curados de respaldo (`data/curated`). Dueño: rol 4. Ver `data/CLAUDE.md`.

- `src/spaceWeatherEvent.ts`: **propuesta** del contrato `SpaceWeatherEvent` v0.1.0 (Zod). Se mueve a `/contracts` cuando se apruebe el issue `contrato`.
- `src/donki.ts`: esquemas Zod de las respuestas crudas de DONKI.
- `mock/`: 3 eventos **inventados** (`dataStatus: "mock"`, IDs `MOCK-`) para construir ya. `mock/index.json` los lista.
- `samples/`: respuestas reales de DONKI recortadas (2026-11-13).
- `npm test`: valida los mocks contra el contrato y las muestras contra los esquemas de DONKI.
