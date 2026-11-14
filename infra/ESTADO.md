# Estado — infra
**Actualizado:** 14 nov 2026, 12:40 · **Rama:** feat/infra-e2e-ruta-dorada · **PR:** #80 (e2e), #79 (guion), #81 (formulario)
**Tokens:** 🟢

## Hecho (últimas iteraciones)
- Un solo Worker para pantalla y API, preview (develop) y producción (main) por Actions (#76, #78, #105); límite IA 20/min por IP.
- e2e de la ruta dorada pasa contra el preview `https://nasa-space-apps-2026-preview.santiago031541.workers.dev` (1 passed, 5 s).
- Guion (#79): paso 7 con retraso Marte–Tierra 3–22 min (sugerencia de datos, #65).
- Formulario (#81): OSDR y SOHO/STEREO resueltos, retraso 3,0–22,3 min, React/Vite en atribuciones.
- #60: marcados despliegue y Worker.

## Qué sigue
- Cuando #80 entre: job de CI que corra el e2e contra el preview tras el despliegue de develop (#41).
- Antes de main: decidir LICENSE del proyecto y releer librerías del lockfile final (POR VERIFICAR en #81).

## Bloqueos
- Merge de #79, #80 y #81 (Santiago). #66 se puede cerrar (resuelto por #107 y #65): decide José.
