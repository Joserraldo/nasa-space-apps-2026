# Prompts de arranque por rol (14 nov 2026, noche)

**Orquestador del equipo:** Santiago (`kcitas`). **Orquestadora del desarrollo 3D y de la pantalla:** María Paula (`Paulasaah`) (decisión de Santiago, 14 nov). **Revisión de PRs y tablero de pendientes:** sesión revisora de Claude ([revisor.md](revisor.md)). **Fusiona:** Santiago (`kcitas`), solo con squash, cuando pasa la CI.

**Para arrancar: [ARRANQUE.md](ARRANQUE.md)** (quién inicia, cómo se abre cada sesión, la lista de tareas por persona, el flujo y el calendario).

Cada persona abre su sesión, pega **su** prompt y después lanza el loop que el prompt indica. Si un prompt choca con un `CLAUDE.md` de carpeta o con un prompt viejo del historial, manda este.

## Roles y tareas en esta implementación (desde el sáb 14 nov, noche)

Todo el frontend v8 se construye en la rama **`feat/ui-escenarios`** y vuelve a `develop` en dos puntos de control ([FLUJO.md](../referenciapau/FLUJO.md) §2). Cada persona tiene **un solo prompt** (una sesión principal, como pide `docs/COMO-TRABAJAMOS.md` §3) con las tareas de su rol y su parte del frontend; el brief de su parte dice qué archivos son suyos.

| Persona | Rol de equipo | Parte del frontend (brief) | Prompt | Loop | Meta para parar |
| --- | --- | --- | --- | --- | --- |
| **Santiago** | Orquestador del equipo; fusiona en `develop` | — | [supervisor.md](supervisor.md) | 20 min | Formulario enviado (P5) |
| **María Paula** | Orquestadora del desarrollo 3D y de la pantalla; dueña de `ui/`; fusiona en `feat/ui-escenarios` | **Dirección visual y personajes**: niño, Iris rover, Ingeniera, portada 3D ([front-personajes.md](front-personajes.md)) | [ui.md](ui.md) y su loop de seguimiento [orquestadora.md](orquestadora.md) | 10 min y 30 min | Personajes fieles en la base y punto de control final en `develop` |
| **Daniel** | Datos de NASA (con Codex GPT-6.1) | **Escenario 3D**, la parte con más trabajo: cielo y luz de Marte, terreno de Jezero, kit, base, 5 módulos, rendimiento ([front-escenario.md](front-escenario.md)) | [datos.md](datos.md) | 10 min | Escenario fiel a `mundo/01` dentro del presupuesto |
| **Jaime** | Motor; suplente del orquestador | **Interfaz de las láminas v8**, desde cero (nada visual del esqueleto actual): tokens, botones, placas, retratos, portada DOM, intro, carga, datos en pantalla; audio al final si queda tiempo ([front-interfaz.md](front-interfaz.md)) | [motor.md](motor.md) | 10 min | Variabilidad (P3) e interfaz montada antes de P4 |
| **Camilo** | Diseño y misiones; probador | **Ubicación y recorrido**: lugares, colisiones, cámaras, circuitos, mapa ([front-ubicacion.md](front-ubicacion.md)) | [diseno.md](diseno.md) | 10 min | NIVELES aprobado, base recorrible y prueba reportada |
| **José** | Agentes, CI, despliegue, video y formulario | **Integración y pantallas**: fases, motor, agentes y datos, montaje de todo ([front-integracion.md](front-integracion.md)) | [agentes-infra.md](agentes-infra.md) | 10 min | Ruta completa en escenarios fusionada en `develop` antes de P4 |
| **Claude (revisor)** | Revisa todo PR y mantiene el tablero | — | [revisor.md](revisor.md) | 15 min | P4 sin PRs pendientes |

**Antes de que nadie toque `ui/` en la rama de escenarios, María Paula sube su trabajo local** (tarea 1 de [ui.md](ui.md)).

## Prioridades del equipo

