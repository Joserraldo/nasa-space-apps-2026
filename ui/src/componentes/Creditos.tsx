import { useEffect, useRef } from "react";
import { useT } from "../i18n.js";
import { DatosUsados } from "./DatosUsados.js";
import { FacetButton } from "./base/FacetButton.js";
import "./base/facetas.css";
import "./base/datos.css";

/**
 * "Sources & credits" de la portada (inicio/01, DISEÑO §6 capa 7): qué datos de NASA usamos y por qué,
 * con el aviso de proyecto no oficial. Diálogo modal: foco en "Close" al abrir, Escape cierra.
 */
export function Creditos({ onCerrar }: { onCerrar(): void }) {
  const { t } = useT();
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caja.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") onCerrar(); };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);
  return (
    <div className="creditos-fondo" onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}>
      <div ref={caja} className="creditos" role="dialog" aria-modal="true" aria-label={t("ui.portada.creditos")}>
        <div className="creditos-cerrar"><FacetButton labelKey="ui.comun.cerrar" onClick={onCerrar} /></div>
        <DatosUsados />
      </div>
    </div>
  );
}
