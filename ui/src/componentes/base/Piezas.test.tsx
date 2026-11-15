import { readFileSync } from "node:fs";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PendingEffect } from "@solar-shield/contracts";
import { aplicarAccion, partidaDorada } from "@solar-shield/engine";
import { IdiomaContext, type Idioma } from "../../i18n.js";
import { ConfirmarAccion } from "./ConfirmarAccion.js";
import { CostRow, EfectoPendiente, Mensaje, ResourcePlaque } from "./Piezas.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);
const pend = (p: Partial<PendingEffect>): PendingEffect => ({ id: "x", aplicaEnTick: 3, recurso: "energia", delta: 14, origen: "decision", descripcionKey: "causa.colocar_modulo", oculto: false, ...p });

describe("ResourcePlaque: valor real, separada por recurso", () => {
  it("medidor accesible con el valor real redondeado y el nombre traducido", () => {
    const h = html(<ResourcePlaque recurso="energia" value={70.4} />);
    expect(h).toContain(`role="meter"`);
    expect(h).toContain(`aria-valuenow="70"`);
    expect(h).toContain(`aria-label="Energy"`);
    expect(html(<ResourcePlaque recurso="energia" value={70} />, "es")).toContain(`aria-label="Energía"`);
  });

  it("bajo el umbral lo dice con icono y texto, no solo con color", () => {
    const h = html(<ResourcePlaque recurso="blindaje" value={12} />);
    expect(h).toContain("placa-bajo");
    expect(h).toContain(">Low<");
    expect(h).toContain(`aria-valuetext="12, low"`);
    expect(html(<ResourcePlaque recurso="blindaje" value={60} />)).not.toContain("placa-bajo");
  });

  it("suma lo que viene en camino de su recurso; lo oculto y lo de otros recursos no se muestra", () => {
    const h = html(<ResourcePlaque recurso="energia" value={50} pending={[pend({}), pend({ id: "y", delta: 4 }), pend({ id: "z", recurso: "blindaje" }), pend({ id: "o", oculto: true, delta: 99 })]} />);
    expect(h).toContain("+18 on the way");
  });

  it("los cambios llegan con su causa y su signo", () => {
    const h = html(<ResourcePlaque recurso="energia" value={44} feedback={[{ id: "1", delta: -6, causaKey: "ui.comun.costo.ahora" }]} />);
    expect(h).toContain(`delta-menos">-6 Costs now<`);
  });
});

describe("CostRow, mensajes y efecto pendiente", () => {
  it("costo ahora y después en bloques separados, con signos y colores de estado", () => {
    const h = html(<CostRow inmediato={{ energia: -6, soporte_vital: -3 }} retrasado={{ energia: 14 }} />);
    expect(h.indexOf("Costs now")).toBeLessThan(h.indexOf("Later"));
    expect(h).toContain(`delta delta-menos">-6<`);
    expect(h).toContain(`delta delta-menos">-3<`);
    expect(h).toContain(`delta delta-mas">+14<`);
  });

  it("cada mensaje lleva icono, el tipo dicho en texto para el lector y el rol correcto", () => {
    const e = html(<Mensaje tipo="error" tituloKey="ui.comun.motivo.recursos_insuficientes.energia" />);
    expect(e).toContain(`role="alert"`);
    expect(e).toContain("Problem:");
    expect(html(<Mensaje tipo="exito" tituloKey="ui.comun.confirmar" />)).toContain(`role="status"`);
  });

  it("el pendiente dice cuánto, de qué y en cuántos turnos; si está oculto no lo revela", () => {
    expect(html(<EfectoPendiente efecto={pend({})} tick={1} />)).toContain("+14 Energy in 2 turns");
    const oculto = html(<EfectoPendiente efecto={pend({ oculto: true })} tick={1} />);
    expect(oculto).toContain("Something is on the way");
    expect(oculto).not.toContain("+14");
  });
});

describe("ConfirmarAccion: un solo camino de confirmación", () => {
  const nada = () => {};
  it("muestra los costos que da el motor para la acción", () => {
    const h = html(<ConfirmarAccion estado={partidaDorada()} accion={{ tipo: "colocar_modulo", modulo: "panel_solar" }} onCancelar={nada} onConfirmar={nada} />);
    expect(h).toContain(`role="dialog"`);
    expect(h).toContain(`delta delta-menos">-6<`);
    expect(h).toContain(`delta delta-mas">+14<`);
    expect(h).not.toContain(`aria-disabled="true"`);
  });

  it("si el motor no deja, el botón queda no disponible con el motivo real", () => {
    const base = partidaDorada();
    const pobre = { ...base, recursos: { ...base.recursos, energia: 5 } };
    const h = html(<ConfirmarAccion estado={pobre} accion={{ tipo: "reparar", equipo: "ia_base" }} onCancelar={nada} onConfirmar={nada} />);
    expect(h).toContain(`aria-disabled="true"`);
    expect(h).toContain("Not enough energy");
    let s = aplicarAccion(base, { tipo: "colocar_modulo", modulo: "panel_solar" });
    s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" });
    expect(html(<ConfirmarAccion estado={s} accion={{ tipo: "colocar_modulo", modulo: "antena" }} onCancelar={nada} onConfirmar={nada} />)).toContain("can&#x27;t build this module");
  });
});

describe("facetas.css solo usa tokens", () => {
  it("ningún color literal", () => {
    const css = readFileSync(new URL("./facetas.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
  });
});
