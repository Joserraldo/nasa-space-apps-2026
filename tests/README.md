# tests/

Pruebas transversales del rol `infra`. Las pruebas unitarias de cada paquete viven junto a su código (`*.test.ts`) y las corre vitest (`npm test`). **Vitest no ve esta carpeta**: su lista `include` en `vitest.config.ts` no contiene `tests/`; no lo cambies, porque Playwright y vitest chocarían.

## e2e: ruta dorada (`tests/e2e/ruta-dorada.spec.ts`)

Playwright (Chromium) juega la partida de demo de #41 (semilla `jezero-2024-05-20`) en inglés y español: inicio, satélite, elegir sitio, 2 módulos, tormenta real del 20 may 2024 con tarjeta de fuente, Doctora vs. Ingeniera, Iris dañada que dice "todo perfecto" y se verifica, enviar telemetría y resumen con cadena de causas y tarjeta de ciencia. Falla si hay errores de consola.

### Cómo correrla

```
npm install
npx playwright install chromium
npm run e2e
```

`playwright.config.ts` levanta el servidor de Vite de `ui/` solo si existe `ui/package.json` (puerto 5173; cambia con `E2E_PORT`). Para apuntar a otro sitio (p. ej. el link de preview): `E2E_BASE_URL=https://... npm run e2e` (no arranca servidor). Solo corre en el navegador `chromium`.

El reloj de la ui es de 4 s por turno; la prueba usa `page.clock` para avanzarlo sin esperar. Si cambia ese intervalo (`TURNO_MS` en el spec), actualízalo.

### Selectores

Identificadores estables definidos en [selectores.md](selectores.md). Los casos EN/ES conservan roles y nombres accesibles, pero el recorrido no depende de etiquetas literales o `details summary`. José actualiza la ruta con cada transición nueva; los autores conservan los IDs de los componentes.

### CI

La CI ejecuta la ruta dorada en PRs hacia develop, main y feat/ui-escenarios. Cualquier intro/carga nueva mantiene el contrato de inicio de selectores.md y llega al mismo estado orbital. No posponer el ajuste de la prueba a otro PR después de cambiar el flujo.
