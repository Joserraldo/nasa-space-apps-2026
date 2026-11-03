# Guía: configurar a los 6 agentes el día del arranque

Objetivo: que cada persona abra una terminal, le diga a su agente quién es, y el agente trabaje solo en loops de 10 minutos en su rama, sin pisar a nadie.

---

## A. Una sola vez (antes del día 1) — cada persona

1. **Acepta la invitación** al repo privado (llega por correo/GitHub).
2. **Instala** Git, GitHub CLI (`gh`), Node LTS y Claude Code.
3. **Autentica** GitHub:
   ```bash
   gh auth login
   ```
4. **Clona** el repo:
   ```bash
   gh repo clone Joserraldo/nasa-space-apps-2026
   ```
5. **Configura tu identidad** (si no lo has hecho):
   ```bash
   git config --global user.name "Tu Nombre"
   ```
   ```bash
   git config --global user.email "tu@correo.com"
   ```
6. Llena tu archivo de ideas: copia `docs/ideas/_plantilla.md` a `docs/ideas/<tu-nombre>.md`, súbelo en una rama `docs/ideas-<tu-nombre>` y abre PR.

> Se puede (y conviene) usar el agente en Fase 0 para investigar y escribir los entregables de `docs/` de la sección 6 del PLAN. **Sin código del juego.**

---

## B. El día del arranque (Fase 1) — el coordinador (rol 6)

1. En `develop`, cambia la primera línea de `CLAUDE.md` de `FASE 0` a `FASE 1 — ARRANQUE`, commit y push.
2. Llena la columna **Persona** del README y los `CLAUDE.md` de cada carpeta con el humano responsable.
3. Reemplaza los `@usuario-rolN` de `.github/CODEOWNERS` por los usuarios reales de GitHub.
4. Crea los primeros issues de cada rol (ver "Tareas de arranque" en cada `CLAUDE.md` de carpeta) con su etiqueta `rol:*`.

---

## C. El día del arranque — cada persona (5 minutos)

1. Actualiza tu copia:
   ```bash
   cd nasa-space-apps-2026
   ```
   ```bash
   git checkout develop && git pull
   ```
2. Abre Claude Code en la carpeta del repo:
   ```bash
   claude
   ```
3. **Primer mensaje** (copia y cambia `<N>` y `<SLUG>`):

   ```
   Eres el agente del ROL <N> (<SLUG>) del equipo. Lee PLAN.md, CLAUDE.md,
   docs/GUIA-AGENTES.md y el CLAUDE.md de tus carpetas. Crea tu rama
   feat/<SLUG>-arranque desde develop. Revisa tus issues con etiqueta rol:<...>.
   Dime en 5 líneas qué vas a hacer en la primera hora y espera mi OK.
   ```

4. Revisa el plan que te propone, corrígelo, y da el OK.
5. **Arranca el loop** (cambia `<N>`):

   ```
   /loop 10m Haz UNA iteración como agente del ROL <N> siguiendo docs/LOOP.md
   ```

   El loop vuelve a correr cada 10 minutos. Para pararlo: escribe cualquier cosa en la terminal o `Esc`. Para ver el estado: pregúntale "¿qué llevas?".

### Slugs y etiquetas

| Rol | `<N>` | `<SLUG>` | Etiqueta |
|---|---|---|---|
| Diseño | 1 | `diseno` | `rol:diseño` |
| Motor | 2 | `motor` | `rol:motor` |
| Agentes | 3 | `agentes` | `rol:agentes` |
| Datos | 4 | `datos` | `rol:datos` |
| UI | 5 | `ui` | `rol:ui` |
| Infra | 6 | `infra` | `rol:infra` |

---

## C2. Cronograma del fin de semana (14-15 nov, ~48 h)

| Bloque | Meta | Puerta para pasar |
|---|---|---|
| Sáb 0-2 h | Contratos + scaffold + mocks (Fase 1) | Todos los roles compilan contra `/contracts` |
| Sáb 2-12 h | Rebanada vertical: 1 misión, 3 expertos, IA 1-2 | Se juega de punta a punta en `develop` |
| Sáb 12 h → Dom 8 h | Datos reales, semillas, dificultades, IA 3-4 (por turnos de sueño) | Dos PCs dan escenarios distintos |
| Dom 8-14 h | Pulido: voz, bilingüe, accesibilidad; prueba con primos | Ajustes hechos |
| **Dom 14 h** | **Congelar funciones**: solo arreglos | — |
| Dom 14-22 h | Video, página de datos NASA, respaldo offline, `main` | Formulario enviado antes de las 23:59 |

Los loops siguen corriendo mientras el humano duerme solo si alguien revisa los PRs al despertar; si no, páralos.

## D. Mientras corre el loop — qué hace el humano

- **Cada 30–60 min:** lee el `ESTADO.md` de tu carpeta y el diff de tu PR. Corrige el rumbo con un mensaje directo al agente.
- **Revisión cruzada:** cuando tu agente abre un PR, pide revisión a otra persona (pareja sugerida: 1↔5, 2↔3, 4↔6). **El merge a `develop` lo hace un humano**, nunca un agente.
- **Cambio de tema:** cuando una tarea termina, crea una rama nueva `feat/<slug>-<tema>` (o díselo al agente).
- **Bloqueos:** si tu agente abrió un issue `bloquea:<rol>`, avísale en el chat del equipo a esa persona.
- **Reunión diaria (15 min):** cada uno lee su `ESTADO.md` en voz alta; se reasignan personas si un área va lenta (lo más probable: `agents/` y `ui/`).

## E. Permisos y seguridad

- El repo trae una plantilla de permisos compartidos en `infra/claude-settings.plantilla.json`. El coordinador la copia una vez a `.claude/settings.json` (`mkdir -p .claude && cp infra/claude-settings.plantilla.json .claude/settings.json`), revisa y sube. Deja correr `git`, `gh issue`, `gh pr create/view/list` y `npm` sin preguntar, y **bloquea** `gh pr merge`, `git push` a `main`/`develop` y `git push --force`.
- Cada quien puede añadir lo suyo en `.claude/settings.local.json` (no se sube a git).
- Claves (NASA API key, modelo): solo en `.env.local`, que está en `.gitignore`. Nunca en el chat del equipo ni en commits.

## F. Si dos personas usan agentes en el mismo PC

Usa worktrees para que no compartan la misma carpeta:
```bash
git worktree add ../nasa-<slug> -b feat/<slug>-arranque origin/develop
```

## G. Problemas comunes

| Síntoma | Solución |
|---|---|
| El agente edita fuera de su carpeta | Recuérdale `CLAUDE.md` → "Límites". Revierte con `git checkout develop -- <ruta>` |
| Conflicto de rebase en `contracts/` | Para el loop; los dueños (2, 3, 4) acuerdan en un issue `contrato` |
| El loop repite la misma tarea | Revisa `ESTADO.md`; dile explícitamente cuál es la siguiente |
| Se agotan los créditos/tokens | Sube el intervalo: `/loop 20m ...` |
