import { useMemo, useState } from "react";
import { escenaTormenta, irisDanada, verificarIris, type Falla } from "@solar-shield/agents";
import type { Action, GameState } from "@solar-shield/contracts";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { Burbuja, describirAccion } from "../componentes/Dialogos.js";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";

/**
 * Pasos 5 y 6: la tormenta real llega (pausa + tarjeta de fuente); dos expertos se contradicen;
 * Iris dañada da un número que no coincide con el medidor; el jugador verifica y decide.
 */
export function Tormenta({ estado, onDecidir }: { estado: GameState; onDecidir: (previas: Action[], opcionId: string) => void }) {
  const { t } = useT();
  // Las salidas del dilema vienen de la misión; el motor las aplica con elegirDilema().
  const opciones = MISION_JEZERO.dilemaPaso6.opciones;
  const escena = useMemo(() => escenaTormenta(estado, opciones), [estado.tormenta]);
  const iris = useMemo(() => (estado.iaBase === "danada" ? irisDanada(estado, 0) : null), [estado.iaBase, estado.rngEstado]);
  const [verificada, setVerificada] = useState<Falla | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const t0 = estado.tormenta!;
  if (!escena) return null;
  const verificacion = verificada ? verificarIris(verificada, estado) : null;

  return (
    <section className="tarjeta alerta columna" aria-live="assertive">
      <h2>☀ {t("ui.paso.5.titulo")}: {t(`datos.tormenta.${t0.id}.nombre`)}</h2>
      <p>{t(`datos.tormenta.${t0.id}.queOcurrio`)}</p>
      <TarjetaFuente fuente={t0.fuente} />

      <h2>{t("ui.paso.6.titulo")}</h2>
      {escena.dialogos.map((d, i) => <Burbuja key={i} d={d} />)}

      {iris && (
        <>
          <Burbuja d={iris} irisDanada />
          {!verificada && <div><button className="secundario" onClick={() => setVerificada(iris.falla)}>{t("ui.iris.verificar")}</button></div>}
          {verificacion && <Burbuja d={verificacion} />}
        </>
      )}

      <p><strong>{t("agentes.escena6.elige")}</strong></p>
      <div className="fila">
        {opciones.map((o) => (
          <button key={o.id} className={elegida === o.id ? "" : "secundario"} onClick={() => setElegida(o.id)} aria-pressed={elegida === o.id}>
            {describirAccion(o.accion, t)}
          </button>
        ))}
      </div>
      <div>
        <button disabled={!elegida} onClick={() => onDecidir(verificacion?.accion && verificada ? [verificacion.accion] : [], elegida!)}>
          {t("ui.continuar")}
        </button>
      </div>
    </section>
  );
}
