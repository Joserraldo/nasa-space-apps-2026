# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Pila (orden de merge):** #69 → #95 · #55, #104 y #65 fusionados · abiertos #97–#100, #116, #122 y #123
## Hecho
- #65 fusionado (17:05); #69 y #95 rebasados sobre develop. Pruebas `data` 62/69 ✓, tsc ✓.
- #65 (en develop): retraso Marte–Tierra 3,0–22,3 min [V+cálculo]. #69: fuenteTerreno() para el aterrizaje; el script de descarga lee .env.local.
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #116 (sobre develop): fuentes InSight, agua ISS y bit flips con `fuenteAprobada()`; cierra #91 y #93. De #104 quedan 2 textos por cambiar (plantas → OSD-772, escudo → RAD).
- #122: raspado completo de los 8 recursos oficiales (16 APIs de api.nasa.gov, 702 estudios OSDR, CSA). #123: 6 tarjetas nuevas (4 OSDR, 2 CSA) con `fuente.csa`.
- #97–#100: propuestas de las 4 misiones nuevas en `docs/ideas/`, revisadas por OpenCode.
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Moon Trek, SVS 5187, USGS y science.nasa.gov ya están aprobadas: crear sus `fuente.*` cuando diseño apruebe #97–#100.
## Bloqueos / no verificado
- El modo auto no deja cerrar issues ni quitar las 4 worktrees `.claude/worktrees/agent-*` (limpias, sin node_modules): las quita Daniel.
Tokens: 🟡
