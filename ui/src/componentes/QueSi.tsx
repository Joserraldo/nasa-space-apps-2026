import { useState } from "react";
import { compararOpciones, conAvisoUsos, sinUsosMatematico, type Dialogo } from "@solar-shield/agents";
import type { Action, BaseAction, GameState } from "@solar-shield/contracts";
import { aplicarAccion } from "@solar-shield/engine";
import { misionActiva } from "../juego/misiones.js";
import { useT } from "../i18n.js";
import { Burbuja } from "./Dialogos.js";

/**
 * Botón "¿Y si…?" del Matemático para las opciones de una escena (tormenta, polvo).
 * Los números salen del motor (`aplicarAccion` es puro); agentes solo compara. Los usos los
 * lleva el motor en `simulacionesRestantes`: cada comparación se registra con `onSimular`.
 */
export function QueSi({ estado, opciones, onSimular }: { estado: GameState; opciones: readonly Action[]; onSimular?: ((a: Action) => void) | undefined }) {
  const { t } = useT();
  const [d, setD] = useState<Dialogo | null>(null);
  function calcular() {
    if (estado.simulacionesRestantes === 0) return setD(sinUsosMatematico());
    const comparacion = compararOpciones(estado, opciones.map((accion) => ({ accion, despues: aplicarAccion(estado, accion, misionActiva()) })));
    const restantes = estado.simulacionesRestantes === null ? null : estado.simulacionesRestantes - 1;
    setD(conAvisoUsos(comparacion, restantes));
    onSimular?.({ tipo: "simular", accion: opciones[0] as BaseAction });
  }
  return (
    <>
      <div><button className="secundario" onClick={calcular}>= {t("ui.quesi.boton")}</button></div>
      {d && <Burbuja d={d} />}
    </>
  );
}
