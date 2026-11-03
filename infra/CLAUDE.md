# Rol 6: Integración, QA, despliegue y pitch
**Humano responsable:** _por asignar_
**Slug de ramas:** `infra` → `feat/infra-<tema>`
**Etiqueta de issues:** `rol:infra`
**Posees:** `/infra`, `/tests/e2e`, `/pitch`, `/.github`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** Todo (integra)
**Contratos que produces:** CI, deploy, función serverless del clasificador
**Definición de "hecho":** `develop` siempre despliega; e2e de la rebanada vertical pasa; demo con respaldo offline.

## Fase 0 (ahora, solo documentos — nada de código del juego)
- Repo, protección de ramas, tablero y plantillas (hecho en la foundation, revisar).
- Revisar reglas oficiales y fechas: `docs/reglas.md` (ya hay un borrador).
- Hosting y serverless (D5); plan de pruebas con primos (D11).

## Tareas de arranque (Fase 1, el día que empieza el hackathon)
1. Cambiar `CLAUDE.md` a FASE 1, llenar personas y CODEOWNERS, crear issues de arranque.
2. Scaffold del monorepo (PLAN §13: npm workspaces, TypeScript, React + Vite, Hono en Cloudflare Workers) + scripts `lint`, `test`, `build`.
3. CI en GitHub Actions: lint + tests + build en cada PR a `develop`.
4. Cloudflare Pages: preview por PR y producción desde `main`; D1 + KV configurados.
5. Worker (Hono) del clasificador con límite de uso por IP en KV (clave solo en variables de entorno).
6. Smoke e2e: abrir juego → jugar un turno → ver pantalla final. Esqueleto del pitch en `/pitch`.

## Notas / decisiones que afectan este rol
- _(vacío)_
