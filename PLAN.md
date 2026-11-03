# 🚀 Plan de equipo: NASA Space Apps 2026
**Reto:** Build a Junior Astronaut Mission Trainer
**Equipo:** 6 personas, cada una con su agente de Claude
**Estado:** Planeación (los datasets/repos de NASA llegan el **13 de noviembre**)

> ⚠️ **Regla del reto:** "No empiecen a trabajar en sus proyectos hasta que empiece el hackathon."
> Antes del inicio: **solo planeación, investigación, documentos, cuentas y repo vacío** (README, este plan, plantillas de issues, `CODEOWNERS`).
> **Nada de código del juego, assets finales ni mecánicas implementadas.** Si hay duda, preguntar a los organizadores y guardar la respuesta en `/docs/reglas.md`.

---

## 1. La idea en una frase

> Un juego web donde un niño de 7 a 12 años dirige una base en la Luna o en Marte, habla (por voz o texto) con una **tripulación de expertos**, y sobrevive a **tormentas solares reales** de NASA. Al inicio lo guía una IA de la base, pero la radiación la va dañando y el niño aprende a decidir solo a quién llamar.

### Pitch de 30 segundos
> "El niño empieza con una IA que lo guía, y la tormenta solar real la daña. Al final aprendió algo que hacen los astronautas: saber en quién confiar cuando falla la tecnología. Y cada consejo que recibe sale de datos reales de NASA, no de un chatbot inventando."

### Lo que pide el reto y cómo lo cumplimos
| Pide el reto | Nuestra respuesta |
|---|---|
| Trade-offs reales, ninguna opción gratis | 3 recursos: **energía, soporte vital, blindaje**. Todo cuesta algo. |
| Ver consecuencias | Efectos con retraso de 2-3 turnos + pantalla de **"cadena de causas"** al final |
| Datos reales de NASA, con atribución | DONKI (tormentas reales), OSDR (salud/radiación), datos de superficie Luna/Marte. Tarjeta de fuente en cada evento. |
| Rejugable, fallar sin castigo | Partidas por **semilla**: escenarios distintos en cada partida y en cada PC |
| No abrumar | 3 recursos, 3 expertos al inicio, IA como ayuda (no como recurso) |
| Sin descargas ni cuentas | **Solo web**, se juega en el navegador |

---

## 2. Diseño del juego

### 2.1 Recursos (solo 3)
- ⚡ **Energía**: solar/batería. Se reparte entre todo.
- 🫁 **Soporte vital**: oxígeno, agua, comida (un solo medidor para niños).
- 🛡️ **Blindaje**: protege a la tripulación y a la electrónica (incluida la IA).

Regla de oro: **cada acción mueve al menos dos medidores**, uno para bien y otro para mal.

### 2.2 La tripulación de expertos (factor diferencial)
Personajes **originales**. El tono puede ser de ciencia loca, absurda y sarcástica pero tierna, **sin usar personajes, nombres ni estética de franquicias existentes** (ni Rick and Morty, ni Jarvis/Marvel).

| Experto | Su código hace | Sesgo de personalidad |
|---|---|---|
| Ingeniera | Reparte energía, repara equipos, repara la IA | Ahorradora, cautelosa con la energía |
| Doctora de radiación | Dosis acumulada, salud (OSDR) | Sobreprotectora |
| Meteoróloga solar | Lee eventos reales de DONKI, avisa tormentas | Dramática, a veces exagera |
| Matemático | **"¿Y si...?"**: simula la decisión y muestra el costo antes de hacerla | Literal, solo da números |
| Control de Misión | Responde **con retraso** (en Marte, de 4 a 24 min reales, comprimidos al ritmo del juego) | Lento pero sabio |

- **Rebanada vertical:** Ingeniera, Doctora y Meteoróloga. Matemático y Control después.
- **Los expertos pueden contradecirse.** Ese conflicto es el trade-off. Seguir un consejo cuesta y no seguirlo también.

