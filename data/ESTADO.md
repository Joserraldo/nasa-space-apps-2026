# Estado — datos
**Actualizado:** 2026-11-13 · **Rama:** feat/datos-referencia-dosis · **PR:** #45 (referenciaDosis + import del contrato) · #34–#40 entraron con #46
## Hecho
- 8 tormentas DONKI + RAD. Ruta dorada 2024-05-20, medida en Marte (×19,4). Jezero (Trek), dosis [V], 3 tarjetas OSDR, glosario, auditoría.
- Artemis I (HERA, RadLab): resumen y tarjeta es/en (el enunciado oficial pide datos de Artemis).
- Contrato v0.2.0 (#29) con los opcionales de datos: espejo eliminado, data/ reexporta /contracts.
## Qué sigue
- P3 `marte_polo_norte`: plan B hecho (tarjeta de luz por latitud, sin mapa). Opcional: Gale (equirectangular, sí exporta).
- Revisión científica de los textos de agentes: hecha (#40). Agentes ya la aplicó (#44, #47). Falta integrar referenciaDosis() (#45).
## Bloqueos / no verificado
- #28 resuelto por #46: data es workspace y está en CI. El motor ya puede importar @solar-shield/data. Mars Rover Photos caído. RAD sin datos en oct 2024.
Tokens: 🟡
