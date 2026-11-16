# Prompts por frente

Cada archivo es el encargo para el agente de Claude Code de una persona. Se pega entero al empezar la
sesión, desde la raíz del repo y con `develop` actualizado. El detalle de cada tarea está en
[`../PLAN-JUGABILIDAD.md`](../PLAN-JUGABILIDAD.md) §4; las dependencias, en §5.

| Frente | Persona | Prompt |
| --- | --- | --- |
| A — misiones, mecánicas, movimiento y animación | José | [frente-a-jose.md](frente-a-jose.md) |
| B — tripulación viva, IA y jugador de prueba | (nombre) | [frente-b-tripulacion.md](frente-b-tripulacion.md) |
| C — mapa, distribución del escenario y navegación | (nombre) | [frente-c-mapa-escenario.md](frente-c-mapa-escenario.md) |
| D — mallas, luz, día, detalle y rendimiento | Daniel | [frente-d-mallas-luz.md](frente-d-mallas-luz.md) |
| E — UI de flujo, tarjetas, HUD y menú | Santiago | [frente-e-santiago.md](frente-e-santiago.md) |
| F — UI visual, retratos B y fidelidad | María Paula | [frente-f-maria-paula.md](frente-f-maria-paula.md) |

**Para todos, antes de pegar el prompt:**

```bash
git fetch origin
git switch -c feat/<slug>-<tema> origin/develop   # una rama por tarea
npm ci
npm run typecheck && npx vitest run && npm run build -w ui
```

Si algo de eso falla en `develop` antes de tocar nada, se avisa en el canal del equipo: no es tu cambio.

**Reglas que van con cualquier prompt, también cuando corre en bucle (`/loop`):**
- Una tarea por iteración, y solo la que sigue en tu tabla. Al cumplir "Hecho cuando", parar.
- Nunca empujar a `develop` ni a `main`: despliegan en producción. Se empuja a tu rama y se abre el PR como
  borrador hacia `develop`.
- Si una tarea espera a otra (§5 del plan), no se inventa lo que falta: se usa la columna "mientras tanto" o
  se abre un issue `[bloquea <frente>]`.
- Sin emojis y sin líneas de atribución en commits ni PR.
