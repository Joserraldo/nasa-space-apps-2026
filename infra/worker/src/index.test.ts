import { describe, expect, it } from "vitest";
import { enrutar, type Env } from "./index.js";

const pantalla = { fetch: async () => new Response("<html>ui</html>", { headers: { "content-type": "text/html" } }) };
const env = (extra: Partial<Env> = {}): Env => ({ ASSETS: pantalla, ENTORNO: "preview", ...extra });

describe("Worker: rutas", () => {
  it("lo que no es /api/ lo sirve la pantalla", async () => {
    const r = await enrutar(new Request("https://x.dev/"), env());
    expect(await r.text()).toContain("ui");
  });

  it("/api/health responde sin revelar claves", async () => {
    const r = await enrutar(new Request("https://x.dev/api/health"), env({ BAI_API_KEY: "secreta-de-prueba" }));
    const cuerpo = await r.json();
    expect(cuerpo).toEqual({ ok: true, entorno: "preview", modelo: true, baseDeDatos: false });
    expect(JSON.stringify(cuerpo)).not.toContain("secreta-de-prueba");
  });

  it("una ruta /api/ desconocida da 404 en JSON", async () => {
    const r = await enrutar(new Request("https://x.dev/api/nada"), env());
    expect(r.status).toBe(404);
  });

  it("/api/clasificar sigue funcionando a través del router (atajo sin modelo)", async () => {
    const r = await enrutar(
      new Request("https://x.dev/api/clasificar", { method: "POST", body: JSON.stringify({ texto: "sube el escudo" }) }),
      env(),
    );
    expect(r.status).toBe(200);
  });
});
