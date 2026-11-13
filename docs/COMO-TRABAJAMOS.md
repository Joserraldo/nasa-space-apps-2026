# Cómo trabajamos

Estándar del equipo desde el 13 nov en la tarde, decidido por Santiago. Aplica a todos, con cualquier herramienta. Si algo de aquí choca con un documento más viejo, manda este.

## 1. Quién hace qué

| Rol | Personas | Carpetas |
|---|---|---|
| `motor` (diseño de juego y misiones + motor y simulación) | Santiago y Camilo | `design/`, `missions/`, `engine/` |
| `ui` (pantallas, voz, arte, accesibilidad) | María Paula | `ui/`, `assets/` |
| `agentes` (tripulación de expertos, Iris, clasificador) | José | `agents/` |
| `infra` (integración, QA, despliegue y pitch) | José | `infra/`, `tests/`, `pitch/`, `.github/` |
| `datos` (NASA y ciencia) | Daniel y Jaime | `data/`, `docs/science/` |

Santiago es además el orquestador: coordina, desbloquea y mantiene los documentos de coordinación de `docs/`. Suplente del orquestador: Jaime.

**Traspaso del motor.** Jaime escribió el motor que hoy está en `develop` y pasa a datos. Antes de cambiar de carpeta deja en `engine/ESTADO.md` lo que está a medias y lo que no es obvio, y el primer día revisa los PRs de `engine/` de Santiago y Camilo.

**José lleva dos roles.** Si `agentes` se atrasa, lo primero que se reparte es `infra` (pitch y pruebas), no los expertos.

## 2. Qué construimos primero

El motor y los datos van adelantados; **la pantalla y la tripulación todavía no existen**. Un juez solo ve la pantalla. Por eso el orden es:

1. **La ruta dorada jugable en pantalla**, de principio a fin, con la tormenta real que Curiosity midió en Marte (evento curado `2024-05-20-marte`).
2. **La tripulación de expertos a la vista desde el primer minuto.** Es lo que nos distingue: los expertos acompañan al jugador, se contradicen y cada consejo sale de un dato real con su fuente.
3. Todo lo demás (más regiones, 3D, Luna, atlas) espera a que 1 y 2 funcionen.

`motor` y `datos` no añaden funciones nuevas hasta que la ruta dorada se juegue en pantalla: su trabajo es darle a `ui` y a `agentes` lo que pidan.

## 3. Idioma

El inglés es el idioma base. Cada texto se escribe primero en `en`, es el idioma por defecto y el de respaldo. El español se completa después y se elige con el selector. Ningún texto visible va quemado en el código.

Los documentos del equipo, los commits y los PRs siguen en español.

## 4. Tu sesión: Opus dirige, los subagentes ejecutan

Todos tienen OpenCode; Daniel tiene además Codex.

- **Una sola sesión principal por persona, con Opus.** Tú le hablas a Opus y a nadie más.
- **Opus es quien lanza los subagentes**, no tú. Así una sola cabeza lleva la cuenta de qué está corriendo y cuánto se ha gastado. No abras sesiones paralelas por tu cuenta para el mismo rol.
- **Para qué sirve un subagente:** buscar en el repo, generar código repetitivo, escribir tests, traducir textos. Para eso se usa un modelo más pequeño (ver [modelos.md](modelos.md)).
- **Qué se queda en Opus:** contratos, decisiones de diseño, depuración difícil y la revisión de lo que devuelve cada subagente antes de hacer commit.
- **Máximo 2 o 3 subagentes a la vez**, cada uno con una tarea corta y dentro de las carpetas de tu rol.
- **Pídele a Opus que te diga, antes de lanzar, cuántos subagentes va a usar y para qué.** Si no puedes explicar para qué sirve uno, sobra.
- **Reporta el consumo** en tu `ESTADO.md`: `Tokens: 🟢 / 🟡 / 🔴`. En 🔴 avisa en `#bloqueos` para repartir tus tareas.

Cómo se configuran los subagentes y su modelo depende de la herramienta: revísalo en la tuya antes de empezar.

## 5. Ciclo de trabajo

1. `git fetch origin && git rebase origin/develop`.
2. Una tarea a la vez, de tu issue de mayor prioridad, en una rama `feat/<slug>-<tema>`.
3. PR pequeño (< ~300 líneas) hacia `develop`. El CI debe pasar.
4. Actualiza tu `ESTADO.md` (máximo 15 líneas).
5. Si necesitas algo de otro rol: issue `bloquea:<rol>` y sigues con otra cosa.

Nadie empuja directo a `develop` ni a `main`. `contracts/` solo cambia con un issue `contrato`.

## 6. Cloudflare y claves

**Nadie entra a la cuenta de Cloudflare de Santiago y nadie comparte contraseñas.** No hace falta:

- **El despliegue sale de GitHub.** Cada cambio que entra a `develop` se publica solo en un link de prueba; lo que entra a `main` es producción. Tú "subes" tu trabajo fusionando tu PR.
- **El juego no llama a la API de NASA mientras se juega.** Los datos ya están curados en `data/curated/`. Solo el pipeline de `datos` usa la API, con la clave personal de cada quien en su `.env.local`.
- **La única clave de producción es la del modelo del clasificador.** Ya está guardada como secreto cifrado del repo con el nombre `BAI_API_KEY` (13 nov). Ningún flujo la usa todavía: el flujo de despliegue la leerá con ese nombre y la pasará a Cloudflare. El navegador nunca la ve.
- **Para probar en tu máquina** usa tus propias claves en `.env.local`. Nunca en el chat, en issues ni en commits.

Pendiente de montar (lo hace José, que lleva `infra` y es el administrador del repo): el flujo de despliegue en GitHub Actions. Necesita dos secretos del repo (token y ID de la cuenta de Cloudflare). Santiago crea la cuenta y le pasa esos dos valores a José por un canal privado, nunca por el chat del equipo.