### 2.3 Cómo funcionan por detrás (clasificadores, no chatbots)
```
Niño habla o escribe (o toca un botón)
  → [1] Atajos sin modelo: botones, teclas, palabras clave
  → [2] Clasificador pequeño (Qwen / DeepSeek flash), salida JSON estricta:
        { experto, accion, parametros, confianza }   (~300 tokens en total)
  → [3] confianza < 0.6 → el personaje pregunta: "¿Te refieres al escudo o a la energía?"
  → [4] El EXPERTO es código: lee GameState + datos NASA → responde con plantillas de su personalidad
  → [5] Generativo SOLO para momentos narrativos, con límite de uso
```
- El modelo **nunca ve el estado completo ni inventa números**.
- **Seguro para niños:** enums cerrados + plantillas. La IA no puede decir algo inapropiado.
- **Funciona sin API:** si cae el modelo, siguen atajos, regex y botones.
- La clave del modelo vive en una función serverless con límite de uso. **Nunca en el navegador.**

### 2.4 La IA de la base (nombre por decidir; no "Jarvis")
Es el mismo clasificador, en modo enrutador: le dice al niño a qué tripulante llamar.

| Nivel | Comportamiento | Qué aprende el niño |
|---|---|---|
| 1. Tutorial | Habla primero y recomienda a quién llamar | Quién sabe qué |
| 2. Pistas | Solo sugiere ("esto huele a energía...") | Relacionar problema con experto |
| 3. Dañada | Se equivoca **de forma guionada** (reglas, no el modelo) | Verificar en vez de obedecer |
| 4. Offline | El niño elige solo | Autonomía |

- **Se daña por radiación** (ciencia real: la radiación afecta la electrónica). Normalmente por una decisión del niño (pedagógico) y a veces por mala suerte (como en el espacio real).
- **Adaptativa:** si el niño acierta seguido, la IA se apaga antes. Si se queda quieto o repite errores (reglas de tiempo/errores, sin modelo), "se repara" y ayuda.
- **Misión de reparación** con la Ingeniera.

### 2.5 Que ningún juego sea igual (variabilidad)
Cada partida se genera desde una **semilla**. Dos niños en dos PCs juegan escenarios distintos:

| Se varía | Ejemplos |
|---|---|
| Sitio | Luna polo sur, Luna lado visible, Marte cráter Jezero, Marte polo norte, "outpost" sorpresa |
| Tormenta real | Se sortea entre un catálogo de eventos reales de DONKI |
| Averías | Qué equipo falla y cuándo |
| Objetivo de misión | Mazo de objetivos (explorar, cultivar, reportar a la Tierra, rescatar un rover) |
| Personalidad de la tripulación | Sesgos un poco distintos en cada partida |
| Eventos de mala suerte | Micrometeorito, tormenta de polvo (Marte), fallo de panel |

- **Progreso persistente** (insignias, tripulantes desbloqueados, sitios) guardado en el navegador, sin cuenta.
- **Semilla del día opcional** para que un salón de clase compare estrategias sobre el mismo escenario.
- Proporción sugerida: **~70 % de problemas causados por decisiones, ~30 % mala suerte.** La pantalla final distingue "esto fue por tu decisión" y "esto fue mala suerte, y así se resolvía".

### 2.6 Dificultades
| | Fácil (7-8) | Media | Difícil | Hardcore (12+) |
|---|---|---|---|---|
| IA de la base | Casi no se daña | Se daña lento | Se daña rápido | Arranca dañada |
| Retraso de consecuencias | 1 turno | 2 turnos | 3 turnos | 3 turnos, ocultas |
| Eventos de mala suerte | Pocos | Normales | Frecuentes | Frecuentes y combinados |
| Matemático "¿y si?" | Ilimitado | Limitado | 3 usos | 1 uso |
| Al fallar | Reintenta el día | Reintenta la misión | Reintenta la misión | La misión se pierde (con balance) |

En todas: **fallar muestra la cadena de causas y una tarjeta de ciencia real.** Nunca un simple "Game Over".

### 2.7 Voz y texto, en ambos sentidos
- El niño **habla o escribe**, como prefiera. Los personajes **hablan o muestran texto**, con un interruptor.
- Usar la **Web Speech API** del navegador (gratis). Ojo: el reconocimiento de voz funciona bien en Chrome/Edge y mal en otros navegadores, así que **el texto y los botones siempre funcionan**.
- **No guardar audio de menores.** Se transcribe y se descarta.
- **Bilingüe español/inglés** desde el día 1.

