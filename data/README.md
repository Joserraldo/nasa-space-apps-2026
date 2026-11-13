# data/ — `@solar-shield/data`

Dueño: rol datos (Daniel). Ver `data/CLAUDE.md` (plan por puertas).

- `src/tormenta.ts`: registro interno de una tormenta (fases reales de DONKI, claves i18n, dueño, fecha de consulta).
- `src/convenio.ts`: `aConvenio(tormenta)` → `SpaceWeatherEvent` del contrato (horas relativas, intensidad, tarjeta de fuente).
- `src/intensidad.ts`: escala 0–1 del equipo (documentada en `docs/science/intensidad.md`).
- `src/contrato-espejo.ts`: copia temporal del contrato del motor (PR #18) más los campos opcionales propuestos en #17. Se borra cuando #18 se fusione.
- `src/donki.ts`: esquemas Zod de las respuestas crudas de DONKI.
- `mock/`: 3 tormentas **inventadas** (IDs `MOCK-`). `i18n/{es,en}.json`: textos visibles.
- `samples/`: respuestas reales de DONKI recortadas (2026-11-13).

```ts
import { eventosMock, tormentasMock } from "@solar-shield/data";
import es from "@solar-shield/data/i18n/es.json";
```

`npm test` valida mocks, i18n, escala y muestras.
