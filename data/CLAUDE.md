# Rol 4: Datos NASA y ciencia
**Humano responsable:** Daniel (`Daniverd15`) y Jaime (`JaimeMrF`)
**Slug de ramas:** `datos` → `feat/datos-<tema>`
**Etiqueta de issues:** `rol:datos`
**Posees:** `/data`, `/docs/science`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** —
**Contratos que produces:** `SpaceWeatherEvent` (co-dueño de `/contracts`), mocks JSON, tarjetas de fuente
**Definición de "hecho":** Todo dato tiene fuente y fecha; mocks con la forma exacta del contrato; respaldo offline listo.

## Plan por puertas (ajustado el 13 nov con ORQUESTACION, criterios y los CLAUDE.md de motor, agentes y ui)

**Hecho clave:** la rebanada vertical es en **Marte (Jezero)**. El Kp de DONKI mide la Tierra, no Marte. Lo que DONKI sí dice de Marte sale de las simulaciones WSA-ENLIL (`impactList` con `Mars`), que son un modelo y no una medición [V]. Por eso cada evento lleva `marcoMarte`: observado | modelado | escenario.

**P1 (sáb 12:00): que nadie me espere**
1. Contrato `SpaceWeatherEvent` v0.2 (#15) aprobado por motor y agentes, y movido a `/contracts`. Cambios: `observedAt` por fase, `marcoMarte` (observado = RAD lo midió | modelado = ENLIL | escenario), `offsetHours` calculado por código, `SourceCard` exportada aparte y con `owner`.
2. Mocks v0.2 en `data/mock`: 3 tormentas, más 1 tarjeta de terreno y 1 de dosis, para que ui pinte tarjetas desde la hora 1.
3. ✅ 8 tormentas [V] curadas (PR #23 y #26). Ruta dorada: 2024-05-20, medida en Marte por RAD (×19,4).

**P2 (sáb 22:00): datos de la ruta dorada**
4. Script `data/scripts/donki.ts` (Node, clave por variable de entorno, ventanas ≤30 días) que guarda lo crudo en `data/raw` y lo normalizado en `data/curated/*.json`, validado con Zod. Más `data/curated/index.json` en orden fijo, para que el motor sortee por semilla.
5. Tormenta de la ruta dorada (paso 5) curada, con ID y fecha a la vista.
6. Jezero (pasos 2–3): Mars Trek, imagen + elevación/pendiente/sombreado, con 90 min de tope; si no sale, plan B. Los 3 sitios con 3 criterios salen como datos y se marcan "derivado por el equipo".
7. Dosis en Marte para la Doctora (pasos 6–7): RAD/Curiosity 0,64 mSv/día [V resumen]. Abrir el artículo para la cita completa. Solo mSv.
8. Tarjetas de fuente es/en para los pasos 2, 3, 5, 7 y 8. Glosario para niños en `docs/science/glosario.md`.

**P3 (dom 11:00): variabilidad**
9. Catálogo de 4–6 tormentas (#8 → `docs/decisiones/D8-tormentas.md`), regiones extra de Marte, tarjetas OSDR con ID de estudio.
10. Texto "Datos de NASA usados y por qué" para "Qué aprendimos hoy" y para el formulario.

**P4 (dom 13:00): auditoría**
11. Prueba que recorre `data/curated`: todo dato visible tiene fuente, `retrievedAt`, etiqueta y dueño. El de la Luna (Chang'e-4) se marca CNSA. Sin logo de NASA.

**Si P2 se atrasa, se corta en este orden:** Luna (dosis Chang'e-4) → regiones extra → OSDR. Nunca se corta la tormenta [V] ni las tarjetas de la ruta dorada.

## Qué espera cada rol de mí
- **motor:** eventos con horas relativas (`offsetHours`) y valores crudos (clase, km/s, Kp). La severidad la deriva el motor. Catálogo en orden fijo para sortear por semilla.
- **agentes:** la Meteoróloga lee las `phases` y la Doctora lee la dosis de referencia. Necesitan plantillas que no prometan efectos en Marte que no se observaron. Reviso la ciencia de sus textos.
- **ui:** `SourceCard` uniforme (tormenta, terreno, dosis), etiqueta "datos reales curados, no en vivo" y mocks desde la hora 1.
- **mecanicas:** la tormenta de la semilla dorada fija, para el e2e.
- **infra:** revisión cruzada de mis PR. Lista de fuentes para el formulario y para `docs/ia-uso.md`.

## Notas / decisiones que afectan este rol
- Humano: Daniel (`Daniverd15`). Revisión cruzada con infra.
- FLR no funciona en api.nasa.gov (404): usar `ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` [V].
- Antes de usar una fuente que no esté en la lista oficial del reto (ej. Mars Trek), preguntarle a Daniel.
