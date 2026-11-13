# Instrucciones para agentes (Codex, OpenCode y cualquier otra herramienta)

Este archivo existe porque algunas herramientas leen `AGENTS.md` y no `CLAUDE.md`. **Las reglas son las mismas para todas las herramientas** y viven en un solo lugar: no las copies aquí.

Antes de cualquier tarea, lee en este orden:

1. [CLAUDE.md](CLAUDE.md): reglas para todos los agentes y **fase actual** (mientras diga FASE 0, solo documentos).
2. [PLAN.md](PLAN.md): el plan del equipo.
3. [docs/reglas.md](docs/reglas.md): reglas del hackathon.
4. El `CLAUDE.md` y el `ESTADO.md` de la carpeta de tu rol (ver la tabla de roles del [README](README.md)).
5. [docs/COMO-TRABAJAMOS.md](docs/COMO-TRABAJAMOS.md): roles vigentes, qué se construye primero, idioma base y uso de subagentes.
6. [docs/ORQUESTACION.md](docs/ORQUESTACION.md) (solo la parte de arriba): estado del equipo, riesgos y próximo hito.
7. [docs/LOOP.md](docs/LOOP.md): qué hace una iteración.

Lo que no cambia según la herramienta:

- Solo editas las carpetas de tu rol. Nunca haces merge ni empujas a `main` o `develop`.
- Commits pequeños en español, sin atribución a IA. El uso de IA se declara en [docs/ia-uso.md](docs/ia-uso.md).
- Nada de claves en el código, en issues ni en el chat.
- Reporta tu consumo en tu `ESTADO.md` con la línea `Tokens: 🟢 / 🟡 / 🔴`.

Si tu herramienta no tiene `/loop`, tu humano pega el mensaje de iteración de [docs/LOOP.md](docs/LOOP.md) cada 10–20 minutos. Qué modelo usar para cada tipo de tarea: [docs/modelos.md](docs/modelos.md).

> Por verificar el sábado con cada persona: que su herramienta carga este archivo al abrir el repo.
