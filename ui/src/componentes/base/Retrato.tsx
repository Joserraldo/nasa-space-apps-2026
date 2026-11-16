import { useEffect, useState } from "react";

/**
 * Retratos de diálogo (DISEÑO §4.4, F1). Los cuatro tripulantes usan las caras de la alternativa B
 * (láminas de expresiones de María Paula), cortadas y optimizadas por `tests/capturas/retratos.mjs` en
 * WebP de 160 y 320 px: el navegador baja solo el ancho que necesita el tamaño en pantalla. Iris, que no
 * tiene lámina, y cualquier retrato cuya imagen no cargue usan el SVG facetado de abajo (solo polígonos
 * y colores de tokens). Una cara nunca reemplaza una cifra: el retrato es decorativo (`aria-hidden`),
 * el nombre y el texto van al lado.
 */

export type Persona = "nino" | "ingeniera" | "doctora" | "meteorologa" | "ia_base";
/** `pensando` es "curious" en el niño y "thinking" en las adultas (las láminas usan las dos palabras). */
export type Expresion = "neutral" | "feliz" | "pensando" | "preocupada" | "habla_cerrada" | "habla_abierta" | "habla_redonda" | "parpadeo";
export const EXPRESIONES: readonly Expresion[] = ["neutral", "feliz", "pensando", "preocupada", "habla_cerrada", "habla_abierta", "habla_redonda", "parpadeo"];
export const PERSONAS: readonly Persona[] = ["nino", "ingeniera", "doctora", "meteorologa", "ia_base"];

const v = (token: string) => `var(--color-${token})`;
const mezcla = (a: string, b: string, pa: number) => `color-mix(in srgb, ${v(a)} ${pa}%, ${v(b)})`;

/**
 * Humanos (DISEÑO §4.4, láminas personajes/02, 04, 06 y 09): cabeza grande en tres cuartos hacia la
 * derecha, dentro de un casco que es un disco lila DETRÁS de la cabeza (la cara se ve con su color),
 * con aro claro y brillo arriba a la izquierda. Pelo con volumen en dos o tres tonos, ojos altos y
 * oscuros, cejas gruesas, aro teal del cuello con volumen y luz cian grande en el pecho.
 * Luz desde arriba a la izquierda (DISEÑO §3.3): las caras de la derecha y de abajo van más oscuras.
 */
type Rol = Exclude<Persona, "ia_base">;

const sombra = (token: string, pct = 22) => `color-mix(in srgb, ${v(token)} ${100 - pct}%, ${v("ciruela")})`;
const luz = (token: string, pct = 25) => `color-mix(in srgb, ${v(token)} ${100 - pct}%, ${v("marfil")})`;

/** Ojos (izquierdo y derecho, en tres cuartos el derecho queda un poco más chico). */
const OJOS = [[99, 99, 1], [125, 98, 0.92]] as const;

