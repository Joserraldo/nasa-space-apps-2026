# Miguel Miguel Miguel Miguel Phonk 🗣️🗣️


# NASA Space Apps 2026 — Junior Astronaut Mission Trainer

> Un juego web donde un niño de 7 a 12 años dirige una base en la Luna o en Marte, habla con una **tripulación de expertos** y sobrevive a **tormentas solares reales** de NASA.

**Estado:** 🟡 Fase 0 — Preparación. **Todavía no hay código del juego** (regla del reto: no se construye antes del inicio del hackathon). Ver [docs/reglas.md](docs/reglas.md).

| Fecha | Qué pasa |
|---|---|
| hoy → 13 nov | Fase 0: equipo, ideas, decisiones D1-D11 (solo docs) |
| 13 nov | NASA publica datasets por reto y guía de entrega |
| **14 nov** | Arranca el hackathon → Fase 1 ([guía de agentes](docs/GUIA-AGENTES.md)) |
| **15 nov 23:59** (hora local) | Cierra la entrega |

## Empieza aquí

| Si eres... | Lee |
|---|---|
| Cualquiera del equipo | [PLAN.md](PLAN.md) — el plan completo |
| Vas a configurar tu agente | [docs/GUIA-AGENTES.md](docs/GUIA-AGENTES.md) — paso a paso del día 1 y los loops de 10 min |
| Tu agente | [CLAUDE.md](CLAUDE.md) + el `CLAUDE.md` de tu carpeta |
| Vas a proponer algo | [docs/ideas/](docs/ideas/) y [docs/decisiones/](docs/decisiones/) |

## Roles y carpetas

| # | Rol | Slug (ramas) | Carpetas | Persona |
|---|---|---|---|---|
| 1 | Diseño de juego y misiones | `diseno` | [design/](design/), [missions/](missions/) | _por asignar_ |
| 2 | Motor y simulación | `motor` | [engine/](engine/) | _por asignar_ |
| 3 | Agentes expertos | `agentes` | [agents/](agents/) | _por asignar_ |
| 4 | Datos NASA y ciencia | `datos` | [data/](data/), [docs/science/](docs/science/) | _por asignar_ |
| 5 | Frontend, voz, arte y accesibilidad | `ui` | [ui/](ui/), [assets/](assets/) | _por asignar_ |
| 6 | Integración, QA, despliegue y pitch | `infra` | [infra/](infra/), [tests/e2e/](tests/e2e/), [pitch/](pitch/), [.github/](.github/) | _por asignar_ |

Compartido: [contracts/](contracts/) (dueños: roles 2, 3 y 4).

## Flujo de trabajo (resumen)

```
main      ← protegida, solo lo que se demuestra
develop   ← integración, recibe PRs
feat/<slug>-<tema>   ej: feat/agentes-clasificador
fix/<slug>-<tema>
```

1. Cada persona trabaja con su agente en **su rama** y **solo en sus carpetas**.
2. PRs pequeños (< ~300 líneas) hacia `develop`. **Ningún agente hace merge**: lo hace un humano tras la revisión de otra persona.
3. ¿Necesitas algo de otro rol? Issue con etiqueta `bloquea:<rol>` y sigues con otra tarea.
4. Cada decisión tomada → `docs/decisiones/D<n>-<tema>.md`.

## Datos de NASA usados

_Se completa durante el hackathon._ Fuentes candidatas: [docs/science/fuentes.md](docs/science/fuentes.md).
