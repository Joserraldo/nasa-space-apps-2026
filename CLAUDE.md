# Reglas para todos los agentes

## FASE ACTUAL: 0 — PREPARACIÓN (solo documentos)
> Este interruptor lo cambia un humano el día que arranca el hackathon.
> Mientras diga **FASE 0**: NO escribas código del juego, ni assets finales, ni mecánicas. Solo investigación, documentos y decisiones en `docs/`.
> Cuando diga **FASE 1+**: sigue las tareas de tu `CLAUDE.md` de carpeta.

## Antes de cualquier tarea
1. Lee `PLAN.md`, este archivo, el `CLAUDE.md` de tu carpeta y `contracts/`.
2. Lee el `ESTADO.md` de tu carpeta (lo que hiciste en el loop anterior).
3. Revisa tus issues: `gh issue list --label "rol:<tu rol>" --state open`.

## Límites
- Solo edita las carpetas de tu rol (ver `.github/CODEOWNERS` y la tabla del README). Si necesitas algo de otra carpeta, abre un issue con `bloquea:<rol>` y sigue con otra tarea.
- No cambies `contracts/` sin un issue `contrato` aprobado por los dueños afectados.
- Excepción: puedes crear tu archivo en `docs/ideas/` y proponer decisiones en `docs/decisiones/`.

## Git
- Trabaja en ramas `feat/<slug>-<tema>` o `fix/<slug>-<tema>` creadas desde `develop`.
- Commits pequeños y descriptivos en español. Sin líneas `Co-Authored-By` ni atribución a IA.
- Antes de empezar cada loop: `git fetch origin && git rebase origin/develop` (si hay conflicto fuera de tu carpeta, para y avisa a tu humano).
- PRs pequeños (< ~300 líneas) hacia `develop`, usando la plantilla. **Nunca hagas merge, nunca empujes a `main` ni a `develop`.** El merge lo hace un humano.

## Producto
- Público: niños de 7 a 12 años. Lenguaje simple, tono de ciencia divertida, nada grosero ni inapropiado.
- Nada de personajes, nombres o estética de franquicias existentes (ni Jarvis, ni Rick and Morty, etc.).
- Bilingüe español/inglés desde el día 1: ningún texto visible quemado en el código, todo pasa por i18n.
- Todo dato de NASA lleva su fuente citada. Si es estático, no se presenta como "en vivo".
- Nada de claves en el código ni en el navegador. Variables de entorno; el modelo se llama solo desde serverless.
- No se guarda audio de menores. Se transcribe y se descarta.
- El modelo de IA nunca inventa números ni ve el estado completo: clasifica en JSON estricto y el experto (código) responde.

## Al terminar cada loop
- Actualiza el `ESTADO.md` de tu carpeta: qué hiciste, qué sigue, qué te bloquea (máx. 15 líneas, lo viejo se borra).
- Commit + push de tu rama. Si hay algo revisable, abre o actualiza tu PR.
