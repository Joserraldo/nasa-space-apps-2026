import { useEffect, useState } from "react";
import { useT } from "../i18n.js";
import { useMundo } from "../pantallas/MundoBase.js";
import { useModoTactil } from "./ControlesTactiles.js";
import { FacetButton } from "./base/FacetButton.js";
import { TarjetaDelFlujo } from "./TarjetaDelFlujo.js";

/**
 * Controles que existen de verdad (A5 salto, A12 mirar con el mouse, E2 `[E]`, cámara `V`; gestos de
 * ESCENAS §3.5: mitad izquierda mueve con el joystick, mitad derecha mira). Si cambia uno, cambia aquí.
 */
export const CONTROLES_TECLADO = ["mover", "mirar", "saltar", "usar", "camara"] as const;
export const CONTROLES_TACTILES = ["mover", "mirar", "saltar", "usar", "camara"] as const;

/**
 * E8, momento 04 de `inicio/04` ("Ready to explore"): la primera vez que el niño llega a la base, una
 * tarjeta contextual (E1) dice "Your crew is ready" y ofrece `Explore the base` y `Show controls`. Con la
 * tarjeta abierta el mundo no se mueve; al explorar, se cierra y el niño camina. No toca el motor.
 */
export function ListoParaExplorar({ onExplorar }: { onExplorar(): void }) {
  const { t } = useT();
  const mundo = useMundo();
  const tactil = useModoTactil();
  const [controles, setControles] = useState(false);
  useEffect(() => {
    mundo.fijarBloqueado(true);
    return () => mundo.fijarBloqueado(false);
  }, [mundo.fijarBloqueado]);
  const lista = tactil ? CONTROLES_TACTILES : CONTROLES_TECLADO;
  return (
    <TarjetaDelFlujo abierta onCerrar={onExplorar} titulo={t("ui.listo.titulo")}
      acciones={<>
        <FacetButton variant="primary" icon="jugar" labelKey="ui.listo.explorar" onClick={onExplorar} />
        <FacetButton labelKey={controles ? "ui.listo.ocultar" : "ui.listo.controles"} selected={controles || undefined}
          onClick={() => setControles((c) => !c)} />
      </>}>
      {controles && (
        <ul id="listo-controles" aria-label={t("ui.listo.controles")}>
          {lista.map((c) => <li key={c}>{t(`ui.controles.${tactil ? "tactil." : ""}${c}`)}</li>)}
        </ul>
      )}
    </TarjetaDelFlujo>
  );
}
