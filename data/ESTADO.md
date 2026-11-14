# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Abiertos:** #95 y #126 (ambos sobre develop) · Fusionados: #55, #65, #69, #104, #116, #122, #123, #125, #133
## Hecho
- #116, #122, #123, #125 y #133 fusionados; #95 y #126 rebasados sobre develop (80 y 84 ✓, repo 300 ✓).
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #116 (sobre develop): fuentes InSight, agua ISS y bit flips con `fuenteAprobada()`; cierra #91 y #93. De #104 quedan 2 textos por cambiar (plantas → OSD-772, escudo → RAD).
- #122 raspado completo y auditado (Sonnet + API en vivo; correos personales ocultos). #123: 6 tarjetas (OSDR y CSA).
- #125/#126: terreno lunar de Moon Trek (3 sitios Apolo y 6 cráteres del polo sur), comprobado con `identify`. Luz y blindaje en null.
- #133: `dueno` de tormentas y mocks en inglés (salía español en la tarjeta, aviso del trailer #130). Revisé la ciencia de #127–#131 (agentes).
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Falta luz (SVS 5187) y hielo (capas PSR de Moon Trek) para la Luna; Marte polo norte (#97) sin DEM. Diseño elige misión de #97–#100.
## Bloqueos / no verificado
- El modo auto no deja cerrar issues ni quitar las 4 worktrees `.claude/worktrees/agent-*` (limpias, sin node_modules): las quita Daniel.
Tokens: 🟡
