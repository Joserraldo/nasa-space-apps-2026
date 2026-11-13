# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 14:15 · **Rama:** feat/motor-orbita · **PR:** #21 (escenario) → #29 (contratos v0.2) → PR órbita

## Hecho (últimas iteraciones)
- Contratos v0.2.0 (#29) con opcionales de datos y ClassifierOutput de agentes; respondido en #17.
- #21 fusionado con develop sin conflictos, CI en verde.
- Órbita por tick: sol/sombra y batería, franja y señal por altura, desgaste de escudo por tormenta, arrastre en órbita baja; `ajustar_orbita` mueve la altura.
- Daño en Marte: si RAD lo midió (`medicionMarte.factor`) manda la medición; si no, `intensidad`.
- Puntaje de sitio con 3 criterios (plano, luz, blindaje) ponderados por objetivo; rangos i18n. 39 tests en verde.

## Qué sigue
- P3: niveles adaptativos de la IA de la base por reglas del estado; reto del día por fecha; regiones extra por semilla.
- Conectar `eventosCurados` de @solar-shield/data cuando #23 entre.

## Bloqueos
- OK de agentes en #17. Pesos de sitio y números de órbita son borrador para que diseño los revise.

Tokens: 🟢
