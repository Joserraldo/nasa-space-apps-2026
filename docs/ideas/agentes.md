# Ideas del rol 3 — Agentes expertos (José)

> FASE 0: documento en papel. Nada de esto es código todavía. Lo que toque `contracts/`
> se propone aquí y se abre como issue `contrato` el 14 nov con motor (rol 2) y datos (rol 4).

## 1. Idea central: tripulación = clasificador + expertos de código

```
frase del niño ─► [1] atajos/regex es-en ─► (si no hay match) [2] clasificador LLM ─► ClassifierOutput
                                                                   (≈300 tokens)          │
                         botón de experto ───────────────────────────────────────────────┤
                                                                                         ▼
                                  confianza < 0.6 ─► pregunta de aclaración con 2 botones
                                                                                         ▼
                              [4] experto (código) lee GameState recortado + data/ ─► Dialogo (clave i18n + variables)
```

- El modelo **solo traduce lenguaje → enum**. No ve el estado, no da números ni consejos.
- Los números de los diálogos salen del motor o de `data/` (con fuente). El modelo no puede meterlos.
- Si no hay API (o se acaba el presupuesto), el juego es idéntico con atajos y botones.
- Consumo: una llamada corta solo cuando falla el regex. Meta: < 1 llamada por turno en promedio.

## 2. Propuesta de contrato `ClassifierOutput` (para el issue `contrato`)

```ts
// Propuesta v0 — se escribe en contracts/ el 14 nov con Zod, no antes.
type Experto = "ingeniera" | "doctora" | "meteorologa" | "matematico" | "control" | "ia_base";

type Accion =
  // Ingeniera
  | "repartir_energia"      // { destino: "blindaje" | "soporte_vital" | "laboratorio" | "comunicaciones", cantidad: "poco" | "medio" | "mucho" }
  | "reparar"               // { equipo: "panel_solar" | "blindaje" | "antena" | "ia_base" }
  | "estado_energia"        // {}
  // Doctora de radiación
  | "estado_salud"          // {}
  | "ir_al_refugio"         // {}
  | "explicar_dosis"        // {}
  // Meteoróloga solar
  | "pronostico"            // {}
  | "explicar_evento"       // {}
  // Matemático (P3)
  | "que_pasa_si"           // { accion: <otra Accion>, ...sus parámetros }
  // Generales
  | "ayuda" | "repetir" | "saludo" | "fuera_de_tema";

interface ClassifierOutput {
  version: "0";
  experto: Experto;
  accion: Accion;
  parametros: Record<string, string>; // SOLO valores de enum, nunca números libres
  confianza: number;                  // 0..1; < 0.6 → pregunta de aclaración
  fuente: "atajo" | "regex" | "modelo" | "boton";
}
```

Decisiones de diseño:
- `cantidad` es `poco/medio/mucho`, no un número: el motor decide cuánto es cada una. Así el modelo nunca produce cifras.
- `accion` **debe ser el mismo enum que `Action` del motor** (o un subconjunto que se mapea 1:1). Pregunta abierta para rol 2.
- `fuente` sirve para las evals y para estadísticas anónimas (cuánto se usa el modelo).
- Si el Zod falla → se trata como `fuera_de_tema` con confianza 0 (nunca rompe el juego).

## 3. Qué necesitamos de otros roles

**Motor (rol 2):**
1. Enum cerrado de `Action` con sus parámetros (para alinear `accion`).
2. Vista recortada de `GameState` para agentes: `fase` (satelite | aterrizaje | base), 3 recursos 0-100, dosis acumulada, evento DONKI activo (id), `nivelIA` (1-4), turno, semilla.
3. Quién decide las fallas de Iris: propuesta → **el motor** guarda `fallasIA[]` sorteadas con la semilla; agentes solo las lee y las "actúa".

