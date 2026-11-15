# Protocolo de una iteración del loop (10 min)

Cada vez que el loop dispara, el agente hace **una** iteración, así:

1. **Ubícate.** Lee la FASE en `CLAUDE.md`. Lee el `ESTADO.md` de tu carpeta. Confirma que estás en tu rama `feat/<slug>-*` (si estás en `main` o `develop`, para y avisa).
2. **Sincroniza.** `git fetch origin && git rebase origin/<base>`, donde `<base>` es `feat/ui-escenarios` si la tarea es del frontend v8 (`docs/prompts/front-*.md`) y `develop` en todo lo demás. Si hay conflicto fuera de tu carpeta: aborta el rebase (`git rebase --abort`), escribe el problema en `ESTADO.md` y termina la iteración.
3. **Elige UNA tarea**, en este orden:
   1. Comentarios de revisión pendientes en tu PR abierto (`gh pr view --comments`).
   2. Issues `bloquea:<tu rol>` (alguien te espera).
   3. Tu issue `rol:<tu rol>` de mayor prioridad (`p0` > `p1` > `p2`).
   4. Lo que dice "Qué sigue" en tu `ESTADO.md`.
4. **Haz un avance pequeño y verificable** (lo que quepa en ~10 min). Solo en tus carpetas. Si te falta algo de otro rol, abre issue `bloquea:<rol>` y usa un mock.
5. **Verifica.** Corre las pruebas/lint de tu carpeta si existen. No dejes la rama rota.
6. **Registra.** Actualiza `ESTADO.md` (formato abajo): lo del frontend v8 va en **tu sección** de `ui/ESTADO.md`, dentro de tu PR hacia `feat/ui-escenarios`; lo de tu rol va en el `ESTADO.md` de tu carpeta, en `develop`. Commit con mensaje claro. `git push -u origin HEAD`.
7. **PR.** Si hay algo revisable y no hay PR: `gh pr create --base <base> --fill` (la misma `<base>` del paso 2) y ajusta la plantilla. Si cambia algo visible, completa la ficha de fidelidad con la skill `solar-shield-pr-visual`. Si ya existe, solo empuja.
8. **Resume** en la terminal en 3 líneas: qué hiciste, qué sigue, si hay bloqueo.

Nunca: merge, push a `main`/`develop`, `--force`, editar `contracts/` sin issue aprobado, tocar carpetas ajenas.

## Formato de `ESTADO.md`

```markdown
# Estado — <rol>
**Actualizado:** <fecha hora> · **Rama:** feat/<slug>-<tema> · **PR:** #<n o ninguno>

## Hecho (últimas iteraciones)
- ...

## Qué sigue
- ...

## Bloqueos
- ninguno | issue #<n> espera a <rol>
```