---

## 3. Equipo y roles

| # | Rol | Posee (carpetas) | Persona |
|---|---|---|---|
| 1 | **Diseño de juego y misiones**: recursos, balance, dificultades, semillas, eventos | `/design`, `/missions` | _por asignar_ |
| 2 | **Motor y simulación**: GameState, turnos, acciones, generador por semilla | `/engine` | _por asignar_ |
| 3 | **Agentes expertos**: clasificador, esquemas, plantillas, IA de la base, evals | `/agents` | _por asignar_ |
| 4 | **Datos NASA y ciencia**: pipeline DONKI/OSDR, JSON de respaldo, glosario, verificación | `/data`, `/docs/science` | _por asignar_ |
| 5 | **Frontend, voz, arte y accesibilidad** | `/ui`, `/assets` | _por asignar_ |
| 6 | **Integración, QA, pruebas con primos, despliegue y pitch** | `/infra`, `/pitch`, `/tests/e2e` | _por asignar_ |

Si una parte se demora, **dos personas pueden ir a la misma área** (lo más probable: `/agents` y `/ui`). Se reasigna en la reunión diaria.

### Cómo trabajan 6 agentes en paralelo sin pisarse
1. **Cada humano controla a su agente.** Los agentes abren issues y PRs. **Ningún agente hace merge: lo hace su humano** después de revisión de otra persona.
2. **Cada agente solo edita su carpeta** (`CODEOWNERS` + un `CLAUDE.md` por rol).
3. **Contratos primero.** `/contracts` es el único origen de los tipos compartidos (`GameState`, `Action`, `SpaceWeatherEvent`, `ClassifierOutput`, `Seed`). Cambiarlo requiere aprobación de los dueños afectados.
4. **Mocks desde el día 1.** El rol 4 entrega datos falsos con la forma correcta; el resto construye contra ellos. El 13 de noviembre solo se cambia el origen.
5. **Dependencias explícitas.** Si un agente necesita algo de otro, abre un issue con la etiqueta `bloquea:<rol>` y sigue con otra tarea mientras tanto.
6. **PRs pequeños** (menos de ~300 líneas), con descripción y captura o prueba.

### Ramas
```
main      ← protegida, solo lo que se demuestra
develop   ← integración, recibe PRs
feat/<rol>-<tema>    ej: feat/agents-clasificador, feat/ui-hud-recursos
fix/<rol>-<tema>
```

### Etiquetas de issues
`rol:diseño` `rol:motor` `rol:agentes` `rol:datos` `rol:ui` `rol:infra` · `bloquea:<rol>` · `contrato` · `decisión` · `idea` · `bug` · `p0` `p1` `p2`

### Tablero (GitHub Projects)
Columnas: **Ideas → Por hacer → En curso → En revisión → Hecho**. Vista agrupada por rol.

---

## 4. Estructura del repositorio (propuesta)
```
/
├── README.md
├── PLAN.md                  ← este archivo
├── CODEOWNERS
├── CLAUDE.md                ← reglas generales para todos los agentes
├── .github/
│   ├── ISSUE_TEMPLATE/      (idea, tarea, bug, decisión)
│   └── pull_request_template.md
├── contracts/               ← tipos compartidos (dueños: roles 2, 3, 4)
├── design/                  ← rol 1  (+ CLAUDE.md)
├── missions/                ← rol 1
├── engine/                  ← rol 2  (+ CLAUDE.md)
├── agents/                  ← rol 3  (+ CLAUDE.md)
├── data/                    ← rol 4  (+ CLAUDE.md)
├── docs/science/            ← rol 4
├── ui/                      ← rol 5  (+ CLAUDE.md)
├── assets/                  ← rol 5
├── infra/                   ← rol 6  (+ CLAUDE.md)
├── tests/e2e/               ← rol 6
├── pitch/                   ← rol 6
└── docs/
    ├── decisiones/          (un .md por decisión tomada)
    ├── ideas/               (recopilación de ideas del equipo)
    └── reglas.md            (reglas del hackathon y respuestas de organizadores)
```
**Antes del inicio del hackathon:** solo README, PLAN, CLAUDE.md, CODEOWNERS, plantillas y carpetas con un README vacío.

