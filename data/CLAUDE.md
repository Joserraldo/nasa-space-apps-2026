# Rol 4: Datos NASA y ciencia
**Humano responsable:** _por asignar_
**Slug de ramas:** `datos` → `feat/datos-<tema>`
**Etiqueta de issues:** `rol:datos`
**Posees:** `/data`, `/docs/science`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** —
**Contratos que produces:** `SpaceWeatherEvent` (co-dueño de `/contracts`), mocks JSON, tarjetas de fuente
**Definición de "hecho":** Todo dato tiene fuente y fecha; mocks con la forma exacta del contrato; respaldo offline listo.

## Fase 0 (ahora, solo documentos — nada de código del juego)
- Sacar API key de api.nasa.gov (guardarla en `.env.local`, nunca en git).
- Leer docs de DONKI y OSDR; listar 10 tormentas solares históricas candidatas (D8).
- Entregable: `docs/science/fuentes.md` (ya hay un borrador).

## Tareas de arranque (Fase 1, el día que empieza el hackathon)
1. Contrato `SpaceWeatherEvent` — issue `contrato`.
2. **Mocks el primer día** en `/data/mock` para que todos construyan contra ellos.
3. Script de pipeline DONKI → `/data/curated/*.json` (respaldo offline, no en vivo en la demo).
4. Tarjetas de fuente (es/en) por evento: qué pasó, fecha, instrumento, link.
5. Glosario para niños en `/docs/science/glosario.md`; verificación científica de los textos de los expertos.
6. El 13 de noviembre: cambiar el origen de mocks a datos reales.

## Notas / decisiones que afectan este rol
- _(vacío)_
