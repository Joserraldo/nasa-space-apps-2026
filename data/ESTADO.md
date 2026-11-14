# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Abiertos:** #95, #126 y #136 (sobre develop) · issue #137 para ui · Fusionados: #55, #65, #69, #104, #116, #122, #123, #125, #133
## Hecho
- #116, #122, #123, #125 y #133 fusionados; #95 y #126 rebasados sobre develop (80 y 84 ✓, repo 300 ✓).
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #116 (sobre develop): fuentes InSight, agua ISS y bit flips con `fuenteAprobada()`; cierra #91 y #93. De #104 quedan 2 textos por cambiar (plantas → OSD-772, escudo → RAD).
- #122 raspado completo y auditado (Sonnet + API en vivo; correos personales ocultos). #123: 6 tarjetas (OSDR y CSA).
- #126 polo sur: 6 cráteres, sombra permanente LOLA (Mazarico 2011, aprox. 667 m/px); texto de hielo apagado (capa sin cita). #136: resto de `dueno` en inglés.
- #137: issue a ui con código para mostrar datos usados, medición en Marte, 9 tarjetas y retraso (el reto lo pide).
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Luz y visibilidad de la Tierra del polo sur: NASA PGDA (pgda.gsfc.nasa.gov/products/69) las tiene, pero está fuera de la lista oficial: pedir OK a Daniel.
## Bloqueos / no verificado
- El modo auto no deja cerrar issues ni quitar las 4 worktrees `.claude/worktrees/agent-*` (limpias, sin node_modules): las quita Daniel.
Tokens: 🟡