---

## 5. Plantillas de `CLAUDE.md`

### `CLAUDE.md` (raíz, para todos)
```markdown
# Reglas para todos los agentes
- Lee PLAN.md y /contracts antes de empezar cualquier tarea.
- Solo edita las carpetas de tu rol (ver CODEOWNERS). Si necesitas algo de otra carpeta, abre un issue con `bloquea:<rol>`.
- No cambies /contracts sin un issue `contrato` aprobado por los dueños afectados.
- Trabaja en ramas `feat/<rol>-<tema>`. PRs pequeños hacia `develop`. Nunca hagas merge: lo hace tu humano.
- Nada de claves en el código ni en el navegador. Usa variables de entorno.
- Público: niños de 7 a 12 años. Lenguaje simple, sin contenido inapropiado.
- Nada de personajes, nombres o estética de franquicias existentes.
- Todo dato de NASA debe tener su fuente citada. Si es estático, no se presenta como "en vivo".
```

### `/<rol>/CLAUDE.md` (una por carpeta)
```markdown
# Rol: <nombre del rol>
**Humano responsable:** <nombre>
**Posees:** <carpetas>
**No toques:** todo lo demás.
**Contratos que consumes:** <lista>
**Contratos que produces:** <lista>
**Definición de "hecho":** <criterios, ej. tests pasan, captura en el PR, sin errores en consola>
**Tareas actuales:** ver issues con etiqueta `rol:<rol>`.
**Notas:** <decisiones tomadas que afectan este rol>
```

---

## 6. Qué pueden hacer los 6 agentes DESDE HOY (sin violar la regla)
Todo es investigación y documentos, sin código del juego.

| Rol | Tarea pre-hackathon | Entregable (en `/docs`) |
|---|---|---|
| 1 Diseño | Investigar juegos de gestión de recursos para niños; borrador de 3 misiones y del mazo de eventos | `docs/ideas/diseño.md` |
| 2 Motor | Comparar motores web (Phaser, PixiJS, React puro con canvas) para un juego por turnos; proponer la forma del GameState en papel | `docs/decisiones/motor.md` |
| 3 Agentes | Probar en un playground (fuera del repo) qué modelo pequeño clasifica mejor órdenes de niños en español; listar intenciones | `docs/ideas/agentes.md` |
| 4 Datos | Sacar API key de api.nasa.gov; leer docs de DONKI y OSDR; listar 10 tormentas solares históricas candidatas | `docs/science/fuentes.md` |
| 5 UI | Moodboard, referencias de interfaces para niños, propuesta de nombres y logos, accesibilidad | `docs/ideas/marca.md` |
| 6 Infra | Crear org de GitHub, repo, protección de ramas, tablero, plantillas; revisar reglas oficiales y fechas | Repo listo + `docs/reglas.md` |

## 7. Fases (convertir a fechas cuando confirmemos el calendario)
| Fase | Objetivo | Listo cuando... |
|---|---|---|
| 0. Preparación (hoy → inicio) | Equipo, repo vacío, ideas, decisiones | Todas las decisiones de la sección 8 tomadas |
| 1. Arranque | Contratos + esqueleto + mocks | Todos los roles compilan contra `/contracts` |
| 2. Rebanada vertical | Una misión de punta a punta, 3 expertos, IA nivel 1-2 | Un primo la juega completa sin ayuda |
| 3. Expansión | Datos reales (13 nov), semillas, dificultades, 5 expertos, IA niveles 3-4 | Dos PCs dan escenarios distintos |
| 4. Pulido | Voz, bilingüe, accesibilidad, balance | Pruebas con primos y ajustes hechos |
| 5. Entrega | Video, explicación de datasets, demo con respaldo offline | Formulario de Space Apps enviado |

**Congelar funciones** al menos un día antes de la entrega. Lo último solo es arreglar y pulir.

