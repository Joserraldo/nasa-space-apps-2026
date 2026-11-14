# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Pila (orden de merge):** #65 → #69 → #95 · #55 y #104 fusionados · abiertos #97–#100, #116 y #122
## Hecho
- #104 fusionado; pila rebasada sobre develop (FASE 1): #65 → #69 → #95, cada PR sobre el anterior. Pruebas `data` 61/62/69 ✓, repo 273 ✓, tsc ✓.
- #104 (#93) dejó: 2 tarjetas piden cambiar el texto (plantas → OSD-772, escudo → RAD); las otras 3 ya tienen fuente en #116.
- #65: retraso Marte–Tierra 3,0–22,3 min [V+cálculo]. #69: fuenteTerreno() para el aterrizaje; el script de descarga lee .env.local.
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #116 (aparte, sobre develop): fuentes aprobadas por Daniel (InSight, agua ISS, bit flips) con `fuenteAprobada()`; cierra #91 y #93.
- #122: copia de los 8 recursos oficiales (Scrapling, solo HTTP, y Chrome) + `recursos-raspados.md`. Mars Rover API archivada; Moon Trek está en api.nasa.gov.
- #97–#100: propuestas de las 4 misiones nuevas en `docs/ideas/`, revisadas por OpenCode.
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Moon Trek, SVS 5187, USGS y science.nasa.gov ya están aprobadas: crear sus `fuente.*` cuando diseño apruebe #97–#100.
## Bloqueos / no verificado
- Ninguno. #116 y #95 tocan secciones distintas de `fuentes.md` (§0c y otras).
Tokens: 🟡
