# Rol ui (María Paula): cómo lanzar las cuatro pistas

El rol ui se trabaja en **cuatro sesiones paralelas con archivos disjuntos**. Detalle de quién escribe qué, contratos entre pistas, fases y validación: [FLUJO.md](../referenciapau/FLUJO.md). Reglas comunes: [README.md](README.md).

| Pista | Prompt | Cuándo se lanza | Escribe en |
| --- | --- | --- | --- |
| **M · Integración de misiones con la UI** | [ui-integracion.md](ui-integracion.md) | Ya (fase 0, P2) | `App.tsx`, `main.tsx`, `juego/`, `pantallas/`, `escena/vista.ts`, `i18n`, `package.json` |
| **E · Escenario 3D** | [ui-escenario.md](ui-escenario.md) | Cuando M cierre la fase 0 y el contrato `VistaEscena` | `ui/src/escena/` (menos `vista.ts`) |
| **I · Interfaz** | [ui-interfaz.md](ui-interfaz.md) | Cuando M cierre la fase 0 | `ui/src/componentes/`, `ui/src/estilos/`, `ui/public/` |
| **A · Audio y voz** | [ui-audio.md](ui-audio.md) | Al final, con la integración aprobada | `ui/src/audio/`, `assets/audio/`, `assets/LICENCIAS.md` |

Orden de fusión: M (fase 0) → M e I (contratos y tokens) → E e I → M (integración) → A.

Cada pista escribe en su propia sección de `ui/ESTADO.md` (`## Pista M`, `## Pista E`, `## Pista I`, `## Pista A`), máximo 5 líneas, sin tocar la de las otras.
