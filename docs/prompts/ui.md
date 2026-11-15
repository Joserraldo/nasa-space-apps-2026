# Rol ui (María Paula): cómo lanzar las cuatro pistas

El rol ui se trabaja en **cuatro pistas con archivos disjuntos**. Por defecto hay **una sola sesión principal** (la pista M, en Opus) que lanza E, I y A como subagentes con su prompt, como pide `docs/COMO-TRABAJAMOS.md` §3; sesiones separadas solo si la orquestadora lo autoriza en `ui/ESTADO.md`. Detalle de quién escribe qué, contratos entre pistas, fases y validación: [FLUJO.md](../referenciapau/FLUJO.md). Reglas comunes: [README.md](README.md).

| Pista | Prompt (encargo del subagente o de la sesión) | Cuándo se lanza | Escribe en |
| --- | --- | --- | --- |
| **M · Integración de misiones con la UI** | [ui-integracion.md](ui-integracion.md) | Ya (fase 0, P2) | `App.tsx`, `main.tsx`, `juego/`, `pantallas/`, `escena/vista.ts`, `i18n`, `package.json` |
| **E · Escenario 3D** | [ui-escenario.md](ui-escenario.md) | Cuando M cierre la fase 0 y el contrato `VistaEscena` | `ui/src/escena/` (menos `vista.ts`) |
| **I · Interfaz** | [ui-interfaz.md](ui-interfaz.md) | Cuando M cierre la fase 0 | `ui/src/componentes/`, `ui/src/estilos/`, `ui/public/` |
| **A · Audio y voz** | [ui-audio.md](ui-audio.md) | Al final, con la integración aprobada | `ui/src/audio/`, `assets/audio/`, `assets/LICENCIAS.md` |

Orden de fusión: M (fase 0) → M e I (contratos y tokens) → E e I → M (integración) → A.

Cada pista escribe en su propia sección de `ui/ESTADO.md` (`## Pista M`, `## Pista E`, `## Pista I`, `## Pista A`), máximo 5 líneas, sin tocar la de las otras.
