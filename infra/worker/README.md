# Worker de Solar Shield (pantalla + API)

Un solo Worker de Cloudflare sirve la pantalla (`ui/dist`) y la API (`/api/*`). Config: `wrangler.jsonc`.

| Entorno | Worker | Se publica cuando |
|---|---|---|
| Preview | `nasa-space-apps-2026-preview` | se fusiona un PR a `develop` |
| Producción | `nasa-space-apps-2026` | se fusiona a `main` |

El link de cada uno es `https://<worker>.<subdominio>.workers.dev`; el subdominio lo muestra Cloudflare al primer despliegue (Workers & Pages → el Worker → "Visit").

## Rutas
| Ruta | Qué hace |
|---|---|
| `GET /api/health` | `{ ok, entorno, modelo }`. Dice si hay clave del modelo, nunca su valor |
| `POST /api/clasificar` | `{ "texto": "..." }` → `ClassifierOutput`. Primero regex gratis; el modelo (b.ai) solo si no entiende. Límite 20/min por IP en hash |
| todo lo demás | la pantalla |

## Despliegue automático (una sola vez)
1. **Cloudflare (Santiago):** My Profile → API Tokens → Create Token → plantilla "Edit Cloudflare Workers". Copia el token y el Account ID (barra lateral de Workers & Pages).
2. **GitHub (José, único admin del repo):** Settings → Secrets and variables → Actions → New repository secret: `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`. Santiago se los pasa por privado, nunca por el chat del equipo.
3. **Quitar la conexión vieja:** el Worker `nasa-space-apps-2026` está conectado a la copia `kcitas/nasa-space-apps-2026`. En Cloudflare → el Worker → Settings → Build → **Disconnect**. Si no, cada push a esa copia publica código viejo encima.

Desde ahí, `.github/workflows/deploy.yml` publica solo si pasan tipos y pruebas.

## Secretos de la API (los sube Santiago, una vez por entorno)
Desde `infra/worker/`, con `npx wrangler login` hecho. Wrangler pide el valor y no lo muestra:

```
npx wrangler secret put BAI_API_KEY                 # producción
npx wrangler secret put BAI_API_KEY --env preview   # preview
npx wrangler secret put NASA_API_KEY                # producción
npx wrangler secret put NASA_API_KEY --env preview  # preview
```

- `BAI_API_KEY`: modelo del clasificador (b.ai, `https://api.b.ai/v1`, modelo `qwen3.8-flash`; ver `docs/decisiones/D4-clasificador.md`).
- `NASA_API_KEY`: clave de api.nasa.gov. Hoy el juego no llama a NASA en vivo (usa datos curados); queda lista para el banner opcional "Hoy en el Sol".
- Nunca en el código, en issues, en el chat ni en el navegador. Para probar en local: `infra/worker/.dev.vars` (ignorado por git) con `BAI_API_KEY=...`.

## Probar
- `npm test`: rutas y clasificador con un modelo falso, sin gasto.
- En local: `npm run build` y luego, en `infra/worker/`, `npx wrangler dev`.
- Validar sin publicar: `npx wrangler deploy --dry-run --env preview`.

## Pendiente (siguientes PRs)
- Login y modo invitado con progreso en D1 (decisión de Santiago, 14 nov).
- KV para el límite por IP (hoy sin KV el límite no aplica).