0. **Cumplir el reto de NASA:** [RETO.md](../referenciapau/RETO.md) dice qué falta y de quién es.
1. **Definir y aprobar todos los niveles:** [NIVELES.md](../referenciapau/NIVELES.md) §7 (diseño, motor, datos; aprueba Santiago).
2. **Nivel 1 (Jezero) jugable completo** en pantalla.
3. Motor multi-misión y huecos del tipo `Mision` (#152).
4. Niveles 2 a 5, uno por vez, cuando su código, su motor y su lámina estén listos.

Cómo se reparte el trabajo de ui y cómo se integra: [FLUJO.md](../referenciapau/FLUJO.md).

## Calendario (de `docs/ORQUESTACION.md`)

| Puerta | Cuándo | Cumple cuando |
| --- | --- | --- |
| P2 Rebanada vertical | sáb 14, 22:00 | Misión completa en Marte en pantalla, e2e de la semilla dorada en CI y desplegado |
| P3 Variabilidad | dom 15, 11:00 | Dos semillas distintas; 3D con respaldo 2D probado, o recortado a 2D |
| P4 Congelamiento | dom 15, 13:00 | Solo arreglos |
| P5 Entrega | dom 15, 20:00 | Formulario enviado (cierra 23:59) |

---

## Reglas comunes (todas las sesiones las cumplen)

### Lectura mínima
- Antes de la primera iteración: `CLAUDE.md` (raíz), el `CLAUDE.md` y el `ESTADO.md` de tu carpeta, `docs/LOOP.md` y **solo** los archivos o issues que nombra tu prompt.
- No se audita el repo entero. No se relee en cada iteración lo que ya está resumido en tu `ESTADO.md`.
- Dirección visual, escenas, mecánicas y mapa: **una sola fuente**, `docs/referenciapau/README.md`. Estilo y render: `docs/decisiones/D6-estilo-visual.md` (manda sobre cualquier mención a PixiJS en `PLAN.md`, `ORQUESTACION.md` o `D3`).
- Descartado, no se usa aunque aparezca en el historial o en otra rama: `docs/referencias/3d/`, atlas v2–v5 y v7, capibara, GLB, Blender, Drei, Rapier, Higgsfield, `polyfork.ts`.

### Loop
- Una iteración = **una** tarea pequeña y verificable, según `docs/LOOP.md`.
- Cada prompt trae su **META** (condición para parar). Cuando se cumple: detené el loop, escribí el cierre en `ESTADO.md` y avisá a María Paula.
- También se para el loop si: dos iteraciones seguidas sin avance (avisá con un issue o en `#bloqueos`), tokens en rojo, o la tarea necesita una decisión humana.
- Si no hay tarea disponible en una iteración, terminala sin hacer nada (no inventes trabajo).

### Modelos y esfuerzo

Verificado el 14 nov en este equipo: `claude` acepta `--model` (`fable`, `opus`, `sonnet`, `haiku`) y `--effort` (`low`, `medium`, `high`, `xhigh`, `max`); los subagentes de Claude Code reciben `model` y `effort` al lanzarlos (incluido `fable`); OpenCode lista `opencode/deepseek-v4.1-flash-free`; Codex fija el esfuerzo con `model_reasoning_effort`.

**Quién tiene qué** (dicho por María Paula, 14 nov): todos usan Claude Code con Fable, Opus, Sonnet y Haiku. **Solo Camilo tiene OpenCode** (DeepSeek V4.1 Flash). **Daniel tiene además Codex** con GPT-6.1.

**Criterio:** en el 3D, **Fable dirige y Opus escribe**: la sesión principal en Fable con esfuerzo `medium` decide, revisa contra la lámina y lanza subagentes Opus con esfuerzo `high` para las piezas maestras. En lo demás, Opus es la sesión principal y Fable se usa como subagente solo para lo más difícil.

| Persona | Sesión principal | Fable | Subagentes | Extra |
| --- | --- | --- | --- | --- |
| **Daniel** (escenario 3D y datos) | `claude --model fable --effort medium` | Es la sesión principal: dirige el 3D y revisa contra `mundo/01` | Opus `high` para terreno, cielo, kit y rendimiento; Sonnet `medium` para replicar familias aprobadas; Haiku `low` para búsquedas | Codex con GPT-6.1, `model_reasoning_effort="medium"`, para verificar geometría, rendimiento y cifras |
| **María Paula** (personajes 3D y aprobación) | `claude --model fable --effort medium` | Es la sesión principal: dirige y aprueba la fidelidad | Opus `high` para niño, Iris e Ingeniera; Sonnet `medium` para variantes; Haiku `low` | — |
| **María Paula** (seguimiento cada 30 min) | `claude --model sonnet --effort medium` | Fable `high` en una sesión corta solo para decidir un recorte o la puerta de P3 | Haiku `low` | — |
| **Jaime** (motor e interfaz) | `claude --model opus --effort high` | Subagente Fable `medium` para lo que define el sistema: tokens, `FacetButton` y `ResourcePlaque`, y el diseño del motor multi-misión (#152) | Sonnet `medium`, uno por componente; Haiku `low` | — |
| **José** (integración, agentes, infra, pitch) | `claude --model opus --effort medium` | Subagente Fable `high` solo para los contratos (FLUJO §3), el montaje final y depurar el e2e | Sonnet `medium` para CI y e2e; Haiku `low` para textos | — |
| **Camilo** (diseño, ubicación, pruebas) | `claude --model opus --effort medium` | — | Sonnet `medium` para navegación y mapa; Haiku `low` | **OpenCode** con DeepSeek V4.1 Flash (`opencode -m opencode/deepseek-v4.1-flash-free`) para lotes mecánicos sobre archivos que nadie más toca |
| **Santiago** (orquestación y fusión) | `claude --model fable --effort medium` | `high` solo para decidir un recorte | Haiku `low` para leer | — |
| **Revisor** (Claude) | `claude --model opus --effort medium` (`high` para `contracts/`, `engine/` o la integración) | — | Haiku `low` para la primera pasada de diffs grandes | — |

Reglas de uso:
- **Primero se sube el esfuerzo, después el modelo:** `medium` → `high` → `xhigh`; recién entonces Sonnet → Opus → Fable. Si un modelo falla dos veces en lo mismo, se sube un escalón; al terminar la tarea difícil, se baja.
- **Fable rinde con esfuerzo `medium`**: subirlo a `high` solo para la decisión o la pieza más difícil del día.
- **`max` nunca** sin el OK del orquestador (Santiago) o, en lo de ui y 3D, de la orquestadora del 3D.
- Máximo 2–3 subagentes a la vez, con **archivos disjuntos**. Decí cuántos y para qué antes de lanzarlos. Un subagente no lanza otros subagentes ni corre `/loop`.
- En `ESTADO.md`, una línea `Tokens: verde | amarillo | rojo` (equivale a los círculos de `docs/COMO-TRABAJAMOS.md`, sin emojis). En amarillo: solo tareas chicas y modelos livianos. En rojo: parar, dejar el traspaso escrito y avisar en `#bloqueos`.
- `docs/modelos.md` (de Santiago) tiene la escalera general; esta tabla la concreta para estos prompts. Si chocan, manda esta tabla y se avisa a Santiago.

### Git y PRs
- **Dos caminos, según lo que se toca:**
  - **Frontend v8** (lo de los briefs `front-*.md`): rama `feat/ui-<parte>-<tema>` desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` (la fusiona María Paula). `feat/ui-escenarios` vuelve a `develop` con un PR en los dos puntos de control, antes de P3 y antes de P4 (lo fusiona Santiago). Detalle: [FLUJO.md](../referenciapau/FLUJO.md) §2.
  - **Tareas de rol** (motor, diseño, datos, agentes, infra, docs): rama `feat/<slug>-<tema>` o `fix/<slug>-<tema>` desde `develop`, PR hacia `develop` (lo fusiona Santiago).
- `git fetch origin` y rebase sobre la rama base que corresponda (`origin/feat/ui-escenarios` u `origin/develop`) antes de cada tarea.
- **Commits atómicos:** un cambio lógico por commit, mensaje en español y convencional (`feat(ui): ...`, `fix(motor): ...`), **sin atribución a IA ni `Co-Authored-By`**.
- PRs de menos de ~300 líneas hacia su rama base, con la plantilla y, si cambia algo visible, la **ficha de fidelidad** de [FLUJO.md](../referenciapau/FLUJO.md) §7.1. Nunca merge, nunca push a `develop` ni `main`, nunca `--force`.
- Antes de cada PR, pegar la salida real de `npm run typecheck` y `npm test` (y `npm run build` si tocaste `ui/`).
- Solo se editan las carpetas del rol. Lo de otro rol se pide con issue `bloquea:<rol>`.
- Antes de editar, `git status`: puede haber cambios sin commitear de otra sesión en la misma carpeta. No los pises.
- `.claude/settings.json` niega `gh pr merge` a todas las sesiones. María Paula fusiona los PRs hacia `feat/ui-escenarios` desde la web de GitHub (squash), no desde la terminal.

### Skills

Se invocan con el comando de skills de Claude Code. Las del proyecto viven en `.claude/skills/` y llegan a todos con `git pull`.

| Skill | Cuándo | Quién |
| --- | --- | --- |
| `solar-shield-pr-visual` | Antes de abrir o actualizar un PR que cambia algo visible: lámina, captura con el mismo encuadre, ficha, números de la escena y puerta | Todo el frontend |
| `solar-shield-qa` | Antes de cualquier PR | Todos |
| `solar-shield-i18n` | Al crear o cambiar un texto visible | Todos |
| `solar-shield-handoff` | Al dejar o tomar trabajo de otra persona | Todos |
| `solar-shield-game-balance` | Al tocar costos, ticks o cifras de diseño | Camilo, Jaime |

**Opcionales, cada uno en su máquina** (revisadas el 14 nov: licencia MIT, repos con más de 3000 estrellas). Sirven como consulta; si chocan con `docs/referenciapau/`, manda `docs/referenciapau/`:
- Daniel y María Paula: `npx skills add cloudai-x/threejs-skills@threejs-geometry` y `@threejs-materials`. Están escritas para Three.js r183: verificá cada API contra `three@0.160` antes de usarla. Las reglas de rendimiento ya están resumidas en [APLICACION.md](../referenciapau/APLICACION.md) §8.1.
- Jaime: `npx skills add addyosmani/web-quality-skills@accessibility` para auditar teclado, foco y contraste.

**No se usan para decidir el aspecto:** skills de diseño generativo (`frontend-design`, `impeccable` y similares) proponen una estética propia y eso choca con "la referencia manda". Solo sirven para auditar accesibilidad o estados, nunca para elegir colores, fuentes, formas o disposición.

### Producto
- Niños de 7 a 12 años: frases cortas, nada inapropiado, personajes originales.
- Inglés primero, español segundo, ningún texto quemado.
- Todo dato NASA con fuente; nada "en vivo" si es estático. Nada de claves en el código.
- El modelo de IA clasifica en JSON estricto y el código responde. Nunca inventa números.

### Sin emojis
En código, commits, PRs, `ESTADO.md` y documentación.
