# How AI is used · Cómo se usa la IA

> **Borrador — un segundo humano lo revisa antes de enviar.**

The submission form asks how AI tools were used. The exact wording of the policy is **not confirmed** (it may say "SI" instead of "AI"; see `docs/reglas.md`), so this text covers both: (A) AI inside the game and (B) AI used to build it. Source of truth for (B) is the team log in `docs/ia-uso.md`.

## A. AI inside the game

**In one sentence:** a small language model may only turn a kid's typed or spoken phrase into a strict JSON label; everything the child reads or hears is written by people and produced by ordinary code.

### What the model does
- Input: **only the child's phrase**. It never receives the game state, resources, storm data, names or any identifier.
- Output: strict JSON `{ experto, accion, parametros, confianza }` (expert, action, parameters, confidence 0 to 1), chosen from **closed lists** (6 expert labels, 13 actions). Parameters are only enum words such as "little / medium / a lot" or an equipment name. It cannot output numbers.
- The reply is checked with **Zod** (`ClassifierOutputSchema`, `contracts/`). If the JSON is invalid, late (timeout 1.5 s) or the call fails, the game uses a safe fallback label ("off topic") and nothing breaks.
- Request settings: JSON-schema constrained decoding, `max_tokens` 80, temperature 0.
- If confidence is below 0.6, the character asks a follow-up question ("Do you mean the shield or the energy?").

### What the model never does
- It never writes text shown to children. The experts (Engineer, Radiation Doctor, Space Weather expert; the "What if?" mathematician is planned) are **deterministic code** that read the game state and NASA data and answer with **i18n templates** (English base, Spanish second). Nothing inappropriate can be generated.
- It never produces numbers, advice, science facts or "according to NASA" statements. Numbers come from the game state or the cited NASA data.
- Iris, the base AI, does not use the model to fail: her mistakes are **scripted by rules** (for example a number that does not match the gauge), so the lesson "verify before you obey" is controlled and repeatable.

### It works without the AI
The first layer is not a model: buttons, shortcuts and **regex** in English and Spanish (`clasificarConAtajos`). The team's 30 test phrases are resolved by these shortcuts in 28 cases (D4). If the API is down or switched off, the game plays the same, with buttons and text.

### Privacy and keys
- The API key lives only on the server side (a Cloudflare Worker environment variable; GitHub secret `BAI_API_KEY` for the repo). **Never in the browser or in the code.**
- The Worker forwards only the phrase: no IP, no identifiers. It rate-limits per IP (KV).
- **POR VERIFICAR:** the Worker is **not built yet** (`infra` task 2). Confirm before sending that the endpoint exists as described, or change this section to say the classifier is not part of the submitted build.
- **No audio of minors is stored.** Voice uses the browser's Web Speech API; speech is turned into text and discarded; the game keeps no recordings. Note that the browser itself (for example Chrome) may process speech on its own provider's service; that is why text and buttons always work. **POR VERIFICAR:** wording about browser processing.
- No accounts, no personal data. Progress is saved only in the player's own browser.

### Real evaluation results (D4, 2026-11-13)
We compared two small models on 30 children's phrases (1 pass each, 60 calls; script `agents/evals/correr.ts`, raw data in `agents/evals/resultados-2026-11-13.json`). Our rule was: choose the model with the most correct actions **and** p95 latency under 1.5 s.

| Model (via b.ai) | Valid JSON | Right expert | Right action | Right parameters | p50 / p95 latency |
|---|---|---|---|---|---|
| `qwen3.8-flash` | 86.7 % | 83.3 % | 80.0 % | 90.0 % | 6.0 s / 15.0 s |
| `deepseek-v4.1-flash` | 23.3 % | 23.3 % | 23.3 % | 66.7 % | 2.9 s / 3.2 s |

- Both models correctly marked the 2 off-topic phrases as "off topic".
- Neither met the latency rule. Both are "reasoning" models; with an 80-token limit, DeepSeek spent its whole budget thinking and returned empty answers, so its 23.3 % does not measure its real ability.
- **Decision recorded in D4: no model classifier for now.** The game ships on shortcuts, regex and buttons. The model stays an optional layer behind a Worker, to be reopened with reasoning turned off or a non-reasoning model.
- **POR VERIFICAR:** final state on submission day. Say exactly one of: (a) "the submitted build uses no language model" or (b) "an optional classifier is enabled" with the model name and a new eval result.

## B. AI-assisted development (honest account)

- The team built the game with **AI coding agents**: Claude Code (Anthropic) is confirmed in the team log for the orchestrator; OpenCode is available to everyone and Codex to one teammate (`docs/modelos.md`). Each person's main session ran a large model (Opus-class) and sent smaller tasks to smaller models.
- Agents helped write code, tests, data pipelines, documentation, and drafts of text (including these form drafts), each in their own role folder (`engine`, `agents`, `data`, `ui`, `design`, `infra`).
- **Humans decide and review.** Each person controls their own agent. Agents open issues and pull requests but **never merge**: a human merges after review (merge to `main` and `develop` is blocked for agents in `.claude/settings.json`). Design choices, the NASA data selection and the science wording were decided and checked by people. A separate science review of the expert texts is in `docs/science/revision-agentes.md`.
- Real NASA data were downloaded and curated by **code with automated tests**, not typed by AI; a test regenerates the curated files from the raw ones.
- AI-generated art, music or voices: **none registered** in the team log so far. **POR VERIFICAR:** update this line if `ui` adds any; each asset must be listed with its license in `assets/LICENCIAS.md`.
- **POR VERIFICAR:** the full per-person table of tools and models. `docs/ia-uso.md` has one confirmed row (Santiago, Claude Code, 2026-11-13) and one marked "to confirm with its author"; `docs/modelos.md` still has "limit: to confirm". Each teammate must confirm their own row.
- **POR VERIFICAR:** the official AI-policy text and whether it asks for prompts or logs.

---

## Versión en español

**Dentro del juego.** El modelo de lenguaje, si se usa, **solo clasifica** la frase del niño en JSON estricto `{experto, accion, parametros, confianza}`, de listas cerradas y validado con Zod. **No ve el estado del juego, no produce números ni consejos, no escribe texto para niños**: los expertos son código determinista con plantillas i18n, y los fallos de Iris los guionan reglas. El juego funciona completo sin API (botones, atajos y regex). La clave vive solo en el servidor (Cloudflare Worker), el Worker reenvía solo la frase (sin IP ni identificadores) y limita el uso por IP. No se guarda audio de menores.

**Evaluación real (D4, 13 nov 2026, 30 frases):** `qwen3.8-flash` 80,0 % de acción correcta, JSON válido 86,7 %, latencia p50 6,0 s y p95 15,0 s; `deepseek-v4.1-flash` 23,3 % (gastó el presupuesto de 80 tokens razonando y devolvió vacío). Ninguno cumplió p95 menor a 1,5 s, así que **por ahora no hay clasificador con modelo**; los atajos resuelven 28 de las 30 frases.

**Desarrollo asistido por IA.** Usamos agentes de código (Claude Code, OpenCode, Codex) bajo revisión humana. Los agentes proponen mediante PR; **un humano revisa y hace el merge**. Los datos de NASA los descarga y cura código con pruebas.

**POR VERIFICAR:** si el Worker existe en la versión entregada; estado final del clasificador (con o sin modelo); tabla completa de herramientas por persona; texto oficial de la política de IA; wording sobre el reconocimiento de voz del navegador; assets generados con IA (ninguno registrado).
