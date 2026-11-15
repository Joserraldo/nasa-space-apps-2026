/**
 * Iconos facetados propios (DISEÑO §8: nada de Lucide, Heroicons ni emojis). Cada uno es un SVG de
 * polígonos en una caja de 24 x 24, dibujado como los de las láminas `ui/02` y `ui/03`. Colores solo
 * por variables de tokens; los neutros usan `currentColor` para heredar el texto.
 * Un icono nunca es la única etiqueta: siempre va con texto al lado, por eso es `aria-hidden`.
 */

export type NombreIcono =
  | "tripulacion" | "mapa" | "check" | "check_exito" | "microfono" | "energia" | "vida" | "escudo"
  | "aviso" | "error" | "reloj" | "enlace" | "atras"
  | "jugar" | "candado" | "engranaje" | "sonido_off" | "sonido_on" | "planeta" | "satelite" | "llave" | "sol";

const C = "currentColor";

const DIBUJOS: Record<NombreIcono, JSX.Element> = {
  tripulacion: (
    <g fill={C}>
      <polygon points="7,3 10,3 11.5,5 11.5,8 10,10 7,10 5.5,8 5.5,5" />
      <polygon points="2,20 2.8,14.5 5,12 12,12 14.2,14.5 15,20" />
      <polygon points="15,4.5 17.5,4.5 18.8,6.2 18.8,8.8 17.5,10.5 15,10.5 13.8,8.8 13.8,6.2" opacity="0.85" />
      <polygon points="15.6,20 15.2,14.8 14.2,12.6 19.5,12.6 21.3,14.6 22,20" opacity="0.85" />
    </g>
  ),
  mapa: (
    <g fill={C}>
      <polygon fillRule="evenodd" points="12,2 16.5,3.8 18.5,8 17.6,12.5 12,22 6.4,12.5 5.5,8 7.5,3.8" />
      <polygon fill="var(--color-marfil)" points="12,5.6 14.3,6.6 15.2,8.8 14.3,11 12,12 9.7,11 8.8,8.8 9.7,6.6" />
    </g>
  ),
  check: <polygon fill="var(--color-teal)" points="3,12.5 6.2,9.4 9.8,13 18,4.8 21.2,8 9.8,19.4" />,
  check_exito: <polygon fill="var(--color-exito)" points="3,12.5 6.2,9.4 9.8,13 18,4.8 21.2,8 9.8,19.4" />,
  microfono: (
    <g fill={C}>
      <polygon points="9,2.5 15,2.5 16,4 16,11.5 15,13 9,13 8,11.5 8,4" />
      <polygon points="5,10 6.8,10 6.8,12 8.6,14.6 12,15.6 15.4,14.6 17.2,12 17.2,10 19,10 19,12.6 16.6,16.2 13,17.4 13,20 16,20 16,22 8,22 8,20 11,20 11,17.4 7.4,16.2 5,12.6" />
    </g>
  ),
  energia: <polygon fill="var(--color-icono-energia)" points="14,1.5 5,13.5 11,13.5 9.5,22.5 19,9.5 13,9.5" />,
  vida: (
    <g fill="var(--color-icono-vida)">
      <polygon points="11,22 11,13 13,13 13,22" />
      <polygon points="12,13.5 6.5,13 3,9.5 3,5 8,5.5 11.5,9" />
      <polygon points="12.5,12 13,7.5 16.5,3.5 21,3 21,7.5 17,11.5" />
    </g>
  ),
  escudo: (
    <polygon fill="none" stroke="var(--color-icono-escudo)" strokeWidth="2.4" strokeLinejoin="miter"
      points="12,2.5 20,5.2 19.6,12.5 16.8,17.6 12,21.2 7.2,17.6 4.4,12.5 4,5.2" />
  ),
  aviso: (
    <g>
      <polygon fill="var(--color-ambar)" points="12,2.5 22.5,20.5 1.5,20.5" />
      <polygon fill="var(--color-indigo-texto)" points="10.9,8 13.1,8 12.7,14.5 11.3,14.5" />
      <polygon fill="var(--color-indigo-texto)" points="11,16 13,16 13,18 11,18" />
    </g>
  ),
  error: <polygon fill="var(--color-error)" points="5,3 12,10 19,3 21,5 14,12 21,19 19,21 12,14 5,21 3,19 10,12 3,5" />,
  reloj: (
    <g>
      <polygon fill="none" stroke={C} strokeWidth="2.2" points="8.3,2.5 15.7,2.5 21,7.8 21,15.2 15.7,20.5 8.3,20.5 3,15.2 3,7.8" />
      <polygon fill={C} points="11,6 13,6 13,11 16.5,13 15.5,14.7 11,12.2" />
    </g>
  ),
  enlace: (
    <g fill={C}>
      <polygon points="3,5 11,5 11,7 5,7 5,19 17,19 17,13 19,13 19,21 3,21" />
      <polygon points="13,3 21,3 21,11 19,11 19,6.4 11.7,13.7 10.3,12.3 17.6,5 13,5" />
    </g>
  ),
  jugar: <polygon fill={C} points="6,3 20,12 6,21" />,
  candado: (
    <g fill={C}>
      <polygon fillRule="evenodd" points="7,10 7,6.5 9,3.5 15,3.5 17,6.5 17,10 15,10 15,7.2 14,5.6 10,5.6 9,7.2 9,10" />
      <polygon points="4.5,10 19.5,10 19.5,20 18,21.5 6,21.5 4.5,20" />
    </g>
  ),
  engranaje: (
    <g fill={C}>
      <polygon fillRule="evenodd" points="10.4,1.8 13.6,1.8 14.2,4.6 16.4,5.6 18.8,4 21,6.2 19.4,8.6 20.4,10.8 23.2,11.4 23.2,14.6 20.4,15.2 19.4,17.4 21,19.8 18.8,22 16.4,20.4 14.2,21.4 13.6,24 10.4,24 9.8,21.4 7.6,20.4 5.2,22 3,19.8 4.6,17.4 3.6,15.2 0.8,14.6 0.8,11.4 3.6,10.8 4.6,8.6 3,6.2 5.2,4 7.6,5.6 9.8,4.6" transform="translate(0,-0.9)" />
      <polygon fill="var(--color-marfil)" points="10.3,9 13.7,9 15.6,10.9 15.6,14.3 13.7,16.2 10.3,16.2 8.4,14.3 8.4,10.9" transform="translate(0,-0.6)" />
    </g>
  ),
  sonido_off: (
    <g fill={C}>
      <polygon points="2,9 6,9 11,4.5 11,19.5 6,15 2,15" />
      <polygon points="14,8.4 15.4,7 18,9.6 20.6,7 22,8.4 19.4,11 22,13.6 20.6,15 18,12.4 15.4,15 14,13.6 16.6,11" />
    </g>
  ),
  sonido_on: (
    <g fill={C}>
      <polygon points="2,9 6,9 11,4.5 11,19.5 6,15 2,15" />
      <polygon points="14,8 15.4,7 17.2,9.6 17.2,14.4 15.4,17 14,16 15.4,13.6 15.4,10.4" />
      <polygon points="17.6,5 19.2,4 21.8,8.2 21.8,15.8 19.2,20 17.6,19 19.8,15.2 19.8,8.8" />
    </g>
  ),
  planeta: (
    <g>
      <polygon fill="var(--color-regolito-claro)" points="9,4 15,4 19,8 19,15 15,19 9,19 5,15 5,8" />
      <polygon fill="var(--color-roca-basalto)" points="9,8 12,7 13,10 10,11" />
      <polygon fill="none" stroke="var(--color-ciruela)" strokeWidth="1.6" points="1.5,14 6,11.2 18,9.6 22.5,10.6 18,13.4 6,15" />
    </g>
  ),
  satelite: (
    <g>
      <polygon fill={C} points="9.5,8.5 14.5,8.5 15.5,10 15.5,14 14.5,15.5 9.5,15.5 8.5,14 8.5,10" />
      <polygon fill="var(--color-icono-escudo)" points="1,9 7,9 7,15 1,15" />
      <polygon fill="var(--color-icono-escudo)" points="17,9 23,9 23,15 17,15" />
      <polygon fill={C} points="11.2,2.5 12.8,2.5 12.8,8.5 11.2,8.5" />
    </g>
  ),
  llave: <polygon fill="var(--color-teal)" points="4,18 13,9 12,6 15,3 19,3 17,6 18,8 21,7 21,11 18,13 15,12 6,21" />,
  sol: (
    <g fill="var(--color-ambar)">
      <polygon points="9.5,7 14.5,7 17,9.5 17,14.5 14.5,17 9.5,17 7,14.5 7,9.5" />
      <polygon points="11,1 13,1 13,5 11,5" /><polygon points="11,19 13,19 13,23 11,23" />
      <polygon points="1,11 5,11 5,13 1,13" /><polygon points="19,11 23,11 23,13 19,13" />
      <polygon points="3.6,5 5,3.6 7.8,6.4 6.4,7.8" /><polygon points="16.2,17.6 17.6,16.2 20.4,19 19,20.4" />
      <polygon points="19,3.6 20.4,5 17.6,7.8 16.2,6.4" /><polygon points="5,20.4 3.6,19 6.4,16.2 7.8,17.6" />
    </g>
  ),
  atras: <polygon fill={C} points="10,4 12,6 7.4,10.6 21,10.6 21,13.4 7.4,13.4 12,18 10,20 2,12" />,
};

export function Icono({ nombre, tam = 24, className }: { nombre: NombreIcono; tam?: number; className?: string }) {
  return (
    <svg className={className} width={tam} height={tam} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {DIBUJOS[nombre]}
    </svg>
  );
}

export const NOMBRES_ICONO = Object.keys(DIBUJOS) as NombreIcono[];
