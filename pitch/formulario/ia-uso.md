# How AI is used · Cómo se usa la IA

> **Borrador actualizado el 15 nov (mañana) por un agente de apoyo a pedido de Santiago — un segundo humano lo revisa antes de enviar.**

The submission form asks how AI tools were used. The exact wording of the policy is **not confirmed** (it may say "SI" instead of "AI"; see `docs/reglas.md`), so this text covers both: (A) AI inside the game and (B) AI used to build it. Source of truth for (B) is the team log in `docs/ia-uso.md`; section B below copies it row by row. If one changes, change the other.

**State of the submitted build today (15 nov):** the game screen resolves the child's phrases with buttons, keyword shortcuts and regex (`conversar` in `agents`). It does **not** call the language-model classifier, and it has no voice input or output. The classifier Worker route (`/api/clasificar`) is written and tested but not wired to the screen, and D4 decided "no model classifier for now". `docs/ia-uso.md` still says the in-game model is "por decidir"; Santiago should update that row to match before sending.

## A. AI inside the game

**In one sentence:** a small language model may only turn a kid's typed or spoken phrase into a strict JSON label; everything the child reads or hears is written by people and produced by ordinary code.

### What the model does
- Input: **only the child's phrase**. It never receives the game state, resources, storm data, names or any identifier.
- Output: strict JSON `{ experto, accion, parametros, confianza }` (expert, action, parameters, confidence 0 to 1), chosen from **closed lists** (6 expert labels, 13 actions). Parameters are only enum words such as "little / medium / a lot" or an equipment name. It cannot output numbers.
- The reply is checked with **Zod** (`ClassifierOutputSchema`, `contracts/`). If the JSON is invalid, late (timeout 1.5 s) or the call fails, the game uses a safe fallback label ("off topic") and nothing breaks.
- Request settings: JSON-schema constrained decoding, `max_tokens` 80, temperature 0.
- If confidence is below 0.6, the character asks a follow-up question ("Do you mean the shield or the energy?").

### What the model never does
- It never writes text shown to children. The experts (Engineer, Radiation Doctor, Space Weather expert and the "What if?" Mathematician, named by role) are **deterministic code** that read the game state and NASA data and answer with **i18n templates** (English base, Spanish second). Nothing inappropriate can be generated.
- It never produces numbers, advice, science facts or "according to NASA" statements. Numbers come from the game state or the cited NASA data.
- Iris, the base AI, does not use the model to fail: her mistakes are **scripted by rules** (for example a number that does not match the gauge), so the lesson "verify before you obey" is controlled and repeatable.

### It works without the AI
The first layer is not a model: buttons, shortcuts and **regex** in English and Spanish (`clasificarConAtajos`). The team's 30 test phrases are resolved by these shortcuts in 28 cases (D4). If the API is down or switched off, the game plays the same, with buttons and text.