function Ojos({ e, cerrar }: { e: Expresion; cerrar: boolean }) {
  const tinta = v("indigo-texto");
  if (e === "parpadeo" || cerrar) {
    return <g>{OJOS.map(([x, y]) => <polyline key={x} points={`${x - 6},${y} ${x},${y + 4} ${x + 6},${y}`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}</g>;
  }
  // Feliz: un poco más bajos (las mejillas suben). Preocupada y pensando: igual de altos.
  const alto = e === "feliz" || e === "habla_abierta" ? 6.5 : 8;
  return (
    <g>
      {OJOS.map(([x, y, k]) => (
        <g key={x}>
          <polygon fill={tinta} points={`${x - 3 * k},${y - alto} ${x + 3 * k},${y - alto} ${x + 4.5 * k},${y - alto + 3} ${x + 4.5 * k},${y + alto - 3} ${x + 3 * k},${y + alto} ${x - 3 * k},${y + alto} ${x - 4.5 * k},${y + alto - 3} ${x - 4.5 * k},${y - alto + 3}`} />
        </g>
      ))}
    </g>
  );
}

function Cejas({ e, color }: { e: Expresion; color: string }) {
  const [iz, de] = e === "preocupada"
    ? ["91,86 105,81", "119,81 133,86"]
    : e === "pensando"
      ? ["91,85 105,85", "118,80 133,78"]
      : ["91,84 105,82", "118,82 133,84"];
  return <g stroke={color} strokeWidth="4.5" strokeLinecap="round">{[iz, de].map((p) => <polyline key={p} points={p} fill="none" />)}</g>;
}

function Boca({ e }: { e: Expresion }) {
  const tinta = v("indigo-texto");
  const dentro = v("roca-basalto");
  const lengua = v("regolito-claro");
  const x = 114, y = 119;
  switch (e) {
    case "feliz":
    case "habla_abierta":
      return (
        <g>
          <polygon points={`${x - 11},${y - 3} ${x + 11},${y - 3} ${x + 8},${y + 6} ${x},${y + 10} ${x - 8},${y + 6}`} fill={dentro} stroke={tinta} strokeWidth="1.6" strokeLinejoin="round" />
          <polygon points={`${x - 5},${y + 6} ${x + 5},${y + 6} ${x + 3},${y + 9} ${x - 3},${y + 9}`} fill={lengua} />
        </g>
      );
    case "habla_redonda":
      return <polygon points={`${x - 3},${y - 4} ${x + 3},${y - 4} ${x + 5},${y} ${x + 3},${y + 5} ${x - 3},${y + 5} ${x - 5},${y}`} fill={dentro} stroke={tinta} strokeWidth="1.6" />;
    case "preocupada":
      return <polygon points={`${x - 7},${y + 4} ${x - 3},${y - 1} ${x + 3},${y - 1} ${x + 7},${y + 4} ${x + 3},${y + 2} ${x - 3},${y + 2}`} fill={dentro} stroke={tinta} strokeWidth="1.6" />;
    case "pensando":
      return <polyline points={`${x - 6},${y + 2} ${x + 7},${y - 1}`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" />;
    case "habla_cerrada":
      return <polyline points={`${x - 7},${y} ${x},${y + 4} ${x + 7},${y}`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
    default:
      return <polyline points={`${x - 9},${y - 2} ${x - 4},${y + 3} ${x + 4},${y + 3} ${x + 9},${y - 2}`} fill="none" stroke={tinta} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
  }
}

/** Pelo: [atrás de la cabeza, adelante, facetas de luz]. Atrás va antes que la cabeza; adelante, después. */
const PELO: Record<Rol, { atras: string[]; adelante: string[]; luces: string[] }> = {
  nino: {
    atras: ["54,112 48,82 56,56 74,36 100,26 128,28 150,42 160,64 158,90 150,100 142,76 128,66 106,64 88,70 78,86 74,112"],
    adelante: ["72,98 64,74 72,50 94,36 122,36 144,48 154,68 152,82 140,72 126,64 108,62 92,68 82,80 80,100"],
    luces: ["72,50 94,36 104,38 86,50 76,62", "122,36 144,48 150,60 132,52", "56,84 60,66 66,72 62,94"],
  },
  ingeniera: {
    atras: ["60,150 52,118 52,84 62,58 84,40 112,34 138,42 154,60 160,90 158,120 152,146 140,150 142,118 140,90 132,70 110,62 90,68 80,88 78,120 74,146"],
    adelante: ["74,98 70,72 82,52 104,42 130,46 148,62 152,80 140,70 120,60 100,62 86,72 80,90"],
    luces: ["82,52 104,42 114,44 96,54 86,64", "62,96 66,74 72,90 68,118", "146,96 152,112 150,134 144,124"],
  },
  doctora: {
    atras: ["66,100 62,74 72,54 92,40 118,36 140,44 154,62 156,80 144,68 124,60 102,62 86,70 78,90 76,104", "44,122 46,104 58,94 72,98 76,114 68,130 54,132"],
    adelante: ["76,96 74,74 86,56 108,46 132,50 148,64 150,78 138,70 120,62 102,64 88,72 82,90"],
    luces: ["86,56 108,46 116,48 100,56 90,64", "48,108 58,98 64,104 52,114"],
  },
  meteorologa: {
    atras: ["64,108 60,78 68,56 88,40 114,34 138,40 154,54 158,72 150,86 140,74 124,66 104,66 88,74 80,92 76,110"],
    adelante: ["72,98 70,72 82,52 104,40 130,40 152,52 158,66 148,80 136,72 126,82 112,74 98,84 86,80 80,96"],
    luces: ["84,52 104,42 118,42 100,54 90,60", "130,42 152,52 156,62 138,56", "104,64 120,66 112,72"],
  },
};

const ACENTO: Record<Rol, string | null> = { nino: null, ingeniera: "naranja", doctora: "teal", meteorologa: "ciruela-traje" };

function Emblema({ rol }: { rol: Rol }) {
  if (rol === "ingeniera") return <polygon fill={v("naranja")} points="124,192 129,187 132,190 137,185 140,188 135,193 138,196 122,196" />;
  if (rol === "meteorologa") return (
    <g fill={v("ambar")}>
      <polygon points="126,180 132,180 136,184 136,190 132,194 126,194 122,190 122,184" />
      <polygon points="128,173 130,173 130,177 128,177" /><polygon points="128,197 130,197 130,200 128,200" />
      <polygon points="115,186 119,186 119,188 115,188" /><polygon points="139,186 143,186 143,188 139,188" />
      <polygon points="119,177 121,175 124,178 122,180" /><polygon points="136,194 138,192 141,195 139,197" />
      <polygon points="138,175 140,177 137,180 135,178" /><polygon points="121,197 119,195 122,192 124,194" />
    </g>
  );
  if (rol === "doctora") return <polygon fill={v("teal")} stroke={v("traje-marfil")} strokeWidth="1.5" points="134,176 142,179 141,188 134,194 127,188 126,179" />;
  return null;
}

function Humano({ persona, e, cerrar }: { persona: Rol; e: Expresion; cerrar: boolean }) {
  const piel = v(`piel-${persona}`);
  const pelo = v(`cabello-${persona}`);
  const pp = PELO[persona];
  const acento = ACENTO[persona];
  const cabeza = "80,62 104,52 130,56 144,74 146,104 136,126 116,138 98,138 84,128 76,108 74,84";
  return (
    <g>
      {/* Casco: disco lila detrás de todo (la cara conserva su color). */}
      <polygon fill={`color-mix(in srgb, ${v("lila")} 84%, ${v("ciruela-traje")})`} points="100,4 133,11 160,30 177,58 182,90 177,122 160,150 133,168 100,174 67,168 40,150 23,122 18,90 23,58 40,30 67,11" />
      <polygon fill={luz("lila", 20)} points="100,4 133,11 160,30 140,26 112,16 82,18 58,30 40,30 67,11" opacity="0.9" />

      {/* Mochila, traje, hombros y luz del pecho. */}
      <polygon fill={sombra("lila", 30)} points="14,168 46,160 50,200 12,200" />
      <polygon fill={luz("lila", 20)} points="14,168 46,160 40,166 18,172" />
      <polygon fill={v("traje-marfil")} points="36,174 62,160 140,160 166,174 176,200 26,200" />
      <polygon fill={sombra("traje-marfil", 14)} points="140,160 166,174 176,200 146,200 138,176" />
      {acento === "teal"
        ? <g fill={v("teal")}><polygon points="44,172 66,160 76,168 56,186" /><polygon points="128,160 160,172 156,186 120,170" /><polygon points="120,170 132,166 114,200 100,200" /></g>
        : acento && <g><polygon fill={v(acento)} points="30,182 62,162 74,180 66,200 34,200" /><polygon fill={sombra(acento, 18)} points="138,162 170,180 174,200 140,200 132,182" /><polygon fill={luz(acento, 25)} points="30,182 62,162 58,172 36,186" /></g>}
      {persona === "ingeniera" && <g fill={sombra("lila", 45)}><polygon points="74,166 80,164 88,200 82,200" /><polygon points="126,164 132,166 124,200 118,200" /></g>}
      <polygon fill={sombra("traje-marfil", 10)} points="92,174 112,174 120,182 120,194 112,202 92,202 84,194 84,182" />
      <polygon fill={v("cian")} points="95,178 109,178 115,184 115,192 109,198 95,198 89,192 89,184" />
      <polygon fill={luz("cian", 60)} points="95,179 104,179 98,185 92,189 91,184" />
      <Emblema rol={persona} />

      {/* Cuello: piel en sombra y aro teal con volumen (cara de arriba clara, frente más oscuro). */}
      <polygon fill={sombra(`piel-${persona}`, 30)} points="92,132 118,132 120,150 90,150" />
      <polygon fill={sombra("teal", 12)} points="46,152 72,160 128,160 154,152 154,164 128,172 72,172 46,164" />
      <polygon fill={luz("teal", 25)} points="46,152 72,144 128,144 154,152 128,160 72,160" />
      <polygon fill={sombra("teal", 40)} points="74,148 126,148 136,152 126,155 74,155 64,152" />

      {/* Pelo de atrás, cabeza con facetas, oreja, cara, pelo de adelante. */}
      {pp.atras.map((p) => <polygon key={p} fill={sombra(`cabello-${persona}`, 18)} points={p} />)}
      <polygon fill={piel} points={cabeza} />
      <polygon fill={luz(`piel-${persona}`, 14)} points="80,62 104,52 112,70 92,90 74,84" />
      <polygon fill={sombra(`piel-${persona}`, 16)} points="130,56 144,74 146,104 136,126 116,138 128,108 132,80" />
      <polygon fill={sombra(`piel-${persona}`, 10)} points="84,128 98,138 116,138 106,128 92,122" />
      <polygon fill={piel} points="64,92 76,86 80,108 70,114 62,104" />
      <polygon fill={sombra(`piel-${persona}`, 22)} points="68,96 74,94 75,106 70,108" />
      <polygon fill={sombra(`piel-${persona}`, 18)} points="116,104 121,104 119,111 114,111" />
      {pp.adelante.map((p) => <polygon key={p} fill={pelo} points={p} />)}
      {pp.luces.map((p) => <polygon key={p} fill={luz(`cabello-${persona}`, 30)} points={p} />)}
      <Cejas e={e} color={persona === "meteorologa" ? sombra("cabello-meteorologa", 45) : sombra(`cabello-${persona}`, 25)} />
      <Ojos e={e} cerrar={cerrar} />
      {persona === "doctora" && (
        <g fill="none" stroke={v("traje-marfil")} strokeWidth="4" strokeLinejoin="round">
          <polygon points="91,89 107,89 112,94 112,104 107,109 91,109 86,104 86,94" />
          <polygon points="117,89 133,89 137,94 137,104 133,109 117,109 113,104 113,94" />
          <polyline points="112,98 113,98" /><polyline points="86,96 76,94" />
        </g>
      )}
      <Boca e={e} />

      {/* Antena del casco, adelante y a la izquierda. */}
      <polygon fill={v("traje-marfil")} stroke={sombra("lila", 35)} strokeWidth="1.2" points="40,44 46,44 46,82 40,82" />
      <polygon fill={sombra("traje-marfil", 18)} points="44,44 46,44 46,82 44,82" />
      <polygon fill={v("traje-marfil")} stroke={sombra("lila", 35)} strokeWidth="1.2" points="34,76 52,76 54,80 54,100 50,104 36,104 32,100 32,80" />
      <polygon fill={sombra("traje-marfil", 18)} points="46,76 52,76 54,80 54,100 50,104 46,104" />
      <polygon fill={v("traje-marfil")} stroke={sombra("lila", 35)} strokeWidth="1.2" points="38,28 48,28 53,33 53,41 48,46 38,46 33,41 33,33" />
      <polygon fill={luz("traje-marfil", 60)} points="38,30 44,30 38,36 35,36" />

      {/* Vidrio: aro claro y brillo arriba a la izquierda, sin tapar la cara. */}
      <polygon fill="none" stroke={`color-mix(in srgb, ${v("lila")} 70%, ${v("ciruela-traje")})`} strokeWidth="3.5" strokeLinejoin="round" points="100,5 133,12 159,31 176,58 181,90 176,122 159,149 133,167 100,173 67,167 41,149 24,122 19,90 24,58 41,31 67,12" />
      <polygon fill={v("marfil")} opacity="0.4" points="58,24 84,14 70,28 52,44 40,62 42,42" />
    </g>
  );
}

function Iris({ e, cerrar, danada }: { e: Expresion; cerrar: boolean; danada: boolean }) {
  const ojo = danada ? v("error") : v("cian");
  const pantalla = v("indigo-texto");
  const ojos = [[82, 104], [118, 104]] as const;
  const cerrado = e === "parpadeo" || cerrar;
  return (
    <g>
      {/* Panel solar, antena, cuerpo con chaflanes, pantalla y ruedas (personajes/07, mundo/01). */}
      <polygon fill={v("indigo-botas")} points="40,34 160,34 168,48 32,48" />
      <g stroke={v("traje-marfil")} strokeWidth="1.5">{[60, 80, 100, 120, 140].map((x) => <polyline key={x} points={`${x},34 ${x + 2},48`} />)}</g>
      <polygon fill={v("traje-marfil")} points="146,14 150,14 150,34 146,34" />
      <polygon fill={v("traje-marfil")} points="144,6 152,6 155,10 152,14 144,14 141,10" />
      <polygon fill={v("traje-marfil")} stroke={mezcla("ciruela", "marfil", 30)} strokeWidth="2" points="40,56 160,56 172,68 172,150 160,162 40,162 28,150 28,68" />
      <polygon fill={pantalla} points="48,74 152,74 160,82 160,128 152,136 48,136 40,128 40,82" />
      {danada && <g stroke={v("error")} strokeOpacity="0.45" strokeWidth="2">{[86, 98, 116, 124].map((y) => <polyline key={y} points={`46,${y} 156,${y}`} />)}</g>}
      {ojos.map(([x, y], i) => {
        if (cerrado) return <polyline key={x} points={`${x - 9},${y} ${x + 9},${y}`} stroke={ojo} strokeWidth="4" strokeLinecap="round" />;
        if (danada && i === 1) return <g key={x} stroke={ojo} strokeWidth="4" strokeLinecap="round"><polyline points={`${x - 7},${y - 7} ${x + 7},${y + 7}`} /><polyline points={`${x + 7},${y - 7} ${x - 7},${y + 7}`} /></g>;
        if (e === "feliz" || e === "habla_abierta") return <polyline key={x} points={`${x - 9},${y + 3} ${x},${y - 6} ${x + 9},${y + 3}`} fill="none" stroke={ojo} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />;
        const inclina = e === "preocupada" ? (i === 0 ? -4 : 4) : 0;
        return <polygon key={x} fill={ojo} points={`${x - 7},${y - 9 + inclina} ${x + 7},${y - 9 - inclina} ${x + 9},${y + 7} ${x - 9},${y + 7}`} />;
      })}
      {e.startsWith("habla") && <polygon fill={ojo} points={e === "habla_redonda" ? "96,122 104,122 106,127 104,131 96,131 94,127" : e === "habla_abierta" ? "88,121 112,121 108,130 92,130" : "90,124 110,124 110,127 90,127"} />}
      <g fill={pantalla}>{[44, 156].map((x) => <polygon key={x} points={`${x - 16},150 ${x + 16},150 ${x + 20},162 ${x + 16},186 ${x - 16},186 ${x - 20},162`} />)}</g>
      <g fill={v("traje-marfil")}>{[44, 156].map((x) => <polygon key={x} points={`${x - 5},162 ${x + 5},162 ${x + 7},168 ${x + 5},174 ${x - 5},174 ${x - 7},168`} />)}</g>
    </g>
  );
}

/** Intervalos de parpadeo fijos (100 ms cada 4 a 7 s, APLICACION §7): sin azar. */
const PAUSAS = [4600, 6200, 5100, 6800, 4300];

/** Parpadeo automático: lo apaga el movimiento reducido y cuando la expresión ya es `parpadeo`. */
function useParpadeo(activo: boolean): boolean {
  const [cerrado, setCerrado] = useState(false);
  useEffect(() => {
    if (!activo || typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    let id: number;
    const ciclo = () => {
      id = window.setTimeout(() => {
        setCerrado(true);
        id = window.setTimeout(() => { setCerrado(false); i = (i + 1) % PAUSAS.length; ciclo(); }, 100);
      }, PAUSAS[i]);
    };
    ciclo();
    return () => window.clearTimeout(id);
  }, [activo]);
  return cerrado;
}

type PropsRetrato = {
  persona: Persona;
  expresion?: Expresion;
  /** Solo Iris: ojos con falla y pantalla con interferencia (está dañada por la radiación). */
  danada?: boolean;
  tam?: number;
  parpadear?: boolean;
  className?: string | undefined;
};

/** El retrato en SVG facetado: Iris siempre, y respaldo de los humanos si su imagen no carga. */
export function RetratoSvg({ persona, expresion = "neutral", danada = false, tam = 96, parpadear = false, className }: PropsRetrato) {
  const cerrado = useParpadeo(parpadear && expresion !== "parpadeo");
  return (
    <svg className={className} width={tam} height={tam} viewBox="0 0 200 200" aria-hidden="true" focusable="false" data-persona={persona} data-expresion={expresion}>
      {persona === "ia_base" ? <Iris e={expresion} cerrar={cerrado} danada={danada} /> : <Humano persona={persona} e={expresion} cerrar={cerrado} />}
    </svg>
  );
}

/** Anchos en los que `tests/capturas/retratos.mjs` escribe cada cara. */
export const ANCHOS_RETRATO = [160, 320] as const;

/** Ruta de una cara B dentro de `ui/public/` (con la base de Vite delante). */
export function rutaRetratoB(persona: Rol, e: Expresion, ancho: (typeof ANCHOS_RETRATO)[number]): string {
  return `${import.meta.env.BASE_URL}retratos/${persona}-${e}-${ancho}.webp`;
}
const srcSetB = (persona: Rol, e: Expresion) => ANCHOS_RETRATO.map((a) => `${rutaRetratoB(persona, e, a)} ${a}w`).join(", ");

export function Retrato({ persona, expresion = "neutral", danada = false, tam = 96, parpadear = false, className }: PropsRetrato) {
  const [falla, setFalla] = useState(false);
  const rol = persona === "ia_base" || falla ? null : persona;
  const cerrado = useParpadeo(rol !== null && parpadear && expresion !== "parpadeo");
  // La cara de parpadeo se baja antes, para que el primer parpadeo no quede en blanco.
  useEffect(() => {
    if (!rol || !parpadear || typeof Image === "undefined") return;
    const img = new Image();
    img.sizes = `${tam}px`;
    img.srcset = srcSetB(rol, "parpadeo");
  }, [rol, parpadear, tam]);
  if (!rol) return <RetratoSvg persona={persona} expresion={expresion} danada={danada} tam={tam} parpadear={parpadear} className={className} />;
  const e = cerrado ? "parpadeo" : expresion;
  return (
    <img className={`retrato-img${className ? ` ${className}` : ""}`} src={rutaRetratoB(rol, e, 320)} srcSet={srcSetB(rol, e)} sizes={`${tam}px`}
      width={tam} height={tam} alt="" aria-hidden="true" decoding="async" draggable={false} data-persona={persona} data-expresion={expresion}
      onError={() => setFalla(true)} />
  );
}