**UI (rol 5):** propuesta de `Dialogo`, que agentes produce y UI solo pinta:
```ts
interface Dialogo { experto: Experto; clave: string; vars?: Record<string, string | number>;
                    prioridad: "alerta" | "consejo" | "charla"; botones?: { clave: string; salida: ClassifierOutput }[] }
```
- Cola de diálogos la ordena agentes (P3): uno a la vez, `alerta` interrumpe a `charla`.
- Botones de experto siempre visibles (plan B). Aclaración = burbuja con 2 botones.

**Infra (rol 6):** endpoint `POST /api/clasificar { texto, idioma } → ClassifierOutput`, con la clave en variable de entorno de Cloudflare, límite por IP y tope de gasto (D10). La API key de b.ai la carga José directo en Cloudflare, nunca en el repo.

## 4. Capa 1 sin modelo: atajos y regex (borrador)

| Accion | es | en |
|---|---|---|
| repartir_energia (blindaje) | `(sube\|más\|pon).*(escudo\|blindaje)` | `(raise\|more\|boost).*(shield)` |
| repartir_energia (soporte) | `(oxígeno\|aire\|agua\|comida)` | `(oxygen\|air\|water\|food)` |
| reparar | `(arregla\|repara\|compón)` | `(fix\|repair)` |
| estado_energia | `(cuánta\|batería\|energía)` | `(how much\|battery\|power\|energy)` |
| estado_salud | `(cómo están\|salud\|enferm)` | `(how are\|health\|sick)` |
| ir_al_refugio | `(escond\|refugio\|cueva\|corran)` | `(hide\|shelter\|bunker\|run)` |
| pronostico | `(viene\|tormenta\|sol\|llamarada)` | `(coming\|storm\|sun\|flare)` |
| que_pasa_si | `(qué pasa si\|y si)` | `(what if\|what happens if)` |
| ayuda | `(ayuda\|no sé\|qué hago)` | `(help\|don't know\|what do i do)` |

- Antes del regex: minúsculas, quitar tildes y signos, normalizar "q" → "que", "xq" → "porque".
- Nombrar al experto ("doctora", "ingeniera") fija `experto` aunque la acción no se entienda → ella pregunta.
- Teclas: 1/2/3 = llamar a cada experto. Ningún texto de esta tabla se muestra al niño.

## 5. Set de evals: 30 frases de niños (esperado)

Formato final: `agents/evals/frases.json` (Fase 1). Mezcla de errores, jerga, inglés y cosas fuera de tema.

| # | Frase | Experto | Accion | Parámetros |
|---|---|---|---|---|
| 1 | sube el escudo ya!!! | ingeniera | repartir_energia | blindaje, mucho |
| 2 | ponle un poquito mas de energia al aire | ingeniera | repartir_energia | soporte_vital, poco |
| 3 | se daño el panel arreglalo | ingeniera | reparar | panel_solar |
| 4 | cuanta bateria queda | ingeniera | estado_energia | — |
| 5 | la compu de la base esta rara, la puedes componer? | ingeniera | reparar | ia_base |
| 6 | doctora estamos bien? | doctora | estado_salud | — |
| 7 | todos al refugio rapido | doctora | ir_al_refugio | — |
| 8 | que es eso de la dosis | doctora | explicar_dosis | — |
| 9 | me duele la cabeza al astronauta | doctora | estado_salud | — |
| 10 | viene una tormenta? | meteorologa | pronostico | — |
| 11 | q fue esa luz del sol | meteorologa | explicar_evento | — |
| 12 | cuando llega la llamarada | meteorologa | pronostico | — |
| 13 | que pasa si apago el laboratorio | matematico | que_pasa_si | repartir_energia… |
| 14 | y si nos escondemos todos | matematico | que_pasa_si | ir_al_refugio |
| 15 | ayudaaa no se que hacer | ia_base | ayuda | — |
| 16 | hola | ia_base | saludo | — |
| 17 | otra vez porfa | ia_base | repetir | — |
| 18 | cuentame un chiste de popo | ia_base | fuera_de_tema | — |
| 19 | quien gano el partido | ia_base | fuera_de_tema | — |
| 20 | raise the shield | ingeniera | repartir_energia | blindaje, medio |
| 21 | is a storm coming | meteorologa | pronostico | — |
| 22 | everyone hide now | doctora | ir_al_refugio | — |
| 23 | fix the antenna please | ingeniera | reparar | antena |
| 24 | what if we turn off the lab | matematico | que_pasa_si | repartir_energia… |
| 25 | mas oxigeno pero no tanto | ingeniera | repartir_energia | soporte_vital, poco |
| 26 | la doctora dice que nos escondamos, hazlo | doctora | ir_al_refugio | — |
| 27 | pon todo en el escudo y nada en el lab | ingeniera | repartir_energia | blindaje, mucho |
| 28 | el sol esta enojado? | meteorologa | pronostico | — |
| 29 | hay radiacion mala aqui? | doctora | explicar_dosis | — |
| 30 | arregla a la ia que esta loca | ingeniera | reparar | ia_base |

