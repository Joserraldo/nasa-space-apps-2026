import { useT } from "../../i18n.js";

/**
 * Logo oficial (ui/00-logo-actual.png): es la única lámina que se usa como imagen (DISEÑO §8).
 * `ui/public/logo-solar-shield.png` es el mismo logo con el fondo quitado y recortado; las letras
 * no se redibujan. Blanco sobre transparente: va sobre `espacio` o sobre una placa índigo.
 */
export function LogoSolarShield({ className }: { className?: string | undefined }) {
  const { t } = useT();
  return <img className={className} src="/logo-solar-shield.png" width={622} height={366} alt={t("ui.portada.logo")} draggable={false} />;
}
