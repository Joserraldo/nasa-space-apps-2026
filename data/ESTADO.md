# Estado — datos
**Actualizado:** 2026-11-13 · **Rama:** feat/datos-referencia-dosis · **PR:** #34 → #35 → #37 → #39 → referenciaDosis (apilados) · #16 #19 #23 #25 #26 #27 fusionados
## Hecho
- 8 tormentas DONKI + RAD. Ruta dorada 2024-05-20, medida en Marte (×19,4). Jezero (Trek), dosis [V], 3 tarjetas OSDR, glosario, auditoría.
- Artemis I (HERA, RadLab): resumen y tarjeta es/en (el enunciado oficial pide datos de Artemis).
- Contrato v0.2.0 (#29) con los opcionales de datos: espejo eliminado, data/ reexporta /contracts.
## Qué sigue
- P3 `marte_polo_norte`: plan B hecho (tarjeta de luz por latitud, sin mapa). Opcional: Gale (equirectangular, sí exporta).
- Revisión científica de los textos de agentes: hecha (#40). Agentes ya la aplicó (#44). Falta solo integrar referenciaDosis().
## Bloqueos / no verificado
- #28: diff de raíz ya probado (109 tests en verde con data como workspace); falta que infra lo aplique. El motor espera esto para usar eventosCurados. Mars Rover Photos caído. RAD sin datos en oct 2024.
Tokens: 🟡
