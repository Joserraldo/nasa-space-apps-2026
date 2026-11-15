/**
 * Tokens v8: la ÚNICA fuente de color, forma, tipografía y movimiento de la interfaz y del 3D.
 * Origen: docs/referenciapau/DISEÑO.md §2 (paleta) y §2.4 (tipografía), APLICACION.md §5 (átomos)
 * y §7 (animación). `tokens.css` declara las mismas variables y `tokens.test.ts` comprueba que
 * coincidan. Un hex suelto en cualquier otro archivo es un error de revisión (FLUJO §3).
 *
 * Los colores de UI son fijos (aprobados el 14 nov). Los de trajes y entorno se muestrearon de las
 * láminas y se calibran en la cámara real del juego: cambiarlos aquí los cambia en todas partes.
 */

/** UI y marca (DISEÑO §2.1). Los hex impresos en `ui/03` mandan sobre los píxeles de la lámina. */
export const UI = {
  marfil: "#F3EEE5",
  lila: "#EEE5F1",
  ciruela: "#53306D",
  cian: "#73D4E1",
  "indigo-texto": "#30255F",
  espacio: "#1C1248",
  ambar: "#F2B531",
} as const;

/** Colores de estado de la UI (DISEÑO §2.1.1, muestreados de `ui/03`). Nunca solos: siempre con icono y texto. */
export const ESTADO = {
  error: "#B33A3A",
  exito: "#237443",
  "aviso-texto": "#875000",
  deshabilitado: "#D9CFE1",
  "deshabilitado-texto": "#655570",
  "icono-energia": "#10D4E8",
  "icono-vida": "#47BE5B",
  "icono-escudo": "#1BCEE2",
  "exito-fondo": "#E8E7E3",
  "aviso-fondo": "#FCE5CB",
  "error-fondo": "#FBD7DA",
  "info-fondo": "#E5DAF3",
} as const;

/** Trajes y personajes (DISEÑO §2.2, muestreados de `personajes/00`, calibrar). */
export const TRAJES = {
  "traje-marfil": "#FCE6D6",
  teal: "#47AAB5",
  naranja: "#F88536",
  "ciruela-traje": "#94478B",
  "indigo-botas": "#675B95",
} as const;

/**
 * Entorno marciano (DISEÑO §2.3, muestreado de `mundo/01`, calibrar). `sombra-suelo` es el extremo
 * cálido: las sombras van de ahí a lila, nunca negras. El cielo de día NO está aquí: es el de MARTE.md §4.
 */
export const ENTORNO = {
  "regolito-claro": "#FA8D6F",
  "regolito-medio": "#B76A78",
  "roca-basalto": "#813E55",
  "sombra-suelo": "#F8B9B2",
  camino: "#BDAFC4",
  "montana-lejana": "#8975C6",
} as const;

/** Todos los colores en un solo objeto, por nombre de token. */
export const COLORES = { ...UI, ...ESTADO, ...TRAJES, ...ENTORNO } as const;
export type TokenColor = keyof typeof COLORES;

/** Número 0xRRGGBB para `THREE.Color` y materiales: `new THREE.Color(colorNum("regolito-claro"))`. */
export function colorNum(token: TokenColor): number {
  return Number.parseInt(COLORES[token].slice(1), 16);
}

/** El mismo color con transparencia, como hex de 8 dígitos (sombras teñidas de ciruela, nunca negras). */
export function conAlfa(token: TokenColor, alfa: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alfa)) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `${COLORES[token]}${a}`;
}

/**
 * Forma (DISEÑO §3.1 y §5.1): esquinas recortadas a 45° (octógono) en botones, placas, retratos y
 * tarjetas. El chaflán recorta la superficie INTERIOR; nunca la caja táctil ni el anillo de foco.
 */
export const FORMA = {
  "chaflan-chico": "8px",
  chaflan: "12px",
  "chaflan-grande": "18px",
  "borde-fino": "1px",
  borde: "2px",
  "foco-ancho": "3px",
  "foco-separacion": "3px",
  /** Área táctil mínima (DISEÑO §5.3). */
  "toque-minimo": "44px",
} as const;

/**
 * Sombras: bisel bajo y sombra suave teñida de ciruela (DISEÑO §5.1). Prohibidas las sombras difusas
 * grandes (§8). `presionada` es la de "pressed": menos sombra, sin mover el layout.
 */
export const SOMBRA = {
  bisel: `0 3px 0 ${conAlfa("ciruela", 0.3)}`,
  suave: `0 3px 0 ${conAlfa("ciruela", 0.3)}, 0 6px 14px ${conAlfa("ciruela", 0.16)}`,
  hover: `0 4px 0 ${conAlfa("ciruela", 0.3)}, 0 8px 16px ${conAlfa("ciruela", 0.18)}`,
  presionada: `0 1px 0 ${conAlfa("ciruela", 0.3)}`,
} as const;

/** Espaciado en escala de 4 px. */
export const ESPACIO = {
  "esp-1": "4px",
  "esp-2": "8px",
  "esp-3": "12px",
  "esp-4": "16px",
  "esp-5": "24px",
  "esp-6": "32px",
  "esp-7": "48px",
} as const;

/** Tipografía (DISEÑO §2.4): Nunito, servida desde el juego. Escala 1,25 sobre 18 px. */
export const TIPO = {
  familia: `"Nunito", system-ui, sans-serif`,
  "peso-cuerpo": "600",
  "peso-etiqueta": "700",
  "peso-titulo": "800",
  "peso-portada": "900",
  "tam-cuerpo": "18px",
  "tam-dialogo": "20px",
  "tam-subtitulo": "22px",
  "tam-placa": "22px",
  "tam-titulo": "28px",
  "tam-titulo-grande": "35px",
  "tam-portada": "28px",
  interlineado: "1.4",
} as const;

/** Duraciones de APLICACION §7. */
export const DURACION = {
  "dur-presionar": "70ms",
  "dur-salida-hover": "100ms",
  "dur-estado": "100ms",
  "dur-hover": "120ms",
  "dur-fundido": "120ms",
  "dur-cerrar": "140ms",
  "dur-seleccion": "140ms",
  "dur-realce": "180ms",
  "dur-aparecer": "220ms",
  "dur-alerta": "240ms",
  "dur-relleno": "280ms",
  "dur-instalando": "400ms",
  "dur-delta": "700ms",
} as const;

/** Curvas de APLICACION §7. */
export const CURVA = {
  "curva-entrada": "cubic-bezier(.2,.8,.2,1)",
  "curva-salida": "cubic-bezier(.4,0,1,1)",
} as const;

/**
 * Todas las variables CSS que declara `tokens.css`, con su prefijo. Los colores van como
 * `--color-<token>`; el resto como `--<token>`. Es lo que compara el test.
 */
export function variablesCss(): Record<string, string> {
  const v: Record<string, string> = {};
  for (const [k, hex] of Object.entries(COLORES)) v[`--color-${k}`] = hex;
  for (const grupo of [FORMA, ESPACIO, DURACION, CURVA]) for (const [k, x] of Object.entries(grupo)) v[`--${k}`] = x;
  for (const [k, x] of Object.entries(SOMBRA)) v[`--sombra-${k}`] = x;
  for (const [k, x] of Object.entries(TIPO)) v[`--tipo-${k}`] = x;
  return v;
}
