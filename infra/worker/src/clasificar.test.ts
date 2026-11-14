import { describe, expect, it, vi } from "vitest";
import { ClassifierOutputSchema } from "@solar-shield/contracts";
import { LIMITE_POR_MINUTO, manejar, type Limitador } from "./clasificar.js";

const pedir = (cuerpo: unknown, ip = "203.0.113.7") =>
  new Request("https://x/api/clasificar", { method: "POST", body: JSON.stringify(cuerpo), headers: { "cf-connecting-ip": ip } });

// Limitador falso con el mismo contrato que el binding "ratelimits" de Cloudflare.
function limitadorFalso(): Limitador & { llaves: Map<string, number> } {
  const llaves = new Map<string, number>();
  return {
    llaves,
    limit: async ({ key }) => {
      const n = (llaves.get(key) ?? 0) + 1;
      llaves.set(key, n);
      return { success: n <= LIMITE_POR_MINUTO };
    },
  };
}

// Modelo falso: nunca se llama a la API real (sin costo).
const modelo = (contenido: object) =>
  vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(contenido) } }], usage: { total_tokens: 9 } })));

describe("Worker /api/clasificar", () => {
  it("los atajos responden sin llamar al modelo", async () => {
    const f = modelo({});
    const r = await manejar(pedir({ texto: "sube el escudo" }), { BAI_API_KEY: "k" }, f);
    expect(ClassifierOutputSchema.parse(await r.json()).fuente).toBe("regex");
    expect(f).not.toHaveBeenCalled();
  });
  it("al modelo solo le llega la frase, nunca la IP ni la clave en el cuerpo", async () => {
    const f = modelo({ experto: "doctora", accion: "estado_salud", parametros: {}, confianza: 0.8 });
    const r = await manejar(pedir({ texto: "me siento rarito en la nave" }), { BAI_API_KEY: "clave-falsa" }, f);
    expect(r.status).toBe(200);
    const cuerpo = String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body);
    expect(cuerpo).toContain("me siento rarito");
    expect(cuerpo).not.toContain("203.0.113.7");
    expect(cuerpo).not.toContain("clave-falsa");
  });
  it("sin clave devuelve el respaldo y el juego sigue", async () => {
    const r = await manejar(pedir({ texto: "blablabla zzz" }), {});
    expect(ClassifierOutputSchema.parse(await r.json()).confianza).toBe(0);
  });
  it("rechaza texto vacío, muy largo o método distinto de POST", async () => {
    expect((await manejar(pedir({ texto: "" }), {})).status).toBe(400);
    expect((await manejar(pedir({ texto: "a".repeat(201) }), {})).status).toBe(400);
    expect((await manejar(new Request("https://x/api/clasificar"), {})).status).toBe(405);
  });
  it("los atajos no gastan cupo del límite", async () => {
    const lim = limitadorFalso();
    for (let i = 0; i < LIMITE_POR_MINUTO + 5; i++) expect((await manejar(pedir({ texto: "sube el escudo" }), { LIMITADOR: lim })).status).toBe(200);
    expect(lim.llaves.size).toBe(0);
  });
  it("limita por IP sin guardar la IP en claro", async () => {
    const lim = limitadorFalso();
    for (let i = 0; i < LIMITE_POR_MINUTO; i++) expect((await manejar(pedir({ texto: "blablabla zzz" }), { LIMITADOR: lim })).status).toBe(200);
    expect((await manejar(pedir({ texto: "blablabla zzz" }), { LIMITADOR: lim })).status).toBe(429);
    expect([...lim.llaves.keys()].join()).not.toContain("203.0.113.7");
    // Otra IP no se ve afectada.
    expect((await manejar(pedir({ texto: "blablabla zzz" }, "198.51.100.9"), { LIMITADOR: lim })).status).toBe(200);
  });
});
