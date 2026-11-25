# C. Guion narrativo de Jezero (contenido original en inglés)

**Estado:** borrador para aprobar. **Idioma base: inglés** (regla del proyecto). **No hay traducciones definitivas aquí:** cada línea lleva una *intención* en español para que Santiago valide el contenido; el español se escribe después, con el inglés aprobado.
**Reglas de escritura:** máx. ~12 palabras por línea de capa 1; una idea por línea; frases con sujeto y verbo; analogías cotidianas; nada de franquicias; cada dato de NASA lleva su fuente; ninguna cifra sin fuente de `data/`.
**Voces** (canon HISTORIA §2 y `agents/i18n`): Ingeniera = ahorradora, cuenta tornillos. Doctora = sobreprotectora, pone curitas. Meteoróloga = dramática, les pone nombre a las tormentas. Iris = cálida, curiosa, se equivoca con gracia.
**Etiquetas:** `[EXISTE: clave]` ya está en `agents/i18n` o `ui/i18n`; `[NUEVO]` hay que escribirla; `[CAPA 2]` / `[CAPA 3]` se abre a pedido del niño.
**Variables:** `{x}` las pone el código desde el estado; el modelo de IA nunca escribe cifras.

---

## A. Llegada

| # | Quién | Cuándo | Línea EN | Intención (ES) | Estado |
|---|---|---|---|---|---|
| A1 | Iris | Órbita, al abrir la pantalla | "Commander on deck! Below us is Jezero Crater, on Mars." | Saludo y lugar | [NUEVO] |
| A2 | Iris | A1 + 3 s | "A long time ago, a lake filled this crater." | Hecho con fuente (glosario: *delta*) | [NUEVO] · requiere confirmar con datos |
| A3 | Iris | A2 + 3 s | "Our mission: stay safe through a solar storm and call home." | Objetivo en una frase | [NUEVO] |
| A4 | Ingeniera | Tarjeta del satélite | (las existentes de `consejosSatelite`) | Analogías de batería, señal, escudo | [EXISTE: agentes.satelite.ingeniera.*] |
| A5 | Meteoróloga | Tarjeta del satélite | (las existentes) | Señal con la Tierra: "plan ahead" | [EXISTE: agentes.satelite.meteorologa.senal] |
| A6 | Iris | Al pulsar *Continue* | "First, look before you choose." | Lema de la intro | [EXISTE: ui.intro.2.texto] |

**Silencio de Iris:** después de A3 calla hasta que el niño pulse *Continue* o pasen ~20 s.

## B1. Elegir sitio

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| B1-1 | Ingeniera | Al abrir sitios | "I vote for {sitio}. More sun means more energy." | Defiende su criterio (luz) | [EXISTE: agentes.aterrizaje.ingeniera.luz] |
| B1-2 | Doctora | idem | "I prefer {sitio}. The ground blocks part of the radiation." | Defiende refugio natural | [EXISTE: agentes.aterrizaje.doctora.blindaje] |
| B1-3 | Iris | idem | "For a safe landing, {sitio} is the flattest." | Defiende "plano" | [EXISTE: agentes.aterrizaje.ia_base.plano] |
| B1-4 | Iris | Cierre | "Each expert likes a different place. No site is perfect." | La compensación | [EXISTE: agentes.aterrizaje.cierre.discrepan] |
| B1-5 | Iris | Al elegir | "Good choice. Every place trades something for something." | Valida sin juzgar; ningún sitio es "malo" | [NUEVO] |

## Llegada y B2. Primer paseo

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| L1 | (pantalla) | 2,5 s | "Arriving at Jezero" | Rótulo de transición | [EXISTE: ui.llegada.titulo] |
| L2 | (tarjeta) | Al aterrizar | "Your crew is ready" | Invitación a explorar | [EXISTE: ui.listo.titulo] |
| L3 | Iris | Al abrir el paseo | "Follow the glowing spot. Your crew is there." | Dónde ir | [NUEVO] (variante corta de `acompana.tutorial.*`) |
| L4 | Iris | Cada vez que cambia el objetivo | "Come to {lugar}. Ask {experta}…" | Guía por lugares | [EXISTE: agentes.iris.acompana.tutorial.*] |

