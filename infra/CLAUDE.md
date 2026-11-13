# Rol: Integración, QA, despliegue y pitch
**Humano responsable:** José (`Joserraldo`), que también lleva `agentes`. Si `agentes` se atrasa, este rol es el que se reparte. Santiago (`kcitas`) orquesta desde `docs/ORQUESTACION.md`.
**Slug de ramas:** `infra` → `feat/infra-<tema>`
**Etiqueta de issues:** `rol:infra`
**Posees:** `/infra`, `/tests`, `/pitch`, `/.github`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** todo (integra).
**Contratos que produces:** CI, despliegue, función serverless del clasificador, prueba e2e de la semilla dorada, video y formulario.
**Definición de "hecho":** `develop` se despliega solo a un link de prueba y `main` a producción; la e2e de la semilla dorada pasa en CI; hay video de respaldo.

## Ya hecho
- CI de tipos y tests en cada PR (#22), con `data/` incluido (#46).
- Secreto del repo `BAI_API_KEY` (clave del modelo del clasificador). Ningún flujo lo usa todavía.

## Tareas, en este orden
1. **Despliegue a Cloudflare Pages desde GitHub Actions:** preview desde `develop`, producción desde `main`. Necesita los secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`, que Santiago te pasa por privado cuando cree la cuenta. Meta: link vivo con una página vacía antes de que `ui` tenga su primera pantalla.
2. Worker (Hono) del clasificador: lee `BAI_API_KEY` solo del entorno, límite de uso por IP en KV, no reenvía IP ni identificadores, solo la frase. El juego funciona sin él.
3. Prueba e2e de la semilla dorada (Playwright) en cuanto `ui` tenga la ruta jugable; producción solo se despliega si pasa.
4. Pitch: `pitch/criterios.md` (ya hay borrador) → guion del video de 2 min sobre la ruta dorada → grabación de prueba el domingo en la mañana → grabación final sobre el build congelado.
5. Formulario de entrega: texto, página "datos de NASA usados y por qué", atribuciones, descripción de uso de IA (`docs/ia-uso.md`). Un segundo humano lo revisa antes de enviar.

## Notas / decisiones que afectan este rol
- Claves solo en secretos del repo, variables de Cloudflare y `.env.local`. Nunca en código, chat, issues ni commits.
- Sin logo de NASA. Atribución visible: "Datos: NASA (fuente exacta + fecha). Proyecto no oficial, no avalado por NASA."
- Congelar funciones el domingo 15 a las 13:00; enviar antes de las 20:00 (cierra 23:59).
