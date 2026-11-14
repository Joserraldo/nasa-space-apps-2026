# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-luna-crater · **Pila (orden de merge):** #104 → #65 → #69 → #95 · #55 fusionado · abiertos #97–#100
## Hecho
- Pila rebasada sobre develop en el orden de kcitas: cada PR va sobre el anterior y ya no chocan en `ESTADO.md` ni en `fuentes.md`.
- #104 (#93): fuente de cada tarjeta de ciencia de Jezero. 2 piden cambiar el texto (plantas → OSD-772, escudo → RAD) y 3 esperan aprobación de la fuente.
- #65: retraso Marte–Tierra 3,0–22,3 min [V+cálculo]. #69: fuenteTerreno() para el aterrizaje; el script de descarga lee .env.local.
- #95: Luna con CRaTER (Gannon ×206,3, en órbita), constantes de ARES [V], dosis del viaje a Marte 1,84 mSv/día. Revisado por Codex.
- #97–#100: propuestas de las 4 misiones nuevas en `docs/ideas/`, revisadas por OpenCode.
## Qué sigue
- Cuando Santiago fusione uno, rebasar el siguiente sobre develop (`git rebase --onto origin/develop <rama de abajo>`).
- Si Daniel aprueba las fuentes de NASA fuera de la lista: crear las `fuente.*` y cerrar #91 y #93.
## Bloqueos / no verificado
- Esperando a Daniel: fuentes fuera de la lista (JPL InSight, agua ISS, bit flips, Moon Trek, SVS).
Tokens: 🟡
