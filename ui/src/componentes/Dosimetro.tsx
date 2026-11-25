import { useT } from "../i18n.js";
import type { DatosDosimetro } from "../juego/dosis.js";
import { Pildora } from "./base/Pildoras.js";

/** Un decimal como máximo; sin `limite` no hay barra ni porcentaje, solo la lectura. */
const unDecimal = (x: number) => Number(x.toFixed(1));

/**
 * Dosímetro del HUD: una píldora con la dosis de la tripulación, el límite de entrenamiento de la
 * misión, la tasa del turno y si la protección cubre el turno siguiente. El valor siempre va en
 * texto (no solo en color) y el lector de pantalla recibe la frase completa.
 */
export function Dosimetro({ datos }: { datos: DatosDosimetro }) {
  const { t } = useT();
  const dosis = unDecimal(datos.dosis);
  const texto = datos.limite !== undefined
    ? t("ui.dosimetro.con_limite", { dosis, limite: unDecimal(datos.limite) })
    : t("ui.dosimetro.sin_limite", { dosis });
  const tasa = datos.tasa !== undefined ? t("ui.dosimetro.tasa", { tasa: unDecimal(datos.tasa) }) : undefined;
  const protegido = datos.protegido ? t("ui.dosimetro.protegido") : undefined;
  const completo = [texto, tasa, protegido].filter(Boolean).join(" · ");
  return (
    <p role="status" aria-live="polite" aria-label={completo}>
      <Pildora className="hud-dosimetro">
        <span>{texto}</span>
        {tasa && <span> · {tasa}</span>}
        {protegido && <span> · {protegido}</span>}
      </Pildora>
    </p>
  );
}
