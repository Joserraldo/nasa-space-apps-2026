import { describe, expect, it } from "vitest";
import { CLASSIFIER_FALLBACK } from "@solar-shield/contracts";
import { clasificarConModelo } from "./clasificador.js";

const base = { baseUrl: "https://x.test/v1", apiKey: "k", model: "m" };
const ok = (content: string, status = 200) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }], usage: { total_tokens: 7 } }), { status });

describe("clasificarConModelo", () => {
  it("acepta JSON válido y fuerza fuente/version", async () => {
    const f = (async () => ok('{"experto":"ingeniera","accion":"reparar","parametros":{"equipo":"antena"},"confianza":0.9,"fuente":"atajo"}')) as typeof fetch;
    const r = await clasificarConModelo("arregla la antena", { ...base, fetch: f });
    expect(r.valido).toBe(true);
    expect(r.salida).toMatchObject({ accion: "reparar", fuente: "modelo", version: "0" });
    expect(r.tokens).toBe(7);
  });
  it("JSON roto -> respaldo", async () => {
    const f = (async () => ok("hola soy un modelo")) as typeof fetch;
    const r = await clasificarConModelo("x", { ...base, fetch: f });
    expect(r.valido).toBe(false);
    expect(r.salida).toEqual(CLASSIFIER_FALLBACK);
  });
  it("timeout -> respaldo", async () => {
    const f = ((_u: string, init: RequestInit) =>
      new Promise((_res, rej) => init.signal!.addEventListener("abort", () => rej(Object.assign(new Error("a"), { name: "AbortError" }))))) as unknown as typeof fetch;
    const r = await clasificarConModelo("x", { ...base, fetch: f, timeoutMs: 20 });
    expect(r.error).toBe("timeout");
    expect(r.salida).toEqual(CLASSIFIER_FALLBACK);
  });
  it("400 en json_schema -> reintenta con json_object", async () => {
    const formatos: string[] = [];
    const f = (async (_u: string, init: RequestInit) => {
      const t = JSON.parse(init.body as string).response_format.type as string;
      formatos.push(t);
      return t === "json_schema" ? new Response("{}", { status: 400 }) : ok('{"experto":"ia_base","accion":"saludo","parametros":{},"confianza":0.8}');
    }) as unknown as typeof fetch;
    const logs: string[] = [];
    const r = await clasificarConModelo("hola", { ...base, fetch: f, log: (m) => logs.push(m) });
    expect(formatos).toEqual(["json_schema", "json_object"]);
    expect(r).toMatchObject({ valido: true, usoJsonObject: true });
    expect(logs).toHaveLength(1);
  });
  it("no filtra la clave en el resultado", async () => {
    const f = (async () => new Response("{}", { status: 500 })) as typeof fetch;
    const r = await clasificarConModelo("x", { ...base, apiKey: "SECRETO", fetch: f });
    expect(JSON.stringify(r)).not.toContain("SECRETO");
  });
});