## C. Preparar la base (el niño ya conoce la tormenta por D)

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| C1 | Ingeniera | Taller, 1.ª visita | "Every module costs energy now and helps later." | Costo ahora, beneficio después | [EXISTE: ui.paso.4.texto, reescribir en su voz] |
| C2 | Ingeniera | Tras colocar un módulo | "*counts screws* …done. Now watch the meters." | Reacción al hecho; los medidores se moverán en 1–2 turnos | [NUEVO] |
| C3 | Ingeniera | Si colocó panel | "Panels make energy. The shield will need it." | Une C con la tormenta | [NUEVO] |
| C4 | Doctora | Hábitat, si colocó escudo | "A strong shield keeps the crew safe." | Función del módulo | [NUEVO] (la tarjeta de ciencia existe: `escudo_regolito`) |
| C5 | Cada tarjeta de ciencia | Al colocar un módulo | (las 5 existentes con su fuente) | CAPA 3 | [EXISTE: mision.jezero.ciencia.*] |

## D. El círculo de la tripulación (reloj parado)

Orden pensado para **subir la tensión**: primero ciencia curiosa, luego peligro, luego plan.

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| D1 | Meteoróloga | Al terminar de colocar los 2 módulos (alerta, sin esperar al niño) | "My sensor just spotted a solar cloud leaving the Sun!" | El hecho que dispara la historia | [NUEVO] (el dato existe: CME DONKI 2024-05-20) |
| D2 | Meteoróloga | D1 + 3 s | "It's a real storm: {nombre}. It happened on {fecha}." | Evento real, fecha, y que es un entrenamiento con datos reales | [EXISTE: agentes.meteorologa.pronostico.viene] |
| D3 | Meteoróloga | D2 + 3 s | "Solar clouds can take days to arrive. This one is coming." | Por qué hay tiempo para prepararse | [NUEVO] · hecho del glosario (*Solar cloud*) |
| D4 | Meteoróloga (+fuente) | Chip "Check the source" | Tarjeta DONKI + `consultadoEl` + "curated, not live" | CAPA 3 | [EXISTE: TarjetaFuente] |
| D5 | Doctora | Tras D3 | "You can't see radiation. So I count it." | La idea más importante de radiación | [EXISTE en espíritu: agentes.doctora.salud.noSeSiente, ajustar] |
| D6 | Doctora | Al aparecer el dosímetro | "This is our dosimeter. Training budget: {límite}. Keep everyone under it." | Presenta el presupuesto como regla de juego, **no** como umbral de salud | [NUEVO] |
| D7 | Doctora | CAPA 2 "Why?" | "The shelter's thick walls stop many particles." | Por qué el refugio | [EXISTE: agentes.doctora.refugio.ok] |
| D8 | Ingeniera | Tras D6 | "A stronger shield uses energy. Panels make it." | Une energía y blindaje | [NUEVO] |
| D9 | Iris | Tras D8 | "Shield is at {valor}%. Check your meter: same!" | **Gana confianza**: una lectura cierta y comprobable | [NUEVO] |
| D10 | Iris | Tras D9 | "Ask the crew anything. Press Start the clock when you're ready." | El niño arranca el reloj | [EXISTE: ui.paso.4.listo] + [NUEVO] |
| D11 | Iris | Si pasan ~20 s sin acción | "No rush. The Sun won't wait forever, though." | Una sola insistencia, tono suave | [NUEVO] |

**Capa 2 (a pedido):** "Why a solar cloud?" → "The Sun throws bits of itself into space. Some come our way." **Capa 3:** glosario *Solar cloud*, *Radiation*, *Dose*, *Shielding* (todas existen en `data/i18n`).

## E. Tormenta

Reutiliza la escena existente (`escenaTormenta`) y añade dosis.

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| E1 | Meteoróloga | Llega la tormenta (pausa) | "Here it comes! A real storm: {nombre}, from {fecha}." | Confirma el pronóstico de D | [EXISTE: agentes.escena6.meteorologa.llega] |
| E2 | Doctora | idem | "That day, Curiosity measured radiation about {factor} times higher on Mars." | El dato RAD, con su fuente | [EXISTE: agentes.escena6.doctora.medida] |
| E3 | Doctora | idem | "While we hide, nobody looks after the base. That has a cost too." | Costo del refugio | [EXISTE: agentes.escena6.doctora.costo / costoInvernadero] |
| E4 | Ingeniera | idem | "If we all hide, nobody fixes anything. Boost the shield instead." | Su plan | [EXISTE: agentes.escena6.ingeniera.contra] |
| E5 | Ingeniera | idem | "We have {energía}% energy. The shield uses {gasto}." | Costo con cifra del estado | [EXISTE: .costo / .costoSinCifra] |
| E6 | Iris | idem | "Two experts, two plans. Neither one is free. You decide." | Iris se **calla** salvo para devolver la decisión al niño | [EXISTE: agentes.escena6.elige] |
| E7 | Iris | **Glitch** (reveal) | "Bzzt… krrr… Radiation is tickling my circuits." | Señal visual/sonora de la avería | [EXISTE: agentes.iris.falla.glitch] |
| E8 | Iris | idem | "Shield at {dicho}%. Everything is perfect, commander!" | Número que **no coincide** con el medidor (≥ 20 puntos) | [EXISTE: agentes.iris.falla.numero] |
| E9 | Ingeniera | El niño le pregunta o va al taller | "Wait. Iris said {dicho}%, but my meter says {real}%." | Verificación comparando los dos valores | [EXISTE: agentes.iris.verificar.numero] |
| E10 | Ingeniera | idem | "I can fix her. It costs energy, but a computer that lies is worse than none." | Reparar cuesta, y por qué vale | [EXISTE: agentes.iris.verificar.reparar] |
| E11 | Doctora | Cada turno de tormenta | "Dose now {dosis} of {límite}. Careful!" | Mantiene la dosis presente | [NUEVO] |
| E12 | Iris | Tras reparar | "Rebooting… thank you! Even computers make mistakes. Check my numbers." | Sin culpa; refuerza el hábito | [NUEVO] |

