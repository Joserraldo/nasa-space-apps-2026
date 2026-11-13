# tests/

Pruebas transversales del rol `infra`. Las pruebas unitarias de cada paquete viven junto a su código (`*.test.ts`) y las corre vitest (`npm test`). **Vitest no ve esta carpeta**: su lista `include` en `vitest.config.ts` no contiene `tests/`; no lo cambies, porque Playwright y vitest chocarían.

## e2e: ruta dorada (`tests/e2e/ruta-dorada.spec.ts`)

Playwright (Chromium) juega la partida de demo de #41 (semilla `jezero-2024-05-20`) en inglés: inicio, satélite, elegir sitio, 2 módulos, tormenta real del 20 may 2024 con tarjeta de fuente, Doctora vs. Ingeniera, Iris dañada que dice "todo perfecto" y se verifica, enviar telemetría y resumen con cadena de causas y tarjeta de ciencia. Falla si hay errores de consola.

### Cómo correrla

```
npm install
npx playwright install chromium
npm run e2e
```

`playwright.config.ts` levanta el servidor de Vite de `ui/` solo si existe `ui/package.json` (puerto 5173; cambia con `E2E_PORT`). Para apuntar a otro sitio (p. ej. el link de preview): `E2E_BASE_URL=https://... npm run e2e` (no arranca servidor). Solo corre en el navegador `chromium`.

El reloj de la ui es de 4 s por turno; la prueba usa `page.clock` para avanzarlo sin esperar. Si cambia ese intervalo (`TURNO_MS` en el spec), actualízalo.

### Selectores

Roles y textos de `ui/i18n/en.json` (el inglés es el idioma base). Si cambia un texto en inglés, la prueba falla a propósito: ajusta el texto en el spec. Aún no hay `data-testid`; cuando existan conviene pasarse a ellos (ver el comentario a ui en el PR de esta prueba).

### Cuándo conectarla al CI (pendiente, a propósito)

No está en ningún workflow todavía. Cuando se mezcle la ui (#68) a `develop`:

1. En `.github/workflows/deploy.yml`, antes del paso de producción, añadir `npx playwright install --with-deps chromium` y `npm run e2e` (con `CI=true`, que activa 1 reintento y el reporte HTML).
2. Subir `playwright-report/` como artefacto si falla.
3. Que el paso de despliegue a producción dependa (`needs`) de ese job: producción solo se publica si la ruta dorada pasa.