---

## 8. Decisiones pendientes (cada una con un dueño)
| # | Decisión | Opciones | Dueño | Fecha límite |
|---|---|---|---|---|
| D1 | Nombre del juego | Ver sección 9 | Todos (votación) | |
| D2 | Nombre de la IA de la base | IRIS, Orbi, Chispa, Faro, Nodo | Todos | |
| D3 | Motor/stack web | Phaser / PixiJS / React + canvas | Rol 2 | |
| D4 | Modelo del clasificador | Qwen flash / DeepSeek / otro | Rol 3 | |
| D5 | Hosting y serverless | Vercel / Netlify / Cloudflare | Rol 6 | |
| D6 | Estilo visual | Pixel art / vector plano / cartoon 2D | Rol 5 | |
| D7 | Nombres y diseño de los 5 tripulantes | | Roles 1 y 5 | |
| D8 | Catálogo de tormentas reales | | Rol 4 | |
| D9 | Duración de una partida | 5 / 10 / 15 min | Rol 1 | |
| D10 | Presupuesto de API del modelo | | Todos | |
| D11 | Plan de pruebas con primos (permiso de padres, sin grabar audio) | | Rol 6 | |

Cada decisión tomada se guarda como `docs/decisiones/D<n>-<tema>.md` con: opciones, elegida, por qué.

---

## 9. Ideas de nombres, logos y temática (para votar)

### Nombres del juego
| Nombre | Por qué |
|---|---|
| **Tripulación Sol** / **SolCrew** | Tormentas solares + tripulación |
| **Base Chispa** | Corto, tierno, bilingüe-friendly |
| **Órbita Kids** | Directo, claro para padres |
| **Puesto Avanzado 7** | Suena a misión, y el 7 por la edad mínima |
| **Llamarada** / **Flare Crew** | Tormenta solar = llamarada |
| **Misión Cráter** | Sirve para Luna y Marte |
| **Bitácora Roja** | Diario de misión en Marte |
| **OrbiCrew** | Junta la IA (Orbi) y la tripulación |

### Conceptos de logo
1. **Casco de astronauta** con el visor reflejando una llamarada solar.
2. **Base en forma de cúpula** con un escudo encima y un sol travieso asomándose.
3. **Ícono de la IA** (un ojo/orbe) con una grieta, que representa la avería.
4. **Cinco puntos en órbita** alrededor de una cúpula: la tripulación.
5. **Monograma** con las iniciales del nombre elegido formando un cohete.

### Temática y tono
- Ciencia absurda y divertida, sarcasmo tierno, nada grosero.
- Paleta: noche espacial + naranja solar (peligro) + cian (escudo) + verde (vida).
- Cada tripulante tiene un tic de personalidad y una frase recurrente.
- Original de punta a punta. Sin parecerse a personajes ni marcas existentes.

---

## 10. Lo que cada miembro del equipo debe traer
Copiar y llenar en `docs/ideas/<nombre>.md`:
```markdown
# Ideas de <nombre>
- Mis fortalezas (stack, diseño, voz, datos, pitch...):
- Rol que prefiero (1º y 2º opción):
- Mi voto de nombre del juego y de la IA:
- 3 ideas de misiones o eventos:
- 1 idea de tripulante (nombre, personalidad, frase recurrente):
- 1 riesgo que veo:
- Disponibilidad de horas durante el hackathon:
```

---

## 11. Riesgos y cómo los cubrimos
| Riesgo | Mitigación |
|---|---|
| Descalificación por empezar antes | Solo docs antes del inicio; preguntar a organizadores |
| API de NASA o del modelo cae en la demo | JSON curados de respaldo + atajos y botones sin modelo |
| Demasiadas mecánicas | 3 recursos, 3 expertos primero, rebanada vertical antes de expandir |
| Voz no funciona en el navegador del jurado | Texto y botones siempre disponibles |
| Agentes chocan entre sí | Carpetas por rol, CODEOWNERS, contratos, merge solo humano |
| Costos de API | Serverless con límite de uso; el clasificador gasta ~300 tokens |
| Privacidad de niños | Sin cuentas, sin guardar audio, pruebas con permiso de padres |

