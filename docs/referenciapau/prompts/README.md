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

## Loops (`/loop 15m`)

Cada persona corre su loop en su propia sesión de Claude Code, con este README ya en `develop`. El loop
repite las reglas críticas; estas son las completas, para cada iteración.

### Antes de empezar
1. `git fetch origin`. Si seguís una tarea, `git rebase origin/develop` en tu rama. Si hay conflicto en
   archivos que no son de tu frente, pará y avisá a tu humano sin resolverlo.
2. Leé tu prompt y tu estado, `docs/referenciapau/estado/frente-<letra>.md` (creálo la primera vez).
3. `gh pr list --author @me --state open`: si un PR tuyo tiene CI en rojo o pedidos de cambio, la iteración
   es para eso y nada más.

### Elegir la tarea
4. La siguiente pendiente de tu prompt, en orden. Comprobá que nadie la tomó:
   `gh pr list --state all --limit 100 --json number,title,state --jq '.[] | select(.title | startswith("<ID> "))'`
5. Si espera a otra (§5 del plan), comprobá que esa esté fusionada en `develop`. Si no: solo lo de la columna
   "mientras tanto", y el PR en borrador con `Depende de #N`.
6. Una tarea por iteración y por PR.

### Trabajar
7. Rama `feat/frente-<letra>-<ID>-<tema>` desde `origin/develop`.
8. Solo los archivos de tu frente (§3 del plan). Si necesitás otro: issue `[bloquea frente <X>] <ID> ...` y
   seguís con otra cosa. `frontera.ts` y `EscenaBase.tsx` solo los edita el Frente A.
9. No borres, saltees ni debilites pruebas para que pasen. Si una prueba cambia, explicá por qué en el PR.
10. El motor manda (nada que se camine, salte, abra o anime da o quita recursos). Ningún dato de Marte sin
    fuente: si no la verificaste, `[NV]`. Textos por i18n, inglés primero, frases cortas para 7 a 10 años.
    Sin GLB ni librerías nuevas; ≤ 80 draw calls y ≤ 80 000 triángulos por vista. Teclado, foco visible,
    movimiento reducido y áreas de 44 px (48 px en los controles del juego).

### Verificar
11. `npm run typecheck && npx vitest run && npm run build -w ui`.
12. Si tocaste la UI o el flujo: servidor en el 5210 y `E2E_BASE_URL=http://localhost:5210 npx playwright test`.
    Las e2e nuevas usan `arrancarEnCalidadBaja` (`tests/e2e/calidad.ts`) y pausan el reloj antes de caminar:
    CI no tiene GPU.
13. Si se ve: capturas antes y después en 1440x900, 1024x683, 844x390 y 390x844
    (`node tests/capturas/capturar.mjs ui/capturas/<ID> http://localhost:5210`), junto a su lámina. Aprueba
    el Frente F, nunca quien hizo el cambio.
14. Abrí el juego y probá la tarea: que las pruebas pasen no significa que se juegue.

### Cerrar
15. Commits chicos en español, convencionales, sin `Co-Authored-By`, sin atribución a IA y sin emojis.
16. PR hacia `develop` con la plantilla, título `<ID> <descripción>`, menos de ~300 líneas (si es más,
    partí la tarea). Nunca empujes a `develop` (despliega la vista previa) ni a `main` (despliega
    producción). Ningún agente fusiona: fusiona Santiago.
17. Actualizá tu estado (máximo 15 líneas: hecho, sigue, bloqueado; lo viejo se borra) y comentá en el PR:
    VERIFICADO (comando y resultado), NO VERIFICADO y REQUIERE INTERVENCIÓN.

### Cuándo parar
18. Al cumplir el "Hecho cuando" de la tarea, con evidencia.
19. Si tenés un PR esperando revisión y no hay nada que avanzar sin él: "esperando revisión", sin abrir otro.
20. Tres iteraciones seguidas sin avanzar la misma tarea: issue de bloqueo y pasás a la siguiente.
21. Sin tareas posibles: "sin tareas disponibles". No se inventa trabajo: una iteración sin commit,
    comentario ni issue no es avance.

**Estado por frente.** El `CLAUDE.md` pide actualizar el `ESTADO.md` de tu carpeta en cada loop, pero cinco
frentes trabajan en `ui/` y ese archivo tendría cinco escritores. Cada frente escribe el suyo en
`docs/referenciapau/estado/frente-<letra>.md`; `ui/ESTADO.md` queda para el Frente E.

**Rama base.** La excepción de `feat/ui-escenarios` del `CLAUDE.md` es para los briefs
`docs/prompts/front-*.md`. Estos frentes trabajan siempre contra `develop`.
