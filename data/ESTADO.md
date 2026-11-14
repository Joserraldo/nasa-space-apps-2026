# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Pila (orden de merge):** #65 → #69 → #95 · #55 y #104 fusionados · abiertos #97–#100
## Hecho
- #104 fusionado; pila rebasada sobre develop (FASE 1): #65 → #69 → #95, cada PR sobre el anterior. Pruebas `data` 61/62/69 ✓, repo 273 ✓, tsc ✓.
- #104 (#93) dejó: 2 tarjetas piden cambiar el texto (plantas → OSD-772, escudo → RAD) y 3 esperan aprobación de la fuente.
- #65: retraso Marte–Tierra 3,0–22,3 min [V+cálculo]. #69: fuenteTerreno() para el aterrizaje; el script de descarga lee .env.local.
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #97–#100: propuestas de las 4 misiones nuevas en `docs/ideas/`, revisadas por OpenCode.
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Si Daniel aprueba las fuentes de NASA fuera de la lista: crear las `fuente.*` y cerrar #91 y #93.
## Bloqueos / no verificado
- Esperando a Daniel: fuentes fuera de la lista (JPL InSight, agua ISS, bit flips, Moon Trek, SVS).
Tokens: 🟡
