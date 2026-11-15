# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Abiertos:** #95, #126, #147, #148 (sobre develop) · issue #137 para ui · #136 fusionado
## Hecho
- #116, #122, #123, #125 y #133 fusionados; #95 y #126 rebasados sobre develop (80 y 84 ✓, repo 300 ✓).
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #116 (sobre develop): fuentes InSight, agua ISS y bit flips con `fuenteAprobada()`; cierra #91 y #93. De #104 quedan 2 textos por cambiar (plantas → OSD-772, escudo → RAD).
- #122 raspado completo y auditado (Sonnet + API en vivo; correos personales ocultos). #123: 6 tarjetas (OSDR y CSA).
- #126 polo sur: 6 cráteres, sombra permanente LOLA (Mazarico 2011, aprox. 667 m/px); texto de hielo apagado (capa sin cita). #136: resto de `dueno` en inglés.
- #147: luz del Sol en los sitios Apolo por tormenta de 2024 (SVS 5187); el 20 may fue de DÍA (avisado en #100). #148: terreno real de Marte polo norte (MOLA polar, 4 sitios).
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Polo sur (#126): luz del Sol y de la Tierra con NASA PGDA (aprobada por Daniel, Mazarico 2011). Blindaje natural con PGDA SKYV. Pendiente: verificar la capa de hielo (texto apagado).
## Bloqueos / no verificado
- El modo auto no deja cerrar issues ni quitar las 4 worktrees `.claude/worktrees/agent-*` (limpias, sin node_modules): las quita Daniel.
Tokens: 🟡
