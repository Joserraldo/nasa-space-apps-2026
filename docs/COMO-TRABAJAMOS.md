# Cómo trabajamos

Estándar del equipo desde el 13 nov en la tarde, decidido por Santiago. Aplica a todos, con cualquier herramienta. Si algo de aquí choca con un documento más viejo, manda este.

## 1. Quién hace qué

| Rol | Personas | Carpetas |
|---|---|---|
| `diseno` (diseño de juego y misiones) | Camilo (Santiago supervisa y aprueba los números) | `design/`, `missions/` |
| `motor` (motor y simulación) | Jaime | `engine/` |
| `ui` (pantallas, voz, arte, accesibilidad) | María Paula | `ui/`, `assets/` |
| `agentes` (tripulación de expertos, Iris, clasificador) | José | `agents/` |
| `infra` (integración, QA, despliegue y pitch) | José | `infra/`, `tests/`, `pitch/`, `.github/` |
| `datos` (NASA y ciencia) | Daniel | `data/`, `docs/science/` |

Santiago es además el orquestador: coordina, desbloquea y mantiene los documentos de coordinación de `docs/`. Suplente del orquestador: Jaime.

**Estos roles son definitivos.** No se vuelven a cambiar.

**Diseño y motor trabajan en pareja.** El motor (Jaime) lee las tablas y misiones que escribe Camilo en `design/` y `missions/`; ningún número del juego vive en `engine/`. Lo que diseño necesite del motor se pide con un issue `bloquea:motor`, y al revés con `bloquea:diseño`.

**José lleva dos roles.** Si `agentes` se atrasa, lo primero que se reparte es `infra` (pitch y pruebas), no los expertos.

## 2. Idioma

El inglés es el idioma base. Cada texto se escribe primero en `en`, es el idioma por defecto y el de respaldo. El español se completa después y se elige con el selector. Ningún texto visible va quemado en el código.

Los documentos del equipo, los commits y los PRs siguen en español.

## 3. Tu sesión: Opus dirige, los subagentes ejecutan

Todos usan Claude Code; solo Camilo tiene OpenCode y Daniel tiene además Codex (actualizado por María Paula el 14 nov; tabla de modelos y esfuerzo en [prompts/README.md](prompts/README.md#modelos-y-esfuerzo)).

- **Una sola sesión principal por persona, con Opus.** Tú le hablas a Opus y a nadie más.
- **Opus es quien lanza los subagentes**, no tú. Así una sola cabeza lleva la cuenta de qué está corriendo y cuánto se ha gastado. No abras sesiones paralelas por tu cuenta para el mismo rol.
- **Para qué sirve un subagente:** buscar en el repo, generar código repetitivo, escribir tests, traducir textos. Para eso se usa un modelo más pequeño (ver [modelos.md](modelos.md)).
- **Qué se queda en Opus:** contratos, decisiones de diseño, depuración difícil y la revisión de lo que devuelve cada subagente antes de hacer commit.
- **Máximo 2 o 3 subagentes a la vez**, cada uno con una tarea corta y dentro de las carpetas de tu rol.
- **Pídele a Opus que te diga, antes de lanzar, cuántos subagentes va a usar y para qué.** Si no puedes explicar para qué sirve uno, sobra.
- **Reporta el consumo** en tu `ESTADO.md`: `Tokens: 🟢 / 🟡 / 🔴`. En 🔴 avisa en `#bloqueos` para repartir tus tareas.

Cómo se configuran los subagentes y su modelo depende de la herramienta: revísalo en la tuya antes de empezar.

## 4. Ciclo de trabajo

1. `git fetch origin && git rebase origin/develop`.
2. Una tarea a la vez, de tu issue de mayor prioridad, en una rama `feat/<slug>-<tema>`.
3. PR pequeño (< ~300 líneas) hacia `develop`. El CI debe pasar.
4. Actualiza tu `ESTADO.md` (máximo 15 líneas).
5. Si necesitas algo de otro rol: issue `bloquea:<rol>` y sigues con otra cosa.

Nadie empuja directo a `develop` ni a `main`. **Los PRs los fusiona Santiago** (él mismo o su agente, cuando él lo ordena), con squash. `contracts/` solo cambia con un issue `contrato`.

## 5. Cloudflare y claves

Ya funciona (14 nov). **Nadie entra a la cuenta de Cloudflare de Santiago y nadie comparte claves.**

- **Despliegue automático** (`.github/workflows/deploy.yml`): cada merge a `develop` publica la preview; cada merge a `main` publica producción. Solo publica si pasan tipos y pruebas. Tú "subes" tu trabajo cuando Santiago fusiona tu PR.
  - Preview: https://nasa-space-apps-2026-preview.santiago031541.workers.dev
  - Producción: https://nasa-space-apps-2026.santiago031541.workers.dev
- **Un solo Worker** (`infra/worker/`) sirve la pantalla (`ui/dist`) y la API (`/api/health`, `/api/clasificar`, login y progreso). Detalle en `infra/worker/README.md`.
- **El juego no llama a la API de NASA mientras se juega:** los datos están curados en `data/`.
- **Claves:** `BAI_API_KEY`, `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` son secretos del repo; el despliegue sube la del modelo al Worker. El navegador nunca ve una clave. Para probar en tu máquina, usa las tuyas en `.env.local` o `infra/worker/.dev.vars` (ignorados por git). Nunca en el chat, en issues ni en commits.
- **Login opcional sin correo** y modo invitado: el progreso del que entra se guarda en D1; el del invitado no.