### Privacy and keys
- The API key lives only on the server side (a Cloudflare Worker environment variable; GitHub secret `BAI_API_KEY` for the repo). **Never in the browser or in the code.**
- The Worker forwards only the phrase: no IP, no identifiers. It rate-limits to 20 questions per minute per player, keyed by a hash of the IP (never the IP itself), with Cloudflare's built-in rate limiter. Regex shortcuts do not count.
- The Worker is tested with a fake model (`infra/worker`, zero paid calls in tests) and deploys automatically from GitHub Actions: `develop` to preview, `main` to production (PRs #105, #106). The key reaches the Worker as a secret copied from GitHub at deploy time.
- **No audio of minors is stored.** This version has no voice input or output (future work), so the game records no audio. If voice is added, speech would be transcribed in the browser and discarded.
- Accounts are optional; guests play without one (**POR VERIFICAR** whether login is reachable from the screen in the submitted build). With an account the Worker stores only a chosen username (no email, no real name, no IP), a salted PBKDF2-SHA256 password hash and the game progress (Cloudflare D1, PR #108). The session is an HttpOnly cookie; only its hash is stored.

### Real evaluation results (D4, 2026-11-13)
We compared two small models on 30 children's phrases (1 pass each, 60 calls; script `agents/evals/correr.ts`, raw data in `agents/evals/resultados-2026-11-13.json`). Our rule was: choose the model with the most correct actions **and** p95 latency under 1.5 s.

| Model (via b.ai) | Valid JSON | Right expert | Right action | Right parameters | p50 / p95 latency |
|---|---|---|---|---|---|
| `qwen3.8-flash` | 86.7 % | 83.3 % | 80.0 % | 90.0 % | 6.0 s / 15.0 s |
| `deepseek-v4.1-flash` | 23.3 % | 23.3 % | 23.3 % | 66.7 % | 2.9 s / 3.2 s |

- Both models correctly marked the 2 off-topic phrases as "off topic".
- Neither met the latency rule. Both are "reasoning" models; with an 80-token limit, DeepSeek spent its whole budget thinking and returned empty answers, so its 23.3 % does not measure its real ability.
- **Decision recorded in D4: no model classifier for now.** The game ships on shortcuts, regex and buttons. The model stays an optional layer behind a Worker, to be reopened with reasoning turned off or a non-reasoning model.
- **Statement for the form (a):** "the submitted build uses no language model; an optional classifier exists behind a Worker but is not enabled." **POR VERIFICAR** on submission day (change to (b), with the model name and a new eval result, only if someone wires and enables it).

## B. AI-assisted development (honest account)

Copy of `docs/ia-uso.md` (development rows, 15 nov):

| Person | Tool | Model | What for | Since |
|---|---|---|---|---|
| Santiago (`kcitas`) | Claude Code | Fable 5.1 / 5.2 and Opus 5.5 (Haiku subagents for reading) | Orchestration and coordination (roles, models, this log, pitch criteria drafts); mission 1 of Jezero in `design/` and `missions/`; 14 Nov: infrastructure (Worker with screen and API, automatic deploy, optional login and progress in D1), engine fix so the golden path can be won (#134), sources of the science cards (#138), PR checks and simulations before merging, pitch data revisions (#161) | 13-14 Nov |
| Santiago (`kcitas`) | Claude Code | Fable 5.2 | 3D prototype of Jezero outside the repo (Blender, from the Mars Trek DEM); not integrated | 13 Nov |
| María Paula (`Paulasaah`) | Claude Code | Opus 5.5 | Visual direction in `docs/referenciapau/`, D6 and D7, prompts per role, verification of the challenge statement | 14 Nov |
| To confirm with its author | to confirm | to confirm | Research of 2 Nov in `docs/reglas.md` and `docs/science/fuentes.md` | 2 Nov |

- Besides Claude Code, the team log in `docs/modelos.md` says everyone has OpenCode and one teammate has Codex, with Opus-class main sessions. Which teammate used which tool for what is **not** in `docs/ia-uso.md`: each person must add their own row before sending (**POR VERIFICAR**).
- Agents helped write code, tests, data pipelines, documentation, and drafts of text (including these form drafts and the video script, drafted by a support agent at Santiago's request on 15 Nov), each in their own role folder (`engine`, `agents`, `data`, `ui`, `design`, `infra`, `pitch`).
- **Humans decide and review.** Each person controls their own agent. Agents open issues and pull requests but **never merge**: a human merges after review (merge to `main` and `develop` is blocked for agents in `.claude/settings.json`). Design choices, the NASA data selection and the science wording were decided and checked by people. A separate science review of the expert texts is in `docs/science/revision-agentes.md`.
- Real NASA data were downloaded and curated by **code with automated tests**, not typed by AI; a test regenerates the curated files from the raw ones.
- AI-generated art, music or voices: **none registered** in `docs/ia-uso.md` ("Assets generated with AI: none yet"). The trailer in `pitch/trailer/` uses synthesized voice and music (edge-tts and ffmpeg synthesis); if the trailer is submitted, add that line. **POR VERIFICAR:** how the character portraits, the illustrated intro and the logo were made; each asset must be listed with its license in `assets/LICENCIAS.md`.
- **POR VERIFICAR:** the full per-person table of tools and models (see above) and `docs/modelos.md` "limit: to confirm".
- **POR VERIFICAR:** the official AI-policy text and whether it asks for prompts or logs.

---

## Versión en español

**Dentro del juego.** El modelo de lenguaje, si se usa, **solo clasifica** la frase del niño en JSON estricto `{experto, accion, parametros, confianza}`, de listas cerradas y validado con Zod. **No ve el estado del juego, no produce números ni consejos, no escribe texto para niños**: los expertos son código determinista con plantillas i18n, y los fallos de Iris los guionan reglas. El juego funciona completo sin API (botones, atajos y regex). La clave vive solo en el servidor (Cloudflare Worker), el Worker reenvía solo la frase (sin IP ni identificadores) y limita el uso por IP. No se guarda audio de menores.

**Evaluación real (D4, 13 nov 2026, 30 frases):** `qwen3.8-flash` 80,0 % de acción correcta, JSON válido 86,7 %, latencia p50 6,0 s y p95 15,0 s; `deepseek-v4.1-flash` 23,3 % (gastó el presupuesto de 80 tokens razonando y devolvió vacío). Ninguno cumplió p95 menor a 1,5 s, así que **por ahora no hay clasificador con modelo**; los atajos resuelven 28 de las 30 frases.

**Estado de la versión entregada:** la pantalla resuelve las frases con botones, atajos y regex; **no** llama al clasificador con modelo y **no tiene voz**. El Worker `/api/clasificar` está escrito y probado, pero no conectado (D4: sin modelo por ahora).

**Desarrollo asistido por IA.** Usamos agentes de código bajo revisión humana: Claude Code confirmado en `docs/ia-uso.md` (modelos Fable 5.x y Opus 5.5); OpenCode y Codex según `docs/modelos.md`, con la fila de cada persona por confirmar. Los agentes proponen mediante PR; **un humano revisa y hace el merge**. Los datos de NASA los descarga y cura código con pruebas.

**POR VERIFICAR:** estado final del clasificador el día de la entrega (hoy: sin modelo); tabla completa de herramientas por persona; texto oficial de la política de IA; cómo se hicieron retratos, intro y logo; voz y música del tráiler si se entrega (síntesis, no registradas); la fila "en el juego" de `docs/ia-uso.md`, que aún dice "por decidir".