**Qué NO dice Iris en la tormenta:** nada que parezca una orden. Su única propuesta "peligrosa" (`accion_peligrosa`) ya existe como **propuesta** con costos visibles en el panel de confirmación; el niño la confirma o no.

## F. Resolución

| # | Quién | Cuándo | Línea EN | Intención | Estado |
|---|---|---|---|---|---|
| F1 | Iris | Llega la respuesta | "Earth got our message! The crew is safe." | Cierre de la expedición (**victoria**) | [NUEVO] |
| F2 | Doctora | Victoria | "Everyone stayed under the budget. The {shelter/shield} did its job." | Une decisión y resultado (la elección sale de las causas) | [NUEVO] |
| F3 | Ingeniera | Victoria | "*counts screws* …all there. Good build." | Cierre con su voz | [NUEVO] |
| F4 | Meteoróloga | Victoria | "Sparky is over. The real storm was {factor} times stronger than a normal day." | Dato con fuente (RAD), nombre dramático | [NUEVO] · el factor viene de `medicionMarte` |
| F5 | Iris | **Derrota por dosis** | "That was a training rescue. The crew took more radiation than our budget." | Derrota sin castigo; la causa exacta | [NUEVO] + [EXISTE: causa.limite_radiacion] |
| F6 | Iris | Derrota por energía | "We ran out of energy. The shield eats energy; panels make it." | La causa exacta | [NUEVO] + [EXISTE: causa.recurso_agotado.energia] |
| F7 | Iris | Derrota por soporte vital / blindaje | (análogo, una por recurso) | idem | [NUEVO] + [EXISTE: causa.recurso_agotado.*] |
| F8 | Iris | Derrota por plazo | "We ran out of time before calling home." | idem | [NUEVO] + [EXISTE: causa.plazo_agotado] |
| F9 | Iris | **Pista de reintento** (de las reglas, ver abajo) | "Next time, try {pista}." | Qué probar distinto | [NUEVO] |
| F10 | Iris | Final | "Want to try again? The Sun has more tricks." | Invitación a repetir | [NUEVO] |

**Pistas de reintento (F9) — reglas puras, sin modelo.** Una pista por causa terminal, tomada del resumen del motor:
- dosis → "the shelter, or a stronger shield, *before* the cloud arrives";
- energía a 0 con escudo → "build a solar panel first";
- plazo → "send the message earlier";
- soporte vital → "the greenhouse or the water recycler help here".
Cada pista es la respuesta honesta a lo que el motor midió; ninguna inventa un hecho.

## Celebrar un descubrimiento (Iris)
Cada vez que el niño abre una curiosidad o una fuente por su cuenta (**EXISTE**: `contarCuriosidad`), Iris dice una de dos reacciones cortas y no repite: "Ooh, I didn't know that!" / "Good question. Real scientists ask that too." **[NUEVO]**

## Notas para Santiago
1. **Ninguna línea nueva inventa una cifra.** Las cifras vienen siempre del estado (`{x}`), de `medicionMarte` o de una tarjeta con fuente.
2. **Las líneas A2 y D3 usan hechos del glosario;** pedir al rol de datos que confirme su fuente antes de implementarlas.
3. **Para el Matemático no hay líneas** (queda fuera de Jezero hasta que se decida, README D3).
4. **Longitud:** casi todas las líneas nuevas caben en una burbuja corta; el globo del mundo ya admite ~120 caracteres (`duracionGlobo`, E5).