---

## 12. Entrega final (checklist)
- [ ] Juego jugable en un link público, sin descargas ni cuentas
- [ ] Video corto de demo
- [ ] Página "Datos de NASA usados y por qué" dentro del juego y en el README
- [ ] Atribución de fuentes en cada evento con datos reales
- [ ] Evidencia de pruebas con niños (sin datos personales)
- [ ] Respaldo offline para la demo
- [ ] Formulario de Space Apps enviado antes de la hora límite

---

## 13. Stack e infraestructura (propuesta para D3, D4, D5)

### 13.1 ¿Necesitamos máquina virtual? No.
El juego corre **completo en el navegador del niño**. No hay servidor propio que mantener.

| Pieza | Dónde corre | Costo | ¿Necesita VM? |
|---|---|---|---|
| Juego (motor, UI, voz, progreso) | Navegador del jugador | 0 | No |
| Hosting del sitio | Vercel (CDN) | 0 (plan gratis) | No |
| Clasificador de órdenes (LLM) | API externa (Qwen / DeepSeek), llamada desde una función serverless | Centavos (~300 tokens por orden) | No |
| Proxy de datos NASA (oculta la API key) | Función serverless de Vercel | 0 | No |
| Datos NASA de respaldo | JSON estáticos en el repo | 0 | No |

- **Las VMs de 8 GB no hacen falta.** Solo servirían para correr un modelo de IA propio (p. ej. con Ollama), y eso es más lento, más frágil en la demo y más trabajo que una API. Se descarta salvo que la API falle por completo.
- **Modelo dentro del navegador (WebLLM / transformers.js): descartado.** Descarga cientos de MB y va mal en PCs de colegio. El plan B ya cubre el caso sin API: atajos, palabras clave y botones (sección 2.3).
- Cada integrante solo necesita su PC con **Node.js 22 LTS**, Git y Claude Code. Sirve cualquier PC con 8 GB de RAM.

### 13.2 Stack recomendado
| Capa | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript** en todo | Los contratos (`/contracts`) se vuelven tipos que el compilador vigila entre los 6 agentes |
| Monorepo | **npm workspaces** (`contracts`, `engine`, `agents`, `data`, `ui`) | Cada rol es un paquete con su carpeta; encaja con CODEOWNERS |
| UI | **React + Vite** | Juego por turnos con HUD, paneles y diálogos: es más interfaz que acción. Lo conoce la mayoría |
| Escena animada (opcional) | **PixiJS** dentro de un componente React, solo para la base y efectos | Animaciones bonitas sin pasar todo a un motor de juego |
| Motor | **TypeScript puro**, sin dependencias de UI | Determinista por semilla (`seedrandom`), se prueba sin navegador |
| Validación de contratos | **Zod** | Valida el JSON del clasificador y de NASA en tiempo de ejecución |
| Clasificador | API de Qwen o DeepSeek con salida JSON, detrás de `/api/classify` | La clave nunca llega al navegador; límite de uso por IP |
| Voz | **Web Speech API** del navegador | Gratis; texto y botones siempre disponibles |
| i18n | Archivos JSON `es` / `en` | Bilingüe desde el día 1 |
| Progreso | `localStorage` | Sin cuentas |
| Pruebas | **Vitest** (motor, agentes, datos) + **Playwright** (e2e) | Rápidos y en CI |
| CI | GitHub Actions: tipos + tests + build en cada PR | Nadie rompe `develop` |
| Deploy | **Vercel**: preview por PR, producción desde `main` | Link público para jueces |

**Alternativa considerada:** Phaser. Mejor para juegos de acción con física; aquí sobra y obliga a hacer la interfaz dentro del canvas, que es más difícil de volver accesible.

### 13.3 Qué decide cada rol el día 1
- Rol 2 confirma React + Vite + PixiJS opcional (D3) en `docs/decisiones/D3-motor.md`.
- Rol 3 compara Qwen vs DeepSeek con 30 órdenes reales de niños (D4).
- Rol 6 confirma Vercel (D5) y fija el tope de gasto de la API (D10).
