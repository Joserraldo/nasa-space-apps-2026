# D7 — Nombres y diseño de los tripulantes
**Dueño:** diseño (Camilo) y ui (María Paula) · **Fecha:** 14 nov 2026 · **Estado:** propuesta (la confirma Santiago al fusionar)

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| Nombres propios para cada experta | Más cercanía | Hay que inventarlos, traducirlos y probarlos; el código ya usa títulos de rol |
| **Llamarlas por su rol** (la Ingeniera, la Doctora de radiación, la Meteoróloga solar, el Matemático) | Ya está así en `agents/i18n` (`agentes.titulo.*`); claro para niños; igual en EN y ES | Menos "personaje" |

## Elegida
**Por su rol, sin nombres propios.** Diseño visual de cada una: fichas de [`docs/referenciapau/DISEÑO.md`](../referenciapau/DISEÑO.md) §4 (Ingeniera: cabello castaño rojizo, acento naranja; Doctora: piel morena, gafas octagonales, acento teal, escudo; Meteoróloga: cabello plateado, acento ciruela, Sol). Personalidad: [`HISTORIA.md`](../referenciapau/HISTORIA.md) §2, a partir de `docs/ideas/agentes.md` §6. Personas en 3D en el mundo y retrato de la misma identidad en el diálogo ([D6](D6-estilo-visual.md)).

## Por qué
- No cambia código: los títulos ya existen en inglés y español.
- Las identidades visuales ya están definidas en las láminas.
- Personajes originales, sin parecerse a franquicias existentes.

## Consecuencias para cada rol
- **agentes:** sigue con `agentes.titulo.*` y `agentes.nombre.*`; no inventa nombres.
- **ui:** retratos y modelos según DISEÑO §4.
- **diseño:** el Matemático todavía no tiene lámina; hasta tenerla se usa un retrato neutro de la familia de trajes.