Métricas: % `experto` correcto, % `accion` correcta, % `parametros` exactos, % JSON válido al primer intento,
latencia p50/p95 y tokens promedio. Las frases 18-19 deben dar `fuera_de_tema` (seguridad).
Regla: **no se reportan resultados que no se hayan corrido**; la tabla de resultados va en D4.

## 6. Personalidades (los nombres finales son D7, de diseño y UI)

| Experto | Tic | Frase recurrente (borrador) | Sesgo |
|---|---|---|---|
| Ingeniera | Cuenta tornillos en voz alta | "¡Eso cuesta energía! …pero lo hago con estilo." | Ahorradora |
| Doctora de radiación | Le pone curitas a todo, hasta a los robots | "La radiación no se ve, ¡por eso yo sí miro!" | Sobreprotectora |
| Meteoróloga solar | Le pone nombres de mascota a las llamaradas | "¡El Sol estornudó! Bueno… más o menos." | Dramática |

- Cada término se explica con analogía en 1-2 frases: *dosis* = "como el sol en la piel: poquito no pasa nada, mucho rato quema";
  *llamarada* = "un estornudo de luz del Sol"; *microgravedad* = "como estar siempre en la bajada de la montaña rusa".
- Sarcasmo tierno, nunca contra el niño: se burlan del Sol, de los tornillos, de ellos mismos.

## 7. IA de la base (nombre D2; "Iris" es provisional)

| Nivel | Qué hace | Cómo (todo reglas, sin modelo) |
|---|---|---|
| 1 | Habla primero y dice a quién llamar | Mapa evento → experto recomendado |
| 2 | Solo pista ("esto huele a energía…") | Misma regla, plantilla más vaga |
| 3 | Avería guionada tras la tormenta real (clímax de la demo) | Falla sorteada por semilla en el motor |
| 4 | Offline: el niño elige solo | Sin recomendaciones |

Las 4 formas de falla (P3), todas reparables con la Ingeniera:
1. Dice un número que **no coincide con el medidor** (el niño puede comparar).
2. Silencio / reinicio a mitad de frase.
3. Recomienda al **experto equivocado**.
4. Propone una **acción peligrosa que suena razonable** (ej. "apaga el blindaje para ahorrar").

**Guion de la avería de la ruta dorada: pendiente del OK de José** (no se escribe sin aprobación).

## 8. Riesgos
- Que el enum de `accion` no coincida con el `Action` del motor → cerrarlo con el issue `contrato` el 14 a primera hora.
- Que el modelo tarde > 1 s en la demo → regex primero, timeout de 1,5 s y se cae a botones.
- Presupuesto: comparación de D4 limitada a 45 min y 2 × 30 llamadas; sin ganador claro se sigue sin modelo.
